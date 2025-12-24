
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphControls } from './GraphControls';
import type { GraphSettings } from '../../types/visualization';

const defaultSettings: GraphSettings = {
    layout: 'force',
    showLabels: true,
    showMetrics: false,
    minStrength: 0.5,
    maxNodes: 50,
    searchText: '',
    selectedTypes: [],
    viewMode: 'graph'
};

describe('GraphControls Component', () => {
    it('renders all control sections', () => {
        render(<GraphControls settings={defaultSettings} onChange={() => { }} />);
        expect(screen.getByText('View Mode')).toBeInTheDocument();
        expect(screen.getByText('Layout Mode')).toBeInTheDocument();
        expect(screen.getByText('Search Filters')).toBeInTheDocument();
        expect(screen.getByText('Max Nodes')).toBeInTheDocument();
    });

    it('toggles collapse state', () => {
        render(<GraphControls settings={defaultSettings} onChange={() => { }} />);
        const toggleBtn = screen.getAllByRole('button')[0]; // First button is usually toggle in header
        fireEvent.click(toggleBtn);
        // Should be collapsed, header text might be hidden or replaced
        // If specific class isApplied to container, we could check that, but for now check if main controls are hidden
        // In collapsed mode, we expect basic icon button
        expect(screen.queryByText('View Mode')).not.toBeInTheDocument();
    });

    it('calls onChange when settings are updated', () => {
        const handleChange = vi.fn();
        render(<GraphControls settings={defaultSettings} onChange={handleChange} />);

        const matrixBtn = screen.getByText('Matrix');
        fireEvent.click(matrixBtn);

        expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
            viewMode: 'matrix'
        }));
    });
});
