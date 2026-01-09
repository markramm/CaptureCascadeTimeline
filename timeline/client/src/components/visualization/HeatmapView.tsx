import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { VisualizationProps, GraphSettings } from '../../types/visualization';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { useGraphData } from '../../hooks/useGraphData';

export function HeatmapView({
    minConnectionStrength = 0.5,
    maxNodes = 50,
    settings
}: VisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dimensions = useResizeObserver(wrapperRef, 800, 500);
    const events = useLiveQuery(() => db.events.toArray()) || [];


    // Data Processing: Aggregating Events by Date (Month) and Type
    const effectiveSettings = useMemo(() => settings || {
        maxNodes,
        minStrength: minConnectionStrength,
        searchText: '',
        selectedTypes: [],
        layout: 'force',
        showLabels: true,
        showMetrics: false,
        viewMode: 'heatmap'
    } as GraphSettings, [settings, maxNodes, minConnectionStrength]);

    const { nodes } = useGraphData(events, effectiveSettings);

    const heatmapData = useMemo(() => {

        // Use filtered nodes to build heatmap
        if (!nodes.length) return { filteredData: [], xDomain: [], yDomain: [] };

        // 1. Group by Year-Month and Type
        const grouped = d3.rollup(
            nodes, // Use filtered nodes
            (v) => v.length,
            (d) => {
                const date = new Date(d.date || new Date().toISOString());
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            },
            (d) => d.group || 'Uncategorized' // Use standardized group from GraphLogic
        );

        // 2. Flatten for D3
        const flatData: { date: string; type: string; count: number }[] = [];
        const allDates = new Set<string>();
        const allTypes = new Set<string>();

        grouped.forEach((typesMap, dateKey) => {
            allDates.add(dateKey);
            typesMap.forEach((count, typeKey) => {
                allTypes.add(typeKey);
                flatData.push({ date: dateKey, type: typeKey, count });
            });
        });

        // 3. Sort Domains
        const sortedDates = Array.from(allDates).sort();
        const sortedTypes = Array.from(allTypes).sort();

        return {
            data: flatData,
            xDomain: sortedDates,
            yDomain: sortedTypes
        };

    }, [nodes]);

    // Render D3
    useEffect(() => {
        if (!svgRef.current || !heatmapData.data || !heatmapData.data.length) return;

        const margin = { top: 30, right: 30, bottom: 50, left: 100 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr("width", dimensions.width)
            .attr("height", dimensions.height);

        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleBand()
            .range([0, width])
            .domain(heatmapData.xDomain)
            .padding(0.05);

        const y = d3.scaleBand()
            .range([height, 0])
            .domain(heatmapData.yDomain)
            .padding(0.05);

        const colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateInferno)
            .domain([0, (d3.max(heatmapData.data, (d) => d.count) as number) || 1]);

        // Axes
        g.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickFormat((d) => {
                // Show only every Nth label if too crowded
                const total = heatmapData.xDomain.length;
                const index = heatmapData.xDomain.indexOf(d);
                if (total > 20 && index % Math.ceil(total / 20) !== 0) return "";
                return d;
            }))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)")
            .style("fill", "#64748b");

        g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", "#64748b");

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.8)")
            .style("color", "white")
            .style("padding", "5px 10px")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", "12px");

        // Cells
        g.selectAll("rect")
            .data(heatmapData.data, (d) => d.date + ':' + d.type)
            .enter()
            .append("rect")
            .attr("x", d => x(d.date) || 0)
            .attr("y", d => y(d.type) || 0)
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => colorScale(d.count))
            .style("cursor", "pointer")
            .on("mouseover", (_event, d) => {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`
                    <strong>${d.date}</strong><br/>
                    Type: ${d.type}<br/>
                    Events: ${d.count}
                `)
                    .style("left", (_event.pageX + 10) + "px")
                    .style("top", (_event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Legend
        // (Simplified legend)

    }, [heatmapData, dimensions]);

    return (
        <div ref={wrapperRef} style={{ width: '100%', height: '100%', overflow: 'hidden', background: 'white' }}>
            <svg ref={svgRef}></svg>
        </div>
    );
}
