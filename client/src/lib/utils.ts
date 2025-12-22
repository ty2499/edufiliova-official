import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if the app is running in a Cordova/Capacitor environment
 */
export function isInCordovaApp(): boolean {
  return !!(window as any).cordova || !!(window as any).Capacitor;
}

/**
 * Pages that are website-only and should NOT be accessible on mobile (Cordova) apps
 * Mobile users should only see dashboards, not marketing/landing pages
 */
export const WEBSITE_ONLY_PAGES = [
  'home',
  'premium',
  'contact',
  'privacy',
  'terms',
  'student-terms',
  'teacher-terms',
  'school-terms',
  'refund-policy',
  'privacy-policy',
  'cookies-policy',
  'whatsapp-policy',
  'data-retention',
  'community-guidelines',
  'payment-billing',
  'chat-terms',
  'about',
  'help',
  'learn-more',
  'advertise-with-us',
  'design-team-contact',
  'blog',
  'blog-post-detail',
  'community',
  'networking',
  'payout-policy',
  'become-teacher',
  'buy-voucher',
  'customer-pricing',
  'creator-pricing',
  'education-pricing',
  'teacher-pricing',
  'get-started',
];

/**
 * Check if a page is website-only (should be blocked on mobile apps)
 */
export function isWebsiteOnlyPage(page: string | undefined): boolean {
  return page ? WEBSITE_ONLY_PAGES.includes(page) : false;
}

/**
 * Gets the base URL (protocol + hostname) for the main website
 */
export function getBaseUrl(): string {
  return `${window.location.protocol}//${window.location.hostname}`;
}

/**
 * Opens a URL in the external system browser.
 * Handles Cordova environments by using '_system' target,
 * and falls back to standard browser behavior for web.
 */
export function openExternalUrl(url: string): void {
  if (isInCordovaApp()) {
    // Open in system browser for mobile apps (outside the webview)
    window.open(url, '_system');
  } else {
    // Standard web behavior - open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Navigate to a path, handling Cordova apps by opening in external browser.
 * Use this for any link that should open the full website in Cordova apps.
 */
export function navigateOrOpenExternal(path: string, navigateCallback?: () => void): void {
  if (isInCordovaApp()) {
    // In Cordova, open the full website externally
    const fullUrl = getBaseUrl() + path;
    openExternalUrl(fullUrl);
  } else {
    // In web browser, use internal navigation
    if (navigateCallback) {
      navigateCallback();
    } else {
      window.location.href = path;
    }
  }
}
