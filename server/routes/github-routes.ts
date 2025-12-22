import { Router, Request, Response } from 'express';
import { pushToGitHub, getGitHubUser, listRepos } from '../utils/github-push';
import { pushDistToGitHub } from '../utils/github-push-dist';
import { pushSourceToGitHub } from '../utils/github-push-source';

const router = Router();

router.get('/github/user', async (req: Request, res: Response) => {
  const result = await getGitHubUser();
  res.json(result);
});

router.get('/github/repos', async (req: Request, res: Response) => {
  const result = await listRepos();
  res.json(result);
});

router.post('/github/push', async (req: Request, res: Response) => {
  const { repoName, branch = 'main', commitMessage = 'Update from Replit' } = req.body;
  
  if (!repoName) {
    return res.status(400).json({ success: false, message: 'Repository name is required' });
  }

  console.log(`Starting GitHub push to ${repoName} on branch ${branch}`);
  const result = await pushToGitHub(repoName, branch, commitMessage);
  res.json(result);
});

router.post('/github/push-dist', async (req: Request, res: Response) => {
  const { repoName, branch = 'main', commitMessage = 'Update dist build from Replit' } = req.body;
  
  if (!repoName) {
    return res.status(400).json({ success: false, message: 'Repository name is required' });
  }

  console.log(`Starting GitHub dist push to ${repoName} on branch ${branch}`);
  const result = await pushDistToGitHub(repoName, branch, commitMessage);
  res.json(result);
});

router.post('/github/push-source', async (req: Request, res: Response) => {
  const { repoName, branch = 'main', commitMessage = 'Update source code from Replit' } = req.body;
  
  if (!repoName) {
    return res.status(400).json({ success: false, message: 'Repository name is required' });
  }

  console.log(`Starting GitHub source push to ${repoName} on branch ${branch}`);
  const result = await pushSourceToGitHub(repoName, branch, commitMessage);
  res.json(result);
});

export default router;
