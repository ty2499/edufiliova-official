import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, UserCircle, GraduationCap, ChevronDown, Briefcase, ShoppingBag, Coins, Newspaper, LifeBuoy, Menu, X, Search, Library, Award, ShieldCheck, FileCheck, UserPlus, FilePlus, Layers, ClipboardCheck, Video, Wallet, IdCard, Upload, Users2, Store, Tag, FolderOpen, PlusCircle, Info, Mail, Megaphone, HelpCircle, FileText, Users } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useQuery } from "@tanstack/react-query";
import { useHelpChat } from "@/contexts/HelpChatContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { LearnMegaMenu } from "@/components/megamenu/LearnMegaMenu";
import { StudentsMegaMenu } from "@/components/megamenu/StudentsMegaMenu";
import { TeachersMegaMenu } from "@/components/megamenu/TeachersMegaMenu";
import { FreelanceMegaMenu } from "@/components/megamenu/FreelanceMegaMenu";
import { ShopMegaMenu } from "@/components/megamenu/ShopMegaMenu";
import { PricingMegaMenu } from "@/components/megamenu/PricingMegaMenu";
import { PagesMegaMenu } from "@/components/megamenu/PagesMegaMenu";
import { MobileNavMenu } from "@/components/megamenu/MobileNavMenu";

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const Header = ({ onNavigate, currentPage, searchQuery = '', onSearchChange }: HeaderProps) => {
  const [, navigate] = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const { isChatOpen } = useHelpChat();
  const isMobile = useIsMobile();

  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [isTeachersOpen, setIsTeachersOpen] = useState(false);
  const [isFreelanceOpen, setIsFreelanceOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isPagesOpen, setIsPagesOpen] = useState(false);
  const [isBlogOpen, setIsBlogOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeAllMegaMenus = () => {
    setIsLearnOpen(false);
    setIsStudentsOpen(false);
    setIsTeachersOpen(false);
    setIsFreelanceOpen(false);
    setIsShopOpen(false);
    setIsPricingOpen(false);
    setIsPagesOpen(false);
    setIsBlogOpen(false);
    setIsHelpOpen(false);
  };

  const handleMegaMenuKeyDown = (e: React.KeyboardEvent, toggleFn: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFn();
    } else if (e.key === 'Escape') {
      closeAllMegaMenus();
    }
  };

  // Close menus on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-mega-menu-container]')) {
        closeAllMegaMenus();
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllMegaMenus();
      }
    };

    if (isLearnOpen || isStudentsOpen || isTeachersOpen || isFreelanceOpen || isShopOpen || isPricingOpen || isPagesOpen || isBlogOpen || isHelpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isLearnOpen, isStudentsOpen, isTeachersOpen, isFreelanceOpen, isShopOpen, isPricingOpen, isPagesOpen, isBlogOpen, isHelpOpen]);

  const navigationItems = [
    { id: "home", label: "Home" },
    { id: "course-browse", label: "Courses" },
    { id: "product-shop", label: "Creative Space" },
    { id: "portfolio-gallery", label: "Freelance Marketplace" },
    { id: "teacher-application", label: "Become a Teacher" },
    { id: "advertise-with-us", label: "Advertise with Us" },
    { id: "blog", label: "Blog" },
    { id: "about", label: "About Us" },
    { id: "help", label: "Help Center" },
    { id: "contact", label: "Contact Us" }
  ];

  const pricingMenuItems = [
    {
      id: "customer-pricing",
      label: "Shop Memberships",
      description: "Access our digital marketplace",
      icon: ShoppingBag,
      color: "bg-gradient-to-br from-purple-50 to-pink-50",
      iconBg: "bg-purple-100",
      iconColor: "text-primary"
    },
    {
      id: "creator-pricing",
      label: "Creator & Freelancer",
      description: "Grow your business",
      icon: Briefcase,
      color: "bg-gradient-to-br from-blue-50 to-cyan-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      popular: true
    },
    {
      id: "education-pricing",
      label: "Student Plans",
      description: "Learning subscriptions",
      icon: GraduationCap,
      color: "bg-gradient-to-br from-emerald-50 to-teal-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600"
    }
  ];

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';
  // Only consider user as "not authenticated" after auth loading completes
  // This prevents showing login UI while auth is still checking the session
  const isAuthenticated = !!user;
  const showLoginControls = !authLoading && !user;

  // Fetch unread messages count for authenticated users
  const { data: unreadMessagesData } = useQuery({
    queryKey: ['/api/messages', user?.id, 'unread-count'],
    queryFn: async () => {
      if (!user?.id) return { success: false, unreadCount: 0 };
      try {
        const sessionId = localStorage.getItem('sessionId');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`/api/messages/${user.id}/unread-count`, {
          headers: { Authorization: `Bearer ${sessionId}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          return { success: false, unreadCount: 0 };
        }
        const result = await response.json();
        return result;
      } catch (error) {
        return { success: false, unreadCount: 0 };
      }
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false
  });

  const unreadMessagesCount = unreadMessagesData?.success ? unreadMessagesData.unreadCount : 0;

  // Fetch claimable certificates count
  const { data: claimableData } = useQuery({
    queryKey: ['/api/certificates/claimable-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0 };
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`/api/certificates/claimable-count`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          return { count: 0 };
        }
        const result = await response.json();
        return result;
      } catch (error) {
        return { count: 0 };
      }
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false
  });

  const claimableCertificatesCount = claimableData?.count || 0;

  // Check if admin is impersonating
  const isImpersonating = localStorage.getItem('isImpersonating') === 'true';

  const handleReturnToAdmin = async () => {
    try {
      const adminSessionId = localStorage.getItem('adminSessionId');
      
      if (adminSessionId) {
        // Return to admin session
        localStorage.setItem('sessionId', adminSessionId);
        localStorage.removeItem('isImpersonating');
        localStorage.removeItem('adminSessionId');
        
        // Reload to apply admin session
        window.location.reload();
      }
    } catch (error) {
      console.error('Error returning to admin:', error);
    }
  };

  // Unified navigation helper - uses URL routing when possible, falls back to state navigation
  const handleNavigation = (page: string) => {
    // Map common pages to clean URLs
    const urlMap: Record<string, string> = {
      'home': '/',
      'about': '/about',
      'contact': '/contact',
      'help': '/help',
      'privacy': '/privacy-policy',
      'terms': '/terms-and-conditions',
      'portfolio-gallery': '/marketplace',
      'product-shop': '/shop',
      'course-browse': '/courses'
    };

    const targetPath = urlMap[page];
    if (targetPath) {
      window.history.pushState({}, '', targetPath);
    }

    // Use transition for all navigation
    onNavigate(page);
  };

  // Hide header on mobile when chat is open or when on product-shop page
  if ((isMobile && isChatOpen) || currentPage === "product-shop") {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 w-full z-50 pt-safe">
      <div className="container mx-auto px-6 md:px-10 lg:px-14">
        {/* Impersonation Banner */}
        {isImpersonating && (
          <div className="bg-primary text-white py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Admin Impersonation Mode</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="ml-4 bg-white text-primary hover:bg-primary/10 border-white h-7"
              onClick={handleReturnToAdmin}
            >
              Return to Admin Dashboard
            </Button>
          </div>
        )}
        <div className="hidden md:flex items-center justify-between h-16 gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo 
              size="md" 
              variant="default" 
              type="home"
              logoSize="square"
              onClick={() => handleNavigation("home")}
              className="animate-fade-in hover:opacity-80 transition-opacity"
            />
          </div>

          {/* Navigation Wrapper - includes nav and mega menu */}
          <div 
            className="flex-1"
          >
            {/* Center Navigation */}
            <nav className="flex items-center gap-1 flex-1 justify-center">
              {/* Learn */}
              <div 
                data-mega-menu-container
              >
                <button 
                  onClick={() => {
                    if (isLearnOpen) {
                      setIsLearnOpen(false);
                    } else {
                      closeAllMegaMenus();
                      setIsLearnOpen(true);
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                >
                  Learn
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isLearnOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* For Students - Show only to logged-in students */}
              {isAuthenticated && profile?.role === 'student' && (
                <div 
                  data-mega-menu-container
                >
                  <button 
                    onClick={() => {
                      if (isStudentsOpen) {
                        setIsStudentsOpen(false);
                      } else {
                        closeAllMegaMenus();
                        setIsStudentsOpen(true);
                      }
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                  >
                    Students
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isStudentsOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}

              {/* For Teachers - Only show to guests, teachers, or admins */}
              {(!isAuthenticated || profile?.role === 'teacher' || profile?.role === 'admin') && (
                <div 
                  data-mega-menu-container
                >
                  <button 
                    onClick={() => {
                      if (isTeachersOpen) {
                        setIsTeachersOpen(false);
                      } else {
                        closeAllMegaMenus();
                        setIsTeachersOpen(true);
                      }
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                  >
                    Teachers
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isTeachersOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}

              {/* Freelancers */}
              <div 
                data-mega-menu-container
              >
                <button 
                  onClick={() => {
                    if (isFreelanceOpen) {
                      setIsFreelanceOpen(false);
                    } else {
                      closeAllMegaMenus();
                      setIsFreelanceOpen(true);
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                >
                  Freelancers
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isFreelanceOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Creative Space */}
              <div 
                data-mega-menu-container
              >
                <button 
                  onClick={() => {
                    if (isShopOpen) {
                      setIsShopOpen(false);
                    } else {
                      closeAllMegaMenus();
                      setIsShopOpen(true);
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                >
                  Creative Space
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isShopOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Pricing */}
              <div 
                data-mega-menu-container
              >
                <button 
                  onClick={() => {
                    if (isPricingOpen) {
                      setIsPricingOpen(false);
                    } else {
                      closeAllMegaMenus();
                      setIsPricingOpen(true);
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                >
                  Pricing
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isPricingOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Blog */}
              <button 
                onClick={() => handleNavigation("blog")}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
              >
                Blog
              </button>

              {/* About Us */}
              <button 
                onClick={() => handleNavigation("about")}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                data-testid="nav-about-us"
              >
                About Us
              </button>

              {/* Pages */}
              <div 
                data-mega-menu-container
              >
                <button 
                  onClick={() => {
                    if (isPagesOpen) {
                      setIsPagesOpen(false);
                    } else {
                      closeAllMegaMenus();
                      setIsPagesOpen(true);
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                >
                  Pages
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isPagesOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </nav>

            {/* Mega Menus Container */}
            {(isLearnOpen || isStudentsOpen || isTeachersOpen || isFreelanceOpen || isShopOpen || isPricingOpen || isPagesOpen) && (
              <div 
                className="absolute left-0 right-0 top-16 z-50"
                data-mega-menu-container
              >
                {isLearnOpen && <LearnMegaMenu isOpen={isLearnOpen} onNavigate={onNavigate} onClose={() => setIsLearnOpen(false)} isAuthenticated={isAuthenticated} />}
                {isStudentsOpen && <StudentsMegaMenu isOpen={isStudentsOpen} onNavigate={onNavigate} onClose={() => setIsStudentsOpen(false)} />}
                {isTeachersOpen && <TeachersMegaMenu isOpen={isTeachersOpen} onNavigate={onNavigate} onClose={() => setIsTeachersOpen(false)} isAuthenticated={isAuthenticated} isApproved={profile?.role === 'teacher'} />}
                {isFreelanceOpen && <FreelanceMegaMenu isOpen={isFreelanceOpen} onNavigate={onNavigate} onClose={() => setIsFreelanceOpen(false)} />}
                {isShopOpen && <ShopMegaMenu isOpen={isShopOpen} onNavigate={onNavigate} onClose={() => setIsShopOpen(false)} />}
                {isPricingOpen && <PricingMegaMenu isOpen={isPricingOpen} onNavigate={onNavigate} onClose={() => setIsPricingOpen(false)} />}
                {isPagesOpen && <PagesMegaMenu isOpen={isPagesOpen} onNavigate={onNavigate} onClose={() => setIsPagesOpen(false)} />}
              </div>
            )}
          </div>

          {/* Right side - Auth/Profile */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {isAuthenticated ? (
              <Button 
                variant="ghost"
                className="flex items-center gap-2 h-10 px-3"
                onClick={() => {
    const getDashboardPage = () => {
      if (!profile) return "auth";
      if (profile.role === 'admin') return "admin-dashboard";
      if (profile.role === 'teacher') return "teacher-dashboard";
      if (profile.role === 'freelancer') return "freelancer-dashboard";
      if (profile.role === 'general') return "customer-dashboard";
      return "student-dashboard";
    };

    onNavigate(getDashboardPage());
                }}
                title={profile?.role === 'admin' ? 'Admin Dashboard' : profile?.role === 'general' ? 'My Account' : 'Dashboard'}
                data-testid="header-profile"
              >
                <span className="text-sm font-medium text-gray-700">
                  {profile?.role === 'general' ? 'My Account' : 'Dashboard'}
                </span>
                {(profile?.profilePicture || profile?.avatarUrl) ? (
                  <img 
                    src={(profile.profilePicture || profile.avatarUrl) as string} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onNavigate("auth")}
                className="inline-flex items-center justify-center whitespace-nowrap transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer hover:scale-105 active:scale-95 focus-visible:ring-accent h-9 sm:px-4 py-2 text-sm font-medium rounded-full px-8 pl-[52px] pr-[52px] bg-[#a0fab2] text-[#2f5a4e] hover:bg-[#0c332c] hover:text-white"
                data-testid="button-signin"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between h-16 gap-4 px-4">
          <Logo 
            size="md" 
            variant="default" 
            type="home"
            logoSize="square"
            onClick={() => {handleNavigation("home"); setIsMobileMenuOpen(false);}}
            className="animate-fade-in hover:opacity-80 transition-opacity"
          />
          
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 max-h-[85vh] overflow-y-auto">
            <MobileNavMenu 
              onNavigate={onNavigate} 
              onClose={() => setIsMobileMenuOpen(false)} 
              isAuthenticated={isAuthenticated}
              userRole={profile?.role}
            />
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;
