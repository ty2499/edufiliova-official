
import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { glob } from "glob";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "EduFiliova";
const REPO = "EduFiliova";

async function pushToGithub() {
  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN is not set in environment variables.");
    process.exit(1);
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    console.log("Gathering files...");
    const files = await glob("**/*", { 
      nodir: true, 
      ignore: ["node_modules/**", ".git/**", "client/node_modules/**", "dist/**", "build/**", "attached_assets/**"] 
    });

    console.log(`Found ${files.length} files to push.`);

    // Get the latest commit on main
    const { data: refData } = await octokit.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: "heads/main",
    });
    const latestCommitSha = refData.object.sha;

    // Get the tree of the latest commit
    const { data: commitData } = await octokit.git.getCommit({
      owner: OWNER,
      repo: REPO,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // Create blobs for each file
    console.log("Creating blobs...");
    const blobs = await Promise.all(
      files.map(async (file) => {
        const content = fs.readFileSync(file, "utf8");
        const { data: blobData } = await octokit.git.createBlob({
          owner: OWNER,
          repo: REPO,
          content,
          encoding: "utf-8",
        });
        return {
          path: file,
          mode: "100644",
          type: "blob",
          sha: blobData.sha,
        };
      })
    );

    // Create a new tree
    console.log("Creating tree...");
    const { data: treeData } = await octokit.git.createTree({
      owner: OWNER,
      repo: REPO,
      base_tree: baseTreeSha,
      tree: blobs,
    });

    // Create a new commit
    console.log("Creating commit...");
    const { data: newCommitData } = await octokit.git.createCommit({
      owner: OWNER,
      repo: REPO,
      message: "chore: push latest updates from Replit",
      tree: treeData.sha,
      parents: [latestCommitSha],
    });

    // Update the ref
    console.log("Updating reference...");
    await octokit.git.updateRef({
      owner: OWNER,
      repo: REPO,
      ref: "heads/main",
      sha: newCommitData.sha,
    });

    console.log("Successfully pushed all code to GitHub!");
  } catch (error) {
    console.error("Error pushing to GitHub:", error);
    process.exit(1);
  }
}

pushToGithub();
