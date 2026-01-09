import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    getConfig,
    saveConfig,
    clearConfig,
    isGitHubRawUrl,
    toGitHubRawUrl,
    parseGitHubUrl,
} from './timeline';

describe('TimelineConfig', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        // Reset URL
        Object.defineProperty(window, 'location', {
            value: { search: '' },
            writable: true,
        });
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('getConfig', () => {
        it('returns defaults when no config exists', () => {
            const config = getConfig();
            expect(config.dataUrl).toBe('/api/timeline.json');
            expect(config.name).toBe('Timeline');
            expect(config.schemaVersion).toBe('1.0');
            expect(config.ai?.provider).toBe('mock');
        });

        it('uses localStorage config when present', () => {
            localStorage.setItem('timeline_config', JSON.stringify({
                dataUrl: 'https://example.com/timeline.json',
                name: 'My Timeline',
            }));

            const config = getConfig();
            expect(config.dataUrl).toBe('https://example.com/timeline.json');
            expect(config.name).toBe('My Timeline');
        });

        it('URL params override localStorage', () => {
            localStorage.setItem('timeline_config', JSON.stringify({
                dataUrl: 'https://stored.com/timeline.json',
                name: 'Stored Name',
            }));

            Object.defineProperty(window, 'location', {
                value: { search: '?timeline=https://url.com/timeline.json&name=URL%20Name' },
                writable: true,
            });

            const config = getConfig();
            expect(config.dataUrl).toBe('https://url.com/timeline.json');
            expect(config.name).toBe('URL Name');
        });
    });

    describe('saveConfig', () => {
        it('saves config to localStorage', () => {
            saveConfig({ dataUrl: 'https://test.com/data.json' });

            const stored = JSON.parse(localStorage.getItem('timeline_config') || '{}');
            expect(stored.dataUrl).toBe('https://test.com/data.json');
        });

        it('merges with existing config', () => {
            saveConfig({ dataUrl: 'https://test.com/data.json' });
            saveConfig({ name: 'New Name' });

            const stored = JSON.parse(localStorage.getItem('timeline_config') || '{}');
            expect(stored.dataUrl).toBe('https://test.com/data.json');
            expect(stored.name).toBe('New Name');
        });
    });

    describe('clearConfig', () => {
        it('removes config from localStorage', () => {
            saveConfig({ dataUrl: 'https://test.com/data.json' });
            clearConfig();

            expect(localStorage.getItem('timeline_config')).toBeNull();
        });
    });
});

describe('GitHub URL utilities', () => {
    describe('isGitHubRawUrl', () => {
        it('identifies raw.githubusercontent.com URLs', () => {
            expect(isGitHubRawUrl('https://raw.githubusercontent.com/user/repo/main/file.json')).toBe(true);
        });

        it('identifies github.com raw URLs', () => {
            expect(isGitHubRawUrl('https://github.com/user/repo/raw/main/file.json')).toBe(true);
        });

        it('rejects non-raw URLs', () => {
            expect(isGitHubRawUrl('https://github.com/user/repo/blob/main/file.json')).toBe(false);
            expect(isGitHubRawUrl('https://example.com/file.json')).toBe(false);
        });
    });

    describe('toGitHubRawUrl', () => {
        it('converts blob URLs to raw URLs', () => {
            const input = 'https://github.com/markramm/timeline/blob/main/data/timeline.json';
            const expected = 'https://raw.githubusercontent.com/markramm/timeline/main/data/timeline.json';
            expect(toGitHubRawUrl(input)).toBe(expected);
        });

        it('passes through already-raw URLs unchanged', () => {
            const input = 'https://raw.githubusercontent.com/user/repo/main/file.json';
            expect(toGitHubRawUrl(input)).toBe(input);
        });

        it('passes through non-GitHub URLs unchanged', () => {
            const input = 'https://example.com/timeline.json';
            expect(toGitHubRawUrl(input)).toBe(input);
        });
    });

    describe('parseGitHubUrl', () => {
        it('extracts owner, repo, and path from raw URLs', () => {
            const url = 'https://raw.githubusercontent.com/markramm/my-timeline/main/data/timeline.json';
            const result = parseGitHubUrl(url);
            expect(result).toEqual({
                owner: 'markramm',
                repo: 'my-timeline',
                path: 'data/timeline.json',
            });
        });

        it('returns null for non-GitHub URLs', () => {
            expect(parseGitHubUrl('https://example.com/file.json')).toBeNull();
        });
    });
});
