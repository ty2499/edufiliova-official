import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

let connectionSettings: any;

async function getAccessToken() {
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

  return connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
}

async function pushFile(octokit: Octokit, owner: string, repo: string, filePath: string) {
  const content = fs.readFileSync(filePath);
  const base64Content = content.toString('base64');
  
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
    if (!Array.isArray(data) && 'sha' in data) sha = data.sha;
  } catch {}

  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path: filePath,
    message: `Add push notifications for community, portfolio, messages`,
    content: base64Content,
    sha
  });
  console.log(`✅ Pushed: ${filePath}`);
}

async function main() {
  const token = await getAccessToken();
  const octokit = new Octokit({ auth: token });
  const owner = 'ty2499', repo = 'edufiliova';
  
  const files = [
    'shared/schema.ts',
    'server/index.ts',
    'server/services/push-notifications.ts',
    'server/routes/push-notification-routes.ts',
    'server/routes/portfolio.ts',
    'server/community-routes.ts'
  ];
  
  for (const file of files) {
    await pushFile(octokit, owner, repo, file);
  }
  console.log('🎉 Done!');
}

main().catch(console.error);
