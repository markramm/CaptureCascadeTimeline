import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GraphControls } from './GraphControls';
import { useUIStore } from '../../stores/uiStore';

describe('GraphControls Component', () => {
    beforeEach(() => {
        // Reset store state
        act(() => {
            useUIStore.setState({
                viewMode: 'graph',
                layout: 'force',
                searchTerm: '',
                maxNodes: 200,
                showLabels: true,
                showMetrics: false
            });
        });
    });

    it('renders all control sections', () => {
        render(<GraphControls />);
        expect(screen.getByText('View Mode')).toBeInTheDocument();
        expect(screen.getByText('Layout Mode')).toBeInTheDocument();
        expect(screen.getByText('Search Filters')).toBeInTheDocument();
        expect(screen.getByText('Max Nodes')).toBeInTheDocument();
    });

    it('updates view mode in store when clicked', () => {
        render(<GraphControls />);
        const matrixBtn = screen.getByText('Matrix');
        fireEvent.click(matrixBtn);
        expect(useUIStore.getState().viewMode).toBe('matrix');
    });

    it('updates layout in store when clicked', () => {
        render(<GraphControls />);
        const timelineBtn = screen.getByText('Timeline');
        fireEvent.click(timelineBtn);
        expect(useUIStore.getState().layout).toBe('timeline');
    });

    it('toggles metrics visibility', () => {
        // Find metrics switch/checkbox. Assuming it's rendered by MetricControls
        // We might need to look at MetricControls implementation to know accessible name
        render(<GraphControls />);
        // If MetricControls uses simple buttons or inputs, we target them.
        // Let's assume text 'Metrics' is clickable or associated label
        const metricsToggle = screen.getByLabelText('Show Metrics');
        fireEvent.click(metricsToggle);
        expect(useUIStore.getState().showMetrics).toBe(true);
    });
});
