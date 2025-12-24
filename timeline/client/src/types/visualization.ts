
export interface GraphSettings {
    layout: 'force' | 'timeline';
    showLabels: boolean;
    showMetrics: boolean;
    minStrength: number;
    maxNodes: number;
    searchText: string;
    selectedTypes: string[];
    viewMode: 'graph' | 'matrix' | 'sunburst' | 'heatmap' | 'patterns' | 'lag-analysis' | 'timeline';
}

export interface VisualizationProps {
    minConnectionStrength?: number;
    showMetrics?: boolean;
    maxNodes?: number;
    showLabels?: boolean;
    graphLayout?: 'force' | 'timeline';
    title?: string;
    description?: string;
    settings?: GraphSettings;
    onChange?: (settings: GraphSettings) => void;
}
