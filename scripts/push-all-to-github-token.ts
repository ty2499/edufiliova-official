import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

// Uses GITHUB_TOKEN secret directly for authentication
async function getGitHubClient() {
  const accessToken = process.env.GITHUB_TOKEN;
  if (!accessToken) {
    throw new Error('GITHUB_TOKEN secret not found');
  }
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
  'attached_assets',
  'dist'
];

// Files to ignore (exact match or extension)
const IGNORED_FILES = [
  'replit.nix',
  '.env.local',
  'hero-section-sizes.pdf',
  'users-list.pdf',
  'package-lock.json'
];

// Extensions to ignore
const IGNORED_EXTENSIONS = [
  '.pdf',
  '.log'
];

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  
  for (const dir of IGNORED_DIRECTORIES) {
    if (parts.some(part => part === dir)) {
      return true;
    }
  }
  
  if (IGNORED_FILES.includes(fileName)) {
    return true;
  }
  
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
    let relativePath = path.relative('.', fullPath);
    
    // Normalize path separators for GitHub
    relativePath = relativePath.split(path.sep).join('/');
    
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
  console.log('🚀 Starting GitHub push using GITHUB_TOKEN...\n');
  
  const octokit = await getGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`✅ Authenticated as: ${user.login}\n`);
  
  const owner = 'ty2499';
  const repoName = 'edufiliova-official';
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
    console.log('📍 No existing branch found, starting fresh\n');
  }
  
  console.log('📤 Creating blobs and tree items...\n');
  const treeItems: any[] = [];
  
  let processed = 0;
  
  // Limit concurrency to avoid hitting secondary rate limits
  const BATCH_SIZE = 20;
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (filePath) => {
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
      } catch (error: any) {
        console.error(`   ❌ Failed: ${filePath}`, error.message);
      }
    }));
    await delay(200); // Small delay between batches
  }
  
  console.log('\n🌳 Creating tree...\n');
  const { data: newTree } = await octokit.git.createTree({
    owner: owner,
    repo: repoName,
    tree: treeItems,
    base_tree: existingSha
  });
  
  console.log('💾 Creating commit...\n');
  const { data: commit } = await octokit.git.createCommit({
    owner: owner,
    repo: repoName,
    message: `EduFiliova Update - Facebook Auth Implementation - ${new Date().toISOString()}`,
    tree: newTree.sha,
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
  console.log(`📊 Total files in commit: ${treeItems.length}`);
}

pushToGitHub().catch(console.error);
