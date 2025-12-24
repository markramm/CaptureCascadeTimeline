

import Dexie, { type Table } from 'dexie';
import type { TimelineEvent } from '../schemas/events';


export interface RepositoryConfig {
    url: string;
    name: string;
    last_synced: string;
    enabled: boolean;
}

export class TimelineDatabase extends Dexie {
    events!: Table<TimelineEvent, string>; // id is string
    repos!: Table<RepositoryConfig, string>; // url is key

    constructor() {
        super('TimelineUTC');
        this.version(1).stores({
            events: 'id, date, type, upstream_repo, *tags, *entities',
            repos: 'url, last_synced'
        });
    }
}

export const db = new TimelineDatabase();
