import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { HelpChatProvider } from "@/contexts/HelpChatContext";
import { FreelancerChatProvider } from "@/contexts/FreelancerChatContext";
import { MeetingProvider } from "@/contexts/MeetingContext";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import VisitorHelpChat from "@/components/VisitorHelpChat";
import { FreelancerChatWidget } from "@/components/FreelancerChatWidget";
import { MinimizedMeeting } from "@/components/MinimizedMeeting";
import { SocialAuthRouter } from "@/components/SocialAuthRouter";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import NetworkErrorBoundary from "@/components/NetworkErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useLocation } from "wouter";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import { isInCordovaApp } from "@/lib/utils";

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [location] = useLocation();
  const { isAuthOnlyDomain } = useDomainDetection();
  
  useInactivityLogout();

  // Check if user has a stored session (indicates they were logged in)
  const hasStoredSession = typeof window !== 'undefined' && localStorage.getItem('sessionId');
  
  // Determine if we should show loading screen
  // For Cordova mobile app: show loading during auth check to prevent home page flash
  // For web users: only show loading if they have a stored session
  const isCordova = isInCordovaApp();
  const shouldShowLoadingScreen = isCordova ? loading : (loading && hasStoredSession);
  
  // Show loading screen while auth is being validated
  // For Cordova apps: Always show during loading to prevent landing page flash
  // For web: Only show if they have a stored session (previously logged in)
  if (shouldShowLoadingScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Just a moment</p>
        </div>
      </div>
    );
  }

  // List of auth page routes where chat widget should be hidden
  const authRoutes = [
    '/login',
    '/signup',
    '/teacher-login',
    '/teacher-signup',
    '/teacher-signup-basic',
    '/freelancer-signup',
    '/freelancer-signup-basic',
    '/verify-email',
    '/teacher-verify-email',
    '/freelancer-verify-email',
    '/auth-modern',
    '/shop-auth',
    '/checkout-auth',
    '/design-team-contact'
  ];

  const isAuthPage = authRoutes.some(route => location.startsWith(route));
  
  // Hide chat on .click domain (auth-only domain)
  const shouldShowChat = !isAuthPage && !isAuthOnlyDomain;
  
  return (
    <HelpChatProvider>
      <FreelancerChatProvider>
        <MeetingProvider>
          <TooltipProvider>
            {/* Social Auth Router handles OAuth callbacks and social auth flow */}
            <SocialAuthRouter />
            <Index />
            {/* Help chat available for all users including authenticated - hidden on auth pages and .click domain */}
            {shouldShowChat && <VisitorHelpChat isAuthenticated={!!user} userRole={profile?.role} alwaysVisible={true} />}
            {/* Freelancer Chat Widget - rendered at app level like VisitorHelpChat - hidden on auth pages and .click domain */}
            {shouldShowChat && <FreelancerChatWidget />}
            {/* Minimized Meeting Window - rendered at app level */}
            <MinimizedMeeting />
            <Toaster />
          </TooltipProvider>
        </MeetingProvider>
      </FreelancerChatProvider>
    </HelpChatProvider>
  );
};

const App = () => (
  <NetworkErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ConfirmProvider>
            <AppContent />
          </ConfirmProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </NetworkErrorBoundary>
);

export default App;
