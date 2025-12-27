import { Octokit } from "@octokit/rest";
import fs from "fs";

const owner = "ty2499";
const repo = "edufiliova";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

async function push() {
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: "heads/main" });
    const latestCommitSha = ref.object.sha;
    const { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
    
    const files = [
      "package.json",
      "package-lock.json",
      "replit.md",
      "client/src/components/auth/LoginForm.tsx",
      "client/src/components/SocialAuthButtons.tsx"
    ];

    const treeItems = [];
    for (const path of files) {
      if (fs.existsSync(path)) {
        const { data: blob } = await octokit.git.createBlob({
          owner, repo,
          content: fs.readFileSync(path, "utf8"),
          encoding: "utf-8"
        });
        treeItems.push({ path, mode: "100644" as const, type: "blob" as const, sha: blob.sha });
      }
    }

    const { data: tree } = await octokit.git.createTree({
      owner, repo,
      base_tree: commit.tree.sha,
      tree: treeItems
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner, repo,
      message: "Sync UI updates and dependency fixes",
      tree: tree.sha,
      parents: [latestCommitSha]
    });

    await octokit.git.updateRef({ owner, repo, ref: "heads/main", sha: newCommit.sha });
    console.log("Success");
  } catch (e: any) {
    console.error(e.message);
    process.exit(1);
  }
}
push();
