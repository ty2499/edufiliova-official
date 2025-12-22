import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { generateSessionId, generateViewData } from '@/lib/visitor-tracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectCover } from '@/components/MediaCarousel';
import { BehanceStyleMobileProfile } from '@/components/BehanceStyleMobileProfile';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { BehanceStyleFeed } from '@/components/MediaCarousel';
import { useFreelancerChat } from '@/contexts/FreelancerChatContext';
import CoverImageUpload from '@/components/CoverImageUpload';
import { 
  ArrowLeft,
  ChevronLeft,
  MapPin,
  Calendar,
  Star,
  Eye,
  Heart,
  MessageCircle,
  Users,
  Briefcase,
  Award,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Share2,
  Plus,
  Clock,
  DollarSign,
  Timer,
  CheckCircle2,
  Verified,
  Target,
  BookOpen,
  TrendingUp,
  Camera,
  Link,
  Building,
  GraduationCap,
  Zap,
  User,
  Package,
  X
} from 'lucide-react';
import { 
  FaLinkedin, 
  FaTwitter, 
  FaInstagram, 
  FaBehance, 
  FaDribbble, 
  FaGithub,
  FaFacebook,
  FaYoutube
} from 'react-icons/fa';

// Loading ring component (Replit-style spinner)
const LoadingRing = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="3"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// Format number with K, M, B suffixes
const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

// Enhanced Types for Behance-style Profile
interface FreelancerProfile {
  id: string;
  name: string;
  displayName: string;
  professionalTitle?: string;
  tagline?: string;
  email: string;
  contactEmail?: string;
  avatarUrl: string | null;
  coverImageUrl?: string | null;
  bio: string | null;
  professionalStatement?: string | null;
  location: string | null;
  websiteUrl?: string | null;
  phoneNumber?: string | null;
  
  // Professional Info
  rating: number;
  reviewCount: number;
  completedProjects: number;
  responseTime: string;
  workAvailability: 'available' | 'busy' | 'unavailable';
  skills: string[];
  languages: string[];
  experience?: string | null;
  yearsOfExperience?: number;
  hourlyRate?: number;
  
  // Social & Portfolio
  socialLinks?: Record<string, string>;
  portfolioLinks?: string[];
  featuredWorkIds?: string[];
  
  // Profile Meta
  joinedAt: string;
  lastActive: string;
  verified: boolean;
  verificationBadge?: string;
  verificationBadges?: string[];
  profileViews?: number;
  likesCount?: number;
  followersCount?: number;
  profileCompleteness?: number;
  profileVisibility?: string;
}

interface PortfolioWork {
  id: string;
  title: string;
  description: string;
  tags: string[];
  visibility: 'public' | 'unlisted' | 'private';
  media: WorkMedia[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkMedia {
  id: string;
  type: 'image' | 'video' | 'youtube';
  url: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
  provider?: string;
  providerId?: string;
  order: number;
}

// Portfolio Gallery Types
interface ShowcaseProject {
  id: string;
  title: string;
  description: string;
  media: string[];
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  viewCount: number;
  likeCount: number;
  createdAt: string;
  freelancer: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    rating: number;
    reviewCount: number;
  };
}

interface ProfileStats {
  views: number;
  likes: number;
  followers: number;
  likedByMe?: boolean;
  followingByMe?: boolean;
}

interface FreelancerProfileProps {
  freelancerId?: string;
  profileId?: string;
  onNavigate?: (page: string, transition?: string) => void;
  onClose?: () => void;
}

export default function FreelancerProfile({ freelancerId, profileId, onNavigate, onClose }: FreelancerProfileProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'about'>('portfolio');
  const [workLikeStatus, setWorkLikeStatus] = useState<Record<string, boolean>>({});
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [notification, setNotification] = useState<{ title: string; description: string; variant?: 'default' | 'destructive' } | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [followIntent, setFollowIntent] = useState<'follow' | 'unfollow' | null>(null);
  const [isFollowed, setIsFollowed] = useState<boolean | null>(null);
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const { setIsChatOpen, setFreelancerInfo, setCurrentUserId } = useFreelancerChat();

  // Helper function to show notification with auto-dismiss
  const showNotification = (msg: { title: string; description: string; variant?: 'default' | 'destructive' }, duration: number = 3000) => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    // Set the new notification
    setNotification(msg);
    
    // Schedule auto-dismiss
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, duration);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Get freelancer ID from URL params (primary) or props (fallback)
  const urlParams = new URLSearchParams(window.location.search);
  const actualProfileId = profileId || freelancerId || urlParams.get('freelancerId') || '';

