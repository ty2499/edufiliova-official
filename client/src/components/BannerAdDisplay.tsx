import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdBanner {
  id: string;
  imageUrl: string;
  placement: string;
  size: string;
  status: string;
  impressions: number;
  clicks: number;
}

interface BannerAdDisplayProps {
  placement: 'student_dashboard' | 'teacher_dashboard' | 'freelancer_dashboard' | 'customer_dashboard' | 'advertise_page' | 'talent_page';
  className?: string;
}

export function BannerAdDisplay({ placement, className }: BannerAdDisplayProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  
  const { data: ads = [], isLoading, error } = useQuery<AdBanner[]>({
    queryKey: ['/api/ads/active', { placement }],
    queryFn: async () => {
      const response = await fetch(`/api/ads/active?placement=${placement}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ads');
      }
      const result = await response.json();
      return result.data || [];
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const trackImpressionMutation = useMutation({
    mutationFn: async (adId: string) => {
      await apiRequest('/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId })
      });
    },
  });

  const trackClickMutation = useMutation({
    mutationFn: async (adId: string) => {
      await apiRequest('/api/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId })
      });
    },
  });

  // Track impressions when ads are loaded
  useEffect(() => {
    if (ads.length > 0) {
      trackImpressionMutation.mutate(ads[currentAdIndex].id);
    }
  }, [ads, currentAdIndex]);

  // Auto-rotate through ads when there are multiple
  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
      }, 5000); // Change ad every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [ads.length]);

  const handleAdClick = (ad: AdBanner) => {
    // Track the click for analytics
    trackClickMutation.mutate(ad.id);
  };

  if (ads.length === 0) {
    return null;
  }

  // Get the size class for the placement
  const getSizeClass = (size: string) => {
    const sizeClasses = {
      '728x90': 'w-full max-w-[728px] h-[90px]',
      '300x250': 'w-[300px] h-[250px]',
      '336x280': 'w-[336px] h-[280px]',
      'responsive': 'w-full h-auto',
    };
    
    return sizeClasses[size as keyof typeof sizeClasses] || 'w-full h-20';
  };

  // Get responsive classes based on placement
  const getPlacementClasses = (placement: string) => {
    switch (placement) {
      case 'student_dashboard':
      case 'teacher_dashboard':
      case 'freelancer_dashboard':
        return 'mb-6 rounded-lg overflow-hidden shadow-sm';
      case 'advertise_page':
        return 'mb-8 rounded-lg overflow-hidden shadow-md';
      case 'talent_page':
        return 'mb-6 rounded-lg overflow-hidden shadow-sm';
      default:
        return 'mb-4 rounded-lg overflow-hidden';
    }
  };

  const currentAd = ads[currentAdIndex];

  return (
    <div className={cn(getPlacementClasses(placement), className)}>
      <div className="relative">
        <div
          key={currentAd.id}
          className={cn(
            'border border-gray-200 rounded-lg overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-700 transition-all duration-500',
            getSizeClass(currentAd.size)
          )}
          onClick={() => handleAdClick(currentAd)}
          data-testid={`banner-ad-${currentAd.id}`}
        >
          <img
            src={currentAd.imageUrl}
            alt="Advertisement"
            className="w-full h-full object-cover cursor-pointer transition-opacity duration-300 hover:opacity-80" transition-all duration-300
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            Ad
          </div>
        </div>
        
        {/* Show indicators when there are multiple ads - Hidden on mobile */}
        {ads.length > 1 && (
          <div className="hidden md:flex absolute bottom-2 left-1/2 transform -translate-x-1/2 space-x-2">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  index === currentAdIndex
                    ? 'bg-white shadow-lg'
                    : 'bg-white/50 hover:bg-white/75'
                )}
                aria-label={`Show ad ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Specific placement components for easy usage
export function StudentDashboardAd({ className }: { className?: string }) {
  return <BannerAdDisplay placement="student_dashboard" className={className} />;
}

export function TeacherDashboardAd({ className }: { className?: string }) {
  return <BannerAdDisplay placement="teacher_dashboard" className={className} />;
}

export function FreelancerDashboardAd({ className }: { className?: string }) {
  return <BannerAdDisplay placement="freelancer_dashboard" className={className} />;
}

export function CustomerDashboardAd({ className }: { className?: string }) {
  return <BannerAdDisplay placement="customer_dashboard" className={className} />;
}

export function AdvertisePageAd({ className }: { className?: string }) {
  return <BannerAdDisplay placement="advertise_page" className={className} />;
}

export function TalentPageAd({ className }: { className?: string }) {
  return <BannerAdDisplay placement="talent_page" className={className} />;
}

// Responsive banner component that adapts to different placements
export function ResponsiveBannerAd({ 
  placement, 
  className 
}: { 
  placement: 'student_dashboard' | 'teacher_dashboard' | 'freelancer_dashboard' | 'customer_dashboard' | 'advertise_page' | 'talent_page';
  className?: string;
}) {
  return <BannerAdDisplay placement={placement} className={className} />;
}
