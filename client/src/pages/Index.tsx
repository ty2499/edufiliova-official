import { useState, useEffect } from "react";
import { useLocation, Route, Switch } from "wouter";
import { usePageTransition } from "@/hooks/usePageTransition";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { useDomainDetection, isPathAllowedOnAuthDomain } from "@/hooks/useDomainDetection";
import { useQuery } from "@tanstack/react-query";
import { 
  AppState as RouteAppState,
  PATH_TO_STATE as ROUTE_PATH_TO_STATE,
  STATE_TO_PATH as ROUTE_STATE_TO_PATH,
  getBlogSlugFromPath as getRouteBlogSlug,
  getCourseIdFromPath as getRouteCourseId,
  canAccessState,
  isProtectedState,
} from "@/lib/routesConfig";
import { isInCordovaApp, isWebsiteOnlyPage } from "@/lib/utils";
import LogoutAnimation from "@/components/LogoutAnimation";
import TopProgressBar from "@/components/TopProgressBar";
import Header from "@/components/Header";
import PortfolioNavigation from "@/components/PortfolioNavigation";
import AuthModern from "./AuthModern";
import GetStarted from "./GetStarted";
import TeacherLogin from "./TeacherLogin";
import StudySettings from "./StudySettings";
import LandingPage from "./LandingPage";
import PremiumPage from "./PremiumPage";
import ContactPage from "./ContactPage";
import TermsPage from "./TermsPage";
import StudentTermsPage from "./StudentTermsPage";
import TeacherTermsPage from "./TeacherTermsPage";
import SchoolInstitutionTermsPage from "./SchoolInstitutionTermsPage";
import RefundPolicyPage from "./RefundPolicyPage";
import PrivacyPolicyPage from "./PrivacyPolicyPage";
import CookiesPolicyPage from "./CookiesPolicyPage";
import WhatsAppPolicyPage from "./WhatsAppPolicyPage";
import DataRetentionPolicyPage from "./DataRetentionPolicyPage";
import CommunityGuidelinesPage from "./CommunityGuidelinesPage";
import PaymentBillingPolicyPage from "./PaymentBillingPolicyPage";
import CopyrightDMCAPolicyPage from "./CopyrightDMCAPolicyPage";
import AboutPage from "./AboutPage";
import HelpCenter from "./HelpCenter";
import Subscribe from "./Subscribe";
import Checkout from "./Checkout";
import LearnMorePage from "./LearnMorePage";
import StudentDashboard from "./StudentDashboard";
import AdminPaymentDashboard from "./AdminPaymentDashboard";
import AdminShowcaseDashboard from "./AdminShowcaseDashboard";
import { FindTalent } from "./FindTalent";
import StudentNetworking from "./StudentNetworking";
import ResetPassword from "@/components/ResetPassword";
import Survey from "@/components/Survey";
import PaymentSuccess from "./PaymentSuccess";
import TransactionDashboard from "./TransactionDashboard";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { TeacherDashboardPending } from "@/components/TeacherDashboardPending";
import { FreelancerDashboard } from "@/components/FreelancerDashboard";
import { FreelancerDashboardPending } from "@/components/FreelancerDashboardPending";
import { PayoutPolicy } from "./PayoutPolicy";
import { LogoManagementPage } from "./LogoManagementPage";
import ChatTermsPage from "./ChatTermsPage";
import AdvertiseWithUs from "./AdvertiseWithUs";
import DesignTeamContact from "./DesignTeamContact";
import BannerCreator from "./BannerCreator";
import BannerPayment from "./BannerPayment";
import CourseCreator from "./CourseCreator";
import SubjectCreator from "./SubjectCreator";
import EducationLevelSelector from "@/components/EducationLevelSelector";
import CourseBrowse from "./CourseBrowse";
import CourseDetail from "./CourseDetail";
import CoursePlayer from "./CoursePlayer";
import ClaimCertificate from "./ClaimCertificate";
import PortfolioGallery from "./PortfolioGallery";
import PortfolioCreate from "./PortfolioCreate";
import PortfolioPreview from "./PortfolioPreview";
import FreelancerProfile from "./FreelancerProfile";
import FreelancerSignup from "./FreelancerSignup";
import EmailVerification from "./EmailVerification";
import ShopAuth from "./ShopAuth";
import CustomerDashboard from "./CustomerDashboard";
import CreatorEarningsDashboard from "./CreatorEarningsDashboard";
import AdminPayoutManagement from "./AdminPayoutManagement";
import TeacherMeetings from "./TeacherMeetings";
import TeacherMeetingDetail from "./TeacherMeetingDetail";
import StudentMeetings from "./StudentMeetings";
import MeetingScheduler from "./MeetingScheduler";
import MeetingRoom from "./MeetingRoom";
import ProductShop from "./ProductShop";
import ProductDetail from "./ProductDetail";
import Cart from "./Cart";
import { CategoryManagement } from "./CategoryManagement";
import { CategoryDetail } from "./CategoryDetail";
import ProductCreation from "./ProductCreation";
import CouponManagement from "./CouponManagement";
import FreelancerCheckout from "./FreelancerCheckout";
import MyCertificatesPage from "./MyCertificatesPage";
import VerifyCertificatePage from "./VerifyCertificatePage";
import AdminEmailManagement from "./AdminEmailManagement";
import AdminEmailCampaigns from "./AdminEmailCampaigns";
import EnhancedEmailInbox from "./EnhancedEmailInbox";
import BlogPage from "./BlogPage";
import BlogPostDetail from "./BlogPostDetail";
import AdminBlogManagement from "./AdminBlogManagement";
import AdminCourseManagement from "./AdminCourseManagement";
import AdminContactMessages from "./AdminContactMessages";
import AdminApplicationsManagement from "./AdminApplicationsManagement";
import AdminSubjectApproval from "./AdminSubjectApproval";
import CustomerPricingPage from "./CustomerPricingPage";
import CreatorPricingPage from "./CreatorPricingPage";
import EducationPricingPage from "./EducationPricingPage";
import TeacherPricingPage from "./TeacherPricingPage";
import TeacherSignup from "./TeacherSignup";
import TeacherSignupBasic from "./TeacherSignupBasic";
import TeacherVerifyEmail from "./TeacherVerifyEmail";
import VerifyTeacherEmail from "./VerifyTeacherEmail";
import TeacherApplicationStatus from "./TeacherApplicationStatus";
import FreelancerSignupBasic from "./FreelancerSignupBasic";
import FreelancerApplicationStatus from "./FreelancerApplicationStatus";
import BecomeTeacherPage from "./BecomeTeacherPage";
import BuyVoucherPage from "./BuyVoucherPage";
import { NotFoundPage, AccessDeniedPage } from "@/components/ErrorPages";

type AppState = "home" | "not-found" | "access-denied" | "auth" | "student-signup" | "creator-signup" | "teacher-login" | "freelancer-login" | "teacher-signup-basic" | "teacher-signup" | "teacher-verify-email" | "teacher-verify-code" | "teacher-application-status" | "teacher-application" | "premium" | "contact" | "design-team-contact" | "privacy" | "terms" | "student-terms" | "teacher-terms" | "school-terms" | "refund-policy" | "privacy-policy" | "cookies-policy" | "whatsapp-policy" | "data-retention" | "community-guidelines" | "payment-billing" | "chat-terms" | "settings" | "about" | "help" | "subscribe" | "checkout" | "learn-more" | "reset-password" | "student-dashboard" | "survey" | "customer-pricing" | "creator-pricing" | "education-pricing" | "teacher-pricing" | "admin-dashboard" | "admin-showcase-dashboard" | "admin-email-management" | "admin-email-campaigns" | "admin-email-inbox" | "admin-blog-management" | "admin-course-management" | "admin-contact-messages" | "admin-applications-management" | "admin-subject-approval" | "blog" | "blog-post-detail" | "community" | "networking" | "payment-success" | "transaction-dashboard" | "teacher-dashboard" | "teacher-meetings" | "teacher-meeting-detail" | "teacher-meetings-schedule" | "student-meetings" | "meeting-room" | "freelancer-dashboard" | "freelancer-signup-basic" | "freelancer-signup" | "freelancer-application-status" | "shop-auth" | "customer-dashboard" | "payout-policy" | "logo-management" | "advertise-with-us" | "banner-creator" | "banner-payment" | "education-level-selector" | "course-creator" | "subject-creator" | "course-browse" | "course-detail" | "course-player" | "portfolio-gallery" | "portfolio-create" | "portfolio-edit" | "portfolio-preview" | "freelancer-profile" | "product-shop" | "product-detail" | "cart" | "category-management" | "category-detail" | "product-creation" | "coupon-management" | "freelancer-checkout" | "my-certificates" | "verify-certificate" | "claim-certificate" | "creator-earnings-dashboard" | "admin-payout-management" | "buy-voucher";

// Clean URL path mappings for shareable public pages
const PATH_TO_STATE: Record<string, AppState> = {
  '/': 'home',
  '/app': 'home',
  '/blog': 'blog',
  '/about': 'about',
  '/contact': 'contact',
  '/help': 'help',
  '/premium': 'premium',
  '/terms': 'terms',
  '/privacy': 'privacy',
  '/privacy-policy': 'privacy-policy',
  '/cookies-policy': 'cookies-policy',
  '/refund-policy': 'refund-policy',
  '/student-terms': 'student-terms',
  '/teacher-terms': 'teacher-terms',
  '/school-terms': 'school-terms',
  '/chat-terms': 'chat-terms',
  '/whatsapp-policy': 'whatsapp-policy',
  '/data-retention': 'data-retention',
  '/copyright-dmca': 'copyright-dmca',
  '/community-guidelines': 'community-guidelines',
  '/payment-billing': 'payment-billing',
  '/payout-policy': 'payout-policy',
  '/learn-more': 'learn-more',
  '/subscribe': 'subscribe',
  '/login': 'auth',
  '/signup': 'auth',
  '/teacher-login': 'teacher-login',
  '/teacher-signup': 'teacher-signup',
  '/teacher-signup-basic': 'teacher-signup-basic',
  '/teacher-verify-email': 'teacher-verify-email',
  '/teacher-application-status': 'teacher-application-status',
  '/freelancer-login': 'freelancer-login',
  '/freelancer-signup': 'freelancer-signup',
  '/freelancer-signup-basic': 'freelancer-signup-basic',
  '/freelancer-application-status': 'freelancer-application-status',
  '/courses': 'course-browse',
  '/portfolio': 'portfolio-gallery',
  '/find-talent': 'community',
  '/shop': 'product-shop',
  '/cart': 'cart',
  '/advertise': 'advertise-with-us',
  '/become-teacher': 'teacher-application',
  '/buy-voucher': 'buy-voucher',
  '/verify-certificate': 'verify-certificate',
  '/my-certificates': 'my-certificates',
  '/customer-pricing': 'customer-pricing',
  '/creator-pricing': 'creator-pricing',
  '/education-pricing': 'education-pricing',
  '/teacher-pricing': 'teacher-pricing',
  '/404': 'not-found',
  '/403': 'access-denied',
  '/apply/teacher': 'teacher-signup-basic',
  '/apply/freelancer': 'freelancer-signup-basic',
  '/checkout/voucher': 'buy-voucher',
  '/checkout/membership': 'subscribe',
};

