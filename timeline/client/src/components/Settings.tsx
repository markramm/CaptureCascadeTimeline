
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Github } from 'lucide-react';
import { getGitConfig, saveGitConfig, syncToGitHub } from '../services/gitService';
import { db } from '../db';

interface SettingsForm {
    token: string;
    owner: string;
    repo: string;
    path: string;
}

export function Settings() {
    const { register, handleSubmit, setValue } = useForm<SettingsForm>();
    const [status, setStatus] = useState<'idle' | 'saving' | 'syncing' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const config = getGitConfig();
        if (config) {
            setValue('token', config.token);
            setValue('owner', config.owner);
            setValue('repo', config.repo);
            setValue('path', config.path);
        } else {
            setValue('path', 'timeline.json'); // Default
        }
    }, [setValue]);

    const onSubmit = (data: SettingsForm) => {
        saveGitConfig(data);
        setStatus('success');
        setMsg('Configuration saved!');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleSync = async () => {
        setStatus('syncing');
        try {
            const events = await db.events.toArray();
            const result = await syncToGitHub(events, `Sync from UTC at ${new Date().toISOString()}`);
            setStatus('success');
            setMsg(`Synced successfully! SHA: ${result.sha.substring(0, 7)}`);
        } catch (e: unknown) {
            const err = e as Error;
            console.error(err);
            setStatus('error');
            setMsg(`Sync failed: ${err.message}`);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2><Github style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Settings</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>GitHub Persistence</h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    Configure a GitHub repository to save your timeline data.
                    You will need a <strong>Personal Access Token</strong> with `repo` scope.
                </p>

                <div className="form-group">
                    <label>Personal Access Token</label>
                    <input {...register('token')} type="password" placeholder="ghp_..." style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Owner (User/Org)</label>
                        <input {...register('owner')} placeholder="octocat" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Repository</label>
                        <input {...register('repo')} placeholder="my-timeline" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>
                </div>

                <div className="form-group">
                    <label>File Path</label>
                    <input {...register('path')} placeholder="data/timeline.json" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>

                <div className="actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Save size={16} /> Save Config
                    </button>

                    <button type="button" onClick={handleSync} className="btn" style={{ background: '#24292f', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Github size={16} /> Test Sync
                    </button>
                </div>

                {msg && (
                    <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        borderRadius: '4px',
                        background: status === 'error' ? '#fee2e2' : '#dcfce7',
                        color: status === 'error' ? '#991b1b' : '#166534'
                    }}>
                        {msg}
                    </div>
                )}
            </form>
        </div>
    );
}
