import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { openExternalUrl, isInCordovaApp, getBaseUrl } from '@/lib/utils';

type LogoType = 'home' | 'student' | 'teacher' | 'freelancer' | 'customer' | 'footer' | 'auth';
type LogoSize = 'square' | 'wide';

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "white" | "dark";
  type?: LogoType;
  logoSize?: LogoSize;
  onClick?: () => void;
  className?: string;
  disableHomeNavigation?: boolean;
}

const Logo = ({ size = "md", variant = "default", type = "home", logoSize = "square", onClick, className = "", disableHomeNavigation = false }: LogoProps) => {
  const [, navigate] = useLocation();
  // Fetch primary logo size (preferred)
  const { data: primaryLogo } = useQuery({
    queryKey: ['system-settings', 'logo', type, logoSize],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/admin/settings/logo/${type}/${logoSize}`);
        return response.logoUrl || null;
      } catch (error) {
        return null;
      }
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000 // 10 minutes
  });

  // Fetch alternate logo size as fallback
  const alternateSize = logoSize === 'square' ? 'wide' : 'square';
  const { data: alternateLogo } = useQuery({
    queryKey: ['system-settings', 'logo', type, alternateSize],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/admin/settings/logo/${type}/${alternateSize}`);
        return response.logoUrl || null;
      } catch (error) {
        return null;
      }
    },
    enabled: !primaryLogo, // Only fetch alternate if primary doesn't exist
    staleTime: 300000, // 5 minutes
    gcTime: 600000 // 10 minutes
  });

  // Use primary logo if available, otherwise use alternate
  const customLogo = primaryLogo || alternateLogo;

  const sizeClasses = {
    sm: {
      container: "w-8 h-8",
      icon: "h-4 w-4",
      text: "text-lg"
    },
    md: {
      container: "w-10 h-10",
      icon: "h-6 w-6",
      text: "text-2xl"
    },
    lg: {
      container: "w-12 h-12",
      icon: "h-7 w-7",
      text: "text-3xl"
    },
    xl: {
      container: "w-16 h-16",
      icon: "h-9 w-9",
      text: "text-4xl"
    },
    "2xl": {
      container: "w-24 h-24",
      icon: "h-14 w-14",
      text: "text-5xl"
    }
  };

  const currentSize = sizeClasses[size];

  if (!customLogo) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (!disableHomeNavigation) {
      if (isInCordovaApp()) {
        // In Cordova app - open main website in system browser (outside the app)
        openExternalUrl(getBaseUrl());
      } else {
        // In web browser - use client-side navigation (instant, no page reload)
        localStorage.setItem('force_home_navigation', 'true');
        navigate('/');
      }
    }
  };

  return (
    <div 
      className={`flex items-center space-x-1 animate-fade-in ${!disableHomeNavigation ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity ${className}`}
      onClick={!disableHomeNavigation ? handleClick : undefined}
      data-testid="logo-home-link"
    >
      <img 
        src={customLogo} 
        alt="Custom Logo" 
        className="object-contain transition-all duration-300"
        style={{ height: currentSize.container.includes('w-8') ? '32px' : 
                         currentSize.container.includes('w-10') ? '40px' :
                         currentSize.container.includes('w-12') ? '48px' :
                         currentSize.container.includes('w-16') ? '64px' : '96px' }}
        data-testid="custom-logo-image"
      />
    </div>
  );
};

export default Logo;
