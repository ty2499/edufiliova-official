import React from 'react';
import { BouncingBoxLoader } from './ui/bouncing-loader';

interface LoadingScreenProps {
  isVisible: boolean;
  progress: number;
  nextPage?: string;
}

const LoadingScreen = ({ isVisible, progress, nextPage }: LoadingScreenProps) => {
  if (!isVisible) return null;

  const getPageTitle = (page?: string) => {
    const titles: Record<string, string> = {
      'home': 'Home',
      'learner-dashboard': 'Dashboard',
      'teacher-dashboard': 'Teacher Dashboard',
      'admin-dashboard': 'Admin Dashboard',
      'courses': 'Courses',
      'profile': 'Profile',
      'settings': 'Settings',
      'help': 'Help Center',
      'teacher-registration': 'Teacher Registration',
      'teacher-application': 'Teacher Application',
      'chat': 'Chat',
      'pricing': 'Pricing',
      'about': 'About Us',
      'contact': 'Contact Us',
    };
    return titles[page || ''] || 'Loading';
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-md flex items-center justify-center"
      data-testid="loading-screen"
    >
      <div className="flex flex-col items-center space-y-8">
        <BouncingBoxLoader 
          size="lg" 
          color="#2f5a4e" 
          message={`Preparing ${getPageTitle(nextPage)}...`}
        />
        
        <div className="w-64">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#2f5a4e] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2 font-medium uppercase tracking-widest">
            {Math.round(progress)}% Complete
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
