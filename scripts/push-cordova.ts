import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');

  const settings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);

  return settings?.settings?.access_token || settings?.settings?.oauth?.credentials?.access_token;
}

async function main() {
  const token = await getAccessToken();
  const octokit = new Octokit({ auth: token });
  const owner = 'ty2499', repo = 'edufiliova';
  const filePath = 'cordova-app/www/js/notifications.js';
  
  const content = fs.readFileSync(filePath);
  const base64Content = content.toString('base64');
  
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
    if (!Array.isArray(data) && 'sha' in data) sha = data.sha;
  } catch {}

  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path: filePath,
    message: `Use phone default notification sounds and vibration`,
    content: base64Content,
    sha
  });
  console.log('✅ Pushed:', filePath);
}

main().catch(console.error);
