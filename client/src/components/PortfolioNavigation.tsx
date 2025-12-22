import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { ChevronDown } from "lucide-react";

interface PortfolioNavigationProps {
  onNavigate: (page: string) => void;
  hideDashboardButton?: boolean;
  hideNavItems?: boolean;
}

const PortfolioNavigation = ({ onNavigate, hideDashboardButton = false, hideNavItems = false }: PortfolioNavigationProps) => {
  const { user, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: "home", label: "Home", hasDropdown: false },
    { id: "portfolio-gallery", label: "Explore", hasDropdown: true },
    { id: "community", label: "Find Talent", hasDropdown: true }
  ];

  const handleLogin = () => {
    // Direct to freelancer login
    window.location.href = '?page=freelancer-signup&mode=signin';
  };

  const handleSignUp = () => {
    // Direct to freelancer signup
    window.location.href = '?page=freelancer-signup&mode=signup';
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-6 md:px-10 lg:px-14">
        {/* Navigation Bar - Logo on Left, Centered Navigation Items */}
        {!hideNavItems && (
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate('home')}>
              <Logo />
            </div>
            
            {/* Centered Navigation Items */}
            <div className="flex items-center space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="flex items-center gap-1 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
                  data-testid={`nav-${item.id}`}
                >
                  {item.label}
                  {item.hasDropdown && (
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Spacer for centering */}
            <div className="flex-shrink-0 w-[88px]"></div>
          </div>
        )}

        {/* Mobile Navigation */}
        <div className={`md:hidden border-t border-gray-100 py-4 space-y-2 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              data-testid={`mobile-nav-${item.id}`}
            >
              {item.label}
            </button>
          ))}
          {user && profile ? (
            !hideDashboardButton && (
              <div className="px-4 pt-4">
                <Button
                  onClick={() => {
                    if (profile.role === 'freelancer') {
                      onNavigate("freelancer-dashboard");
                    } else if (profile.role === 'admin') {
                      onNavigate("admin-dashboard");
                    } else if (profile.role === 'teacher') {
                      onNavigate("teacher-dashboard");
                    } else if (profile.role === 'general') {
                      onNavigate("customer-dashboard");
                    } else {
                      onNavigate("student-dashboard");
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  size="sm"
                  className="w-full bg-[#2d5ddd] hover:bg-[#1e3a8a] text-white"
                  data-testid="mobile-nav-dashboard"
                >
                  Dashboard
                </Button>
              </div>
            )
          ) : (
            <div className="px-4 pt-4 space-y-2">
              <Button
                onClick={() => {
                  handleSignUp();
                  setIsMobileMenuOpen(false);
                }}
                size="sm"
                className="w-full bg-[#ff5834] hover:bg-[#e14a2b] text-white"
              >
                Sign up
              </Button>
              <Button
                onClick={() => {
                  handleLogin();
                  setIsMobileMenuOpen(false);
                }}
                size="sm"
                className="w-full bg-[#2d5ddd] hover:bg-[#1e3a8a] text-white"
              >
                Log in
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default PortfolioNavigation;
