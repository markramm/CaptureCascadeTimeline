
import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { TimelineEvent } from '../../schemas/events';
import { calculateDegreeCentrality, calculateBetweennessCentrality } from '../../utils/graphMetrics';
import type { GraphNode, GraphLink } from '../../utils/graphMetrics';
import { GraphControls, type GraphSettings } from './GraphControls';
import './NetworkGraph.css';

const EMPTY_ARRAY: TimelineEvent[] = [];

interface NetworkGraphProps {
    minConnectionStrength?: number;
    showMetrics?: boolean;
    maxNodes?: number;
    showLabels?: boolean;
    graphLayout?: 'force' | 'timeline';
    title?: string;
    description?: string;
}

export function NetworkGraph({
    minConnectionStrength = 0.5,
    showMetrics = false,
    maxNodes = 200,
    showLabels = true,
    graphLayout = 'force',
    title,
    description
}: NetworkGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Resize Observer
    useEffect(() => {
        if (!wrapperRef.current) return;

        const updateDimensions = () => {
            if (wrapperRef.current) {
                setDimensions({
                    width: wrapperRef.current.clientWidth,
                    height: wrapperRef.current.clientHeight
                });
            }
        };

        // Initial sizing
        updateDimensions();

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });

        observer.observe(wrapperRef.current);
        return () => observer.disconnect();
    }, []);

    // Internal State for Controls
    const [settings, setSettings] = useState<GraphSettings>({
        layout: graphLayout,
        showLabels: showLabels,
        showMetrics: showMetrics,
        minStrength: minConnectionStrength,
        maxNodes: maxNodes,
        searchText: '',
        selectedTypes: []
    });



    // UI State
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    // const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
    // const [isLayoutFrozen, setIsLayoutFrozen] = useState(false);

    // Data Loading
    const events = useLiveQuery(() => db.events.toArray()) || EMPTY_ARRAY;

    // Transform Data for Graph
    const graphData = useMemo<{ nodes: GraphNode[]; links: GraphLink[] }>(() => {
        if (!events.length) return { nodes: [], links: [] };

        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        const nodeMap = new Map<string, GraphNode>();

        // 1. Process Events as Nodes
        // Sort by date desc to show most recent events first if limit is hit
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

        // Apply Type Filter
        if (settings.selectedTypes && settings.selectedTypes.length > 0) {
            filteredEvents = filteredEvents.filter(e =>
                e.type && settings.selectedTypes.includes(e.type)
            );
        }

        filteredEvents.slice(0, settings.maxNodes).forEach(event => {
            const importance = 5; // Default for now, can calculate based on tags later

            const node: GraphNode = {
                id: event.id,
                type: 'event',
                label: (event.title || 'Untitled').substring(0, 25) + ((event.title || '').length > 25 ? '...' : ''),
                fullTitle: event.title || 'Untitled',
                date: event.date,
                tags: event.tags || [],
                impact: importance,
                group: event.type || 'other',
                // Initialize positions near center to prevent "explosion" from 0,0
                x: 400 + (((event.id.charCodeAt(0) || 0) % 100) - 50),
                y: 300 + (((event.id.charCodeAt(event.id.length - 1) || 0) % 100) - 50),
                entities: event.entities || []
            };
            nodes.push(node);
            nodeMap.set(event.id, node);
        });

        // 2. Extract Actors (from Tags currently, as we don't have dedicated Actors field in new Event Schema yet? 
        // Wait, legacy schema had 'actors'. Current schema doesn't explicitly have 'actors' field, but 'entities'? 
        // Let's check Schema. 'entities' is optional. Legacy used 'actors'.
        // For now, I'll extract from 'tags' if they look like people, OR if we add 'entities' later.
        // Actually, let's treat specific tags as actors if we can, or just graph events for now.
        // Legacy 'actors' were specific.
        // Let's use 'tags' for shared tag connections (Thematic).

        // Connect events by Shared Tags (Thematic)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeA = nodes[i];
                const nodeB = nodes[j];

                const tagsA = nodeA.tags || [];
                const tagsB = nodeB.tags || [];

                const sharedTags = tagsA.filter((t: string) => tagsB.includes(t));

                if (sharedTags.length >= 1) {
                    // Strength based on Jaccard Index or simple overlap count
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

        // Metrics Calculation
        if (settings.showMetrics) {
            const degree = calculateDegreeCentrality(nodes, links);
            const betweenness = calculateBetweennessCentrality(nodes, links);

            nodes.forEach(n => {
                n.metrics = {
                    degree: degree.get(n.id) || 0,
                    betweenness: betweenness.get(n.id) || 0,
                    clustering: 0
                };
            });
        }

        return { nodes, links };

    }, [events, settings.minStrength, settings.showMetrics, settings.maxNodes, settings.searchText, settings.selectedTypes]);

    // D3 Rendering Effect
    useEffect(() => {
        if (!svgRef.current || !graphData.nodes.length) return;

        const { width, height } = dimensions;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .style('background', '#1e293b'); // Dark background

        svg.selectAll('*').remove(); // Clear previous

        const g = svg.append('g');

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));

        svg.call(zoom);

        // Color Scale
        const colorScale = d3.scaleOrdinal<string>()
            .domain(['legislative', 'judicial', 'financial', 'corporate', 'political', 'cultural', 'other'])
            .range(['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#95a5a6']);

        // --- FORCE LAYOUT ---
        if (settings.layout === 'force') {
            const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
                .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links)
                    .id(d => d.id)
                    .distance(d => 150 * (1 - (d.strength || 0))) // Increased distance
                )
                .force('charge', d3.forceManyBody().strength(-500)) // Increased repulsion
                .force('center', d3.forceCenter(width / 2, height / 2).strength(0.4)) // Stronger centering
                .force('collide', d3.forceCollide().radius(30)); // Avoid overlap

            simulationRef.current = simulation;

            // Links
            const link = g.append('g')
                .selectAll('line')
                .data(graphData.links)
                .enter().append('line')
                .attr('stroke', d => d.type === 'temporal' ? '#f1c40f' : '#3498db')
                .attr('stroke-opacity', 0.4)
                .attr('stroke-width', d => (d.strength || 0.5) * 2);

            // Nodes
            const node = g.append('g')
                .selectAll('circle')
                .data(graphData.nodes)
                .enter().append('circle')
                .attr('r', d => 5 + (d.metrics?.betweenness || 0) * 50) // Size by influence
                .attr('fill', d => colorScale(d.group as string))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5)
                .call(d3.drag<SVGCircleElement, GraphNode>()
                    .on('start', dragStarted)
                    .on('drag', dragged)
                    .on('end', dragEnded)
                )
                .on('click', (event: any, d) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    event.stopPropagation();
                    setSelectedNode(d);
                });

            // Labels
            if (settings.showLabels) {
                g.append('g')
                    .selectAll('text')
                    .data(graphData.nodes)
                    .enter().append('text')
                    .text(d => d.label)
                    .attr('x', 8)
                    .attr('y', 3)
                    .style('font-size', '10px')
                    .style('fill', '#ccc')
                    .style('pointer-events', 'none');
            }

            simulation.on('tick', () => {
                link
                    .attr('x1', d => (d.source as GraphNode).x!)
                    .attr('y1', d => (d.source as GraphNode).y!)
                    .attr('x2', d => (d.target as GraphNode).x!)
                    .attr('y2', d => (d.target as GraphNode).y!);

                node
                    .attr('cx', d => d.x!)
                    .attr('cy', d => d.y!);

                if (settings.showLabels) {
                    g.selectAll('text')
                        .attr('x', (d: any) => d.x + 8) // eslint-disable-line @typescript-eslint/no-explicit-any
                        .attr('y', (d: any) => d.y + 3); // eslint-disable-line @typescript-eslint/no-explicit-any
                }
            });

            function dragStarted(event: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragEnded(event: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }
        }
        // --- TIMELINE LAYOUT ---
        else if (settings.layout === 'timeline') {
            // Simple Timeline: X = Date, Y = Group/Type
            const dateExtent = d3.extent(graphData.nodes, d => new Date(d.date)) as [Date, Date];
            const xScale = d3.scaleTime().domain(dateExtent).range([50, width - 50]);
            const yScale = d3.scalePoint().domain(colorScale.domain()).range([50, height - 50]);

            // Pre-calculate positions
            graphData.nodes.forEach(n => {
                n.x = xScale(new Date(n.date));
                n.y = yScale(n.group as string) || height / 2;

                // Jitter Y slightly to avoid overlaps
                n.y += (Math.random() - 0.5) * 50;
            });

            // Draw Links
            g.append('g')
                .selectAll('line')
                .data(graphData.links)
                .enter().append('line')
                .attr('x1', d => (d.source as GraphNode).x!)
                .attr('y1', d => (d.source as GraphNode).y!)
                .attr('x2', d => (d.target as GraphNode).x!)
                .attr('y2', d => (d.target as GraphNode).y!)
                .attr('stroke', '#555')
                .attr('stroke-opacity', 0.2);

            // Draw Nodes
            g.append('g')
                .selectAll('circle')
                .data(graphData.nodes)
                .enter().append('circle')
                .attr('cx', d => d.x!)
                .attr('cy', d => d.y!)
                .attr('r', 6)
                .attr('fill', d => colorScale(d.group as string))
                .attr('stroke', '#fff')
                .on('click', (_event: any, d) => setSelectedNode(d)); // eslint-disable-line @typescript-eslint/no-explicit-any

            // Time Axis
            const xAxis = d3.axisBottom(xScale);
            g.append('g')
                .attr('transform', `translate(0, ${height - 20})`)
                .call(xAxis)
                .style('color', '#888');
        }

    }, [graphData, settings.layout, settings.showLabels, dimensions]);


    return (
        <div className="network-graph-container" ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <GraphControls settings={settings} onChange={setSettings} />

            {/* Title Overlay */}
            {(title || description) && (
                <div style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    zIndex: 5,
                    pointerEvents: 'none', // Let clicks pass through to graph
                    maxWidth: '400px'
                }}>
                    {title && <h2 style={{ color: '#e2e8f0', margin: 0, fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{title}</h2>}
                    {description && <p style={{ color: '#94a3b8', margin: '5px 0 0 0', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{description}</p>}
                </div>
            )}

            {/* Overlay Controls could go here */}
            {selectedNode && (
                <div className="node-tooltip" style={{
                    position: 'absolute', bottom: 20, right: 20,
                    background: 'rgba(15, 23, 42, 0.9)', color: 'white', padding: '16px',
                    borderRadius: '12px', width: '280px', zIndex: 10,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <h3 style={{ marginTop: 0, color: 'white', fontSize: '1rem' }}>{selectedNode.fullTitle}</h3>
                    <p style={{ fontSize: '0.9em', color: '#ccc' }}>{selectedNode.date}</p>
                    <div style={{ margin: '10px 0' }}>
                        {selectedNode.tags?.map((t: string) => (
                            <span key={t} style={{
                                display: 'inline-block', background: '#334155',
                                padding: '2px 6px', borderRadius: '4px',
                                fontSize: '0.8em', marginRight: '4px', marginBottom: '4px'
                            }}>
                                {t}
                            </span>
                        ))}
                    </div>
                    {selectedNode.metrics && (
                        <div style={{ fontSize: '0.8em', color: '#aaa', marginTop: '8px', borderTop: '1px solid #444', paddingTop: '8px' }}>
                            <div>Degree: {selectedNode.metrics.degree}</div>
                            <div>Betweenness: {selectedNode.metrics.betweenness.toFixed(4)}</div>
                        </div>
                    )}
                    <button onClick={() => setSelectedNode(null)} style={{ marginTop: '10px', padding: '4px 8px' }}>Close</button>
                </div>
            )}

            <svg ref={svgRef} style={{ display: 'block' }}></svg>
        </div>
    );
}
