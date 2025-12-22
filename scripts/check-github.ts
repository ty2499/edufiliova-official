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
    
    // Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log('GitHub User:', user.login);
    
    // List repositories
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 50,
      sort: 'updated'
    });
    
    console.log('\n=== Recent Repositories ===');
    repos.forEach(repo => {
      console.log(`- ${repo.full_name} (${repo.updated_at})`);
    });
    
    // Search for hyperlift or edufiliova repos
    const relevantRepos = repos.filter(r => 
      r.name.toLowerCase().includes('edufiliova') || 
      r.name.toLowerCase().includes('hyperlift') ||
      r.description?.toLowerCase().includes('edufiliova')
    );
    
    if (relevantRepos.length > 0) {
      console.log('\n=== Relevant Repositories ===');
      relevantRepos.forEach(repo => {
        console.log(`- ${repo.full_name}`);
        console.log(`  URL: ${repo.html_url}`);
        console.log(`  Default branch: ${repo.default_branch}`);
        console.log(`  Updated: ${repo.updated_at}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
