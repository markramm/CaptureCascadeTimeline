/**
 * useIndexedDB - React hook for IndexedDB timeline storage
 *
 * Provides React components with access to IndexedDB-backed timeline events
 * with automatic initialization, syncing, and query methods.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import TimelineDB from '../utils/TimelineDB';

export const useIndexedDB = () => {
  const [db, setDb] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);

  const initializationRef = useRef(false);

  /**
   * Initialize IndexedDB and populate if needed
   */
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initializationRef.current) {
      return;
    }
    initializationRef.current = true;

    const initDB = async () => {
      try {
        console.log('[useIndexedDB] Initializing database...');
        const database = new TimelineDB();
        await database.init();

        // Check if we need to populate
        const lastSyncTime = await database.getMetadata('lastSync');
        const storedCount = await database.getEventCount();

        console.log('[useIndexedDB] Last sync:', lastSyncTime);
        console.log('[useIndexedDB] Stored events:', storedCount);

        if (!lastSyncTime || storedCount === 0) {
          console.log('[useIndexedDB] First time - loading from server...');

          // First time - load from JSON
          const response = await fetch('/api/timeline.json');
          if (!response.ok) {
            throw new Error(`Failed to fetch timeline: ${response.statusText}`);
          }

          const data = await response.json();
          const events = data.events || data;

          console.log(`[useIndexedDB] Fetched ${events.length} events from server`);

          // Populate database
          const addedCount = await database.populateFromJSON(events);
          await database.setMetadata('lastSync', Date.now());
          await database.setMetadata('version', data.version || '1.0');
          await database.setMetadata('eventCount', addedCount);

          setEventCount(addedCount);
          setLastSync(Date.now());

          console.log(`[useIndexedDB] Populated database with ${addedCount} events`);
        } else {
          setEventCount(storedCount);
          setLastSync(lastSyncTime);
          console.log('[useIndexedDB] Using existing database');
        }

        setDb(database);
        setIsReady(true);
        setIsInitializing(false);
        console.log('[useIndexedDB] Database ready');
      } catch (err) {
        console.error('[useIndexedDB] Initialization failed:', err);
        setError(err);
        setIsInitializing(false);
      }
    };

    initDB();

    // Cleanup on unmount
    return () => {
      if (db) {
        db.close();
      }
    };
  }, []); // Empty dependency array - run once

  /**
   * Get paginated events with filters
   */
  const getEvents = useCallback(async (options = {}) => {
    if (!db) {
      console.warn('[useIndexedDB] Database not ready for getEvents');
      return [];
    }

    try {
      return await db.getEvents(options);
    } catch (err) {
      console.error('[useIndexedDB] getEvents failed:', err);
      throw err;
    }
  }, [db]);

  /**
   * Get total count of events (with optional filters)
   */
  const getEventCount = useCallback(async (filters = {}) => {
    if (!db) {
      return 0;
    }

    try {
      return await db.getEventCount(filters);
    } catch (err) {
      console.error('[useIndexedDB] getEventCount failed:', err);
      throw err;
    }
  }, [db]);

  /**
   * Search events by text query
   */
  const searchEvents = useCallback(async (query, options = {}) => {
    if (!db) {
      console.warn('[useIndexedDB] Database not ready for searchEvents');
      return [];
    }

    try {
      return await db.searchEvents(query, options);
    } catch (err) {
      console.error('[useIndexedDB] searchEvents failed:', err);
      throw err;
    }
  }, [db]);

  /**
   * Get events by tag
   */
  const getEventsByTag = useCallback(async (tag, options = {}) => {
    if (!db) {
      console.warn('[useIndexedDB] Database not ready for getEventsByTag');
      return [];
    }

    try {
      return await db.getEventsByTag(tag, options);
    } catch (err) {
      console.error('[useIndexedDB] getEventsByTag failed:', err);
      throw err;
    }
  }, [db]);

  /**
   * Get events by actor
   */
  const getEventsByActor = useCallback(async (actor, options = {}) => {
    if (!db) {
      console.warn('[useIndexedDB] Database not ready for getEventsByActor');
      return [];
    }

    try {
      return await db.getEventsByActor(actor, options);
    } catch (err) {
      console.error('[useIndexedDB] getEventsByActor failed:', err);
      throw err;
    }
  }, [db]);

  /**
   * Get events by date range
   */
  const getEventsByDateRange = useCallback(async (startDate, endDate, options = {}) => {
    if (!db) {
      console.warn('[useIndexedDB] Database not ready for getEventsByDateRange');
      return [];
    }

    try {
      return await db.getEventsByDateRange(startDate, endDate, options);
    } catch (err) {
      console.error('[useIndexedDB] getEventsByDateRange failed:', err);
      throw err;
    }
  }, [db]);

  /**
   * Get events by minimum importance
   */
  const getEventsByImportance = useCallback(async (minImportance, options = {}) => {
    if (!db) {
      console.warn('[useIndexedDB] Database not ready for getEventsByImportance');
      return [];
    }

    try {
      return await db.getEventsByImportance(minImportance, options);
    } catch (err) {
      console.error('[useIndexedDB] getEventsByImportance failed:', err);
      throw err;
    }
  }, [db]);

  /**
   * Get single event by ID
   */
  const getEventById = useCallback(async (id) => {
    if (!db) {
      console.warn('[useIndexedDB] Database not ready for getEventById');
      return null;
    }

    try {
      return await db.getEventById(id);
    } catch (err) {
      console.error('[useIndexedDB] getEventById failed:', err);
      throw err;
    }
  }, [db]);

  /**
   * Sync from server (re-fetch and update database)
   */
  const syncFromServer = useCallback(async () => {
    if (!db) {
      console.warn('[useIndexedDB] Database not ready for sync');
      return;
    }

    try {
      console.log('[useIndexedDB] Syncing from server...');

      const response = await fetch('/api/timeline.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch timeline: ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.events || data;

      // Clear and repopulate
      await db.clear();
      const addedCount = await db.populateFromJSON(events);
      await db.setMetadata('lastSync', Date.now());
      await db.setMetadata('version', data.version || '1.0');
      await db.setMetadata('eventCount', addedCount);

      setEventCount(addedCount);
      setLastSync(Date.now());

      console.log(`[useIndexedDB] Sync complete: ${addedCount} events`);

      return addedCount;
    } catch (err) {
      console.error('[useIndexedDB] Sync failed:', err);
      throw err;
    }
  }, [db]);

  /**
   * Clear all data
   */
  const clearDatabase = useCallback(async () => {
    if (!db) {
      console.warn('[useIndexedDB] Database not ready for clear');
      return;
    }

    try {
      console.log('[useIndexedDB] Clearing database...');
      await db.clear();
      setEventCount(0);
      setLastSync(null);
      console.log('[useIndexedDB] Database cleared');
    } catch (err) {
      console.error('[useIndexedDB] Clear failed:', err);
      throw err;
    }
  }, [db]);

  return {
    // State
    isReady,
    isInitializing,
    error,
    eventCount,
    lastSync,

    // Query methods
    getEvents,
    getEventCount,
    searchEvents,
    getEventsByTag,
    getEventsByActor,
    getEventsByDateRange,
    getEventsByImportance,
    getEventById,

    // Utility methods
    syncFromServer,
    clearDatabase
  };
};

export default useIndexedDB;
