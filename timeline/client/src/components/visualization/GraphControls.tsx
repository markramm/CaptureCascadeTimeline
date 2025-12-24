import { useState } from 'react';
import type { GraphSettings } from '../../types/visualization';
import { Settings2, ChevronUp, Download } from 'lucide-react';
import { ViewSwitcher } from './controls/ViewSwitcher';
import { LayoutControls } from './controls/LayoutControls';
import { FilterControls } from './controls/FilterControls';
import { MetricControls } from './controls/MetricControls';
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

            <ViewSwitcher
                viewMode={settings.viewMode}
                onChange={(mode) => updateSetting('viewMode', mode)}
            />

            <LayoutControls
                layout={settings.layout}
                onChange={(layout) => updateSetting('layout', layout)}
            />

            <FilterControls
                searchText={settings.searchText}
                selectedTypes={settings.selectedTypes}
                onSearchChange={(text) => updateSetting('searchText', text)}
                onTypeToggle={toggleType}
            />

            <MetricControls
                maxNodes={settings.maxNodes}
                minStrength={settings.minStrength}
                showLabels={settings.showLabels}
                showMetrics={settings.showMetrics}
                onUpdate={updateSetting}
            />

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
