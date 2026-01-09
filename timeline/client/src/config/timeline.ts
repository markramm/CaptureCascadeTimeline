/**
 * Timeline Configuration
 *
 * Supports multiple data sources and enables the multi-timeline architecture.
 * Configuration priority: URL params > localStorage > defaults
 */

export interface GitHubConfig {
    token: string;
    owner: string;
    repo: string;
    path: string;
    upstream?: {
        owner: string;
        repo: string;
    };
}

export interface AIConfig {
    provider: 'anthropic' | 'openai' | 'mock';
    apiKey?: string;
    model?: string;
}

export interface TimelineConfig {
    // Data source - where to fetch timeline.json
    dataUrl: string;

    // Timeline metadata
    name: string;
    description?: string;

    // Schema version for compatibility checking
    schemaVersion: '1.0';

    // GitHub configuration (for sync and PRs)
    github?: GitHubConfig;

    // AI configuration (for chat interface)
    ai?: AIConfig;
}

const STORAGE_KEY = 'timeline_config';
const DEFAULT_DATA_URL = '/api/timeline.json';

/**
 * Parse URL parameters for timeline configuration
 */
function getUrlParams(): Partial<TimelineConfig> {
    const params = new URLSearchParams(window.location.search);
    const result: Partial<TimelineConfig> = {};

    const timeline = params.get('timeline');
    if (timeline) {
        result.dataUrl = timeline;
    }

    const name = params.get('name');
    if (name) {
        result.name = name;
    }

    return result;
}

/**
 * Load configuration from localStorage
 */
function getStoredConfig(): Partial<TimelineConfig> | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Failed to parse stored timeline config:', e);
    }
    return null;
}

/**
 * Get the merged configuration from all sources
 * Priority: URL params > localStorage > defaults
 */
export function getConfig(): TimelineConfig {
    const urlParams = getUrlParams();
    const stored = getStoredConfig();

    return {
        dataUrl: urlParams.dataUrl ?? stored?.dataUrl ?? DEFAULT_DATA_URL,
        name: urlParams.name ?? stored?.name ?? 'Timeline',
        description: stored?.description,
        schemaVersion: '1.0',
        github: stored?.github,
        ai: stored?.ai ?? { provider: 'mock' },
    };
}

/**
 * Save configuration to localStorage
 */
export function saveConfig(config: Partial<TimelineConfig>): void {
    const current = getStoredConfig() ?? {};
    const merged = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

/**
 * Clear stored configuration
 */
export function clearConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if a URL is a valid GitHub raw URL
 */
export function isGitHubRawUrl(url: string): boolean {
    return url.includes('raw.githubusercontent.com') ||
           url.includes('github.com') && url.includes('/raw/');
}

/**
 * Convert a GitHub repo URL to raw content URL
 * e.g., https://github.com/user/repo/blob/main/timeline.json
 *    -> https://raw.githubusercontent.com/user/repo/main/timeline.json
 */
export function toGitHubRawUrl(url: string): string {
    if (isGitHubRawUrl(url)) {
        return url;
    }

    // Convert github.com blob URLs to raw URLs
    const blobMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)/);
    if (blobMatch) {
        const [, owner, repo, path] = blobMatch;
        return `https://raw.githubusercontent.com/${owner}/${repo}/${path}`;
    }

    return url;
}

/**
 * Extract GitHub owner/repo from a raw URL
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string; path: string } | null {
    const rawMatch = url.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/[^/]+\/(.+)/);
    if (rawMatch) {
        const [, owner, repo, path] = rawMatch;
        return { owner, repo, path };
    }
    return null;
}
