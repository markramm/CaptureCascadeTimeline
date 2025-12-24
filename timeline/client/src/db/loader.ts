
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

        // Update repo sync status (mock for now)
        await db.repos.put({
            url: window.location.origin,
            name: 'Local Static API',
            last_synced: new Date().toISOString(),
            enabled: true
        });

        return { count: events.length, source: 'network' };
    } catch (err) {
        console.error('Failed to sync events:', err);
        throw err;
    }
};
