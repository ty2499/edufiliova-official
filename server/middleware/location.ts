import { Request, Response, NextFunction } from 'express';
import geoip from 'geoip-lite';

// Extend Express Request interface to include location data
declare global {
  namespace Express {
    interface Request {
      userLocation?: {
        country?: string;
        region?: string;
        city?: string;
        timezone?: string;
        latitude?: number;
        longitude?: number;
      };
    }
  }
}

// IP location cache to avoid repeated lookups
const locationCache = new Map<string, {
  location: Express.Request['userLocation'];
  timestamp: number;
}>();

// Cache TTL: 15 minutes
const CACHE_TTL = 15 * 60 * 1000;

// Routes to skip logging (polling routes)
const SKIP_LOG_ROUTES = ['/api/groups', '/api/messages/conversations', '/api/announcements'];

/**
 * Middleware to detect user location from IP address
 * Adds userLocation object to request for geo-targeting ads
 */
export const locationDetectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get user's IP address
  let ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Handle X-Forwarded-For header for proxied requests
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor && typeof forwardedFor === 'string') {
    ip = forwardedFor.split(',')[0].trim();
  }
  
  // Normalize IP for caching
  const normalizedIP = ip || 'unknown';
  
  try {
    
    // Check cache first
    const cached = locationCache.get(normalizedIP);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      req.userLocation = cached.location;
      return next();
    }
    
    // Handle localhost/development environment
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1')) {
      // Default to US for development/localhost
      const devLocation = {
        country: 'US',
        region: 'CA',
        city: 'San Francisco',
        timezone: 'America/Los_Angeles',
        latitude: 37.7749,
        longitude: -122.4194,
      };
      req.userLocation = devLocation;
      
      // Cache the location
      locationCache.set(normalizedIP, {
        location: devLocation,
        timestamp: Date.now()
      });
      
      return next();
    }
    
    // Lookup location using geoip-lite
    const geo = geoip.lookup(ip);
    
    let detectedLocation: Express.Request['userLocation'];
    if (geo) {
      detectedLocation = {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone,
        latitude: geo.ll?.[0],
        longitude: geo.ll?.[1],
      };
    } else {
      // Fallback if location lookup fails
      detectedLocation = {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
      };
    }
    
    req.userLocation = detectedLocation;
    
    // Cache the location
    locationCache.set(normalizedIP, {
      location: detectedLocation,
      timestamp: Date.now()
    });
    
    // Only log for specific routes and when feature is enabled
    const shouldLog = process.env.FEATURE_LOG_LOCATION === 'true' && 
                     !SKIP_LOG_ROUTES.some(route => req.path.startsWith(route));
    
    if (shouldLog) {
      console.log(`🌍 Location detected for IP ${ip}:`, detectedLocation);
    }
    
  } catch (error) {
    console.error('Location detection error:', error);
    
    // Fallback location on error
    const fallbackLocation = {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
    };
    req.userLocation = fallbackLocation;
    
    // Cache fallback too
    locationCache.set(normalizedIP, {
      location: fallbackLocation,
      timestamp: Date.now()
    });
  }
  
  next();
};

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(locationCache.entries());
  for (const [key, value] of entries) {
    if (now - value.timestamp > CACHE_TTL) {
      locationCache.delete(key);
    }
  }
}, CACHE_TTL); // Clean up every 15 minutes

/**
 * Helper function to check if user location matches ad targeting
 * @param userLocation User's detected location
 * @param targetLocations Ad's target locations array (null means global)
 * @returns true if ad should be shown to user
 */
export const isLocationTargetMatched = (
  userLocation: Express.Request['userLocation'],
  targetLocations: string[] | null
): boolean => {
  // If no target locations specified, it's a global ad
  if (!targetLocations || targetLocations.length === 0) {
    return true;
  }
  
  // If user location is unknown, don't show targeted ads
  if (!userLocation?.country || userLocation.country === 'Unknown') {
    return false;
  }
  
  // Check if user's country is in target locations
  return targetLocations.includes(userLocation.country);
};

/**
 * Helper function to get country list for location targeting forms
 */
export const getAvailableCountries = () => {
  return [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'SG', name: 'Singapore' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'AR', name: 'Argentina' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'EG', name: 'Egypt' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'RU', name: 'Russia' },
    { code: 'PL', name: 'Poland' },
    { code: 'TR', name: 'Turkey' },
  ];
};