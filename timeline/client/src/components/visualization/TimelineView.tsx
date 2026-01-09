import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useUIStore } from '../../stores/uiStore';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import './TimelineView.css';
// import type { TimelineEvent } from '../../schemas/events';

// Constants
const MARGIN = { top: 20, right: 30, bottom: 30, left: 40 };

export function TimelineView() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const dimensions = useResizeObserver(wrapperRef);

    // Data Load
    const events = useLiveQuery(() => db.events.orderBy('date').toArray()) || [];

    // Store State
    // const timeRange = useUIStore(s => s.timeRange);
    // const setTimeRange = useUIStore(s => s.setTimeRange);
    const selectedEventIds = useUIStore(s => s.selectedEventIds);
    const selectEvent = useUIStore(s => s.selectEvent);

    // Initial Full Range (derived from events if not set)
    const fullTimeDomain = useMemo(() => {
        if (!events.length) return [new Date(), new Date()];
        const start = new Date(events[0].date);
        const end = new Date(events[events.length - 1].date);
        // Pad by 5%
        const padding = (end.getTime() - start.getTime()) * 0.05;
        return [new Date(start.getTime() - padding), new Date(end.getTime() + padding)] as [Date, Date];
    }, [events.length]); // Dependency on length sufficient for creating domain once

    // Current Zoom State (D3 Transform)
    const [currentTransform, setCurrentTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);


    // D3 Render Effect
    useEffect(() => {
        if (!svgRef.current || !wrapperRef.current || !events.length) return;
        const { width, height } = dimensions;
        if (width === 0 || height === 0) return;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll('*').remove();

        // 0. Constants & Config
        const GROUPS = ['legislative', 'judicial', 'financial', 'corporate', 'political', 'cultural', 'other'];
        const groupColorScale = d3.scaleOrdinal<string>()
            .domain(GROUPS)
            .range(['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#95a5a6']);

        // 1. Scales
        const xScale = d3.scaleTime()
            .domain(fullTimeDomain)
            .range([MARGIN.left, width - MARGIN.right]);

        // Semantic Zoom State
        const k = currentTransform.k;
        const newXScale = currentTransform.rescaleX(xScale);

        // Y-Axis: Categorical Lanes
        const yScale = d3.scalePoint()
            .domain(GROUPS)
            .range([MARGIN.top, height - MARGIN.bottom])
            .padding(0.5);

        // 2. Zoom Behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 1000])
            .extent([[MARGIN.left, MARGIN.top], [width - MARGIN.right, height - MARGIN.bottom]])
            .translateExtent([[MARGIN.left, -Infinity], [width - MARGIN.right, Infinity]])
            .on('zoom', (event) => {
                setCurrentTransform(event.transform);
            });

        svg.call(zoom as unknown as (selection: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void)
            .on("dblclick.zoom", null);

        // 3. Draw Axes & Grid
        const xAxis = d3.axisBottom(newXScale);

        // Grid lines for lanes
        const gridG = svg.append('g').attr('class', 'grid');
        GROUPS.forEach(group => {
            const y = yScale(group);
            if (y !== undefined) {
                gridG.append('line')
                    .attr('x1', MARGIN.left)
                    .attr('x2', width - MARGIN.right)
                    .attr('y1', y)
                    .attr('y2', y)
                    .attr('stroke', '#334155')
                    .attr('stroke-width', 1)
                    .attr('stroke-dasharray', '4,4');

                // Lane Label
                gridG.append('text')
                    .attr('x', MARGIN.left - 10)
                    .attr('y', y + 4)
                    .attr('text-anchor', 'end')
                    .style('fill', '#94a3b8')
                    .style('font-size', '10px')
                    .text(group.charAt(0).toUpperCase() + group.slice(1));
            }
        });


        svg.append('g')
            .attr('transform', `translate(0, ${height - MARGIN.bottom})`)
            .call(xAxis)
            .style('color', '#94a3b8');

        // 4. Data Filtering & Optimization
        const [viewStart, viewEnd] = newXScale.domain();
        const visibleEvents = events.filter(e => {
            const d = new Date(e.date);
            return d >= viewStart && d <= viewEnd;
        });

        // Heuristic: If we have too many events, force aggregation regardless of zoom level
        // This prevents the "slow rendering" the user reported.
        const FORCE_AGGREGATION = visibleEvents.length > 800 || k < 1.5;

        // 5. Render
        if (FORCE_AGGREGATION) {
            // Level 0: Histogram (Macro / Dense)
            // Dynamic thresholds based on view width to keep bars looking nice
            const tickCount = Math.min(width / 10, 100); // 1 bar per ~10px max
            const bucketGenerator = d3.bin<TimelineEvent, Date>()
                .value(d => new Date(d.date))
                .domain(newXScale.domain() as [Date, Date])
                .thresholds(newXScale.ticks(tickCount));

            const buckets = bucketGenerator(visibleEvents);
            const maxCount = d3.max(buckets, b => b.length) || 1;

            // Linear Y scale for bar height
            const barHeightScale = d3.scaleLinear()
                .domain([0, maxCount])
                .range([0, height - MARGIN.bottom - MARGIN.top]);

            const bars = svg.append('g').attr('class', 'histogram');

            bars.selectAll('rect')
                .data(buckets)
                .enter()
                .append('rect')
                .attr('x', d => newXScale(d.x0 || new Date()))
                .attr('y', d => (height - MARGIN.bottom) - barHeightScale(d.length))
                .attr('width', d => Math.max(1, newXScale(d.x1 || new Date()) - newXScale(d.x0 || new Date()) - 1))
                .attr('height', d => barHeightScale(d.length))
                .attr('fill', '#3b82f6')
                .attr('opacity', 0.6)
                // Add simple tooltip for density
                .append('title')
                .text(d => `${d.length} events`);

            // Hide Grid overlay in dense mode to reduce noise
            gridG.style('opacity', 0.1);

            // Show "Zoom In" hint if appropriate
            if (visibleEvents.length > 800) {
                svg.append('text')
                    .attr('x', width / 2)
                    .attr('y', MARGIN.top + 20)
                    .attr('text-anchor', 'middle')
                    .style('fill', '#64748b')
                    .style('font-size', '12px')
                    .text(`${visibleEvents.length} events active · Zoom in to see details`);
            }

        } else {
            // Level 1: Individual Events (Micro)
            gridG.style('opacity', 1);

            const g = svg.append('g');

            g.selectAll('circle')
                .data(visibleEvents)
                .enter()
                .append('circle')
                .attr('cx', d => newXScale(new Date(d.date)))
                .attr('cy', d => {
                    const baseY = yScale(d.group || 'other') || height / 2;
                    // Jitter
                    return baseY + (Math.random() * 20 - 10);
                })
                .attr('r', k < 3 ? 4 : 6)
                .attr('fill', d => groupColorScale(d.group || 'other'))
                .attr('stroke', d => selectedEventIds.has(d.id) ? '#fff' : 'none')
                .attr('stroke-width', 2)
                .attr('opacity', 0.8)
                .style('cursor', 'pointer')
                .on('click', (e, d) => {
                    e.stopPropagation();
                    selectEvent(d.id, e.shiftKey || e.metaKey);
                })
                .append('title')
                .text(d => d.title);

            // Level 2: Labels
            if (k > 4 && visibleEvents.length < 100) {
                g.selectAll('text.label')
                    .data(visibleEvents)
                    .enter()
                    .append('text')
                    .attr('x', d => newXScale(new Date(d.date)))
                    .attr('y', d => (yScale(d.group || 'other') || height / 2) - 12)
                    .text(d => d.title.length > 25 ? d.title.substring(0, 25) + '...' : d.title)
                    .style('fill', '#e2e8f0')
                    .style('font-size', '10px')
                    .style('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .style('text-shadow', '0 1px 2px rgba(0,0,0,0.8)');
            }
        }

    }, [events, dimensions, fullTimeDomain, currentTransform, selectedEventIds]);


    return (
        <div ref={wrapperRef} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#0f172a' }}>
            <svg ref={svgRef} style={{ display: 'block' }}></svg>
            <div style={{ position: 'absolute', top: 10, left: 10, color: '#64748b', fontSize: '10px' }}>
                Timeline Prototype v0.1 | Zoom: {currentTransform.k.toFixed(2)}x
            </div>
        </div>
    );
}
