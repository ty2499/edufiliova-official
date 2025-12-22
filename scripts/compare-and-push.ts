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

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function main() {
  const octokit = await getUncachableGitHubClient();
  const owner = 'ty2499';
  const repo = 'filiova-learning-platform';
  
  // Check server/index.ts in the repo
  console.log('=== Checking server/index.ts in repo ===');
  try {
    const { data: serverIndex } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'server/index.ts'
    });
    if ('content' in serverIndex) {
      const content = Buffer.from(serverIndex.content, 'base64').toString('utf-8');
      // Show first 80 lines
      console.log(content.split('\n').slice(0, 80).join('\n'));
      console.log('\n... (truncated)');
    }
  } catch (e) {
    console.log('Error fetching server/index.ts:', e);
  }
  
  // Check if there are any GitHub Actions workflows
  console.log('\n=== Checking GitHub Actions ===');
  try {
    const { data: workflows } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '.github/workflows'
    });
    if (Array.isArray(workflows)) {
      console.log('Workflows found:');
      workflows.forEach(w => console.log(`- ${w.name}`));
    }
  } catch (e) {
    console.log('No GitHub Actions workflows found');
  }
  
  // Get the latest commit SHA
  console.log('\n=== Latest Commit Info ===');
  const { data: ref } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: 'heads/main'
  });
  console.log('Latest commit SHA:', ref.object.sha);
  
  const { data: commit } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: ref.object.sha
  });
  console.log('Commit message:', commit.message);
  console.log('Commit date:', commit.author.date);
}

main().catch(console.error);
