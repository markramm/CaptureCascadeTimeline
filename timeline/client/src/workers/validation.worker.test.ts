
import { describe, it, expect } from 'vitest';
import { TimelineEventSchema } from '../schemas/events';

// Mock the worker logic since validation is just running the schema
describe('Validation Worker Logic', () => {

    it('validates a correct event', () => {
        const validEvent = {
            id: '123',
            title: 'Valid Event Title',
            date: '2023-01-01',
            summary: 'This is a valid summary of the event.',
            tags: ['tag1'],
            sources: [{ url: 'https://example.com' }]
        };

        const result = TimelineEventSchema.safeParse(validEvent);
        expect(result.success).toBe(true);
    });

    it('rejects an invalid date', () => {
        const invalidEvent = {
            id: '124',
            title: 'Invalid Date Event',
            date: 'not-a-date', // Invalid format
            summary: 'Summary here',
            tags: ['tag1'],
            sources: []
        };

        const result = TimelineEventSchema.safeParse(invalidEvent);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.date).toBeDefined();
        }
    });

    it('rejects short title', () => {
        const invalidEvent = {
            id: '125',
            title: 'Tiny',
            date: '2023-01-01',
            summary: 'Valid summary here for testing purpose.',
            tags: ['tag1'],
            sources: [{ url: 'https://example.com' }]
        };
        const result = TimelineEventSchema.safeParse(invalidEvent);
        expect(result.success).toBe(false);
    });
});
