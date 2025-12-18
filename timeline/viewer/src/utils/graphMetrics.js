/**
 * Graph Metrics Utility
 * calculates centrality and clustering coefficients for a given set of nodes and links.
 */

// Calculate Node Degree (number of connections)
export const calculateDegreeCentrality = (nodes, links) => {
    const degreeMap = new Map();
    nodes.forEach(node => degreeMap.set(node.id, 0));

    links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
        degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
    });

    return degreeMap;
};

// Calculate Local Clustering Coefficient
// (Number of connections between neighbors / Possible connections between neighbors)
export const calculateClusteringCoefficient = (nodes, links) => {
    const clusteringMap = new Map();
    const adjacency = new Map();

    // Build Adjacency List
    nodes.forEach(node => adjacency.set(node.id, new Set()));
    links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        adjacency.get(sourceId).add(targetId);
        adjacency.get(targetId).add(sourceId);
    });

    nodes.forEach(node => {
        const neighbors = Array.from(adjacency.get(node.id));
        const k = neighbors.length;

        if (k < 2) {
            clusteringMap.set(node.id, 0);
            return;
        }

        let linksBetweenNeighbors = 0;
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                if (adjacency.get(neighbors[i]).has(neighbors[j])) {
                    linksBetweenNeighbors++;
                }
            }
        }

        const possibleLinks = (k * (k - 1)) / 2;
        clusteringMap.set(node.id, linksBetweenNeighbors / possibleLinks);
    });

    return clusteringMap;
};

// Calculate Betweenness Centrality (Brandes' Algorithm)
// Unweighted for simplicity, can be extended to weighted
export const calculateBetweennessCentrality = (nodes, links) => {
    const betweenness = new Map();
    const adjacency = new Map();

    nodes.forEach(node => {
        betweenness.set(node.id, 0);
        adjacency.set(node.id, []);
    });

    links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        adjacency.get(sourceId).push(targetId);
        adjacency.get(targetId).push(sourceId);
    });

    nodes.forEach(s => {
        const S = [];
        const P = new Map();
        const sigma = new Map();
        const d = new Map();

        nodes.forEach(t => {
            P.set(t.id, []);
            sigma.set(t.id, 0);
            d.set(t.id, -1);
        });

        sigma.set(s.id, 1);
        d.set(s.id, 0);

        const Q = [s.id];

        while (Q.length > 0) {
            const v = Q.shift();
            S.push(v);

            const neighbors = adjacency.get(v) || [];
            neighbors.forEach(w => {
                // w found for the first time?
                if (d.get(w) < 0) {
                    Q.push(w);
                    d.set(w, d.get(v) + 1);
                }
                // shortest path to w via v?
                if (d.get(w) === d.get(v) + 1) {
                    sigma.set(w, sigma.get(w) + sigma.get(v));
                    P.get(w).push(v);
                }
            });
        }

        const delta = new Map();
        nodes.forEach(v => delta.set(v.id, 0));

        while (S.length > 0) {
            const w = S.pop();
            P.get(w).forEach(v => {
                delta.set(v, delta.get(v) + (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w)));
            });
            if (w !== s.id) {
                betweenness.set(w, betweenness.get(w) + delta.get(w));
            }
        }
    });

    // For undirected graph, divide by 2
    betweenness.forEach((val, key) => betweenness.set(key, val / 2));

    // Normalize (optional, divides by (N-1)(N-2)/2)
    const N = nodes.length;
    if (N > 2) {
        const normFactor = 2 / ((N - 1) * (N - 2));
        betweenness.forEach((val, key) => betweenness.set(key, val * normFactor));
    }

    return betweenness;
};

// Identify Key Players based on combined score
export const identifyKeyPlayers = (nodes, links) => {
    const degree = calculateDegreeCentrality(nodes, links);
    const betweenness = calculateBetweennessCentrality(nodes, links);

    return nodes.map(node => ({
        ...node,
        metrics: {
            degree: degree.get(node.id),
            betweenness: betweenness.get(node.id),
            // Clustering is expensive, maybe compute on demand or include if fast enough
            // clustering: ...
        }
    })).sort((a, b) => b.metrics.betweenness - a.metrics.betweenness); // Sort by betweenness (bridges)
};
