import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to create mocks that can be referenced in vi.mock
const {
    mockGetContent,
    mockCreateOrUpdateFileContents,
    mockCreateFork,
    mockGetAuthenticated,
    mockGetRepo,
    mockCreatePull,
    mockListPulls,
    mockMergeUpstream,
    MockOctokit
} = vi.hoisted(() => {
    const mockGetContent = vi.fn();
    const mockCreateOrUpdateFileContents = vi.fn();
    const mockCreateFork = vi.fn();
    const mockGetAuthenticated = vi.fn();
    const mockGetRepo = vi.fn();
    const mockCreatePull = vi.fn();
    const mockListPulls = vi.fn();
    const mockMergeUpstream = vi.fn();

    class MockOctokit {
        repos = {
            getContent: mockGetContent,
            createOrUpdateFileContents: mockCreateOrUpdateFileContents,
            createFork: mockCreateFork,
            get: mockGetRepo,
            mergeUpstream: mockMergeUpstream,
        };
        users = {
            getAuthenticated: mockGetAuthenticated,
        };
        pulls = {
            create: mockCreatePull,
            list: mockListPulls,
        };
    }

    return {
        mockGetContent,
        mockCreateOrUpdateFileContents,
        mockCreateFork,
        mockGetAuthenticated,
        mockGetRepo,
        mockCreatePull,
        mockListPulls,
        mockMergeUpstream,
        MockOctokit
    };
});

vi.mock('@octokit/rest', () => ({
    Octokit: MockOctokit,
}));

import {
    getGitConfig,
    saveGitConfig,
    syncToGitHub,
    getUpstreamConfig,
    saveUpstreamConfig,
    forkRepository,
    checkForExistingFork,
    createPullRequest,
    checkForExistingPR,
    syncForkWithUpstream,
} from './gitService';

const mockConfig = {
    token: 'ghp_test123',
    owner: 'testuser',
    repo: 'test-timeline',
    path: 'data/timeline.json',
};

const mockUpstreamConfig = {
    owner: 'upstream-owner',
    repo: 'main-timeline',
};

const mockEvents = [
    {
        id: 'event-1',
        title: 'Test Event',
        date: '2024-01-01',
        summary: 'A test event for testing purposes.',
        tags: ['test'],
        sources: [],
        importance: 5,
        status: 'confirmed' as const,
        verification_history: [],
    },
];

describe('Git Config', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('returns null when no config exists', () => {
        expect(getGitConfig()).toBeNull();
    });

    it('saves and retrieves config', () => {
        saveGitConfig(mockConfig);
        const retrieved = getGitConfig();

        expect(retrieved).toEqual(mockConfig);
    });

    it('overwrites existing config', () => {
        saveGitConfig(mockConfig);
        saveGitConfig({ ...mockConfig, repo: 'new-repo' });

        const retrieved = getGitConfig();
        expect(retrieved?.repo).toBe('new-repo');
    });
});

describe('Upstream Config', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('returns null when no upstream config exists', () => {
        expect(getUpstreamConfig()).toBeNull();
    });

    it('saves and retrieves upstream config', () => {
        saveUpstreamConfig(mockUpstreamConfig);
        const retrieved = getUpstreamConfig();

        expect(retrieved).toEqual(mockUpstreamConfig);
    });
});