// Pages that ALWAYS redirect to dashboard - only home/auth pages
// Other public pages (about, help, contact, shop, etc.) are browsable by authenticated users
const LANDING_ONLY_PAGES: AppState[] = [
  'home', 'auth'
];

// LocalStorage key for last visited in-app page (for /app path users)
const LAST_APP_PAGE_KEY = 'edufiliova_last_app_page';

// Check if user is on /app path (mobile PWA)
const isAppPath = (): boolean => {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return pathname === '/app' || pathname.startsWith('/app/') || params.get('app') === 'true';
};

// Get stored last app page for authenticated users
const getStoredAppPage = (): AppState | null => {
  try {
    const stored = localStorage.getItem(LAST_APP_PAGE_KEY);
    if (stored && !LANDING_ONLY_PAGES.includes(stored as AppState)) {
      return stored as AppState;
    }
  } catch (e) {}
  return null;
};

// Store last visited in-app page
const storeAppPage = (page: AppState) => {
  try {
    if (!LANDING_ONLY_PAGES.includes(page)) {
      localStorage.setItem(LAST_APP_PAGE_KEY, page);
    }
  } catch (e) {}
};

// Open link externally (for PWA/Cordova users viewing landing content)
export const openExternalLink = (url: string) => {
  // Check if Cordova InAppBrowser is available
  if (typeof (window as any).cordova !== 'undefined' && (window as any).cordova.InAppBrowser) {
    (window as any).cordova.InAppBrowser.open(url, '_system');
  } else {
    // Fallback: open in new browser tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// Reverse mapping: state to clean URL path (for navigation)
const STATE_TO_PATH: Record<string, string> = {
  'home': '/',
  'blog': '/blog',
  'blog-post-detail': '/blog',
  'about': '/about',
  'contact': '/contact',
  'help': '/help',
  'premium': '/premium',
  'terms': '/terms',
  'privacy': '/privacy',
  'privacy-policy': '/privacy-policy',
  'cookies-policy': '/cookies-policy',
  'refund-policy': '/refund-policy',
  'student-terms': '/student-terms',
  'teacher-terms': '/teacher-terms',
  'school-terms': '/school-terms',
  'chat-terms': '/chat-terms',
  'whatsapp-policy': '/whatsapp-policy',
  'data-retention': '/data-retention',
  'copyright-dmca': '/copyright-dmca',
  'community-guidelines': '/community-guidelines',
  'payment-billing': '/payment-billing',
  'payout-policy': '/payout-policy',
  'learn-more': '/learn-more',
  'subscribe': '/subscribe',
  'auth': '/login',
  'teacher-login': '/teacher-login',
  'teacher-signup': '/teacher-signup',
  'teacher-signup-basic': '/teacher-signup-basic',
  'teacher-verify-email': '/teacher-verify-email',
  'teacher-application-status': '/teacher-application-status',
  'freelancer-login': '/freelancer-login',
  'freelancer-signup': '/freelancer-signup',
  'freelancer-signup-basic': '/freelancer-signup-basic',
  'freelancer-application-status': '/freelancer-application-status',
  'course-browse': '/courses',
  'portfolio-gallery': '/portfolio',
  'community': '/find-talent',
  'product-shop': '/shop',
  'cart': '/cart',
  'advertise-with-us': '/advertise',
  'become-teacher': '/become-teacher',
  'buy-voucher': '/buy-voucher',
  'verify-certificate': '/verify-certificate',
  'my-certificates': '/my-certificates',
  'customer-pricing': '/customer-pricing',
  'creator-pricing': '/creator-pricing',
  'education-pricing': '/education-pricing',
  'teacher-pricing': '/teacher-pricing',
  'not-found': '/404',
  'access-denied': '/403',
};

// Helper to get blog slug from URL
const getBlogSlugFromPath = (): string | null => {
  const path = window.location.pathname;
  if (path.startsWith('/blog/') && path.length > 6) {
    return path.substring(6);
  }
  return null;
};

// Helper to get course ID from URL
const getCourseIdFromPath = (): string | null => {
  const path = window.location.pathname;
  if (path.startsWith('/course/') && path.length > 8) {
    return path.substring(8);
  }
  if (path.startsWith('/course-player/') && path.length > 15) {
    return path.substring(15);
  }
  return null;
};

// Helper to get product ID from URL
const getProductIdFromPath = (): string | null => {
  const path = window.location.pathname;
  if (path.startsWith('/product/') && path.length > 9) {
    return path.substring(9);
  }
  return null;
};

// Helper to get portfolio work ID from URL
const getWorkIdFromPath = (): string | null => {
  const path = window.location.pathname;
  if (path.startsWith('/portfolio/') && path.length > 11) {
    return path.substring(11);
  }
  return null;
};

// Helper to get freelancer ID from URL
const getFreelancerIdFromPath = (): string | null => {
  const path = window.location.pathname;
  if (path.startsWith('/freelancer/') && path.length > 12) {
    return path.substring(12);
  }
  return null;
};

// Smart initial state based on URL path - supports clean URLs for sharing
import { BouncingBoxesLoader } from '@/components/loaders/BouncingBoxesLoader';

const getInitialState = (): AppState => {
  try {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check clean URL paths first (highest priority for shareable links)
    
    // Dynamic path routes with parameters
    if (path.startsWith('/blog/') && path.length > 6) {
      return "blog-post-detail";
    }
    if (path.startsWith('/course/') && path.length > 8) {
      return "course-detail";
    }
    if (path.startsWith('/course-player/') && path.length > 15) {
      return "course-player";
    }
    if (path.startsWith('/product/') && path.length > 9) {
      return "product-detail";
    }
    if (path.startsWith('/portfolio/') && path.length > 11) {
      return "portfolio-preview";
    }
    if (path.startsWith('/freelancer/') && path.length > 12) {
      return "freelancer-profile";
    }
    if (path.startsWith('/meeting-room/')) {
      return "meeting-room";
    }
    if (path.startsWith('/teacher-meeting-detail/')) {
      return "teacher-meeting-detail";
    }
    if (path.startsWith('/claim-certificate/')) {
      return "claim-certificate";
    }
    if (path.startsWith('/verify-certificate/')) {
      return "verify-certificate";
    }
    
    // Check static path mappings
    if (PATH_TO_STATE[path]) {
      return PATH_TO_STATE[path];
    }
    
    // Fallback to query parameter routing (for backwards compatibility and dashboards)
    const pageParam = urlParams.get('page');
    if (pageParam) {
      // Dashboard and admin routes stay with query params
      const queryRoutes: Record<string, AppState> = {
        'admin-dashboard': 'admin-dashboard',
        'admin-showcase-dashboard': 'admin-showcase-dashboard',
        'admin-email-management': 'admin-email-management',
        'admin-email-campaigns': 'admin-email-campaigns',
        'admin-email-inbox': 'admin-email-inbox',
        'admin-blog-management': 'admin-blog-management',
        'admin-course-management': 'admin-course-management',
        'admin-contact-messages': 'admin-contact-messages',
        'admin-applications-management': 'admin-applications-management',
        'admin-subject-approval': 'admin-subject-approval',
        'student-dashboard': 'student-dashboard',
        'teacher-dashboard': 'teacher-dashboard',
        'freelancer-dashboard': 'freelancer-dashboard',
        'customer-dashboard': 'customer-dashboard',
        'creator-earnings-dashboard': 'creator-earnings-dashboard',
        'admin-payout-management': 'admin-payout-management',
        'logo-management': 'logo-management',
        'banner-creator': 'banner-creator',
        'banner-payment': 'banner-payment',
        'education-level-selector': 'education-level-selector',
        'course-creator': 'course-creator',
        'subject-creator': 'subject-creator',
        'shop-auth': 'shop-auth',
        'checkout-auth': 'checkout-auth',
        'course-detail': 'course-detail',
        'course-player': 'course-player',
        'portfolio-create': 'portfolio-create',
        'portfolio-edit': 'portfolio-edit',
        'portfolio-preview': 'portfolio-preview',
        'freelancer-profile': 'freelancer-profile',
        'product-detail': 'product-detail',
        'category-management': 'category-management',
        'category-detail': 'category-detail',
        'product-creation': 'product-creation',
        'coupon-management': 'coupon-management',
        'freelancer-checkout': 'freelancer-checkout',
        'claim-certificate': 'claim-certificate',
        'teacher-meetings': 'teacher-meetings',
        'teacher-meeting-detail': 'teacher-meeting-detail',
        'student-meetings': 'student-meetings',
        'meeting-room': 'meeting-room',
        'survey': 'survey',
        'reset-password': 'reset-password',
        'payment-success': 'payment-success',
        'transaction-dashboard': 'transaction-dashboard',
        'checkout': 'checkout',
        'design-team-contact': 'design-team-contact',
        'login': 'auth',
        'signup': 'auth',
      };
      
      if (queryRoutes[pageParam]) {
        return queryRoutes[pageParam];
      }
      
      // Also check if pageParam matches any known state (fallback)
      if (pageParam as AppState) {
        return pageParam as AppState;
      }
    }
    
    // For /app path users with session, check stored page to bypass landing
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId && isAppPath()) {
      const storedPage = getStoredAppPage();
      if (storedPage) {
        console.log('📱 App path: authenticated user, restoring last page:', storedPage);
        return storedPage;
      }
      // No stored page but authenticated - will be redirected to dashboard by useEffect
      console.log('📱 App path: authenticated user, waiting for role-based routing');
      return "home"; // Temporary - useEffect will redirect
    }
    
    // Cordova mobile app users WITHOUT session should see GetStarted onboarding
    // They can click "Explore Website" to view the landing page externally
    if (isInCordovaApp() && !sessionId) {
      console.log('📱 Cordova app: unauthenticated user, showing GetStarted screen');
      return "get-started";
    }
    
    // If path is root or /app, return home
    if (path === '/' || path === '/app' || path.startsWith('/app/')) {
      return "home";
    }
    
    // Unknown path - return 404
    return "not-found";
  } catch (error) {
    console.error('Error determining initial state:', error);
  }
  
  return "home";
};

// Wrapper components to check application status before showing dashboard
function TeacherDashboardWithStatusCheck({ onNavigate, userId }: { onNavigate: any; userId: number }) {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectId, setRedirectId] = useState<number | null>(null);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  
  const { data: application, isLoading } = useQuery({
    queryKey: [`/api/teacher-applications/status/${userId}`],
  });

  // Ensure minimum 2s loading time for the animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Check if application is incomplete using useEffect to avoid render-loop
  useEffect(() => {
    if (application) {
      const app = application as any;
      const isIncomplete = !app.teachingCategories?.length || 
                           !app.gradeLevels?.length || 
                           !app.highestQualification || 
                           !app.idPassportDocument ||
                           !app.agreementTerms;
      
      if (isIncomplete && app.status === 'pending' && app.id) {
        setShouldRedirect(true);
        setRedirectId(app.id);
      }
    }
  }, [application]);

  // Handle redirect in separate useEffect
  useEffect(() => {
    if (shouldRedirect && redirectId) {
      const newUrl = `/?page=teacher-signup&applicationId=${redirectId}`;
      window.history.replaceState({}, '', newUrl);
      onNavigate('teacher-signup');
    }
  }, [shouldRedirect, redirectId, onNavigate]);

  // Show loading screen while checking profile status or during min loading time
  if (isLoading || !minLoadingComplete) {
    return <BouncingBoxesLoader />;
  }

  // If redirecting, show nothing
  if (shouldRedirect) {
    return null;
  }

  // Show pending dashboard if application is complete but awaiting review
  if (application) {
    const app = application as any;
    if (app.status === 'pending' || app.status === 'under_review' || app.status === 'rejected') {
      return <TeacherDashboardPending onNavigate={onNavigate} />;
    }
    // Show dashboard when approved
    return <TeacherDashboard onNavigate={onNavigate} />;
  }

  // No application found - show pending dashboard (will show default state)
  return <TeacherDashboardPending onNavigate={onNavigate} />;
}

