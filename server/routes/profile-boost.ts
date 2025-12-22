import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

router.post('/add-likes', async (req, res) => {
  try {
    const { profileId, count } = req.body;

    if (!profileId || !count || count < 1) {
      return res.status(400).json({ error: 'Invalid profile ID or count' });
    }

    const result = await storage.addProfileBoostLikes(profileId, count);
    res.json(result);
  } catch (error: any) {
    console.error('Error adding boost likes:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/add-followers', async (req, res) => {
  try {
    const { profileId, count } = req.body;

    if (!profileId || !count || count < 1) {
      return res.status(400).json({ error: 'Invalid profile ID or count' });
    }

    const result = await storage.addProfileBoostFollowers(profileId, count);
    res.json(result);
  } catch (error: any) {
    console.error('Error adding boost followers:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;

    const [boostLikes, boostFollowers] = await Promise.all([
      storage.getProfileBoostLikesCount(profileId),
      storage.getProfileBoostFollowersCount(profileId)
    ]);

    res.json({
      boostLikes,
      boostFollowers
    });
  } catch (error: any) {
    console.error('Error getting boost stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