describe('syncToGitHub', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('throws error when config is missing', async () => {
        await expect(syncToGitHub(mockEvents)).rejects.toThrow('GitHub configuration missing');
    });

    it('creates file when it does not exist', async () => {
        saveGitConfig(mockConfig);

        mockGetContent.mockRejectedValue({ status: 404 });
        mockCreateOrUpdateFileContents.mockResolvedValue({
            data: { commit: { sha: 'newsha123' } },
        });

        const result = await syncToGitHub(mockEvents, 'Create timeline');

        expect(result.updated).toBe(true);
        expect(result.sha).toBe('newsha123');

        expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith({
            owner: 'testuser',
            repo: 'test-timeline',
            path: 'data/timeline.json',
            message: 'Create timeline',
            content: expect.any(String),
            sha: undefined,
        });
    });

    it('updates existing file with correct SHA', async () => {
        saveGitConfig(mockConfig);

        const existingSha = 'existingsha456';
        mockGetContent.mockResolvedValue({
            data: { sha: existingSha, type: 'file' },
        });
        mockCreateOrUpdateFileContents.mockResolvedValue({
            data: { commit: { sha: 'updatedsha789' } },
        });

        const result = await syncToGitHub(mockEvents, 'Update timeline');

        expect(result.updated).toBe(true);
        expect(result.sha).toBe('updatedsha789');

        expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith({
            owner: 'testuser',
            repo: 'test-timeline',
            path: 'data/timeline.json',
            message: 'Update timeline',
            content: expect.any(String),
            sha: existingSha,
        });
    });

    it('encodes content as base64', async () => {
        saveGitConfig(mockConfig);

        let capturedContent = '';
        mockGetContent.mockRejectedValue({ status: 404 });
        mockCreateOrUpdateFileContents.mockImplementation((params) => {
            capturedContent = params.content;
            return Promise.resolve({
                data: { commit: { sha: 'sha123' } },
            });
        });

        await syncToGitHub(mockEvents, 'Test');

        const decoded = atob(capturedContent);
        const parsed = JSON.parse(decoded);
        expect(parsed).toEqual(mockEvents);
    });

    it('propagates API errors', async () => {
        saveGitConfig(mockConfig);

        mockGetContent.mockRejectedValue({ status: 401, message: 'Bad credentials' });

        await expect(syncToGitHub(mockEvents)).rejects.toEqual({ status: 401, message: 'Bad credentials' });
    });
});

describe('forkRepository', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('throws error when config is missing', async () => {
        await expect(forkRepository('owner', 'repo')).rejects.toThrow('GitHub configuration missing');
    });

    it('creates a fork successfully', async () => {
        saveGitConfig(mockConfig);

        mockCreateFork.mockResolvedValue({
            data: {
                owner: { login: 'testuser' },
                name: 'main-timeline',
                html_url: 'https://github.com/testuser/main-timeline',
            },
        });

        const result = await forkRepository('upstream-owner', 'main-timeline');

        expect(result.success).toBe(true);
        expect(result.owner).toBe('testuser');
        expect(result.repo).toBe('main-timeline');
        expect(result.url).toBe('https://github.com/testuser/main-timeline');

        // Should save upstream config
        const upstream = getUpstreamConfig();
        expect(upstream).toEqual({ owner: 'upstream-owner', repo: 'main-timeline' });
    });

    it('handles existing fork (422 error)', async () => {
        saveGitConfig(mockConfig);

        mockCreateFork.mockRejectedValue({ status: 422 });
        mockGetAuthenticated.mockResolvedValue({
            data: { login: 'testuser' },
        });

        const result = await forkRepository('upstream-owner', 'main-timeline');

        expect(result.success).toBe(true);
        expect(result.owner).toBe('testuser');
        expect(result.repo).toBe('main-timeline');
    });
});

describe('checkForExistingFork', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('returns null when no config exists', async () => {
        const result = await checkForExistingFork('owner', 'repo');
        expect(result).toBeNull();
    });

    it('returns fork info when fork exists', async () => {
        saveGitConfig(mockConfig);

        mockGetAuthenticated.mockResolvedValue({
            data: { login: 'testuser' },
        });
        mockGetRepo.mockResolvedValue({
            data: {
                fork: true,
                parent: { full_name: 'upstream-owner/main-timeline' },
                name: 'main-timeline',
                html_url: 'https://github.com/testuser/main-timeline',
            },
        });

        const result = await checkForExistingFork('upstream-owner', 'main-timeline');

        expect(result).not.toBeNull();
        expect(result?.owner).toBe('testuser');
        expect(result?.repo).toBe('main-timeline');
    });

    it('returns null when repo is not a fork', async () => {
        saveGitConfig(mockConfig);

        mockGetAuthenticated.mockResolvedValue({
            data: { login: 'testuser' },
        });
        mockGetRepo.mockResolvedValue({
            data: {
                fork: false,
                name: 'main-timeline',
            },
        });

        const result = await checkForExistingFork('upstream-owner', 'main-timeline');
        expect(result).toBeNull();
    });
});

