import { useState, useCallback, useRef } from 'react';

export type TransitionType = 'fade' | 'slide-right' | 'slide-left' | 'scale' | 'slide-up' | 'instant';

interface PageTransitionState {
  isTransitioning: boolean;
  isLoading: boolean;
  transitionType: TransitionType;
  currentPage: string;
  nextPage: string | null;
  loadingProgress: number;
  isExiting: boolean;
}

export const usePageTransition = (initialPage: string = 'home') => {
  const [transitionState, setTransitionState] = useState<PageTransitionState>({
    isTransitioning: false,
    isLoading: false,
    transitionType: 'fade',
    currentPage: initialPage,
    nextPage: null,
    loadingProgress: 0,
    isExiting: false,
  });
  
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pages that require longer loading (2 seconds max)
  const heavyPages = [
    'student-dashboard', 'teacher-dashboard', 'freelancer-dashboard', 'customer-dashboard',
    'admin', 'course-browse', 'course-player', 'find-talent', 'portfolio-gallery',
    'product-shop', 'messaging', 'community', 'analytics', 'settings', 'checkout',
    'cart', 'orders', 'transactions', 'applications', 'certificates'
  ];

  const navigateToPage = useCallback((
    newPage: string, 
    transitionType: TransitionType = 'fade'
  ) => {
    if (newPage === transitionState.currentPage) {
      return;
    }

    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Instant scroll to top (no animation)
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (transitionType === 'instant') {
      // Instant transition - no animation
      setTransitionState(prev => ({
        ...prev,
        isTransitioning: false,
        isExiting: false,
        transitionType,
        currentPage: newPage,
        nextPage: null,
        loadingProgress: 100,
        isLoading: false,
      }));
      return;
    }

    // Determine duration based on page complexity (1s for simple, 2s for heavy pages)
    const isHeavyPage = heavyPages.some(p => newPage.toLowerCase().includes(p));
    const duration = isHeavyPage ? 1500 : 800; // Snappier timing

    // Start exit animation with loading progress
    setTransitionState(prev => ({
      ...prev,
      isTransitioning: true,
      isExiting: true,
      isLoading: true,
      loadingProgress: 10,
      nextPage: newPage,
      transitionType,
    }));

    // After a short delay, switch the page content while STILL showing the loader
    // This prevents the blank page
    setTimeout(() => {
      setTransitionState(prev => ({
        ...prev,
        isExiting: false, // Stop the blur on the NEW page
        currentPage: newPage,
        nextPage: null,
        loadingProgress: 80,
      }));

      // Keep the loader visible for a tiny bit longer to ensure content is ready
      setTimeout(() => {
        setTransitionState(prev => ({
          ...prev,
          isTransitioning: false,
          isLoading: false,
          loadingProgress: 0,
        }));
      }, 400);
    }, duration);
  }, [transitionState.currentPage]);

  const completeTransition = useCallback(() => {
    setTransitionState(prev => ({
      ...prev,
      isTransitioning: false,
      isExiting: false,
      isLoading: false,
    }));
  }, []);

  return {
    ...transitionState,
    navigateToPage,
    completeTransition,
  };
};
