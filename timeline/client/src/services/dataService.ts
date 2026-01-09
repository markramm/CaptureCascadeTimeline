/**
 * Data Service - Abstraction for fetching timeline data
 *
 * This service handles:
 * - Fetching timeline data from various sources (local, GitHub, custom URLs)
 * - Schema version compatibility checking
 * - Error handling and retries
 *
 * Designed to be testable with dependency injection.
 */

import { getConfig, toGitHubRawUrl, type TimelineConfig } from '../config/timeline';
import {
    parseTimelineData,
    isSchemaCompatible,
    CURRENT_SCHEMA_VERSION,
    type TimelineData,
    type TimelineEvent,
} from '../schemas/events';

export interface FetchResult {
    success: boolean;
    data?: TimelineData;
    events?: TimelineEvent[];
    error?: string;
    schemaWarning?: string;
    source: 'local' | 'network';
}

export interface DataServiceOptions {
    // Allow injecting fetch for testing
    fetch?: typeof globalThis.fetch;
    // Allow injecting config for testing
    config?: TimelineConfig;
}

/**
 * Fetch timeline data from the configured source
 */
export async function fetchTimelineData(options: DataServiceOptions = {}): Promise<FetchResult> {
    const fetchFn = options.fetch ?? globalThis.fetch;
    const config = options.config ?? getConfig();

    // Convert GitHub URLs to raw URLs if needed
    const url = toGitHubRawUrl(config.dataUrl);

    try {
        const response = await fetchFn(url);

        if (!response.ok) {
            return {
                success: false,
                error: `Failed to fetch timeline: ${response.status} ${response.statusText}`,
                source: 'network',
            };
        }

        const rawData = await response.json();
        const timelineData = parseTimelineData(rawData);

        // Check schema compatibility
        let schemaWarning: string | undefined;
        if (!isSchemaCompatible(timelineData.schema_version)) {
            schemaWarning = `Timeline uses schema version ${timelineData.schema_version}, ` +
                `but this viewer supports ${CURRENT_SCHEMA_VERSION}. Some features may not work correctly.`;
        }

        return {
            success: true,
            data: timelineData,
            events: timelineData.events,
            schemaWarning,
            source: 'network',
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            error: `Failed to fetch timeline: ${message}`,
            source: 'network',
        };
    }
}

/**
 * Fetch timeline data with retry logic
 */
export async function fetchTimelineDataWithRetry(
    options: DataServiceOptions = {},
    maxRetries = 3,
    delayMs = 1000
): Promise<FetchResult> {
    let lastResult: FetchResult | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        lastResult = await fetchTimelineData(options);

        if (lastResult.success) {
            return lastResult;
        }

        // Don't retry on 4xx errors (client errors)
        if (lastResult.error?.includes('4')) {
            return lastResult;
        }

        // Wait before retrying
        if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
        }
    }

    return lastResult!;
}

/**
 * Validate that a URL points to valid timeline data
 * Useful for the Settings UI when user enters a new timeline URL
 */
export async function validateTimelineUrl(
    url: string,
    options: DataServiceOptions = {}
): Promise<{ valid: boolean; eventCount?: number; error?: string; schemaVersion?: string }> {
    const result = await fetchTimelineData({
        ...options,
        config: { ...getConfig(), dataUrl: url },
    });

    if (!result.success) {
        return { valid: false, error: result.error };
    }

    return {
        valid: true,
        eventCount: result.events?.length ?? 0,
        schemaVersion: result.data?.schema_version,
    };
}
