import { useState, useEffect } from 'react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

interface LoginSuccessAnimationProps {
  isVisible: boolean;
  userName?: string;
  userRole?: string;
  onComplete?: () => void;
  duration?: number;
}

export default function LoginSuccessAnimation({ 
  isVisible, 
  userName,
  userRole = 'User',
  onComplete, 
  duration = 1500 
}: LoginSuccessAnimationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  const getDisplayName = () => {
    if (userName) {
      if (userName.includes('@')) {
        return userName.split('@')[0];
      }
      return userName;
    }
    return 'Welcome';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-sm w-full mx-4 text-center" data-testid="login-success-animation">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto flex items-center justify-center" data-testid="success-icon">
            <CheckmarkIcon size="2xl" variant="success" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" data-testid="success-title">
          Welcome back!
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4" data-testid="welcome-message">
          {getDisplayName()}
        </p>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" data-testid="progress-bar">
          <div className="bg-emerald-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
        </div>
        
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-4" data-testid="status-text">
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
}
