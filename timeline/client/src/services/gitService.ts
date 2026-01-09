/**
 * Git Service
 *
 * Handles GitHub operations for timeline sync and collaboration:
 * - Sync events to a repository
 * - Fork repositories
 * - Create pull requests
 */

import { Octokit } from '@octokit/rest';
import type { TimelineEvent } from '../schemas/events';

export interface GitConfig {
    token: string;
    owner: string;
    repo: string;
    path: string; // Path to timeline.json in the repo
}

export interface UpstreamConfig {
    owner: string;
    repo: string;
}

export interface ForkResult {
    success: boolean;
    owner: string;
    repo: string;
    url: string;
}

export interface PullRequestResult {
    success: boolean;
    number: number;
    url: string;
    title: string;
}

const STORAGE_KEY = 'utc_git_config';
const UPSTREAM_KEY = 'utc_upstream_config';

// --- Config Management ---

export const getGitConfig = (): GitConfig | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const saveGitConfig = (config: GitConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const getUpstreamConfig = (): UpstreamConfig | null => {
    const stored = localStorage.getItem(UPSTREAM_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const saveUpstreamConfig = (config: UpstreamConfig) => {
    localStorage.setItem(UPSTREAM_KEY, JSON.stringify(config));
};

// --- Sync Operations ---

export const syncToGitHub = async (
    events: TimelineEvent[],
    message: string = 'Update timeline from UTC'
): Promise<{ updated: boolean; sha: string }> => {
    const config = getGitConfig();
    if (!config) throw new Error("GitHub configuration missing");

    const octokit = new Octokit({ auth: config.token });

    // 1. Get current SHA
    let sha: string | undefined;
    try {
        const { data } = await octokit.repos.getContent({
            owner: config.owner,
            repo: config.repo,
            path: config.path
        });

        if (!Array.isArray(data) && data.type === 'file') {
            sha = data.sha;
        }
    } catch (e: unknown) {
        const error = e as { status?: number };
        if (error.status !== 404) throw e;
        // If 404, file doesn't exist, will be created
    }

    // 2. Update or Create
    const content = btoa(JSON.stringify(events, null, 2)); // Base64 encode

    const { data: updateData } = await octokit.repos.createOrUpdateFileContents({
        owner: config.owner,
        repo: config.repo,
        path: config.path,
        message,
        content,
        sha
    });

    return { updated: true, sha: updateData.commit.sha as string };
};

// --- Fork Operations ---

/**
 * Fork a repository to the authenticated user's account
 */
export const forkRepository = async (
    sourceOwner: string,
    sourceRepo: string
): Promise<ForkResult> => {
    const config = getGitConfig();
    if (!config) throw new Error("GitHub configuration missing");

    const octokit = new Octokit({ auth: config.token });

    try {
        const { data } = await octokit.repos.createFork({
            owner: sourceOwner,
            repo: sourceRepo
        });

        // Save the upstream config for future PR creation
        saveUpstreamConfig({ owner: sourceOwner, repo: sourceRepo });

        return {
            success: true,
            owner: data.owner.login,
            repo: data.name,
            url: data.html_url
        };
    } catch (e: unknown) {
        const error = e as { status?: number; message?: string };

        // Fork might already exist (status 422)
        if (error.status === 422) {
            // Get the authenticated user to find existing fork
            const { data: user } = await octokit.users.getAuthenticated();

            return {
                success: true,
                owner: user.login,
                repo: sourceRepo, // Forks typically keep the same name
                url: `https://github.com/${user.login}/${sourceRepo}`
            };
        }

        throw e;
    }
};

/**
 * Check if the authenticated user has a fork of a repository
 */
export const checkForExistingFork = async (
    sourceOwner: string,
    sourceRepo: string
): Promise<ForkResult | null> => {
    const config = getGitConfig();
    if (!config) return null;

    const octokit = new Octokit({ auth: config.token });

    try {
        const { data: user } = await octokit.users.getAuthenticated();

        // Try to get the repo - if it exists and is a fork of the source, return it
        const { data: repo } = await octokit.repos.get({
            owner: user.login,
            repo: sourceRepo
        });

        if (repo.fork && repo.parent?.full_name === `${sourceOwner}/${sourceRepo}`) {
            return {
                success: true,
                owner: user.login,
                repo: repo.name,
                url: repo.html_url
            };
        }

        return null;
    } catch {
        // Repo doesn't exist
        return null;
    }
};

// --- Pull Request Operations ---

/**
 * Create a pull request from user's fork to the upstream repository
 */
export const createPullRequest = async (
    title: string,
    body: string,
    sourceBranch: string = 'main',
    targetBranch: string = 'main'
): Promise<PullRequestResult> => {
    const config = getGitConfig();
    if (!config) throw new Error("GitHub configuration missing");

    const upstream = getUpstreamConfig();
    if (!upstream) throw new Error("Upstream repository not configured");

    const octokit = new Octokit({ auth: config.token });

    // Create PR from user's repo to upstream
    // Format: "username:branch"
    const head = `${config.owner}:${sourceBranch}`;

    const { data } = await octokit.pulls.create({
        owner: upstream.owner,
        repo: upstream.repo,
        title,
        body,
        head,
        base: targetBranch
    });

    return {
        success: true,
        number: data.number,
        url: data.html_url,
        title: data.title
    };
};

/**
 * Check if there's an open PR from user's fork to upstream
 */
export const checkForExistingPR = async (): Promise<PullRequestResult | null> => {
    const config = getGitConfig();
    if (!config) return null;

    const upstream = getUpstreamConfig();
    if (!upstream) return null;

    const octokit = new Octokit({ auth: config.token });

    try {
        const { data: prs } = await octokit.pulls.list({
            owner: upstream.owner,
            repo: upstream.repo,
            state: 'open',
            head: `${config.owner}:main`
        });

        if (prs.length > 0) {
            const pr = prs[0];
            return {
                success: true,
                number: pr.number,
                url: pr.html_url,
                title: pr.title
            };
        }

        return null;
    } catch {
        return null;
    }
};

/**
 * Sync fork with upstream (update fork from upstream)
 */
export const syncForkWithUpstream = async (): Promise<{ success: boolean; message: string }> => {
    const config = getGitConfig();
    if (!config) throw new Error("GitHub configuration missing");

    const upstream = getUpstreamConfig();
    if (!upstream) throw new Error("Upstream repository not configured");

    const octokit = new Octokit({ auth: config.token });

    try {
        await octokit.repos.mergeUpstream({
            owner: config.owner,
            repo: config.repo,
            branch: 'main'
        });

        return { success: true, message: 'Fork synced with upstream' };
    } catch (e: unknown) {
        const error = e as { status?: number; message?: string };

        if (error.status === 409) {
            return { success: false, message: 'Merge conflict - manual resolution required' };
        }

        throw e;
    }
};

/**
 * Get the default branch of a repository
 */
export const getDefaultBranch = async (owner: string, repo: string): Promise<string> => {
    const config = getGitConfig();
    if (!config) throw new Error("GitHub configuration missing");

    const octokit = new Octokit({ auth: config.token });

    const { data } = await octokit.repos.get({ owner, repo });
    return data.default_branch;
};
