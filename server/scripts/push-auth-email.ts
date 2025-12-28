
import { pushToGitHub } from '../utils/github-push';

async function pushSelectedFiles() {
  const repoName = 'EduFiliova';
  const branch = 'main';
  
  console.log(`Starting push for all project files (including auth and email templates)...`);
  
  const result = await pushToGitHub(repoName, branch, 'Pushing auth code and email templates');
  
  if (result.success) {
    console.log(`Success: ${result.message}`);
    console.log(`Repo URL: ${result.repoUrl}`);
  } else {
    console.error(`Error: ${result.message}`);
    process.exit(1);
  }
}

pushSelectedFiles().catch(err => {
  console.error(err);
  process.exit(1);
});
