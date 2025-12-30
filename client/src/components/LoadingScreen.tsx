import React from 'react';
import { BouncingCircleLoader } from './ui/bouncing-loader';

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
      className="fixed inset-0 z-[9999] bg-[#0c332c]/80 backdrop-blur-xl flex items-center justify-center transition-all duration-500 ease-in-out"
      data-testid="loading-screen"
    >
      <div className="flex flex-col items-center">
        <BouncingCircleLoader 
          color="#0c332c"
          className="bg-white/90 p-12 rounded-full shadow-2xl scale-110"
          message={`Preparing ${getPageTitle(nextPage)}...`}
        />
        
        <div className="w-64 mt-12">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-[10px] text-white/60 mt-3 font-bold uppercase tracking-[0.2em]">
            {Math.round(progress)}% Loaded
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
