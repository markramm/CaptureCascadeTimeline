
import React from 'react';
import type { GraphSettings } from '../../../types/visualization';

interface ViewSwitcherProps {
    viewMode: GraphSettings['viewMode'];
    onChange: (mode: GraphSettings['viewMode']) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, onChange }) => {
    const modes: { id: GraphSettings['viewMode']; label: string }[] = [
        { id: 'graph', label: 'Graph' },
        { id: 'matrix', label: 'Matrix' },
        { id: 'sunburst', label: 'Hierarchy' },
        { id: 'heatmap', label: 'Hotspots' },
        { id: 'patterns', label: 'Patterns' }
    ];

    return (
        <div className="control-group">
            <label>View Mode</label>
            <div className="switch">
                {modes.map(mode => (
                    <button
                        key={mode.id}
                        className={viewMode === mode.id ? 'active' : ''}
                        onClick={() => onChange(mode.id)}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
