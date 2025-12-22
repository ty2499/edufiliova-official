import { Router, Request, Response } from 'express';
import { getApiKey, setApiKey, getAllApiKeys, deleteApiKey, toggleApiKeyStatus, ALL_API_KEYS, API_KEY_CATEGORIES } from '../lib/api-keys';

const router = Router();

router.get('/api-keys', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const keys = await getAllApiKeys(category);
    res.json({ success: true, keys });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/api-keys/templates', async (req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      templates: ALL_API_KEYS,
      categories: Object.values(API_KEY_CATEGORIES),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api-keys', async (req: Request, res: Response) => {
  try {
    const { key, value, category, description, isSensitive } = req.body;
    
    if (!key || !value || !category) {
      return res.status(400).json({ success: false, error: 'Missing required fields: key, value, category' });
    }

    const adminId = (req as any).user?.id || 'system';
    const success = await setApiKey(key, value, category, description, adminId, isSensitive ?? false);
    
    if (success) {
      res.json({ success: true, message: `API key ${key} saved successfully` });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save API key' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/api-keys/:key/toggle', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { isActive } = req.body;
    
    const success = await toggleApiKeyStatus(key, isActive);
    
    if (success) {
      res.json({ success: true, message: `API key ${key} ${isActive ? 'enabled' : 'disabled'}` });
    } else {
      res.status(500).json({ success: false, error: 'Failed to toggle API key' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/api-keys/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const success = await deleteApiKey(key);
    
    if (success) {
      res.json({ success: true, message: `API key ${key} deleted successfully` });
    } else {
      res.status(500).json({ success: false, error: 'Failed to delete API key' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api-keys/seed-from-env', async (req: Request, res: Response) => {
  try {
    const results: Array<{ key: string; status: 'seeded' | 'skipped' | 'error' }> = [];
    
    for (const template of ALL_API_KEYS) {
      const envValue = process.env[template.envVar];
      if (envValue && envValue.length > 0 && !envValue.startsWith('placeholder')) {
        const success = await setApiKey(
          template.key, 
          envValue, 
          template.category, 
          template.description, 
          'system',
          template.sensitive
        );
        results.push({ key: template.key, status: success ? 'seeded' : 'error' });
      } else {
        results.push({ key: template.key, status: 'skipped' });
      }
    }
    
    const seeded = results.filter(r => r.status === 'seeded').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    
    res.json({ 
      success: true, 
      message: `Seeded ${seeded} API keys, skipped ${skipped}`,
      results 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/api-keys/check/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const template = ALL_API_KEYS.find(t => t.key === key);
    const value = await getApiKey(key, template?.envVar);
    res.json({ 
      success: true, 
      key,
      hasValue: !!value,
      source: value ? 'configured' : 'not_configured'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/api-keys/categories', async (req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      categories: Object.entries(API_KEY_CATEGORIES).map(([name, value]) => ({
        name,
        value,
        count: ALL_API_KEYS.filter(k => k.category === value).length
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
