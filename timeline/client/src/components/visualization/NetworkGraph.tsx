import { useRef, useMemo, useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import * as d3 from 'd3';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { TimelineEvent } from '../../schemas/events';
import type { GraphNode, GraphLink } from '../../utils/graphMetrics';
import { GraphControls } from './GraphControls';
import type { GraphSettings, VisualizationProps } from '../../types/visualization';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { useGraphData } from '../../hooks/useGraphData';
import { useValidations } from '../../hooks/useValidations';
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
    title,
    description
}: VisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dimensions = useResizeObserver(wrapperRef);

    // Consume Store State
    const layout = useUIStore(s => s.layout);
    const showLabels = useUIStore(s => s.showLabels);
    const showMetrics = useUIStore(s => s.showMetrics);
    const minStrength = useUIStore(s => s.minStrength);
    const maxNodes = useUIStore(s => s.maxNodes);
    const searchText = useUIStore(s => s.searchTerm);
    const selectedTypes = useUIStore(s => s.selectedTypes);
    const viewMode = useUIStore(s => s.viewMode);

    // Derived Settings Object for Hooks
    const settings: GraphSettings = useMemo(() => ({
        layout,
        showLabels,
        showMetrics,
        minStrength,
        maxNodes,
        searchText,
        selectedTypes,
        viewMode
    }), [layout, showLabels, showMetrics, minStrength, maxNodes, searchText, selectedTypes, viewMode]);




    const selectEvent = useUIStore(s => s.selectEvent);
    const clearSelection = useUIStore(s => s.clearSelection);
    const focusedEventId = useUIStore(s => s.focusedEventId);

    // Derived Settings Object for Hooks

    // Data Loading
    const events = useLiveQuery(() => db.events.toArray()) || EMPTY_ARRAY;

    // Transform Data for Graph
    // Transform Data for Graph
    // Data Processing (Memoized by Hook)
    const { nodes: graphNodes, links: graphLinks } = useGraphData(events, settings);
    const validationsMap = useValidations();

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
                .on('click', (event: MouseEvent, d) => {
                    event.stopPropagation();
                    selectEvent(d.id, event.shiftKey || event.metaKey);
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
                .attr('stroke', d => {
                    const records = validationsMap.get(d.id);
                    if (records && records.length > 0) {
                        if (records.some((r: { confidence: string }) => r.confidence === 'rejected')) return '#ef4444'; // Red
                        if (records.some((r: { confidence: string }) => r.confidence === 'high')) return '#10b981'; // Emerald
                    }
                    return '#fff';
                })
                .attr('stroke-width', d => {
                    const records = validationsMap.get(d.id);
                    if (records && records.some((r: { confidence: string }) => r.confidence === 'high')) return 3;
                    return 1.5;
                });

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
                clearSelection();
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
                        .attr('x', (d) => (d as GraphNode).x! + 14)
                        .attr('y', (d) => (d as GraphNode).y! + 4);
                }
            });

            function dragStarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragEnded(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
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
                .on('click', (_event: MouseEvent, d) => selectEvent(d.id));

            // Time Axis
            const xAxis = d3.axisBottom(xScale);
            g.append('g')
                .attr('transform', `translate(0, ${height - 20})`)
                .call(xAxis)
                .style('color', '#888');
        }

    }, [graphData, settings.layout, settings.showLabels, dimensions, settings.viewMode]);


    // Highlighting Effect
    useEffect(() => {
        if (!svgRef.current || !graphData.nodes.length) return;
        const svg = d3.select(svgRef.current);
        const node = svg.selectAll('.node'); // Need to ensure class 'node' is set
        const link = svg.selectAll('line'); // Need better selector if possible

        if (!focusedEventId) {
            // Reset
            node.transition().duration(300).style('opacity', 1);
            link.transition().duration(300).style('opacity', 0.4);
            return;
        }

        // Calculate Neighborhood
        const connectedIds = new Set<string>();
        connectedIds.add(focusedEventId);

        // We need 'links' to calculate neighborhood. 
        // Note: graphData.links might reference objects or IDs depending on d3 force init state.
        // But since we are inside the component, we can access graphData.links.
        // Only potential issue is if graphData changes reference. 
        // But graphData is memoized.

        graphData.links.forEach(l => {
            // D3 Force replaces source/target string IDs with Node objects. 
            // We need to handle both just in case or rely on d3 typing.
            const sId = (typeof l.source === 'object') ? (l.source as GraphNode).id : l.source as string;
            const tId = (typeof l.target === 'object') ? (l.target as GraphNode).id : l.target as string;

            if (sId === focusedEventId) connectedIds.add(tId);
            if (tId === focusedEventId) connectedIds.add(sId);
        });

        node.transition().duration(300)
            .style('opacity', (d: unknown) => connectedIds.has((d as GraphNode).id) ? 1 : 0.1);

        link.transition().duration(300)
            .style('opacity', (l: unknown) => {
                const linkData = l as GraphLink;
                const sId = (typeof linkData.source === 'object') ? (linkData.source as GraphNode).id : linkData.source as string;
                const tId = (typeof linkData.target === 'object') ? (linkData.target as GraphNode).id : linkData.target as string;
                return (connectedIds.has(sId) && connectedIds.has(tId)) ? 1 : 0.05;
            });

    }, [focusedEventId, graphData]); // Run when focus changes

    // Export Handler
    const handleExport = () => {
        const { nodes, links } = computeGraphData({ events, settings });
        const gexf = exportToGEXF(nodes, links);
        downloadFile(gexf, `network_graph_${new Date().toISOString().split('T')[0]}.gexf`, 'text/xml');
    };

    return (
        <div className="network-graph-container" ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <GraphControls onExport={handleExport} />

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

                    {focusedEventId && (() => {
                        const selectedNode = graphData.nodes.find(n => n.id === focusedEventId);
                        if (!selectedNode) return null;
                        return (
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
                                {validationsMap.get(selectedNode.id) && (
                                    <div style={{ fontSize: '0.8em', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>✓ Verified</span>
                                        <span style={{ color: '#94a3b8' }}>({validationsMap.get(selectedNode.id).length})</span>
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
                                        onClick={() => clearSelection()}
                                        style={{
                                            padding: '6px 12px', borderRadius: '6px', border: '1px solid #475569',
                                            background: 'transparent', color: '#cbd5e1', cursor: 'pointer'
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    <ErrorBoundary name="Network Graph">
                        <svg ref={svgRef} style={{ display: 'block' }}></svg>
                    </ErrorBoundary>
                </>
            )}
        </div>
    );
}
