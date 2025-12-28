export type CoreUserRole = 'guest' | 'student' | 'teacher' | 'freelancer' | 'general' | 'admin';
export type ExtendedUserRole = CoreUserRole | 'pending_teacher' | 'pending_freelancer' | string;

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  allowedRoles: CoreUserRole[];
  requiresAuth?: boolean;
  hideWhenAuth?: boolean;
}

export interface NavSection {
  id: string;
  label: string;
  allowedRoles: CoreUserRole[];
  items: NavItem[];
}

export const ROLE_HIERARCHY: Record<CoreUserRole, number> = {
  guest: 0,
  student: 1,
  general: 1,
  freelancer: 2,
  teacher: 2,
  admin: 10,
};

function normalizeRole(role: string | null | undefined): CoreUserRole {
  if (!role) return 'guest';
  
  const lowerRole = role.toLowerCase();
  
  if (lowerRole === 'admin' || lowerRole === 'accountant' || 
      lowerRole === 'customer_service' || lowerRole === 'moderator') {
    return 'admin';
  }
  
  if (lowerRole.startsWith('teacher')) return 'teacher';
  if (lowerRole.startsWith('freelancer')) return 'freelancer';
  if (lowerRole.startsWith('student') || lowerRole === 'user') return 'student';
  if (lowerRole === 'general') return 'general';
  
  return 'general';
}

export { normalizeRole };

export function canAccessNavItem(
  item: NavItem,
  isAuthenticated: boolean,
  userRole?: string | null
): boolean {
  const role = normalizeRole(isAuthenticated ? userRole : null);
  
  if (item.hideWhenAuth && isAuthenticated) {
    return false;
  }
  
  if (item.requiresAuth && !isAuthenticated) {
    return false;
  }
  
  if (item.allowedRoles.includes('guest')) {
    return true;
  }
  
  if (role === 'admin') {
    return true;
  }
  
  return item.allowedRoles.includes(role);
}

export function canAccessNavSection(
  section: NavSection,
  isAuthenticated: boolean,
  userRole?: string | null
): boolean {
  const role = normalizeRole(isAuthenticated ? userRole : null);
  
  if (section.allowedRoles.includes('guest')) {
    return true;
  }
  
  if (role === 'admin') {
    return true;
  }
  
  return section.allowedRoles.includes(role);
}

export function getVisibleNavItems(
  items: NavItem[],
  isAuthenticated: boolean,
  userRole?: string | null
): NavItem[] {
  return items.filter(item => canAccessNavItem(item, isAuthenticated, userRole));
}

