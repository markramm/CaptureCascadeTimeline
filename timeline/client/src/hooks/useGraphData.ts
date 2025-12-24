
import { useMemo } from 'react';
import { computeGraphData } from '../utils/graphLogic';
import { calculateDegreeCentrality, calculateBetweennessCentrality } from '../utils/graphMetrics';
import type { TimelineEvent } from '../schemas/events';
import type { GraphSettings } from '../types/visualization';

/**
 * Hook to memoize complex graph calculations.
 * Handles node filtering, link generation, and optional centrality metric calculation.
 */
export function useGraphData(events: TimelineEvent[], settings: GraphSettings) {
    return useMemo(() => {
        // If no events, return early
        if (!events || events.length === 0) {
            return { nodes: [], links: [] };
        }

        // 1. Compute basic structure (filter, limit, link)
        const { nodes, links } = computeGraphData({ events, settings });

        // 2. Optional: Compute expensive metrics
        // Only if requested by settings
        if (settings.showMetrics) {
            const degreeMap = calculateDegreeCentrality(nodes, links);
            const betweennessMap = calculateBetweennessCentrality(nodes, links);

            nodes.forEach(node => {
                node.metrics = {
                    degree: degreeMap.get(node.id) || 0,
                    betweenness: betweennessMap.get(node.id) || 0,
                    clustering: 0
                };
            });
        }

        return { nodes, links };
    }, [events, settings]);
}
