import { useRef, useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { TimelineEvent } from '../../schemas/events';
import { calculateDegreeCentrality, calculateBetweennessCentrality } from '../../utils/graphMetrics';
import type { GraphNode, GraphLink } from '../../utils/graphMetrics';
import { GraphControls } from './GraphControls';
import type { GraphSettings, VisualizationProps } from '../../types/visualization';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { useGraphData } from '../../hooks/useGraphData';
import { getIconPath } from '../../utils/graphIcons';
import { computeGraphData } from '../../utils/graphLogic'; // Keep for export functionality
import { MatrixView } from './MatrixView';
import { LagAnalysisView } from './LagAnalysisView';
import { HeatmapView } from './HeatmapView';
import { SunburstView } from './SunburstView';
import { exportToGEXF, downloadFile } from '../../utils/exportUtils';
import { ErrorBoundary } from '../common/ErrorBoundary';
import './NetworkGraph.css';

const EMPTY_ARRAY: TimelineEvent[] = [];

export function NetworkGraph({
    minConnectionStrength = 0.5,
    showMetrics = false,
    maxNodes = 200,
    showLabels = true,
    graphLayout = 'force',
    title,
    description
}: VisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dimensions = useResizeObserver(wrapperRef);

    // Internal State for Controls
    const [settings, setSettings] = useState<GraphSettings>({
        layout: graphLayout,
        showLabels: showLabels,
        showMetrics: showMetrics,
        minStrength: minConnectionStrength,
        maxNodes: maxNodes,
        searchText: '',
        selectedTypes: [],
        viewMode: 'graph'
    });



    // UI State
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

    // Data Loading
    const events = useLiveQuery(() => db.events.toArray()) || EMPTY_ARRAY;

    // Transform Data for Graph
    // Transform Data for Graph
    // Data Processing (Memoized by Hook)
    const { nodes: graphNodes, links: graphLinks } = useGraphData(events, settings);

    // Transform Data for Graph (Clone for D3 mutation)
    const graphData = useMemo<{ nodes: GraphNode[]; links: GraphLink[] }>(() => {
        const nodes = graphNodes.map(n => ({ ...n }));
        const links = graphLinks.map(l => ({ ...l }));

        // Add coordinates initialization if missing
        nodes.forEach(node => {
            // Re-initialize positions near center for simulation stability if they are 0,0
            // (Using deterministic seeded random based on ID for consistency)
            node.x = 400 + (((node.id.charCodeAt(0) || 0) % 100) - 50);
            node.y = 300 + (((node.id.charCodeAt(node.id.length - 1) || 0) % 100) - 50);
        });

        return { nodes, links };
    }, [graphNodes, graphLinks]);


    // D3 Rendering Effect (Graph Mode Only)
    useEffect(() => {
        if (settings.viewMode && settings.viewMode !== 'graph') return; // Skip if not graph mode
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

            // Node Groups
            const node = g.append('g')
                .selectAll('g.node')
                .data(graphData.nodes)
                .enter().append('g')
                .attr('class', 'node')
                .call(d3.drag<SVGGElement, GraphNode>()
                    .on('start', dragStarted)
                    .on('drag', dragged)
                    .on('end', dragEnded)
                )
                .on('click', (event: any, d) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    event.stopPropagation();
                    setSelectedNode(d);

                    // Highlight neighborhood
                    const connectedIds = new Set<string>();
                    connectedIds.add(d.id);
                    graphData.links.forEach(l => {
                        if (l.source === d || (l.source as GraphNode).id === d.id) connectedIds.add((l.target as GraphNode).id);
                        if (l.target === d || (l.target as GraphNode).id === d.id) connectedIds.add((l.source as GraphNode).id);
                    });

                    node.transition().duration(300)
                        .style('opacity', n => connectedIds.has(n.id) ? 1 : 0.1);

                    link.transition().duration(300)
                        .style('opacity', () => 0.05) // Should check connectivity but complex for links in D3 tick. Simple fade for now. or check source/target
                        .style('opacity', l => (connectedIds.has((l.source as GraphNode).id) && connectedIds.has((l.target as GraphNode).id)) ? 1 : 0.05);
                });

            // Circle Background - Visual Centrality
            node.append('circle')
                .attr('r', d => {
                    const baseSize = 12;
                    if (settings.showMetrics && d.metrics) {
                        // Scale by degree (connections) and betweenness (bridge role)
                        // Simple linear combo for now
                        const centralityBonus = (d.metrics.degree * 2) + (d.metrics.betweenness * 50);
                        return Math.min(baseSize + centralityBonus, 40); // Max size cap
                    }
                    return baseSize;
                })
                .attr('fill', d => colorScale(d.group as string))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5);

            // Icon
            node.append('path')
                .attr('d', d => getIconPath(d.group))
                .attr('fill', 'white')
                .attr('transform', 'translate(-8, -8) scale(0.7)') // Center icon (approx)
                .style('pointer-events', 'none');


            // Labels
            if (settings.showLabels) {
                g.append('g')
                    .selectAll('text')
                    .data(graphData.nodes)
                    .enter().append('text')
                    .text(d => d.label)
                    .attr('x', 14)
                    .attr('y', 4)
                    .style('font-size', '10px')
                    .style('fill', '#ccc')
                    .style('pointer-events', 'none');
            }

            // Reset highlighting on canvas click
            svg.on('click', () => {
                setSelectedNode(null);
                node.transition().duration(300).style('opacity', 1);
                link.transition().duration(300).style('opacity', () => 0.4);
            });

            simulation.on('tick', () => {
                link
                    .attr('x1', d => (d.source as GraphNode).x!)
                    .attr('y1', d => (d.source as GraphNode).y!)
                    .attr('x2', d => (d.target as GraphNode).x!)
                    .attr('y2', d => (d.target as GraphNode).y!);

                node
                    .attr('transform', d => `translate(${d.x},${d.y})`);

                if (settings.showLabels) {
                    g.selectAll('text')
                        .attr('x', (d: any) => d.x + 14) // eslint-disable-line @typescript-eslint/no-explicit-any
                        .attr('y', (d: any) => d.y + 4); // eslint-disable-line @typescript-eslint/no-explicit-any
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

    }, [graphData, settings.layout, settings.showLabels, dimensions, settings.viewMode]);


    // Export Handler
    const handleExport = () => {
        const { nodes, links } = computeGraphData({ events, settings });
        const gexf = exportToGEXF(nodes, links);
        downloadFile(gexf, `network_graph_${new Date().toISOString().split('T')[0]}.gexf`, 'text/xml');
    };

    return (
        <div className="network-graph-container" ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <GraphControls settings={settings} onChange={setSettings} onExport={handleExport} />

            {/* Title Overlay */}
            {(title || description) && (
                <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 5, pointerEvents: 'none', maxWidth: '400px' }}>
                    {title && <h2 style={{ color: '#e2e8f0', margin: 0, fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{title}</h2>}
                    {description && <p style={{ color: '#94a3b8', margin: '5px 0 0 0', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{description}</p>}
                </div>
            )}

            {/* View Switching */}
            {settings.viewMode === 'matrix' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <ErrorBoundary name="Matrix View">
                        <MatrixView
                            minConnectionStrength={settings.minStrength}
                            maxNodes={settings.maxNodes}
                            settings={settings}
                        />
                    </ErrorBoundary>
                </div>
            )}

            {settings.viewMode === 'sunburst' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <ErrorBoundary name="Hierarchy View">
                        <SunburstView />
                    </ErrorBoundary>
                </div>
            )}

            {settings.viewMode === 'heatmap' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <ErrorBoundary name="Heatmap View">
                        <HeatmapView
                            minConnectionStrength={settings.minStrength}
                            maxNodes={settings.maxNodes}
                            settings={settings} // Pass settings for filtering
                        />
                    </ErrorBoundary>
                </div>
            )}

            {settings.viewMode === 'patterns' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <ErrorBoundary name="Patterns View">
                        <LagAnalysisView
                            minConnectionStrength={settings.minStrength}
                            maxNodes={settings.maxNodes}
                            settings={settings}
                        />
                    </ErrorBoundary>
                </div>
            )}

            {settings.viewMode === 'graph' && (
                <>
                    {/* Legend Overlay */}
                    <div style={{
                        position: 'absolute', top: 20, right: 20,
                        background: 'rgba(15, 23, 42, 0.8)', padding: '12px',
                        borderRadius: '8px', zIndex: 5, border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Legend</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                            {[
                                { type: 'legislative', color: '#e74c3c', label: 'Legislative' },
                                { type: 'judicial', color: '#3498db', label: 'Judicial' },
                                { type: 'financial', color: '#2ecc71', label: 'Financial' },
                                { type: 'corporate', color: '#9b59b6', label: 'Corporate' },
                                { type: 'political', color: '#f39c12', label: 'Political' },
                                { type: 'cultural', color: '#1abc9c', label: 'Cultural' },
                            ].map(item => (
                                <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, display: 'inline-block' }}></span>
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

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
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button
                                    onClick={() => window.open(`/events/${selectedNode.id}/edit`, '_self')}
                                    style={{
                                        flex: 1, padding: '6px 12px', borderRadius: '6px', border: 'none',
                                        background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 500
                                    }}
                                >
                                    Edit Event
                                </button>
                                <button
                                    onClick={() => setSelectedNode(null)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', border: '1px solid #475569',
                                        background: 'transparent', color: '#cbd5e1', cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    <ErrorBoundary name="Network Graph">
                        <svg ref={svgRef} style={{ display: 'block' }}></svg>
                    </ErrorBoundary>
                </>
            )}
        </div>
    );
}
