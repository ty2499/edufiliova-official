import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Enhanced input sanitization
export class InputSanitizer {
  // Comprehensive profanity filter
  private static readonly PROFANITY_WORDS = [
    // Basic profanity
    'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'hell',
    // Educational context inappropriate words
    'stupid', 'idiot', 'dumb', 'retard', 'moron', 'loser', 'freak',
    // Harassment terms
    'kill yourself', 'die', 'hate you', 'ugly', 'fat', 'worthless',
    // Variants and leetspeak
    'f*ck', 'sh*t', 'b*tch', 'a$$', 'a55', '$hit', 'fuk', 'shyt'
  ];

  // XSS protection - remove dangerous HTML and JavaScript
  static sanitizeHtml(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
      .replace(/<link\b[^<]*>/gi, '') // Remove link tags
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
      .trim();
  }

  // Check for profanity with context awareness
  static containsProfanity(text: string): boolean {
    if (!text) return false;
    
    const cleanText = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return this.PROFANITY_WORDS.some(word => {
      // Check exact matches and word boundaries
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(cleanText);
    });
  }

  // Sanitize user messages
  static sanitizeMessage(content: string): { isValid: boolean; sanitized: string; reason?: string } {
    if (!content || typeof content !== 'string') {
      return { isValid: false, sanitized: '', reason: 'Content is required' };
    }

    // Length check
    if (content.length > 2000) {
      return { isValid: false, sanitized: '', reason: 'Message too long (max 2000 characters)' };
    }

    // Profanity check
    if (this.containsProfanity(content)) {
      return { isValid: false, sanitized: '', reason: 'Please use appropriate language' };
    }

    // Sanitize HTML
    const sanitized = this.sanitizeHtml(content);
    
    return { isValid: true, sanitized };
  }

  // Sanitize custom pronouns
  static sanitizePronouns(pronouns: string): { isValid: boolean; sanitized: string; reason?: string } {
    if (!pronouns || typeof pronouns !== 'string') {
      return { isValid: false, sanitized: '', reason: 'Pronouns are required' };
    }

    if (pronouns.length > 50) {
      return { isValid: false, sanitized: '', reason: 'Pronouns too long (max 50 characters)' };
    }

    if (this.containsProfanity(pronouns)) {
      return { isValid: false, sanitized: '', reason: 'Please use appropriate language for pronouns' };
    }

    // Allow only letters, forward slashes, and common punctuation for pronouns
    const sanitized = pronouns.replace(/[^a-zA-Z\/\-\s]/g, '').trim();
    
    if (sanitized.length === 0) {
      return { isValid: false, sanitized: '', reason: 'Invalid characters in pronouns' };
    }

    return { isValid: true, sanitized };
  }

  // Sanitize community posts
  static sanitizeCommunityPost(title: string, content: string): { isValid: boolean; sanitizedTitle: string; sanitizedContent: string; reason?: string } {
    // Validate title
    if (!title || typeof title !== 'string') {
      return { isValid: false, sanitizedTitle: '', sanitizedContent: '', reason: 'Title is required' };
    }

    if (title.length > 200) {
      return { isValid: false, sanitizedTitle: '', sanitizedContent: '', reason: 'Title too long (max 200 characters)' };
    }

    // Validate content
    if (!content || typeof content !== 'string') {
      return { isValid: false, sanitizedTitle: '', sanitizedContent: '', reason: 'Content is required' };
    }

    if (content.length > 2000) {
      return { isValid: false, sanitizedTitle: '', sanitizedContent: '', reason: 'Content too long (max 2000 characters)' };
    }

    // Profanity checks
    if (this.containsProfanity(title)) {
      return { isValid: false, sanitizedTitle: '', sanitizedContent: '', reason: 'Please use appropriate language in title' };
    }

    if (this.containsProfanity(content)) {
      return { isValid: false, sanitizedTitle: '', sanitizedContent: '', reason: 'Please use appropriate language in content' };
    }

    // Sanitize HTML
    const sanitizedTitle = this.sanitizeHtml(title);
    const sanitizedContent = this.sanitizeHtml(content);

    return { isValid: true, sanitizedTitle, sanitizedContent };
  }
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://api.stripe.com https://checkout.stripe.com wss: ws:; " +
    "frame-src https://js.stripe.com https://hooks.stripe.com;"
  );

  next();
};

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: message || 'Too many requests, please try again later'
      });
    }
  });
};

// Specific rate limits for different endpoints
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts'); // 5 attempts per 15 minutes
export const messageRateLimit = createRateLimit(60 * 1000, 30, 'Too many messages sent'); // 30 messages per minute
export const communityRateLimit = createRateLimit(60 * 1000, 10, 'Too many community posts'); // 10 posts per minute
export const uploadRateLimit = createRateLimit(60 * 1000, 5, 'Too many file uploads'); // 5 uploads per minute

// File upload validation
export const validateFileUpload = (file: Express.Multer.File): { isValid: boolean; reason?: string } => {
  if (!file) {
    return { isValid: false, reason: 'No file provided' };
  }

  // Check file size (10MB max for avatars)
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, reason: 'File too large (max 10MB)' };
  }

  // Check file type for images
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (file.fieldname === 'avatar' && !allowedImageTypes.includes(file.mimetype)) {
    return { isValid: false, reason: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed' };
  }

  // Check for malicious file extensions
  const maliciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs', '.php', '.asp'];
  const fileName = file.originalname.toLowerCase();
  if (maliciousExtensions.some(ext => fileName.endsWith(ext))) {
    return { isValid: false, reason: 'File type not allowed for security reasons' };
  }

  return { isValid: true };
};

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize all string inputs
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return InputSanitizer.sanitizeHtml(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  next();
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Check CSRF token for state-changing requests
  const csrfToken = req.headers['x-csrf-token'] as string;
  const expectedToken = req.headers['x-requested-with'];

  if (!csrfToken && expectedToken !== 'XMLHttpRequest') {
    return res.status(403).json({
      success: false,
      error: 'CSRF token required'
    });
  }

  next();
};