import React from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import TimelineMinimap from './TimelineMinimap';

const TimelineControls = ({
    timelineControls,
    onTimelineControlsChange,
    timelineData,
    isOpen,
    onToggle
}) => {
    if (!timelineControls) return null;

    return (
        <div className="filter-section">
            <button
                className="section-header"
                onClick={onToggle}
            >
                <div className="header-title">
                    <Settings size={16} />
                    <span>Timeline View</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="section-content">
                    <div className="control-group">
                        <label>Display Mode</label>
                        <select
                            value={timelineControls.compactMode}
                            onChange={(e) => onTimelineControlsChange({
                                ...timelineControls,
                                compactMode: e.target.value
                            })}
                            className="timeline-select"
                        >
                            <option value="none">Expand All</option>
                            <option value="low">Compact Low Importance</option>
                            <option value="medium">Compact Medium & Low</option>
                            <option value="all">Compact All</option>
                        </select>
                    </div>


                    <div className="control-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={timelineControls.showMinimap}
                                onChange={(e) => onTimelineControlsChange({
                                    ...timelineControls,
                                    showMinimap: e.target.checked
                                })}
                            />
                            <span>Show Minimap</span>
                        </label>
                    </div>

                    {timelineControls.showMinimap && timelineData && (
                        <div className="minimap-container">
                            <TimelineMinimap
                                events={timelineData.events}
                                groups={timelineData.groups}
                                onNavigate={timelineData.onNavigate}
                                onDateRangeSelect={timelineData.onDateRangeSelect}
                                currentDateRange={timelineData.currentDateRange}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TimelineControls;
