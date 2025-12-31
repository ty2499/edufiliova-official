
import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { glob } from "glob";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "ty2499";
const REPO_NAME = "edufiliova-official";

if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN is not set in environment variables.");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function pushToGithub() {
  try {
    console.log("🚀 Starting GitHub API push...");

    // 1. Get the latest commit on main
    const { data: refData } = await octokit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: "heads/main",
    });
    const baseTreeSha = refData.object.sha;

    // 2. Get the base tree
    const { data: commitData } = await octokit.git.getCommit({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      commit_sha: baseTreeSha,
    });
    const treeSha = commitData.tree.sha;

    // 3. Find all files to push (respecting basic ignores)
    // We filter more strictly to avoid hitting API limits/timeouts with too many files
    const files = await glob("**/*", {
      ignore: [
        "node_modules/**", 
        ".git/**", 
        "dist/**", 
        ".upm/**", 
        "Z/**", 
        "attached_assets/**",
        "public/fonts/**",
        "*.log"
      ],
      nodir: true,
    });

    console.log(`📦 Found ${files.length} files to push.`);

    // 4. Create blobs for each file in batches to avoid overwhelming the API
    const tree = [];
    const batchSize = 20;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      console.log(`📤 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}...`);
      
      await Promise.all(batch.map(async (file) => {
        try {
          const content = fs.readFileSync(file);
          const { data: blobData } = await octokit.git.createBlob({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            content: content.toString("base64"),
            encoding: "base64",
          });

          tree.push({
            path: file,
            mode: "100644",
            type: "blob",
            sha: blobData.sha,
          });
        } catch (err) {
          console.error(`❌ Error creating blob for ${file}:`, err.message);
        }
      }));
    }

    // 5. Create a new tree
    console.log("🌲 Creating new tree...");
    const { data: newTreeData } = await octokit.git.createTree({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      base_tree: treeSha,
      tree,
    });

    // 6. Create a new commit
    console.log("📝 Creating new commit...");
    const { data: newCommitData } = await octokit.git.createCommit({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      message: "Update from Replit via GitHub API (Optimized)",
      tree: newTreeData.sha,
      parents: [baseTreeSha],
    });

    // 7. Update the ref
    console.log("🔗 Updating reference...");
    await octokit.git.updateRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: "heads/main",
      sha: newCommitData.sha,
    });

    console.log("✅ Successfully pushed to GitHub!");
  } catch (error) {
    console.error("❌ Error pushing to GitHub:", error);
    process.exit(1);
  }
}

pushToGithub();
