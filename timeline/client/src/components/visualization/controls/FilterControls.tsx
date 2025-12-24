
import React from 'react';
import { Search } from 'lucide-react';

interface FilterControlsProps {
    searchText: string;
    selectedTypes: string[];
    onSearchChange: (text: string) => void;
    onTypeToggle: (type: string) => void;
}

const EVENT_TYPES = ['legislative', 'judicial', 'financial', 'corporate', 'political', 'cultural'];

export const FilterControls: React.FC<FilterControlsProps> = ({ searchText, selectedTypes, onSearchChange, onTypeToggle }) => {
    return (
        <div className="control-group">
            <label>Search Filters</label>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
                <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: '#94a3b8' }} />
                <input
                    type="text"
                    placeholder="Search entities, tags..."
                    value={searchText || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
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
                        onClick={() => onTypeToggle(type)}
                        style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            border: '1px solid',
                            cursor: 'pointer',
                            background: selectedTypes?.includes(type) ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            borderColor: selectedTypes?.includes(type) ? '#3b82f6' : '#475569',
                            color: selectedTypes?.includes(type) ? '#93c5fd' : '#64748b',
                            transition: 'all 0.2s'
                        }}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );
};
