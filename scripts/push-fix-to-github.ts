import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

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

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function main() {
  const octokit = new Octokit({ auth: await getAccessToken() });
  const owner = 'ty2499';
  const repo = 'filiova-learning-platform';
  
  // Files to update
  const filesToUpdate = [
    'server/index.ts',
    'server/static-server.ts',
    'server/seed-api-keys.ts',
    'server/utils/settings.ts'
  ];
  
  // Get the latest commit SHA
  const { data: ref } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: 'heads/main'
  });
  const latestSha = ref.object.sha;
  
  // Get the tree
  const { data: commit } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: latestSha
  });
  
  console.log('Current commit:', latestSha);
  console.log('Updating files...');
  
  // Create blobs for each file
  const blobs = [];
  for (const filePath of filesToUpdate) {
    const fullPath = path.join('/home/runner/workspace', filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(content).toString('base64'),
        encoding: 'base64'
      });
      blobs.push({
        path: filePath,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha
      });
      console.log(`  ✅ Created blob for ${filePath}`);
    } else {
      console.log(`  ⚠️ File not found: ${filePath}`);
    }
  }
  
  // Create new tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: commit.tree.sha,
    tree: blobs
  });
  console.log('Created new tree:', newTree.sha);
  
  // Create commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: 'Fix: Remove static vite import to fix production 503 error - use dynamic imports for vite in development only',
    tree: newTree.sha,
    parents: [latestSha]
  });
  console.log('Created commit:', newCommit.sha);
  
  // Update reference
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: 'heads/main',
    sha: newCommit.sha
  });
  console.log('✅ Successfully pushed to GitHub!');
  console.log(`View: https://github.com/${owner}/${repo}/commit/${newCommit.sha}`);
}

main().catch(console.error);
