import { useState } from 'react';
import { Link } from 'wouter';
import { openExternalUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Users,
  BookOpen,
  GraduationCap,
  Plus,
  MessageCircle,
  ClipboardList,
  Calendar,
  DollarSign,
  Package,
  Wallet,
  Settings,
  Bell,
  MessageSquare,
  Clock,
  ShoppingBag,
  Download,
  FileText,
  BookMarked,
  Menu,
  X,
  LogOut,
  Loader2,
  LayoutGrid,
  Video
} from 'lucide-react';
import { FaGlobe } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  href?: string;
  testId: string;
}

interface TeacherLayoutProps {
  children: React.ReactNode;
  activeNavId?: string;
  navItems: NavItem[];
  onNavigate?: (page: string) => void;
  onExploreWebsite?: () => void;
  showHeader?: boolean;
  hideHeaderGreeting?: boolean;
  headerContent?: React.ReactNode;
}

export default function TeacherLayout({
  children,
  activeNavId,
  navItems,
  onNavigate,
  onExploreWebsite,
  showHeader = true,
  hideHeaderGreeting = false,
  headerContent
}: TeacherLayoutProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout, profile } = useAuth();

  const getWelcomeMessage = () => {
    const name = profile?.name?.split(' ')[0] || 'Teacher';
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return (
        <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
          Good morning, <strong className="font-extrabold">{name}</strong>
        </span>
      );
    } else if (hour < 17) {
      return (
        <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
          Good afternoon, <strong className="font-extrabold">{name}</strong>
        </span>
      );
    } else {
      return (
        <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
          Good evening, <strong className="font-extrabold">{name}</strong>
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar - Mobile */}
      <nav className="bg-[#2d5ddc] border-b border-white/10 fixed top-0 left-0 right-0 z-40 md:hidden pt-safe">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-white hover:text-gray-200"
                data-testid="button-mobile-menu"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Logo size="md" variant="white" type="teacher" />
            </div>
          </div>
        </div>
      </nav>

      {/* Left Sidebar - Slide-in on mobile, fixed on desktop */}
      <div className={`${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed left-0 top-0 md:top-0 h-full w-64 border-r border-white/10 z-50 bg-[#2d5ddc] transition-transform duration-300`}>
        <div className="flex flex-col h-full py-4">
          
          {/* Logo - Desktop only */}
          <div className="mb-4 px-4 hidden md:block" data-testid="sidebar-logo">
            <Logo size="md" variant="white" type="teacher" />
          </div>
          
          {/* Navigation Items */}
          <nav className="flex flex-col space-y-1 px-3 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavId === item.id;
              const buttonClasses = `flex w-full items-center justify-start rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`;
              
              if (item.href) {
                return (
                  <Link 
                    key={item.id} 
                    href={item.href}
                    className={buttonClasses}
                    onClick={() => setShowMobileMenu(false)}
                    data-testid={item.testId}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              }
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={buttonClasses}
                  onClick={() => { 
                    item.onClick?.(); 
                    setShowMobileMenu(false); 
                  }}
                  data-testid={item.testId}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-white/10 space-y-2 flex-shrink-0">
            <Button
              size="sm"
              className="w-full bg-[#c4ee3d] hover:bg-[#c4ee3d]/90 text-black font-medium"
              onClick={() => { 
                openExternalUrl('https://edufiliova.com'); 
                setShowMobileMenu(false); 
              }}
              data-testid="nav-explore-website"
            >
              <FaGlobe className="h-4 w-4 mr-2" />
              Explore Website
            </Button>
            <Button
              size="sm"
              className="w-full bg-[#fe5831] hover:bg-[#e64d2e] text-white font-medium"
              onClick={async () => {
                setIsLoggingOut(true);
                setShowMobileMenu(false);
                await logout();
              }}
              disabled={isLoggingOut}
              data-testid="nav-logout"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 md:pt-0 md:ml-64 transition-all duration-300">
        {/* Header */}
        {showHeader && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                {!hideHeaderGreeting && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <h1>{getWelcomeMessage()}</h1>
                    </div>
                    <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                      {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Badge>
                  </div>
                )}
                {headerContent}
              </div>
            </div>
          </div>
        )}
        
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}

// Export common navigation icons for reuse
export const NavIcons = {
  Home,
  Users,
  BookOpen,
  GraduationCap,
  Plus,
  MessageCircle,
  ClipboardList,
  Calendar,
  DollarSign,
  Package,
  Wallet,
  Settings,
  Bell,
  MessageSquare,
  Clock,
  ShoppingBag,
  Download,
  FileText,
  BookMarked,
  LayoutGrid,
  Video
};
