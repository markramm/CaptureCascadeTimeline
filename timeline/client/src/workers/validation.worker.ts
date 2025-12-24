
import { TimelineEventSchema } from '../schemas/events';
import { z } from 'zod';

export type ValidationMessage = {
    id: string;
    events: unknown[]; // Raw events to validate
};

export type ValidationResponse = {
    id: string; // Correlation ID
    results: {
        index: number;
        success: boolean;
        data?: unknown;
        error?: unknown;
    }[];
};

self.onmessage = async (e: MessageEvent<ValidationMessage>) => {
    const { id, events } = e.data;

    const results = events.map((event, index) => {
        try {
            const parsed = TimelineEventSchema.parse(event);
            return { index, success: true, data: parsed };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return { index, success: false, error: error.format() };
            }
            return { index, success: false, error: 'Unknown validation error' };
        }
    });

    self.postMessage({ id, results } as ValidationResponse);
};
