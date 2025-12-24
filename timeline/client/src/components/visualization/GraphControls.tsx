import { useState } from 'react';
import type { GraphSettings } from '../../types/visualization';
import { Search, Filter, Sliders, Settings as SettingsIcon, Layout, Grid, Activity, BarChart2, Download, Settings2, ChevronUp, Share2, Layers } from 'lucide-react';
import './GraphControls.css';

interface GraphControlsProps {
    settings: GraphSettings;
    onChange: (settings: GraphSettings) => void;
    onExport?: () => void;
}

export function GraphControls({ settings, onChange, onExport }: GraphControlsProps) {
    const [collapsed, setCollapsed] = useState(false);

    const updateSetting = <K extends keyof GraphSettings>(key: K, value: GraphSettings[K]) => {
        onChange({ ...settings, [key]: value });
    };

    const toggleType = (type: string) => {
        const types = settings.selectedTypes || [];
        const newTypes = types.includes(type)
            ? types.filter(t => t !== type)
            : [...types, type];
        updateSetting('selectedTypes', newTypes);
    };

    // All available types from schema
    const EVENT_TYPES = ['legislative', 'judicial', 'financial', 'corporate', 'political', 'cultural'];

    if (collapsed) {
        return (
            <div className="graph-controls collapsed">
                <button className="toggle-btn" onClick={() => setCollapsed(false)}>
                    <Settings2 size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="graph-controls">
            <div className="controls-header">
                <h3><Settings2 size={16} /> Graph Controls</h3>
                <button className="toggle-btn" onClick={() => setCollapsed(true)}>
                    <ChevronUp size={16} />
                </button>
            </div>

            <div className="control-group">
                <label>View Mode</label>
                <div className="switch">
                    <button
                        className={settings.viewMode === 'graph' ? 'active' : ''}
                        onClick={() => updateSetting('viewMode', 'graph')}
                    >
                        Graph
                    </button>
                    <button
                        className={settings.viewMode === 'matrix' ? 'active' : ''}
                        onClick={() => updateSetting('viewMode', 'matrix')}
                    >
                        Matrix
                    </button>
                    <button
                        className={settings.viewMode === 'sunburst' ? 'active' : ''}
                        onClick={() => updateSetting('viewMode', 'sunburst')}
                    >
                        Hierarchy
                    </button>
                    <button
                        className={settings.viewMode === 'heatmap' ? 'active' : ''}
                        onClick={() => updateSetting('viewMode', 'heatmap')}
                    >
                        Hotspots
                    </button>
                    <button
                        className={settings.viewMode === 'patterns' ? 'active' : ''}
                        onClick={() => updateSetting('viewMode', 'patterns')}
                    >
                        Patterns
                    </button>
                </div>
            </div>

            <div className="control-group">
                <label>Layout Mode</label>
                <div className="switch">
                    <button
                        className={settings.layout === 'force' ? 'active' : ''}
                        onClick={() => updateSetting('layout', 'force')}
                    >
                        <Share2 size={12} style={{ marginRight: 4 }} /> Network
                    </button>
                    <button
                        className={settings.layout === 'timeline' ? 'active' : ''}
                        onClick={() => updateSetting('layout', 'timeline')}
                    >
                        <Layers size={12} style={{ marginRight: 4 }} /> Timeline
                    </button>
                </div>
            </div>

            <div className="control-group">
                <label>Search Filters</label>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search entities, tags..."
                        value={settings.searchText || ''}
                        onChange={(e) => updateSetting('searchText', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '6px 8px 6px 28px',
                            borderRadius: '6px',
                            border: '1px solid #334155',
                            background: '#1e293b',
                            color: '#e2e8f0',
                            fontSize: '0.85rem'
                        }}
                    />
                </div>

                <div className="type-toggles" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {EVENT_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => toggleType(type)}
                            style={{
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                border: '1px solid',
                                cursor: 'pointer',
                                background: settings.selectedTypes?.includes(type) ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                borderColor: settings.selectedTypes?.includes(type) ? '#3b82f6' : '#475569',
                                color: settings.selectedTypes?.includes(type) ? '#93c5fd' : '#64748b',
                                transition: 'all 0.2s'
                            }}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="control-group">
                <label>
                    Max Nodes
                    <span>{settings.maxNodes}</span>
                </label>
                <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={settings.maxNodes}
                    onChange={(e) => updateSetting('maxNodes', parseInt(e.target.value))}
                />
            </div>

            <div className="control-group">
                <label>
                    Min Link Strength
                    <span>{(settings.minStrength * 100).toFixed(0)}%</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.minStrength}
                    onChange={(e) => updateSetting('minStrength', parseFloat(e.target.value))}
                />
            </div>

            <div className="control-group checkbox">
                <label>Show Labels</label>
                <input
                    type="checkbox"
                    checked={settings.showLabels}
                    onChange={(e) => updateSetting('showLabels', e.target.checked)}
                />
            </div>

            <div className="control-group checkbox">
                <label>Show Metrics</label>
                <input
                    type="checkbox"
                    checked={settings.showMetrics}
                    onChange={(e) => updateSetting('showMetrics', e.target.checked)}
                />
            </div>

            {onExport && (
                <div className="control-group" style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #334155' }}>
                    <button
                        onClick={onExport}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: '#334155',
                            color: '#e2e8f0',
                            border: '1px solid #475569',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.9em'
                        }}
                    >
                        <Download size={14} /> Export Graph (GEXF)
                    </button>
                </div>
            )}
        </div>
    );
}
