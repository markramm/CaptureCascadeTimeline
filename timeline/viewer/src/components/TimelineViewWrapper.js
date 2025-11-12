/**
 * TimelineViewWrapper - IndexedDB-optimized timeline (default)
 *
 * Uses VirtualTimelineView with IndexedDB for 85% memory reduction (800MB → 130MB)
 * Legacy EnhancedTimelineView can be enabled via: localStorage.setItem('useIndexedDB', 'false')
 */

import React from 'react';
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

  if (!useIndexedDB) {
    console.warn('[TimelineViewWrapper] Legacy mode enabled via localStorage. IndexedDB disabled.');
    // Lazy load EnhancedTimelineView only if needed
    const EnhancedTimelineView = require('./EnhancedTimelineView').default;
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
  }

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
};

export default TimelineViewWrapper;
