import { db } from "../db.js";
import { blogPosts } from "@shared/schema.js";
import { eq, and, desc } from "drizzle-orm";

// Blog posts cache for improved performance and reduced egress
class BlogCache {
  private posts: any[] | null = null;
  private postsTimestamp = 0;
  private postsBySlug = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  // Get all posts from cache or fetch from DB
  async getAllPosts(): Promise<any[]> {
    const now = Date.now();
    if (this.posts && (now - this.postsTimestamp) < this.TTL) {
      console.log('📦 Blog posts cache HIT');
      return this.posts;
    }
    
    console.log('🔄 Blog posts cache MISS - fetching from DB');
    const publishedPosts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.publishedAt));
    
    this.posts = publishedPosts;
    this.postsTimestamp = now;
    return publishedPosts;
  }

  // Get single post from cache or fetch from DB
  async getPostBySlug(slug: string): Promise<any | null> {
    const now = Date.now();
    const cached = this.postsBySlug.get(slug);
    
    if (cached && (now - cached.timestamp) < this.TTL) {
      console.log(`📦 Blog post cache HIT for slug: ${slug}`);
      return cached.data;
    }
    
    console.log(`🔄 Blog post cache MISS for slug: ${slug}`);
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.slug, slug),
        eq(blogPosts.isPublished, true)
      ))
      .limit(1);
    
    if (post) {
      this.postsBySlug.set(slug, { data: post, timestamp: now });
    }
    return post || null;
  }

  // Invalidate all cache when blog posts are modified
  invalidate(): void {
    console.log('🗑️ Blog cache invalidated');
    this.posts = null;
    this.postsTimestamp = 0;
    this.postsBySlug.clear();
  }

  // Generate ETag from post data
  generateETag(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `"${Math.abs(hash).toString(16)}"`;
  }
}

export const blogCache = new BlogCache();
