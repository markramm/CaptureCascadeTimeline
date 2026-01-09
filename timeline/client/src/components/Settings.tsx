import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Github, Database, RefreshCw, Check, AlertTriangle, Link, GitFork } from 'lucide-react';
import { getGitConfig, saveGitConfig, syncToGitHub } from '../services/gitService';
import { getConfig, saveConfig, clearConfig } from '../config/timeline';
import { validateTimelineUrl } from '../services/dataService';
import { syncEvents } from '../db/loader';
import { db } from '../db';

interface GitHubForm {
    token: string;
    owner: string;
    repo: string;
    path: string;
}

interface TimelineSourceForm {
    dataUrl: string;
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

export function Settings() {
    // GitHub form
    const { register: registerGit, handleSubmit: handleSubmitGit, setValue: setGitValue } = useForm<GitHubForm>();

    // Timeline source form
    const { register: registerSource, handleSubmit: handleSubmitSource, setValue: setSourceValue, watch } = useForm<TimelineSourceForm>();
    const watchedUrl = watch('dataUrl');

    const [status, setStatus] = useState<'idle' | 'saving' | 'syncing' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    // Timeline validation state
    const [urlValidation, setUrlValidation] = useState<ValidationState>('idle');
    const [urlValidationResult, setUrlValidationResult] = useState<{ eventCount?: number; schemaVersion?: string; error?: string } | null>(null);

    // Current timeline info
    const [currentTimeline, setCurrentTimeline] = useState<{ url: string; name: string; eventCount: number } | null>(null);

    // Load existing configs
    useEffect(() => {
        const gitConfig = getGitConfig();
        if (gitConfig) {
            setGitValue('token', gitConfig.token);
            setGitValue('owner', gitConfig.owner);
            setGitValue('repo', gitConfig.repo);
            setGitValue('path', gitConfig.path);
        } else {
            setGitValue('path', 'timeline.json');
        }

        const timelineConfig = getConfig();
        setSourceValue('dataUrl', timelineConfig.dataUrl);

        // Get current event count
        db.events.count().then(count => {
            setCurrentTimeline({
                url: timelineConfig.dataUrl,
                name: timelineConfig.name,
                eventCount: count
            });
        });
    }, [setGitValue, setSourceValue]);

    // GitHub form submission
    const onSubmitGit = (data: GitHubForm) => {
        saveGitConfig(data);
        setStatus('success');
        setMsg('GitHub configuration saved!');
        setTimeout(() => setStatus('idle'), 2000);
    };

    // Sync to GitHub
    const handleSync = async () => {
        setStatus('syncing');
        try {
            const events = await db.events.toArray();
            const result = await syncToGitHub(events, `Sync from Timeline UTC at ${new Date().toISOString()}`);
            setStatus('success');
            setMsg(`Synced ${events.length} events! SHA: ${result.sha.substring(0, 7)}`);
        } catch (e: unknown) {
            const err = e as Error;
            console.error(err);
            setStatus('error');
            setMsg(`Sync failed: ${err.message}`);
        }
    };

    // Validate timeline URL
    const handleValidateUrl = async () => {
        if (!watchedUrl) return;

        setUrlValidation('validating');
        setUrlValidationResult(null);

        const result = await validateTimelineUrl(watchedUrl);
        setUrlValidationResult(result);
        setUrlValidation(result.valid ? 'valid' : 'invalid');
    };

    // Switch timeline source
    const onSubmitSource = async (data: TimelineSourceForm) => {
        if (urlValidation !== 'valid') {
            setMsg('Please validate the URL first');
            setStatus('error');
            return;
        }

        setStatus('syncing');
        setMsg('Switching timeline source...');

        try {
            // Save new config
            saveConfig({ dataUrl: data.dataUrl });

            // Clear existing events and re-sync
            await db.events.clear();
            const result = await syncEvents(true);

            setCurrentTimeline({
                url: data.dataUrl,
                name: 'Timeline',
                eventCount: result.count
            });

            setStatus('success');
            setMsg(`Loaded ${result.count} events from new source!`);

            // Reload page to refresh all views
            setTimeout(() => window.location.reload(), 1500);
        } catch (e: unknown) {
            const err = e as Error;
            console.error(err);
            setStatus('error');
            setMsg(`Failed to switch source: ${err.message}`);
        }
    };

    // Reset to default
    const handleResetSource = async () => {
        clearConfig();
        setSourceValue('dataUrl', '/api/timeline.json');
        setUrlValidation('idle');
        setUrlValidationResult(null);

        // Re-sync from default
        await db.events.clear();
        const result = await syncEvents(true);

        setCurrentTimeline({
            url: '/api/timeline.json',
            name: 'Local Timeline',
            eventCount: result.count
        });

        setStatus('success');
        setMsg('Reset to default timeline source');
        setTimeout(() => window.location.reload(), 1500);
    };

    const inputStyle = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' };
    const cardStyle = { padding: '20px', display: 'flex', flexDirection: 'column' as const, gap: '15px', marginBottom: '20px' };

    return (
        <div className="container" style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={24} /> Settings
            </h2>

            {/* Current Timeline Info */}
            {currentTimeline && (
                <div className="card" style={{ ...cardStyle, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={18} /> Current Timeline
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                        <div>
                            <strong>Source:</strong>
                            <div style={{ color: '#666', wordBreak: 'break-all' }}>{currentTimeline.url}</div>
                        </div>
                        <div>
                            <strong>Events Loaded:</strong>
                            <div style={{ color: '#666' }}>{currentTimeline.eventCount.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline Source Configuration */}
            <form onSubmit={handleSubmitSource(onSubmitSource)} className="card" style={cardStyle}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link size={18} /> Timeline Source
                </h3>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                    Load timeline data from any GitHub repository or URL.
                    Use a raw GitHub URL like: <code>https://raw.githubusercontent.com/user/repo/main/timeline.json</code>
                </p>

                <div className="form-group">
                    <label>Timeline Data URL</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            {...registerSource('dataUrl')}
                            placeholder="https://raw.githubusercontent.com/..."
                            style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                            type="button"
                            onClick={handleValidateUrl}
                            disabled={urlValidation === 'validating'}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                background: urlValidation === 'validating' ? '#f3f4f6' : 'white',
                                cursor: urlValidation === 'validating' ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            {urlValidation === 'validating' ? (
                                <><RefreshCw size={14} className="animate-spin" /> Checking...</>
                            ) : (
                                <>Check</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Validation Result */}
                {urlValidationResult && (
                    <div style={{
                        padding: '12px',
                        borderRadius: '6px',
                        background: urlValidation === 'valid' ? '#dcfce7' : '#fee2e2',
                        color: urlValidation === 'valid' ? '#166534' : '#991b1b',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                    }}>
                        {urlValidation === 'valid' ? <Check size={18} /> : <AlertTriangle size={18} />}
                        <div>
                            {urlValidation === 'valid' ? (
                                <>
                                    <strong>Valid timeline found!</strong>
                                    <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                                        {urlValidationResult.eventCount?.toLocaleString()} events
                                        {urlValidationResult.schemaVersion && ` (schema v${urlValidationResult.schemaVersion})`}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <strong>Invalid URL</strong>
                                    <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{urlValidationResult.error}</div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div className="actions" style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="submit"
                        disabled={urlValidation !== 'valid' || status === 'syncing'}
                        className="btn btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            opacity: urlValidation !== 'valid' ? 0.5 : 1
                        }}
                    >
                        <RefreshCw size={16} /> Switch Source
                    </button>
                    <button
                        type="button"
                        onClick={handleResetSource}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            background: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Reset to Default
                    </button>
                </div>
            </form>

            {/* GitHub Persistence */}
            <form onSubmit={handleSubmitGit(onSubmitGit)} className="card" style={cardStyle}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Github size={18} /> GitHub Sync
                </h3>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                    Save your timeline changes to a GitHub repository.
                    Requires a <strong>Personal Access Token</strong> with <code>repo</code> scope.
                </p>

                <div className="form-group">
                    <label>Personal Access Token</label>
                    <input {...registerGit('token')} type="password" placeholder="ghp_..." style={inputStyle} />
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Owner (User/Org)</label>
                        <input {...registerGit('owner')} placeholder="octocat" style={inputStyle} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Repository</label>
                        <input {...registerGit('repo')} placeholder="my-timeline" style={inputStyle} />
                    </div>
                </div>

                <div className="form-group">
                    <label>File Path</label>
                    <input {...registerGit('path')} placeholder="data/timeline.json" style={inputStyle} />
                </div>

                <div className="actions" style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Save size={16} /> Save Config
                    </button>

                    <button
                        type="button"
                        onClick={handleSync}
                        disabled={status === 'syncing'}
                        className="btn"
                        style={{ background: '#24292f', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <Github size={16} /> {status === 'syncing' ? 'Syncing...' : 'Push to GitHub'}
                    </button>
                </div>
            </form>

            {/* Fork Instructions */}
            <div className="card" style={{ ...cardStyle, background: '#fefce8', border: '1px solid #fef08a' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitFork size={18} /> Create Your Own Timeline
                </h3>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                    Want to start your own timeline? Fork the repository on GitHub and point this viewer to your fork.
                </p>
                <ol style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '0.9rem' }}>
                    <li>Fork the timeline repository on GitHub</li>
                    <li>Copy the raw URL of your <code>timeline.json</code> file</li>
                    <li>Paste it in the Timeline Source section above</li>
                    <li>Configure GitHub Sync to push changes back to your fork</li>
                </ol>
            </div>

            {/* Status Message */}
            {msg && (
                <div style={{
                    marginTop: '10px',
                    padding: '12px',
                    borderRadius: '6px',
                    background: status === 'error' ? '#fee2e2' : '#dcfce7',
                    color: status === 'error' ? '#991b1b' : '#166534'
                }}>
                    {msg}
                </div>
            )}
        </div>
    );
}
