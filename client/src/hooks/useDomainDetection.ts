import { useMemo } from "react";

export type DomainType = "auth-only" | "full-site";

// Legacy subdomain detection (for backwards compatibility during transition)
// After Cloudflare redirect is set up, app.edufiliova.com will redirect to edufiliova.com/app
const AUTH_ONLY_DOMAINS = [
  "app.edufiliova.com",
  "www.app.edufiliova.com",
  "edufiliova.click",
  "www.edufiliova.click",
];

// Check if hostname is a subdomain of edufiliova.com (except www)
function isAppSubdomain(hostname: string): boolean {
  const lowerHost = hostname.toLowerCase();
  if (lowerHost.startsWith('app.')) {
    return true;
  }
  return false;
}

// Check if current path is the /app route (mobile PWA entry point)
function isAppPath(): boolean {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.toLowerCase();
  // Match /app or /app/* paths
  return pathname === '/app' || pathname.startsWith('/app/') || pathname.startsWith('/app?');
}

// Check if URL has ?app=true query parameter
function hasAppQueryParam(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('app') === 'true';
}

export function useDomainDetection(): {
  domainType: DomainType;
  isAuthOnlyDomain: boolean;
  isAppRoute: boolean;
  hostname: string;
} {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  const { domainType, isAppRoute } = useMemo(() => {
    const lowerHost = hostname.toLowerCase();
    
    // Check if accessing via /app path (primary method after Cloudflare redirect)
    if (isAppPath() || hasAppQueryParam()) {
      return { domainType: "auth-only" as DomainType, isAppRoute: true };
    }
    
    // Legacy: Check explicit auth-only domains (subdomain detection)
    if (AUTH_ONLY_DOMAINS.includes(lowerHost)) {
      return { domainType: "auth-only" as DomainType, isAppRoute: false };
    }
    
    // Legacy: Check if it's an app subdomain
    if (isAppSubdomain(lowerHost)) {
      return { domainType: "auth-only" as DomainType, isAppRoute: false };
    }
    
    // Primary domain (edufiliova.com) shows full site
    return { domainType: "full-site" as DomainType, isAppRoute: false };
  }, [hostname, pathname]);

  return {
    domainType,
    isAuthOnlyDomain: domainType === "auth-only",
    isAppRoute,
    hostname,
  };
}

// Paths allowed on auth-only domain/route
export function getAuthOnlyAllowedPaths(): string[] {
  return [
    "/",
    "/app",
    "/app/",
    "/login",
    "/signup",
    "/teacher-login",
    "/teacher-signup",
    "/teacher-signup-basic",
    "/teacher-verify-email",
    "/teacher-application-status",
    "/freelancer-login",
    "/freelancer-signup",
    "/freelancer-signup-basic",
    "/freelancer-verify-email",
    "/freelancer-application-status",
    "/auth-modern",
    "/reset-password",
    "/verify-email",
    "/privacy-policy",
    "/terms",
    "/student-terms",
    "/teacher-terms",
  ];
}

export function isPathAllowedOnAuthDomain(path: string): boolean {
  const allowedPaths = getAuthOnlyAllowedPaths();
  return allowedPaths.some(
    (allowed) => path === allowed || path.startsWith(allowed + "/")
  );
}

// Helper to get the correct login path based on current context
export function getAppLoginPath(): string {
  if (isAppPath() || hasAppQueryParam()) {
    return "/app/login";
  }
  return "/login";
}
