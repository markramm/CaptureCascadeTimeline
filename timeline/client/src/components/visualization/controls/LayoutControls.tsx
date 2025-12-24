
import React from 'react';
import { Share2, Layers } from 'lucide-react';
import type { GraphSettings } from '../../../types/visualization';

interface LayoutControlsProps {
    layout: GraphSettings['layout'];
    onChange: (layout: GraphSettings['layout']) => void;
}

export const LayoutControls: React.FC<LayoutControlsProps> = ({ layout, onChange }) => {
    return (
        <div className="control-group">
            <label>Layout Mode</label>
            <div className="switch">
                <button
                    className={layout === 'force' ? 'active' : ''}
                    onClick={() => onChange('force')}
                >
                    <Share2 size={12} style={{ marginRight: 4 }} /> Network
                </button>
                <button
                    className={layout === 'timeline' ? 'active' : ''}
                    onClick={() => onChange('timeline')}
                >
                    <Layers size={12} style={{ marginRight: 4 }} /> Timeline
                </button>
            </div>
        </div>
    );
};
