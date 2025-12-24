import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { VisualizationProps, GraphSettings } from '../../types/visualization';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { useGraphData } from '../../hooks/useGraphData';

export function LagAnalysisView({
    minConnectionStrength = 0.5,
    maxNodes = 50,
    settings
}: VisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dimensions = useResizeObserver(wrapperRef, 800, 500);
    const events = useLiveQuery(() => db.events.toArray()) || [];


    // Data Processing: Calculate Lag for Links
    const effectiveSettings = useMemo(() => settings || {
        maxNodes,
        minStrength: minConnectionStrength,
        searchText: '',
        selectedTypes: [],
        layout: 'force',
        showLabels: true,
        showMetrics: false,
        viewMode: 'lag-analysis'
    } as GraphSettings, [settings, maxNodes, minConnectionStrength]);

    const { nodes, links } = useGraphData(events, effectiveSettings);

    const chartData = useMemo(() => {

        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        const dataPoints: {
            xDate: Date;
            lagDays: number;
            source: string;
            target: string;
            type: string;
        }[] = [];

        links.forEach(link => {
            const sourceNode = nodeMap.get(link.source as string);
            const targetNode = nodeMap.get(link.target as string);

            if (sourceNode?.date && targetNode?.date) {
                const dateA = new Date(sourceNode.date);
                const dateB = new Date(targetNode.date);

                // Ensure positive lag and correct direction (Earlier -> Later)
                const minDate = dateA < dateB ? dateA : dateB;
                const diffTime = Math.abs(dateA.getTime() - dateB.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Only show significant lags or specific types if needed
                if (diffDays > 0) {
                    dataPoints.push({
                        xDate: minDate,
                        lagDays: diffDays,
                        source: sourceNode.label,
                        target: targetNode.label,
                        type: sourceNode.group || 'other'
                    });
                }
            }
        });

        return dataPoints;

    }, [nodes, links]);

    // Render D3 Scatter Plot
    useEffect(() => {
        if (!svgRef.current || !chartData.length) return;

        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr("width", dimensions.width)
            .attr("height", dimensions.height);

        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleTime()
            .domain(d3.extent(chartData, d => d.xDate) as [Date, Date])
            .range([0, width])
            .nice();

        const y = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.lagDays) || 100])
            .range([height, 0])
            .nice();

        // Axes
        g.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("fill", "#64748b");

        g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", "#64748b");

        // Labels
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .style("fill", "#94a3b8")
            .style("font-size", "12px")
            .text("Date of Initial Event");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .style("fill", "#94a3b8")
            .style("font-size", "12px")
            .text("Lag Time (Days)");

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgba(15, 23, 42, 0.9)")
            .style("color", "white")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("border", "1px solid #334155");

        // Points
        g.selectAll("circle")
            .data(chartData)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.xDate))
            .attr("cy", d => y(d.lagDays))
            .attr("r", 5)
            .style("fill", "#3b82f6")
            .style("opacity", 0.6)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <div style="font-weight:bold; margin-bottom:4px">Lag: ${d.lagDays} days</div>
                    <div>From: ${d.source}</div>
                    <div>To: ${d.target}</div>
                    <div style="color:#94a3b8; font-size:0.9em; margin-top:2px">${d.xDate.toLocaleDateString()}</div>
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");

                d3.select(event.currentTarget)
                    .transition().duration(200)
                    .attr("r", 8)
                    .style("opacity", 1);
            })
            .on("mouseout", (event) => {
                tooltip.transition().duration(500).style("opacity", 0);
                d3.select(event.currentTarget)
                    .transition().duration(200)
                    .attr("r", 5)
                    .style("opacity", 0.6);
            });

        // Grid lines (optional visuals)
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""))
            .style("stroke-dasharray", "3,3")
            .style("stroke-opacity", 0.1);

    }, [chartData, dimensions]);

    return (
        <div ref={wrapperRef} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#1e293b' }}>
            <svg ref={svgRef}></svg>
        </div>
    );
}
