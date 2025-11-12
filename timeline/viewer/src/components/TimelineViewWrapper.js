/**
 * TimelineViewWrapper - Conditionally renders traditional or IndexedDB-optimized timeline
 *
 * Checks feature flag and renders appropriate timeline component:
 * - Traditional: EnhancedTimelineView (all events in memory)
 * - Optimized: VirtualTimelineView (IndexedDB with virtual scrolling)
 */

import React from 'react';
import EnhancedTimelineView from './EnhancedTimelineView';
import VirtualTimelineView from './VirtualTimelineView';
import { FEATURE_FLAGS } from '../config';

const TimelineViewWrapper = ({
  events,
  groups,
  viewMode,
  zoomLevel,
  sortOrder,
  onEventClick,
  onTagClick,
  onActorClick,
  onCaptureLaneClick,
  selectedTags,
  selectedActors,
  timelineControls,
  onTimelineControlsChange,
  searchQuery,
  dateRange,
  minImportance
}) => {
  const useIndexedDB = FEATURE_FLAGS.USE_INDEXED_DB;

  // Build filters object for VirtualTimelineView
  const filters = {
    tags: selectedTags,
    actors: selectedActors,
    startDate: dateRange?.start,
    endDate: dateRange?.end,
    minImportance: minImportance > 0 ? minImportance : undefined,
    searchQuery
  };

  if (useIndexedDB) {
    console.log('[TimelineViewWrapper] Using IndexedDB-optimized VirtualTimelineView');

    return (
      <VirtualTimelineView
        filters={filters}
        onEventSelect={onEventClick}
        searchQuery={searchQuery}
        sortBy="date"
        sortOrder={sortOrder === 'chronological' ? 'asc' : 'desc'}
      />
    );
  }

  console.log('[TimelineViewWrapper] Using traditional EnhancedTimelineView');

  // Traditional mode - all events in memory
  return (
    <EnhancedTimelineView
      events={events}
      groups={groups}
      viewMode={viewMode}
      zoomLevel={zoomLevel}
      sortOrder={sortOrder}
      onEventClick={onEventClick}
      onTagClick={onTagClick}
      onActorClick={onActorClick}
      onCaptureLaneClick={onCaptureLaneClick}
      selectedTags={selectedTags}
      selectedActors={selectedActors}
      timelineControls={timelineControls}
      onTimelineControlsChange={onTimelineControlsChange}
    />
  );
};

export default TimelineViewWrapper;
