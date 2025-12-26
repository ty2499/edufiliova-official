// Enhanced in-memory cache to reduce database egress
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    // Auto-cleanup expired entries every 60 seconds
    setInterval(() => this.cleanup(), 60000);
  }

  set(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  // Invalidate all keys matching a pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.hits + this.misses > 0 
      ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(2)
      : '0.00';
    
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
    };
  }

  // Get all cache keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const cache = new MemoryCache();

// Helper function to wrap database queries with caching
export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300 // 5 minutes default
): Promise<T> {
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached !== null) {
    console.log(`✅ Cache HIT: ${cacheKey}`);
    return cached;
  }

  // Cache miss - execute query
  console.log(`❌ Cache MISS: ${cacheKey} - querying database`);
  const result = await queryFn();
  cache.set(cacheKey, result, ttlSeconds);
  return result;
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 900,           // 15 minutes
  HOUR: 3600,          // 1 hour
  DAY: 86400,          // 24 hours
};

// Cache key builders for consistency
export const CacheKeys = {
  user: (id: number) => `user:${id}`,
  userProfile: (id: number) => `user:profile:${id}`,
  course: (id: number) => `course:${id}`,
  courses: (page: number = 1, limit: number = 20) => `courses:list:${page}:${limit}`,
  categories: () => `categories:all`,
  products: (page: number = 1, limit: number = 20) => `products:list:${page}:${limit}`,
  product: (id: number) => `product:${id}`,
  portfolio: (userId: number) => `portfolio:${userId}`,
  freelancer: (userId: number) => `freelancer:${userId}`,
  subscriptionPlan: (id: number) => `subscription:plan:${id}`,
  userSubscription: (userId: number) => `user:subscription:${userId}`,
  stats: (type: string) => `stats:${type}`,
  
  // Messaging cache keys
  conversations: (userId: string) => `msg:conversations:${userId}`,
  unifiedConversations: (userId: string) => `msg:unified:${userId}`,
  contacts: (userId: string) => `msg:contacts:${userId}`,
  messageThread: (threadId: string, cursor?: string) => `msg:thread:${threadId}${cursor ? `:${cursor}` : ''}`,
  friendRequests: (userId: string) => `msg:friend-requests:${userId}`,
  groups: (userId: string) => `msg:groups:${userId}`,
  groupMessages: (groupId: string, cursor?: string) => `msg:group:${groupId}${cursor ? `:${cursor}` : ''}`,
  unreadCount: (userId: string) => `msg:unread:${userId}`,
  quickResponses: () => `msg:quick-responses`,
};

// Invalidation helpers for messaging
export function invalidateUserMessaging(userId: string): void {
  cache.invalidatePattern(`msg:.*:${userId}`);
  cache.delete(CacheKeys.conversations(userId));
  cache.delete(CacheKeys.unifiedConversations(userId));
  cache.delete(CacheKeys.contacts(userId));
  cache.delete(CacheKeys.friendRequests(userId));
  cache.delete(CacheKeys.groups(userId));
  cache.delete(CacheKeys.unreadCount(userId));
}

export function invalidateThread(threadId: string): void {
  cache.invalidatePattern(`msg:thread:${threadId}`);
}

export function invalidateGroupMessages(groupId: string): void {
  cache.invalidatePattern(`msg:group:${groupId}`);
}
