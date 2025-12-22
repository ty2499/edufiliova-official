/**
 * Caching Middleware
 * Automatically cache GET requests to reduce database egress
 */

import { Request, Response, NextFunction } from 'express';
import { cache, CacheTTL as CacheTTLImport } from '../cache';

// Re-export CacheTTL for easier imports
export const CacheTTL = CacheTTLImport;

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyPrefix?: string;
  // Function to generate cache key from request
  keyGenerator?: (req: Request) => string;
  // Skip cache for certain conditions
  skipCache?: (req: Request) => boolean;
}

/**
 * Generate a cache key from request
 */
function generateCacheKey(req: Request, prefix?: string): string {
  const baseKey = prefix || 'route';
  const path = req.path;
  const queryString = Object.keys(req.query)
    .sort()
    .map(key => `${key}=${req.query[key]}`)
    .join('&');
  
  return `${baseKey}:${path}${queryString ? ':' + queryString : ''}`;
}

/**
 * Cache middleware for GET requests
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = CacheTTL.MEDIUM,
    keyPrefix,
    keyGenerator,
    skipCache,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if cache should be skipped
    if (skipCache && skipCache(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : generateCacheKey(req, keyPrefix);

    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    if (cachedData !== null) {
      console.log(`🎯 Cache HIT (middleware): ${cacheKey}`);
      return res.json(cachedData);
    }

    // Store original response methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalEnd = res.end.bind(res);

    // Override res.json to cache the response
    res.json = function(body: any) {
      // Only cache successful JSON responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`💾 Cache SET (middleware): ${cacheKey}`);
        cache.set(cacheKey, body, ttl);
      }
      
      return originalJson(body);
    };

    // Override res.send to cache JSON responses
    res.send = function(body: any) {
      // Only cache successful responses with JSON content
      if (res.statusCode >= 200 && res.statusCode < 300 && 
          res.getHeader('content-type')?.toString().includes('application/json')) {
        try {
          const jsonBody = typeof body === 'string' ? JSON.parse(body) : body;
          console.log(`💾 Cache SET (middleware/send): ${cacheKey}`);
          cache.set(cacheKey, jsonBody, ttl);
        } catch (e) {
          // Not JSON, don't cache
        }
      }
      
      return originalSend(body);
    };

    // Override res.end to handle edge cases
    res.end = function(chunk?: any, ...args: any[]) {
      // res.end doesn't cache, but we want to track it
      return originalEnd(chunk, ...args);
    };

    next();
  };
}

/**
 * Invalidate cache by prefix (safer than regex pattern matching)
 */
export function invalidateCache(prefix: string) {
  let invalidatedCount = 0;
  const allKeys = cache.keys();
  
  // Use exact prefix matching instead of regex to avoid false positives
  for (const key of allKeys) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      invalidatedCount++;
    }
  }
  
  if (invalidatedCount > 0) {
    console.log(`🗑️  Cache invalidated: ${invalidatedCount} keys with prefix "${prefix}"`);
  }
}

/**
 * Cache invalidation middleware for mutations
 * Use after POST/PUT/DELETE endpoints to invalidate related cache
 * Patterns should be exact prefixes (e.g., 'categories:', 'products:featured:')
 */
export function invalidateCacheMiddleware(prefixes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original response methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalStatus = res.status.bind(res);

    // Track if response was sent
    let responseSent = false;

    // Helper to invalidate cache
    const doInvalidate = () => {
      if (!responseSent && res.statusCode >= 200 && res.statusCode < 300) {
        responseSent = true;
        prefixes.forEach(prefix => {
          invalidateCache(prefix);
        });
      }
    };

    // Override res.json to invalidate cache after successful mutation
    res.json = function(body: any) {
      doInvalidate();
      return originalJson(body);
    };

    // Override res.send to invalidate cache
    res.send = function(body: any) {
      doInvalidate();
      return originalSend(body);
    };

    // Override res.status to catch 204 No Content
    res.status = function(code: number) {
      const result = originalStatus(code);
      if (code >= 200 && code < 300) {
        doInvalidate();
      }
      return result;
    };

    next();
  };
}
