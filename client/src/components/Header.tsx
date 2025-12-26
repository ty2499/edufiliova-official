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
  const [isMobileLearnOpen, setIsMobileLearnOpen] = useState(false);
  const [isMobileTeachersOpen, setIsMobileTeachersOpen] = useState(false);
  const [isMobileFreelanceOpen, setIsMobileFreelanceOpen] = useState(false);
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false);
  const [isMobilePricingOpen, setIsMobilePricingOpen] = useState(false);
  const [isMobilePagesOpen, setIsMobilePagesOpen] = useState(false);

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
        const response = await fetch(`/api/messages/${user.id}/unread-count`, {
          headers: { Authorization: `Bearer ${sessionId}` }
        });
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Header: Failed to fetch unread messages:', error);
        return { success: false, unreadCount: 0 };
      }
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 30 * 1000, // Data considered fresh for 30 seconds
    gcTime: 2 * 60 * 1000, // Cache persists for 2 minutes
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
        const response = await fetch(`/api/certificates/claimable-count`);
        const result = await response.json();
        return result;
      } catch (error) {
        return { count: 0 };
      }
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 60 * 1000,
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
    // NOTE: blog and course-browse use state-based navigation (no URL change)
    // to allow detail views to work without URL conflicts
    const urlMap: Record<string, string> = {
      'home': '/',
      'about': '/about',
      'contact': '/contact',
      'help': '/help',
      'privacy': '/privacy-policy',
      'terms': '/terms-and-conditions',
      'portfolio-gallery': '/marketplace'
    };

    // If page has a URL mapping, use URL navigation
    if (urlMap[page]) {
      navigate(urlMap[page]);
    } else {
      // Otherwise fall back to state-based navigation (blog, courses, etc.)
      onNavigate(page);
    }
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
              className="ml-4 bg-white text-primary hover:bg-primary/10 border-white h-7 transition-all duration-300"
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
              className="animate-fade-in hover:opacity-80 transition-opacity transition-all duration-300"
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
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors transition-all duration-300"
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
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors transition-all duration-300"
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
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors transition-all duration-300"
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
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors transition-all duration-300"
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
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors transition-all duration-300"
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
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors transition-all duration-300"
                >
                  Pricing
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isPricingOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Blog */}
              <button 
                onClick={() => handleNavigation("blog")}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors transition-all duration-300"
              >
                Blog
              </button>

              {/* About Us */}
              <button 
                onClick={() => handleNavigation("about")}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors transition-all duration-300"
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
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 transition-colors transition-all duration-300"
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
                  if (profile?.role === 'admin') {
                    onNavigate("admin-dashboard");
                  } else if (profile?.role === 'teacher') {
                    onNavigate("teacher-dashboard");
                  } else if (profile?.role === 'freelancer') {
                    onNavigate("freelancer-dashboard");
                  } else if (profile?.role === 'general') {
                    onNavigate("customer-dashboard");
                  } else {
                    onNavigate("student-dashboard");
                  }
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
            className="animate-fade-in hover:opacity-80 transition-opacity transition-all duration-300"
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
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 max-h-[70vh] overflow-y-auto">
            <nav className="flex flex-col py-2 px-0 gap-0">
              {/* LEARN */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <button 
                  onClick={() => setIsMobileLearnOpen(!isMobileLearnOpen)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between transition-all duration-300"
                >
                  Learn
                  <ChevronDown className={`h-4 w-4 transition-transform ${isMobileLearnOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileLearnOpen && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 space-y-2">
                    <button 
                      onClick={() => {onNavigate("course-browse"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Search className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Browse Courses</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Explore our course catalog</div>
                      </div>
                    </button>
                    {!isAuthenticated && (
                      <button 
                        onClick={() => {onNavigate("student-signup"); setIsMobileMenuOpen(false);}}
                        className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                      >
                        <UserPlus className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Create an Account</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">Sign up and start learning</div>
                        </div>
                      </button>
                    )}
                    {isAuthenticated && profile?.role === 'student' && (
                      <button 
                        onClick={() => {onNavigate("student-dashboard"); setIsMobileMenuOpen(false);}}
                        className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                      >
                        <Library className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">My Subjects</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">Access your enrolled courses</div>
                        </div>
                      </button>
                    )}
                    <button 
                      onClick={() => {onNavigate("my-certificates"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Award className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">My Certificates</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">View your earned certificates</div>
                      </div>
                    </button>
                    {claimableCertificatesCount > 0 && (
                      <button 
                        onClick={() => {onNavigate("claim-certificate"); setIsMobileMenuOpen(false);}}
                        className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                      >
                        <FileCheck className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Claim Certificate</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">Get your course completion certificate</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* TEACHERS - Only show to guests, teachers, or admins */}
              {(!isAuthenticated || profile?.role === 'teacher' || profile?.role === 'admin') && (
                <div className="border-b border-gray-200 dark:border-gray-800">
                  <button 
                    onClick={() => setIsMobileTeachersOpen(!isMobileTeachersOpen)}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between transition-all duration-300"
                  >
                    For Teachers
                    <ChevronDown className={`h-4 w-4 transition-transform ${isMobileTeachersOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isMobileTeachersOpen && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 space-y-2">
                      <button 
                        onClick={() => {onNavigate("teacher-application"); setIsMobileMenuOpen(false);}}
                        className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                      >
                        <UserPlus className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Join as Teacher</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">Start your teaching journey</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => {onNavigate("teacher-pricing"); setIsMobileMenuOpen(false);}}
                        className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                      >
                        <Wallet className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Why Teach With Us</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">Discover benefits and opportunities</div>
                        </div>
                      </button>
                      {isAuthenticated && profile?.role === 'teacher' && (
                        <button 
                          onClick={() => {onNavigate("teacher-status"); setIsMobileMenuOpen(false);}}
                          className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                        >
                          <ClipboardCheck className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">Application Status</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">Check your application progress</div>
                          </div>
                        </button>
                      )}
                      {isAuthenticated && profile?.role === 'teacher' && (
                        <>
                          <button 
                            onClick={() => {onNavigate("course-creator"); setIsMobileMenuOpen(false);}}
                            className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                          >
                            <FilePlus className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">Create Course</div>
                              <div className="text-gray-600 dark:text-gray-400 text-xs">Design and publish courses</div>
                            </div>
                          </button>
                          <button 
                            onClick={() => {onNavigate("subject-creator"); setIsMobileMenuOpen(false);}}
                            className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                          >
                            <Layers className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">Subject Creator</div>
                              <div className="text-gray-600 dark:text-gray-400 text-xs">Build course subjects and lessons</div>
                            </div>
                          </button>
                          <button 
                            onClick={() => {onNavigate("teacher-meetings"); setIsMobileMenuOpen(false);}}
                            className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                          >
                            <Video className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">Teacher Meetings</div>
                              <div className="text-gray-600 dark:text-gray-400 text-xs">Schedule and host classes</div>
                            </div>
                          </button>
                          <button 
                            onClick={() => {onNavigate("earnings"); setIsMobileMenuOpen(false);}}
                            className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                          >
                            <Wallet className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">Earnings Dashboard</div>
                              <div className="text-gray-600 dark:text-gray-400 text-xs">Track your income and payments</div>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* FREELANCERS */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <button 
                  onClick={() => setIsMobileFreelanceOpen(!isMobileFreelanceOpen)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between transition-all duration-300"
                >
                  Freelancers
                  <ChevronDown className={`h-4 w-4 transition-transform ${isMobileFreelanceOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileFreelanceOpen && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 space-y-2">
                    <button 
                      onClick={() => {onNavigate("freelancer-signup-basic"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Briefcase className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Become a Freelancer</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Start your freelancing journey</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("freelancer-profile"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <IdCard className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">My Portfolio</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">View and manage your portfolio</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("portfolio-create"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Upload className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Create Portfolio</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Build your professional showcase</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("portfolio-gallery"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Users2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Find Talent</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Browse skilled freelancers</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* CREATIVE SPACE */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <button 
                  onClick={() => setIsMobileShopOpen(!isMobileShopOpen)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between transition-all duration-300"
                >
                  Creative Space
                  <ChevronDown className={`h-4 w-4 transition-transform ${isMobileShopOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileShopOpen && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 space-y-2">
                    <button 
                      onClick={() => {onNavigate("product-shop"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Store className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Design Marketplace</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Discover premium design resources</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("product-shop"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Tag className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Browse Designs</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Templates, graphics & creative assets</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {
                        let dashboard = "customer-dashboard";
                        if (profile?.role === 'admin') dashboard = "admin-dashboard";
                        else if (profile?.role === 'teacher') dashboard = "teacher-dashboard";
                        else if (profile?.role === 'freelancer') dashboard = "freelancer-dashboard";
                        else if (profile?.role === 'student') dashboard = "student-dashboard";
                        onNavigate(dashboard);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <FolderOpen className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">My Purchases</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Access your downloaded design assets</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("product-creation"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <PlusCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Add Product</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">List your products for sale</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* PRICING */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <button 
                  onClick={() => setIsMobilePricingOpen(!isMobilePricingOpen)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between transition-all duration-300"
                >
                  Pricing
                  <ChevronDown className={`h-4 w-4 transition-transform ${isMobilePricingOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobilePricingOpen && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 space-y-2">
                    <button 
                      onClick={() => {onNavigate("education-pricing"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <GraduationCap className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Student Pricing</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Affordable plans for learners</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("customer-pricing"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <ShoppingBag className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Customer Pricing</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Plans for buyers</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("creator-pricing"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Briefcase className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Freelancer Pricing</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Plans for creators</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* BLOG */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <button 
                  onClick={() => {handleNavigation("blog"); setIsMobileMenuOpen(false);}}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  Blog
                </button>
              </div>

              {/* ABOUT US */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <button 
                  onClick={() => {handleNavigation("about"); setIsMobileMenuOpen(false);}}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                  data-testid="nav-about-us-mobile"
                >
                  About Us
                </button>
              </div>

              {/* PAGES */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <button 
                  onClick={() => setIsMobilePagesOpen(!isMobilePagesOpen)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between transition-all duration-300"
                >
                  Pages
                  <ChevronDown className={`h-4 w-4 transition-transform ${isMobilePagesOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobilePagesOpen && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 space-y-2">
                    <button 
                      onClick={() => {handleNavigation("about"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">About Us</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Learn about our platform and mission</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {handleNavigation("contact"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Contact</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Get in touch with our team</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("advertise-with-us"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Megaphone className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Advertise With Us</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Explore advertising opportunities</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {handleNavigation("help"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Help & Support</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Find answers and get support</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("privacy-policy"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Privacy Policy</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">How we protect your data</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("terms"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Terms of Service</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Our terms and conditions</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => {onNavigate("community-guidelines"); setIsMobileMenuOpen(false);}}
                      className="w-full text-left px-3 py-2 text-xs rounded flex items-start gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors transition-all duration-300"
                    >
                      <Users className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#0C332C" }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Community Guidelines</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Community standards and rules</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* SIGN IN / ACCOUNT */}
              {authLoading ? (
                <div className="m-4 w-[calc(100%-32px)] flex items-center justify-center py-3">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-[#0C332C] rounded-full animate-spin"></div>
                </div>
              ) : showLoginControls ? (
                <Button
                  size="sm"
                  onClick={() => {onNavigate("auth"); setIsMobileMenuOpen(false);}}
                  className="m-4 w-[calc(100%-32px)] text-sm font-medium hover:bg-primary text-white rounded-full bg-[#0C332C] transition-all duration-300"
                  data-testid="button-signin-mobile"
                >
                  Sign In
                </Button>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-800 py-2">
                  <button 
                    onClick={() => {
                      if (profile?.role === 'admin') {
                        onNavigate("admin-dashboard");
                      } else if (profile?.role === 'teacher') {
                        onNavigate("teacher-dashboard");
                      } else if (profile?.role === 'freelancer') {
                        onNavigate("freelancer-dashboard");
                      } else if (profile?.role === 'general') {
                        onNavigate("customer-dashboard");
                      } else {
                        onNavigate("student-dashboard");
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 flex items-start gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors transition-all duration-300"
                    data-testid="button-account-mobile"
                  >
                    {(profile?.profilePicture || profile?.avatarUrl) ? (
                      <img 
                        src={(profile.profilePicture || profile.avatarUrl) as string} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <UserCircle className="h-8 w-8 flex-shrink-0" style={{ color: "#0C332C" }} />
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">My Account</div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs">{profile?.name || 'User'}</div>
                    </div>
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;
