import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin,
  ExternalLink,
  User,
  Eye,
  Heart,
  Users,
  Briefcase,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import { 
  FaTwitter, 
  FaFacebook,
  FaLinkedin,
  FaInstagram,
  FaGithub,
  FaBehance,
  FaDribbble
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

interface BehanceStyleMobileProfileProps {
  profileData: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string | null;
    coverImageUrl?: string | null;
    bio?: string | null;
    location?: string | null;
    profileViews?: number;
    likesCount?: number;
    followersCount?: number;
    completedProjects?: number;
    socialLinks?: Record<string, string>;
    verified?: boolean;
    professionalTitle?: string;
  };
  profileStats?: {
    views: number;
    likes: number;
    followers: number;
    likedByMe?: boolean;
    followingByMe?: boolean;
  };
  defaultCoverUrl?: string | null;
  onContactFreelancer?: () => void;
  onNavigateToFullProfile?: () => void;
  className?: string;
}

export function BehanceStyleMobileProfile({ 
  profileData, 
  profileStats, 
  defaultCoverUrl,
  onContactFreelancer,
  onNavigateToFullProfile,
  className = "" 
}: BehanceStyleMobileProfileProps) {
  const [activeTab, setActiveTab] = useState<'work' | 'about'>('work');
  const [followIntent, setFollowIntent] = useState<'follow' | 'unfollow' | null>(null);
  const [isFollowed, setIsFollowed] = useState<boolean | null>(null);
  const { user } = useAuth();

  // Sync isFollowed state with profileStats
  useEffect(() => {
    if (profileStats) {
      setIsFollowed(profileStats.followingByMe || false);
    }
  }, [profileStats]);

  // Use profile stats if available, otherwise fall back to profile data - NO FAKE DATA
  const stats = {
    views: profileStats?.views || profileData.profileViews || 0,
    likes: profileStats?.likes || profileData.likesCount || 0,
    followers: profileStats?.followers || profileData.followersCount || 0,
  };

  // Format large numbers (e.g., 15900 → 15.9K)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  // Follow/Like mutations
  const followMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/freelancers/${profileData.id}/follows`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancers/stats', profileData.id] });
    },
    onError: () => {
      setIsFollowed(prev => !prev);
    },
    onSettled: () => {
      setFollowIntent(null);
    }
  });

  // Handle follow button click
  const handleFollowClick = () => {
    const intent = isFollowed ? 'unfollow' : 'follow';
    setFollowIntent(intent);
    setIsFollowed(prev => !prev);
    followMutation.mutate();
  };

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/freelancers/${profileData.id}/likes`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancers/stats', profileData.id] });},
  });

  // Get social media icon
  const getSocialIcon = (platform: string) => {
    const iconProps = { className: "h-4 w-4" };
    switch (platform.toLowerCase()) {
      case 'twitter': return <FaTwitter {...iconProps} />;
      case 'facebook': return <FaFacebook {...iconProps} />;
      case 'linkedin': return <FaLinkedin {...iconProps} />;
      case 'instagram': return <FaInstagram {...iconProps} />;
      case 'github': return <FaGithub {...iconProps} />;
      case 'behance': return <FaBehance {...iconProps} />;
      case 'dribbble': return <FaDribbble {...iconProps} />;
      default: return <ExternalLink {...iconProps} />;
    }
  };

  const displayName = profileData.displayName || profileData.name;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  const coverUrl = profileData.coverImageUrl || defaultCoverUrl;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-sm mx-auto ${className}`} data-testid="behance-mobile-profile">
      {/* Decorative Header Background */}
      <div className="relative h-32 bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50 overflow-hidden">
        {/* Cover Image */}
        {coverUrl && (
          <img 
            src={coverUrl} 
            alt="Profile cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Ornate Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='50' cy='50' r='2'/%3E%3Ccircle cx='10' cy='50' r='2'/%3E%3Ccircle cx='50' cy='10' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Profile Avatar - Centered and Lower */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <Avatar className="h-16 w-16 border-4 border-white shadow-md" data-testid="profile-avatar">
              <AvatarImage 
                src={profileData.avatarUrl || undefined} 
                alt={displayName}
              />
              <AvatarFallback className="bg-gray-200 text-gray-700 text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {profileData.verified && (
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="pt-10 px-4 pb-4 text-center">
        {/* Name and Basic Stats */}
        <h2 className="text-xl font-bold text-gray-900 mb-1" data-testid="profile-name">
          {displayName}
        </h2>
        
        {profileData.professionalTitle && (
          <p className="text-sm text-gray-600 mb-3" data-testid="professional-title">
            {profileData.professionalTitle}
          </p>
        )}

        {/* Basic Stats Row */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1" data-testid="stat-followers-basic">
            <Users className="h-4 w-4" />
            <span className="font-medium">{formatNumber(stats.followers)}</span>
          </div>
          <div className="flex items-center gap-1" data-testid="stat-views-basic">
            <Eye className="h-4 w-4" />
            <span className="font-medium">{formatNumber(stats.views)}</span>
          </div>
          <div className="flex items-center gap-1" data-testid="stat-likes-basic">
            <Heart className="h-4 w-4" />
            <span className="font-medium">{formatNumber(stats.likes)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button 
            onClick={handleFollowClick}
            disabled={!user || user.id === profileData.id || followMutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-follow"
          >
            {followMutation.isPending ? (
              <>
                <LoadingRing className="h-4 w-4 mr-2" />
                {followIntent === 'follow' ? 'Following...' : 'Unfollowing...'}
              </>
            ) : (
              isFollowed ? 'Followed' : 'Follow'
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={onContactFreelancer}
            disabled={!user || user.id === profileData.id}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            data-testid="button-hire"
          >
            Hire
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex mb-4 -mx-4">
          <button
            onClick={() => setActiveTab('work')}
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'work' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-gray-200 text-gray-500 hover:text-gray-700'
            }`}
            data-testid="tab-work"
          >
            Work
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'about' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-gray-200 text-gray-500 hover:text-gray-700'
            }`}
            data-testid="tab-about"
          >
            About
          </button>
        </div>

        {/* Statistics Grid - Behance Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-2 mb-6 -mx-4 px-4">
          <div className="bg-gray-50 rounded-lg p-4 md:p-3 text-center" data-testid="stat-card-project-views">
            <div className="text-2xl md:text-lg font-bold text-gray-900 mb-1">
              {formatNumber(stats.views)}
            </div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">
              Views
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 md:p-3 text-center" data-testid="stat-card-appreciations">
            <div className="text-2xl md:text-lg font-bold text-gray-900 mb-1">
              {formatNumber(stats.likes)}
            </div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">
              Likes
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 md:p-3 text-center" data-testid="stat-card-followers">
            <div className="text-2xl md:text-lg font-bold text-gray-900 mb-1">
              {formatNumber(stats.followers)}
            </div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">
              Followers
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 md:p-3 text-center" data-testid="stat-card-projects">
            <div className="text-2xl md:text-lg font-bold text-gray-900 mb-1">
              {formatNumber(profileData.completedProjects || 0)}
            </div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">
              Projects
            </div>
          </div>
        </div>

        {/* Location */}
        {profileData.location && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">
              Location
            </h3>
            <div className="flex items-center justify-center gap-2 text-gray-700" data-testid="location-info">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{profileData.location}</span>
            </div>
          </div>
        )}

        {/* Social Links */}
        {profileData.socialLinks && Object.keys(profileData.socialLinks).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-3">
              On The Web
            </h3>
            <div className="space-y-2">
              {Object.entries(profileData.socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  data-testid={`social-link-${platform.toLowerCase()}`}
                >
                  <div className="flex items-center gap-3">
                    {getSocialIcon(platform)}
                    <span className="text-sm text-gray-800 capitalize">{platform}</span>
                  </div>
                  <ExternalLink className="h-3 w-3 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* View Full Profile Button */}
        {onNavigateToFullProfile && (
          <Button
            variant="ghost"
            onClick={onNavigateToFullProfile}
            className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            data-testid="button-view-full-profile"
          >
            View Full Profile
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
