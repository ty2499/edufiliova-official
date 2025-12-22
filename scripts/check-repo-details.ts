import { Octokit } from '@octokit/rest';

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

async function main() {
  try {
    const accessToken = await getAccessToken();
    const octokit = new Octokit({ auth: accessToken });
    
    const owner = 'ty2499';
    const repo = 'filiova-learning-platform';
    
    // Get repository details
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    console.log('=== Repository Details ===');
    console.log(`Name: ${repoData.full_name}`);
    console.log(`URL: ${repoData.html_url}`);
    console.log(`Default Branch: ${repoData.default_branch}`);
    console.log(`Updated: ${repoData.updated_at}`);
    console.log(`Pushed: ${repoData.pushed_at}`);
    
    // Get recent commits
    console.log('\n=== Recent Commits ===');
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 5
    });
    commits.forEach(commit => {
      console.log(`- ${commit.sha.substring(0, 7)}: ${commit.commit.message.split('\n')[0]}`);
      console.log(`  Date: ${commit.commit.author?.date}`);
    });
    
    // Check root files
    console.log('\n=== Root Files ===');
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ''
    });
    if (Array.isArray(contents)) {
      contents.forEach(item => {
        console.log(`- ${item.name} (${item.type})`);
      });
    }
    
    // Check for Dockerfile
    console.log('\n=== Checking Dockerfile ===');
    try {
      const { data: dockerfile } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'Dockerfile'
      });
      if ('content' in dockerfile) {
        console.log('Dockerfile exists:');
        console.log(Buffer.from(dockerfile.content, 'base64').toString('utf-8'));
      }
    } catch (e) {
      console.log('No Dockerfile found');
    }
    
    // Check for package.json
    console.log('\n=== Checking package.json scripts ===');
    try {
      const { data: pkg } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'package.json'
      });
      if ('content' in pkg) {
        const pkgJson = JSON.parse(Buffer.from(pkg.content, 'base64').toString('utf-8'));
        console.log('Scripts:', JSON.stringify(pkgJson.scripts, null, 2));
      }
    } catch (e) {
      console.log('No package.json found');
    }
    
    // Check for environment files
    console.log('\n=== Environment Files ===');
    const envFiles = ['.env.example', '.env.sample', 'render.yaml', 'railway.json', 'fly.toml'];
    for (const file of envFiles) {
      try {
        await octokit.rest.repos.getContent({ owner, repo, path: file });
        console.log(`- ${file} exists`);
      } catch (e) {
        console.log(`- ${file} not found`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
