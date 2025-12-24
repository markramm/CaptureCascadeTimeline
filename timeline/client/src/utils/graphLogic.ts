
import type { TimelineEvent } from '../schemas/events';
import type { GraphNode, GraphLink } from './graphMetrics';

interface GraphDataParams {
    events: TimelineEvent[];
    settings: {
        searchText?: string;
        selectedTypes?: string[];
        maxNodes: number;
        minStrength: number;
    };
}

export function computeGraphData({ events, settings }: GraphDataParams): { nodes: GraphNode[]; links: GraphLink[] } {
    if (!events.length) return { nodes: [], links: [] };

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // 1. Process Events as Nodes
    // Sort by date desc
    let filteredEvents = [...events].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    // Apply Search Filter
    if (settings.searchText) {
        const lowerQuery = settings.searchText.toLowerCase();
        filteredEvents = filteredEvents.filter(e =>
            (e.title && e.title.toLowerCase().includes(lowerQuery)) ||
            (e.summary && e.summary.toLowerCase().includes(lowerQuery)) ||
            (e.tags && e.tags.some(t => t && t.toLowerCase().includes(lowerQuery))) ||
            (e.entities && e.entities.some(ent => ent && ent.toLowerCase().includes(lowerQuery)))
        );
    }

    const typeFilter = (e: TimelineEvent) => {
        if (!settings.selectedTypes || settings.selectedTypes.length === 0) return true;
        return e.type && settings.selectedTypes.includes(e.type);
    };
    filteredEvents = filteredEvents.filter(typeFilter);

    filteredEvents.slice(0, settings.maxNodes).forEach(event => {
        const importance = 5;

        const node: GraphNode = {
            id: event.id,
            type: 'event',
            label: (event.title || 'Untitled').substring(0, 25) + ((event.title || '').length > 25 ? '...' : ''),
            fullTitle: event.title || 'Untitled',
            date: event.date,
            tags: event.tags || [],
            impact: importance,
            group: event.type || 'other',
            x: 0,
            y: 0,
            entities: event.entities || []
        };
        nodes.push(node);
    });

    // 2. Connect events
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i];
            const nodeB = nodes[j];

            const tagsA = nodeA.tags || [];
            const tagsB = nodeB.tags || [];

            const sharedTags = tagsA.filter((t: string) => tagsB.includes(t));

            if (sharedTags.length >= 1) {
                const similarity = sharedTags.length / Math.sqrt(tagsA.length * tagsB.length);

                if (similarity >= settings.minStrength) {
                    links.push({
                        source: nodeA.id,
                        target: nodeB.id,
                        type: 'thematic',
                        strength: similarity,
                        tags: sharedTags
                    });
                }
            }

            // Temporal connections (within 3 days)
            if (nodeA.date && nodeB.date) {
                const daysDiff = Math.abs(
                    new Date(nodeA.date).getTime() - new Date(nodeB.date).getTime()
                ) / (1000 * 60 * 60 * 24);

                if (daysDiff <= 3) {
                    const strength = 1 - (daysDiff / 3);
                    links.push({
                        source: nodeA.id,
                        target: nodeB.id,
                        type: 'temporal',
                        strength: strength
                    });
                }
            }
        }
    }

    return { nodes, links };
}
