import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import './NetworkGraph.css';

const NetworkGraphActors = ({
  events,
  minEvents = 3,
  showLabels = true,
  searchQuery = '',
  compareMode = false,
  compareNodes = [],
  onCompareNodesChange,
  onCompareModeChange
}) => {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });

  // Load actors from URL on mount - this logic might be redundant if App.js handles it, 
  // but for now we'll trust the props passed from App.js which are initialized from URL.

  // Create local reference for compareNodes interaction if needed, or better, use the prop directly.
  // We need to ensure we don't try to update state that doesn't exist.

  /* 
     NOTE: URL PARAMETER HANDLING HAS BEEN LIFTED TO APP.JS
     The props passed to this component now control the view state.
  */

  useEffect(() => {
    if (!events || events.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Process events to extract actor relationships
    const processActorNetwork = () => {
      const actorEventMap = new Map(); // actor -> events they're in
      const actorConnections = new Map(); // "actor1-actor2" -> shared event count

      // Build actor-event mapping
      events.forEach(event => {
        if (event.actors && event.actors.length > 0) {
          event.actors.forEach(actor => {
            if (!actorEventMap.has(actor)) {
              actorEventMap.set(actor, []);
            }
            actorEventMap.get(actor).push(event);
          });

          // Track connections between actors in same event
          if (event.actors.length > 1) {
            for (let i = 0; i < event.actors.length - 1; i++) {
              for (let j = i + 1; j < event.actors.length; j++) {
                const key = [event.actors[i], event.actors[j]].sort().join('|||');
                actorConnections.set(key, (actorConnections.get(key) || 0) + 1);
              }
            }
          }
        }
      });

      // Filter actors by minimum event count
      const significantActors = Array.from(actorEventMap.entries())
        .filter(([actor, events]) => events.length >= minEvents)
        .sort((a, b) => b[1].length - a[1].length);

      // Create nodes
      const nodes = significantActors.map(([actor, actorEvents]) => ({
        id: actor,
        label: actor,
        eventCount: actorEvents.length,
        events: actorEvents,
        // Special handling for Trump to ensure he's recognized
        isTrump: actor === 'Donald Trump' ||
          actor === 'Trump Administration' ||
          actor.includes('Trump')
      }));

      // Create links between actors who appear in same events
      const links = [];
      const actorSet = new Set(significantActors.map(([actor]) => actor));

      actorConnections.forEach((count, key) => {
        const [source, target] = key.split('|||');
        if (actorSet.has(source) && actorSet.has(target)) {
          links.push({
            source,
            target,
            value: count,
            sharedEvents: count
          });
        }
      });

      return { nodes, links };
    };

    const { nodes, links } = processActorNetwork();

    // Save network data for use in render
    setNetworkData({ nodes, links });

    if (nodes.length === 0) return;

    // Setup dimensions
    const width = svgRef.current.clientWidth || 1200;
    const height = 800;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add title/stats
    svg.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', 14)
      .attr('fill', '#666')
      .text(`Actor Network: ${nodes.length} actors, ${links.length} connections (min ${minEvents} events)`);

    // Create main container with zoom
    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])  // Allow more zoom out to see all nodes
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Set initial zoom to show more of the network
    svg.call(zoom.transform, d3.zoomIdentity.scale(0.6));

    // Find Trump node and set initial position
    const trumpNode = nodes.find(n => n.isTrump && n.id === 'Donald Trump') ||
      nodes.find(n => n.isTrump);

    if (trumpNode) {
      trumpNode.fx = width / 2;
      trumpNode.fy = height / 2;
      trumpNode.fixed = true;
    }

    // Size scale for nodes (based on event count)
    const sizeScale = d3.scaleSqrt()
      .domain([d3.min(nodes, d => d.eventCount), d3.max(nodes, d => d.eventCount)])
      .range([5, 40]);

    // Thickness scale for links
    const linkScale = d3.scaleLinear()
      .domain([1, d3.max(links, d => d.value)])
      .range([1, 10]);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
          // Dynamic distance based on connection strength
          const baseDistance = 80;
          const reduction = Math.min(d.value * 3, 40);
          return baseDistance - reduction;
        })
        .strength(d => Math.min(d.value * 0.1, 0.5))
      )
      .force('charge', d3.forceManyBody()
        .strength(d => {
          // Balanced repulsion for better spacing
          if (d.isTrump) return -500;
          // Moderate repulsion for readability
          return -50 - (d.eventCount * 3);
        })
        .distanceMax(400)  // Limit repulsion distance
      )
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force('collision', d3.forceCollide()
        .radius(d => sizeScale(d.eventCount) + 10)  // More space between nodes
        .strength(0.8)
      )
      .force('x', d3.forceX(width / 2).strength(0.01))  // Gentle centering
      .force('y', d3.forceY(height / 2).strength(0.01));

    // Draw links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', d => 0.2 + (d.value / 20))
      .attr('stroke-width', d => linkScale(d.value));

    // Add link hover effects
    link.append('title')
      .text(d => `${d.source.id || d.source} ↔ ${d.target.id || d.target}: ${d.sharedEvents} shared events`);

    // Draw nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => sizeScale(d.eventCount))
      .attr('fill', d => {
        if (d.isTrump) return '#ff6b6b';
        if (d.eventCount > 50) return '#e74c3c';
        if (d.eventCount > 20) return '#f39c12';
        if (d.eventCount > 10) return '#3498db';
        return '#95a5a6';
      })
      .attr('stroke', d => {
        if (searchQuery && d.label.toLowerCase().includes(searchQuery.toLowerCase())) {
          return '#ffff00';
        }
        return '#fff';
      })
      .attr('stroke-width', d => {
        if (searchQuery && d.label.toLowerCase().includes(searchQuery.toLowerCase())) {
          return 4;
        }
        return 2;
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (compareMode) {
          // In investigation mode, add/remove from investigation list
          const isInvestigating = compareNodes.some(n => n.id === d.id);
          const newNodes = isInvestigating
            ? compareNodes.filter(n => n.id !== d.id)
            : [...compareNodes, d];

          if (onCompareNodesChange) {
            onCompareNodesChange(newNodes);
          }

          // Highlight investigation network
          if (compareNodes.length > 0 || !isInvestigating) {
            highlightInvestigationNetwork([...compareNodes, d].filter(n => n.id !== (isInvestigating ? d.id : null)));
          }
        } else {
          setSelectedNode(d);
          highlightConnections(d);
        }
      })
      .on('mouseover', (event, d) => {
        // Create tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'actor-tooltip')
          .style('position', 'absolute')
          .style('padding', '10px')
          .style('background', 'rgba(0,0,0,0.9)')
          .style('color', 'white')
          .style('border-radius', '4px')
          .style('pointer-events', 'none')
          .style('font-size', '12px')
          .style('z-index', 1000)
          .html(`
            <strong>${d.label}</strong><br/>
            Events: ${d.eventCount}<br/>
            Connections: ${links.filter(l =>
            l.source.id === d.id || l.target.id === d.id
          ).length} actors
          `);

        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', () => {
        d3.selectAll('.actor-tooltip').remove();
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add labels with background for better readability
    const labelGroups = g.append('g')
      .attr('class', 'labels')
      .selectAll('g')
      .data(nodes)
      .enter().append('g');

    // Add white background rectangles for labels
    labelGroups.each(function (d) {
      const group = d3.select(this);
      const labelText = (() => {
        if (d.isTrump) return d.label;
        if (showLabels) {
          if (d.eventCount > 15) return d.label.length > 20 ? d.label.substring(0, 18) + '...' : d.label;
          if (d.eventCount > 8) return d.label.length > 15 ? d.label.substring(0, 13) + '...' : d.label;
        }
        return '';
      })();

      if (labelText) {
        const fontSize = d.isTrump ? 14 : (d.eventCount > 50 ? 11 : (d.eventCount > 20 ? 10 : 9));

        // Add background rect
        const text = group.append('text')
          .text(labelText)
          .attr('font-size', fontSize)
          .attr('font-weight', d.isTrump ? 'bold' : 'normal')
          .attr('text-anchor', 'middle')
          .attr('dy', sizeScale(d.eventCount) + 15)
          .style('pointer-events', 'none')
          .style('user-select', 'none');

        const bbox = text.node().getBBox();

        group.insert('rect', 'text')
          .attr('x', bbox.x - 2)
          .attr('y', bbox.y - 1)
          .attr('width', bbox.width + 4)
          .attr('height', bbox.height + 2)
          .attr('fill', 'rgba(255, 255, 255, 0.8)')
          .attr('rx', 2)
          .attr('ry', 2);
      }
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labelGroups
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    // Drag functions
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep Trump fixed if it's Trump
      if (!event.subject.isTrump) {
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }

    function highlightConnections(selectedNode) {
      const connectedNodes = new Set([selectedNode.id]);

      // Find all connected nodes
      links.forEach(l => {
        if (l.source.id === selectedNode.id) {
          connectedNodes.add(l.target.id);
        } else if (l.target.id === selectedNode.id) {
          connectedNodes.add(l.source.id);
        }
      });

      // Fade non-connected elements
      node.style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.2);
      labelGroups.style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.2);

      link.style('opacity', l =>
        (l.source.id === selectedNode.id || l.target.id === selectedNode.id) ? 0.8 : 0.05
      );

      // Center the selected node with smooth transition
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = 1.2;

      const transform = d3.zoomIdentity
        .translate(centerX, centerY)
        .scale(scale)
        .translate(-selectedNode.x, -selectedNode.y);

      svg.transition()
        .duration(750)
        .call(zoom.transform, transform);
    }

    function highlightInvestigationNetwork(investigatedNodes) {
      const investigatedIds = new Set(investigatedNodes.map(n => n.id));
      const connectedNodes = new Set(investigatedIds);

      // Find all nodes connected to any investigated node
      links.forEach(l => {
        const sourceId = l.source.id || l.source;
        const targetId = l.target.id || l.target;

        if (investigatedIds.has(sourceId)) {
          connectedNodes.add(targetId);
        }
        if (investigatedIds.has(targetId)) {
          connectedNodes.add(sourceId);
        }
      });

      // Style nodes based on investigation status
      node
        .style('opacity', n => {
          if (investigatedIds.has(n.id)) return 1;
          if (connectedNodes.has(n.id)) return 0.6;
          return 0.1;
        })
        .style('stroke', n => {
          if (investigatedIds.has(n.id)) return '#e74c3c';
          return '#fff';
        })
        .style('stroke-width', n => {
          if (investigatedIds.has(n.id)) return 4;
          return 2;
        });

      labelGroups.style('opacity', n => {
        if (investigatedIds.has(n.id)) return 1;
        if (connectedNodes.has(n.id)) return 0.7;
        return 0.1;
      });

      // Highlight links between investigated nodes
      link.style('opacity', l => {
        const sourceId = l.source.id || l.source;
        const targetId = l.target.id || l.target;

        // Strong highlight for links between investigated nodes
        if (investigatedIds.has(sourceId) && investigatedIds.has(targetId)) {
          return 1;
        }
        // Medium highlight for links from investigated to connected
        if (investigatedIds.has(sourceId) || investigatedIds.has(targetId)) {
          return 0.4;
        }
        return 0.02;
      })
        .style('stroke', l => {
          const sourceId = l.source.id || l.source;
          const targetId = l.target.id || l.target;

          if (investigatedIds.has(sourceId) && investigatedIds.has(targetId)) {
            return '#e74c3c';
          }
          return '#999';
        })
        .style('stroke-width', l => {
          const sourceId = l.source.id || l.source;
          const targetId = l.target.id || l.target;

          if (investigatedIds.has(sourceId) && investigatedIds.has(targetId)) {
            return linkScale(l.value) * 2;
          }
          return linkScale(l.value);
        });
    }

    // Click on background to reset
    svg.on('click', function (event) {
      if (event.target === this || event.target.tagName === 'rect') {
        if (compareMode && compareNodes.length > 0) {
          // In investigation mode, clear selection
          if (onCompareNodesChange) onCompareNodesChange([]);
        }
        node.style('opacity', 1);
        labelGroups.style('opacity', 1);
        link.style('opacity', d => 0.2 + (d.value / 20))
          .style('stroke', '#999')
          .style('stroke-width', d => linkScale(d.value));
        node.style('stroke', '#fff')
          .style('stroke-width', 2);
        setSelectedNode(null);
      }
    });

  }, [events, minEvents, showLabels, searchQuery, compareMode, compareNodes]);

  // Get top actors for stats
  const topActors = useMemo(() => {
    if (!events) return [];

    const actorCounts = new Map();
    events.forEach(event => {
      if (event.actors) {
        event.actors.forEach(actor => {
          actorCounts.set(actor, (actorCounts.get(actor) || 0) + 1);
        });
      }
    });

    return Array.from(actorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [events]);

  return (
    <div className="network-graph-container">
      <div className="graph-controls" style={{ display: 'none' }}>
        {/* Controls moved to FilterPanel */}
      </div>

      <svg ref={svgRef} className="network-graph"></svg>

      {selectedNode && (
        <div className="node-details">
          <h3>{selectedNode.label}</h3>
          <div className="node-stats">
            <p><strong>Total Events:</strong> {selectedNode.eventCount}</p>
            <p><strong>Direct Connections:</strong> {
              networkData.links.filter(l =>
                (l.source.id === selectedNode.id || l.target.id === selectedNode.id) ||
                (l.source === selectedNode.id || l.target === selectedNode.id)
              ).length
            } actors</p>
          </div>

          {/* Connected Actors Section */}
          <div style={{ marginTop: '15px', marginBottom: '15px' }}>
            <p><strong>Most Connected Actors:</strong></p>
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {(() => {
                const connectionCounts = {};
                networkData.links.forEach(l => {
                  if (l.source.id === selectedNode.id || l.source === selectedNode.id) {
                    const targetId = l.target.id || l.target;
                    connectionCounts[targetId] = (connectionCounts[targetId] || 0) + l.value;
                  } else if (l.target.id === selectedNode.id || l.target === selectedNode.id) {
                    const sourceId = l.source.id || l.source;
                    connectionCounts[sourceId] = (connectionCounts[sourceId] || 0) + l.value;
                  }
                });

                return Object.entries(connectionCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([actor, count]) => (
                    <div key={actor} style={{
                      padding: '4px 8px',
                      margin: '4px 0',
                      background: '#f0f0f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                      onClick={() => {
                        const targetNode = networkData.nodes.find(n => n.id === actor);
                        if (targetNode) {
                          setSelectedNode(targetNode);
                        }
                      }}>
                      <span>{actor}</span>
                      <span style={{ color: '#667eea', fontWeight: 'bold' }}>{count} events</span>
                    </div>
                  ));
              })()}
            </div>
          </div>

          {/* Events Section with Actor Highlighting */}
          <div style={{ maxHeight: '250px', overflowY: 'auto', marginTop: '10px' }}>
            <p><strong>Events ({selectedNode.events.length} total):</strong></p>
            <ul>
              {selectedNode.events.slice(0, 10).map((event, i) => (
                <li key={i} style={{ marginBottom: '10px' }}>
                  <div>
                    <strong>{event.date}</strong>: {event.title?.substring(0, 60)}
                    {event.title?.length > 60 ? '...' : ''}
                  </div>
                  {event.actors && event.actors.length > 1 && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Also involves: {event.actors.filter(a => a !== selectedNode.label).slice(0, 3).join(', ')}
                      {event.actors.filter(a => a !== selectedNode.label).length > 3 && ' ...'}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <button onClick={() => setSelectedNode(null)}>Close</button>
        </div>
      )}

      <div className="graph-legend">
        <h4>Top Actors</h4>
        {topActors.map(([actor, count]) => (
          <div key={actor} className="legend-item" style={{ fontSize: '11px' }}>
            <span style={{
              display: 'inline-block',
              width: Math.min(count / 5, 20) + 'px',
              height: '10px',
              background: count > 100 ? '#e74c3c' : count > 50 ? '#f39c12' : '#3498db',
              marginRight: '5px'
            }}></span>
            {actor}: {count}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkGraphActors;