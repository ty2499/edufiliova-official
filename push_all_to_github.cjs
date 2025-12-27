const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const IGNORE_DIRS = ['.git', 'node_modules', 'dist', '.replit', '.cache', 'attached_assets'];
const IGNORE_FILES = ['push_all_to_github.cjs', 'push_to_github.cjs', 'package-lock.json'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (IGNORE_DIRS.includes(file) || IGNORE_FILES.includes(file)) return;
    
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

async function pushToGitHub() {
  const owner = "ty2499"; 
  const repo = "edufiliova"; 
  const branch = "main";

  console.log(`Starting full sync to GitHub repository: ${owner}/${repo}...`);

  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`
    });
    const latestCommitSHA = refData.object.sha;

    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSHA
    });
    const baseTreeSHA = commitData.tree.sha;

    const allFiles = getAllFiles(".");
    console.log(`Found ${allFiles.length} files to push.`);
    
    const tree = [];
    // Process in batches to avoid rate limits/payload size issues
    for (const filePath of allFiles) {
      try {
        const relativePath = path.relative(".", filePath);
        const stats = fs.statSync(filePath);
        
        // Skip files larger than 50MB (GitHub API limit is 100MB but smaller is safer)
        if (stats.size > 50 * 1024 * 1024) {
          console.log(`Skipping large file: ${relativePath}`);
          continue;
        }

        const content = fs.readFileSync(filePath);
        const { data: blobData } = await octokit.git.createBlob({
          owner,
          repo,
          content: content.toString("base64"),
          encoding: "base64"
        });
        
        tree.push({
          path: relativePath,
          mode: "100644",
          type: "blob",
          sha: blobData.sha
        });
        
        if (tree.length % 50 === 0) console.log(`Processed ${tree.length} files...`);
      } catch (err) {
        console.error(`Error processing ${filePath}:`, err.message);
      }
    }

    console.log("Creating new tree...");
    const { data: treeData } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSHA,
      tree
    });

    console.log("Creating commit...");
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: "Full project sync from Replit Agent",
      tree: treeData.sha,
      parents: [latestCommitSHA]
    });

    console.log("Updating reference...");
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha
    });

    console.log("Successfully pushed all code to GitHub!");
  } catch (error) {
    console.error("Error pushing to GitHub:", error.message);
    process.exit(1);
  }
}

pushToGitHub();
