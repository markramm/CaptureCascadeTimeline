import * as d3 from 'd3';
import { useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { VisualizationProps, GraphSettings } from '../../types/visualization';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { useGraphData } from '../../hooks/useGraphData';

export function MatrixView({
    minConnectionStrength = 0.5,
    maxNodes = 50,
    settings
}: VisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dimensions = useResizeObserver(wrapperRef, 600, 600);
    const events = useLiveQuery(() => db.events.toArray()) || [];


    // Data Processing
    const effectiveSettings = useMemo(() => settings || {
        maxNodes,
        minStrength: minConnectionStrength,
        searchText: '',
        selectedTypes: [],
        layout: 'force',
        showLabels: true,
        showMetrics: false,
        viewMode: 'matrix'
    } as GraphSettings, [settings, maxNodes, minConnectionStrength]);

    const { nodes, links } = useGraphData(events, effectiveSettings);

    const matrixData = useMemo(() => {

        // Add index for Matrix rendering
        const indexedNodes = nodes.map((n, i) => ({ ...n, index: i }));

        // Transform links to matrix format (source/target indices)
        const nodeMap = new Map(indexedNodes.map(n => [n.id, n.index]));

        const matrixLinks: { source: number; target: number; value: number }[] = [];

        // Add self-links
        indexedNodes.forEach((_, i) => {
            matrixLinks.push({ source: i, target: i, value: 1 });
        });

        // Map graph links to indices
        links.forEach(l => {
            const sourceIdx = nodeMap.get(l.source as string);
            const targetIdx = nodeMap.get(l.target as string);
            if (sourceIdx !== undefined && targetIdx !== undefined) {
                matrixLinks.push({ source: sourceIdx, target: targetIdx, value: l.strength || 0 });
                // Matrix is symmetric for undirected graphs
                matrixLinks.push({ source: targetIdx, target: sourceIdx, value: l.strength || 0 });
            }
        });

        return { nodes: indexedNodes, links: matrixLinks };
    }, [nodes, links]);

    // Render D3
    useEffect(() => {
        if (!svgRef.current || !matrixData.nodes.length) return;

        const margin = { top: 80, right: 0, bottom: 0, left: 80 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr("width", dimensions.width)
            .attr("height", dimensions.height);

        svg.selectAll("*").remove();

        const x = d3.scaleBand()
            .range([0, width])
            .domain(d3.range(matrixData.nodes.length).map(String));

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Rows
        matrixData.nodes.forEach((node, i) => {
            // Row Group
            const row = g.append("g")
                .attr("transform", `translate(0,${x(String(i))})`);

            // Cells in Row
            matrixData.links.filter(l => l.source === i).forEach(l => {
                row.append("rect")
                    .attr("x", x(String(l.target)) || 0)
                    .attr("width", x.bandwidth())
                    .attr("height", x.bandwidth())
                    .style("fill-opacity", l.value) // Opacity by strength
                    .style("fill", l.source === l.target ? "#ddd" : "#3b82f6")
                    .append("title")
                    .text(`${matrixData.nodes[l.source].label} <-> ${matrixData.nodes[l.target].label}`);
            });

            // Row Label
            row.append("text")
                .attr("x", -6)
                .attr("y", x.bandwidth() / 2)
                .attr("dy", ".32em")
                .attr("text-anchor", "end")
                .text(node.label.substring(0, 15))
                .style("font-size", "10px")
                .style("fill", "#64748b");
        });

        // Column Labels
        const col = g.append("g")
            .selectAll("g")
            .data(matrixData.nodes)
            .enter().append("g")
            .attr("transform", (_d, i) => `translate(${x(String(i))}, 0) rotate(-90)`);

        col.append("text")
            .attr("x", 6)
            .attr("y", x.bandwidth() / 2)
            .attr("dy", ".32em")
            .attr("text-anchor", "start")
            .text(d => d.label.substring(0, 15))
            .style("font-size", "10px")
            .style("fill", "#64748b");

        // Grid overlay
        g.append("rect")
            .attr("class", "frame")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("stroke", "#eee");

    }, [matrixData, dimensions]);

    return (
        <div ref={wrapperRef} style={{ width: '100%', height: '100%', overflow: 'auto', background: 'white' }}>
            <svg ref={svgRef}></svg>
        </div>
    );
}
