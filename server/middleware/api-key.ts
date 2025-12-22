import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  apiKey?: {
    id: string;
    userId: string;
    tier: string;
    permissions: string[];
  };
}

export const validateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (!apiKeyHeader) {
    return res.status(401).json({ 
      error: 'API key is required. Include it in the X-API-Key header or Authorization header as "Bearer YOUR_API_KEY"' 
    });
  }
  
  let apiKeyValue: string;
  
  if (typeof apiKeyHeader === 'string' && apiKeyHeader.startsWith('Bearer ')) {
    apiKeyValue = apiKeyHeader.substring(7);
  } else if (typeof apiKeyHeader === 'string') {
    apiKeyValue = apiKeyHeader;
  } else {
    return res.status(401).json({ error: 'Invalid API key format' });
  }
  
  try {
    const apiKey = await storage.validateApiKey(apiKeyValue);
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'Invalid or expired API key' 
      });
    }
    
    (req as AuthenticatedRequest).apiKey = {
      id: apiKey.id,
      userId: apiKey.userId,
      tier: apiKey.tier,
      permissions: apiKey.permissions || []
    };
    
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.apiKey) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!authReq.apiKey.permissions.includes(permission) && !authReq.apiKey.permissions.includes('*')) {
      return res.status(403).json({ 
        error: `Insufficient permissions. Required: ${permission}` 
      });
    }
    
    next();
  };
};

export const requireTier = (minTier: 'basic' | 'advanced') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.apiKey) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (minTier === 'advanced' && authReq.apiKey.tier !== 'advanced') {
      return res.status(403).json({ 
        error: 'This endpoint requires an Advanced API key (Business tier)' 
      });
    }
    
    next();
  };
};
