import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'ty2499';
const REPO = 'edufiliova';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN is not set');
  process.exit(1);
}

async function main() {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  const filePath = 'package-lock.json';
  const content = fs.readFileSync('/home/runner/workspace/' + filePath);
  
  console.log('Getting current file SHA...');
  
  let sha: string | undefined;
  try {
    const { data: currentFile } = await octokit.repos.getContent({
      owner: OWNER, repo: REPO, path: filePath
    });
    sha = (currentFile as any).sha;
    console.log('Current SHA:', sha?.substring(0, 7));
  } catch (e: any) {
    if (e.status !== 404) throw e;
    console.log('File does not exist, will create new');
  }
  
  console.log('Uploading ' + filePath + '...');
  
  const { data: result } = await octokit.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO, path: filePath,
    message: 'Update package-lock.json for deployment',
    content: content.toString('base64'),
    sha: sha
  });
  
  console.log('Success! Pushed to GitHub.');
  console.log('Commit: ' + result.commit.sha);
}

main().catch(e => console.error('Error:', e.message));
