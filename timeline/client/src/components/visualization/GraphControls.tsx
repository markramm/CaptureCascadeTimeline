import { useState } from 'react';
import { Settings2, ChevronUp, Download } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { ViewSwitcher } from './controls/ViewSwitcher';
import { LayoutControls } from './controls/LayoutControls';
import { FilterControls } from './controls/FilterControls';
import { MetricControls } from './controls/MetricControls';
import './GraphControls.css';

interface GraphControlsProps {
    onExport?: () => void;
}

export function GraphControls({ onExport }: GraphControlsProps) {
    const [collapsed, setCollapsed] = useState(false);

    // Store State
    const viewMode = useUIStore(s => s.viewMode);
    const layout = useUIStore(s => s.layout);
    const showLabels = useUIStore(s => s.showLabels);
    const showMetrics = useUIStore(s => s.showMetrics);
    const minStrength = useUIStore(s => s.minStrength);
    const maxNodes = useUIStore(s => s.maxNodes);
    const searchText = useUIStore(s => s.searchTerm);
    const selectedTypes = useUIStore(s => s.selectedTypes);

    // Store Actions
    const setViewMode = useUIStore(s => s.setViewMode);
    const setLayout = useUIStore(s => s.setLayout);
    const setSearchTerm = useUIStore(s => s.setSearchTerm);
    const setTypeFilter = useUIStore(s => s.setTypeFilter);
    const toggleLabels = useUIStore(s => s.toggleLabels);
    const toggleMetrics = useUIStore(s => s.toggleMetrics);
    const setMetric = useUIStore(s => s.setMetric);

    const updateMetric = (key: string, value: number | boolean) => {
        if (key === 'maxNodes') setMetric('maxNodes', value as number);
        if (key === 'minStrength') setMetric('minStrength', value as number);
        if (key === 'showLabels') toggleLabels();
        if (key === 'showMetrics') toggleMetrics();
    };

    const toggleType = (type: string) => {
        const types = selectedTypes || [];
        const newTypes = types.includes(type)
            ? types.filter(t => t !== type)
            : [...types, type];
        setTypeFilter(newTypes);
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
                viewMode={viewMode}
                onChange={setViewMode}
            />

            <LayoutControls
                layout={layout}
                onChange={setLayout}
            />

            <FilterControls
                searchText={searchText}
                selectedTypes={selectedTypes}
                onSearchChange={setSearchTerm}
                onTypeToggle={toggleType}
            />

            <MetricControls
                maxNodes={maxNodes}
                minStrength={minStrength}
                showLabels={showLabels}
                showMetrics={showMetrics}
                onUpdate={updateMetric}
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
