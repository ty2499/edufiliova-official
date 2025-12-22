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
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-background via-background/95 to-muted/20 
                 backdrop-blur-sm flex items-center justify-center loading-screen-overlay"
      data-testid="loading-screen"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/10 to-muted/20"></div>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 animate-slide-in-up">
          <div className="w-12 h-12 bg-foreground/10 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <div className="text-2xl font-bold">
            <span className="text-foreground">Edu</span>
            <span className="text-muted-foreground">Filiova</span>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="relative w-32 h-32 animate-scale-in">
          {/* Outer Ring */}
          <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
          
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-foreground/80"
              strokeLinecap="round"
              strokeDasharray={`${(progress / 100) * 351.858} 351.858`}
              style={{
                transition: 'stroke-dasharray 0.1s ease-out',
              }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                {Math.round(progress)}%
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Loading
              </div>
            </div>
          </div>

          {/* Animated Center Pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-foreground/20 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2 animate-slide-in-up">
          <h3 className="text-xl font-semibold text-foreground">
            Preparing {getPageTitle(nextPage)}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Setting up your personalized learning experience...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs animate-slide-in-up">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-foreground to-foreground/80 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-foreground/10 rounded-full animate-bounce"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-foreground/15 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-3/4 w-4 h-4 bg-foreground/5 rounded-full animate-ping"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