  // Fetch freelancer profile
  const { data: freelancerData, isLoading: profileLoading, error: profileError } = useQuery<FreelancerProfile>({
    queryKey: ['/api/freelancers/profile', actualProfileId],
    queryFn: async () => {
      const response = await apiRequest(`/api/freelancers/${actualProfileId}/profile`);
      return response.data || response;
    },
    enabled: !!actualProfileId
  });

  // Fetch freelancer portfolio
  const { data: portfolioWorks = [], isLoading: worksLoading } = useQuery<PortfolioWork[]>({
    queryKey: ['/api/freelancers/portfolio', actualProfileId],
    queryFn: async () => {
      const response = await apiRequest(`/api/freelancers/${actualProfileId}/portfolio`);
      return response.data || response || [];
    },
    enabled: !!actualProfileId
  });

  // Fetch default freelancer cover
  const { data: defaultCoverData } = useQuery<{ url: string | null }>({
    queryKey: ['/api/system-settings/freelancer-default-cover'],
    queryFn: async () => {
      const response = await apiRequest('/api/system-settings/freelancer-default-cover');
      return response;
    },
    staleTime: 5 * 60 * 1000
  });


  // Fetch profile stats (views, likes, follows)
  const { data: profileStats, isLoading: statsLoading } = useQuery<ProfileStats>({
    queryKey: ['/api/freelancers/stats', actualProfileId],
    queryFn: async () => {
      const response = await apiRequest(`/api/freelancers/${actualProfileId}/stats`);
      return response.data || response;
    },
    enabled: !!actualProfileId
  });

  // Sync isFollowed state with profileStats
  useEffect(() => {
    if (profileStats) {
      setIsFollowed(profileStats.followingByMe || false);
    }
  }, [profileStats]);

