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
  const formattedDate = event.date ? new Date(event.date).toLocaleDateString() : 'Unknown date';

  return (
    <div
      className="timeline-event-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick && onClick()}
    >
      <div className="event-header">
        <div className="event-date">{formattedDate}</div>
        {event.importance && (
          <div className={`event-importance importance-${event.importance}`}>
            {event.importance}/10
          </div>
        )}
      </div>

      <h3 className="event-title">{event.title}</h3>

      {event.summary && (
        <p className="event-summary">
          {event.summary.length > 200
            ? event.summary.substring(0, 200) + '...'
            : event.summary}
        </p>
      )}

      {event.tags && event.tags.length > 0 && (
        <div className="event-tags">
          {event.tags.slice(0, 5).map((tag, i) => (
            <span key={i} className="event-tag">
              {tag}
            </span>
          ))}
          {event.tags.length > 5 && (
            <span className="event-tag-more">+{event.tags.length - 5}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualTimelineView;
