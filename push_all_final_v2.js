import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { glob } from "glob";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function pushAllCode() {
  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN not found");
    process.exit(1);
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;
  const repoName = "edufiliova";
  const branch = "main";

  console.log(`Syncing all project files to ${owner}/${repoName}`);

  // Push all files except node_modules and .cache
  const files = await glob("**/*", {
    ignore: [
      "node_modules/**", 
      ".cache/**", 
      "push_all_final_v2.js"
    ],
    nodir: true,
    dot: true
  });

  console.log(`Found ${files.length} files to push.`);

  // Get current state
  let baseTree;
  let latestCommitSha;
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo: repoName, ref: `heads/${branch}` });
    latestCommitSha = ref.object.sha;
    const { data: commit } = await octokit.git.getCommit({ owner, repo: repoName, commit_sha: latestCommitSha });
    baseTree = commit.tree.sha;
  } catch (e) {
    console.log("Starting fresh or branch not found.");
  }

  const tree = [];
  const chunkSize = 25; 
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (file) => {
      try {
        if (!fs.existsSync(file)) return;
        const content = fs.readFileSync(file);
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo: repoName,
          content: content.toString("base64"),
          encoding: "base64",
        });
        tree.push({
          path: file,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        });
        console.log(`Uploaded: ${file}`);
      } catch (err) {
        console.error(`Error for ${file}:`, err.message);
      }
    }));
    // Throttling to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (tree.length === 0) {
    console.log("No files to push.");
    return;
  }

  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo: repoName,
    tree,
    base_tree: baseTree,
  });

  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo: repoName,
    message: "📦 Full Sync: Pushing all project files (only node_modules and .cache excluded)",
    tree: newTree.sha,
    parents: latestCommitSha ? [latestCommitSha] : [],
  });

  await octokit.git.updateRef({
    owner,
    repo: repoName,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
    force: true,
  });

  console.log("Total synchronization complete!");
}

pushAllCode();
