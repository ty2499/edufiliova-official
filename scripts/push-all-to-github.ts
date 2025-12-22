// GitHub integration for pushing all code changes via API
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
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
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

function getAllFiles(dir: string, excludePatterns: string[] = []): string[] {
  const files: string[] = [];
  
  function shouldExclude(filePath: string): boolean {
    return excludePatterns.some(pattern => filePath.includes(pattern));
  }
  
  function walkDir(currentDir: string) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      if (shouldExclude(fullPath)) continue;
      
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

async function pushFileToGitHub(octokit: Octokit, owner: string, repo: string, filePath: string, message: string, retries = 3): Promise<boolean> {
  const relativePath = path.relative(process.cwd(), filePath);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const content = fs.readFileSync(filePath);
      const contentBase64 = content.toString('base64');
      
      let sha: string | undefined;
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: relativePath,
        });
        if ('sha' in data) {
          sha = data.sha;
        }
      } catch (e: any) {
        if (e.status !== 404) throw e;
      }
      
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: relativePath,
        message,
        content: contentBase64,
        sha,
      });
      
      console.log(`✅ [${attempt}/${retries}] Pushed: ${relativePath}`);
      return true;
    } catch (error: any) {
      console.error(`❌ [${attempt}/${retries}] Failed ${relativePath}: ${error.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }
  return false;
}

async function main() {
  const owner = 'ty2499';
  const repo = 'edufiliova';
  const message = 'Update: Latest code changes from Replit - ' + new Date().toISOString();
  
  const excludePatterns = [
    'node_modules',
    '.git',
    '.backup',
    '.broken',
    '.corrupted',
    'dist/',
    '.replit',
    '.cache',
    'attached_assets',
    '.upm',
    '.config',
    'generated-icon',
    'snippets/',
  ];
  
  const directories = ['client', 'server', 'shared'];
  const configFiles = [
    'package.json',
    'tsconfig.json',
    'tailwind.config.ts',
    'postcss.config.js',
    'vite.config.ts',
    'drizzle.config.ts',
    'theme.json',
    'replit.md',
  ];
  
  console.log('🚀 Starting GitHub push...');
  console.log(`📦 Repository: ${owner}/${repo}`);
  
  const octokit = await getUncachableGitHubClient();
  
  let allFiles: string[] = [];
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir, excludePatterns);
      allFiles = allFiles.concat(files);
    }
  }
  
  for (const file of configFiles) {
    if (fs.existsSync(file)) {
      allFiles.push(file);
    }
  }
  
  console.log(`📁 Found ${allFiles.length} files to push`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    console.log(`\n[${i + 1}/${allFiles.length}] Processing: ${file}`);
    
    const success = await pushFileToGitHub(octokit, owner, repo, file, message);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    if (i < allFiles.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully pushed: ${successCount} files`);
  console.log(`❌ Failed: ${failCount} files`);
  console.log('='.repeat(50));
  
  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
