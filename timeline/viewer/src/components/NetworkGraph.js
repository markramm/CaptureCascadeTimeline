import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { calculateDegreeCentrality, calculateBetweennessCentrality, calculateClusteringCoefficient } from '../utils/graphMetrics';
import './NetworkGraph.css';

const NetworkGraph = ({
  events,
  searchQuery,
  selectedActor,
  selectedTag,
  activeCategories,
  // Props from App.js / Sidebar
  graphLayout = 'force',
  minConnectionStrength = 0.5,
  showMetrics = false,
  maxNodes = 200,
  showLabels = false,
  onMaxNodesChange,
  onConnectionStrengthChange,
  onShowMetricsChange,
  onShowLabelsChange,
  onGraphLayoutChange
}) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLayoutFrozen, setIsLayoutFrozen] = useState(false);
  const [filterType] = useState('important'); // Keep filterType internal for now or move next
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);

  // Reset local filters when global search changes
  useEffect(() => {
    setHighlightedNodeId(null);
    setSelectedNode(null);
  }, [searchQuery, events]);


  // Category colors and definitions
  const categories = [
    { id: 'judicial', label: 'Judicial', color: '#e74c3c' },
    { id: 'regulatory', label: 'Regulatory', color: '#3498db' },
    { id: 'financial', label: 'Financial', color: '#2ecc71' },
    { id: 'political', label: 'Political', color: '#f39c12' },
    { id: 'intelligence', label: 'Intelligence', color: '#9b59b6' },
    { id: 'criminal', label: 'Criminal', color: '#c0392b' },
    { id: 'actor', label: 'Actor', color: '#95a5a6' },
    { id: 'other', label: 'Other', color: '#7f8c8d' }
  ];

  useEffect(() => {
    if (!events || events.length === 0) {
      // Clear graph if no events
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const getImpact = (event) => {
      // Use the importance field if available, otherwise calculate
      if (event.importance !== undefined) {
        return event.importance;
      }

      // Fallback calculation if importance field is missing
      let impact = 5;
      if (event.tags?.includes('constitutional-crisis')) impact = Math.max(impact, 9);
      if (event.tags?.includes('democracy-threat')) impact = Math.max(impact, 8);
      if (event.tags?.includes('major-scandal')) impact = Math.max(impact, 8);
      if (event.tags?.includes('criminal-investigation')) impact = Math.max(impact, 7);
      if (event.monitoring_status === 'active') impact = Math.max(impact, 7);
      // Recent events get a slight boost
      const eventDate = new Date(event.date);
      const monthsAgo = (new Date() - eventDate) / (1000 * 60 * 60 * 24 * 30);
      if (monthsAgo < 1) impact = Math.min(impact + 1, 10);
      return impact;
    };

    const getEventGroup = (event) => {
      // Group events by primary category
      if (event.tags?.includes('judicial')) return 'judicial';
      if (event.tags?.includes('regulatory')) return 'regulatory';
      if (event.tags?.includes('financial')) return 'financial';
      if (event.tags?.includes('political')) return 'political';
      if (event.tags?.includes('intelligence')) return 'intelligence';
      if (event.tags?.includes('criminal')) return 'criminal';
      return 'other';
    };

    // Apply local refinement filters
    const applyLocalFilters = (events) => {
      let filtered = [...events];

      // Actor filter
      if (selectedActor) {
        filtered = filtered.filter(event =>
          event.actors?.includes(selectedActor)
        );
      }

      // Tag filter
      if (selectedTag) {
        filtered = filtered.filter(event =>
          event.tags?.includes(selectedTag)
        );
      }

      // Category filter
      if (!activeCategories.has('all') && activeCategories.size > 0) {
        filtered = filtered.filter(event => {
          const group = getEventGroup(event);
          return activeCategories.has(group);
        });
      }

      return filtered;
    };

    // Build graph data from events
    const buildGraphData = (events, filter) => {
      const nodes = [];
      const links = [];
      const nodeMap = new Map();

      // Events are already filtered globally by App.js (searchQuery, date, etc.)
      let filteredEvents = applyLocalFilters(events);

      // Sort events by impact and take only the most important ones
      if (filter === 'important' || filter === 'money') {
        filteredEvents = filteredEvents
          .map(event => ({ ...event, impact: getImpact(event) }))
          .sort((a, b) => b.impact - a.impact)
          .slice(0, maxNodes);
      }

      // Extract unique actors
      const actors = new Set();
      const actorEventCount = new Map();

      filteredEvents.forEach(event => {
        // Add event as node
        const eventNode = {
          id: event.id,
          type: 'event',
          label: event.title?.substring(0, 25) + '...',
          fullTitle: event.title,
          date: event.date,
          tags: event.tags || [],
          actors: event.actors || [],
          impact: getImpact(event),
          group: getEventGroup(event),
          highlighted: searchQuery && event.title?.toLowerCase().includes(searchQuery.toLowerCase())
        };
        nodes.push(eventNode);
        nodeMap.set(event.id, eventNode);

        // Count actor involvement
        if (event.actors) {
          event.actors.forEach(actor => {
            actorEventCount.set(actor, (actorEventCount.get(actor) || 0) + 1);
          });
        }
      });

      // Only add actors that appear in multiple events (reduces clutter)
      const minActorEvents = filter === 'actors' ? 1 : 2;
      filteredEvents.forEach(event => {
        if (event.actors) {
          event.actors.forEach(actor => {
            if (actorEventCount.get(actor) >= minActorEvents && !actors.has(actor)) {
              actors.add(actor);
              const actorNode = {
                id: `actor-${actor}`,
                type: 'actor',
                label: actor.length > 20 ? actor.substring(0, 18) + '...' : actor,
                fullName: actor,
                eventCount: actorEventCount.get(actor),
                group: 'actor',
                highlighted: selectedActor === actor
              };
              nodes.push(actorNode);
              nodeMap.set(actorNode.id, actorNode);
            }

            // Create link between actor and event
            if (actors.has(actor)) {
              links.push({
                source: `actor-${actor}`,
                target: event.id,
                type: 'involved',
                strength: 0.8
              });
            }
          });
        }
      });

      // Find only strong temporal connections (events within 3 days)
      filteredEvents.forEach((event, i) => {
        filteredEvents.slice(i + 1).forEach(otherEvent => {
          const daysDiff = Math.abs(
            new Date(event.date) - new Date(otherEvent.date)
          ) / (1000 * 60 * 60 * 24);

          if (daysDiff <= 3) {
            const strength = 1 - (daysDiff / 3);
            if (strength >= minConnectionStrength) {
              links.push({
                source: event.id,
                target: otherEvent.id,
                type: 'temporal',
                strength: strength,
                daysDiff: Math.round(daysDiff)
              });
            }
          }
        });
      });

      // Only strong tag-based connections (multiple shared tags)
      filteredEvents.forEach((event, i) => {
        if (event.tags && event.tags.length > 0) {
          filteredEvents.slice(i + 1).forEach(otherEvent => {
            if (otherEvent.tags && otherEvent.tags.length > 0) {
              const sharedTags = event.tags.filter(tag =>
                Array.isArray(otherEvent.tags) && otherEvent.tags.includes(tag)
              );
              if (sharedTags.length >= 2) { // Only if 2+ shared tags
                const strength = sharedTags.length / Math.min(event.tags.length, otherEvent.tags.length);
                if (strength >= minConnectionStrength) {
                  links.push({
                    source: event.id,
                    target: otherEvent.id,
                    type: 'thematic',
                    strength: strength,
                    tags: sharedTags
                  });
                }
              }
            }
          });
        }
      });

      let result = { nodes, links };
      // Apply additional filters
      if (filter === 'money') {
        const moneyNodes = nodes.filter(node => {
          if (node.type === 'actor') return true;
          return node.tags?.some(tag =>
            ['crypto', 'money-laundering', 'financial', 'corruption', 'fraud'].includes(tag)
          );
        });

        const nodeIds = new Set(moneyNodes.map(n => n.id));
        const moneyLinks = links.filter(link =>
          nodeIds.has(link.source) && nodeIds.has(link.target)
        );

        result = { nodes: moneyNodes, links: moneyLinks };
      }

      if (filter === 'actors') {
        // Show only nodes with actor connections
        // const actorNodeIds = new Set(nodes.filter(n => n.type === 'actor').map(n => n.id));
        const connectedEventIds = new Set(
          links
            .filter(l => l.type === 'involved')
            .map(l => [l.source, l.target])
            .flat()
        );

        const actorNodes = nodes.filter(n =>
          n.type === 'actor' || connectedEventIds.has(n.id)
        );

        const nodeIds = new Set(actorNodes.map(n => n.id));
        const actorLinks = links.filter(link =>
          nodeIds.has(link.source) && nodeIds.has(link.target)
        );

        result = { nodes: actorNodes, links: actorLinks };
      }

      if (filter === 'events') {
        const eventNodes = nodes.filter(n => n.type === 'event');
        const nodeIds = new Set(eventNodes.map(n => n.id));
        const eventLinks = links.filter(link =>
          link.type !== 'involved' && nodeIds.has(link.source) && nodeIds.has(link.target)
        );

        result = { nodes: eventNodes, links: eventLinks };
      }

      // Calculate Metrics if enabled
      if (showMetrics) {
        const degree = calculateDegreeCentrality(result.nodes, result.links);
        const betweenness = calculateBetweennessCentrality(result.nodes, result.links);
        const clustering = calculateClusteringCoefficient(result.nodes, result.links);

        result.nodes.forEach(n => {
          n.metrics = {
            degree: degree.get(n.id) || 0,
            betweenness: betweenness.get(n.id) || 0,
            clustering: clustering.get(n.id) || 0
          };
        });
      }

      return result;
    };

    const renderForceLayout = (graphData) => {
      const width = svgRef.current.clientWidth || 800;
      const height = 600;

      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height);

      // Show stats
      const statsText = `Showing ${graphData.nodes.length} nodes, ${graphData.links.length} connections`;
      const statsG = svg.append('g').attr('class', 'stats-text');
      statsG.append('text')
        .attr('x', 10)
        .attr('y', 20)
        .attr('font-size', 12)
        .attr('fill', '#666')
        .text(statsText);

      // Create force simulation with better parameters for fewer nodes
      const simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links)
          .id(d => d.id)
          .distance(d => 80 + (40 * (1 - (d.strength || 0))))
        )
        .force('charge', d3.forceManyBody()
          .strength(d => d.type === 'actor' ? -400 : -600)
        )
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => {
          if (d.type === 'actor') return 25;
          return 15 + (d.impact || 1) * 3;
        }))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05));

      // Store simulation reference for freeze/unfreeze functionality
      simulationRef.current = simulation;

      // If layout is frozen, stop the simulation immediately
      if (isLayoutFrozen) {
        simulation.stop();
      }

      // Create container groups
      const g = svg.append('g');

      // Add zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      // Initialize zoom with a slight zoom out to see more context
      svg.call(zoom)
        .call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.6).translate(-width / 2, -height / 2));

      // Color scales
      const colorScale = d3.scaleOrdinal()
        .domain(['judicial', 'regulatory', 'financial', 'political', 'intelligence', 'criminal', 'actor', 'other'])
        .range(['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#c0392b', '#95a5a6', '#7f8c8d']);

      // Draw links with better visibility
      const links = g.append('g')
        .selectAll('line')
        .data(graphData.links)
        .enter().append('line')
        .attr('class', d => `link ${d.type}`)
        .attr('stroke', d => {
          if (d.type === 'temporal') return '#ffd700';
          if (d.type === 'thematic') return '#87ceeb';
          if (d.type === 'involved') return '#ddd';
          return '#999';
        })
        .attr('stroke-opacity', d => {
          if (d.type === 'involved') return 0.3;
          return 0.4 + (d.strength || 0) * 0.3;
        })
        .attr('stroke-width', d => {
          if (d.type === 'involved') return 1;
          return 1.5 + (d.strength || 0) * 2;
        });

      // Add link tooltips
      links.append('title')
        .text(d => {
          if (d.type === 'temporal') return `${d.daysDiff} days apart`;
          if (d.type === 'thematic') return `Shared: ${d.tags?.join(', ') || ''}`;
          if (d.type === 'involved') return 'Actor involved';
          return '';
        });

      // Draw nodes with better sizing
      const nodes = g.append('g')
        .selectAll('circle')
        .data(graphData.nodes)
        .enter().append('circle')
        .attr('class', d => `node ${d.type}`)
        .attr('r', d => {
          if (d.type === 'actor') return 3 + Math.min(d.eventCount || 1, 5) * 1;
          return 3.5 + Math.min(d.impact || 1, 8) * 0.8;
        })
        .attr('fill', d => colorScale(d.group))
        .attr('stroke', d => d.highlighted ? '#ff0000' : '#fff')
        .attr('stroke-width', d => d.highlighted ? 3 : 1)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation();
          setSelectedNode(d);
          setHighlightedNodeId(d.id);
          highlightConnections(d);
        })
        .on('mouseover', function (event, d) {
          // Show tooltip on hover
          const tooltip = d3.select('body').append('div')
            .attr('class', 'node-tooltip')
            .style('position', 'absolute')
            .style('padding', '10px')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('max-width', '300px')
            .html(() => {
              if (d.type === 'actor') {
                return `<strong>${d.fullName || d.label}</strong><br/>Events: ${d.eventCount || 0}`;
              }
              return `<strong>${d.fullTitle || d.label}</strong><br/>
                      Date: ${d.date}<br/>
                      Impact: ${d.impact}/10<br/>
                      ${d.tags?.length ? `Tags: ${d.tags.slice(0, 3).join(', ')}` : ''}`;
            });

          tooltip.style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function () {
          d3.selectAll('.node-tooltip').remove();
        })
        .call(d3.drag()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded));

      // Highlight searched/filtered nodes
      if (highlightedNodeId) {
        nodes.filter(d => d.id === highlightedNodeId)
          .attr('stroke', '#ff0000')
          .attr('stroke-width', 4);
      }

      // Add labels only for important nodes or when enabled
      let labels = null;
      if (showLabels) {
        labels = g.append('g')
          .selectAll('text')
          .data(graphData.nodes.filter(d =>
            d.type === 'actor' || d.impact >= 5 || d.highlighted
          ))
          .enter().append('text')
          .text(d => d.label)
          .attr('font-size', 11) // Slightly larger
          .attr('dx', 8)
          .attr('dy', 3)
          .attr('fill', '#ffffff')
          .attr('stroke', '#000000')
          .attr('stroke-width', 3)
          .attr('stroke-linejoin', 'round')
          .attr('paint-order', 'stroke') // The secret sauce for haloes
          .style('font-weight', '500')
          .style('pointer-events', 'none')
          .style('user-select', 'none');
      }

      simulation.on('tick', () => {
        links
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        nodes
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

        if (labels) {
          labels
            .attr('x', d => d.x)
            .attr('y', d => d.y);
        }
      });

      // Drag functions
      function dragStarted(event) {
        if (!isLayoutFrozen && !event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragEnded(event) {
        if (!isLayoutFrozen && !event.active) simulation.alphaTarget(0);
        // Keep nodes fixed if layout is frozen
        if (isLayoutFrozen) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        } else {
          event.subject.fx = null;
          event.subject.fy = null;
        }
      }

      function highlightConnections(node) {
        // Fade out non-connected nodes and links
        const connectedNodes = new Set([node.id]);

        links.style('opacity', function (link) {
          if (link.source.id === node.id || link.target.id === node.id) {
            connectedNodes.add(link.source.id);
            connectedNodes.add(link.target.id);
            return 1;
          }
          return 0.1;
        });

        nodes.style('opacity', n =>
          connectedNodes.has(n.id) ? 1 : 0.2
        );
      }

      // Click on background to reset highlighting
      svg.on('click', function (event) {
        if (event.target === this) {
          links.style('opacity', d => {
            if (d.type === 'involved') return 0.3;
            return 0.4 + (d.strength || 0) * 0.3;
          });
          nodes.style('opacity', 1);
          setSelectedNode(null);
          setHighlightedNodeId(null);
        }
      });
    };

    const renderTimelineLayout = (graphData) => {
      const width = svgRef.current.clientWidth || 800;
      const height = 600;
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height);

      // Clear previous graph
      svg.selectAll('*').remove();

      // Show stats
      const statsText = `Timeline: ${graphData.nodes.length} nodes, ${graphData.links.length} connections`;
      const statsG = svg.append('g').attr('class', 'stats-text');
      statsG.append('text')
        .attr('x', 10)
        .attr('y', 20)
        .attr('font-size', 12)
        .attr('fill', '#666')
        .text(statsText);

      // Filter and sort nodes by date
      const eventNodes = graphData.nodes
        .filter(n => n.type === 'event' && n.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const actorNodes = graphData.nodes.filter(n => n.type === 'actor');

      // Create date scale for horizontal positioning
      const dates = eventNodes.map(n => new Date(n.date));
      const xScale = d3.scaleTime()
        .domain(d3.extent(dates))
        .range([80, width - 80]);

      // Create container group
      const g = svg.append('g');

      // Add zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom);

      // Color scale
      const colorScale = d3.scaleOrdinal()
        .domain(['judicial', 'regulatory', 'financial', 'political', 'intelligence', 'criminal', 'actor', 'other'])
        .range(['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#c0392b', '#95a5a6', '#7f8c8d']);

      // Position event nodes chronologically
      eventNodes.forEach((node, i) => {
        node.x = xScale(new Date(node.date));
        // Arrange in multiple rows to prevent overlap, grouped by importance
        const importance = node.impact || 5;
        if (importance >= 8) {
          node.y = 150; // Top row for critical events
        } else if (importance >= 6) {
          node.y = 200; // Middle row for important events
        } else {
          node.y = 250; // Bottom row for regular events
        }

        // Add slight vertical jitter to prevent exact overlap
        node.y += (i % 3 - 1) * 15;

        // Fix positions for timeline layout
        node.fx = node.x;
        node.fy = node.y;
      });

      // Position actor nodes at the top
      actorNodes.forEach((node, i) => {
        node.x = 100 + (i * 120) % (width - 200);
        node.y = 80;
        node.fx = node.x;
        node.fy = node.y;
      });

      // Draw timeline axis
      const timelineAxis = g.append('g').attr('class', 'timeline-axis');

      // Add horizontal timeline line
      timelineAxis.append('line')
        .attr('x1', 80)
        .attr('y1', 300)
        .attr('x2', width - 80)
        .attr('y2', 300)
        .attr('stroke', '#ddd')
        .attr('stroke-width', 2);

      // Add date ticks
      const tickCount = Math.min(8, eventNodes.length);
      const tickDates = xScale.ticks(tickCount);

      timelineAxis.selectAll('.tick')
        .data(tickDates)
        .enter().append('g')
        .attr('class', 'tick')
        .attr('transform', d => `translate(${xScale(d)}, 300)`)
        .each(function (d) {
          const tick = d3.select(this);
          tick.append('line')
            .attr('y1', -5)
            .attr('y2', 5)
            .attr('stroke', '#999');
          tick.append('text')
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', 10)
            .attr('fill', '#666')
            .text(d3.timeFormat('%Y-%m')(d));
        });

      // Draw links with temporal emphasis
      const links = g.append('g')
        .selectAll('line')
        .data(graphData.links)
        .enter().append('line')
        .attr('class', d => `link ${d.type}`)
        .attr('x1', d => d.source.x || 0)
        .attr('y1', d => d.source.y || 0)
        .attr('x2', d => d.target.x || 0)
        .attr('y2', d => d.target.y || 0)
        .attr('stroke', d => {
          if (d.type === 'temporal') return '#ffd700';
          if (d.type === 'thematic') return '#87ceeb';
          if (d.type === 'involved') return '#ddd';
          return '#999';
        })
        .attr('stroke-opacity', d => {
          if (d.type === 'temporal') return 0.8; // Emphasize temporal connections in timeline
          if (d.type === 'involved') return 0.4;
          return 0.3;
        })
        .attr('stroke-width', d => {
          if (d.type === 'temporal') return 3; // Thicker for temporal in timeline
          if (d.type === 'involved') return 1;
          return 1.5;
        });

      // Add link tooltips
      links.append('title')
        .text(d => {
          if (d.type === 'temporal') return `${d.daysDiff} days apart`;
          if (d.type === 'thematic') return `Shared: ${d.tags?.join(', ') || ''}`;
          if (d.type === 'involved') return 'Actor involved';
          return '';
        });

      // Draw nodes
      const nodes = g.append('g')
        .selectAll('circle')
        .data([...eventNodes, ...actorNodes])
        .enter().append('circle')
        .attr('class', d => `node ${d.type}`)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => {
          if (d.type === 'actor') return 8 + Math.min(d.eventCount || 1, 5) * 2;
          return 8 + Math.min(d.impact || 1, 8) * 1.5;
        })
        .attr('fill', d => colorScale(d.group))
        .attr('stroke', d => d.highlighted ? '#ff0000' : '#fff')
        .attr('stroke-width', d => d.highlighted ? 3 : 2)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation();
          setSelectedNode(d);
          setHighlightedNodeId(d.id);
          highlightConnections(d);
        })
        .on('mouseover', function (event, d) {
          // Show tooltip
          const tooltip = d3.select('body').append('div')
            .attr('class', 'node-tooltip')
            .style('position', 'absolute')
            .style('padding', '10px')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('max-width', '300px')
            .html(() => {
              if (d.type === 'actor') {
                return `<strong>${d.fullName || d.label}</strong><br/>Events: ${d.eventCount || 0}`;
              }
              return `<strong>${d.fullTitle || d.label}</strong><br/>
                      Date: ${d.date}<br/>
                      Impact: ${d.impact}/10<br/>
                      ${d.tags?.length ? `Tags: ${d.tags.slice(0, 3).join(', ')}` : ''}`;
            });

          tooltip.style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function () {
          d3.selectAll('.node-tooltip').remove();
        })
        .on('mouseout', function () {
          d3.selectAll('.node-tooltip').remove();
        });
      /* .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded)); */

      // Add labels for important events and all actors
      /* const labels = g.append('g')
        .selectAll('text')
        .data([...eventNodes, ...actorNodes].filter(d => 
          d.type === 'actor' || d.impact >= 7 || d.highlighted || showLabels
        ))
        .enter().append('text')
        .text(d => d.type === 'actor' ? d.label : d.label.substring(0, 20))
        .attr('x', d => d.x)
        .attr('y', d => d.y - (d.type === 'actor' ? 20 : 15))
        .attr('text-anchor', 'middle')
        .attr('font-size', d => d.type === 'actor' ? 11 : 9)
        .attr('fill', d => d.type === 'actor' ? '#333' : '#666')
        .attr('font-weight', d => d.type === 'actor' ? 'bold' : 'normal')
        .style('pointer-events', 'none')
        .style('user-select', 'none'); */

      // Store reference to simulation (null for timeline layout)
      simulationRef.current = null;

      function highlightConnections(node) {
        const connectedNodes = new Set([node.id]);

        links.style('opacity', function (link) {
          if (link.source.id === node.id || link.target.id === node.id) {
            connectedNodes.add(link.source.id);
            connectedNodes.add(link.target.id);
            return 1;
          }
          return 0.1;
        });

        nodes.style('opacity', n =>
          connectedNodes.has(n.id) ? 1 : 0.2
        );
      }
    };

    const renderCircularLayout = (graphData) => {
      const width = svgRef.current.clientWidth || 800;
      const height = 600;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 50;

      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height);

      svg.selectAll('*').remove();

      // Group nodes by primary category
      const groups = ['judicial', 'regulatory', 'financial', 'political', 'intelligence', 'criminal', 'actor', 'other'];
      const groupedNodes = {};
      groups.forEach(g => groupedNodes[g] = []);
      graphData.nodes.forEach(n => {
        const g = n.group || 'other';
        if (groupedNodes[g]) groupedNodes[g].push(n);
        else groupedNodes['other'].push(n);
      });

      // Calculate angles for each group
      const totalNodes = graphData.nodes.length;
      let currentAngle = 0;
      const nodesWithXY = [];

      groups.forEach(group => {
        const groupNodes = groupedNodes[group];
        if (groupNodes.length === 0) return;

        groupNodes.forEach((node, i) => {
          const angle = currentAngle + (i / groupNodes.length) * (2 * Math.PI * (groupNodes.length / totalNodes));
          // Distribute along radius with some jitter for size
          const r = radius * (0.8 + Math.random() * 0.2);
          node.x = centerX + r * Math.cos(angle);
          node.y = centerY + r * Math.sin(angle);
          if (node.type === 'actor') {
            // Actors closer to center
            node.x = centerX + (r * 0.5) * Math.cos(angle);
            node.y = centerY + (r * 0.5) * Math.sin(angle);
          }

          nodesWithXY.push(node);
        });
        currentAngle += 2 * Math.PI * (groupNodes.length / totalNodes);
      });

      const g = svg.append('g');

      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => g.attr('transform', event.transform));
      svg.call(zoom);

      // Draw Links
      g.append('g')
        .selectAll('line')
        .data(graphData.links)
        .enter().append('line')
        .attr('class', 'link')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .attr('stroke', '#333')
        .attr('stroke-opacity', 0.2);

      // Color Scale
      const colorScale = d3.scaleOrdinal()
        .domain(groups)
        .range(['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#c0392b', '#95a5a6', '#7f8c8d']);

      // Draw Nodes
      g.append('g')
        .selectAll('circle')
        .data(graphData.nodes)
        .enter().append('circle')
        .attr('r', d => d.type === 'actor' ? 4 : 3)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('fill', d => colorScale(d.group))
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5);
    };

    const renderGridLayout = (graphData) => {
      const width = svgRef.current.clientWidth || 800;
      const height = 600;
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height);

      svg.selectAll('*').remove();

      const g = svg.append('g');
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => g.attr('transform', event.transform));
      svg.call(zoom);

      // Sort by date or importance
      const sortedNodes = graphData.nodes.sort((a, b) => (b.impact || 0) - (a.impact || 0));

      const cols = Math.ceil(Math.sqrt(sortedNodes.length * (width / height)));

      sortedNodes.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        node.x = 50 + col * 40;
        node.y = 50 + row * 40;
      });

      // Draw Links
      g.append('g')
        .selectAll('line')
        .data(graphData.links)
        .enter().append('line')
        .attr('class', 'link')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .attr('stroke', '#333')
        .attr('stroke-opacity', 0.1);

      // Color Scale
      const colorScale = d3.scaleOrdinal()
        .domain(['judicial', 'regulatory', 'financial', 'political', 'intelligence', 'criminal', 'actor', 'other'])
        .range(['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#c0392b', '#95a5a6', '#7f8c8d']);

      // Draw Nodes
      g.append('g')
        .selectAll('circle')
        .data(graphData.nodes)
        .enter().append('circle')
        .attr('r', d => d.type === 'actor' ? 4 : 3)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('fill', d => colorScale(d.group))
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5);
    };

    // Build and render graph
    const graphData = buildGraphData(events, filterType);

    // Render based on layout type
    switch (graphLayout) {
      case 'timeline':
        renderTimelineLayout(graphData);
        break;
      case 'circular':
        renderCircularLayout(graphData);
        break;
      case 'grid':
        renderGridLayout(graphData);
        break;
      default:
        renderForceLayout(graphData);
    }
  }, [events, graphLayout, filterType, showLabels, showMetrics, maxNodes, minConnectionStrength,
    searchQuery, selectedActor, selectedTag, highlightedNodeId, activeCategories, isLayoutFrozen]);

  const handleCategoryToggle = (categoryId) => {
    console.log("Category toggling now handled via sidebar filters");
    // setActiveCategories call removed
  };

  const toggleLayoutFreeze = () => {
    if (simulationRef.current) {
      if (isLayoutFrozen) {
        // Unfreeze: restart the simulation
        simulationRef.current.alphaTarget(0.3).restart();
        setIsLayoutFrozen(false);
      } else {
        // Freeze: stop the simulation
        simulationRef.current.stop();
        setIsLayoutFrozen(true);
      }
    }
  };

  // resetFilters removed - handled by parent component

  return (
    <div className="network-graph-container">
      <button
        onClick={toggleLayoutFreeze}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '8px 16px',
          background: isLayoutFrozen ? 'rgba(231, 76, 60, 0.9)' : 'rgba(39, 174, 96, 0.9)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '13px',
          zIndex: 10,
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
        }}
        title={isLayoutFrozen ? 'Unfreeze' : 'Freeze'}
      >
        {isLayoutFrozen ? '❄️ Frozen' : '🌊 Live Force'}
      </button>

      <svg ref={svgRef} className="network-graph"></svg>

      {selectedNode && (
        <div className="node-details">
          <h3>
            {selectedNode.fullTitle || selectedNode.fullName || selectedNode.label}
          </h3>
          <button
            onClick={() => setSelectedNode(null)}
            className="close-btn"
            title="Close Details"
          >
            ×
          </button>

          <div className="node-meta">
            <p><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedNode.type}</span></p>
            {selectedNode.date && <p><strong>Date:</strong> {selectedNode.date}</p>}
            {selectedNode.impact && <p><strong>Impact Score:</strong> {selectedNode.impact}/10</p>}

            {showMetrics && selectedNode.metrics && (
              <div style={{ marginTop: '10px', padding: '8px', background: '#f0f4f8', borderRadius: '4px' }}>
                <h5 style={{ margin: '0 0 5px 0', fontSize: '13px', borderBottom: '1px solid #ddd' }}>Network Metrics</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '12px' }}>
                  <div>Degree: <strong>{selectedNode.metrics.degree}</strong></div>
                  <div>Centrality: <strong>{selectedNode.metrics.betweenness.toFixed(3)}</strong></div>
                  <div>Clustering: <strong>{selectedNode.metrics.clustering.toFixed(2)}</strong></div>
                </div>
              </div>
            )}
          </div>

          {selectedNode.type === 'actor' && (
            <div className="related-events" style={{ marginTop: '15px' }}>
              <p><strong>Related Events ({selectedNode.eventCount}):</strong></p>
              <ul style={{
                maxHeight: '200px',
                overflowY: 'auto',
                padding: 0,
                marginTop: '10px',
                listStyle: 'none'
              }}>
                {events
                  .filter(e => e.actors?.includes(selectedNode.fullName))
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(e => (
                    <li key={e.id} style={{
                      marginBottom: '8px',
                      padding: '8px',
                      background: '#f8fafc',
                      borderRadius: '4px',
                      borderLeft: '3px solid #64748b',
                      fontSize: '13px'
                    }}>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{e.date}</div>
                      {e.title}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {selectedNode.type === 'event' && (
            <>
              <p style={{ marginTop: '15px', lineHeight: '1.6' }}>{selectedNode.summary || 'No description available.'}</p>

              {selectedNode.actors && selectedNode.actors.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <strong>Actors:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                    {selectedNode.actors.map(actor => (
                      <span key={actor} style={{
                        background: '#e2e8f0',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#475569'
                      }}>
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.tags && selectedNode.tags.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <strong>Tags:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                    {selectedNode.tags.map(tag => (
                      <span key={tag} style={{
                        background: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#64748b',
                        border: '1px solid #cbd5e1'
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Overlay Controls for Node Count & Strength */}


      {/* Interactive Category Filter (replaces static legend) */}
      <div className="graph-legend" style={{ maxWidth: '180px' }}>
        <h4>Filter by Category</h4>
        <div
          className="legend-item clickable"
          onClick={() => handleCategoryToggle('all')}
          style={{
            cursor: 'pointer',
            opacity: activeCategories.has('all') ? 1 : 0.5,
            fontWeight: activeCategories.has('all') ? 'bold' : 'normal'
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            borderRadius: '3px',
            background: 'linear-gradient(45deg, #e74c3c, #3498db, #2ecc71, #f39c12)',
            marginRight: '8px'
          }}></span>
          All Categories
        </div>

        {categories.filter(c => c.id !== 'other').map(category => (
          <div
            key={category.id}
            className="legend-item clickable"
            onClick={() => handleCategoryToggle(category.id)}
            style={{
              cursor: 'pointer',
              opacity: activeCategories.has('all') || activeCategories.has(category.id) ? 1 : 0.3,
              fontWeight: activeCategories.has(category.id) && !activeCategories.has('all') ? 'bold' : 'normal'
            }}
          >
            <span
              className={`legend-color ${category.id}`}
              style={{ background: category.color }}
            ></span>
            {category.label}
          </div>
        ))}

        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
          <h5 style={{ fontSize: '12px', marginBottom: '8px' }}>Connection Types</h5>
          <div className="legend-item" style={{ fontSize: '11px' }}>
            <span style={{ display: 'inline-block', width: '25px', height: '2px', background: '#ffd700', marginRight: '5px' }}></span>
            Temporal (≤3 days)
          </div>
          <div className="legend-item" style={{ fontSize: '11px' }}>
            <span style={{ display: 'inline-block', width: '25px', height: '2px', background: '#87ceeb', marginRight: '5px' }}></span>
            Thematic (2+ tags)
          </div>
          <div className="legend-item" style={{ fontSize: '11px' }}>
            <span style={{ display: 'inline-block', width: '25px', height: '2px', background: '#ddd', marginRight: '5px' }}></span>
            Actor-Event
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;