function FreelancerDashboardWithStatusCheck({ onNavigate, initialTab, userId }: { onNavigate: any; initialTab: string; userId: number }) {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectId, setRedirectId] = useState<number | null>(null);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  
  const { data: application, isLoading } = useQuery({
    queryKey: [`/api/freelancer/applications/status/${userId}`],
  });

  // Ensure minimum 2s loading time for the animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Check if application is incomplete using useEffect to avoid render-loop
  useEffect(() => {
    if (application) {
      const app = application as any;
      const isIncomplete = !app.primaryCategory || 
                           !app.tagline || 
                           !app.about || 
                           !app.skills?.length || 
                           !app.servicesOffered?.length;
      
      if (isIncomplete && app.status === 'pending' && app.id) {
        setShouldRedirect(true);
        setRedirectId(app.id);
      }
    }
  }, [application]);

  // Handle redirect in separate useEffect
  useEffect(() => {
    if (shouldRedirect && redirectId) {
      const newUrl = `/?page=freelancer-signup&applicationId=${redirectId}`;
      window.history.replaceState({}, '', newUrl);
      onNavigate('freelancer-signup');
    }
  }, [shouldRedirect, redirectId, onNavigate]);

  // Show loading screen while checking profile status or during min loading time
  if (isLoading || !minLoadingComplete) {
    return <BouncingBoxesLoader />;
  }

  // If redirecting, show nothing
  if (shouldRedirect) {
    return null;
  }

  // Show pending dashboard if application is complete but awaiting review
  if (application) {
    const app = application as any;
    if (app.status === 'pending' || app.status === 'under_review' || app.status === 'rejected') {
      return <FreelancerDashboardPending onNavigate={onNavigate} />;
    }
    // Show dashboard when approved
    return <FreelancerDashboard onNavigate={onNavigate} initialTab={initialTab} />;
  }

  // No application found - show pending dashboard (will show default state)
  return <FreelancerDashboardPending onNavigate={onNavigate} />;
}

