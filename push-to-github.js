#!/usr/bin/env node

import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error("❌ GITHUB_TOKEN not found in environment variables");
      process.exit(1);
    }

    const owner = process.argv[2] || "ty2499";
    const repo = process.argv[3] || "edufiliova";
    const branch = process.argv[4] || "main";

    console.log("🚀 Pushing source code to GitHub (Batched Mode)\n");
    console.log("📋 Configuration:");
    console.log(`   Owner: ${owner}`);
    console.log(`   Repo: ${repo}`);
    console.log(`   Branch: ${branch}\n`);

    const octokit = new Octokit({ auth: token });

    console.log("⏳ Authenticating with GitHub...");
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}\n`);

    console.log("📦 Collecting files...");
    const files = [];
    const baseDir = __dirname;

    const ignoredPatterns = [
      ".git",
      "node_modules",
      ".env",
      ".cache",
      "attached_assets",
      ".turbo",
      ".next",
      ".config",
      "/dist",
      "/build",
      ".replit",
      "replit.nix",
      "package-lock.json"
    ];

    function isIgnored(filePath) {
      return ignoredPatterns.some((pattern) => filePath.includes(pattern));
    }

    function collectFiles(dir) {
      try {
        const items = fs.readdirSync(dir);
        items.forEach((item) => {
          const fullPath = path.join(dir, item);
          const relativePath = path.relative(baseDir, fullPath);

          if (isIgnored(relativePath)) return;

          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            collectFiles(fullPath);
          } else {
            // Only push source files and essentials to avoid size limits
            const ext = path.extname(item).toLowerCase();
            const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.sql'];
            if (sourceExts.includes(ext) || item === 'package.json') {
              files.push(relativePath);
            }
          }
        });
      } catch (e) {}
    }

    collectFiles(baseDir);
    console.log(`✅ Found ${files.length} files to push\n`);

    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const baseCommitSha = ref.object.sha;

    console.log("📤 Creating blobs...");
    const treeItems = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      console.log(`   Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(files.length/BATCH_SIZE)}...`);
      
      const blobs = await Promise.all(batch.map(async (file) => {
        try {
          const content = fs.readFileSync(path.join(baseDir, file), "base64");
          const { data } = await octokit.rest.git.createBlob({
            owner,
            repo,
            content,
            encoding: "base64",
          });
          return {
            path: file,
            mode: "100644",
            type: "blob",
            sha: data.sha,
          };
        } catch (e) {
          console.error(`   ⚠️ Failed to process ${file}: ${e.message}`);
          return null;
        }
      }));

      treeItems.push(...blobs.filter(Boolean));
    }

    console.log(`\n🏗️ Creating tree with ${treeItems.length} items...`);
    const { data: treeData } = await octokit.rest.git.createTree({
      owner,
      repo,
      tree: treeItems,
      base_tree: baseCommitSha,
    });

    console.log("📝 Creating commit...");
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: `Sync from Replit - ${new Date().toLocaleString()}`,
      tree: treeData.sha,
      parents: [baseCommitSha],
    });

    console.log("🔗 Updating branch...");
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    console.log(`\n✅ Success! Pushed to GitHub`);
    console.log(`   Commit SHA: ${newCommit.sha}\n`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
