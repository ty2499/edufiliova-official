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
  'dist',
  'build',
  'out',
  '.next'
];

// Files to ignore (exact match or extension)
const IGNORED_FILES = [
  'replit.nix',
  '.env.local',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

// Extensions to ignore
const IGNORED_EXTENSIONS = [
  '.log',
  '.pyc',
  '.map'
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
  console.log('🚀 Starting full source push (excluding builds) with batch tree creation...\n');
  
  const octokit = await getGitHubClient();
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`✅ Authenticated as: ${user.login}\n`);
  
  const owner = 'ty2499';
  const repoName = 'edufiliova';
  
  console.log('📂 Collecting all source files (HTML, TS, CSS, etc.)...\n');
  const allFiles = getAllFiles('.');
  console.log(`Found ${allFiles.length} source files to push\n`);
  
  let existingSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: owner,
      repo: repoName,
      ref: 'heads/main'
    });
    existingSha = ref.object.sha;
  } catch (error: any) {
    console.log('📍 Starting fresh or main branch not found\n');
  }
  
  console.log('📤 Creating blobs...\n');
  const treeItems: any[] = [];
  let processed = 0;
  
  const BATCH_SIZE = 20;
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (filePath) => {
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
          if (processed % 100 === 0) {
            console.log(`   Processed ${processed}/${allFiles.length} files`);
          }
          break;
        } catch (error: any) {
          retries--;
          if (error.status === 403) {
            console.log(`   ⚠️ Rate limit hit for ${filePath}, waiting 60s...`);
            await delay(60000);
          } else if (retries === 0) {
            console.error(`   ❌ Final failure for ${filePath}: ${error.message}`);
          } else {
            await delay(5000);
          }
        }
      }
    }));
    await delay(1000); 
  }
  
  console.log('\n🌳 Creating tree in batches to avoid 502 errors...\n');
  
  let currentTreeSha = existingSha;
  const TREE_BATCH_SIZE = 100;
  const totalTreeBatches = Math.ceil(treeItems.length / TREE_BATCH_SIZE);
  
  for (let i = 0; i < treeItems.length; i += TREE_BATCH_SIZE) {
    const batch = treeItems.slice(i, i + TREE_BATCH_SIZE);
    const batchNum = Math.floor(i / TREE_BATCH_SIZE) + 1;
    console.log(`   Creating tree batch ${batchNum}/${totalTreeBatches}...`);
    
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
        if (retries === 0) throw error;
        console.log(`   Tree batch failed, retrying in 10 seconds...`);
        await delay(10000);
      }
    }
  }
  
  console.log('💾 Creating commit...\n');
  const { data: commit } = await octokit.git.createCommit({
    owner: owner,
    repo: repoName,
    message: `Full source push (HTML/TS/CSS) - Batch Optimized - ${new Date().toISOString()}`,
    tree: currentTreeSha!,
    parents: existingSha ? [existingSha] : []
  });
  
  console.log('🔗 Updating main branch...\n');
  await octokit.git.updateRef({
    owner: owner,
    repo: repoName,
    ref: 'heads/main',
    sha: commit.sha,
    force: true
  });
  
  console.log('\n✅ Push complete! All source code and HTML emails are now on GitHub.');
  console.log(`📊 Total files: ${treeItems.length}`);
}

pushToGitHub().catch(console.error);
