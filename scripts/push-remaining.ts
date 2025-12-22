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

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
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

const remainingFiles = [
  'client/src/components/TeacherMessagingDashboard.tsx',
  'client/src/components/TeacherTermsModal.tsx',
  'client/src/components/TestPapers.tsx',
  'client/src/components/ThemeProvider.tsx',
  'client/src/pages/Checkout.tsx',
  'client/src/pages/CheckoutAuth.tsx',
  'client/src/pages/ClaimCertificate.tsx',
  'client/src/pages/ChatTermsPage.tsx',
  'client/src/pages/Community.tsx',
  'server/middleware/auth.ts',
  'server/middleware/cache-middleware.ts',
  'server/middleware/location.ts',
  'server/middleware/rls-context.ts'
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pushRemainingFiles() {
  console.log('Starting to push remaining files...\n');
  
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  const repoName = 'edufiliova';
  
  const { data: ref } = await octokit.git.getRef({
    owner: user.login,
    repo: repoName,
    ref: 'heads/main'
  });
  const baseSha = ref.object.sha;
  console.log(`Base commit: ${baseSha.substring(0, 7)}\n`);
  
  const treeItems: Array<{
    path: string;
    mode: '100644';
    type: 'blob';
    sha: string;
  }> = [];
  
  for (const filePath of remainingFiles) {
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping (not found): ${filePath}`);
      continue;
    }
    
    console.log(`Pushing: ${filePath}`);
    await delay(15000);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const { data: blob } = await octokit.git.createBlob({
        owner: user.login,
        repo: repoName,
        content: content,
        encoding: 'utf-8'
      });
      
      treeItems.push({
        path: filePath,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
      
      console.log(`  ✅ Success`);
    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
  }
  
  if (treeItems.length === 0) {
    console.log('\nNo files to commit');
    return;
  }
  
  console.log(`\nCreating tree with ${treeItems.length} files...`);
  const { data: tree } = await octokit.git.createTree({
    owner: user.login,
    repo: repoName,
    tree: treeItems,
    base_tree: baseSha
  });
  
  console.log('Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner: user.login,
    repo: repoName,
    message: `Add remaining files - ${new Date().toISOString()}`,
    tree: tree.sha,
    parents: [baseSha]
  });
  
  console.log('Updating reference...');
  await octokit.git.updateRef({
    owner: user.login,
    repo: repoName,
    ref: 'heads/main',
    sha: commit.sha,
    force: true
  });
  
  console.log(`\n✅ Done! Pushed ${treeItems.length} files`);
  console.log(`Commit: ${commit.sha.substring(0, 7)}`);
}

pushRemainingFiles().catch(console.error);
