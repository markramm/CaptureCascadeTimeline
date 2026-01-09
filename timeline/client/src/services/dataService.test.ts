import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    fetchTimelineData,
    fetchTimelineDataWithRetry,
    validateTimelineUrl,
} from './dataService';
import { CURRENT_SCHEMA_VERSION } from '../schemas/events';
import type { TimelineConfig } from '../config/timeline';

// Mock event data
const mockEvents = [
    {
        id: 'test-event-1',
        title: 'Test Event One',
        date: '2024-01-15',
        summary: 'This is a test event summary that is long enough.',
        tags: ['test', 'mock'],
        sources: [],
        importance: 5,
        status: 'confirmed' as const,
        verification_history: [],
    },
    {
        id: 'test-event-2',
        title: 'Test Event Two',
        date: '2024-02-20',
        summary: 'Another test event with sufficient summary length.',
        tags: ['test'],
        sources: [],
        importance: 7,
        status: 'confirmed' as const,
        verification_history: [],
    },
];

// Mock timeline data in wrapped format
const mockTimelineData = {
    schema_version: CURRENT_SCHEMA_VERSION,
    name: 'Test Timeline',
    events: mockEvents,
};

// Helper to create a mock fetch
function createMockFetch(response: unknown, status = 200) {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        json: () => Promise.resolve(response),
    });
}

const defaultConfig: TimelineConfig = {
    dataUrl: '/api/timeline.json',
    name: 'Test',
    schemaVersion: '1.0',
};

describe('fetchTimelineData', () => {
    it('successfully fetches and parses wrapped timeline data', async () => {
        const mockFetch = createMockFetch(mockTimelineData);

        const result = await fetchTimelineData({
            fetch: mockFetch,
            config: defaultConfig,
        });

        expect(result.success).toBe(true);
        expect(result.events).toHaveLength(2);
        expect(result.data?.name).toBe('Test Timeline');
        expect(result.source).toBe('network');
        expect(mockFetch).toHaveBeenCalledWith('/api/timeline.json');
    });

    it('successfully fetches and parses legacy array format', async () => {
        const mockFetch = createMockFetch(mockEvents); // Raw array, no wrapper

        const result = await fetchTimelineData({
            fetch: mockFetch,
            config: defaultConfig,
        });

        expect(result.success).toBe(true);
        expect(result.events).toHaveLength(2);
        expect(result.data?.schema_version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('handles HTTP errors gracefully', async () => {
        const mockFetch = createMockFetch({}, 404);

        const result = await fetchTimelineData({
            fetch: mockFetch,
            config: defaultConfig,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('404');
    });

    it('handles network errors gracefully', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const result = await fetchTimelineData({
            fetch: mockFetch,
            config: defaultConfig,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Network error');
    });

    it('warns about incompatible schema versions', async () => {
        const futureVersionData = {
            ...mockTimelineData,
            schema_version: '2.0', // Incompatible major version
        };
        const mockFetch = createMockFetch(futureVersionData);

        const result = await fetchTimelineData({
            fetch: mockFetch,
            config: defaultConfig,
        });

        expect(result.success).toBe(true);
        expect(result.schemaWarning).toContain('schema version 2.0');
        expect(result.schemaWarning).toContain(CURRENT_SCHEMA_VERSION);
    });

    it('converts GitHub blob URLs to raw URLs', async () => {
        const mockFetch = createMockFetch(mockTimelineData);
        const config: TimelineConfig = {
            ...defaultConfig,
            dataUrl: 'https://github.com/user/repo/blob/main/timeline.json',
        };

        await fetchTimelineData({
            fetch: mockFetch,
            config,
        });

        expect(mockFetch).toHaveBeenCalledWith(
            'https://raw.githubusercontent.com/user/repo/main/timeline.json'
        );
    });
});

describe('fetchTimelineDataWithRetry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('returns immediately on success', async () => {
        const mockFetch = createMockFetch(mockTimelineData);

        const resultPromise = fetchTimelineDataWithRetry({
            fetch: mockFetch,
            config: defaultConfig,
        });

        const result = await resultPromise;

        expect(result.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('retries on server errors', async () => {
        const mockFetch = vi.fn()
            .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error', json: () => Promise.resolve({}) })
            .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error', json: () => Promise.resolve({}) })
            .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(mockTimelineData) });

        const resultPromise = fetchTimelineDataWithRetry(
            { fetch: mockFetch, config: defaultConfig },
            3,
            100
        );

        // Fast-forward through delays
        await vi.advanceTimersByTimeAsync(100);
        await vi.advanceTimersByTimeAsync(200);

        const result = await resultPromise;

        expect(result.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('does not retry on 4xx errors', async () => {
        const mockFetch = createMockFetch({}, 404);

        const result = await fetchTimelineDataWithRetry(
            { fetch: mockFetch, config: defaultConfig },
            3,
            100
        );

        expect(result.success).toBe(false);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});

describe('validateTimelineUrl', () => {
    it('validates a working timeline URL', async () => {
        const mockFetch = createMockFetch(mockTimelineData);

        const result = await validateTimelineUrl('https://example.com/timeline.json', {
            fetch: mockFetch,
        });

        expect(result.valid).toBe(true);
        expect(result.eventCount).toBe(2);
        expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('reports invalid URL', async () => {
        const mockFetch = createMockFetch({}, 404);

        const result = await validateTimelineUrl('https://example.com/missing.json', {
            fetch: mockFetch,
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('404');
    });
});