const Index = () => {
  const initialState = getInitialState();
  const [currentState, setCurrentState] = useState<AppState>(initialState);
  const [location, navigate] = useLocation();
  const { 
    currentPage, 
    isTransitioning, 
    transitionType, 
    navigateToPage,
    isLoading,
    loadingProgress,
    isExiting
  } = usePageTransition(initialState);
  const { user, loading, profile, logout, refreshAuth, teacherApplicationStatus, freelancerApplicationStatus } = useAuth();
  
  // Domain detection for auth-only domains (e.g., edufiliova.click)
  const { isAuthOnlyDomain, hostname } = useDomainDetection();
  
  // Onboarding state for auth-only domain/route (GetStarted carousel)
  // Path-based: edufiliova.com/app shows Get Started, edufiliova.com shows full site
  // Also supports legacy subdomain detection for backwards compatibility
  // IMPORTANT: Skip onboarding entirely if user is already authenticated
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // If user already has a session, skip onboarding entirely
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      console.log('📱 Skipping onboarding - user already authenticated');
      return false;
    }
    
    const host = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    
    // Check if accessing via /app path or ?app=true (primary method)
    const isAppPathCheck = pathname === '/app' || pathname.startsWith('/app/') || pathname.startsWith('/app?');
    const hasAppParam = params.get('app') === 'true';
    
    // Legacy: Check subdomain
    const authOnlyDomains = ['app.edufiliova.com', 'www.app.edufiliova.com', 'edufiliova.click', 'www.edufiliova.click'];
    const isAuthDomain = authOnlyDomains.includes(host) || host.startsWith('app.');
    
    // Show onboarding if on /app path, ?app=true, or auth-only domain
    if (!isAppPathCheck && !hasAppParam && !isAuthDomain) return false;
    
    const completed = localStorage.getItem('edufiliova_onboarding_completed');
    return !completed;
  });
  
  // Logout animation state
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  
  // Category detail state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  // Freelancer dashboard tab state
  const [freelancerDashboardTab, setFreelancerDashboardTab] = useState<string>('overview');
  
  // Checkout details state
  const [checkoutDetails, setCheckoutDetails] = useState({
    amount: 29.99,
    courseName: "Premium Access",
    planName: "Premium",
    billingCycle: "monthly",
    clientSecret: "",
    orderData: null
  });

  // Search state for product shop
  const [searchQuery, setSearchQuery] = useState('');

  // Meeting ID state for dynamic routes - extract from initial URL
  const [meetingId, setMeetingId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/meeting-room/')) {
      return path.split('/meeting-room/')[1]?.split('?')[0] || null;
    }
    if (path.startsWith('/teacher-meeting-detail/')) {
      return path.split('/teacher-meeting-detail/')[1]?.split('?')[0] || null;
    }
    return null;
  });

  // Course ID state for course navigation - initialize from clean URL path
  const [courseId, setCourseId] = useState<string | null>(() => getCourseIdFromPath());
  
  // Blog slug state for blog post navigation - initialize from clean URL path
  const [blogSlug, setBlogSlug] = useState<string | null>(() => getBlogSlugFromPath());

  // Track URL search params to detect changes
  const [urlSearch, setUrlSearch] = useState(window.location.search);

  // Auth-only domain redirect: If on edufiliova.click, redirect non-auth pages to auth
  useEffect(() => {
    if (isAuthOnlyDomain) {
      const currentPath = window.location.pathname;
      // If user is on auth-only domain and trying to access non-auth page, redirect to login
      if (!isPathAllowedOnAuthDomain(currentPath)) {
        console.log('🔒 Auth-only domain detected, redirecting to login from:', currentPath);
        navigate('/login');
        setCurrentState('auth');
        navigateToPage('auth', 'instant');
      }
    }
  }, [isAuthOnlyDomain, location, navigate, navigateToPage]);

  // Block mobile (Cordova) users from accessing website pages - they should only see dashboards
  // Only applies to authenticated users - unauthenticated users can see auth pages
  useEffect(() => {
    // Skip if not in Cordova app, still loading, or not authenticated
    if (!isInCordovaApp() || loading || !user || !profile) return;
    
    // If user is on a website-only page on mobile, redirect to their dashboard
    if (isWebsiteOnlyPage(currentState)) {
      console.log('📱 Mobile user on website page, redirecting to dashboard:', currentState);
      
      // Get the appropriate dashboard based on role
      let targetPage: AppState = 'customer-dashboard'; // default
      
      if (['admin', 'accountant', 'customer_service'].includes(profile.role)) {
        targetPage = 'admin-dashboard';
      } else if (profile.role === 'teacher') {
        targetPage = 'teacher-dashboard';
      } else if (profile.role === 'freelancer') {
        targetPage = 'freelancer-dashboard';
      } else if (profile.role === 'general') {
        targetPage = 'customer-dashboard';
      }
      
      // Redirect instantly
      setCurrentState(targetPage);
      navigateToPage(targetPage, 'instant');
    }
  }, [loading, user, profile, currentState, navigateToPage]);

  // Auto-redirect authenticated users from home page - ONLY on /app path (mobile app)
  // On web browsers, users should be able to view home page intentionally
  useEffect(() => {
    // Skip if still loading
    if (loading) return;
    
    // Only if user is authenticated and on home page
    if (!user || !profile || currentState !== 'home') return;
    
    // Check if on /app path (mobile app only)
    const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    const isOnAppPath = pathname === '/app' || pathname.startsWith('/app/') || pathname.startsWith('/app?');
    
    // Only redirect on /app path - web users can stay on home
    if (!isOnAppPath) return;
    
    // Check if user intentionally went home
    const intentionallyWentHome = localStorage.getItem('force_home_navigation') === 'true';
    if (intentionallyWentHome) return; // User intentionally wants to be on home
    
    // Auto-redirect to appropriate dashboard (no loading screen shown)
    let targetPage: AppState = 'customer-dashboard'; // default
    
    if (['admin', 'accountant', 'customer_service'].includes(profile.role)) {
      targetPage = 'admin-dashboard';
    } else if (profile.role === 'teacher') {
      targetPage = 'teacher-dashboard';
    } else if (profile.role === 'freelancer') {
      targetPage = 'freelancer-dashboard';
    } else if (profile.role === 'general') {
      targetPage = 'customer-dashboard';
    }
    
    // Instantly redirect without showing anything
    setCurrentState(targetPage);
    navigateToPage(targetPage, 'instant');
  }, [loading, user, profile, currentState, navigateToPage]);

  // /app path auth bypass: Authenticated users on /app should never see landing pages
  // They should be redirected to their dashboard or last visited in-app page
  useEffect(() => {
    // Skip if still loading auth
    if (loading) return;
    
    // Only applies to /app path users
    if (!isAppPath()) return;
    
    // Only redirect if user is authenticated AND on a landing-only page
    if (user && profile && LANDING_ONLY_PAGES.includes(currentState)) {
      console.log('📱 App path: authenticated user on landing page, redirecting to dashboard');
      
      // Get the appropriate dashboard based on role
      let targetPage: AppState = 'customer-dashboard'; // default
      
      if (['admin', 'accountant', 'customer_service'].includes(profile.role)) {
        targetPage = 'admin-dashboard';
      } else if (profile.role === 'teacher') {
        targetPage = 'teacher-dashboard';
      } else if (profile.role === 'freelancer') {
        targetPage = 'freelancer-dashboard';
      } else if (profile.role === 'general') {
        targetPage = 'customer-dashboard';
      }
      
      // Check for stored page first (user's last location)
      const storedPage = getStoredAppPage();
      if (storedPage) {
        targetPage = storedPage;
        console.log('📱 Restoring last app page:', storedPage);
      }
      
      // Navigate to target
      setCurrentState(targetPage);
      navigateToPage(targetPage, 'instant');
    }
  }, [loading, user, profile, currentState, navigateToPage]);

  // Store last visited in-app page for /app users
  useEffect(() => {
    if (isAppPath() && user && !LANDING_ONLY_PAGES.includes(currentState)) {
      storeAppPage(currentState);
    }
  }, [currentState, user]);

  // Listen for URL changes (including query param changes)
  useEffect(() => {
    const handleUrlChange = () => {
      setUrlSearch(window.location.search);
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleUrlChange);
    
    // Also listen for pushState/replaceState (programmatic navigation)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleUrlChange();
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleUrlChange();
    };

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  // Sync URL changes from wouter navigate() to currentState
  useEffect(() => {
    console.log('🔄 URL sync - location changed:', location, 'search:', urlSearch);
    
    // Check for query parameters
    const urlParams = new URLSearchParams(urlSearch);
    const pageParam = urlParams.get('page');
    
    // Handle query parameter routes first
    if (pageParam === 'teacher-signup') {
      console.log('🔄 Detected teacher-signup query param, updating state');
      setCurrentState('teacher-signup');
      navigateToPage('teacher-signup', 'fade');
      return;
    } else if (pageParam === 'teacher-verify-email') {
      console.log('🔄 Detected teacher-verify-email query param, updating state');
      setCurrentState('teacher-verify-email');
      navigateToPage('teacher-verify-email', 'fade');
      return;
    } else if (pageParam === 'teacher-application-status') {
      console.log('🔄 Detected teacher-application-status query param, updating state');
      setCurrentState('teacher-application-status');
      navigateToPage('teacher-application-status', 'fade');
      return;
    } else if (pageParam === 'teacher-login') {
      console.log('🔄 Detected teacher-login query param, updating state');
      setCurrentState('teacher-login');
      navigateToPage('teacher-login', 'fade');
      return;
    } else if (pageParam === 'freelancer-login') {
      console.log('🔄 Detected freelancer-login query param, updating state');
      setCurrentState('freelancer-login');
      navigateToPage('freelancer-login', 'fade');
      return;
    } else if (pageParam === 'freelancer-signup') {
      console.log('🔄 Detected freelancer-signup query param, updating state');
      setCurrentState('freelancer-signup');
      navigateToPage('freelancer-signup', 'fade');
      return;
    } else if (pageParam === 'freelancer-application-status') {
      console.log('🔄 Detected freelancer-application-status query param, updating state');
      setCurrentState('freelancer-application-status');
      navigateToPage('freelancer-application-status', 'fade');
      return;
    } else if (pageParam === 'privacy-policy') {
      console.log('🔄 Detected privacy-policy query param, updating state');
      setCurrentState('privacy-policy');
      navigateToPage('privacy-policy', 'fade');
      return;
    } else if (pageParam === 'cookies-policy') {
      console.log('🔄 Detected cookies-policy query param, updating state');
      setCurrentState('cookies-policy');
      navigateToPage('cookies-policy', 'fade');
      return;
    } else if (pageParam === 'course-detail') {
      // Legacy URL parameter support - prefer state-based navigation (course-detail-{id})
      const courseIdParam = urlParams.get('courseId');
      if (courseIdParam) {
        console.log('🔄 Detected legacy course-detail URL, redirecting to state-based navigation');
        // Clean URL by removing parameters
        window.history.replaceState({}, '', '/');
        // Use state-based navigation
        handleNavigation(`course-detail-${courseIdParam}`);
      }
      return;
    } else if (pageParam === 'course-player') {
      // Legacy URL parameter support - prefer state-based navigation (course-player-{id})
      const courseIdParam = urlParams.get('courseId');
      if (courseIdParam) {
        console.log('🔄 Detected legacy course-player URL, redirecting to state-based navigation');
        // Clean URL by removing parameters
        window.history.replaceState({}, '', '/');
        // Use state-based navigation
        handleNavigation(`course-player-${courseIdParam}`);
      }
      return;
    } else if (pageParam === 'claim-certificate') {
      // Legacy URL parameter support - prefer state-based navigation
      const courseIdParam = urlParams.get('courseId');
      if (courseIdParam) {
        console.log('🔄 Detected legacy claim-certificate URL, redirecting to state-based navigation');
        // Clean URL by removing parameters
        window.history.replaceState({}, '', '/');
        // Use state-based navigation
        handleNavigation(`claim-certificate-${courseIdParam}`);
      }
      return;
    } else if (pageParam === 'course-browse') {
      console.log('🔄 Redirecting old course-browse URL to new route: /courses');
      navigate('/courses');
      return;
    }
    
    // Map pathname to AppState
    if (location.startsWith('/meeting-room/')) {
      console.log('🔄 Detected meeting room route, updating state');
      const id = location.split('/meeting-room/')[1]?.split('?')[0]; // Remove query params
      setMeetingId(id);
      setCurrentState('meeting-room');
      navigateToPage('meeting-room', 'instant');
    } else if (location.startsWith('/teacher-meeting-detail/')) {
      console.log('🔄 Detected teacher meeting detail route, updating state');
      const id = location.split('/teacher-meeting-detail/')[1]?.split('?')[0]; // Remove query params
      setMeetingId(id);
      setCurrentState('teacher-meeting-detail');
      navigateToPage('teacher-meeting-detail', 'instant');
    } else if (location === '/teacher-meetings') {
      console.log('🔄 Detected teacher meetings route, updating state');
      setCurrentState('teacher-meetings');
      navigateToPage('teacher-meetings', 'instant');
    } else if (location === '/teacher-apply/verify' || location.startsWith('/teacher-apply/verify?')) {
      console.log('🔄 Detected email verification route, updating state');
      setCurrentState('teacher-apply-verify');
      navigateToPage('teacher-apply-verify', 'instant');
    } else if (location === '/teacher-dashboard') {
      setCurrentState('teacher-dashboard');
      navigateToPage('teacher-dashboard', 'instant');
    } else if (location === '/student-dashboard') {
      setCurrentState('student-dashboard');
      navigateToPage('student-dashboard', 'instant');
    } else if (location === '/about') {
      console.log('🔄 Detected about route, updating state');
      setCurrentState('about');
      navigateToPage('about', 'instant');
    } else if (location === '/contact') {
      console.log('🔄 Detected contact route, updating state');
      setCurrentState('contact');
      navigateToPage('contact', 'instant');
    } else if (location === '/help') {
      console.log('🔄 Detected help route, updating state');
      setCurrentState('help');
      navigateToPage('help', 'instant');
    } else if (location === '/privacy-policy') {
      console.log('🔄 Detected privacy policy route, updating state');
      setCurrentState('privacy-policy');
      navigateToPage('privacy-policy', 'instant');
    } else if (location === '/terms-and-conditions') {
      console.log('🔄 Detected terms route, updating state');
      setCurrentState('terms');
      navigateToPage('terms', 'instant');
    } else if (location === '/marketplace') {
      console.log('🔄 Detected marketplace route, updating state');
      setCurrentState('portfolio-gallery');
      navigateToPage('portfolio-gallery', 'instant');
    } else if (location === '/courses') {
      console.log('🔄 Detected courses route, updating state');
      setCurrentState('course-browse');
      navigateToPage('course-browse', 'instant');
    } else if (location === '/apply/teacher' || location === '/teacher-signup-basic') {
      console.log('🔄 Detected teacher signup basic route, updating state');
      setCurrentState('teacher-signup-basic');
      navigateToPage('teacher-signup-basic', 'instant');
    } else if (location === '/apply/freelancer' || location === '/freelancer-signup-basic') {
      console.log('🔄 Detected freelancer signup basic route, updating state');
      setCurrentState('freelancer-signup-basic');
      navigateToPage('freelancer-signup-basic', 'instant');
    } else if (location === '/teacher-signup') {
      console.log('🔄 Detected teacher signup route, updating state');
      setCurrentState('teacher-signup');
      navigateToPage('teacher-signup', 'instant');
    } else if (location === '/freelancer-signup') {
      console.log('🔄 Detected freelancer signup route, updating state');
      setCurrentState('freelancer-signup');
      navigateToPage('freelancer-signup', 'instant');
    } else if (location === '/checkout/voucher' || location.startsWith('/checkout/voucher?')) {
      console.log('🔄 Detected voucher checkout route, updating state');
      setCurrentState('buy-voucher');
      navigateToPage('buy-voucher', 'instant');
    } else if (location === '/404') {
      console.log('🔄 Detected 404 route, updating state');
      setCurrentState('not-found');
      navigateToPage('not-found', 'instant');
    } else if (location === '/403') {
      // Silent redirect - don't show access denied, redirect to home instead
      console.log('🔄 Detected 403 route, redirecting to home silently');
      navigate('/');
      setCurrentState('home');
      navigateToPage('home', 'instant');
    }
    // Note: Don't force navigation back to home for "/" - the app uses state-based routing
    // Many pages share the "/" URL and use query params or internal state
    // Add more route mappings as needed
  }, [location, urlSearch, navigateToPage]);

  // Optimized auto-routing - only redirects when absolutely necessary
  useEffect(() => {
    console.log('🔄 Auto-routing check - loading:', loading, 'user:', !!user, 'profile:', !!profile, 'currentState:', currentState);
    
    // Check if user intentionally logged out - if so, skip auto-routing to dashboard
    // This allows users to stay on landing/public pages after logout
    const intentionalLogout = localStorage.getItem('intentional_logout');
    if (intentionalLogout === 'true') {
      console.log('🔄 Skipping auto-routing - user intentionally logged out');
      return;
    }
    
    // Check if user clicked logo to navigate home - skip auto-routing while on home
    const forceHome = localStorage.getItem('force_home_navigation');
    if (forceHome === 'true') {
      if (currentState === 'home') {
        console.log('🔄 Skipping auto-routing - user clicked logo to go home');
        return;
      } else {
        // User navigated away from home, clear the flag
        localStorage.removeItem('force_home_navigation');
      }
    }
    
    if (!loading && user && profile) {
      // User logged in successfully - clear the intentional logout flag
      localStorage.removeItem('intentional_logout');
      
      console.log('🔄 Auto-routing check - User role:', profile.role);
      
      // Define public pages that customers can access while logged in
      const publicPages = ["home", "about", "help", "contact", "privacy", "terms", "blog",
                          "chat-terms", "course-browse", "course-detail", "course-player", "claim-certificate", "product-shop", 
                          "product-detail", "cart", "portfolio-gallery", "portfolio-preview", "freelancer-profile",
                          "advertise-with-us", "banner-creator", "banner-payment", "freelancer-checkout", "checkout",
                          "customer-pricing", "creator-pricing", "education-pricing", "privacy-policy"];
      
      // Check if trying to access wrong dashboard
      const wrongDashboardAccess = 
        (currentState === "admin-dashboard" && !["admin", "accountant", "customer_service"].includes(profile.role)) ||
        (currentState === "teacher-dashboard" && profile.role !== "teacher") ||
        (currentState === "freelancer-dashboard" && profile.role !== "freelancer") ||
        (currentState === "customer-dashboard" && profile.role !== "general") ||
        (currentState === "student-dashboard" && ["admin", "teacher", "freelancer", "general", "accountant", "customer_service"].includes(profile.role));
      
      console.log('🔒 Wrong dashboard access check:', wrongDashboardAccess, 'for', profile.role, 'on', currentState);
      
      // Only auto-redirect when on auth pages OR accessing wrong dashboard
      // Allow authenticated users to freely explore the home page and other public pages
      // Only redirect from auth pages (login/signup) to dashboard after login
      const shouldAutoRoute = currentState === "auth" || wrongDashboardAccess;
      
      if (shouldAutoRoute) {
        console.log('🔄 Current state requires auto-routing:', currentState);
        
        // Route to appropriate dashboard based on role FIRST (before survey check)
        // Teachers and freelancers should NOT see the student survey
        if (["admin", "accountant", "customer_service"].includes(profile.role) && currentState !== "admin-dashboard") {
          console.log('🔀 Redirecting', profile.role, 'to admin dashboard');
          navigateToPage("admin-dashboard", 'instant');
          setCurrentState("admin-dashboard");
          return;
        } else if (profile.role === "teacher") {
          // Teachers go to their dashboard (wrapper component checks application status)
          // The TeacherDashboardWithStatusCheck component will:
          // - Redirect to signup if application is incomplete
          // - Show TeacherDashboardPending if pending/under_review/rejected
          // - Show TeacherDashboard if approved
          if (currentState !== "teacher-dashboard" && currentState !== "teacher-signup" && currentState !== "teacher-application-status") {
            console.log('🔀 Redirecting teacher to teacher dashboard (status check handled by wrapper)');
            navigateToPage("teacher-dashboard", 'instant');
            setCurrentState("teacher-dashboard");
          }
          return;
        } else if (profile.role === "freelancer") {
          // Freelancers go to their dashboard (wrapper component checks application status)
          // The FreelancerDashboardWithStatusCheck component will:
          // - Redirect to signup if application is incomplete
          // - Show FreelancerDashboardPending if pending/under_review/rejected
          // - Show FreelancerDashboard if approved
          if (currentState !== "freelancer-dashboard" && currentState !== "freelancer-signup" && currentState !== "freelancer-application-status") {
            console.log('🔀 Redirecting freelancer to freelancer dashboard (status check handled by wrapper)');
            navigateToPage("freelancer-dashboard", 'instant');
            setCurrentState("freelancer-dashboard");
          }
          return;
        }
        
        // Survey check only for students/users - NOT teachers, freelancers, or general customers
        const isStudentRole = profile.role === "student" || profile.role === "user";
        const needsSurvey = isStudentRole && (!profile.country || !profile.educationLevel || !profile.pronouns);
        
        if (needsSurvey && currentState !== "survey") {
          console.log('🔀 Redirecting to survey');
          setCurrentState("survey");
          return;
        }
        
        if (profile.role === "general" && currentState !== "customer-dashboard") {
          console.log('🔀 Redirecting customer (general role) to customer dashboard');
          navigateToPage("customer-dashboard", 'instant');
          setCurrentState("customer-dashboard");
          return;
        } else if ((profile.role === "student" || profile.role === "user") && currentState !== "student-dashboard") {
          console.log('🔀 Redirecting student/user to student dashboard');
          navigateToPage("student-dashboard", 'instant');
          setCurrentState("student-dashboard");
        }
      } else {
        console.log('🔄 Current state does not require auto-routing:', currentState);
      }
    } else {
      console.log('🔄 Auto-routing conditions not met - loading:', loading, 'user exists:', !!user, 'profile exists:', !!profile);
    }
  }, [user, profile, loading, currentState, teacherApplicationStatus, freelancerApplicationStatus]);

  // Handle URL parameters and hash on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    
    // Handle reset password route
    if (window.location.pathname === '/reset-password' || pageParam === 'reset-password') {
      setCurrentState('reset-password');
      return;
    }

    // Handle payment success route
    if (window.location.pathname === '/payment-success' || pageParam === 'payment-success') {
      setCurrentState('payment-success');
      return;
    }
    
    // Handle teacher meeting detail route (with dynamic ID)
    if (window.location.pathname.startsWith('/teacher-meeting-detail') || pageParam === 'teacher-meeting-detail') {
      setCurrentState('teacher-meeting-detail');
      return;
    }
    
    // Handle teacher meetings route
    if (window.location.pathname === '/teacher-meetings' || pageParam === 'teacher-meetings') {
      setCurrentState('teacher-meetings');
      return;
    }

  }, []);

  const handleLogin = async () => {
    console.log('🚀 handleLogin CALLED - User logged in successfully');
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Helper function to navigate based on role
    const navigateToRoleDashboard = (userRole: string | undefined) => {
      console.log('🔄 handleLogin - profile role:', userRole);
      
      let targetPath = '/student-dashboard';
      let targetState: AppState = 'student-dashboard';
      
      if (userRole === 'admin' || userRole === 'accountant' || userRole === 'customer_service') {
        targetPath = '/admin-dashboard';
        targetState = 'admin-dashboard';
      } else if (userRole === 'teacher') {
        targetPath = '/teacher-dashboard';
        targetState = 'teacher-dashboard';
      } else if (userRole === 'freelancer') {
        targetPath = '/freelancer-dashboard';
        targetState = 'freelancer-dashboard';
      } else if (userRole === 'general') {
        targetPath = '/customer-dashboard';
        targetState = 'customer-dashboard';
      }
      
      console.log('🔀 handleLogin - Navigating to:', targetPath, 'state:', targetState);
      navigate(targetPath);
      setCurrentState(targetState);
      navigateToPage(targetState, 'instant');
    };
    
    // First try to get role from current profile state
    let userRole = profile?.role;
    
    // If profile not available, try localStorage fallback
    if (!userRole) {
      const storedRole = localStorage.getItem('tempProfileRole');
      if (storedRole) {
        userRole = storedRole;
        localStorage.removeItem('tempProfileRole');
      }
    }
    
    // If we have the role, navigate immediately
    if (userRole) {
      navigateToRoleDashboard(userRole);
      return;
    }
    
    // Otherwise, refresh auth and wait for profile
    console.log('🔄 handleLogin - No role found, refreshing auth...');
    try {
      await refreshAuth();
      
      // Give React a moment to update state, then check again
      setTimeout(() => {
        let finalRole = profile?.role;
        if (!finalRole) {
          const storedRole = localStorage.getItem('tempProfileRole');
          if (storedRole) {
            finalRole = storedRole;
            localStorage.removeItem('tempProfileRole');
          }
        }
        navigateToRoleDashboard(finalRole);
      }, 300);
    } catch (error) {
      console.error('🔴 handleLogin - Failed to refresh auth:', error);
      // Fallback to student dashboard
      navigateToRoleDashboard('student');
    }
  };

  const handleLogout = async () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setShowLogoutAnimation(true);
  };

  const completeLogout = async () => {
    await logout();
    
    setShowLogoutAnimation(false);
    setCurrentState("auth");
  };

  const handleSettings = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setCurrentState("settings");
  };

  const handleProfile = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    // All users stay on home page for now
    setCurrentState("home");
  };


  const handleBackToDashboard = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    // All users return to home page - instant transition
    navigateToPage("home", 'instant');
    setCurrentState("home");
  };

  const handleSurveyComplete = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    // After survey, go directly to appropriate dashboard based on role - skip pricing
    if (["admin", "accountant", "customer_service"].includes(profile?.role || "")) {
      navigateToPage("admin-dashboard", 'fade');
      setCurrentState("admin-dashboard");
    } else if (profile?.role === "teacher") {
      navigateToPage("teacher-dashboard", 'fade');
      setCurrentState("teacher-dashboard");
    } else {
      // All other users (students, users, etc.) go to student dashboard
      navigateToPage("student-dashboard", 'fade');
      setCurrentState("student-dashboard");
    }
  };


  const handleNavigation = (page: string, customTransition?: string, data?: any) => {
    console.log('🚀 handleNavigation called with page:', page);
    let transition = customTransition || 'fade';
    let finalPage = page;
    
    // Handle 'back' navigation - route to appropriate dashboard based on role and current page
    if (page === 'back') {
      // Navigate to appropriate dashboard based on user role
      if (profile?.role === 'admin' || profile?.role === 'accountant' || profile?.role === 'customer_service' || profile?.role === 'moderator') {
        finalPage = 'admin-dashboard';
      } else if (profile?.role === 'teacher') {
        finalPage = 'teacher-dashboard';
      } else {
        finalPage = 'student-dashboard';
      }
      transition = 'slide-right';
    }
    // Handle meeting room routes
    else if (page.startsWith('meeting-room/')) {
      const meetingIdFromPage = page.split('meeting-room/')[1];
      setMeetingId(meetingIdFromPage);
      finalPage = 'meeting-room';
    }
    // Handle teacher meeting detail routes
    else if (page.startsWith('teacher-meeting-detail/')) {
      const meetingIdFromPage = page.split('teacher-meeting-detail/')[1];
      setMeetingId(meetingIdFromPage);
      finalPage = 'teacher-meeting-detail';
    }
    // Handle dynamic product routes
    else if (page.startsWith('product/')) {
      const productId = page.replace('product/', '');
      finalPage = 'product-detail';
      // Store productId for later URL update
      if (!data) data = {};
      data.productId = productId;
    } else if (page === 'products') {
      finalPage = 'product-shop';
    }
    // Handle dynamic course routes - use state-based navigation (like dashboards)
    else if (page.startsWith('course-detail-')) {
      const courseIdFromPage = page.replace('course-detail-', '');
      setCourseId(courseIdFromPage);
      finalPage = 'course-detail';
    } else if (page.startsWith('course-player-')) {
      const courseIdFromPage = page.replace('course-player-', '');
      setCourseId(courseIdFromPage);
      finalPage = 'course-player';
    } else if (page.startsWith('claim-certificate-')) {
      const courseIdFromPage = page.replace('claim-certificate-', '');
      setCourseId(courseIdFromPage);
      finalPage = 'claim-certificate';
    } else if (page === 'course-browse') {
      finalPage = 'course-browse';
    } else if (page.startsWith('blog-post-')) {
      // Handle blog post navigation like course detail (pure state-based, no URL change)
      const slugFromPage = page.replace('blog-post-', '');
      console.log('📝 Blog post navigation - slug:', slugFromPage);
      setBlogSlug(slugFromPage);
      finalPage = 'blog-post-detail';
      console.log('📝 Blog post navigation - finalPage set to:', finalPage);
    } else if (page === 'blog') {
      // Clear blog slug when going to blog list
      setBlogSlug(null);
      finalPage = 'blog';
    } else if (page.startsWith('verify-certificate-')) {
      const code = page.replace('verify-certificate-', '');
      finalPage = 'verify-certificate';
      // Set URL parameter for code
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'verify-certificate');
      url.searchParams.set('code', code);
      window.history.pushState({}, '', url.toString());
    }
    
    // If checkout data is provided, store it
    if (finalPage === 'checkout' && data) {
      setCheckoutDetails(data);
    }
    
    // If category detail navigation with categoryId, store it
    if (finalPage === 'category-detail' && data?.categoryId) {
      setSelectedCategoryId(data.categoryId);
    }
    
    // Product detail URL handling moved to updateUrlForNavigation()
    
    // If freelancer dashboard navigation with tab, store it
    if (finalPage === 'freelancer-dashboard' && data?.tab) {
      setFreelancerDashboardTab(data.tab);
    }
    
    // Portfolio preview, edit, and create URL handling moved to updateUrlForNavigation()
    
    // Clear blog slug when navigating away from blog-post-detail
    if (finalPage !== 'blog-post-detail' && currentState === 'blog-post-detail') {
      setBlogSlug(null);
    }
    
    if (!customTransition) {
      if (finalPage === 'auth') {
        transition = 'scale';
      } else if (finalPage === 'premium') {
        transition = 'slide-right';
      } else if (finalPage === 'help' || finalPage === 'contact' || finalPage === 'learn-more') {
        transition = 'slide-left';
      } else if (finalPage.includes('dashboard') || finalPage === 'home' || finalPage === 'course-browse') {
        transition = 'instant'; // Make dashboard, home, and course browse navigation instant
      }
    }
    
    // Update URL to clean paths for shareable public pages
    const updateUrlForNavigation = () => {
      // Dynamic routes with parameters
      if (finalPage === 'blog-post-detail' && (data?.slug || page.startsWith('blog-post-'))) {
        const slug = data?.slug || page.replace('blog-post-', '');
        window.history.pushState({}, '', `/blog/${slug}`);
        return;
      }
      if (finalPage === 'course-detail' && (data?.courseId || courseId || page.startsWith('course-detail-'))) {
        const id = data?.courseId || (page.startsWith('course-detail-') ? page.replace('course-detail-', '') : courseId);
        if (id) window.history.pushState({}, '', `/course/${id}`);
        return;
      }
      if (finalPage === 'course-player' && (data?.courseId || courseId || page.startsWith('course-player-'))) {
        const id = data?.courseId || (page.startsWith('course-player-') ? page.replace('course-player-', '') : courseId);
        if (id) window.history.pushState({}, '', `/course-player/${id}`);
        return;
      }
      if (finalPage === 'product-detail' && data?.productId) {
        window.history.pushState({}, '', `/product/${data.productId}`);
        return;
      }
      if (finalPage === 'portfolio-preview' && data?.workId) {
        window.history.pushState({}, '', `/portfolio/${data.workId}`);
        return;
      }
      if (finalPage === 'portfolio-edit' && data?.workId) {
        const url = new URL(window.location.origin);
        url.searchParams.set('page', 'portfolio-edit');
        url.searchParams.set('workId', data.workId);
        window.history.pushState({}, '', url.toString());
        return;
      }
      if (finalPage === 'portfolio-create') {
        const url = new URL(window.location.origin);
        url.searchParams.set('page', 'portfolio-create');
        // Explicitly clear stale params that shouldn't carry over
        url.searchParams.delete('workId');
        url.searchParams.delete('commentId');
        window.history.pushState({}, '', url.toString());
        return;
      }
      if (finalPage === 'freelancer-profile' && data?.freelancerId) {
        window.history.pushState({}, '', `/freelancer/${data.freelancerId}`);
        return;
      }
      if (finalPage === 'meeting-room' && meetingId) {
        window.history.pushState({}, '', `/meeting-room/${meetingId}`);
        return;
      }
      if (finalPage === 'claim-certificate' && (data?.courseId || courseId)) {
        const id = data?.courseId || courseId;
        if (id) window.history.pushState({}, '', `/claim-certificate/${id}`);
        return;
      }
      
      // Static clean URL routes (non-dashboard public pages)
      const cleanPath = STATE_TO_PATH[finalPage];
      if (cleanPath) {
        window.history.pushState({}, '', cleanPath);
        return;
      }
      
      // Dashboard and other routes use query params (backwards compatibility)
      // Preserve existing query params and selectively merge known URL params
      if (finalPage !== 'home') {
        const url = new URL(window.location.href);
        url.searchParams.set('page', finalPage);
        
        // Clear transient params that shouldn't persist across navigation
        // unless explicitly provided in data
        const transientParams = ['commentId'];
        transientParams.forEach(param => {
          if (!data?.[param]) {
            url.searchParams.delete(param);
          }
        });
        
        // Only merge known URL-safe params from data (avoid serializing complex objects)
        const knownUrlParams = ['applicationId', 'workId', 'productId', 'courseId', 'code', 'categoryId', 'commentId', 'tab'];
        if (data) {
          knownUrlParams.forEach(param => {
            if (data[param] !== undefined && data[param] !== null) {
              url.searchParams.set(param, String(data[param]));
            }
          });
        }
        
        window.history.pushState({}, '', url.toString());
      }
    };
    
    updateUrlForNavigation();
    
    navigateToPage(finalPage, transition as any);
    setCurrentState(finalPage as AppState);
  };

  const renderPage = () => {
    // Check if user has a stored session (likely logged in)
    const hasStoredSession = typeof window !== 'undefined' && localStorage.getItem('sessionId');
    const intentionalLogout = typeof window !== 'undefined' && localStorage.getItem('intentional_logout') === 'true';
    
    // MOBILE APP RULE: If on /app path with session, ALWAYS show loading while auth verifies
    // Never show home/auth/login pages to logged-in mobile users
    const isAppPath = () => {
      if (typeof window === 'undefined') return false;
      const pathname = window.location.pathname.toLowerCase();
      return pathname === '/app' || pathname.startsWith('/app/') || pathname.startsWith('/app?');
    };
    
    const isCordovaAppUser = isInCordovaApp() && hasStoredSession && isAppPath();
    if (isCordovaAppUser && (loading || !intentionalLogout)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      );
    }
    
    // For ALL users with a session: show loading screen while auth is being validated
    // This prevents the flash of landing page before redirect to dashboard on ANY domain
    // Skip this if user intentionally logged out (they should see the landing page)
    if (loading && hasStoredSession && !intentionalLogout && LANDING_ONLY_PAGES.includes(currentState)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      );
    }
    
    // If on auth-only domain (edufiliova.click), show auth page for home
    if (isAuthOnlyDomain && currentState === "home") {
      return (
        <PageTransition 
          isActive={true} 
          transitionType={transitionType} 
          isTransitioning={isTransitioning}
          isExiting={isExiting}
        >
          <AuthModern onLogin={handleLogin} onNavigate={handleNavigation} hideSkipButton={true} />
        </PageTransition>
      );
    }
    
    // Protected states that require auth - show loading screen while auth is being validated
    // Note: teacher-dashboard removed to prevent loading screen - it handles its own loading state
    const protectedStates = [
      "student-dashboard", "admin-dashboard", "admin-showcase-dashboard", 
      "admin-email-management", "admin-email-campaigns", "admin-email-inbox",
      "admin-blog-management", "admin-course-management", "admin-contact-messages",
      "admin-applications-management", "admin-subject-approval", "admin-payout-management",
      "teacher-meetings", "teacher-meeting-detail", "teacher-meetings-schedule",
      "freelancer-dashboard", "customer-dashboard", "creator-earnings-dashboard",
      "settings", "subscribe", "survey", "transaction-dashboard", "payment-success",
      "my-certificates", "student-meetings", "course-creator", "subject-creator",
      "logo-management", "banner-creator", "banner-payment", "category-management",
      "category-detail", "product-creation", "coupon-management", "portfolio-create",
      "portfolio-edit", "course-player"
    ];
    
    // Show loading screen for protected pages while auth is validating
    // This prevents the flash of login screen when user is already logged in
    if (loading && protectedStates.includes(currentState)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
          </div>
        </div>
      );
    }
    
    // When user logs out from a protected page, redirect to auth page
    if (!loading && !user && protectedStates.includes(currentState)) {
      navigateToPage('auth', 'instant');
      setCurrentState('auth');
      localStorage.removeItem('intentional_logout');
      return null;
    }
    
    switch (currentState) {
      case "home":
        // Check if user intentionally clicked logo to go home
        const intentionallyWentHome = localStorage.getItem('force_home_navigation') === 'true';
        
        // Clear the flag once we've checked it
        if (intentionallyWentHome) {
          localStorage.removeItem('force_home_navigation');
        }
        
        // Show home page
        return (
          <PageTransition 
            isActive={currentPage === "home"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <LandingPage onNavigate={handleNavigation} />
          </PageTransition>
        );
      
      case "premium":
        return (
          <PageTransition 
            isActive={currentPage === "premium"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <PremiumPage onNavigate={handleNavigation} />
          </PageTransition>
        );
      
      case "contact":
        return (
          <PageTransition 
            isActive={currentPage === "contact"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <ContactPage onNavigate={handleNavigation} />
          </PageTransition>
        );
      
      case "about":
        return (
          <PageTransition 
            isActive={currentPage === "about"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <AboutPage onNavigate={handleNavigation} />
          </PageTransition>
        );
      
      case "help":
        return (
          <PageTransition 
            isActive={currentPage === "help"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <HelpCenter onNavigate={handleNavigation} />
          </PageTransition>
        );
      
      case "privacy":
        return (
          <PageTransition 
            isActive={currentPage === "privacy"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <PrivacyPolicyPage onNavigate={handleNavigation} />
          </PageTransition>
        );
      
      case "terms":
        return (
          <PageTransition 
            isActive={currentPage === "terms"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <TermsPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "student-terms":
        return (
          <PageTransition 
            isActive={currentPage === "student-terms"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <StudentTermsPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "teacher-terms":
        return (
          <PageTransition 
            isActive={currentPage === "teacher-terms"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <TeacherTermsPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "school-terms":
        return (
          <PageTransition 
            isActive={currentPage === "school-terms"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <SchoolInstitutionTermsPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "refund-policy":
        return (
          <PageTransition 
            isActive={currentPage === "refund-policy"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <RefundPolicyPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "privacy-policy":
        return (
          <PageTransition 
            isActive={currentPage === "privacy-policy"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <PrivacyPolicyPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "cookies-policy":
        return (
          <PageTransition 
            isActive={currentPage === "cookies-policy"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <CookiesPolicyPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "chat-terms":
        return (
          <PageTransition 
            isActive={currentPage === "chat-terms"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <ChatTermsPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "whatsapp-policy":
        return (
          <PageTransition 
            isActive={currentPage === "whatsapp-policy"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <WhatsAppPolicyPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "data-retention":
        return (
          <PageTransition 
            isActive={currentPage === "data-retention"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <DataRetentionPolicyPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "community-guidelines":
        return (
          <PageTransition 
            isActive={currentPage === "community-guidelines"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <CommunityGuidelinesPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "copyright-dmca":
        return (
          <PageTransition 
            isActive={currentPage === "copyright-dmca"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <CopyrightDMCAPolicyPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "payment-billing":
        return (
          <PageTransition 
            isActive={currentPage === "payment-billing"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <PaymentBillingPolicyPage onNavigate={handleNavigation} />
          </PageTransition>
        );
    
      case "auth":
        return (
          <PageTransition 
            isActive={currentPage === "auth"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <AuthModern onLogin={handleLogin} onNavigate={handleNavigation} />
          </PageTransition>
        );
    
      case "student-signup":
        return <div className="page-transition"><AuthModern onLogin={handleLogin} onNavigate={handleNavigation} userType="student" /></div>;
    
      case "creator-signup":
        return <div className="page-transition"><AuthModern onLogin={handleLogin} onNavigate={handleNavigation} userType="teacher" /></div>;
    
      case "teacher-login":
        return <div className="page-transition"><TeacherLogin onLogin={handleLogin} onNavigate={handleNavigation} /></div>;
    
      case "freelancer-login":
        return <div className="page-transition"><AuthModern onLogin={handleLogin} onNavigate={handleNavigation} userType="freelancer" /></div>;
    
      case "settings":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return <div className="page-transition"><StudySettings onBack={handleBackToDashboard} /></div>;
    





      case "subscribe":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="page-transition">
            <Subscribe onNavigate={handleNavigation} />
          </div>
        );

      case "checkout":
        return (
          <div className="page-transition">
            <Checkout
              amount={checkoutDetails.amount}
              courseName={checkoutDetails.courseName || checkoutDetails.planName}
              courseId={checkoutDetails.planName?.toLowerCase().replace(/\s+/g, '-') || 'plan'}
              clientSecret={checkoutDetails.clientSecret}
              planName={checkoutDetails.planName}
              billingCycle={checkoutDetails.billingCycle}
              orderData={checkoutDetails.orderData}
              onSuccess={() => handleNavigation("payment-success", "instant")}
              onCancel={() => handleNavigation(checkoutDetails.orderData ? "cart" : "premium")}
            />
          </div>
        );

      case "learn-more":
        return (
          <PageTransition 
            isActive={currentPage === "learn-more"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <LearnMorePage onNavigate={handleNavigation} />
          </PageTransition>
        );


      case "reset-password":
        return (
          <div className="page-transition">
            <ResetPassword />
          </div>
        );

      case "student-dashboard":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="instant-transition">
            <StudentDashboard onNavigate={handleNavigation} />
          </div>
        );

      case "survey":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="page-transition">
            <Survey onComplete={handleSurveyComplete} userId={user.id} />
          </div>
        );

      case "customer-pricing":
        return (
          <PageTransition 
            isActive={currentPage === "customer-pricing"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <CustomerPricingPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "creator-pricing":
        return (
          <PageTransition 
            isActive={currentPage === "creator-pricing"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <CreatorPricingPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "education-pricing":
        return (
          <PageTransition 
            isActive={currentPage === "education-pricing"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <EducationPricingPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "teacher-pricing":
        return (
          <PageTransition 
            isActive={currentPage === "teacher-pricing"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <TeacherPricingPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "admin-dashboard":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["admin", "accountant", "customer_service"].includes(profile.role)) {
          console.log('❌ Access denied - User does not have admin/accountant/customer_service role');
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <AdminPaymentDashboard onNavigate={handleNavigation} />
          </div>
        );

      case "admin-payout-management":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["admin", "accountant", "customer_service"].includes(profile.role)) {
          console.log('❌ Access denied - User does not have admin/accountant/customer_service role');
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <AdminPayoutManagement />
          </div>
        );

      case "admin-showcase-dashboard":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="instant-transition">
            <AdminShowcaseDashboard />
          </div>
        );

      case "admin-email-management":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["admin", "moderator"].includes(profile.role)) {
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <AdminEmailManagement onNavigate={handleNavigation} />
          </div>
        );

      case "admin-email-campaigns":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["admin", "moderator"].includes(profile.role)) {
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <AdminEmailCampaigns onNavigate={handleNavigation} />
          </div>
        );

      case "admin-email-inbox":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["admin", "moderator", "customer_service"].includes(profile.role)) {
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <EnhancedEmailInbox onNavigate={handleNavigation} />
          </div>
        );

      case "admin-blog-management":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["admin", "moderator"].includes(profile.role)) {
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <Header onNavigate={handleNavigation} currentPage={currentState} />
            <AdminBlogManagement />
          </div>
        );

      case "admin-course-management":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["admin", "moderator"].includes(profile.role)) {
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <Header onNavigate={handleNavigation} currentPage={currentState} />
            <AdminCourseManagement />
          </div>
        );

      case "admin-contact-messages":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["admin", "moderator", "customer_service"].includes(profile.role)) {
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <Header onNavigate={handleNavigation} currentPage={currentState} />
            <AdminContactMessages onNavigate={handleNavigation} />
          </div>
        );

      case "admin-applications-management":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["admin", "moderator"].includes(profile.role)) {
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <AdminApplicationsManagement onNavigate={handleNavigation} />
          </div>
        );

      case "admin-subject-approval":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["admin", "moderator"].includes(profile.role)) {
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <AdminSubjectApproval onNavigate={handleNavigation} />
          </div>
        );

      case "blog":
        return (
          <div className="page-transition">
            <Header onNavigate={handleNavigation} currentPage={currentState} />
            <BlogPage onNavigate={handleNavigation} />
          </div>
        );

      case "blog-post-detail":
        return (
          <div className="page-transition">
            <Header onNavigate={handleNavigation} currentPage={currentState} />
            <BlogPostDetail onNavigate={handleNavigation} slug={blogSlug} />
          </div>
        );

      case "networking":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="page-transition">
            <StudentNetworking />
          </div>
        );

      case "community":
        return (
          <div className="page-transition">
            <PortfolioNavigation onNavigate={handleNavigation} />
            <FindTalent onNavigate={handleNavigation} />
          </div>
        );

      case "payment-success":
        return (
          <div className="page-transition">
            <PaymentSuccess onNavigate={handleNavigation} />
          </div>
        );

      case "transaction-dashboard":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="page-transition">
            <TransactionDashboard />
          </div>
        );

      case "teacher-dashboard":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && profile.role !== "teacher") {
          console.log('❌ Access denied - User is not a teacher');
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <TeacherDashboardWithStatusCheck onNavigate={handleNavigation} userId={user.id} />
          </div>
        );

      case "teacher-meetings":
      case "teacher-meetings-schedule":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && profile.role !== "teacher") {
          console.log('❌ Access denied - User is not a teacher');
          handleNavigation("customer-dashboard");
          return <div className="page-transition">Redirecting...</div>;
        }
        handleNavigation("teacher-dashboard");
        return <div className="instant-transition">Redirecting to dashboard...</div>;

      case "teacher-meeting-detail":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && profile.role !== "teacher") {
          console.log('❌ Access denied - User is not a teacher');
          handleNavigation("customer-dashboard");
          return <div className="page-transition">Redirecting...</div>;
        }
        return (
          <div className="page-transition">
            <TeacherMeetingDetail meetingId={meetingId} />
          </div>
        );

      case "student-meetings":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && profile.role !== "student") {
          console.log('❌ Access denied - User is not a student');
          handleNavigation("customer-dashboard");
          return <div className="page-transition">Redirecting...</div>;
        }
        return (
          <div className="page-transition">
            <StudentMeetings />
          </div>
        );

      case "meeting-room":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        console.log('🎥 Rendering meeting room with meetingId:', meetingId);
        if (!meetingId) {
          console.error('❌ Missing meetingId for meeting room');
          handleNavigation("teacher-meetings");
          return <div className="instant-transition">Redirecting to meetings...</div>;
        }
        return (
          <div className="instant-transition">
            <MeetingRoom meetingId={meetingId} />
          </div>
        );

      case "freelancer-dashboard":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && profile.role !== "freelancer") {
          console.log('❌ Access denied - User is not a freelancer');
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <FreelancerDashboardWithStatusCheck onNavigate={handleNavigation} initialTab={freelancerDashboardTab} userId={user.id} />
          </div>
        );

      case "creator-earnings-dashboard":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        if (profile && !["freelancer", "teacher"].includes(profile.role)) {
          console.log('❌ Access denied - User is not a creator (freelancer/teacher)');
          handleNavigation("customer-dashboard");
          return <div className="instant-transition">Redirecting...</div>;
        }
        return (
          <div className="instant-transition">
            <CreatorEarningsDashboard />
          </div>
        );

      case "freelancer-signup-basic":
        return (
          <PageTransition 
            isActive={currentPage === "freelancer-signup-basic"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <FreelancerSignupBasic onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "freelancer-signup":
        return (
          <PageTransition 
            isActive={currentPage === "freelancer-signup"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <FreelancerSignup onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "freelancer-application-status":
        // If user is logged in as freelancer, show the pending dashboard
        if (user && profile?.role === 'freelancer') {
          return (
            <div className="instant-transition">
              <FreelancerDashboardPending onNavigate={handleNavigation} />
            </div>
          );
        }
        // Otherwise show the public application status page
        return (
          <PageTransition 
            isActive={currentPage === "freelancer-application-status"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <FreelancerApplicationStatus />
          </PageTransition>
        );

      case "teacher-application":
        return (
          <PageTransition 
            isActive={currentPage === "teacher-application"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <Header onNavigate={handleNavigation} currentPage={currentState} />
            <BecomeTeacherPage onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "teacher-signup-basic":
        return (
          <PageTransition 
            isActive={currentPage === "teacher-signup-basic"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <TeacherSignupBasic onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "teacher-signup":
        return (
          <PageTransition 
            isActive={currentPage === "teacher-signup"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <TeacherSignup />
          </PageTransition>
        );

      case "teacher-verify-email":
      case "teacher-apply-verify":
        return (
          <PageTransition 
            isActive={currentState === "teacher-verify-email" || currentState === "teacher-apply-verify"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <VerifyTeacherEmail />
          </PageTransition>
        );

      case "teacher-application-status":
        return (
          <PageTransition 
            isActive={currentPage === "teacher-application-status"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <TeacherApplicationStatus />
          </PageTransition>
        );

      case "shop-auth":
        return (
          <PageTransition 
            isActive={currentPage === "shop-auth"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <ShopAuth onNavigate={handleNavigation} />
          </PageTransition>
        );
        
      case "customer-dashboard":
        return (
          <PageTransition 
            isActive={currentPage === "customer-dashboard"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <CustomerDashboard onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "payout-policy":
        return (
          <PageTransition 
            isActive={currentPage === "payout-policy"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <PayoutPolicy onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "logo-management":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="page-transition">
            <LogoManagementPage />
          </div>
        );

      case "advertise-with-us":
        return (
          <PageTransition 
            isActive={currentPage === "advertise-with-us"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <AdvertiseWithUs onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "design-team-contact":
        return (
          <PageTransition 
            isActive={currentPage === "design-team-contact"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <DesignTeamContact onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "banner-creator":
        return (
          <PageTransition 
            isActive={currentPage === "banner-creator"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <BannerCreator onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "banner-payment":
        return (
          <PageTransition 
            isActive={currentPage === "banner-payment"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <BannerPayment onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "education-level-selector":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <PageTransition 
            isActive={currentPage === "education-level-selector"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <EducationLevelSelector 
              onNavigate={handleNavigation}
              userRole={profile?.role || 'student'}
            />
          </PageTransition>
        );

      case "course-creator":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <PageTransition 
            isActive={currentPage === "course-creator"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <CourseCreator 
              onNavigate={handleNavigation}
              userRole={profile?.role || 'student'}
            />
          </PageTransition>
        );

      case "subject-creator":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <PageTransition 
            isActive={currentPage === "subject-creator"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <SubjectCreator 
              onNavigate={handleNavigation}
              userRole={profile?.role || 'student'}
            />
          </PageTransition>
        );

      case "course-browse":
        return (
          <PageTransition 
            isActive={currentPage === "course-browse"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <CourseBrowse onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "course-detail":
        return (
          <PageTransition 
            isActive={currentPage === "course-detail"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <Header onNavigate={handleNavigation} currentPage={currentState} />
            <CourseDetail 
              courseId={courseId || ''}
              onNavigate={handleNavigation} 
              onBack={() => handleNavigation('course-browse')}
            />
          </PageTransition>
        );

      case "course-player":
        return (
          <PageTransition 
            isActive={currentPage === "course-player"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <CoursePlayer 
              courseId={courseId || ''}
              onNavigate={handleNavigation}
            />
          </PageTransition>
        );

      case "claim-certificate":
        return (
          <PageTransition 
            isActive={currentPage === "claim-certificate"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <ClaimCertificate 
              courseId={courseId || ''}
              onNavigate={handleNavigation}
            />
          </PageTransition>
        );


      case "portfolio-gallery":
        return (
          <PageTransition 
            isActive={currentPage === "portfolio-gallery"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <PortfolioGallery onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "portfolio-create":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <PageTransition 
            isActive={currentPage === "portfolio-create"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <PortfolioCreate onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "portfolio-edit":
        if (!user) return <div className="instant-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <PageTransition 
            isActive={currentPage === "portfolio-edit"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <PortfolioCreate onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "portfolio-preview":
        return (
          <PageTransition 
            isActive={currentPage === "portfolio-preview"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <PortfolioPreview onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "freelancer-profile":
        return (
          <PageTransition 
            isActive={currentPage === "freelancer-profile"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <FreelancerProfile onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "product-shop":
        return (
          <PageTransition 
            isActive={currentPage === "product-shop"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <ProductShop 
              onNavigate={handleNavigation} 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </PageTransition>
        );

      case "product-detail":
        return (
          <PageTransition 
            isActive={currentPage === "product-detail"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <ProductDetail 
              onNavigate={handleNavigation}
              productId={window.location.pathname.startsWith('/product/') ? window.location.pathname.replace('/product/', '') : (new URLSearchParams(window.location.search).get('productId') || '')}
            />
          </PageTransition>
        );

      case "cart":
        return (
          <PageTransition 
            isActive={currentPage === "cart"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <Cart onNavigate={handleNavigation} />
          </PageTransition>
        );

      case "category-management":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="page-transition">
            <CategoryManagement />
          </div>
        );

      case "category-detail":
        return (
          <PageTransition 
            isActive={currentPage === "category-detail"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <CategoryDetail 
              categoryId={selectedCategoryId || new URLSearchParams(window.location.search).get('categoryId') || ''}
              onNavigate={handleNavigation} 
            />
          </PageTransition>
        );

      case "product-creation":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="page-transition">
            <ProductCreation onNavigate={handleNavigation} />
          </div>
        );

      case "coupon-management":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="page-transition">
            <CouponManagement />
          </div>
        );

      case "freelancer-checkout":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="page-transition">
            <FreelancerCheckout onNavigate={handleNavigation} />
          </div>
        );

      case "my-certificates":
        if (!user) return <div className="page-transition"><AuthModern onLogin={handleLogin} /></div>;
        return (
          <div className="page-transition">
            <Header onNavigate={handleNavigation} currentPage={currentState} />
            <MyCertificatesPage />
          </div>
        );

      case "verify-certificate":
        return (
          <div className="page-transition">
            <Header onNavigate={handleNavigation} currentPage={currentState} />
            <VerifyCertificatePage />
          </div>
        );

      case "buy-voucher":
        return (
          <PageTransition 
            isActive={currentPage === "buy-voucher"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <Header onNavigate={handleNavigation} currentPage={currentState} />
            <BuyVoucherPage />
          </PageTransition>
        );

      case "not-found":
        return (
          <PageTransition 
            isActive={currentPage === "not-found"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <NotFoundPage onGoHome={() => handleNavigation("home")} />
          </PageTransition>
        );

      case "access-denied":
        // Silent redirect - don't show access denied page, just show home
        // Falls through to default intentionally
      default:
        return (
          <PageTransition 
            isActive={currentPage === "home"} 
            transitionType={transitionType} 
            isTransitioning={isTransitioning}
            isExiting={isExiting}
          >
            <LandingPage onNavigate={handleNavigation} />
          </PageTransition>
        );
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (isAuthOnlyDomain && showOnboarding && !user) {
    return <GetStarted onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      {/* Top Progress Bar for navigation feedback */}
      <TopProgressBar isLoading={isLoading} progress={loadingProgress} />
      
      {/* State-based routing - render based on currentState */}
      {renderPage()}
      
      {showLogoutAnimation && (
        <LogoutAnimation isVisible={showLogoutAnimation} onComplete={completeLogout} />
      )}
    </>
  );
};

export default Index;
