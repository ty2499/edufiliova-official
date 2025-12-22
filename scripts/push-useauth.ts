import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  const data = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken! } }
  ).then(res => res.json()).then(d => d.items?.[0]);

  return data?.settings?.access_token || data?.settings?.oauth?.credentials?.access_token;
}

async function main() {
  const octokit = new Octokit({ auth: await getAccessToken() });
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;
  const repo = 'edufiliova';
  
  const filePath = 'client/src/hooks/useAuth.tsx';
  const content = fs.readFileSync('/home/runner/workspace/' + filePath, 'utf8');
  
  console.log('Getting current file SHA...');
  
  const { data: currentFile } = await octokit.repos.getContent({
    owner, repo, path: filePath
  });
  
  const sha = (currentFile as any).sha;
  console.log('Current SHA:', sha);
  
  console.log('Uploading updated ' + filePath + '...');
  
  const { data: result } = await octokit.repos.createOrUpdateFileContents({
    owner, repo, path: filePath,
    message: 'Fix frontend cookie SameSite=None for cross-subdomain auth',
    content: Buffer.from(content).toString('base64'),
    sha: sha
  });
  
  console.log('Success! Pushed to GitHub.');
  console.log('Commit: ' + result.commit.sha);
}

main().catch(e => console.error('Error:', e.message));
