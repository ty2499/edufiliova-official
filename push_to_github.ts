import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "ty2499";
const REPO_NAME = "edufiliova";
const BRANCH = "main";

if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN is not set in environment variables.");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function pushToGithub() {
  try {
    console.log("🚀 Starting GitHub API push...");

    // 1. Get the latest commit on the branch
    const { data: refData } = await octokit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: \`heads/\${BRANCH}\`,
    });
    const latestCommitSha = refData.object.sha;
    console.log(\`✅ Latest commit SHA: \${latestCommitSha}\`);

    // 2. Get the tree SHA for the latest commit
    const { data: commitData } = await octokit.git.getCommit({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;
    console.log(\`✅ Base tree SHA: \${baseTreeSha}\`);

    // 3. Prepare blobs for changed files (focusing on verification fix files)
    const filesToUpload = [
      "server/utils/email.ts",
      "server/utils/email-templates.js",
      "server/templates/student_verification_template/email.html",
      "public/email-assets/student-verification/template.html",
      "replit.md"
    ].filter(file => fs.existsSync(file));

    console.log(\`📦 Preparing blobs for \${filesToUpload.length} files...\`);
    const treeItems = await Promise.all(
      filesToUpload.map(async (file) => {
        const content = fs.readFileSync(file, "utf8");
        const { data: blobData } = await octokit.git.createBlob({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          content,
          encoding: "utf-8",
        });
        return {
          path: file,
          mode: "100644",
          type: "blob",
          sha: blobData.sha,
        } as const;
      })
    );

    // 4. Create a new tree
    const { data: newTreeData } = await octokit.git.createTree({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      base_tree: baseTreeSha,
      tree: treeItems,
    });
    console.log(\`✅ New tree SHA: \${newTreeData.sha}\`);

    // 5. Create a new commit
    const { data: newCommitData } = await octokit.git.createCommit({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      message: "Update student verification templates and logic via GitHub API",
      tree: newTreeData.sha,
      parents: [latestCommitSha],
    });
    console.log(\`✅ New commit SHA: \${newCommitData.sha}\`);

    // 6. Update the reference
    await octokit.git.updateRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: \`heads/\${BRANCH}\`,
      sha: newCommitData.sha,
    });

    console.log("🎉 Successfully pushed to GitHub via API!");
  } catch (error: any) {
    console.error("❌ Error pushing to GitHub:", error.response?.data || error.message);
    process.exit(1);
  }
}

pushToGithub();
