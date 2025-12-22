import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Opens a URL in the external system browser.
 * Handles Cordova environments by using '_system' target,
 * and falls back to standard browser behavior for web.
 */
export function openExternalUrl(url: string): void {
  // Check if we're in a Cordova/Capacitor environment
  const isCordova = !!(window as any).cordova;
  const isCapacitor = !!(window as any).Capacitor;
  
  if (isCordova || isCapacitor) {
    // Open in system browser for mobile apps
    window.open(url, '_system');
  } else {
    // Standard web behavior - open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
