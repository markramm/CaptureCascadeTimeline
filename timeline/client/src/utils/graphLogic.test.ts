
import { describe, it, expect } from 'vitest';
import { computeGraphData } from './graphLogic';
import type { TimelineEvent } from '../schemas/events';

const mockEvents: TimelineEvent[] = [
    {
        id: '1', title: 'Event One', date: '2023-01-01', type: 'political',
        tags: ['tagA'], summary: 'Summary 1', sources: [], importance: 5
    },
    {
        id: '2', title: 'Event Two', date: '2023-01-02', type: 'financial',
        tags: ['tagB'], summary: 'Summary 2', sources: [], importance: 5
    },
    {
        id: '3', title: 'Event Three', date: '2023-01-03', type: 'political',
        tags: ['tagA', 'tagC'], summary: 'Summary 3', sources: [], importance: 5
    },
    {
        id: '4', title: 'Alpha Event', date: '2023-01-04', type: 'cultural',
        tags: ['tagD'], summary: 'Summary 4', sources: [], importance: 5
    }
];

describe('computeGraphData Filtering', () => {
    const defaultSettings = {
        maxNodes: 100,
        minStrength: 0.1,
        showMetrics: false,
        layout: 'force' as const,
        showLabels: true,
        viewMode: 'graph' as const,
        searchTerm: '',
        selectedTypes: []
    };

    it('returns all events when no filter', () => {
        const result = computeGraphData({ events: mockEvents, settings: defaultSettings });
        expect(result.nodes.length).toBe(4);
    });

    it('filters by search text (title)', () => {
        const settings = { ...defaultSettings, searchTerm: 'One' };
        const result = computeGraphData({ events: mockEvents, settings });
        expect(result.nodes.length).toBe(1);
        expect(result.nodes[0].id).toBe('1');
    });

    it('filters by search text (tag)', () => {
        const settings = { ...defaultSettings, searchTerm: 'tagA' };
        const result = computeGraphData({ events: mockEvents, settings });
        expect(result.nodes.length).toBe(2); // Event 1 and 3
        const ids = result.nodes.map(n => n.id).sort();
        expect(ids).toEqual(['1', '3']);
    });

    it('filters by type', () => {
        const settings = { ...defaultSettings, selectedTypes: ['political'] };
        const result = computeGraphData({ events: mockEvents, settings });
        expect(result.nodes.length).toBe(2);
        const ids = result.nodes.map(n => n.id).sort();
        expect(ids).toEqual(['1', '3']);
    });

    it.only('combines search and type filter', () => {
        const settings = { ...defaultSettings, searchTerm: 'Three', selectedTypes: ['political'] };
        const result = computeGraphData({ events: mockEvents, settings });
        expect(result.nodes.length).toBe(1);
        expect(result.nodes[0].id).toBe('3');
    });

    it('respects maxNodes after filtering', () => {
        const settings = { ...defaultSettings, maxNodes: 1 };
        const result = computeGraphData({ events: mockEvents, settings });
        expect(result.nodes.length).toBe(1);
        // Should be the latest date (Event 4)
        expect(result.nodes[0].id).toBe('4');
    });
});