export const NAV_SECTIONS: Record<string, NavSection> = {
  learn: {
    id: 'learn',
    label: 'Learn',
    allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
    items: [
      {
        id: 'course-browse',
        label: 'Browse Courses',
        description: 'Explore our course catalog',
        icon: 'Search',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'student-signup',
        label: 'Create an Account',
        description: 'Sign up and start learning',
        icon: 'UserPlus',
        allowedRoles: ['guest'],
        hideWhenAuth: true,
      },
      {
        id: 'student-dashboard',
        label: 'My Subjects',
        description: 'Access your enrolled courses',
        icon: 'Library',
        allowedRoles: ['student'],
        requiresAuth: true,
      },
      {
        id: 'my-certificates',
        label: 'My Certificates',
        description: 'View your earned certificates',
        icon: 'Award',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'claim-certificate',
        label: 'Claim Certificate',
        description: 'Get your course completion certificate',
        icon: 'FileCheck',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
    ],
  },
  students: {
    id: 'students',
    label: 'Students',
    allowedRoles: ['student'],
    items: [
      {
        id: 'student-dashboard',
        label: 'My Dashboard',
        description: 'View your learning progress',
        icon: 'LayoutDashboard',
        allowedRoles: ['student'],
        requiresAuth: true,
      },
      {
        id: 'student-meetings',
        label: 'My Meetings',
        description: 'View scheduled meetings',
        icon: 'Video',
        allowedRoles: ['student'],
        requiresAuth: true,
      },
      {
        id: 'meeting-scheduler',
        label: 'Schedule Meeting',
        description: 'Book a session with a teacher',
        icon: 'Calendar',
        allowedRoles: ['student'],
        requiresAuth: true,
      },
    ],
  },
  teachers: {
    id: 'teachers',
    label: 'Teachers',
    allowedRoles: ['guest', 'teacher', 'admin'],
    items: [
      {
        id: 'teacher-application',
        label: 'Join as Teacher',
        description: 'Start your teaching journey',
        icon: 'UserPlus',
        allowedRoles: ['guest', 'admin'],
        hideWhenAuth: false,
      },
      {
        id: 'teacher-pricing',
        label: 'Why Teach With Us',
        description: 'Discover benefits and opportunities',
        icon: 'Wallet',
        allowedRoles: ['guest', 'teacher', 'admin'],
      },
      {
        id: 'teacher-application-status',
        label: 'Application Status',
        description: 'Check your application progress',
        icon: 'ClipboardCheck',
        allowedRoles: ['guest', 'teacher', 'admin'],
      },
      {
        id: 'teacher-dashboard',
        label: 'Teacher Dashboard',
        description: 'Manage your teaching',
        icon: 'LayoutDashboard',
        allowedRoles: ['teacher', 'admin'],
        requiresAuth: true,
      },
      {
        id: 'course-creator',
        label: 'Create Course',
        description: 'Design and publish courses',
        icon: 'FilePlus',
        allowedRoles: ['teacher', 'admin'],
        requiresAuth: true,
      },
      {
        id: 'subject-creator',
        label: 'Subject Creator',
        description: 'Build course subjects and lessons',
        icon: 'Layers',
        allowedRoles: ['teacher', 'admin'],
        requiresAuth: true,
      },
      {
        id: 'admin-subject-approval',
        label: 'Subject Approvals',
        description: 'Review teacher-created subjects',
        icon: 'GraduationCap',
        allowedRoles: ['admin'],
        requiresAuth: true,
      },
      {
        id: 'teacher-meetings',
        label: 'Teacher Meetings',
        description: 'Schedule and host classes',
        icon: 'Video',
        allowedRoles: ['teacher', 'admin'],
        requiresAuth: true,
      },
      {
        id: 'earnings',
        label: 'Earnings Dashboard',
        description: 'Track your income and payments',
        icon: 'Wallet',
        allowedRoles: ['teacher', 'admin'],
        requiresAuth: true,
      },
    ],
  },
  freelancers: {
    id: 'freelancers',
    label: 'Freelancers',
    allowedRoles: ['guest', 'freelancer', 'admin'],
    items: [
      {
        id: 'freelancer-signup-basic',
        label: 'Become a Freelancer',
        description: 'Start your freelancing journey',
        icon: 'Briefcase',
        allowedRoles: ['guest', 'admin'],
      },
      {
        id: 'portfolio-gallery',
        label: 'Browse Talent',
        description: 'Find skilled freelancers',
        icon: 'Users2',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'freelancer-dashboard',
        label: 'My Dashboard',
        description: 'Manage your freelance work',
        icon: 'LayoutDashboard',
        allowedRoles: ['freelancer', 'admin'],
        requiresAuth: true,
      },
      {
        id: 'freelancer-profile',
        label: 'My Portfolio',
        description: 'View and manage your portfolio',
        icon: 'IdCard',
        allowedRoles: ['freelancer', 'admin'],
        requiresAuth: true,
      },
      {
        id: 'portfolio-create',
        label: 'Create Portfolio',
        description: 'Showcase your work',
        icon: 'Upload',
        allowedRoles: ['freelancer', 'admin'],
        requiresAuth: true,
      },
    ],
  },
  shop: {
    id: 'shop',
    label: 'Creative Space',
    allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
    items: [
      {
        id: 'product-shop',
        label: 'Browse Products',
        description: 'Discover digital products',
        icon: 'Store',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'cart',
        label: 'My Cart',
        description: 'View items in your cart',
        icon: 'ShoppingCart',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'product-creation',
        label: 'Sell Products',
        description: 'List your digital products',
        icon: 'PlusCircle',
        allowedRoles: ['freelancer', 'admin'],
        requiresAuth: true,
      },
      {
        id: 'customer-dashboard',
        label: 'My Purchases',
        description: 'View your purchase history',
        icon: 'Package',
        allowedRoles: ['general', 'student', 'teacher', 'freelancer', 'admin'],
        requiresAuth: true,
      },
    ],
  },
  pricing: {
    id: 'pricing',
    label: 'Pricing',
    allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
    items: [
      {
        id: 'customer-pricing',
        label: 'Shop Memberships',
        description: 'Access our digital marketplace',
        icon: 'ShoppingBag',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'creator-pricing',
        label: 'Creator & Freelancer',
        description: 'Grow your business',
        icon: 'Briefcase',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'education-pricing',
        label: 'Student Plans',
        description: 'Learning subscriptions',
        icon: 'GraduationCap',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
    ],
  },
  pages: {
    id: 'pages',
    label: 'Pages',
    allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
    items: [
      {
        id: 'about',
        label: 'About Us',
        description: 'Learn about our mission',
        icon: 'Info',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'contact',
        label: 'Contact Us',
        description: 'Get in touch with our team',
        icon: 'Mail',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'help',
        label: 'Help Center',
        description: 'FAQs and support',
        icon: 'HelpCircle',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'blog',
        label: 'Blog',
        description: 'News and updates',
        icon: 'Newspaper',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'advertise-with-us',
        label: 'Advertise',
        description: 'Partner with us',
        icon: 'Megaphone',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'terms',
        label: 'Terms of Service',
        description: 'Our terms and conditions',
        icon: 'FileText',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
      {
        id: 'privacy-policy',
        label: 'Privacy Policy',
        description: 'How we protect your data',
        icon: 'Shield',
        allowedRoles: ['guest', 'student', 'teacher', 'freelancer', 'general', 'admin'],
      },
    ],
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    allowedRoles: ['admin'],
    items: [
      {
        id: 'admin-dashboard',
        label: 'Admin Dashboard',
        description: 'System overview and controls',
        icon: 'Shield',
        allowedRoles: ['admin'],
        requiresAuth: true,
      },
      {
        id: 'admin-course-management',
        label: 'Course Management',
        description: 'Manage all courses',
        icon: 'BookOpen',
        allowedRoles: ['admin'],
        requiresAuth: true,
      },
      {
        id: 'admin-applications-management',
        label: 'Applications',
        description: 'Review teacher and freelancer applications',
        icon: 'Users',
        allowedRoles: ['admin'],
        requiresAuth: true,
      },
      {
        id: 'admin-email-management',
        label: 'Email Management',
        description: 'Manage email templates and campaigns',
        icon: 'Mail',
        allowedRoles: ['admin'],
        requiresAuth: true,
      },
      {
        id: 'logo-management',
        label: 'Logo Management',
        description: 'Update site branding',
        icon: 'Image',
        allowedRoles: ['admin'],
        requiresAuth: true,
      },
    ],
  },
};

export function getVisibleSections(
  isAuthenticated: boolean,
  userRole?: string | null
): NavSection[] {
  return Object.values(NAV_SECTIONS).filter(section => 
    canAccessNavSection(section, isAuthenticated, userRole)
  );
}

export function hasAccessToPage(
  pageId: string,
  isAuthenticated: boolean,
  userRole?: string | null
): boolean {
  for (const section of Object.values(NAV_SECTIONS)) {
    const item = section.items.find(i => i.id === pageId);
    if (item) {
      return canAccessNavItem(item, isAuthenticated, userRole);
    }
  }
  return true;
}

export const PUBLIC_PAGES = [
  'home',
  'blog',
  'blog-post-detail',
  'about',
  'contact',
  'help',
  'premium',
  'terms',
  'privacy',
  'privacy-policy',
  'cookies-policy',
  'refund-policy',
  'student-terms',
  'teacher-terms',
  'school-terms',
  'chat-terms',
  'whatsapp-policy',
  'data-retention',
  'copyright-dmca',
  'community-guidelines',
  'payment-billing',
  'payout-policy',
  'learn-more',
  'subscribe',
  'auth',
  'course-browse',
  'portfolio-gallery',
  'product-shop',
  'cart',
  'customer-pricing',
  'creator-pricing',
  'education-pricing',
  'teacher-pricing',
  'teacher-application',
  'teacher-login',
  'teacher-signup',
  'teacher-signup-basic',
  'freelancer-login',
  'freelancer-signup',
  'freelancer-signup-basic',
  'buy-voucher',
  'verify-certificate',
  'advertise-with-us',
  'course-detail',
  'product-detail',
  'freelancer-profile',
  'not-found',
  'access-denied',
];

export const AUTH_REQUIRED_PAGES: Record<string, CoreUserRole[]> = {
  'student-dashboard': ['student', 'admin'],
  'student-meetings': ['student', 'admin'],
  'meeting-scheduler': ['student', 'admin'],
  'teacher-dashboard': ['teacher', 'admin'],
  'teacher-meetings': ['teacher', 'admin'],
  'teacher-meeting-detail': ['teacher', 'admin'],
  'course-creator': ['teacher', 'admin'],
  'subject-creator': ['teacher', 'admin'],
  'earnings': ['teacher', 'freelancer', 'admin'],
  'freelancer-dashboard': ['freelancer', 'admin'],
  'portfolio-create': ['freelancer', 'admin'],
  'portfolio-edit': ['freelancer', 'admin'],
  'customer-dashboard': ['student', 'teacher', 'freelancer', 'general', 'admin'],
  'product-creation': ['freelancer', 'admin'],
  'admin-dashboard': ['admin'],
  'admin-course-management': ['admin'],
  'admin-applications-management': ['admin'],
  'admin-email-management': ['admin'],
  'admin-email-campaigns': ['admin'],
  'admin-email-inbox': ['admin'],
  'admin-blog-management': ['admin'],
  'admin-contact-messages': ['admin'],
  'admin-subject-approval': ['admin'],
  'admin-showcase-dashboard': ['admin'],
  'admin-payout-management': ['admin'],
  'logo-management': ['admin'],
  'category-management': ['admin'],
  'coupon-management': ['admin'],
  'transaction-dashboard': ['admin'],
};

export function canAccessPage(
  pageId: string,
  isAuthenticated: boolean,
  userRole?: string | null
): boolean {
  if (PUBLIC_PAGES.includes(pageId)) {
    return true;
  }

  if (pageId.startsWith('course-detail-') || pageId.startsWith('product-detail-') || 
      pageId.startsWith('blog-post-') || pageId.startsWith('freelancer-profile-')) {
    return true;
  }

  const requiredRoles = AUTH_REQUIRED_PAGES[pageId];
  if (!requiredRoles) {
    return true;
  }

  if (!isAuthenticated) {
    return false;
  }

  const role = normalizeRole(userRole);
  if (role === 'admin') {
    return true;
  }

  return requiredRoles.includes(role);
}
