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

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken! } }
  ).then(res => res.json()).then(data => data.items?.[0]);

  return connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
}

async function main() {
  const octokit = new Octokit({ auth: await getAccessToken() });
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;
  const repo = 'edufiliova';
  
  const files = [
    'attached_assets/image_1765188650578.png',
    'attached_assets/image_1765189043230.png',
    'attached_assets/image_1765189072896.png',
    'attached_assets/image_1765189169834.png'
  ];

  const { data: ref } = await octokit.rest.git.getRef({ owner, repo, ref: 'heads/main' });
  const { data: commit } = await octokit.rest.git.getCommit({ owner, repo, commit_sha: ref.object.sha });
  
  const treeItems: any[] = [];
  
  for (const file of files) {
    const content = fs.readFileSync('/home/runner/workspace/' + file);
    console.log('Uploading ' + file + ' (' + Math.round(content.length/1024) + 'KB)...');
    const { data: blob } = await octokit.rest.git.createBlob({
      owner, repo,
      content: content.toString('base64'),
      encoding: 'base64'
    });
    treeItems.push({ path: file, mode: '100644', type: 'blob', sha: blob.sha });
    console.log('  Done: ' + file);
  }
  
  const { data: newTree } = await octokit.rest.git.createTree({
    owner, repo, base_tree: commit.tree.sha, tree: treeItems
  });
  
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner, repo,
    message: 'Add remaining 4 image files',
    tree: newTree.sha,
    parents: [ref.object.sha]
  });
  
  await octokit.rest.git.updateRef({ owner, repo, ref: 'heads/main', sha: newCommit.sha });
  
  console.log('\nSuccess! All 4 files pushed.');
  console.log('Commit: ' + newCommit.sha);
}

main().catch(e => console.error('Error:', e.message));
