import { useState, useEffect, useCallback } from 'react';

// Helper functions for URL state management
const encodeArrayParam = (arr) => arr.length > 0 ? arr.join(',') : '';
const decodeArrayParam = (param) => param ? param.split(',').filter(Boolean) : [];

const encodeDateRange = (dateRange) => {
  if (!dateRange.start && !dateRange.end) return '';
  return `${dateRange.start || ''}:${dateRange.end || ''}`;
};

const decodeDateRange = (param) => {
  if (!param) return { start: null, end: null };
  const [start, end] = param.split(':');
  return {
    start: start || null,
    end: end || null
  };
};

const encodeTimelineControls = (controls) => {
  return `${controls.compactMode},${controls.sortBy},${controls.filterImportance},${controls.showMinimap}`;
};

const decodeTimelineControls = (param) => {
  if (!param) return {
    compactMode: 'medium',
    sortBy: 'date',
    filterImportance: 0,
    showMinimap: true
  };

  const [compactMode, sortBy, filterImportance, showMinimap] = param.split(',');
  return {
    compactMode: compactMode || 'medium',
    sortBy: sortBy || 'date',
    filterImportance: parseInt(filterImportance) || 0,
    showMinimap: showMinimap === 'true'
  };
};

const encodeGraphControls = (controls) => {
  return `${controls.layout},${controls.connectionStrength},${controls.showMetrics},${controls.maxNodes},${controls.showLabels}`;
};

const decodeGraphControls = (param) => {
  if (!param) return {
    layout: 'force',
    connectionStrength: 0,
    showMetrics: false,
    maxNodes: 200,
    showLabels: true
  };

  const [layout, strength, metrics, maxNodes, labels] = param.split(',');
  return {
    layout: layout || 'force',
    connectionStrength: parseFloat(strength) || 0,
    showMetrics: metrics === 'true',
    maxNodes: parseInt(maxNodes) || 200,
    showLabels: labels === 'true'
  };
};

const encodeActorControls = (controls) => {
  // Format: minEvents,showLabels,compareMode,compareNodeIds...
  const base = `${controls.minEvents},${controls.showLabels},${controls.compareMode}`;
  if (controls.compareNodes && controls.compareNodes.length > 0) {
    const ids = controls.compareNodes.map(n => n.id || n).join('|');
    return `${base},${ids}`;
  }
  return base;
};

const decodeActorControls = (param) => {
  if (!param) return {
    minEvents: 3,
    showLabels: true,
    compareMode: false,
    compareNodes: []
  };

  const parts = param.split(',');
  const compareNodesStr = parts.slice(3).join(','); // Handle potential commas in IDs if we were using them, but we use pipes now

  return {
    minEvents: parseInt(parts[0]) || 3,
    showLabels: parts[1] === 'true',
    compareMode: parts[2] === 'true',
    // We only store IDs in URL, App.js will need to rehydrate objects if needed, 
    // but for now we'll just store the objects if we can, or just IDs.
    // Actually, storing full objects in URL is bad. We store IDs.
    // The App.js logic will need to handle "IDs only" state initially or we fetch them.
    // For simplicity sake in this refactor, let's assume compareNodes are rehydrated elsewhere 
    // or we just store empty for now if complex. 
    // BUT the previous implementation stored IDs.
    compareNodes: compareNodesStr ? compareNodesStr.split('|').map(id => ({ id, label: id })) : []
  };
};

export const useUrlState = () => {
  const [urlState, setUrlState] = useState(null);

  // Extract state from URL parameters
  const getStateFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);

    return {
      selectedTags: decodeArrayParam(params.get('tags')),
      selectedActors: decodeArrayParam(params.get('actors')),
      selectedCaptureLanes: decodeArrayParam(params.get('lanes')),
      dateRange: decodeDateRange(params.get('dateRange')),
      searchQuery: params.get('search') || '',
      viewMode: params.get('view') || 'timeline',
      timelineControls: decodeTimelineControls(params.get('timeline')),
      graphControls: decodeGraphControls(params.get('graph')),
      actorControls: decodeActorControls(params.get('actorSettings')),
      zoomLevel: parseFloat(params.get('zoom')) || 1,
      showFilters: params.get('filters') !== 'false',
      showStats: params.get('stats') === 'true',
      selectedEventId: params.get('event') || null,
      showLanding: params.get('landing') === 'true'
    };
  }, []);

  // Update URL with current state
  const updateUrl = useCallback((state) => {
    const params = new URLSearchParams();

    // Only add non-default values to keep URLs clean
    if (state.selectedTags?.length > 0) {
      params.set('tags', encodeArrayParam(state.selectedTags));
    }
    if (state.selectedActors?.length > 0) {
      params.set('actors', encodeArrayParam(state.selectedActors));
    }
    if (state.selectedCaptureLanes?.length > 0) {
      params.set('lanes', encodeArrayParam(state.selectedCaptureLanes));
    }
    if (state.dateRange?.start || state.dateRange?.end) {
      params.set('dateRange', encodeDateRange(state.dateRange));
    }
    if (state.searchQuery) {
      params.set('search', state.searchQuery);
    }
    if (state.viewMode && state.viewMode !== 'timeline') {
      params.set('view', state.viewMode);
    }
    if (state.timelineControls) {
      const defaultControls = 'medium,date,0,true';
      const currentControls = encodeTimelineControls(state.timelineControls);
      if (currentControls !== defaultControls) {
        params.set('timeline', currentControls);
      }
    }
    if (state.graphControls) {
      const defaultGraph = 'force,0,false,200,true';
      const currentGraph = encodeGraphControls(state.graphControls);
      if (currentGraph !== defaultGraph) {
        params.set('graph', currentGraph);
      }
    }
    if (state.actorControls) {
      const defaultActor = '3,true,false';
      const currentActor = encodeActorControls(state.actorControls);
      if (currentActor !== defaultActor && currentActor !== '3,true,false,') {
        params.set('actorSettings', currentActor);
      }
    }
    if (state.zoomLevel && state.zoomLevel !== 1) {
      params.set('zoom', state.zoomLevel.toString());
    }
    if (state.showFilters === false) {
      params.set('filters', 'false');
    }
    if (state.showStats === true) {
      params.set('stats', 'true');
    }
    if (state.selectedEventId) {
      params.set('event', state.selectedEventId);
    }
    if (state.showLanding === true) {
      params.set('landing', 'true');
    }

    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;

    // Use replaceState to avoid creating browser history entries for every filter change
    window.history.replaceState(null, '', newUrl);
  }, []);

  // Initialize state from URL on mount
  useEffect(() => {
    setUrlState(getStateFromUrl());
  }, [getStateFromUrl]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setUrlState(getStateFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getStateFromUrl]);

  return {
    urlState,
    updateUrl,
    getStateFromUrl
  };
};

export default useUrlState;