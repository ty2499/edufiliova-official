import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Star,
  MapPin,
  DollarSign,
  MessageCircle,
  Users,
  Eye,
  SlidersHorizontal,
  X,
  Menu,
  Heart,
  Briefcase,
  Grid3x3,
  List
} from 'lucide-react';
import { TalentHeroSection } from '@/components/HeroSectionDisplay';
import { TalentPageAd } from '@/components/BannerAdDisplay';
import { useFreelancerChat } from '@/contexts/FreelancerChatContext';

// Types
interface FreelancersApiResponse {
  success: boolean;
  data: FreelancerProfile[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

interface FreelancerProfile {
  id: string;
  name: string;
  displayName: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  title: string | null;
  skills: string[];
  hourlyRate: number | null;
  location: string | null;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  isOnline: boolean;
  profileViews: number;
  joinedAt: string;
  verificationBadge?: string;
  responseTime?: string;
  workAvailability?: string;
  likesCount?: number;
  worksShared?: number;
}

type SortOption = 'recent' | 'rating' | 'price-low' | 'price-high' | 'reviews';
type ViewMode = 'grid' | 'list';

interface FindTalentProps {
  onNavigate?: (page: string, transition?: string) => void;
  context?: 'public' | 'dashboard';
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`;
  }
  return count.toString();
}

export function FindTalent({ onNavigate, context = 'public' }: FindTalentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  
  const filtersRef = useRef<HTMLDivElement>(null);
  
  // Authentication hook
  const { user, profile } = useAuth();
  
  // Freelancer chat context
  const { setIsChatOpen, setFreelancerInfo, setCurrentUserId } = useFreelancerChat();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 12;

  // Build query parameters object for hierarchical React Query key
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      sort: sortBy,
      page: currentPage,
      limit: pageLimit
    };
    
    if (searchQuery) {
      params.search = searchQuery;
    }
    if (selectedSkills.length > 0) {
      params.skills = selectedSkills.join(',');
    }
    if (selectedLocation) {
      params.location = selectedLocation;
    }
    if (priceRange.min > 0) {
      params.minRate = priceRange.min;
    }
    if (priceRange.max < 1000) {
      params.maxRate = priceRange.max;
    }
    
    return params;
  }, [searchQuery, selectedSkills, selectedLocation, priceRange, sortBy, currentPage]);

  // Fetch real freelancers from API using hierarchical React Query key
  const { data: freelancersResponse, isLoading, error, refetch } = useQuery<FreelancersApiResponse>({
    queryKey: ['/api/freelancers', queryParams],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const displayFreelancers: FreelancerProfile[] = Array.isArray(freelancersResponse) ? freelancersResponse : freelancersResponse?.data || [];
  
  // Fetch default freelancer cover
  const { data: defaultCoverData } = useQuery({
    queryKey: ['/api/system-settings/freelancer-default-cover'],
    queryFn: async () => {
      const response = await fetch('/api/system-settings/freelancer-default-cover');
      if (!response.ok) return { url: null };
      const data = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000
  });

  // Extract available skills for filtering from all freelancers
  const availableSkills: string[] = useMemo(() => {
    if (!displayFreelancers.length) return [];
    return Array.from(new Set(displayFreelancers.flatMap((f: FreelancerProfile) => f.skills || []))).sort();
  }, [displayFreelancers]);

  // Handle click outside to close filters
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const handleContactFreelancer = (freelancer: FreelancerProfile) => {
    if (!user || !profile) return;
    if (user.id === freelancer.id) return;

    // Set the freelancer info and user ID in the chat context
    setFreelancerInfo({
      id: freelancer.id,
      name: freelancer.displayName || freelancer.name,
      avatarUrl: freelancer.avatarUrl || undefined,
      professionalTitle: freelancer.title || undefined
    });
    
    setCurrentUserId(profile.id);
    setIsChatOpen(true);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSkills, selectedLocation, priceRange.min, priceRange.max, sortBy]);

  const FreelancerCard = ({ freelancer, variant = 'grid' }: { freelancer: FreelancerProfile; variant?: 'grid' | 'list' }) => {
    const handleClick = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'freelancer-profile');
      url.searchParams.set('freelancerId', freelancer.id);
      window.history.pushState({}, '', url);
      onNavigate?.('freelancer-profile', 'slide-right');
    };

    if (variant === 'list') {
      return (
        <Card 
          className="rounded-2xl bg-white text-[#1F1E30] border-gray-100 group cursor-pointer transition-all duration-300 overflow-hidden border-0 w-full hover:shadow-lg"
          onClick={handleClick}
          data-testid={`freelancer-card-${freelancer.id}`}
        >
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row gap-4 p-4">
              {/* Left: Avatar and Cover Preview */}
              <div className="flex items-start gap-3 sm:w-64 flex-shrink-0">
                <Avatar className="h-16 w-16 border-3 border-gray-200 shadow-sm flex-shrink-0">
                  <AvatarImage src={freelancer.avatarUrl || undefined} />
                  <AvatarFallback className="text-lg font-medium bg-blue-100 text-gray-700">
                    {freelancer.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'FL'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  {/* Name with Verification Badge */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {(() => {
                        const fullName = freelancer.displayName || freelancer.name;
                        const nameParts = fullName.split(' ');
                        if (nameParts.length > 1) {
                          const firstName = nameParts.slice(0, -1).join(' ');
                          const lastName = nameParts[nameParts.length - 1];
                          return (
                            <>
                              <span className="font-normal">{firstName}</span>{' '}
                              <span className="font-bold">{lastName}</span>
                            </>
                          );
                        }
                        return <span className="font-bold">{fullName}</span>;
                      })()}
                    </h3>
                    {freelancer.verificationBadge && freelancer.verificationBadge !== 'none' && (
                      freelancer.verificationBadge === 'blue' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0">
                          <g clipPath="url(#clip0_list_badge_blue)">
                            <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                            <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                          </g>
                          <defs>
                            <clipPath id="clip0_list_badge_blue">
                              <rect width="24" height="24" fill="#fff" />
                            </clipPath>
                          </defs>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0">
                          <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                        </svg>
                      )
                    )}
                  </div>

                  {/* Title */}
                  {freelancer.title && (
                    <p className="text-gray-700 text-sm mb-2 line-clamp-1">{freelancer.title}</p>
                  )}

                  {/* Location */}
                  {freelancer.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-600">{freelancer.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle: Stats and Info */}
              <div className="flex-1 flex flex-col justify-center gap-3">
                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-4">
                  {freelancer.hourlyRate && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">${freelancer.hourlyRate}/hr</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{freelancer.likesCount || 0}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{freelancer.worksShared || 0}</span>
                  </div>
                </div>
              </div>

              {/* Right: Contact Button */}
              <div className="flex items-center sm:w-40 flex-shrink-0">
                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm h-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactFreelancer(freelancer);
                  }}
                  data-testid={`contact-freelancer-${freelancer.id}`}
                >
                  Get in Touch
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card 
        className="rounded-2xl bg-white text-[#1F1E30] border-gray-100 group cursor-pointer transition-all duration-300 overflow-hidden border-0 w-full"
        onClick={handleClick}
        data-testid={`freelancer-card-${freelancer.id}`}
      >
        <CardContent className="p-0">
        {/* Cover Image Section */}
        <div 
          className="relative h-32 rounded-t-2xl overflow-hidden bg-gray-200"
          style={freelancer.coverImageUrl ? { backgroundImage: `url(${freelancer.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : (defaultCoverData?.url && defaultCoverData.url !== null) ? { backgroundImage: `url(${defaultCoverData.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        />

        {/* Content Section with Profile on Left */}
        <div className="px-4 pb-4 relative">
          {/* Profile Picture on Left Side */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-16 w-16 border-4 border-white flex-shrink-0 -mt-10 relative z-10">
              <AvatarImage src={freelancer.avatarUrl || undefined} />
              <AvatarFallback className="text-lg font-medium bg-blue-100 text-gray-700">
                {freelancer.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'FL'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 pt-2 relative z-10">
              {/* Name with Verification Badge */}
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                  {(() => {
                    const fullName = freelancer.displayName || freelancer.name;
                    const nameParts = fullName.split(' ');
                    if (nameParts.length > 1) {
                      const firstName = nameParts.slice(0, -1).join(' ');
                      const lastName = nameParts[nameParts.length - 1];
                      return (
                        <>
                          <span className="font-normal">{firstName}</span>{' '}
                          <span className="font-bold">{lastName}</span>
                        </>
                      );
                    }
                    return <span className="font-bold">{fullName}</span>;
                  })()}
                </h3>
                {freelancer.verificationBadge && freelancer.verificationBadge !== 'none' && (
                  freelancer.verificationBadge === 'blue' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0">
                      <g clipPath="url(#clip0_343_1428_findtalent_badge)">
                        <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                        <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                      </g>
                      <defs>
                        <clipPath id="clip0_343_1428_findtalent_badge">
                          <rect width="24" height="24" fill="#fff" />
                        </clipPath>
                      </defs>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0">
                      <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                    </svg>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Title - Allow 2 lines */}
          {freelancer.title && (
            <p className="text-gray-700 text-xs mb-2 line-clamp-2 leading-relaxed">{freelancer.title}</p>
          )}

          {/* Location */}
          {freelancer.location && (
            <div className="flex items-center gap-1 mb-2">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600">{freelancer.location}</span>
            </div>
          )}

          {/* Stats Row - Redesigned with Icons */}
          <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-gray-100">
            {/* Hourly Rate */}
            {freelancer.hourlyRate && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-900">${freelancer.hourlyRate}/hr</span>
              </div>
            )}

            {/* Likes - Total for all projects */}
            <div className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-900">{formatCount(freelancer.likesCount || 0)}</span>
            </div>

            {/* Works Shared */}
            <div className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-900">{formatCount(freelancer.worksShared || 0)}</span>
            </div>
          </div>

          {/* Contact Button - Hidden on mobile */}
          <Button
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm h-8 hidden md:block"
            onClick={(e) => {
              e.stopPropagation();
              handleContactFreelancer(freelancer);
            }}
            data-testid={`contact-freelancer-${freelancer.id}`}
          >
            Get in Touch
          </Button>
        </div>
      </CardContent>
    </Card>
    );
  };

  return (
    <div className="min-h-screen bg-white" data-testid="find-talent">
      {/* Hero Section with Search and Filters */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search projects and people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-6 h-14 text-base bg-gray-50 border-gray-200 rounded-full focus-visible:ring-2 focus-visible:ring-blue-500 font-['StackSans_Text']"
                data-testid="input-search-freelancers"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center justify-between mb-6">
            {/* Category Pills */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-1">
              {/* Filters Button */}
              <div className="relative flex-shrink-0" ref={filtersRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-10 px-4 rounded-full border-gray-300 bg-white hover:bg-gray-50 font-['StackSans_Text']"
                  data-testid="button-filters"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                
                {/* Filters Dropdown */}
                {showFilters && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 font-['StackSans_Headline']">
                          Filter Talent
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFilters(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Skills Filter */}
                      {availableSkills.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block font-['StackSans_Text']">Skills</label>
                          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {availableSkills.slice(0, 20).map((skill: string) => (
                              <Button
                                key={skill}
                                variant={selectedSkills.includes(skill) ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSkill(skill)}
                                className="text-xs h-8 px-3 rounded-full font-['StackSans_Text']"
                                data-testid={`filter-skill-${skill.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                              >
                                {skill}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Location Filter */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block font-['StackSans_Text']">Location</label>
                        <Input
                          placeholder="City, Country"
                          value={selectedLocation}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                          className="w-full rounded-lg font-['StackSans_Text']"
                          data-testid="input-location-filter"
                        />
                      </div>

                      {/* Price Range Filter */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block font-['StackSans_Text']">
                          Hourly Rate: ${priceRange.min} - ${priceRange.max === 1000 ? '1000+' : priceRange.max}
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={priceRange.min || ''}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                            className="w-full rounded-lg font-['StackSans_Text']"
                            data-testid="input-min-rate"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={priceRange.max === 1000 ? '' : priceRange.max}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 1000 }))}
                            className="w-full rounded-lg font-['StackSans_Text']"
                            data-testid="input-max-rate"
                          />
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {(selectedSkills.length > 0 || selectedLocation || priceRange.min > 0 || priceRange.max < 1000) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSkills([]);
                            setSelectedLocation('');
                            setPriceRange({ min: 0, max: 1000 });
                          }}
                          className="w-full rounded-lg font-['StackSans_Text']"
                          data-testid="button-clear-filters"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-40 h-10 rounded-lg border-gray-300 bg-white font-['StackSans_Text']" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Most Recent</SelectItem>
                  <SelectItem value="recent">Recently Joined</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex gap-1 border border-gray-300 rounded-lg p-1 bg-white">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-10 p-0"
                  data-testid="button-grid-view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-10 p-0"
                  data-testid="button-list-view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white px-6 py-10 max-w-7xl mx-auto">
        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse w-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-primary-600 mb-4">
              <h3 className="text-lg font-medium mb-2">Error Loading Freelancers</h3>
              <p className="text-gray-600">Failed to fetch freelancer profiles. Please try again.</p>
            </div>
            <Button
              onClick={() => refetch()}
              className="bg-primary hover:bg-primary text-white"
              data-testid="button-retry-freelancers"
            >
              Try Again
            </Button>
          </div>
        ) : displayFreelancers && displayFreelancers.length > 0 ? (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10' : 'flex flex-col gap-4'}>
              {displayFreelancers.map((freelancer: FreelancerProfile) => (
                <FreelancerCard key={freelancer.id} freelancer={freelancer} variant={viewMode} />
              ))}
            </div>
            
            {/* Talent Page Ads */}
            <div className="mt-8">
              <TalentPageAd />
            </div>
            
            {/* Pagination Controls */}
            {displayFreelancers.length >= pageLimit && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={displayFreelancers.length < pageLimit}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedSkills.length > 0 ? 'No freelancers match your criteria' : 'No freelancers found'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || selectedSkills.length > 0 
                ? 'Try adjusting your search criteria or filters.' 
                : 'Check back later for available talent.'}
            </p>
            {(searchQuery || selectedSkills.length > 0 || selectedLocation || priceRange.min > 0 || priceRange.max < 1000) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSkills([]);
                  setSelectedLocation('');
                  setPriceRange({ min: 0, max: 1000 });
                  setCurrentPage(1);
                }}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