  // Record profile view when freelancer data loads
  useEffect(() => {
    if (!actualProfileId || !freelancerData || profileLoading) return;
    
    const recordView = async () => {
      try {
        const viewData = generateViewData();
        await apiRequest(`/api/freelancers/${actualProfileId}/views`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(viewData),
        });
      } catch (error) {
        console.error('Failed to record profile view:', error);
      }
    };

    recordView();
  }, [actualProfileId, freelancerData, profileLoading]);

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/freelancers/${actualProfileId}/follows`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancers/stats', actualProfileId] });
    },
    onError: (error: any) => {
      console.error('Failed to toggle follow:', error);
      setIsFollowed(prev => !prev);
      showNotification({
        title: "Follow Failed",
        description: error?.message || "Failed to follow/unfollow. Please try again.",
        variant: "destructive"
      }, 5000);
    },
    onSettled: () => {
      setFollowIntent(null);
    }
  });

  // Handle follow button click
  const handleFollowClick = () => {
    if (user?.id === freelancerData?.id) {
      showNotification({ title: "Invalid action", description: "You cannot follow yourself.", variant: "destructive" }, 3000);
      return;
    }
    
    if (!user) {
      showNotification({ title: "Authentication Required", description: "Please sign in to follow profiles.", variant: "destructive" }, 2000);
      setTimeout(() => {
        onNavigate?.('auth', 'slide-left');
      }, 500);
      return;
    }

    const intent = isFollowed ? 'unfollow' : 'follow';
    setFollowIntent(intent);
    setIsFollowed(prev => !prev);
    followMutation.mutate();
  };

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/freelancers/${actualProfileId}/likes`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancers/stats', actualProfileId] });
      showNotification({
        title: data?.liked ? "Liked!" : "Unliked",
        description: data?.liked 
          ? "You liked this profile." 
          : "You unliked this profile.",
      }, 3000);
    },
    onError: (error: any) => {
      console.error('Failed to toggle like:', error);
      showNotification({
        title: "Like Failed",
        description: error?.message || "Failed to like/unlike. Please try again.",
        variant: "destructive"
      }, 5000);
    }
  });

  // Handle contact freelancer - open chat widget using context
  const handleContactFreelancer = () => {
    // Check if user is logged in
    if (!user) {
      onNavigate?.('auth', 'slide-left');
      return;
    }
    
    if (!freelancerData || !profile) return;
    
    console.log('🔵 handleContactFreelancer - profile:', profile, 'profile.id:', profile.id);
    console.log('🔵 freelancerData:', freelancerData, 'actualProfileId:', actualProfileId);
    
    // Set freelancer info and user ID in context
    setFreelancerInfo({
      id: actualProfileId,
      name: freelancerData.name,
      avatarUrl: freelancerData.avatarUrl || undefined,
      professionalTitle: freelancerData.professionalTitle
    });
    setCurrentUserId(profile.id);
    // Open chat widget
    setIsChatOpen(true);
    
    console.log('🔵 After setting states - currentUserId should be:', profile.id, 'isChatOpen: true');
  };

  // Like/Unlike work mutation
  const likeWorkMutation = useMutation({
    mutationFn: async (workId: string) => {
      return apiRequest(`/api/portfolio/works/${workId}/like`, {
        method: 'POST',
      });
    },
    onSuccess: (data, workId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancers/portfolio', actualProfileId] });
      setWorkLikeStatus(prev => ({ ...prev, [workId]: data?.liked }));
      showNotification({
        title: data?.liked ? "Liked!" : "Unliked",
        description: data?.liked 
          ? "Added to your liked works." 
          : "Removed from your liked works.",
      }, 3000);
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        description: error?.message || "Failed to update like status.",
        variant: "destructive"
      }, 5000);
    }
  });

  // Track work view when project is opened in modal
  useEffect(() => {
    if (!selectedProject?.id) return;
    
    const recordWorkView = async () => {
      try {
        await apiRequest(`/api/portfolio/works/${selectedProject.id}/view`, {
          method: 'POST',
          body: JSON.stringify({
            sessionId: generateSessionId()
          })
        });
        // Invalidate portfolio query to refresh view counts
        queryClient.invalidateQueries({ queryKey: ['/api/freelancers/portfolio', actualProfileId] });
      } catch (error) {
        console.error('Failed to record work view:', error);
      }
    };

    recordWorkView();
  }, [selectedProject?.id]);

  // Fetch like status for displayed works
  useEffect(() => {
    if (!user || !portfolioWorks.length) return;

    const fetchLikeStatus = async () => {
      try {
        const workIds = portfolioWorks.map((work: PortfolioWork) => work.id);
        const response = await apiRequest('/api/portfolio/works/like-status', {
          method: 'POST',
          body: JSON.stringify({ workIds }),
        });
        setWorkLikeStatus(response.data || {});
      } catch (error) {
        console.error('Failed to fetch like status:', error);
      }
    };

    fetchLikeStatus();
  }, [user, portfolioWorks]);

  // Close handler - different behavior for logged-in users vs guests
  const handleClose = () => {
    if (user && onClose) {
      // Logged-in users with explicit onClose: close the profile panel
      onClose();
    } else if (user && profile && onNavigate) {
      // Logged-in users: navigate back to their appropriate dashboard
      const url = new URL(window.location.href);
      url.searchParams.delete('freelancerId');
      url.searchParams.delete('page');
      window.history.pushState({}, '', url.pathname);
      
      // Route to appropriate dashboard based on role
      if (profile.role === 'admin' || profile.role === 'accountant' || profile.role === 'customer_service') {
        onNavigate('admin-dashboard', 'slide-right');
      } else if (profile.role === 'teacher') {
        onNavigate('teacher-dashboard', 'slide-right');
      } else if (profile.role === 'freelancer') {
        onNavigate('freelancer-dashboard', 'slide-right');
      } else if (profile.role === 'general') {
        onNavigate('customer-dashboard', 'slide-right');
      } else {
        onNavigate('student-dashboard', 'slide-right');
      }
    } else if (onNavigate) {
      // Guests: navigate back to Find Talent page
      const url = new URL(window.location.href);
      url.searchParams.delete('freelancerId');
      url.searchParams.set('page', 'community');
      window.history.pushState({}, '', url);
      onNavigate('community', 'slide-right');
    } else {
      // Fallback: use browser history (may not work for deep-links)
      window.history.back();
    }
  };

  // Handle loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
          {/* Header Skeleton */}
          <div className="animate-pulse">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !freelancerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Freelancer Not Found</h2>
          <p className="text-gray-600 mb-4">The freelancer profile you're looking for doesn't exist.</p>
          <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700 text-white">
            Go to Find Talent
          </Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile Layout - show comprehensive profile like desktop but in mobile format
    return (
      <div className="min-h-screen bg-gray-50" data-testid="freelancer-profile-mobile">
        {/* Header - Reduced padding */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 max-w-6xl">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full"
                data-testid={user ? "button-close" : "button-back"}
              >
                {user ? (
                  <X className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* AJAX Notification */}
        {notification && (
          <div className="container mx-auto px-4 pt-4 max-w-6xl">
            <div className={`rounded-lg p-4 ${notification.variant === 'destructive' ? 'bg-primary' : 'bg-green-500'} text-white shadow-lg`}>
              <h3 className="font-semibold mb-1">{notification.title}</h3>
              <p className="text-sm">{notification.description}</p>
            </div>
          </div>
        )}
        
        {/* Mobile Comprehensive Profile - Reduced top padding */}
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="space-y-6">
            {/* Profile Header Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Cover Image */}
                <CoverImageUpload
                  currentCoverUrl={freelancerData.coverImageUrl || defaultCoverData?.url || null}
                  onCoverChange={(url) => {
                    // Refetch freelancer data to update the UI
                    queryClient.invalidateQueries({ queryKey: ['/api/freelancers', actualProfileId, 'profile'] });
                  }}
                  isEditing={user?.id === actualProfileId}
                  className="h-24 sm:h-32 md:h-40"
                />
                <div className="relative">
                  <div className="absolute -bottom-8 left-6">
                    <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                      <AvatarImage 
                        src={freelancerData.avatarUrl || undefined} 
                        alt={freelancerData.displayName || freelancerData.name}
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-700 text-lg font-semibold">
                        {(freelancerData.displayName || freelancerData.name).split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="pt-10 px-6 pb-6">
                  {/* Name and Title */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl font-bold text-gray-900">
                        {freelancerData.displayName || freelancerData.name}
                      </h1>
                      {freelancerData.verificationBadge && freelancerData.verificationBadge !== 'none' && (
                        <div title={freelancerData.verificationBadge === 'blue' ? 'Verified User' : 'Premium Verified'}>
                          {freelancerData.verificationBadge === 'blue' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-4 w-4" data-testid="verified-badge-mobile">
                              <g clipPath="url(#clip0_343_1428_freelancer_mobile)">
                                <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                              </g>
                              <defs>
                                <clipPath id="clip0_343_1428_freelancer_mobile">
                                  <rect width="24" height="24" fill="#fff" />
                                </clipPath>
                              </defs>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-4 w-4" data-testid="verified-badge-mobile">
                              <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    {freelancerData.professionalTitle && (
                      <p className="text-gray-600 text-sm">
                        {freelancerData.professionalTitle}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-6">
                    <Button 
                      onClick={handleContactFreelancer}
                      disabled={user?.id === freelancerData.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-hire-freelancer-mobile"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Hire Me
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (user?.id === freelancerData.id) {
                          showNotification({ title: "Invalid action", description: "You cannot follow yourself.", variant: "destructive" }, 3000);
                        } else if (!user) {
                          showNotification({ title: "Authentication Required", description: "Please sign in to follow profiles.", variant: "destructive" }, 2000);
                          setTimeout(() => {
                            onNavigate?.('auth', 'slide-left');
                          }, 500);
                        } else {
                          followMutation.mutate();
                        }
                      }}
                      disabled={followMutation.isPending}
                      className="border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white px-3"
                      data-testid="button-follow-mobile"
                    >
                      {followMutation.isPending ? (
                        <LoadingRing className="h-4 w-4" />
                      ) : isFollowed ? (
                        <span className="text-xs">✓</span>
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (user?.id === freelancerData.id) {
                          showNotification({ title: "Invalid action", description: "You cannot like yourself.", variant: "destructive" }, 3000);
                        } else if (!user) {
                          showNotification({ title: "Authentication Required", description: "Please sign in to like profiles.", variant: "destructive" }, 2000);
                          setTimeout(() => {
                            onNavigate?.('auth', 'slide-left');
                          }, 500);
                        } else {
                          likeMutation.mutate();
                        }
                      }}
                      disabled={likeMutation.isPending}
                      className="px-3"
                      data-testid="button-like-mobile"
                    >
                      {likeMutation.isPending ? (
                        <Timer className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className={`h-4 w-4 ${profileStats?.likedByMe ? 'fill-red-500 text-primary-500' : ''}`} />
                      )}
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-2 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3 md:p-2 text-center">
                      <div className="text-lg font-bold text-gray-900">{freelancerData.completedProjects || portfolioWorks.length}</div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Projects</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 md:p-2 text-center">
                      <div className="text-lg font-bold text-gray-900">{formatNumber(profileStats?.views || freelancerData.profileViews || 0)}</div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Views</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 md:p-2 text-center">
                      <div className="text-lg font-bold text-gray-900">{formatNumber(profileStats?.likes || freelancerData.likesCount || 0)}</div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Likes</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 md:p-2 text-center">
                      <div className="text-lg font-bold text-gray-900">{formatNumber(profileStats?.followers || freelancerData.followersCount || 0)}</div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Followers</div>
                    </div>
                  </div>

                  {/* Contact Info - Mobile Optimized */}
                  <div className="space-y-2 mb-4">
                    {freelancerData.location && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{freelancerData.location}</span>
                      </div>
                    )}
                    {freelancerData.responseTime && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>Responds in {freelancerData.responseTime}</span>
                      </div>
                    )}
                    {freelancerData.hourlyRate && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <DollarSign className="h-4 w-4 flex-shrink-0" />
                        <span>${freelancerData.hourlyRate}/hour</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Portfolio and About */}
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="portfolio" data-testid="tab-portfolio">Portfolio ({portfolioWorks.length})</TabsTrigger>
                <TabsTrigger value="about" data-testid="tab-about">About</TabsTrigger>
              </TabsList>
              
              <TabsContent value="portfolio" className="mt-6" data-testid="portfolio-content">
                {worksLoading ? (
                  <div className="flex flex-wrap gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 aspect-[4/3] rounded-lg mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : portfolioWorks.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {portfolioWorks.map((work) => {
                      const projectData = {
                        id: work.id,
                        title: work.title,
                        description: work.description,
                        media: work.media?.map(m => m.url) || [],
                        tags: work.tags || [],
                        status: 'approved' as const,
                        viewCount: work.viewsCount || 0,
                        likeCount: work.likesCount || 0,
                        createdAt: work.createdAt,
                        freelancer: {
                          id: freelancerData.id,
                          name: freelancerData.name,
                          displayName: freelancerData.displayName,
                          avatarUrl: freelancerData.avatarUrl,
                          bio: freelancerData.bio,
                          rating: freelancerData.rating || 0,
                          reviewCount: freelancerData.reviewCount || 0,
                        }
                      };
                      return (
                        <Card 
                          key={work.id}
                          className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm touch-manipulation active:scale-[0.98]"
                          style={{ width: '369px', height: '460px', minWidth: '369px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(projectData);
                          }}
                          onPointerDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.98)';
                          }}
                          onPointerUp={(e) => {
                            e.currentTarget.style.transform = '';
                          }}
                          data-testid={`project-card-${work.id}`}
                        >
                          <div className="relative">
                            <ProjectCover
                              images={work.media?.map(m => m.url) || []}
                              aspectRatio="aspect-[4/3]"
                              testIdBase={`project-card-${work.id}`}
                            />
                          </div>
                          <CardContent className="p-3 sm:p-4">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 text-sm sm:text-base">
                              {work.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Avatar className="h-5 w-5 flex-shrink-0">
                                  <AvatarImage src={freelancerData.avatarUrl || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {(freelancerData.displayName || freelancerData.name).split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-xs text-gray-600 truncate" data-testid={`freelancer-name-${work.id}`}>
                                  {freelancerData.displayName || freelancerData.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                                <span className="flex items-center gap-1" data-testid={`views-count-${work.id}`}>
                                  <Eye className="h-3 w-3" />
                                  <span>{work.viewsCount || 0}</span>
                                </span>
                                <span className="flex items-center gap-1" data-testid={`likes-count-${work.id}`}>
                                  <Heart className="h-3 w-3" />
                                  <span>{work.likesCount || 0}</span>
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
                    <p className="text-gray-600">This freelancer hasn't uploaded any projects yet.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="about" className="mt-6">
                <div className="space-y-6">
                  {/* About Section */}
                  {(freelancerData.bio || freelancerData.professionalStatement) && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                        <p className="text-gray-700 leading-relaxed">
                          {freelancerData.professionalStatement || freelancerData.bio}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Experience */}
                  {(freelancerData.experience || freelancerData.yearsOfExperience) && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Experience</h3>
                        {freelancerData.yearsOfExperience && (
                          <p className="text-gray-700 mb-2">
                            <strong>{freelancerData.yearsOfExperience} years</strong> of professional experience
                          </p>
                        )}
                        {freelancerData.experience && (
                          <p className="text-gray-700">{freelancerData.experience}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Skills */}
                  {freelancerData.skills && freelancerData.skills.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {freelancerData.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Languages */}
                  {freelancerData.languages && freelancerData.languages.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                          {freelancerData.languages.map((language, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Contact Information */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="space-y-2">
                        {freelancerData.contactEmail && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${freelancerData.contactEmail}`} className="text-blue-600">
                              {freelancerData.contactEmail}
                            </a>
                          </div>
                        )}
                        {freelancerData.phoneNumber && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="h-4 w-4" />
                            <span>{freelancerData.phoneNumber}</span>
                          </div>
                        )}
                        {freelancerData.websiteUrl && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Globe className="h-4 w-4" />
                            <a href={freelancerData.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                              {freelancerData.websiteUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Links */}
                  {freelancerData.socialLinks && Object.keys(freelancerData.socialLinks).length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Social Links</h3>
                        <div className="space-y-2">
                          {Object.entries(freelancerData.socialLinks).map(([platform, url]) => (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 text-sm"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </a>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Member Since */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center text-gray-600 text-sm">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span>Member since {new Date(freelancerData.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout - full profile with projects
  return (
    <div className="min-h-screen bg-gray-50" data-testid="freelancer-profile-desktop">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              data-testid={user ? "button-close-desktop" : "button-back-desktop"}
            >
              {user ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* AJAX Notification */}
      {notification && (
        <div className="container mx-auto px-4 sm:px-6 pt-4 max-w-6xl">
          <div className={`rounded-lg p-4 ${notification.variant === 'destructive' ? 'bg-primary' : 'bg-green-500'} text-white shadow-lg`}>
            <h3 className="font-semibold mb-1">{notification.title}</h3>
            <p className="text-sm">{notification.description}</p>
          </div>
        </div>
      )}
      
      {/* Desktop Profile Layout */}
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        {/* Cover Image Section for Desktop */}
        <div className="mb-8">
          <CoverImageUpload
            currentCoverUrl={freelancerData.coverImageUrl || defaultCoverData?.url || null}
            onCoverChange={(url) => {
              // Refetch freelancer data to update the UI
              queryClient.invalidateQueries({ queryKey: ['/api/freelancers', actualProfileId, 'profile'] });
            }}
            isEditing={user?.id === actualProfileId}
            className="h-32 md:h-[clamp(200px,24vh,280px)]"
          />
        </div>
        
        {/* Profile Header - Full Width Below Cover */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20" data-testid="desktop-profile-avatar">
                    <AvatarImage 
                      src={freelancerData.avatarUrl || undefined} 
                      alt={freelancerData.displayName || freelancerData.name}
                    />
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xl font-semibold">
                      {(freelancerData.displayName || freelancerData.name).split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl font-bold text-gray-900" data-testid="desktop-profile-name">
                        {freelancerData.displayName || freelancerData.name}
                      </h1>
                      {freelancerData.verificationBadge && freelancerData.verificationBadge !== 'none' && (
                        <div title={freelancerData.verificationBadge === 'blue' ? 'Verified User' : 'Premium Verified'}>
                          {freelancerData.verificationBadge === 'blue' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3" data-testid="verified-badge">
                              <g clipPath="url(#clip0_343_1428_freelancer_desktop)">
                                <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                              </g>
                              <defs>
                                <clipPath id="clip0_343_1428_freelancer_desktop">
                                  <rect width="24" height="24" fill="#fff" />
                                </clipPath>
                              </defs>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3" data-testid="verified-badge">
                              <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {freelancerData.professionalTitle && (
                      <p className="text-base text-gray-600 mb-2" data-testid="professional-title">
                        {freelancerData.professionalTitle}
                      </p>
                    )}
                    
                    {/* Quick Info */}
                    <div className="flex items-center gap-4 text-gray-600">
                      {freelancerData.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{freelancerData.location}</span>
                          {freelancerData.hourlyRate && (
                            <span className="text-sm ml-2">${freelancerData.hourlyRate}/hour</span>
                          )}
                        </div>
                      )}
                      {freelancerData.responseTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Responds in {freelancerData.responseTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons and Stats */}
                <div className="lg:ml-auto">
                  <div className="flex gap-3 mb-4">
                    <Button 
                      onClick={handleContactFreelancer}
                      disabled={user?.id === freelancerData.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                      data-testid="button-hire-desktop"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Hire Me
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleFollowClick}
                      disabled={followMutation.isPending}
                      className="border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white px-6" 
                      data-testid="button-follow-desktop"
                    >
                      {followMutation.isPending ? (
                        <>
                          <LoadingRing className="h-4 w-4 mr-2" />
                          {followIntent === 'follow' ? 'Following...' : 'Unfollowing...'}
                        </>
                      ) : (
                        <>
                          {!isFollowed && <Users className="h-4 w-4 mr-2" />}
                          {isFollowed ? 'Followed' : 'Follow'}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex gap-6 text-center">
                    <div data-testid="desktop-stat-projects">
                      <div className="text-xl font-bold text-gray-900">{freelancerData.completedProjects || portfolioWorks.length}</div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Projects</p>
                    </div>
                    <div data-testid="desktop-stat-views">
                      <div className="text-xl font-bold text-gray-900">{formatNumber(profileStats?.views || freelancerData.profileViews || 0)}</div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Views</p>
                    </div>
                    <div data-testid="desktop-stat-likes">
                      <div className="text-xl font-bold text-gray-900">{formatNumber(profileStats?.likes || freelancerData.likesCount || 0)}</div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Likes</p>
                    </div>
                    <div data-testid="desktop-stat-followers">
                      <div className="text-xl font-bold text-gray-900">{formatNumber(profileStats?.followers || freelancerData.followersCount || 0)}</div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Followers</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Additional Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">


                {/* Skills */}
                {freelancerData.skills && freelancerData.skills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2" data-testid="skills-list">
                      {freelancerData.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {freelancerData.languages && freelancerData.languages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Languages</h3>
                    <div className="flex flex-wrap gap-2" data-testid="languages-list">
                      {freelancerData.languages.map((language, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {freelancerData.socialLinks && Object.keys(freelancerData.socialLinks).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Connect</h3>
                    <div className="space-y-2">
                      {Object.entries(freelancerData.socialLinks).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                          data-testid={`desktop-social-${platform.toLowerCase()}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="portfolio" data-testid="tab-portfolio">Portfolio ({portfolioWorks.length})</TabsTrigger>
                <TabsTrigger value="about" data-testid="tab-about">About</TabsTrigger>
              </TabsList>
              
              <TabsContent value="portfolio" className="mt-6" data-testid="portfolio-content">
                {worksLoading ? (
                  <div className="flex flex-wrap gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 aspect-[4/3] rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : portfolioWorks.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {portfolioWorks.map((work) => {
                      const projectData = {
                        id: work.id,
                        title: work.title,
                        description: work.description,
                        media: work.media?.map((m: any) => m.url) || [],
                        tags: work.tags || [],
                        status: 'approved' as const,
                        viewCount: work.viewsCount || 0,
                        likeCount: work.likesCount || 0,
                        createdAt: work.createdAt,
                        freelancer: {
                          id: freelancerData.id,
                          name: freelancerData.name,
                          displayName: freelancerData.displayName,
                          avatarUrl: freelancerData.avatarUrl,
                          bio: freelancerData.bio,
                          rating: freelancerData.rating || 0,
                          reviewCount: freelancerData.reviewCount || 0,
                        }
                      };
                      return (
                        <Card 
                          key={work.id}
                          className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm touch-manipulation active:scale-[0.98]"
                          style={{ width: '369px', height: '460px', minWidth: '369px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(projectData);
                          }}
                          onPointerDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.98)';
                          }}
                          onPointerUp={(e) => {
                            e.currentTarget.style.transform = '';
                          }}
                          data-testid={`project-card-${work.id}`}
                        >
                        <div className="relative">
                          <ProjectCover
                            images={work.media?.map(m => m.url) || []}
                            aspectRatio="aspect-[4/3]"
                            testIdBase={`project-card-${work.id}`}
                          />
                        </div>
                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 text-sm sm:text-base">
                            {work.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Avatar className="h-5 w-5 flex-shrink-0">
                                <AvatarImage src={freelancerData.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                  {(freelancerData.displayName || freelancerData.name).split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-1 min-w-0">
                                <p className="text-xs text-gray-600 truncate" data-testid={`freelancer-name-${work.id}`}>
                                  {freelancerData.displayName || freelancerData.name}
                                </p>
                                {freelancerData.verificationBadge && freelancerData.verificationBadge !== 'none' && (
                                  <div title={freelancerData.verificationBadge === 'blue' ? 'Verified User' : 'Premium Verified'} className="flex-shrink-0">
                                    {freelancerData.verificationBadge === 'blue' ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-2.5 w-2.5">
                                        <g clipPath="url(#clip0_portfolio_card)">
                                          <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                          <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                                        </g>
                                        <defs>
                                          <clipPath id="clip0_portfolio_card">
                                            <rect width="24" height="24" fill="#fff" />
                                          </clipPath>
                                        </defs>
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-2.5 w-2.5">
                                        <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                              <span className="flex items-center gap-1" data-testid={`views-count-${work.id}`}>
                                <Eye className="h-3 w-3" />
                                <span>{formatNumber(work.viewsCount || 0)}</span>
                              </span>
                              <span className="flex items-center gap-1" data-testid={`likes-count-${work.id}`}>
                                <Heart className="h-3 w-3" />
                                <span>{formatNumber(work.likesCount || 0)}</span>
                              </span>
                            </div>
                          </div>
                        </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="no-portfolio-works">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
                    <p className="text-gray-600">This freelancer hasn't uploaded any portfolio projects yet.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="about" className="mt-6" data-testid="about-content">
                <Card>
                  <CardContent className="p-6">
                    {/* Bio/Professional Statement */}
                    {(freelancerData.bio || freelancerData.professionalStatement) && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                        <p className="text-gray-700 leading-relaxed" data-testid="freelancer-bio">
                          {freelancerData.professionalStatement || freelancerData.bio}
                        </p>
                      </div>
                    )}

                    {/* Experience */}
                    {(freelancerData.experience || freelancerData.yearsOfExperience) && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Experience</h3>
                        {freelancerData.yearsOfExperience && (
                          <p className="text-gray-700 mb-2" data-testid="years-experience">
                            <strong>{freelancerData.yearsOfExperience} years</strong> of professional experience
                          </p>
                        )}
                        {freelancerData.experience && (
                          <p className="text-gray-700" data-testid="experience-details">
                            {freelancerData.experience}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Contact Information */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="space-y-2">
                        {freelancerData.contactEmail && (
                          <div className="flex items-center gap-2 text-gray-700" data-testid="contact-email">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${freelancerData.contactEmail}`} className="text-blue-600 hover:text-blue-800">
                              {freelancerData.contactEmail}
                            </a>
                          </div>
                        )}
                        {freelancerData.phoneNumber && (
                          <div className="flex items-center gap-2 text-gray-700" data-testid="phone-number">
                            <Phone className="h-4 w-4" />
                            <span>{freelancerData.phoneNumber}</span>
                          </div>
                        )}
                        {freelancerData.websiteUrl && (
                          <div className="flex items-center gap-2 text-gray-700" data-testid="website-url">
                            <Globe className="h-4 w-4" />
                            <a href={freelancerData.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              {freelancerData.websiteUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member Since */}
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 text-gray-600 text-sm" data-testid="member-since">
                        <Calendar className="h-4 w-4" />
                        <span>Member since {new Date(freelancerData.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                      
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Behance-Style Project Detail Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-[100vw] w-[100vw] max-h-[100vh] h-[100vh] sm:max-w-[95vw] sm:w-[95vw] sm:max-h-[95vh] sm:h-[95vh] p-0 overflow-hidden bg-white sm:rounded-lg" aria-describedby="project-description">
          {selectedProject && (
            <>
              {/* Clean Header - Behance Style */}
              <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* iPhone-style Back Button next to profile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProject(null)}
                      className="lg:hidden flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      data-testid="button-close-modal-mobile"
                      aria-label="Close"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </Button>
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                      <AvatarImage src={selectedProject.freelancer.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs sm:text-sm font-medium">
                        {selectedProject.freelancer.displayName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'FL'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">{selectedProject.title}</DialogTitle>
                      <p id="project-description" className="text-xs sm:text-sm text-gray-600 truncate">
                        by {selectedProject.freelancer.displayName || selectedProject.freelancer.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        {formatNumber(selectedProject.viewCount)}
                      </span>
                      <button 
                        onClick={() => {
                          if (!user) {
                            onNavigate?.('auth', 'slide-left');
                            return;
                          }
                          likeWorkMutation.mutate(selectedProject.id);
                        }}
                        disabled={likeWorkMutation.isPending}
                        className={`flex items-center gap-1 transition-colors cursor-pointer ${
                          workLikeStatus[selectedProject.id] 
                            ? 'text-primary-500 hover:text-primary-600' 
                            : 'text-gray-500 hover:text-primary-500'
                        }`}
                        data-testid="button-like-work"
                      >
                        <Heart 
                          className={`h-3 w-3 sm:h-4 sm:w-4 ${workLikeStatus[selectedProject.id] ? 'fill-current' : ''}`} 
                        />
                        {formatNumber(selectedProject.likeCount)}
                      </button>
                    </div>
                    <Button 
                      size="sm" 
                      className="hidden lg:flex bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      data-testid="button-contact-freelancer" 
                      onClick={handleContactFreelancer} 
                      disabled={user?.id === freelancerData?.id}
                    >
                      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Get in touch</span>
                      <span className="sm:hidden">Contact</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Behance-Style Scrollable Content */}
              <div className="flex-1 overflow-y-auto bg-white">
                {/* Project Images Carousel */}
                {selectedProject.media && selectedProject.media.length > 0 && (
                  <div className="w-full bg-gray-50 py-4 sm:py-8">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                      <BehanceStyleFeed
                        images={selectedProject.media}
                        className="max-w-none w-full"
                        testIdBase={`modal-project-${selectedProject.id}`}
                        projectName={selectedProject.title}
                      />
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                  <div className="space-y-6 sm:space-y-8">
                    {/* Project Description */}
                    <div className="prose max-w-none">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{selectedProject.title}</h2>
                      <p className="text-gray-700 leading-relaxed text-base sm:text-lg">{selectedProject.description}</p>
                    </div>

                    {/* Tags */}
                    {selectedProject.tags && selectedProject.tags.length > 0 && (
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Skills & Tools</h3>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {selectedProject.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="px-2 sm:px-3 py-1 text-xs sm:text-sm border-gray-300 hover:border-gray-400 transition-colors">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
