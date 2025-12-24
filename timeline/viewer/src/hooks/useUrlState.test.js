import { renderHook, act } from '@testing-library/react';
import useUrlState from './useUrlState';

describe('useUrlState', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        delete window.location;
        window.location = {
            ...originalLocation,
            search: '',
            pathname: '/viewer',
            origin: 'http://localhost',
            href: 'http://localhost/viewer',
        };
        window.history.replaceState = jest.fn();
    });

    afterEach(() => {
        window.location = originalLocation;
        jest.clearAllMocks();
    });

    test('initializes with default state when URL is empty', () => {
        const { result } = renderHook(() => useUrlState());

        expect(result.current.urlState).toEqual({
            selectedTags: [],
            selectedActors: [],
            selectedCaptureLanes: [],
            dateRange: { start: null, end: null },
            searchQuery: '',
            viewMode: 'timeline',
            timelineControls: { compactMode: 'medium', sortBy: 'date', filterImportance: 0, showMinimap: true },
            graphControls: { layout: 'force', connectionStrength: 0, showMetrics: false, maxNodes: 200, showLabels: true },
            actorControls: { minEvents: 3, showLabels: true, compareMode: false, compareNodes: [] },
            zoomLevel: 1,
            showFilters: true,
            showStats: false,
            selectedEventId: null,
            showLanding: false
        });
    });

    test('parses complex state from URL', () => {
        window.location.search = '?tags=tag1,tag2&actors=actor1&view=graph&graph=force,0.5,true,100,true&actorSettings=5,false,true,id1|id2';

        const { result } = renderHook(() => useUrlState());

        expect(result.current.urlState.selectedTags).toEqual(['tag1', 'tag2']);
        expect(result.current.urlState.selectedActors).toEqual(['actor1']);
        expect(result.current.urlState.viewMode).toEqual('graph');
        expect(result.current.urlState.graphControls).toEqual({
            layout: 'force',
            connectionStrength: 0.5,
            showMetrics: true,
            maxNodes: 100,
            showLabels: true
        });
        expect(result.current.urlState.actorControls).toEqual({
            minEvents: 5,
            showLabels: false,
            compareMode: true,
            compareNodes: [{ id: 'id1', label: 'id1' }, { id: 'id2', label: 'id2' }]
        });
    });

    test('updates URL when state changes', () => {
        const { result } = renderHook(() => useUrlState());

        act(() => {
            result.current.updateUrl({
                selectedTags: ['newTag'],
                viewMode: 'actors'
            });
        });

        expect(window.history.replaceState).toHaveBeenCalledWith(
            null,
            '',
            expect.stringContaining('tags=newTag')
        );
        expect(window.history.replaceState).toHaveBeenCalledWith(
            null,
            '',
            expect.stringContaining('view=actors')
        );
    });
});
