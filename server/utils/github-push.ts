// GitHub Push Utility - Uses Replit GitHub Connector
import { getUncachableGitHubClient } from '../lib/github';
import * as fs from 'fs';
import * as path from 'path';

interface PushResult {
  success: boolean;
  message: string;
  repoUrl?: string;
  commitSha?: string;
}

async function getFileContent(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf-8');
}

function shouldSkipFile(fileName: string, relativePath: string): boolean {
  const skipPatterns = [
    '.log', '.backup', '.broken', '.corrupted', '.daily_backup', '.fixed',
    '.lock', '.tmp', '.temp', '.cache', '.DS_Store'
  ];
  
  const skipDirs = [
    'node_modules', 'dist', '.git', 'uploads', 'attached_assets',
    '.cache', '.local', '.config', '.replit', '__pycache__', '.npm'
  ];
  
  for (const dir of skipDirs) {
    if (relativePath.includes(`/${dir}/`) || relativePath.startsWith(`${dir}/`)) {
      return true;
    }
  }
  
  for (const pattern of skipPatterns) {
    if (fileName.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

async function getAllFiles(dirPath: string, basePath: string = ''): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  const ignoreDirs = ['node_modules', 'dist', '.git', 'uploads', 'attached_assets', '.cache', '.local', '.config', '.npm', '__pycache__', '.replit'];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (!ignoreDirs.includes(entry.name) && !entry.name.startsWith('.')) {
        const subFiles = await getAllFiles(fullPath, relativePath);
        files.push(...subFiles);
      }
    } else {
      if (!shouldSkipFile(entry.name, relativePath)) {
        try {
          const stats = fs.statSync(fullPath);
          if (stats.size < 5 * 1024 * 1024) {
            const content = await getFileContent(fullPath);
            files.push({ path: relativePath, content });
          } else {
            console.log(`Skipping large file ${relativePath}: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
          }
        } catch (error) {
          console.log(`Skipping file ${relativePath}: Unable to read`);
        }
      }
    }
  }

  return files;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createBlobWithRetry(
  octokit: any,
  owner: string,
  repo: string,
  content: string,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(content).toString('base64'),
        encoding: 'base64',
      });
      return blob.sha;
    } catch (error: any) {
      if (error.status === 403 && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}...`);
        await sleep(waitTime);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

export async function pushToGitHub(repoName: string, branch: string = 'main', commitMessage: string = 'Update from Replit'): Promise<PushResult> {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);

    let repo;
    try {
      const { data: existingRepo } = await octokit.repos.get({
        owner: user.login,
        repo: repoName,
      });
      repo = existingRepo;
      console.log(`Using existing repository: ${repo.html_url}`);
    } catch (error: any) {
      if (error.status === 404) {
        const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          private: false,
          auto_init: true,
        });
        repo = newRepo;
        console.log(`Created new repository: ${repo.html_url}`);
        await sleep(2000);
      } else {
        throw error;
      }
    }

    const projectDir = process.cwd();
    const files = await getAllFiles(projectDir);
    console.log(`Found ${files.length} files to push`);

    let latestCommitSha: string;
    let treeSha: string;

    try {
      const { data: ref } = await octokit.git.getRef({
        owner: user.login,
        repo: repoName,
        ref: `heads/${branch}`,
      });
      latestCommitSha = ref.object.sha;

      const { data: commit } = await octokit.git.getCommit({
        owner: user.login,
        repo: repoName,
        commit_sha: latestCommitSha,
      });
      treeSha = commit.tree.sha;
    } catch (error: any) {
      if (error.status === 404) {
        const { data: ref } = await octokit.git.getRef({
          owner: user.login,
          repo: repoName,
          ref: 'heads/main',
        });
        latestCommitSha = ref.object.sha;

        const { data: commit } = await octokit.git.getCommit({
          owner: user.login,
          repo: repoName,
          commit_sha: latestCommitSha,
        });
        treeSha = commit.tree.sha;

        if (branch !== 'main') {
          await octokit.git.createRef({
            owner: user.login,
            repo: repoName,
            ref: `refs/heads/${branch}`,
            sha: latestCommitSha,
          });
        }
      } else {
        throw error;
      }
    }

    const BATCH_SIZE = 5;
    const BATCH_DELAY = 3000;
    const treeItems: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string }> = [];

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      
      for (const file of batch) {
        try {
          const sha = await createBlobWithRetry(octokit, user.login, repoName, file.content);
          treeItems.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha,
          });
        } catch (error: any) {
          console.log(`Failed to upload ${file.path}: ${error.message}`);
        }
      }

      console.log(`Processed ${Math.min(i + BATCH_SIZE, files.length)}/${files.length} files`);
      
      if (i + BATCH_SIZE < files.length) {
        await sleep(BATCH_DELAY);
      }
    }

    if (treeItems.length === 0) {
      return {
        success: false,
        message: 'No files were successfully processed',
      };
    }

    // Split tree items into chunks to avoid GitHub 502 errors
    const TREE_CHUNK_SIZE = 100;
    let currentTreeSha = treeSha;
    let currentCommitSha = latestCommitSha;
    
    for (let i = 0; i < treeItems.length; i += TREE_CHUNK_SIZE) {
      const chunk = treeItems.slice(i, i + TREE_CHUNK_SIZE);
      const chunkNum = Math.floor(i / TREE_CHUNK_SIZE) + 1;
      const totalChunks = Math.ceil(treeItems.length / TREE_CHUNK_SIZE);
      
      console.log(`Creating tree chunk ${chunkNum}/${totalChunks} with ${chunk.length} files...`);
      
      try {
        const { data: newTree } = await octokit.git.createTree({
          owner: user.login,
          repo: repoName,
          base_tree: currentTreeSha,
          tree: chunk,
        });

        const chunkMessage = totalChunks > 1 
          ? `${commitMessage} (part ${chunkNum}/${totalChunks})`
          : commitMessage;

        const { data: newCommit } = await octokit.git.createCommit({
          owner: user.login,
          repo: repoName,
          message: chunkMessage,
          tree: newTree.sha,
          parents: [currentCommitSha],
        });

        currentTreeSha = newTree.sha;
        currentCommitSha = newCommit.sha;
        
        console.log(`Chunk ${chunkNum} committed: ${newCommit.sha.substring(0, 7)}`);
        
        // Small delay between chunks to avoid rate limiting
        if (i + TREE_CHUNK_SIZE < treeItems.length) {
          await sleep(1000);
        }
      } catch (error: any) {
        console.error(`Failed to create tree chunk ${chunkNum}:`, error.message);
        throw error;
      }
    }

    await octokit.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: `heads/${branch}`,
      sha: currentCommitSha,
    });

    return {
      success: true,
      message: `Successfully pushed ${treeItems.length} files to ${repo.html_url}`,
      repoUrl: repo.html_url,
      commitSha: currentCommitSha,
    };
  } catch (error: any) {
    console.error('GitHub push error:', error);
    return {
      success: false,
      message: `Failed to push to GitHub: ${error.message}`,
    };
  }
}

export async function getGitHubUser() {
  try {
    const octokit = await getUncachableGitHubClient();
    const { data: user } = await octokit.users.getAuthenticated();
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function listRepos() {
  try {
    const octokit = await getUncachableGitHubClient();
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });
    return { success: true, repos: repos.map(r => ({ name: r.name, url: r.html_url, private: r.private })) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
