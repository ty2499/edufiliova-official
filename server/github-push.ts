// GitHub integration for pushing code changes via API
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

async function pushFileToGitHub(owner: string, repo: string, filePath: string, message: string) {
  const octokit = await getUncachableGitHubClient();
  
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf-8');
  const contentBase64 = Buffer.from(content).toString('base64');
  
  // Get the relative path for GitHub
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Try to get the current file SHA (needed for updates)
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
    // File doesn't exist yet, that's fine
  }
  
  // Create or update the file
  const result = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: relativePath,
    message,
    content: contentBase64,
    sha,
  });
  
  console.log(`✅ Pushed ${relativePath} to GitHub`);
  return result;
}

// Main execution
async function main() {
  const owner = 'ty2499';
  const repo = 'edufiliova';
  const message = 'Fix: Make Supabase configuration optional to prevent blank page on deployment';
  
  const filesToPush = [
    'client/src/lib/supabase.ts',
    'client/src/hooks/useSocialAuth.tsx',
    'client/src/components/ProfileCompletionForm.tsx',
    'client/src/components/RoleSelectionDashboard.tsx',
  ];
  
  try {
    for (const file of filesToPush) {
      await pushFileToGitHub(owner, repo, file, message);
    }
    console.log('✅ Successfully pushed all changes to GitHub!');
  } catch (error) {
    console.error('❌ Failed to push to GitHub:', error);
    process.exit(1);
  }
}

main();
