
import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useResizeObserver } from '../../hooks/useResizeObserver';

interface HierarchyNode {
    name: string;
    value?: number;
    children?: HierarchyNode[];
}

export function SunburstView() {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dimensions = useResizeObserver(wrapperRef, 600, 600);
    const events = useLiveQuery(() => db.events.toArray()) || [];


    // Hierarchy Data Calculation
    const rootData = useMemo<d3.HierarchyNode<HierarchyNode> | null>(() => {
        if (!events.length) return null;

        const grouped = d3.group(events, d => d.type || 'Unclassified');

        const hierarchyData: HierarchyNode = {
            name: "Timeline",
            children: Array.from(grouped, ([key, values]) => ({
                name: key,
                children: values.map(e => ({
                    name: e.title,
                    value: 1
                }))
            }))
        };

        const root = d3.hierarchy<HierarchyNode>(hierarchyData)
            .sum(d => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        return root;
    }, [events]);

    // Render D3
    useEffect(() => {
        if (!svgRef.current || !rootData) return;

        const width = dimensions.width;
        const height = dimensions.height;
        const radius = width / 6;

        const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, (rootData.children?.length || 0) + 1));

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height]);

        svg.selectAll("*").remove();

        // Type augmentation for d3 partition layout
        interface PartitionNode extends d3.HierarchyRectangularNode<HierarchyNode> {
            current?: PartitionNode;
            target?: PartitionNode;
        }

        const partition = d3.partition<HierarchyNode>()
            .size([2 * Math.PI, radius * radius]);

        const root = partition(rootData) as PartitionNode;
        root.each(d => d.current = d);

        const arc = d3.arc<PartitionNode>()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius * 1.5)
            .innerRadius(d => Math.sqrt(d.y0))
            .outerRadius(d => Math.sqrt(d.y1 - 1));

        const g = svg.append("g");

        g.selectAll("path")
            .data(root.descendants().filter(d => d.depth))
            .join("path")
            .attr("fill", d => {
                let curr: PartitionNode | null = d;
                while (curr && curr.depth > 1) curr = curr.parent;
                return color(curr?.data.name || 'Unknown');
            })
            .attr("fill-opacity", d => (d.children ? 0.6 : 0.4))
            .attr("d", d => arc(d.current!));

        g.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .selectAll("text")
            .data(root.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
            .join("text")
            .attr("transform", function (d) {
                const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
                const y = Math.sqrt(d.y0 + d.y1);
                return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
            })
            .attr("dy", "0.35em")
            .text(d => d.data.name.substring(0, 15))
            .style("font-size", "10px")
            .style("fill", "#333");

    }, [rootData, dimensions]);

    return (
        <div ref={wrapperRef} style={{ width: '100%', height: '100%', overflow: 'hidden', background: 'white' }}>
            <svg ref={svgRef} style={{ maxWidth: '100%', maxHeight: '100%', font: '10px sans-serif' }}></svg>
        </div>
    );
}
