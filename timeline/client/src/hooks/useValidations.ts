
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useMemo } from 'react';

import type { ValidationRecord } from '../schemas/validation';

export function useValidations() {
    const validations = useLiveQuery(() => db.validations.toArray());

    const validationMap = useMemo(() => {
        if (!validations) return new Map();

        const map = new Map<string, ValidationRecord[]>();
        validations.forEach(v => {
            if (!map.has(v.event_id)) {
                map.set(v.event_id, []);
            }
            map.get(v.event_id)?.push(v);
        });
        return map;
    }, [validations]);

    return validationMap;
}
