import { v4 as uuidv4 } from 'uuid';

// Browser fingerprinting for visitor identification
export function generateVisitorId(): string {
  const key = 'freelancer_visitor_id';
  let visitorId = localStorage.getItem(key);
  
  if (!visitorId) {
    visitorId = uuidv4();
    localStorage.setItem(key, visitorId);
  }
  
  return visitorId;
}

// Session-based identification
export function generateSessionId(): string {
  const key = 'freelancer_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

// Generate a simple hash from a string
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Generate IP hash (client-side approximation using request info)
export function generateIpHash(): string {
  // Since we can't get real IP on client, use a combination of browser features
  const features = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join('|');
  
  return simpleHash(features);
}

// Generate user agent hash
export function generateUaHash(): string {
  return simpleHash(navigator.userAgent);
}

// Get referrer information
export function getReferrer(): string {
  return document.referrer || window.location.origin;
}

// Comprehensive view data for tracking
export function generateViewData(userId?: string) {
  return {
    viewerUserId: userId,
    visitorId: generateVisitorId(),
    sessionId: generateSessionId(),
    ipHash: generateIpHash(),
    uaHash: generateUaHash(),
    referer: getReferrer()
  };
}
