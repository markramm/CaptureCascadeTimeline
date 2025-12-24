
import { describe, it, expect } from 'vitest';
import { calculateDegreeCentrality, calculateBetweennessCentrality } from './graphMetrics';
import type { GraphNode, GraphLink } from './graphMetrics';

describe('Graph Metrics Utility', () => {
    // Helper to create simple graph
    // 1 - 2 - 3
    //     |
    //     4
    const nodes: GraphNode[] = [
        { id: '1', type: 'event', label: '1', x: 0, y: 0, vx: 0, vy: 0 },
        { id: '2', type: 'event', label: '2', x: 0, y: 0, vx: 0, vy: 0 },
        { id: '3', type: 'event', label: '3', x: 0, y: 0, vx: 0, vy: 0 },
        { id: '4', type: 'event', label: '4', x: 0, y: 0, vx: 0, vy: 0 }
    ];

    const links: GraphLink[] = [
        { source: '1', target: '2', type: 'test' },
        { source: '2', target: '3', type: 'test' },
        { source: '2', target: '4', type: 'test' }
    ];

    it('calculates degree centrality correctly', () => {
        const degree = calculateDegreeCentrality(nodes, links);

        expect(degree.get('1')).toBe(1);
        expect(degree.get('2')).toBe(3);
        expect(degree.get('3')).toBe(1);
        expect(degree.get('4')).toBe(1);
    });

    it('calculates betweenness centrality correctly', () => {
        const betweenness = calculateBetweennessCentrality(nodes, links);

        // Node 2 is the center of the star/hub, has highest betweenness
        // Paths: 1-2-3 (2 is bridge), 1-2-4 (2 is bridge), 3-2-4 (2 is bridge)
        // 1, 3, 4 are leaves, should have 0 betweenness

        expect(betweenness.get('2')).toBeGreaterThan(0);
        expect(betweenness.get('1')).toBe(0);
        expect(betweenness.get('3')).toBe(0);
        expect(betweenness.get('4')).toBe(0);
    });

    it('handles disconnected graph', () => {
        const disconnectedNodes: GraphNode[] = [
            { id: 'A', type: 'event', label: 'A', x: 0, y: 0, vx: 0, vy: 0 },
            { id: 'B', type: 'event', label: 'B', x: 0, y: 0, vx: 0, vy: 0 }
        ];
        const disconnectedLinks: GraphLink[] = [];

        const degree = calculateDegreeCentrality(disconnectedNodes, disconnectedLinks);
        expect(degree.get('A')).toBe(0);
        expect(degree.get('B')).toBe(0);

        const betweenness = calculateBetweennessCentrality(disconnectedNodes, disconnectedLinks);
        expect(betweenness.get('A')).toBe(0);
        expect(betweenness.get('B')).toBe(0);
    });
});
