
import { useState } from 'react';
import { Settings2, ChevronUp, Layers, Share2, Search } from 'lucide-react';
import './GraphControls.css';

export interface GraphSettings {
    layout: 'force' | 'timeline';
    showLabels: boolean;
    showMetrics: boolean;
    minStrength: number;
    maxNodes: number;
    searchText: string;
    selectedTypes: string[];
}

interface GraphControlsProps {
    settings: GraphSettings;
    onChange: (settings: GraphSettings) => void;
}

export function GraphControls({ settings, onChange }: GraphControlsProps) {
    const [collapsed, setCollapsed] = useState(false);

    const update = (key: keyof GraphSettings, value: any) => {
        onChange({ ...settings, [key]: value });
    };

    const toggleType = (type: string) => {
        const types = settings.selectedTypes || [];
        const newTypes = types.includes(type)
            ? types.filter(t => t !== type)
            : [...types, type];
        update('selectedTypes', newTypes);
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
                <label>Layout Mode</label>
                <div className="switch">
                    <button
                        className={settings.layout === 'force' ? 'active' : ''}
                        onClick={() => update('layout', 'force')}
                    >
                        <Share2 size={12} style={{ marginRight: 4 }} /> Network
                    </button>
                    <button
                        className={settings.layout === 'timeline' ? 'active' : ''}
                        onClick={() => update('layout', 'timeline')}
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
                        onChange={(e) => update('searchText', e.target.value)}
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
                    onChange={(e) => update('maxNodes', parseInt(e.target.value))}
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
                    onChange={(e) => update('minStrength', parseFloat(e.target.value))}
                />
            </div>

            <div className="control-item-row">
                <span>Show Labels</span>
                <input
                    type="checkbox"
                    checked={settings.showLabels}
                    onChange={(e) => update('showLabels', e.target.checked)}
                />
            </div>

            <div className="control-item-row">
                <span>Show Metrics</span>
                <input
                    type="checkbox"
                    checked={settings.showMetrics}
                    onChange={(e) => update('showMetrics', e.target.checked)}
                />
            </div>
        </div>
    );
}
