
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useMemo } from 'react';

export function useValidations() {
    const validations = useLiveQuery(() => db.validations.toArray());

    const validationMap = useMemo(() => {
        if (!validations) return new Map();

        const map = new Map<string, any[]>();
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
