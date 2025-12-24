import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('UI Store', () => {
    beforeEach(() => {
        useUIStore.setState({
            selectedEventIds: new Set(),
            focusedEventId: null,
            viewMode: 'graph',
            timeRange: [null, null],
            searchTerm: '',
            selectedTypes: []
        });
    });

    it('initializes with default values', () => {
        const state = useUIStore.getState();
        expect(state.viewMode).toBe('graph');
        expect(state.selectedEventIds.size).toBe(0);
        expect(state.searchTerm).toBe('');
    });

    it('selects an event', () => {
        useUIStore.getState().selectEvent('1');
        const state = useUIStore.getState();
        expect(state.selectedEventIds.has('1')).toBe(true);
        expect(state.focusedEventId).toBe('1');
    });

    it('handles multi-select', () => {
        useUIStore.getState().selectEvent('1');
        useUIStore.getState().selectEvent('2', true);
        const state = useUIStore.getState();
        expect(state.selectedEventIds.size).toBe(2);
        expect(state.selectedEventIds.has('1')).toBe(true);
        expect(state.selectedEventIds.has('2')).toBe(true);
    });

    it('toggles event selection', () => {
        useUIStore.getState().selectEvent('1');
        useUIStore.getState().toggleEventSelection('1'); // Deselect
        expect(useUIStore.getState().selectedEventIds.has('1')).toBe(false);

        useUIStore.getState().toggleEventSelection('2'); // Select
        expect(useUIStore.getState().selectedEventIds.has('2')).toBe(true);
    });

    it('clears selection', () => {
        useUIStore.getState().selectEvent('1');
        useUIStore.getState().clearSelection();
        const state = useUIStore.getState();
        expect(state.selectedEventIds.size).toBe(0);
        expect(state.focusedEventId).toBe(null);
    });

    it('updates view mode', () => {
        useUIStore.getState().setViewMode('matrix');
        expect(useUIStore.getState().viewMode).toBe('matrix');
    });

    it('updates search term', () => {
        useUIStore.getState().setSearchTerm('test');
        expect(useUIStore.getState().searchTerm).toBe('test');
    });
});
