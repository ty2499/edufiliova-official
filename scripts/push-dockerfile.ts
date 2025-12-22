import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

let connectionSettings: any;

async function getAccessToken(): Promise<string> {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Missing Replit connector tokens');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  );

  const data = await response.json();
  connectionSettings = data.items?.[0];
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function pushDockerfile() {
  console.log('🚀 Pushing Dockerfile update to GitHub...');
  
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const owner = 'ty2499';
  const repo = 'edufiliova';
  
  // Get current Dockerfile SHA
  let currentSha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: 'Dockerfile' });
    if (!Array.isArray(data)) {
      currentSha = data.sha;
    }
  } catch (e) {
    console.log('Dockerfile not found, will create new');
  }
  
  // Read local Dockerfile
  const content = fs.readFileSync('Dockerfile', 'utf-8');
  const base64Content = Buffer.from(content).toString('base64');
  
  // Update or create
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'Dockerfile',
    message: 'Fix: Set PORT=8080 for Hyperlift deployment',
    content: base64Content,
    sha: currentSha,
    branch: 'main'
  });
  
  console.log('✅ Dockerfile pushed successfully!');
  console.log(`   Commit: ${data.commit.sha.slice(0, 7)}`);
}

pushDockerfile().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
