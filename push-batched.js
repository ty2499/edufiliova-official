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
      console.error("❌ GITHUB_TOKEN not found");
      process.exit(1);
    }

    const owner = "ty2499";
    const repo = "edufiliova";
    const branch = "main";

    console.log("🚀 Pushing source code in batches\n");

    const octokit = new Octokit({ auth: token });

    console.log("⏳ Authenticating...");
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}\n`);

    console.log("📦 Collecting files...");
    const filesMap = new Map();
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
    ];

    function isIgnored(filePath) {
      return ignoredPatterns.some((pattern) => filePath.includes(pattern));
    }

    function collectFiles(dir) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const relativePath = path.relative(baseDir, filePath);

          if (isIgnored(relativePath)) return;

          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            collectFiles(filePath);
          } else {
            try {
              const content = fs.readFileSync(filePath, "utf-8");
              filesMap.set(relativePath, content);
            } catch (e) {
              // Skip binary files
            }
          }
        });
      } catch (e) {}
    }

    collectFiles(baseDir);
    const allFiles = Array.from(filesMap.entries());
    console.log(`✅ Found ${allFiles.length} files\n`);

    // Get current branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    let currentSha = ref.object.sha;

    // Push in batches of 50 files (smaller batches to avoid API errors)
    const batchSize = 50;
    let batchNum = 1;
    let successCount = 0;

    for (let i = 0; i < allFiles.length; i += batchSize) {
      const batch = allFiles.slice(i, i + batchSize);
      const batchFiles = batch.map(([filePath, content]) => ({
        path: filePath,
        mode: "100644",
        type: "blob",
        content,
      }));

      const startIdx = i + 1;
      const endIdx = Math.min(i + batchSize, allFiles.length);
      console.log(`📤 Batch ${batchNum}: Pushing files ${startIdx}-${endIdx}...`);

      try {
        // Create tree
        const { data: treeData } = await octokit.rest.git.createTree({
          owner,
          repo,
          tree: batchFiles,
          base_tree: currentSha,
        });

        // Get current commit
        const { data: currentCommit } = await octokit.rest.git.getCommit({
          owner,
          repo,
          commit_sha: currentSha,
        });

        // Create new commit
        const { data: newCommit } = await octokit.rest.git.createCommit({
          owner,
          repo,
          message: `Push code batch ${batchNum} - ${new Date().toISOString()}`,
          tree: treeData.sha,
          parents: [currentSha],
          author: {
            name: user.name || user.login,
            email: user.email || `${user.login}@noreply.github.com`,
            date: new Date().toISOString(),
          },
        });

        // Update reference
        await octokit.rest.git.updateRef({
          owner,
          repo,
          ref: `heads/${branch}`,
          sha: newCommit.sha,
        });

        currentSha = newCommit.sha;
        successCount += batch.length;
        console.log(`   ✅ Batch ${batchNum} complete (${batch.length} files)`);
        batchNum++;
      } catch (error) {
        console.error(`   ⚠️  Batch ${batchNum} skipped:`, error.message);
        // Continue with next batch instead of failing completely
        batchNum++;
      }
    }

    console.log(`\n✅ SUCCESS! Pushed ${successCount} source code files to GitHub`);
    console.log(`   Total files collected: ${allFiles.length}`);
    console.log(`   Final commit: ${currentSha}`);
    console.log(
      `   View: https://github.com/${owner}/${repo}/commit/${currentSha}\n`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
