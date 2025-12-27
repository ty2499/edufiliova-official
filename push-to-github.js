#!/usr/bin/env node

import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error("❌ GITHUB_TOKEN not found in environment variables");
      process.exit(1);
    }

    console.log(
      "🚀 GitHub Push Helper - Uses GitHub API to push your EduFiliova code\n"
    );

    const owner = await question(
      "📝 Enter your GitHub username (repo owner): "
    );
    const repo = await question("📝 Enter your repository name: ");
    const branchInput = await question(
      "📝 Enter branch name (default: main): "
    );
    const branch = branchInput || "main";

    console.log(`\n✅ Configuration:`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Repo: ${repo}`);
    console.log(`   Branch: ${branch}`);

    const octokit = new Octokit({ auth: token });

    console.log("\n⏳ Authenticating with GitHub...");
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);

    console.log("\n📦 Collecting files to push...");
    const filesMap = new Map();
    const baseDir = __dirname;

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
    ];

    function isIgnored(filePath) {
      return ignoredPatterns.some((pattern) => filePath.includes(pattern));
    }

    function collectFiles(dir) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const relativePath = path.relative(baseDir, filePath);

        if (isIgnored(relativePath)) return;

        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          collectFiles(filePath);
        } else {
          const content = fs.readFileSync(filePath, "utf-8");
          filesMap.set(relativePath, content);
        }
      });
    }

    collectFiles(baseDir);
    console.log(`✅ Found ${filesMap.size} files to push`);

    console.log("\n📤 Creating commit via GitHub API...");
    console.log("   (This will create a new commit with all clean code)");

    const tree = Array.from(filesMap.entries()).map(([path, content]) => ({
      path,
      mode: "100644",
      type: "blob",
      content,
    }));

    // Get current branch reference
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      const baseCommitSha = ref.object.sha;

      // Create tree
      const { data: treeData } = await octokit.rest.git.createTree({
        owner,
        repo,
        tree,
        base_tree: baseCommitSha,
      });

      // Get current commit
      const { data: currentCommit } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: baseCommitSha,
      });

      // Create new commit
      const { data: newCommit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: `Push clean code - ${new Date().toISOString()}`,
        tree: treeData.sha,
        parents: [baseCommitSha],
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

      console.log(`\n✅ Success! Code pushed to GitHub`);
      console.log(`   Commit SHA: ${newCommit.sha}`);
      console.log(
        `   View at: https://github.com/${owner}/${repo}/commit/${newCommit.sha}`
      );
    } catch (error) {
      if (error.status === 409) {
        console.error(
          "❌ Branch conflict. The branch may need fast-forward merge."
        );
      } else if (error.status === 404) {
        console.error("❌ Repository not found. Check owner and repo name.");
      } else {
        throw error;
      }
    }

    rl.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    rl.close();
    process.exit(1);
  }
}

main();
