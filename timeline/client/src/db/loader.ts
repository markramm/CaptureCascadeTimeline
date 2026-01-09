/**
 * Database Loader
 *
 * Handles syncing timeline data from remote sources to local IndexedDB.
 * Uses the dataService for fetching and the config for source URLs.
 */

import { db } from './index';
import { fetchTimelineData } from '../services/dataService';
import { getConfig } from '../config/timeline';
import type { ValidationRecord, AggregatedValidation } from '../schemas/validation';

export interface SyncResult {
    count: number;
    source: 'local' | 'network';
    schemaWarning?: string;
}

/**
 * Sync events from configured data source to local IndexedDB
 */
export const syncEvents = async (force = false): Promise<SyncResult> => {
    const count = await db.events.count();
    if (count > 0 && !force) {
        console.log('Events already loaded via Dexie');
        return { count, source: 'local' };
    }

    const config = getConfig();
    console.log(`Fetching events from: ${config.dataUrl}`);

    const result = await fetchTimelineData();

    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch timeline data');
    }

    if (!result.events || result.events.length === 0) {
        throw new Error('No events found in timeline data');
    }

    console.log(`Fetching ${result.events.length} events from API...`);

    // Bulk put (faster than add)
    await db.events.bulkPut(result.events);

    // Also sync validations
    await syncValidations();

    // Update repo sync status
    await db.repos.put({
        url: config.dataUrl,
        name: result.data?.name || 'Timeline',
        last_synced: new Date().toISOString(),
        enabled: true
    });

    return {
        count: result.events.length,
        source: 'network',
        schemaWarning: result.schemaWarning
    };
};

/**
 * Sync validation records from API
 */
export const syncValidations = async () => {
    try {
        const response = await fetch('/api/validations.json');
        if (!response.ok) {
            if (response.status === 404) return; // Optional
            throw new Error('Failed to fetch validations.json');
        }

        const data: AggregatedValidation[] = await response.json();
        console.log(`Fetching validation records for ${data.length} events...`);

        const allRecords: ValidationRecord[] = [];
        for (const item of data) {
            for (const v of item.validations) {
                allRecords.push(v);
            }
        }

        // Clear and replace to avoid dups if re-syncing whole set.
        await db.validations.clear();
        await db.validations.bulkPut(allRecords);

    } catch (err) {
        console.warn('Failed to sync validations:', err);
        // Don't crash app if validations fail
    }
};
