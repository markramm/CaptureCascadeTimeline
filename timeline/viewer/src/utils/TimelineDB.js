/**
 * TimelineDB - IndexedDB wrapper for timeline events
 *
 * Provides efficient storage and querying for 2,875+ timeline events
 * with support for pagination, filtering, and indexed searches.
 */

const DB_NAME = 'timeline_db';
const DB_VERSION = 1;
const EVENT_STORE = 'events';
const METADATA_STORE = 'metadata';

export class TimelineDB {
  constructor() {
    this.db = null;
    this.dbName = DB_NAME;
    this.version = DB_VERSION;
  }

  /**
   * Initialize IndexedDB connection and create schema
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create events store if it doesn't exist
        if (!db.objectStoreNames.contains(EVENT_STORE)) {
          const eventStore = db.createObjectStore(EVENT_STORE, {
            keyPath: 'id'
          });

          // Create indexes for fast queries
          eventStore.createIndex('date', 'date', { unique: false });
          eventStore.createIndex('importance', 'importance', { unique: false });
          eventStore.createIndex('tags', 'tags', {
            unique: false,
            multiEntry: true // Each tag creates separate index entry
          });
          eventStore.createIndex('actors', 'actors', {
            unique: false,
            multiEntry: true
          });

          console.log('Created events store with indexes');
        }

        // Create metadata store if it doesn't exist
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
          console.log('Created metadata store');
        }
      };
    });
  }

  /**
   * Populate IndexedDB from JSON data (initial load or sync)
   * Uses batching for better performance
   */
  async populateFromJSON(events) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const BATCH_SIZE = 100;
    let totalAdded = 0;

    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);

      await new Promise((resolve, reject) => {
        const tx = this.db.transaction([EVENT_STORE], 'readwrite');
        const store = tx.objectStore(EVENT_STORE);

        batch.forEach(event => {
          store.put(event);
        });

        tx.oncomplete = () => {
          totalAdded += batch.length;
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      });
    }

    console.log(`Populated IndexedDB with ${totalAdded} events`);
    return totalAdded;
  }

  /**
   * Get paginated events with optional filtering
   */
  async getEvents(options = {}) {
    const {
      page = 1,
      perPage = 50,
      sortBy = 'date',
      sortOrder = 'desc',
      filters = {}
    } = options;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction([EVENT_STORE], 'readonly');
    const store = tx.objectStore(EVENT_STORE);
    const index = store.index(sortBy);

    const events = [];
    let skipped = 0;
    const skip = (page - 1) * perPage;

    return new Promise((resolve, reject) => {
      const request = index.openCursor(
        null,
        sortOrder === 'desc' ? 'prev' : 'next'
      );

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (!cursor) {
          resolve(events);
          return;
        }

        const eventData = cursor.value;

        // Apply filters
        if (this._matchesFilters(eventData, filters)) {
          if (skipped < skip) {
            skipped++;
          } else if (events.length < perPage) {
            events.push(eventData);
          } else {
            resolve(events);
            return;
          }
        }

        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get total count of events (optionally filtered)
   */
  async getEventCount(filters = {}) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // If no filters, use count() for efficiency
    if (Object.keys(filters).length === 0) {
      const tx = this.db.transaction([EVENT_STORE], 'readonly');
      const store = tx.objectStore(EVENT_STORE);

      return new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    // With filters, we need to count manually
    const tx = this.db.transaction([EVENT_STORE], 'readonly');
    const store = tx.objectStore(EVENT_STORE);
    let count = 0;

    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (!cursor) {
          resolve(count);
          return;
        }

        if (this._matchesFilters(cursor.value, filters)) {
          count++;
        }

        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Search events by text query in title and summary
   */
  async searchEvents(query, options = {}) {
    const { limit = 50 } = options;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction([EVENT_STORE], 'readonly');
    const store = tx.objectStore(EVENT_STORE);

    const events = [];
    const lowerQuery = query.toLowerCase();

    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (!cursor || events.length >= limit) {
          resolve(events);
          return;
        }

        const eventData = cursor.value;
        const titleMatch = eventData.title?.toLowerCase().includes(lowerQuery);
        const summaryMatch = eventData.summary?.toLowerCase().includes(lowerQuery);

        if (titleMatch || summaryMatch) {
          events.push(eventData);
        }

        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get events by tag using index
   */
  async getEventsByTag(tag, options = {}) {
    const { limit = 50 } = options;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction([EVENT_STORE], 'readonly');
    const index = tx.objectStore(EVENT_STORE).index('tags');

    return new Promise((resolve, reject) => {
      const events = [];
      const request = index.openCursor(IDBKeyRange.only(tag));

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (!cursor || events.length >= limit) {
          resolve(events);
          return;
        }

        events.push(cursor.value);
        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get events by actor using index
   */
  async getEventsByActor(actor, options = {}) {
    const { limit = 50 } = options;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction([EVENT_STORE], 'readonly');
    const index = tx.objectStore(EVENT_STORE).index('actors');

    return new Promise((resolve, reject) => {
      const events = [];
      const request = index.openCursor(IDBKeyRange.only(actor));

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (!cursor || events.length >= limit) {
          resolve(events);
          return;
        }

        events.push(cursor.value);
        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get events within date range using index
   */
  async getEventsByDateRange(startDate, endDate, options = {}) {
    const { limit = 50 } = options;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction([EVENT_STORE], 'readonly');
    const index = tx.objectStore(EVENT_STORE).index('date');
    const range = IDBKeyRange.bound(startDate, endDate);

    return new Promise((resolve, reject) => {
      const events = [];
      const request = index.openCursor(range, 'prev'); // Most recent first

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (!cursor || events.length >= limit) {
          resolve(events);
          return;
        }

        events.push(cursor.value);
        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get events by minimum importance using index
   */
  async getEventsByImportance(minImportance, options = {}) {
    const { limit = 50 } = options;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction([EVENT_STORE], 'readonly');
    const index = tx.objectStore(EVENT_STORE).index('importance');
    const range = IDBKeyRange.lowerBound(minImportance);

    return new Promise((resolve, reject) => {
      const events = [];
      const request = index.openCursor(range, 'prev'); // Highest importance first

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (!cursor || events.length >= limit) {
          resolve(events);
          return;
        }

        events.push(cursor.value);
        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get single event by ID
   */
  async getEventById(id) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction([EVENT_STORE], 'readonly');
    const store = tx.objectStore(EVENT_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get metadata value
   */
  async getMetadata(key) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction([METADATA_STORE], 'readonly');
    const store = tx.objectStore(METADATA_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Set metadata value
   */
  async setMetadata(key, value) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction([METADATA_STORE], 'readwrite');
    const store = tx.objectStore(METADATA_STORE);

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data from database
   */
  async clear() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tx = this.db.transaction([EVENT_STORE, METADATA_STORE], 'readwrite');

    return Promise.all([
      new Promise((resolve, reject) => {
        const request = tx.objectStore(EVENT_STORE).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise((resolve, reject) => {
        const request = tx.objectStore(METADATA_STORE).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);
  }

  /**
   * Check if filters match an event
   * @private
   */
  _matchesFilters(event, filters) {
    // Tag filter (OR logic - event must have at least one of the specified tags)
    if (filters.tags?.length > 0) {
      const hasTag = filters.tags.some(tag =>
        event.tags?.includes(tag)
      );
      if (!hasTag) return false;
    }

    // Actor filter (OR logic)
    if (filters.actors?.length > 0) {
      const hasActor = filters.actors.some(actor =>
        event.actors?.includes(actor)
      );
      if (!hasActor) return false;
    }

    // Date range filter
    if (filters.startDate && event.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && event.date > filters.endDate) {
      return false;
    }

    // Importance filter
    if (filters.minImportance && event.importance < filters.minImportance) {
      return false;
    }

    // Text search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const titleMatch = event.title?.toLowerCase().includes(query);
      const summaryMatch = event.summary?.toLowerCase().includes(query);
      if (!titleMatch && !summaryMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export default TimelineDB;
