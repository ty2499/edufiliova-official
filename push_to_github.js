import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { glob } from "glob";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function pushToGitHub() {
  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN not found");
    process.exit(1);
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  // Get authenticated user
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;

  // Since we are in Replit and git push is restricted, we'll try to find the repo name.
  // The user says it's already connected. We'll use the REPL_SLUG or REPL_ID.
  const repoName = process.env.REPL_SLUG || "replit-project";
  const branch = "main";

  console.log(`Pushing to ${owner}/${repoName} on branch ${branch}`);

  const files = await glob("**/*", {
    ignore: ["node_modules/**", ".cache/**", ".git/**", "dist/**", "push_to_github.js"],
    nodir: true,
    dot: true
  });

  console.log(`Found ${files.length} files to push.`);

  // Get the latest commit on the branch
  let baseTree;
  let latestCommitSha;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${branch}`,
    });
    latestCommitSha = ref.object.sha;
    const { data: commit } = await octokit.git.getCommit({
      owner,
      repo: repoName,
      commit_sha: latestCommitSha,
    });
    baseTree = commit.tree.sha;
  } catch (e) {
    console.log(`Branch ${branch} not found or repo empty. Error: ${e.message}`);
    // If repo is empty, we'll create the first commit without a base tree
  }

  const tree = [];
  // Process in chunks to avoid hitting limits
  const chunkSize = 50;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (file) => {
      try {
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
        console.log(`Created blob for ${file}`);
      } catch (err) {
        console.error(`Failed to create blob for ${file}: ${err.message}`);
      }
    }));
  }

  // Create a new tree
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo: repoName,
    tree,
    base_tree: baseTree,
  });

  // Create a new commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo: repoName,
    message: "Push all code via GitHub API (excluding node_modules and .cache)",
    tree: newTree.sha,
    parents: latestCommitSha ? [latestCommitSha] : [],
  });

  // Update the reference
  await octokit.git.updateRef({
    owner,
    repo: repoName,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
    force: true,
  });

  console.log("Successfully pushed to GitHub!");
}

pushToGitHub().catch(err => {
  console.error("Error during push:", err);
  if (err.status === 404) {
    console.error("Repository not found. Please ensure the repository exists and the token has access.");
  }
});
