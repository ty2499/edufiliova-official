export type AppState = 
  | "home" | "not-found" | "access-denied" | "auth" 
  | "student-signup" | "creator-signup" | "teacher-login" | "freelancer-login"
  | "teacher-signup-basic" | "teacher-signup" | "teacher-verify-email" | "teacher-verify-code"
  | "teacher-application-status" | "teacher-application"
  | "freelancer-signup-basic" | "freelancer-signup" | "freelancer-application-status"
  | "premium" | "contact" | "design-team-contact" | "privacy" | "terms"
  | "student-terms" | "teacher-terms" | "school-terms" | "refund-policy"
  | "privacy-policy" | "cookies-policy" | "whatsapp-policy" | "data-retention"
  | "copyright-dmca" | "community-guidelines" | "payment-billing" | "chat-terms"
  | "settings" | "about" | "help" | "subscribe" | "checkout" | "learn-more"
  | "reset-password" | "student-dashboard" | "survey"
  | "customer-pricing" | "creator-pricing" | "education-pricing" | "teacher-pricing"
  | "admin-dashboard" | "admin-showcase-dashboard" | "admin-email-management"
  | "admin-email-campaigns" | "admin-email-inbox" | "admin-blog-management"
  | "admin-course-management" | "admin-contact-messages" | "admin-applications-management"
  | "admin-subject-approval"
  | "blog" | "blog-post-detail" | "community" | "networking"
  | "payment-success" | "transaction-dashboard"
  | "teacher-dashboard" | "teacher-meetings" | "teacher-meeting-detail" | "teacher-meetings-schedule"
  | "student-meetings" | "meeting-room"
  | "freelancer-dashboard"
  | "shop-auth" | "customer-dashboard" | "payout-policy" | "logo-management"
  | "advertise-with-us" | "banner-creator" | "banner-payment"
  | "education-level-selector" | "course-creator" | "subject-creator"
  | "course-browse" | "course-detail" | "course-player"
  | "portfolio-gallery" | "portfolio-create" | "portfolio-edit" | "portfolio-preview"
  | "freelancer-profile"
  | "product-shop" | "product-detail" | "cart"
  | "category-management" | "category-detail" | "product-creation" | "coupon-management"
  | "freelancer-checkout" | "my-certificates" | "verify-certificate" | "claim-certificate"
  | "buy-voucher" | "earnings" | "email-verification"
  | string;

export interface RouteConfig {
  path: string;
  state: AppState;
  requiresAuth?: boolean;
  allowedRoles?: string[];
  showHeader?: boolean;
  showFooter?: boolean;
}

export const PATH_TO_STATE: Record<string, AppState> = {
  '/': 'home',
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

export const STATE_TO_PATH: Record<string, string> = {
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

export function getStateFromPath(path: string): AppState {
  if (PATH_TO_STATE[path]) {
    return PATH_TO_STATE[path];
  }

  if (path.startsWith('/meeting-room/')) {
    return 'meeting-room';
  }
  if (path.startsWith('/teacher-meeting-detail/')) {
    return 'teacher-meeting-detail';
  }
  if (path.startsWith('/course/') || path.startsWith('/courses/')) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 2) {
      return 'course-detail';
    }
  }
  if (path.startsWith('/blog/')) {
    return 'blog-post-detail';
  }
  if (path.startsWith('/product/')) {
    return 'product-detail';
  }
  if (path.startsWith('/freelancer/')) {
    return 'freelancer-profile';
  }

  return 'not-found';
}

export function getPathFromState(state: AppState): string {
  return STATE_TO_PATH[state] || '/';
}

export function extractIdFromPath(path: string, prefix: string): string | null {
  if (path.startsWith(prefix)) {
    const id = path.slice(prefix.length).split('?')[0];
    return id || null;
  }
  return null;
}

export function getBlogSlugFromPath(): string | null {
  const path = window.location.pathname;
  if (path.startsWith('/blog/')) {
    return path.slice(6) || null;
  }
  return null;
}

export function getCourseIdFromPath(): string | null {
  const path = window.location.pathname;
  if (path.startsWith('/course/')) {
    return path.slice(8).split('?')[0] || null;
  }
  if (path.startsWith('/courses/')) {
    return path.slice(9).split('?')[0] || null;
  }
  return null;
}

