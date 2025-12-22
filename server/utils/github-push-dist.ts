import { getUncachableGitHubClient } from '../lib/github';
import * as fs from 'fs';
import * as path from 'path';

interface PushResult {
  success: boolean;
  message: string;
  repoUrl?: string;
  commitSha?: string;
  filesUploaded?: number;
}

async function getFileContent(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf-8');
}

async function getBinaryContent(filePath: string): Promise<Buffer> {
  return fs.readFileSync(filePath);
}

function isBinaryFile(fileName: string): boolean {
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.otf', '.eot'];
  return binaryExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

async function getFilesInDir(dirPath: string, basePath: string = ''): Promise<{ path: string; content: string; isBinary: boolean }[]> {
  const files: { path: string; content: string; isBinary: boolean }[] = [];
  
  if (!fs.existsSync(dirPath)) {
    return files;
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subFiles = await getFilesInDir(fullPath, relativePath);
      files.push(...subFiles);
    } else {
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size < 50 * 1024 * 1024) {
          if (isBinaryFile(entry.name)) {
            const content = await getBinaryContent(fullPath);
            files.push({ path: relativePath, content: content.toString('base64'), isBinary: true });
          } else {
            const content = await getFileContent(fullPath);
            files.push({ path: relativePath, content, isBinary: false });
          }
        }
      } catch (error) {
        console.log(`Skipping file ${relativePath}: Unable to read`);
      }
    }
  }

  return files;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function pushDistToGitHub(repoName: string, branch: string = 'main', commitMessage: string = 'Update dist from Replit'): Promise<PushResult> {
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
        return {
          success: false,
          message: `Repository ${repoName} not found. Please create it first.`,
        };
      }
      throw error;
    }

    const projectDir = process.cwd();
    
    const distFiles = await getFilesInDir(path.join(projectDir, 'dist'), 'dist');
    console.log(`Found ${distFiles.length} files in dist folder`);
    
    const packageJson = await getFileContent(path.join(projectDir, 'package.json'));
    
    const allFiles = [
      ...distFiles,
      { path: 'package.json', content: packageJson, isBinary: false },
    ];
    
    console.log(`Total files to push: ${allFiles.length}`);

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
    const BATCH_DELAY = 1000;
    const treeItems: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string }> = [];

    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      
      for (const file of batch) {
        try {
          const { data: blob } = await octokit.git.createBlob({
            owner: user.login,
            repo: repoName,
            content: file.isBinary ? file.content : Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          treeItems.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha,
          });
        } catch (error: any) {
          console.log(`Failed to upload ${file.path}: ${error.message}`);
        }
      }

      console.log(`Processed ${Math.min(i + BATCH_SIZE, allFiles.length)}/${allFiles.length} files`);
      
      if (i + BATCH_SIZE < allFiles.length) {
        await sleep(BATCH_DELAY);
      }
    }

    if (treeItems.length === 0) {
      return {
        success: false,
        message: 'No files were successfully processed',
      };
    }

    const { data: newTree } = await octokit.git.createTree({
      owner: user.login,
      repo: repoName,
      base_tree: treeSha,
      tree: treeItems,
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner: user.login,
      repo: repoName,
      message: commitMessage,
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    await octokit.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    return {
      success: true,
      message: `Successfully pushed ${treeItems.length} files to ${repo.html_url}`,
      repoUrl: repo.html_url,
      commitSha: newCommit.sha,
      filesUploaded: treeItems.length,
    };
  } catch (error: any) {
    console.error('GitHub push error:', error);
    return {
      success: false,
      message: `Failed to push to GitHub: ${error.message}`,
    };
  }
}
