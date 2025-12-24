
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetworkGraph } from './NetworkGraph';

// Mock dependencies
vi.mock('../../hooks/useResizeObserver', () => ({
    useResizeObserver: () => ({ width: 800, height: 600 }) // Mock dimensions
}));

vi.mock('dexie-react-hooks', () => ({
    useLiveQuery: () => [] // Return empty events array
}));

// Mock useGraphData to return simple structure
vi.mock('../../hooks/useGraphData', () => ({
    useGraphData: () => ({
        nodes: [
            { id: '1', label: 'Node 1', type: 'event', group: 'legislative', x: 100, y: 100 },
            { id: '2', label: 'Node 2', type: 'event', group: 'executive', x: 200, y: 200 }
        ],
        links: [
            { source: '1', target: '2', strength: 1 }
        ]
    })
}));

// Mock d3 if necessary (though we want to test d3 integration usually, 
// but force simulation might need mocking if it uses timers/workers irrelevant to renders)
// For now, let's see if it renders without deep d3 mocking.

describe('NetworkGraph Component', () => {
    it('renders without crashing', () => {
        const { container } = render(<NetworkGraph />);
        // Title is not rendered by default if not provided
        expect(container.querySelector('.network-graph-container')).toBeInTheDocument();
        // Should have SVG
        expect(container.querySelector('svg')).toBeInTheDocument();
        // Should have nodes (circles)
        expect(container.querySelectorAll('circle').length).toBeGreaterThan(0);
        // Should have links (lines)
        expect(container.querySelectorAll('line').length).toBeGreaterThan(0);
    });

    it('displays title when provided', () => {
        render(<NetworkGraph title="Test Title" />);
        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('shows controls', () => {
        render(<NetworkGraph />);
        // "Graph Controls" text is in the header of controls
        expect(screen.getByText(/Graph Controls/i)).toBeInTheDocument();
    });
});
