import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";

const owner = "ty2499";
const repo = "edufiliova";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("GITHUB_TOKEN is missing in environment variables");
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

async function getFiles(dir: string, allFiles: string[] = []) {
  if (!fs.existsSync(dir)) return allFiles;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (file !== ".git" && file !== "node_modules" && file !== "dist" && file !== "attached_assets") {
        await getFiles(name, allFiles);
      }
    } else {
      const stats = fs.statSync(name);
      if (stats.size < 500000) {
        allFiles.push(name);
      }
    }
  }
  return allFiles;
}

async function push() {
  try {
    console.log("Starting full push to GitHub repository...");
    
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: "heads/main",
    });
    const latestCommitSha = ref.object.sha;
    
    const { data: commit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commit.tree.sha;

    const targetDirs = ["client/src", "server", "migrations"];
    const targetFiles = ["package.json", "package-lock.json", "replit.md", "vite.config.ts"];
    
    let filesToPush: string[] = [...targetFiles];
    for (const dir of targetDirs) {
      await getFiles(dir, filesToPush);
    }

    console.log("Found " + filesToPush.length + " files to process.");

    const treeItems = [];
    for (const filePath of filesToPush) {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath);
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: content.toString("base64"),
          encoding: "base64",
        });
        
        treeItems.push({
          path: filePath.replace(/\\/g, "/"),
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        });
      }
    }

    const { data: tree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: treeItems,
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: "Push all recent changes (UI updates and dependency sync)",
      tree: tree.sha,
      parents: [latestCommitSha],
    });

    await octokit.git.updateRef({
      owner,
      repo,
      ref: "heads/main",
      sha: newCommit.sha,
    });

    console.log("Successfully pushed all changes to GitHub!");
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

push();
