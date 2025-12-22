import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

// Uses Replit's GitHub connection for authentication
let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected - please set up the GitHub connection first');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Directories to ignore (exact match on path segments)
const IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.cache',
  '.upm',
  '.config',
  '.local',
  '.replit',
  '.breakpoints',
  'uploads',
  'tmp',
  'attached_assets'
];

// Files to ignore (exact match or extension)
const IGNORED_FILES = [
  'replit.nix',
  '.env.local',
  'sedvC84Sb',
  'hero-section-sizes.pdf',
  'users-list.pdf'
];

// Extensions to ignore
const IGNORED_EXTENSIONS = [
  '.pdf'
];

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  
  // Check if any directory in path matches ignored directories
  for (const dir of IGNORED_DIRECTORIES) {
    if (parts.some(part => part === dir)) {
      return true;
    }
  }
  
  // Check if filename matches ignored files
  if (IGNORED_FILES.includes(fileName)) {
    return true;
  }
  
  // Check if file extension matches ignored extensions
  for (const ext of IGNORED_EXTENSIONS) {
    if (fileName.endsWith(ext)) {
      return true;
    }
  }
  
  return false;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative('.', fullPath);
    
    if (shouldIgnore(relativePath)) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(relativePath);
    }
  });

  return arrayOfFiles;
}

function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.mp3', '.mp4', '.wav', '.avi', '.mov',
    '.pdf', '.zip', '.tar', '.gz', '.rar',
    '.exe', '.dll', '.so', '.dylib'
  ];
  const ext = path.extname(filePath).toLowerCase();
  return binaryExtensions.includes(ext);
}

async function pushToGitHub() {
  console.log('🚀 Starting GitHub push...\n');
  
  const octokit = await getGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`✅ Authenticated as: ${user.login}\n`);
  
  const owner = 'ty2499';
  const repoName = 'edufiliova';
  let repo;
  
  try {
    const { data: existingRepo } = await octokit.repos.get({
      owner: owner,
      repo: repoName
    });
    repo = existingRepo;
    console.log(`📁 Found existing repository: ${repo.full_name}\n`);
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`📝 Creating new repository: ${repoName}\n`);
      const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'EduFiliova - Online Learning Platform',
        private: false,
        auto_init: false
      });
      repo = newRepo;
      console.log(`✅ Created repository: ${repo.full_name}\n`);
    } else {
      throw error;
    }
  }
  
  console.log('📂 Collecting files...\n');
  const allFiles = getAllFiles('.');
  console.log(`Found ${allFiles.length} files to push\n`);
  
  let existingSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: owner,
      repo: repoName,
      ref: 'heads/main'
    });
    existingSha = ref.object.sha;
    console.log(`📍 Found existing main branch at: ${existingSha.substring(0, 7)}\n`);
  } catch (error: any) {
    if (error.status !== 404) {
      try {
        const { data: ref } = await octokit.git.getRef({
          owner: owner,
          repo: repoName,
          ref: 'heads/master'
        });
        existingSha = ref.object.sha;
        console.log(`📍 Found existing master branch at: ${existingSha.substring(0, 7)}\n`);
      } catch {
        console.log('📍 No existing branch found, creating new repository\n');
      }
    }
  }
  
  console.log('📤 Creating blobs for files...\n');
  const treeItems: Array<{
    path: string;
    mode: '100644' | '100755' | '040000' | '160000' | '120000';
    type: 'blob' | 'tree' | 'commit';
    sha: string;
  }> = [];
  
  let processed = 0;
  let failed = 0;
  const failedFiles: string[] = [];
  
  for (const filePath of allFiles) {
    let retries = 5;
    while (retries > 0) {
      try {
        const content = fs.readFileSync(filePath);
        const isBinary = isBinaryFile(filePath);
        
        const { data: blob } = await octokit.git.createBlob({
          owner: owner,
          repo: repoName,
          content: isBinary ? content.toString('base64') : content.toString('utf-8'),
          encoding: isBinary ? 'base64' : 'utf-8'
        });
        
        treeItems.push({
          path: filePath,
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        });
        
        processed++;
        if (processed % 50 === 0) {
          console.log(`   Processed ${processed}/${allFiles.length} files`);
        }
        break;
      } catch (error: any) {
        retries--;
        if (retries === 0) {
          failed++;
          failedFiles.push(filePath);
          console.log(`   Failed: ${filePath}`);
        } else {
          await delay(5000);
        }
      }
    }
    await delay(100);
  }
  
  if (failedFiles.length > 0) {
    console.log('\n⏳ Retrying failed files with longer delays...\n');
    for (const filePath of failedFiles) {
      await delay(10000);
      try {
        const content = fs.readFileSync(filePath);
        const isBinary = isBinaryFile(filePath);
        
        const { data: blob } = await octokit.git.createBlob({
          owner: owner,
          repo: repoName,
          content: isBinary ? content.toString('base64') : content.toString('utf-8'),
          encoding: isBinary ? 'base64' : 'utf-8'
        });
        
        treeItems.push({
          path: filePath,
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        });
        
        failed--;
        console.log(`   ✅ Recovered: ${filePath}`);
      } catch (error: any) {
        console.log(`   ❌ Still failed: ${filePath}`);
      }
    }
  }
  
  console.log(`\n   Total: ${processed}/${allFiles.length} files (${failed} failed)`)
  
  console.log('\n🌳 Creating tree in batches...\n');
  
  let currentTreeSha = existingSha;
  const batchSize = 100;
  const totalBatches = Math.ceil(treeItems.length / batchSize);
  
  for (let i = 0; i < treeItems.length; i += batchSize) {
    const batch = treeItems.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    console.log(`   Creating tree batch ${batchNum}/${totalBatches} (${batch.length} files)...`);
    
    let retries = 3;
    while (retries > 0) {
      try {
        const { data: batchTree } = await octokit.git.createTree({
          owner: owner,
          repo: repoName,
          tree: batch,
          base_tree: currentTreeSha
        });
        currentTreeSha = batchTree.sha;
        break;
      } catch (error: any) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        console.log(`   Tree batch failed, retrying in 5 seconds...`);
        await delay(5000);
      }
    }
  }
  
  const tree = { sha: currentTreeSha! };
  
  console.log('💾 Creating commit...\n');
  const { data: commit } = await octokit.git.createCommit({
    owner: owner,
    repo: repoName,
    message: `Push from Replit - ${new Date().toISOString()}`,
    tree: tree.sha,
    parents: existingSha ? [existingSha] : []
  });
  
  console.log('🔗 Updating reference...\n');
  try {
    await octokit.git.updateRef({
      owner: owner,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
      force: true
    });
  } catch {
    await octokit.git.createRef({
      owner: owner,
      repo: repoName,
      ref: 'refs/heads/main',
      sha: commit.sha
    });
  }
  
  console.log('\n✅ Successfully pushed to GitHub!');
  console.log(`🔗 Repository URL: ${repo.html_url}`);
  console.log(`📊 Total files pushed: ${treeItems.length}`);
  console.log(`🆔 Commit SHA: ${commit.sha.substring(0, 7)}`);
}

pushToGitHub().catch(console.error);
