import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken(): Promise<string> {
  // First, check for personal access token in environment
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  // Fallback to Replit connector
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('GITHUB_TOKEN not set and Replit connector not available');
  }

  try {
    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

    if (!connectionSettings || !accessToken) {
      throw new Error('GitHub not connected');
    }
    return accessToken;
  } catch (error) {
    throw new Error('GitHub not connected. Please set GITHUB_TOKEN environment variable.');
  }
}

// WARNING: Never cache this client when using Replit connector.
// For personal access tokens, the client can be reused.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

// Get authenticated user info
export async function getAuthenticatedUser() {
  const octokit = await getUncachableGitHubClient();
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

// List user's repositories
export async function listRepositories() {
  const octokit = await getUncachableGitHubClient();
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100
  });
  return data;
}

// Get repository details
export async function getRepository(owner: string, repo: string) {
  const octokit = await getUncachableGitHubClient();
  const { data } = await octokit.repos.get({ owner, repo });
  return data;
}

// Create a new repository
export async function createRepository(name: string, description: string, isPrivate: boolean = true) {
  const octokit = await getUncachableGitHubClient();
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: isPrivate,
    auto_init: false
  });
  return data;
}

// Get repository contents
export async function getRepoContents(owner: string, repo: string, path: string = '') {
  const octokit = await getUncachableGitHubClient();
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    return data;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

// Create or update file in repository
export async function createOrUpdateFile(
  owner: string, 
  repo: string, 
  path: string, 
  content: string, 
  message: string,
  sha?: string
) {
  const octokit = await getUncachableGitHubClient();
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    sha
  });
  return data;
}

// List commits
export async function listCommits(owner: string, repo: string, perPage: number = 30) {
  const octokit = await getUncachableGitHubClient();
  const { data } = await octokit.repos.listCommits({ owner, repo, per_page: perPage });
  return data;
}

// Get file content from repo
export async function getFileContent(owner: string, repo: string, path: string) {
  const octokit = await getUncachableGitHubClient();
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if ('content' in data && data.type === 'file') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

// Push all project files to GitHub repository
export async function pushToGitHub(repoName: string) {
  const fs = await import('fs');
  const path = await import('path');
  
  const octokit = await getUncachableGitHubClient();
  
  // Get authenticated user
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;
  
  console.log(`Authenticated as: ${owner}`);
  
  // Check if repo exists, create if not
  try {
    await octokit.repos.get({ owner, repo: repoName });
    console.log(`Repository ${repoName} already exists`);
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`Creating repository ${repoName}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: false,
        auto_init: false
      });
      console.log(`Repository ${repoName} created`);
    } else {
      throw error;
    }
  }
  
  const ignoredPaths = [
    'node_modules',
    '.git',
    '.cache',
    '.replit',
    'replit.nix',
    '.upm',
    '.config',
    'dist',
    '.breakpoints',
    'generated-icon.png',
    '.replit.workflow',
    'tmp',
    '.local'
  ];
  
  function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const relativePath = path.relative('.', fullPath);
      
      if (ignoredPaths.some(ignored => relativePath.startsWith(ignored) || relativePath === ignored)) {
        continue;
      }
      
      if (fs.statSync(fullPath).isDirectory()) {
        getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(relativePath);
      }
    }
    
    return arrayOfFiles;
  }
  
  const allFiles = getAllFiles('.');
  console.log(`Found ${allFiles.length} files to push`);
  
  // Get the current commit SHA (if repo has commits)
  let baseSha: string | undefined;
  let baseTree: string | undefined;
  
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: 'heads/main'
    });
    baseSha = ref.object.sha;
    
    const { data: commit } = await octokit.git.getCommit({
      owner,
      repo: repoName,
      commit_sha: baseSha
    });
    baseTree = commit.tree.sha;
  } catch (error) {
    console.log('No existing commits found, creating initial commit');
  }
  
  // Create blobs for all files
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  
  for (const filePath of allFiles) {
    try {
      const content = fs.readFileSync(filePath);
      
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo: repoName,
        content: content.toString('base64'),
        encoding: 'base64'
      });
      
      treeItems.push({
        path: filePath,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
      
      console.log(`Uploaded: ${filePath}`);
    } catch (error) {
      console.error(`Failed to upload ${filePath}:`, error);
    }
  }
  
  // Create tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo: repoName,
    tree: treeItems,
    base_tree: baseTree
  });
  
  // Create commit
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo: repoName,
    message: 'Push all files from Replit',
    tree: tree.sha,
    parents: baseSha ? [baseSha] : []
  });
  
  // Update or create reference
  try {
    await octokit.git.updateRef({
      owner,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha
    });
  } catch (error) {
    await octokit.git.createRef({
      owner,
      repo: repoName,
      ref: 'refs/heads/main',
      sha: commit.sha
    });
  }
  
  const repoUrl = `https://github.com/${owner}/${repoName}`;
  console.log(`Successfully pushed to ${repoUrl}`);
  return repoUrl;
}
