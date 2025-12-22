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

function isBinaryFile(fileName: string): boolean {
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.pdf'];
  return binaryExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

function shouldSkipFile(fileName: string, relativePath: string): boolean {
  const skipPatterns = ['.log', '.backup', '.broken', '.corrupted', '.daily_backup', '.fixed', '.lock', '.tmp', '.temp', '.cache', '.DS_Store'];
  const skipDirs = ['node_modules', '.git', 'uploads', '.cache', '.local', '.config', '.replit', '__pycache__', '.npm'];
  
  for (const dir of skipDirs) {
    if (relativePath.includes(`/${dir}/`) || relativePath.startsWith(`${dir}/`)) return true;
  }
  for (const pattern of skipPatterns) {
    if (fileName.includes(pattern)) return true;
  }
  return false;
}

async function getFilesInDir(dirPath: string, basePath: string = ''): Promise<{ path: string; content: string; isBinary: boolean }[]> {
  const files: { path: string; content: string; isBinary: boolean }[] = [];
  if (!fs.existsSync(dirPath)) return files;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const ignoreDirs = ['node_modules', '.git', 'uploads', 'attached_assets', '.cache', '.local', '.config', '.npm', '__pycache__', '.replit', 'dist'];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (!ignoreDirs.includes(entry.name) && !entry.name.startsWith('.')) {
        const subFiles = await getFilesInDir(fullPath, relativePath);
        files.push(...subFiles);
      }
    } else {
      if (!shouldSkipFile(entry.name, relativePath)) {
        try {
          const stats = fs.statSync(fullPath);
          if (stats.size < 10 * 1024 * 1024) {
            if (isBinaryFile(entry.name)) {
              const content = fs.readFileSync(fullPath);
              files.push({ path: relativePath, content: content.toString('base64'), isBinary: true });
            } else {
              const content = fs.readFileSync(fullPath, 'utf-8');
              files.push({ path: relativePath, content, isBinary: false });
            }
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
  isBinary: boolean,
  maxRetries: number = 5
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: isBinary ? content : Buffer.from(content).toString('base64'),
        encoding: 'base64',
      });
      return blob.sha;
    } catch (error: any) {
      if ((error.status === 403 || error.status === 429) && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 2000;
        console.log(`Rate limited, waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries}...`);
        await sleep(waitTime);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

export async function pushSourceToGitHub(repoName: string, branch: string = 'main', commitMessage: string = 'Update source from Replit'): Promise<PushResult> {
  try {
    const octokit = await getUncachableGitHubClient();
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);

    let repo;
    try {
      const { data: existingRepo } = await octokit.repos.get({ owner: user.login, repo: repoName });
      repo = existingRepo;
      console.log(`Using existing repository: ${repo.html_url}`);
    } catch (error: any) {
      if (error.status === 404) {
        return { success: false, message: `Repository ${repoName} not found.` };
      }
      throw error;
    }

    const projectDir = process.cwd();
    
    const serverFiles = await getFilesInDir(path.join(projectDir, 'server'), 'server');
    const clientFiles = await getFilesInDir(path.join(projectDir, 'client'), 'client');
    const sharedFiles = await getFilesInDir(path.join(projectDir, 'shared'), 'shared');
    const publicFiles = await getFilesInDir(path.join(projectDir, 'public'), 'public');
    const distFiles = await getFilesInDir(path.join(projectDir, 'dist'), 'dist');
    const migrationsFiles = await getFilesInDir(path.join(projectDir, 'migrations'), 'migrations');
    const attachedAssetsFiles = await getFilesInDir(path.join(projectDir, 'attached_assets'), 'attached_assets');
    
    const rootFiles: { path: string; content: string; isBinary: boolean }[] = [];
    const rootFilesToInclude = ['package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 'postcss.config.js', 'drizzle.config.ts', 'index.html', '.gitignore', 'components.json', 'Dockerfile'];
    
    for (const fileName of rootFilesToInclude) {
      const fullPath = path.join(projectDir, fileName);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          rootFiles.push({ path: fileName, content, isBinary: false });
        } catch (e) {}
      }
    }

    const allFiles = [...rootFiles, ...serverFiles, ...clientFiles, ...sharedFiles, ...publicFiles, ...distFiles, ...migrationsFiles, ...attachedAssetsFiles];
    console.log(`Total files to push: ${allFiles.length}`);
    console.log(`  - Root: ${rootFiles.length}, Server: ${serverFiles.length}, Client: ${clientFiles.length}`);
    console.log(`  - Shared: ${sharedFiles.length}, Public: ${publicFiles.length}, Dist: ${distFiles.length}`);
    console.log(`  - Migrations: ${migrationsFiles.length}, Attached Assets: ${attachedAssetsFiles.length}`);

    let latestCommitSha: string;
    let treeSha: string;

    try {
      const { data: ref } = await octokit.git.getRef({ owner: user.login, repo: repoName, ref: `heads/${branch}` });
      latestCommitSha = ref.object.sha;
      const { data: commit } = await octokit.git.getCommit({ owner: user.login, repo: repoName, commit_sha: latestCommitSha });
      treeSha = commit.tree.sha;
    } catch (error: any) {
      if (error.status === 404) {
        const { data: ref } = await octokit.git.getRef({ owner: user.login, repo: repoName, ref: 'heads/main' });
        latestCommitSha = ref.object.sha;
        const { data: commit } = await octokit.git.getCommit({ owner: user.login, repo: repoName, commit_sha: latestCommitSha });
        treeSha = commit.tree.sha;
        if (branch !== 'main') {
          await octokit.git.createRef({ owner: user.login, repo: repoName, ref: `refs/heads/${branch}`, sha: latestCommitSha });
        }
      } else {
        throw error;
      }
    }

    const BATCH_SIZE = 5;
    const BATCH_DELAY = 3000;
    const treeItems: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string }> = [];

    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      
      for (const file of batch) {
        try {
          const sha = await createBlobWithRetry(octokit, user.login, repoName, file.content, file.isBinary);
          treeItems.push({ path: file.path, mode: '100644', type: 'blob', sha });
        } catch (error: any) {
          console.log(`Failed to upload ${file.path}: ${error.message}`);
        }
      }

      console.log(`Processed ${Math.min(i + BATCH_SIZE, allFiles.length)}/${allFiles.length} files`);
      if (i + BATCH_SIZE < allFiles.length) await sleep(BATCH_DELAY);
    }

    if (treeItems.length === 0) {
      return { success: false, message: 'No files were successfully processed' };
    }

    const { data: newTree } = await octokit.git.createTree({ owner: user.login, repo: repoName, base_tree: treeSha, tree: treeItems });
    const { data: newCommit } = await octokit.git.createCommit({ owner: user.login, repo: repoName, message: commitMessage, tree: newTree.sha, parents: [latestCommitSha] });
    await octokit.git.updateRef({ owner: user.login, repo: repoName, ref: `heads/${branch}`, sha: newCommit.sha });

    return {
      success: true,
      message: `Successfully pushed ${treeItems.length} files to ${repo.html_url}`,
      repoUrl: repo.html_url,
      commitSha: newCommit.sha,
      filesUploaded: treeItems.length,
    };
  } catch (error: any) {
    console.error('GitHub push error:', error);
    return { success: false, message: `Failed to push to GitHub: ${error.message}` };
  }
}
