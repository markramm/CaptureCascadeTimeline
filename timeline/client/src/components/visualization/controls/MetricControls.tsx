
import React from 'react';
import type { GraphSettings } from '../../../types/visualization';

interface MetricControlsProps {
    maxNodes: number;
    minStrength: number;
    showLabels: boolean;
    showMetrics: boolean;
    onUpdate: <K extends keyof GraphSettings>(key: K, value: GraphSettings[K]) => void;
}

export const MetricControls: React.FC<MetricControlsProps> = ({ maxNodes, minStrength, showLabels, showMetrics, onUpdate }) => {
    return (
        <>
            <div className="control-group">
                <label>
                    Max Nodes
                    <span>{maxNodes}</span>
                </label>
                <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={maxNodes}
                    onChange={(e) => onUpdate('maxNodes', parseInt(e.target.value))}
                />
            </div>

            <div className="control-group">
                <label>
                    Min Link Strength
                    <span>{(minStrength * 100).toFixed(0)}%</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={minStrength}
                    onChange={(e) => onUpdate('minStrength', parseFloat(e.target.value))}
                />
            </div>

            <div className="control-group checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={showLabels}
                        onChange={(e) => onUpdate('showLabels', e.target.checked)}
                    />
                    Show Labels
                </label>
            </div>

            <div className="control-group checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={showMetrics}
                        onChange={(e) => onUpdate('showMetrics', e.target.checked)}
                    />
                    Show Metrics
                </label>
            </div>
        </>
    );
};