export function getMeetingIdFromPath(): string | null {
  const path = window.location.pathname;
  if (path.startsWith('/meeting-room/')) {
    return path.slice(14).split('?')[0] || null;
  }
  if (path.startsWith('/teacher-meeting-detail/')) {
    return path.slice(24).split('?')[0] || null;
  }
  return null;
}

export const DYNAMIC_ROUTE_PATTERNS = [
  { pattern: /^\/meeting-room\/(.+)$/, state: 'meeting-room' as AppState },
  { pattern: /^\/teacher-meeting-detail\/(.+)$/, state: 'teacher-meeting-detail' as AppState },
  { pattern: /^\/course\/(.+)$/, state: 'course-detail' as AppState },
  { pattern: /^\/courses\/(.+)$/, state: 'course-detail' as AppState },
  { pattern: /^\/blog\/(.+)$/, state: 'blog-post-detail' as AppState },
  { pattern: /^\/product\/(.+)$/, state: 'product-detail' as AppState },
  { pattern: /^\/freelancer\/(.+)$/, state: 'freelancer-profile' as AppState },
];

export function matchDynamicRoute(path: string): { state: AppState; id: string } | null {
  for (const route of DYNAMIC_ROUTE_PATTERNS) {
    const match = path.match(route.pattern);
    if (match && match[1]) {
      return { state: route.state, id: match[1] };
    }
  }
  return null;
}

export const PROTECTED_STATES: Record<string, string[]> = {
  'admin-dashboard': ['admin'],
  'admin-showcase-dashboard': ['admin'],
  'admin-email-management': ['admin'],
  'admin-email-campaigns': ['admin'],
  'admin-email-inbox': ['admin'],
  'admin-blog-management': ['admin'],
  'admin-course-management': ['admin'],
  'admin-contact-messages': ['admin'],
  'admin-applications-management': ['admin'],
  'admin-subject-approval': ['admin'],
  'logo-management': ['admin'],
  'category-management': ['admin'],
  'coupon-management': ['admin'],
  'transaction-dashboard': ['admin'],
  'teacher-dashboard': ['teacher', 'admin'],
  'teacher-meetings': ['teacher', 'admin'],
  'teacher-meeting-detail': ['teacher', 'admin'],
  'course-creator': ['teacher', 'admin'],
  'subject-creator': ['teacher', 'admin'],
  'freelancer-dashboard': ['freelancer', 'admin'],
  'portfolio-create': ['freelancer', 'admin'],
  'portfolio-edit': ['freelancer', 'admin'],
  'product-creation': ['freelancer', 'admin'],
  'student-dashboard': ['student', 'admin'],
  'student-meetings': ['student', 'admin'],
  'meeting-scheduler': ['student', 'admin'],
  'customer-dashboard': ['student', 'teacher', 'freelancer', 'general', 'admin'],
  'earnings': ['teacher', 'freelancer', 'admin'],
};

export function isProtectedState(state: AppState): boolean {
  return state in PROTECTED_STATES;
}

export function canAccessState(state: AppState, userRole: string | null | undefined): boolean {
  if (!isProtectedState(state)) {
    return true;
  }
  
  if (!userRole) {
    return false;
  }
  
  const allowedRoles = PROTECTED_STATES[state];
  return allowedRoles?.includes(userRole) || userRole === 'admin';
}

export const AUTH_STATES: AppState[] = [
  'auth',
  'teacher-login',
  'teacher-signup',
  'teacher-signup-basic',
  'teacher-verify-email',
  'freelancer-login',
  'freelancer-signup',
  'freelancer-signup-basic',
  'student-signup',
  'creator-signup',
  'reset-password',
  'email-verification',
];

export function isAuthState(state: AppState): boolean {
  return AUTH_STATES.includes(state);
}

export function shouldRedirectAuthenticatedUser(state: AppState, userRole: string | null | undefined): AppState | null {
  // Never redirect if the user is on a public-safe page
  const publicSafeStates: AppState[] = [
    "product-shop", "course-browse", "course-detail", "blog", "home", 
    "about", "contact", "help", "portfolio-gallery", "cart"
  ];
  
  if (publicSafeStates.includes(state)) {
    return null;
  }

  if (!isAuthState(state) || !userRole) {
    return null;
  }
  
  switch (userRole) {
    case 'admin':
      return 'admin-dashboard';
    case 'teacher':
      return 'teacher-dashboard';
    case 'freelancer':
      return 'freelancer-dashboard';
    case 'student':
      return 'student-dashboard';
    case 'general':
      return 'customer-dashboard';
    default:
      return 'home';
  }
}
