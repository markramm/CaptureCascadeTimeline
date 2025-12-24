
import { db } from './index';

export const syncEvents = async (force = false) => {
    const count = await db.events.count();
    if (count > 0 && !force) {
        console.log('Events already loaded via Dexie');
        return { count, source: 'local' };
    }

    try {
        const response = await fetch('/api/timeline.json');
        if (!response.ok) throw new Error('Failed to fetch timeline.json');

        // Check if response is raw array or object
        const data = await response.json();
        const events = Array.isArray(data) ? data : data.events;

        if (!events) {
            // Support legacy format if needed, or error
            throw new Error('Invalid timeline.json format');
        }

        console.log(`Fetching ${events.length} events from API...`);

        // Bulk put (faster than add)
        await db.events.bulkPut(events);

        // Also sync validations
        await syncValidations();

        // Update repo sync status (mock for now)
        await db.repos.put({
            url: window.location.origin,
            name: 'Local Static API',
            last_synced: new Date().toISOString(),
            enabled: true
        });

        return { count: events.length, source: 'network' };
        return { count: events.length, source: 'network' };
    } catch (err) {
        console.error('Failed to sync events:', err);
        throw err;
    }
};

export const syncValidations = async () => {
    try {
        const response = await fetch('/api/validations.json');
        if (!response.ok) {
            if (response.status === 404) return; // Optional
            throw new Error('Failed to fetch validations.json');
        }

        const data: any[] = await response.json();
        console.log(`Fetching validation records for ${data.length} events...`);

        const allRecords = [];
        for (const item of data) {
            for (const v of item.validations) {
                allRecords.push(v);
            }
        }

        // Clear and replace? Or upsert?
        // Since id is auto-inc, bulkPut might just add. 
        // For now, clear table first to avoid dups if re-syncing whole set.
        await db.validations.clear();
        await db.validations.bulkPut(allRecords);

    } catch (err) {
        console.warn('Failed to sync validations:', err);
        // Don't crash app if validations fail
    }
};
