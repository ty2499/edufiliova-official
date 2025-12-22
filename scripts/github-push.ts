import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

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
    throw new Error('X_REPLIT_TOKEN not found');
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

async function pushFile() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const owner = 'ty2499';
  const repo = 'edufiliova';
  const path = 'cordova-app/google-services.json';
  
  // Read file content
  const content = fs.readFileSync('/home/runner/workspace/cordova-app/google-services.json', 'utf-8');
  const contentBase64 = Buffer.from(content).toString('base64');
  
  // Check if file exists to get its SHA
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if ('sha' in data) {
      sha = data.sha;
    }
  } catch (e) {
    // File doesn't exist yet
  }
  
  // Create or update file
  const result = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: 'Add Firebase google-services.json for FCM push notifications',
    content: contentBase64,
    sha,
    branch: 'main'
  });
  
  console.log('✅ Pushed to GitHub:', result.data.commit.html_url);
}

pushFile().catch(console.error);
