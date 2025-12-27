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

    // Get from command line args or defaults
    const owner = process.argv[2] || "ty2499";
    const repo = process.argv[3] || "edufiliova";
    const branch = process.argv[4] || "main";

    console.log("🚀 Pushing code to GitHub via API\n");
    console.log("📋 Configuration:");
    console.log(`   Owner: ${owner}`);
    console.log(`   Repo: ${repo}`);
    console.log(`   Branch: ${branch}\n`);

    const octokit = new Octokit({ auth: token });

    console.log("⏳ Authenticating with GitHub...");
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}\n`);

    console.log("📦 Collecting important source files...");
    const filesMap = new Map();
    const baseDir = __dirname;

    // Only include these directories
    const includePatterns = [
      "client/src",
      "server",
      "docs",
      ".",
    ];

    // Ignore patterns
    const ignoredPatterns = [
      ".git",
      "node_modules",
      ".env",
      "dist",
      ".cache",
      "attached_assets",
      ".turbo",
      ".next",
      "build",
      ".config",
    ];

    function isIgnored(filePath) {
      return ignoredPatterns.some((pattern) => filePath.includes(pattern));
    }

    function shouldInclude(filePath) {
      // Include root-level config files
      if (path.dirname(filePath) === ".") {
        const name = path.basename(filePath);
        return [
          "package.json",
          "package-lock.json",
          "tsconfig.json",
          "vite.config.ts",
          "replit.md",
          "README.md",
          ".gitignore",
          "drizzle.config.ts",
        ].includes(name);
      }

      // Include files from specific directories
      return includePatterns.some((pattern) =>
        filePath.startsWith(pattern + path.sep) ||
        (pattern === "." && filePath.startsWith("client/src")) ||
        (pattern === "." && filePath.startsWith("server"))
      );
    }

    function collectFiles(dir) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const relativePath = path.relative(baseDir, filePath);

          if (isIgnored(relativePath)) return;
          if (!shouldInclude(relativePath)) return;

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
      } catch (e) {
        // Skip directories that can't be read
      }
    }

    collectFiles(baseDir);
    console.log(`✅ Found ${filesMap.size} source files to push\n`);

    console.log("📤 Pushing to GitHub...");

    const tree = Array.from(filesMap.entries()).map(([filePath, content]) => ({
      path: filePath,
      mode: "100644",
      type: "blob",
      content,
    }));

    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      const baseCommitSha = ref.object.sha;

      console.log(`   Creating tree with ${tree.length} files...`);
      const { data: treeData } = await octokit.rest.git.createTree({
        owner,
        repo,
        tree,
        base_tree: baseCommitSha,
      });

      console.log("   Creating commit...");
      const { data: newCommit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: `Push clean code from Replit - ${new Date().toISOString()}`,
        tree: treeData.sha,
        parents: [baseCommitSha],
        author: {
          name: user.name || user.login,
          email: user.email || `${user.login}@noreply.github.com`,
          date: new Date().toISOString(),
        },
      });

      console.log("   Updating branch reference...");
      await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });

      console.log(`\n✅ Success! Code pushed to GitHub`);
      console.log(`   Files pushed: ${tree.length}`);
      console.log(`   Commit SHA: ${newCommit.sha}`);
      console.log(
        `   View at: https://github.com/${owner}/${repo}/commit/${newCommit.sha}`
      );
      console.log(
        `   Repository: https://github.com/${owner}/${repo}\n`
      );
    } catch (error) {
      if (error.status === 409) {
        console.error(
          "❌ Branch conflict. The branch may need fast-forward merge."
        );
      } else if (error.status === 404) {
        console.error("❌ Repository not found. Check owner and repo name.");
        console.error(`   Looking for: ${owner}/${repo}`);
      } else {
        console.error("❌ Error:", error.message);
        if (error.response?.data?.message) {
          console.error(`   Details: ${error.response.data.message}`);
        }
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
