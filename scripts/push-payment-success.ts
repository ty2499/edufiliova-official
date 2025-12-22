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

  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);

  return connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
}

async function pushFile(path: string, localPath: string, message: string) {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const content = fs.readFileSync(localPath, 'utf-8');
  const contentBase64 = Buffer.from(content).toString('base64');
  
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner: 'ty2499', repo: 'edufiliova', path });
    if ('sha' in data) sha = data.sha;
  } catch (e) {}
  
  await octokit.repos.createOrUpdateFileContents({
    owner: 'ty2499', repo: 'edufiliova', path, message, content: contentBase64, sha, branch: 'main'
  });
  
  console.log('✅ Pushed:', path);
}

async function main() {
  await pushFile('client/src/pages/PaymentSuccess.tsx', '/home/runner/workspace/client/src/pages/PaymentSuccess.tsx', 
    'Fix Dodo Payments test mode - handle test payments on success page');
}

main().catch(console.error);
