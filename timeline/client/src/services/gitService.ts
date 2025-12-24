
import { Octokit } from '@octokit/rest';
import type { TimelineEvent } from '../schemas/events';

interface GitConfig {
    token: string;
    owner: string;
    repo: string;
    path: string; // Path to timeline.json in the repo
}

const STORAGE_KEY = 'utc_git_config';

export const getGitConfig = (): GitConfig | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const saveGitConfig = (config: GitConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const syncToGitHub = async (events: TimelineEvent[], message: string = 'Update timeline from UTC'): Promise<{ updated: boolean, sha: string }> => {
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
