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
import { useLocation, Route, Switch } from "wouter";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import { isInCordovaApp } from "@/lib/utils";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const FreelancerServicesPage = lazy(() => import("./pages/FreelancerServicesPage"));
const FreelancerServiceFormPage = lazy(() => import("./pages/FreelancerServiceFormPage"));
const FreelancerOrdersPage = lazy(() => import("./pages/FreelancerOrdersPage"));
const MarketplaceServicesPage = lazy(() => import("./pages/MarketplaceServicesPage"));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage"));
const ServiceCheckoutPage = lazy(() => import("./pages/ServiceCheckoutPage"));
const OrderTrackerPage = lazy(() => import("./pages/OrderTrackerPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Loader2 className="w-8 h-8 animate-spin text-[#0c332c]" />
  </div>
);

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [location] = useLocation();
  const { isAuthOnlyDomain } = useDomainDetection();
  
  useInactivityLogout();

  // Check if user has a stored session (indicates they were logged in)
  const hasStoredSession = typeof window !== 'undefined' && localStorage.getItem('sessionId');
  

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
            <SocialAuthRouter />
            <Suspense fallback={<PageLoader />}>
              <Switch>
                <Route path="/dashboard/freelancer/services/new" component={FreelancerServiceFormPage} />
                <Route path="/dashboard/freelancer/services/:id/edit" component={FreelancerServiceFormPage} />
                <Route path="/dashboard/freelancer/services" component={FreelancerServicesPage} />
                <Route path="/dashboard/freelancer/orders" component={FreelancerOrdersPage} />
                <Route path="/marketplace/services/:id" component={ServiceDetailPage} />
                <Route path="/marketplace/services" component={MarketplaceServicesPage} />
                <Route path="/checkout/service/:id" component={ServiceCheckoutPage} />
                <Route path="/orders/:id" component={OrderTrackerPage} />
                <Route>{() => <Index />}</Route>
              </Switch>
            </Suspense>
            {shouldShowChat && <VisitorHelpChat isAuthenticated={!!user} userRole={profile?.role} alwaysVisible={true} />}
            {shouldShowChat && <FreelancerChatWidget />}
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
