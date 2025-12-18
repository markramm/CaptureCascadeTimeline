import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';

const GraphControls = ({
    graphControls,
    onGraphControlsChange,
    isOpen,
    onToggle
}) => {
    if (typeof onGraphControlsChange !== 'function' || typeof graphControls === 'undefined') {
        return null;
    }

    return (
        <div className="filter-section">
            <button
                className="section-header"
                onClick={onToggle}
            >
                <div className="header-title">
                    <Settings size={16} />
                    <span>Graph Appearance</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="section-content">
                    <div className="control-group">
                        <label className="control-label" htmlFor="layout-select">Layout Style</label>
                        <select
                            id="layout-select"
                            value={graphControls.layout}
                            onChange={(e) => onGraphControlsChange({
                                ...graphControls,
                                layout: e.target.value
                            })}
                            className="timeline-select"
                        >
                            <option value="force">Force Directed (Organic)</option>
                            <option value="timeline">Time Axis (Chronological)</option>
                            <option value="circular">Circular (Grouped)</option>
                            <option value="grid">Grid (Structured)</option>
                        </select>
                    </div>

                    <div className="control-divider"></div>

                    <div className="control-group">
                        <div className="range-header">
                            <label htmlFor="max-nodes-input">Max Nodes</label>
                            <span className="range-value">{graphControls.maxNodes}</span>
                        </div>
                        <input
                            id="max-nodes-input"
                            type="range"
                            min="50"
                            max="500"
                            step="10"
                            value={graphControls.maxNodes}
                            onChange={(e) => onGraphControlsChange({
                                ...graphControls,
                                maxNodes: Number(e.target.value)
                            })}
                            className="timeline-range"
                        />
                    </div>

                    <div className="control-group">
                        <div className="range-header">
                            <label htmlFor="connection-density-input">Connection Density</label>
                            <span className="range-value">{Math.round(graphControls.connectionStrength * 100)}%</span>
                        </div>
                        <input
                            id="connection-density-input"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={graphControls.connectionStrength}
                            onChange={(e) => onGraphControlsChange({
                                ...graphControls,
                                connectionStrength: parseFloat(e.target.value)
                            })}
                            className="timeline-range"
                        />
                    </div>

                    <div className="control-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={graphControls.showLabels}
                                onChange={(e) => onGraphControlsChange({
                                    ...graphControls,
                                    showLabels: e.target.checked
                                })}
                            />
                            <span>Show Labels</span>
                        </label>
                    </div>

                    <div className="control-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={graphControls.showMetrics}
                                onChange={(e) => onGraphControlsChange({
                                    ...graphControls,
                                    showMetrics: e.target.checked
                                })}
                            />
                            <span>Show Analytics Overlay</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphControls;
