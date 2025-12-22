import { getUncachableGitHubClient } from '../github-client';
import * as fs from 'fs';
import * as path from 'path';

const OWNER = 'ty2499';
const REPO = 'edufiliova';
const BRANCH = 'main';

interface FileChange {
  path: string;
  content: string;
}

async function getFilesToCommit(): Promise<FileChange[]> {
  const files: FileChange[] = [];
  
  const filePaths = [
    'client/src/pages/GetStarted.tsx',
    'client/src/pages/CourseBrowse.tsx',
    'client/src/pages/PortfolioGallery.tsx',
    'client/src/components/auth/authHeroConfigs.ts',
    'client/src/components/ui/testimonials.tsx',
    'server/github-client.ts',
    'server/scripts/github-push.ts',
    'server/scripts/upload-getstarted-images.ts',
    'server/scripts/upload-all-assets-to-r2.ts'
  ];
  
  for (const filePath of filePaths) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      files.push({ path: filePath, content });
    }
  }
  
  return files;
}

async function pushToGitHub() {
  try {
    console.log('🔄 Getting GitHub client...');
    const octokit = await getUncachableGitHubClient();
    
    console.log('📂 Getting files to commit...');
    const files = await getFilesToCommit();
    
    if (files.length === 0) {
      console.log('❌ No files to commit');
      return;
    }
    
    console.log(`📝 Found ${files.length} files to commit`);
    
    console.log('🔍 Getting current branch reference...');
    const { data: ref } = await octokit.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BRANCH}`
    });
    const currentCommitSha = ref.object.sha;
    console.log(`Current commit SHA: ${currentCommitSha}`);
    
    console.log('📥 Getting current commit...');
    const { data: currentCommit } = await octokit.git.getCommit({
      owner: OWNER,
      repo: REPO,
      commit_sha: currentCommitSha
    });
    const currentTreeSha = currentCommit.tree.sha;
    
    console.log('📤 Creating blobs for files...');
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner: OWNER,
          repo: REPO,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64'
        });
        console.log(`  ✓ Created blob for ${file.path}`);
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha
        };
      })
    );
    
    console.log('🌳 Creating new tree...');
    const { data: newTree } = await octokit.git.createTree({
      owner: OWNER,
      repo: REPO,
      base_tree: currentTreeSha,
      tree: blobs
    });
    
    console.log('💾 Creating commit...');
    const commitMessage = `fix: Migrate all asset imports to Cloudflare R2 URLs

- All image imports now use R2 hosted URLs instead of local files
- Updated: GetStarted, CourseBrowse, PortfolioGallery, authHeroConfigs, testimonials
- No more local attached_assets dependencies for Docker builds
- Added asset upload utilities`;

    const { data: newCommit } = await octokit.git.createCommit({
      owner: OWNER,
      repo: REPO,
      message: commitMessage,
      tree: newTree.sha,
      parents: [currentCommitSha]
    });
    
    console.log('🚀 Updating branch reference...');
    await octokit.git.updateRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BRANCH}`,
      sha: newCommit.sha
    });
    
    console.log(`✅ Successfully pushed to GitHub!`);
    console.log(`   Commit: ${newCommit.sha}`);
    console.log(`   URL: https://github.com/${OWNER}/${REPO}/commit/${newCommit.sha}`);
    
  } catch (error: any) {
    console.error('❌ Error pushing to GitHub:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    throw error;
  }
}

pushToGitHub();
