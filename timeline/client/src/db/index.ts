

import Dexie, { type Table } from 'dexie';
import type { TimelineEvent } from '../schemas/events';


import type { ValidationRecord } from '../schemas/validation';

export interface RepositoryConfig {
    url: string;
    name: string;
    last_synced: string;
    enabled: boolean;
}

export class TimelineDatabase extends Dexie {
    events!: Table<TimelineEvent, string>; // id is string
    repos!: Table<RepositoryConfig, string>; // url is key
    validations!: Table<ValidationRecord, number>; // auto-inc id (Dexie handles this internally if map is slightly diff?) Or composite key? 
    // Spec says indexed by event_id. 
    // Actually, one event can have multiple validations. So primary key cannot be event_id.
    // Let's use auto-incremented primary key, and index event_id.

    constructor() {
        super('TimelineUTC');
        this.version(1).stores({
            events: 'id, date, type, upstream_repo, *tags, *entities',
            repos: 'url, last_synced'
        });

        // Upgrade to version 2
        this.version(2).stores({
            validations: '++id, event_id, validator_id, confidence'
        });
    }
}

export const db = new TimelineDatabase();