describe('createPullRequest', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('throws error when config is missing', async () => {
        await expect(createPullRequest('title', 'body')).rejects.toThrow('GitHub configuration missing');
    });

    it('throws error when upstream config is missing', async () => {
        saveGitConfig(mockConfig);
        await expect(createPullRequest('title', 'body')).rejects.toThrow('Upstream repository not configured');
    });

    it('creates a pull request successfully', async () => {
        saveGitConfig(mockConfig);
        saveUpstreamConfig(mockUpstreamConfig);

        mockCreatePull.mockResolvedValue({
            data: {
                number: 42,
                html_url: 'https://github.com/upstream-owner/main-timeline/pull/42',
                title: 'Add new events',
            },
        });

        const result = await createPullRequest('Add new events', 'Description of changes');

        expect(result.success).toBe(true);
        expect(result.number).toBe(42);
        expect(result.url).toBe('https://github.com/upstream-owner/main-timeline/pull/42');

        expect(mockCreatePull).toHaveBeenCalledWith({
            owner: 'upstream-owner',
            repo: 'main-timeline',
            title: 'Add new events',
            body: 'Description of changes',
            head: 'testuser:main',
            base: 'main',
        });
    });
});

describe('checkForExistingPR', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('returns null when no config exists', async () => {
        const result = await checkForExistingPR();
        expect(result).toBeNull();
    });

    it('returns null when no upstream config exists', async () => {
        saveGitConfig(mockConfig);
        const result = await checkForExistingPR();
        expect(result).toBeNull();
    });

    it('returns PR info when open PR exists', async () => {
        saveGitConfig(mockConfig);
        saveUpstreamConfig(mockUpstreamConfig);

        mockListPulls.mockResolvedValue({
            data: [{
                number: 42,
                html_url: 'https://github.com/upstream-owner/main-timeline/pull/42',
                title: 'Add new events',
            }],
        });

        const result = await checkForExistingPR();

        expect(result).not.toBeNull();
        expect(result?.number).toBe(42);
        expect(result?.title).toBe('Add new events');
    });

    it('returns null when no open PRs exist', async () => {
        saveGitConfig(mockConfig);
        saveUpstreamConfig(mockUpstreamConfig);

        mockListPulls.mockResolvedValue({ data: [] });

        const result = await checkForExistingPR();
        expect(result).toBeNull();
    });
});

describe('syncForkWithUpstream', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('throws error when config is missing', async () => {
        await expect(syncForkWithUpstream()).rejects.toThrow('GitHub configuration missing');
    });

    it('throws error when upstream config is missing', async () => {
        saveGitConfig(mockConfig);
        await expect(syncForkWithUpstream()).rejects.toThrow('Upstream repository not configured');
    });

    it('syncs fork successfully', async () => {
        saveGitConfig(mockConfig);
        saveUpstreamConfig(mockUpstreamConfig);

        mockMergeUpstream.mockResolvedValue({});

        const result = await syncForkWithUpstream();

        expect(result.success).toBe(true);
        expect(result.message).toBe('Fork synced with upstream');
    });

    it('handles merge conflict', async () => {
        saveGitConfig(mockConfig);
        saveUpstreamConfig(mockUpstreamConfig);

        mockMergeUpstream.mockRejectedValue({ status: 409 });

        const result = await syncForkWithUpstream();

        expect(result.success).toBe(false);
        expect(result.message).toContain('conflict');
    });
});
