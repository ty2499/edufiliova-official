import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, Briefcase, TrendingUp, Eye, MousePointer } from 'lucide-react';

interface SponsoredListing {
  id: string;
  itemType: 'course' | 'freelancer_project';
  itemId: string;
  status: string;
  impressions: number;
  clicks: number;
  // Additional item details would come from joined data
  itemTitle?: string;
  itemDescription?: string;
  itemPrice?: string;
  itemImageUrl?: string;
}

interface SponsoredListingDisplayProps {
  itemType?: 'course' | 'freelancer_project';
  limit?: number;
  className?: string;
  showStats?: boolean;
}

export function SponsoredListingDisplay({ 
  itemType, 
  limit = 3, 
  className,
  showStats = false 
}: SponsoredListingDisplayProps) {
  const { data: sponsoredListings = [] } = useQuery<SponsoredListing[]>({
    queryKey: ['/api/ads/sponsored/active', { itemType }],
    queryFn: async () => {
      const params = itemType ? `?itemType=${itemType}` : '';
      const response = await apiRequest(`/api/ads/sponsored/active${params}`);
      return response.data || [];
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const trackImpressionMutation = useMutation({
    mutationFn: async (adId: string) => {
      await apiRequest('/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          adType: 'sponsored'
        })
      });
    },
  });

  const trackClickMutation = useMutation({
    mutationFn: async (adId: string) => {
      await apiRequest('/api/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          adType: 'sponsored'
        })
      });
    },
  });

  // Track impressions when sponsored listings are loaded
  useEffect(() => {
    sponsoredListings.forEach(listing => {
      trackImpressionMutation.mutate(listing.id);
    });
  }, [sponsoredListings]);

  const handleSponsoredClick = (listing: SponsoredListing) => {
    // Track the click
    trackClickMutation.mutate(listing.id);
    
    // Navigate to the item (course or project page)
    const basePath = listing.itemType === 'course' ? '/courses' : '/projects';
    window.location.href = `${basePath}/${listing.itemId}`;
  };

  if (sponsoredListings.length === 0) {
    return null;
  }

  const displayListings = sponsoredListings.slice(0, limit);

  return (
    <div className={cn('sponsored-listings-container space-y-4', className)}>
      {/* Sponsored section header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sponsored {itemType === 'course' ? 'Courses' : itemType === 'freelancer_project' ? 'Projects' : 'Content'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayListings.map((listing) => (
          <Card 
            key={listing.id}
            className="relative cursor-pointer border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-950/70 dark:hover:to-amber-950/70 transition-all duration-200 hover:shadow-md"
            onClick={() => handleSponsoredClick(listing)}
            data-testid={`sponsored-listing-${listing.id}`}
          >
            {/* Sponsored badge */}
            <Badge 
              variant="secondary" 
              className="absolute top-3 right-3 bg-primary text-white text-xs z-10"
              data-testid={`sponsored-badge-${listing.id}`}
            >
              Sponsored
            </Badge>

            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {listing.itemType === 'course' ? (
                  <BookOpen className="h-4 w-4 text-orange-600" />
                ) : (
                  <Briefcase className="h-4 w-4 text-orange-600" />
                )}
                <span className="line-clamp-1">
                  {listing.itemTitle || `${listing.itemType.replace('_', ' ')} #${listing.itemId.slice(0, 8)}`}
                </span>
              </CardTitle>
              {listing.itemDescription && (
                <CardDescription className="line-clamp-2 text-sm">
                  {listing.itemDescription}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Item image placeholder or thumbnail */}
                {listing.itemImageUrl ? (
                  <div className="w-full h-32 rounded-lg overflow-hidden">
                    <img
                      src={listing.itemImageUrl}
                      alt={listing.itemTitle || 'Sponsored content'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg flex items-center justify-center">
                    {listing.itemType === 'course' ? (
                      <BookOpen className="h-12 w-12 text-orange-400" />
                    ) : (
                      <Briefcase className="h-12 w-12 text-orange-400" />
                    )}
                  </div>
                )}

                {/* Price or action button area */}
                <div className="flex items-center justify-between">
                  {listing.itemPrice && (
                    <div className="font-semibold text-orange-600">
                      ${listing.itemPrice}
                    </div>
                  )}
                  
                  <Button 
                    size="sm" 
                    className="ml-auto bg-primary hover:bg-orange-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSponsoredClick(listing);
                    }}
                  >
                    View Details
                  </Button>
                </div>

                {/* Performance stats for admins or owners */}
                {showStats && (
                  <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{listing.impressions}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      <span>{listing.clicks}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Specific components for different item types
export function SponsoredCourses({ 
  limit = 3, 
  className, 
  showStats = false 
}: Omit<SponsoredListingDisplayProps, 'itemType'>) {
  return (
    <SponsoredListingDisplay 
      itemType="course" 
      limit={limit} 
      className={className}
      showStats={showStats}
    />
  );
}

export function SponsoredProjects({ 
  limit = 3, 
  className, 
  showStats = false 
}: Omit<SponsoredListingDisplayProps, 'itemType'>) {
  return (
    <SponsoredListingDisplay 
      itemType="freelancer_project" 
      limit={limit} 
      className={className}
      showStats={showStats}
    />
  );
}

// Promote button component to be used on course/project pages
interface PromoteButtonProps {
  itemType: 'course' | 'freelancer_project';
  itemId: string;
  itemTitle: string;
  className?: string;
}

export function PromoteButton({ itemType, itemId, itemTitle, className }: PromoteButtonProps) {
  const handlePromoteClick = () => {
    // Navigate to sponsored listing form with pre-filled data
    const params = new URLSearchParams({
      type: itemType,
      id: itemId,
      title: itemTitle
    });
    window.location.href = `/promote?${params.toString()}`;
  };

  return (
    <Button
      onClick={handlePromoteClick}
      variant="outline"
      size="sm"
      className={cn(
        'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/30',
        className
      )}
      data-testid={`promote-button-${itemId}`}
    >
      <TrendingUp className="h-4 w-4 mr-1" />
      Promote This
    </Button>
  );
}
