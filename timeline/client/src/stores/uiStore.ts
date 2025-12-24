import { create } from 'zustand';

export type ViewMode = 'graph' | 'matrix' | 'sunburst' | 'heatmap' | 'patterns' | 'lag-analysis' | 'timeline';

interface UIState {
    // Selection & Focus
    selectedEventIds: Set<string>;
    focusedEventId: string | null;

    // Navigation
    viewMode: ViewMode;
    timeRange: [Date | null, Date | null]; // Start, End (null = full range)

    // Global Filter State
    searchTerm: string;
    selectedTypes: string[];

    // Visualization Settings
    layout: 'force' | 'timeline';
    showLabels: boolean;
    showMetrics: boolean;
    minStrength: number;
    maxNodes: number;

    // Actions
    setViewMode: (mode: ViewMode) => void;
    setLayout: (layout: 'force' | 'timeline') => void;
    toggleLabels: () => void;
    toggleMetrics: () => void;
    setMetric: (key: 'minStrength' | 'maxNodes', value: number) => void;

    selectEvent: (id: string, multi?: boolean) => void;
    toggleEventSelection: (id: string) => void;
    clearSelection: () => void;
    setFocus: (id: string | null) => void;
    setSearchTerm: (term: string) => void;
    setTypeFilter: (types: string[]) => void;
    setTimeRange: (range: [Date | null, Date | null]) => void;
}

export const useUIStore = create<UIState>((set) => ({
    // Initial State
    selectedEventIds: new Set(),
    focusedEventId: null,
    viewMode: 'graph',
    timeRange: [null, null],

    // Visualization Defaults
    layout: 'force',
    showLabels: true,
    showMetrics: false,
    minStrength: 0.5,
    maxNodes: 200,

    // Filter Defaults
    searchTerm: '',
    selectedTypes: [],

    // Actions
    setViewMode: (mode) => set({ viewMode: mode }),
    setLayout: (layout) => set({ layout }),
    toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
    toggleMetrics: () => set((state) => ({ showMetrics: !state.showMetrics })),
    setMetric: (key, value) => set({ [key]: value }),

    selectEvent: (id, multi = false) => set((state) => {
        const newSet = multi ? new Set(state.selectedEventIds) : new Set<string>();
        newSet.add(id);
        return { selectedEventIds: newSet, focusedEventId: id }; // Auto-focus on select
    }),

    toggleEventSelection: (id) => set((state) => {
        const newSet = new Set(state.selectedEventIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return { selectedEventIds: newSet };
    }),

    clearSelection: () => set({ selectedEventIds: new Set(), focusedEventId: null }),

    setFocus: (id) => set({ focusedEventId: id }),

    setSearchTerm: (term) => set({ searchTerm: term }),

    setTypeFilter: (types) => set({ selectedTypes: types }),

    setTimeRange: (range) => set({ timeRange: range })
}));
