import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

const INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export function useInactivityLogout() {
  const { user, logout } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run if user is logged in
    if (!user) {
      return;
    }

    // Reset last activity timestamp when user becomes authenticated
    // This prevents instant logout if tab was idle for 3+ hours before login
    lastActivityRef.current = Date.now();

    // Update last activity timestamp
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners for activity tracking
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for inactivity periodically
    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        console.log('🚪 Auto-logout: User inactive for 3 hours');
        logout();
      }
    };

    // Start the inactivity check interval
    checkIntervalRef.current = setInterval(checkInactivity, CHECK_INTERVAL);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, logout]);
}
