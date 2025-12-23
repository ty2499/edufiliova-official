import { ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { HeroSectionDisplay } from '@/components/HeroSectionDisplay';
import Logo from '@/components/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  onNavigate?: (page: string) => void;
  showNotNow?: boolean;
  notNowText?: string;
  notNowAction?: () => void;
  heroTitle?: string;
  heroSubtitle?: string;
  variant?: 'student' | 'teacher' | 'freelancer' | 'general';
  showBackButton?: boolean;
  onBack?: () => void;
  heroPlacement?: 'auth' | 'shop_auth';
}

export default function AuthLayout({
  children,
  onNavigate,
  showNotNow = true,
  notNowAction,
  showBackButton = false,
  onBack,
  heroPlacement = 'auth'
}: AuthLayoutProps) {

  const handleNotNow = () => {
    if (notNowAction) {
      notNowAction();
    } else if (onNavigate) {
      onNavigate('home');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left Side - Hero Section */}
        <div className="relative flex-shrink-0 md:w-1/2 md:fixed md:left-0 md:top-0 md:h-screen md:overflow-hidden">
          {/* Skip button on mobile - positioned over hero */}
          {showNotNow && (
            <button
              onClick={handleNotNow}
              className="absolute top-4 right-4 z-[100] px-4 py-2 text-sm font-medium text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all md:hidden" transition-all duration-300
              data-testid="button-skip-mobile"
            >
              Skip
            </button>
          )}

          {/* Back button on mobile - positioned over hero */}
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="absolute top-4 left-4 z-[100] p-2 text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all md:hidden" transition-all duration-300
              data-testid="button-back-mobile"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          {/* Single Hero Section - visible on all screen sizes */}
          <HeroSectionDisplay 
            placement={heroPlacement}
            className="w-full aspect-[3/4] max-h-[50vh] md:aspect-auto md:max-h-none md:h-full"
            showOverlay={false}
          />
        </div>

        {/* Right Side - Form Container */}
        <div className="w-full md:w-1/2 md:ml-auto flex flex-col items-center justify-start p-6 md:p-8 bg-gray-100 md:bg-gray-50 min-h-[50vh] md:min-h-screen md:max-h-screen md:overflow-y-auto rounded-t-[2rem] -mt-6 md:mt-0 md:rounded-none relative z-10">
          <div className="w-full max-w-md py-4 md:py-8">
            {/* Desktop top bar with buttons */}
            <div className="hidden md:flex justify-between items-center mb-6">
              {showBackButton && onBack ? (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors" transition-all duration-300
                  data-testid="button-back-desktop"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : (
                <div></div>
              )}
              
              {showNotNow && (
                <button
                  onClick={handleNotNow}
                  className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-all" transition-all duration-300
                  data-testid="button-skip-desktop"
                >
                  Skip
                </button>
              )}
            </div>

            {/* Form Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
