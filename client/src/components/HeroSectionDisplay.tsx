import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, ExternalLink } from 'lucide-react';

interface HeroSection {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  placement: string;
  desktopImageUrl: string;
  tabletImageUrl: string;
  mobileImageUrl: string;
  linkUrl?: string;
  buttonText?: string;
  secondButtonText?: string;
  secondButtonUrl?: string;
  status: string;
  priority: number;
  startDate?: string;
  endDate?: string;
  textColor: string;
  backgroundColor: string;
  overlayOpacity: number;
  isFullHeight: boolean;
  customHeight?: string;
  contentAlignment: string;
  impressions: number;
  clicks: number;
}

interface HeroSectionDisplayProps {
  placement: 'home' | 'about' | 'contact' | 'shop' | 'shop_auth' | 'courses' | 'portfolio' | 'community' | 'talent' | 'auth' | 'freelancer' | 'blog';
  className?: string;
  showOverlay?: boolean;
}

export function HeroSectionDisplay({ placement, className, showOverlay = true }: HeroSectionDisplayProps) {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  
  // Update window width on resize to recalculate aspect ratios
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { data: heroes = [], isLoading } = useQuery<HeroSection[]>({
    queryKey: ['/api/hero-sections/active', { placement }],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/hero-sections/active?placement=${placement}`);
        if (!response.ok) {
          throw new Error('Failed to fetch hero sections');
        }
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        console.error('Error fetching hero sections:', error);
        return [];
      }
    },
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  const trackImpressionMutation = useMutation({
    mutationFn: async (heroId: string) => {
      await apiRequest('/api/hero-sections/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroId })
      });
    },
  });

  const trackClickMutation = useMutation({
    mutationFn: async (heroId: string) => {
      await apiRequest('/api/hero-sections/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroId })
      });
    },
  });

  // Track impressions when heroes are loaded
  useEffect(() => {
    if (heroes.length > 0) {
      trackImpressionMutation.mutate(heroes[currentHeroIndex].id);
    }
  }, [heroes, currentHeroIndex]);

  // Auto-rotate through heroes when there are multiple
  useEffect(() => {
    if (heroes.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prevIndex) => (prevIndex + 1) % heroes.length);
      }, 8000); // Change hero every 8 seconds
      
      return () => clearInterval(interval);
    }
  }, [heroes.length]);

  const handleHeroClick = (hero: HeroSection, url?: string) => {
    const targetUrl = url || hero.linkUrl;
    if (targetUrl) {
      // Track the click for analytics
      trackClickMutation.mutate(hero.id);
      
      // Navigate to the URL
      if (targetUrl.startsWith('http') || targetUrl.startsWith('https')) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    }
  };

  if (isLoading) {
    return (
      <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg', className)}>
        <div className="h-24 md:h-32 lg:h-48 w-full" />
      </div>
    );
  }

  if (heroes.length === 0) {
    return null;
  }

  const currentHero = heroes[currentHeroIndex];
  
  // Placement-specific aspect ratios based on configured dimensions
  const PLACEMENT_ASPECT_RATIOS = {
    home: {
      desktop: 1920 / 1080,  // 16:9
      tablet: 1024 / 768,    // 4:3
      mobile: 375 / 300      // 5:4
    },
    about: {
      desktop: 1440 / 800,   // 9:5
      tablet: 768 / 480,     // 8:5
      mobile: 375 / 300      // 5:4
    },
    contact: {
      desktop: 1200 / 600,   // 2:1
      tablet: 768 / 400,     // ~1.92:1
      mobile: 375 / 250      // 3:2
    },
    shop: {
      desktop: 1600 / 900,   // 16:9
      tablet: 1024 / 600,    // ~1.7:1
      mobile: 375 / 300      // 5:4
    },
    shop_auth: {
      desktop: 960 / 1080,   // ~8:9 (portrait-ish for split)
      tablet: 512 / 768,     // ~2:3
      mobile: 375 / 667      // ~9:16
    },
    courses: {
      desktop: 1440 / 810,   // 16:9
      tablet: 768 / 480,     // 8:5
      mobile: 375 / 300      // 5:4
    },
    portfolio: {
      desktop: 1920 / 1080,  // 16:9
      tablet: 1024 / 768,    // 4:3
      mobile: 375 / 300      // 5:4
    },
    community: {
      desktop: 1440 / 800,   // 9:5
      tablet: 768 / 480,     // 8:5
      mobile: 375 / 300      // 5:4
    },
    advertise: {
      desktop: 1200 / 600,   // 2:1
      tablet: 768 / 400,     // ~1.92:1
      mobile: 375 / 250      // 3:2
    },
    talent: {
      desktop: 1440 / 900,   // 8:5
      tablet: 768 / 480,     // 8:5
      mobile: 375 / 300      // 5:4
    },
    auth: {
      desktop: 960 / 1080,   // ~8:9 (portrait-ish for split)
      tablet: 512 / 768,     // ~2:3
      mobile: 375 / 667      // ~9:16
    },
    freelancer: {
      desktop: 960 / 1080,   // ~8:9 (portrait-ish for split)
      tablet: 512 / 768,     // ~2:3
      mobile: 375 / 667      // ~9:16
    },
    blog: {
      desktop: 1440 / 400,   // Wide banner for blog
      tablet: 768 / 300,     // Tablet banner
      mobile: 375 / 200      // Mobile banner
    }
  } as const;

  // Get responsive image based on screen size (simplified approach like banner ads)
  const getResponsiveImageUrl = () => {
    // Use window width to determine best image
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 768) {
        return currentHero.mobileImageUrl || currentHero.desktopImageUrl;
      } else if (width <= 1024) {
        return currentHero.tabletImageUrl || currentHero.desktopImageUrl;
      }
    }
    return currentHero.desktopImageUrl;
  };

  // Get aspect ratio based on screen size and placement
  const getAspectRatio = () => {
    const ratios = PLACEMENT_ASPECT_RATIOS[currentHero.placement as keyof typeof PLACEMENT_ASPECT_RATIOS] 
      || PLACEMENT_ASPECT_RATIOS.home;
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 768) {
        return ratios.mobile;
      } else if (width <= 1024) {
        return ratios.tablet;
      }
    }
    return ratios.desktop;
  };

  // Get height classes and style - Check if parent wants full height or use aspect ratio
  const getHeightConfig = () => {
    // If parent container passes explicit h-full in className (not md:h-full), respect it
    const hasExplicitFullHeight = className?.match(/(?:^|\s)h-full(?:\s|$)/) !== null;
    if (hasExplicitFullHeight) {
      return {
        className: 'h-full',
        style: {}
      };
    }
    
    // If custom height is specified, use it
    if (!currentHero.isFullHeight && currentHero.customHeight) {
      return {
        className: '',
        style: { height: currentHero.customHeight }
      };
    }

    // Use aspect-ratio with max-height constraints to prevent excessive size
    const aspectRatio = getAspectRatio();
    const width = windowWidth;
    
    // Set reasonable max-heights based on screen size
    let maxHeight: string;
    if (width <= 768) {
      maxHeight = '400px'; // Mobile: max 400px tall
    } else if (width <= 1024) {
      maxHeight = '500px'; // Tablet: max 500px tall
    } else {
      maxHeight = '600px'; // Desktop: max 600px tall
    }
    
    return {
      className: '',
      style: { 
        aspectRatio: aspectRatio.toString(),
        maxHeight: maxHeight
      }
    };
  };

  // Get content alignment classes
  const getAlignmentClasses = () => {
    switch (currentHero.contentAlignment) {
      case 'left':
        return 'text-left items-start justify-start';
      case 'right':
        return 'text-right items-end justify-end';
      case 'center':
      default:
        return 'text-center items-center justify-center';
    }
  };

  const { className: heightClassName, style: heightStyle } = getHeightConfig();
  
  const hasExplicitFullHeight = className?.match(/(?:^|\s)h-full(?:\s|$)/) !== null;
  
  return (
    <div className={cn('relative overflow-hidden', hasExplicitFullHeight ? 'h-full' : '', className)}>
      <div
        key={currentHero.id}
        className={cn('relative w-full bg-cover bg-top bg-no-repeat transition-all duration-1000 h-full')}
        data-testid={`hero-section-${currentHero.id}`}
      >
        {/* Responsive Background Image - Displays full image with proper aspect ratio */}
        <img
          src={getResponsiveImageUrl()}
          alt={currentHero.title}
          className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300"
          loading="lazy"
          onError={(e) => {
            // Fallback hierarchy: try desktop -> tablet -> mobile
            const target = e.target as HTMLImageElement;
            if (target.src !== currentHero.desktopImageUrl) {
              target.src = currentHero.desktopImageUrl;
            } else if (currentHero.tabletImageUrl && target.src !== currentHero.tabletImageUrl) {
              target.src = currentHero.tabletImageUrl;
            } else if (currentHero.mobileImageUrl && target.src !== currentHero.mobileImageUrl) {
              target.src = currentHero.mobileImageUrl;
            }
          }}
          data-testid={`hero-image-${currentHero.id}`}
        />

        {/* Content Container - Buttons moved to bottom (only show if showOverlay is true) */}
        {showOverlay && (
          <div className={cn(
            'relative z-10 h-full flex flex-col px-4 md:px-8 lg:px-12',
            getAlignmentClasses()
          )}>
            <div className="w-full flex flex-col h-full">
              {/* Hero Description - Optional */}
              {currentHero.description && (
                <div className="flex-1 flex items-center">
                  <p 
                    className="text-lg md:text-xl lg:text-2xl leading-relaxed opacity-90"
                    style={{ color: currentHero.textColor }}
                  >
                    {currentHero.description}
                  </p>
                </div>
              )}

              {/* Call-to-Action Buttons - At Bottom */}
              {(currentHero.buttonText || currentHero.secondButtonText) && (
                <div className={cn(
                  'flex gap-4 mt-auto pb-8',
                  currentHero.contentAlignment === 'center' && 'justify-center',
                  currentHero.contentAlignment === 'right' && 'justify-end',
                  currentHero.contentAlignment === 'left' && 'justify-start'
                )}>
                  {/* First Button */}
                  {currentHero.buttonText && (
                    <Button
                      onClick={() => handleHeroClick(currentHero, currentHero.linkUrl)}
                      size="lg"
                      className="px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 transition-all duration-300"
                      style={{
                        backgroundColor: currentHero.textColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
                        color: currentHero.textColor === '#FFFFFF' ? '#FFFFFF' : '#000000',
                      }}
                      data-testid={`hero-cta-button-${currentHero.id}`}
                    >
                      {currentHero.buttonText}
                      {currentHero.linkUrl?.startsWith('http') ? (
                        <ExternalLink className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                      ) : (
                        <ChevronRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                      )}
                    </Button>
                  )}

                  {/* Second Button */}
                  {currentHero.secondButtonText && (
                    <Button
                      onClick={() => handleHeroClick(currentHero, currentHero.secondButtonUrl)}
                      size="lg"
                      variant="outline"
                      className="px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 transition-all duration-300"
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: currentHero.textColor,
                        color: currentHero.textColor,
                      }}
                      data-testid={`hero-second-button-${currentHero.id}`}
                    >
                      {currentHero.secondButtonText}
                      {currentHero.secondButtonUrl?.startsWith('http') ? (
                        <ExternalLink className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                      ) : (
                        <ChevronRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Dots - Show when there are multiple heroes and showOverlay is true */}
        {showOverlay && heroes.length > 1 && (
          <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {heroes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroIndex(index)}
                className={cn(
                  'w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300',
                  index === currentHeroIndex
                    ? 'scale-125 shadow-lg'
                    : 'hover:scale-110'
                )}
                style={{
                  backgroundColor: index === currentHeroIndex 
                    ? currentHero.textColor 
                    : `${currentHero.textColor}80` // 50% opacity
                }}
                aria-label={`Show hero ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Specific placement components for easy usage
export function HomeHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="home" className={className} />;
}

export function AboutHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="about" className={className} />;
}

export function ContactHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="contact" className={className} />;
}

export function ShopHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="shop" className={className} />;
}

export function ShopAuthHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="shop_auth" className={className} />;
}

export function CoursesHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="courses" className={className} />;
}

export function PortfolioHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="portfolio" className={className} />;
}

export function CommunityHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="community" className={className} />;
}

export function TalentHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="talent" className={className} />;
}

export function AuthHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="auth" className={className} />;
}

export function FreelancerHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="freelancer" className={className} />;
}

export function BlogHeroSection({ className }: { className?: string }) {
  return <HeroSectionDisplay placement="blog" className={className} />;
}
