import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';

interface LogoutAnimationProps {
  isVisible: boolean;
  userName?: string;
  onComplete?: () => void;
  duration?: number;
}

export default function LogoutAnimation({ 
  isVisible, 
  userName,
  onComplete, 
  duration = 1500 
}: LogoutAnimationProps) {
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
    return 'User';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-sm w-full mx-4 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <LogOut className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Signing you out...
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Thank you, {getDisplayName()}
        </p>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-emerald-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}
