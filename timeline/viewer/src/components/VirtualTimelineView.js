/**
 * VirtualTimelineView - Virtual scrolling timeline component
 *
 * Renders only visible events using react-window for efficient memory usage.
 * Loads events on-demand from IndexedDB as user scrolls.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import useIndexedDB from '../hooks/useIndexedDB';
import './VirtualTimelineView.css';

const ITEM_HEIGHT = 150; // Pixels per event card
const WINDOW_SIZE = 50; // Events to keep in memory

const VirtualTimelineView = ({
  filters = {},
  onEventSelect,
  searchQuery = '',
  sortBy = 'date',
  sortOrder = 'desc'
}) => {
  const {
    isReady,
    isInitializing,
    error,
    getEvents,
    getEventCount
  } = useIndexedDB();

  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadedPages, setLoadedPages] = useState(new Set([1]));

  // Merge filters with search query
  const effectiveFilters = useMemo(() => {
    return {
      ...filters,
      searchQuery: searchQuery || filters.searchQuery
    };
  }, [filters, searchQuery]);

  /**
   * Load initial batch of events
   */
  useEffect(() => {
    if (!isReady) return;

    const loadInitialEvents = async () => {
      try {
        setLoading(true);

        // Get total count
        const count = await getEventCount(effectiveFilters);
        setTotalCount(count);

        // Load first page
        const results = await getEvents({
          page: 1,
          perPage: WINDOW_SIZE,
          sortBy,
          sortOrder,
          filters: effectiveFilters
        });

        setEvents(results);
        setLoadedPages(new Set([1]));
        setLoading(false);

        console.log(`[VirtualTimelineView] Loaded ${results.length} of ${count} events`);
      } catch (err) {
        console.error('[VirtualTimelineView] Failed to load events:', err);
        setLoading(false);
      }
    };

    loadInitialEvents();
  }, [isReady, effectiveFilters, sortBy, sortOrder, getEvents, getEventCount]);

  /**
   * Load more events for a specific page
   */
  const loadPage = useCallback(async (page) => {
    if (loadedPages.has(page) || !isReady) {
      return;
    }

    try {
      console.log(`[VirtualTimelineView] Loading page ${page}...`);

      const results = await getEvents({
        page,
        perPage: WINDOW_SIZE,
        sortBy,
        sortOrder,
        filters: effectiveFilters
      });

      setEvents(prevEvents => {
        const newEvents = [...prevEvents];
        const startIndex = (page - 1) * WINDOW_SIZE;

        results.forEach((event, i) => {
          newEvents[startIndex + i] = event;
        });

        return newEvents;
      });

      setLoadedPages(prev => new Set([...prev, page]));

      console.log(`[VirtualTimelineView] Loaded page ${page}: ${results.length} events`);
    } catch (err) {
      console.error(`[VirtualTimelineView] Failed to load page ${page}:`, err);
    }
  }, [loadedPages, isReady, getEvents, sortBy, sortOrder, effectiveFilters]);

  /**
   * Row renderer for react-window
   */
  const Row = useCallback(({ index, style }) => {
    const event = events[index];
    const page = Math.floor(index / WINDOW_SIZE) + 1;

    // Trigger loading of next page when approaching end of loaded events
    if (index >= events.length - 10 && !loadedPages.has(page + 1)) {
      loadPage(page + 1);
    }

    if (!event) {
      return (
        <div style={style} className="timeline-event-loading">
          <div className="loading-skeleton"></div>
        </div>
      );
    }

    return (
      <div style={style} className="timeline-event-wrapper">
        <TimelineEventCard
          event={event}
          onClick={() => onEventSelect && onEventSelect(event)}
        />
      </div>
    );
  }, [events, loadedPages, loadPage, onEventSelect]);

  if (error) {
    return (
      <div className="virtual-timeline-error">
        <h3>Error loading timeline</h3>
        <p>{error.message}</p>
        <p>IndexedDB may not be supported in your browser.</p>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="virtual-timeline-initializing">
        <div className="spinner"></div>
        <p>Initializing timeline database...</p>
        <p className="text-muted">This may take a moment on first load</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="virtual-timeline-loading">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="virtual-timeline-empty">
        <p>No events found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="virtual-timeline-container">
      <div className="virtual-timeline-header">
        <p>
          Showing {events.length} of {totalCount} events
        </p>
      </div>

      <List
        height={window.innerHeight - 200}
        itemCount={totalCount}
        itemSize={ITEM_HEIGHT}
        width="100%"
        className="virtual-timeline-list"
      >
        {Row}
      </List>
    </div>
  );
};

/**
 * Individual event card component
 */
const TimelineEventCard = ({ event, onClick }) => {
  if (!event) {
    console.warn('[TimelineEventCard] Received null/undefined event');
    return null;
  }

  const formattedDate = event.date ? new Date(event.date).toLocaleDateString() : 'Unknown date';
  const title = event.title || 'Untitled Event';
  const summary = event.summary || '';
  const importance = event.importance || 5;
  const tags = event.tags || [];

  return (
    <div
      className="timeline-event-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick && onClick()}
      style={{
        background: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        padding: '0.625rem 0.75rem',
        cursor: 'pointer',
        minHeight: '120px'
      }}
    >
      <div className="event-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
        <div className="event-date" style={{ fontSize: '0.8125rem', color: '#495057', fontWeight: 600 }}>
          {formattedDate}
        </div>
        {importance && (
          <div
            className={`event-importance importance-${importance}`}
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.125rem 0.375rem',
              borderRadius: '3px',
              background: importance >= 9 ? '#dc3545' : importance >= 7 ? '#fd7e14' : importance >= 5 ? '#ffc107' : '#f8f9fa',
              color: importance >= 5 ? (importance >= 7 ? 'white' : '#212529') : '#495057'
            }}
          >
            {importance}/10
          </div>
        )}
      </div>

      <h3 className="event-title" style={{
        fontSize: '0.9375rem',
        fontWeight: 600,
        color: '#1a1a1a',
        margin: '0 0 0.375rem 0'
      }}>
        {title}
      </h3>

      {summary && (
        <p className="event-summary" style={{
          fontSize: '0.8125rem',
          color: '#555',
          lineHeight: 1.4,
          margin: '0 0 0.5rem 0'
        }}>
          {summary.length > 200
            ? summary.substring(0, 200) + '...'
            : summary}
        </p>
      )}

      {tags.length > 0 && (
        <div className="event-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {tags.slice(0, 5).map((tag, i) => (
            <span
              key={i}
              className="event-tag"
              style={{
                fontSize: '0.6875rem',
                padding: '0.0625rem 0.375rem',
                background: '#e9ecef',
                color: '#495057',
                borderRadius: '10px'
              }}
            >
              {tag}
            </span>
          ))}
          {tags.length > 5 && (
            <span className="event-tag-more" style={{ fontSize: '0.6875rem', color: '#6c757d' }}>
              +{tags.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualTimelineView;
