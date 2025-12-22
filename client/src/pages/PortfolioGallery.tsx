import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useFreelancerChat } from '@/contexts/FreelancerChatContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProjectCover, BehanceStyleFeed } from '@/components/MediaCarousel';
import { PortfolioHeroSection } from '@/components/HeroSectionDisplay';
import Footer from '@/components/Footer';
import PortfolioCommentSection from '@/components/PortfolioCommentSection';
import PortfolioNavigation from '@/components/PortfolioNavigation';
import { generateSessionId } from '@/lib/visitor-tracking';

// R2 hosted WebP images for each category
const programmingImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/e18011da-7cb3-469f-8d9e-5044d5949d1e.webp";
const creativeImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/0712d911-7aa3-4372-862d-1c62fa9632d3.webp";
const mobileImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/f665e4bd-c2d8-49dc-acfd-7cd4592d6dca.webp";
const webImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/30b5cf5c-ca76-41ab-ae11-f4d26f8078ff.webp";
const photoshopImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/11be2593-2bb3-4056-a5b6-fef9b81a5fb6.webp";
const uiuxImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/95099968-3885-4f39-bc0d-1b18529ffb24.webp";
const premiereImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/1dca3dc6-ee47-466b-b570-10c8aecc7680.webp";
const illustratorImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/149659ff-ec89-4fed-8c7c-a292360db480.webp";
const substanceImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/e09235ff-5dd4-4f30-83fe-24fdabf66b08.webp";
const afterEffectsImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/8e962be1-5b6c-45f1-9f7c-2641cd1470b9.webp";
const htmlCssImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/327be4e8-816b-4c35-90b4-ec60dada3ba2.webp";
const tailwindImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/ebe04547-d8bc-4a4c-919b-2bf1bc742cb4.webp";
const indesignImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/60e69900-2a80-4d01-a265-2c27c39ae034.webp";
const xdImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/2aa0dc33-3f1b-4939-a4d3-8ea7dd9923f9.webp";
const captureImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/a8d45b45-d7be-436c-80d6-990fba0e35c0.webp";
const dimensionImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/8b673a17-f0d6-48db-948e-3ef14a770f68.webp";
const substance3dPainterImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/b93e69fd-6145-4874-8632-9b8a25bae415.webp";
const substance3dSamplerImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/f2e931d2-f891-4d50-8462-3e237e4cdc34.webp";
const substance3dStagerImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/e3b3b20e-27a9-4832-a7f9-af6bb43434f8.webp";
const aeroImg = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/6f58e451-a812-4b11-b579-c59b99581ba9.webp";
import { PORTFOLIO_CATEGORIES } from '@shared/portfolioCategories';
import { 
  Eye, 
  Heart, 
  MessageCircle, 
  Search, 
  Filter, 
  Grid,
  LayoutGrid,
  List,
  Star,
  Calendar,
  User,
  ExternalLink,
  Share,
  Bookmark,
  ArrowUpRight,
  X,
  ChevronLeft,
  Menu,
  Settings,
  SlidersHorizontal
} from 'lucide-react';

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

// Types
interface ShowcaseProject {
  id: string;
  title: string;
  description: string;
  media: string[];
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  viewCount: number;
  likeCount: number;
  commentsCount: number;
  createdAt: string;
  freelancer: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    rating: number;
    reviewCount: number;
    verificationBadge?: 'none' | 'green' | 'blue';
  };
}

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'popular' | 'trending' | 'rating';

interface PortfolioGalleryProps {
  onNavigate?: (page: string, transition?: string) => void;
  context?: 'public' | 'dashboard';
}

export function PortfolioGallery({ onNavigate, context = 'public' }: PortfolioGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  
  // Scroll container reference
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const projectDetailScrollRef = useRef<HTMLDivElement>(null);
  
  // Authentication hook
  const { user, profile } = useAuth();
  
  // Freelancer chat context
  const { setIsChatOpen, setFreelancerInfo, setCurrentUserId } = useFreelancerChat();

  // Fetch actual comments for selected project to get accurate count
  const { data: selectedProjectComments = [] } = useQuery<any[]>({
    queryKey: ['/api/portfolio/works', selectedProject?.id, 'comments'],
    queryFn: async () => {
      if (!selectedProject?.id) return [];
      const response = await fetch(`/api/portfolio/works/${selectedProject.id}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      return data.success ? data.data : [];
    },
    enabled: !!selectedProject?.id,
  });

  // Fetch real portfolio works from authenticated freelancers
  const { data: projects = [], isLoading, error } = useQuery<ShowcaseProject[]>({
    queryKey: ['/api/portfolio/works', searchQuery, selectedTags, selectedCategory, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('sort', sortBy);
      
      const response = await fetch(`/api/portfolio/works?${params}`);
      if (!response.ok) throw new Error('Failed to fetch portfolio works');
      const data = await response.json();
      
      // Transform the portfolio works data to match ShowcaseProject interface
      const transformedData = data.data?.map((work: any) => ({
        id: work.id,
        title: work.title,
        description: work.description,
        media: work.media?.map((m: any) => m.url) || [],
        tags: work.tags || [],
        status: 'approved', // Portfolio works are always live
        viewCount: work.viewsCount || 0,
        likeCount: work.likesCount || 0,
        commentsCount: work.commentsCount || 0,
        createdAt: work.createdAt,
        freelancer: work.user ? {
          id: work.user.id,
          name: work.user.name,
          displayName: work.user.displayName,
          avatarUrl: work.user.avatarUrl,
          bio: work.user.bio,
          rating: work.user.rating || 0,
          reviewCount: work.user.reviewCount || 0,
          verificationBadge: work.user.verificationBadge || 'none',
        } : {
          id: work.userId || '',
          name: 'Freelancer',
          displayName: 'Freelancer',
          avatarUrl: null,
          bio: null,
          rating: 0,
          reviewCount: 0,
          verificationBadge: 'none',
        }
      })) || [];
      
      return transformedData;
    }
  });

  // Extract available tags
  const availableTags = Array.from(new Set(projects.flatMap(p => p.tags))).sort();

  // Auto-scroll modal to top when a project is selected
  useEffect(() => {
    if (selectedProject && projectDetailScrollRef.current) {
      projectDetailScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [selectedProject?.id]);

  // Update selectedProject when projects data changes (e.g., after comment is added)
  useEffect(() => {
    if (selectedProject) {
      const updatedProject = projects.find(p => p.id === selectedProject.id);
      if (updatedProject) {
        setSelectedProject(updatedProject);
      }
    }
  }, [projects, selectedProject?.id]);

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

  // Scroll functions for category cards
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Contact freelancer mutation
  const contactFreelancerMutation = useMutation({
    mutationFn: async (freelancerId: string) => {
      return apiRequest('/api/messages/start-freelancer-chat', {
        method: 'POST',
        body: JSON.stringify({ freelancerId })
      });
    },
    onSuccess: (data) => {
      if (data?.conversationId) {
        setSelectedProject(null);
        
        queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages', data.conversationId] });

        setTimeout(() => {
          if (profile?.role === 'admin') {
            onNavigate?.('admin-dashboard', 'slide-right');
          } else if (profile?.role === 'teacher') {
            onNavigate?.('teacher-dashboard', 'slide-right');
          } else if (profile?.role === 'freelancer') {
            onNavigate?.('freelancer-dashboard', 'slide-right');
          } else {
            onNavigate?.('student-dashboard', 'slide-right');
          }
        }, 1500);
      }
    },
    onError: (error: any) => {
    }
  });

  const handleContactFreelancer = () => {
    // Check if user is logged in
    if (!user) {
      onNavigate?.('freelancer-signup', 'slide-right');
      return;
    }
    
    if (!selectedProject || !profile) return;
    
    // Don't allow contacting yourself
    if (user.id === selectedProject.freelancer.id) {
      return;
    }
    
    // Set freelancer info and user ID in context to open chat widget
    setFreelancerInfo({
      id: selectedProject.freelancer.id,
      name: selectedProject.freelancer.name || selectedProject.freelancer.displayName,
      avatarUrl: selectedProject.freelancer.avatarUrl || undefined,
      professionalTitle: undefined
    });
    setCurrentUserId(profile.id);
    setIsChatOpen(true); // Open the chat widget
    
    // Close the modal
    setSelectedProject(null);
  };

  const handleToggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newShowComments = !showComments;
    setShowComments(newShowComments);
    
    // Instant jump to comments section when opening (no animation)
    if (newShowComments) {
      setTimeout(() => {
        if (commentSectionRef.current) {
          commentSectionRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, 50);
    }
  };

  // Track view mutation
  const trackViewMutation = useMutation({
    mutationFn: async (workId: string) => {
      return apiRequest(`/api/portfolio/works/${workId}/view`, {
        method: 'POST',
        body: JSON.stringify({
          sessionId: generateSessionId()
        })
      });
    },
    onSuccess: () => {
      // Invalidate queries to update view counts
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/works'] });
    }
  });

  // Fetch like status for all portfolios
  const { data: likeStatusData } = useQuery<Record<string, boolean>>({
    queryKey: ['/api/portfolio/works/like-status', projects.map(p => p.id)],
    queryFn: async () => {
      if (!user || projects.length === 0) return {};
      
      const workIds = projects.map(p => p.id);
      const response = await apiRequest('/api/portfolio/works/like-status', {
        method: 'POST',
        body: JSON.stringify({ workIds })
      });
      return response.data || {};
    },
    enabled: !!user && projects.length > 0
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (workId: string) => {
      return apiRequest(`/api/portfolio/works/${workId}/like`, {
        method: 'POST'
      });
    },
    onSuccess: (data, workId) => {
      // Update local like status
      queryClient.setQueryData(
        ['/api/portfolio/works/like-status', projects.map(p => p.id)],
        (old: Record<string, boolean> | undefined) => {
          const prev = old ?? {};
          return {
            ...prev,
            [workId]: data?.isLiked ?? !prev[workId]
          };
        }
      );
      
      // Invalidate queries to update like counts
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/works'] });
    }
  });

  // Handle like toggle
  const handleLikeToggle = (e: React.MouseEvent, workId: string) => {
    e.stopPropagation(); // Prevent opening project modal
    
    if (!user) {
      onNavigate?.('auth', 'slide-left');
      return;
    }
    
    toggleLikeMutation.mutate(workId);
  };

  // Handle project selection and track view
  const handleProjectClick = (project: ShowcaseProject) => {
    setSelectedProject(project);
    setShowComments(false);
    // Only track view if it's a different project (prevent double-tracking when clicking within same project)
    if (!selectedProject || selectedProject.id !== project.id) {
      trackViewMutation.mutate(project.id);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const ProjectCard = ({ project }: { project: ShowcaseProject }) => (
    <Card 
      className="group cursor-pointer transition-all duration-300 overflow-hidden border-0"
      onClick={() => handleProjectClick(project)}
      data-testid={`project-card-${project.id}`}
    >
      {/* Project Media Carousel */}
      <div className="relative">
        <ProjectCover
          images={project.media || []}
          aspectRatio="aspect-[4/3]"
          testIdBase={`project-card-${project.id}`}
          onClick={() => {
            handleProjectClick(project);
          }}
        />
        
      </div>

      <CardContent className="p-3 sm:p-4">
        {/* Project Title */}
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 text-sm sm:text-base">
          {project.title}
        </h3>

        {/* Freelancer info with stats */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors"
            onClick={(e) => {
              e.stopPropagation(); // Prevent project modal from opening
              // Update URL to include freelancer ID
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('page', 'freelancer-profile');
              newUrl.searchParams.set('freelancerId', project.freelancer.id);
              window.history.pushState(null, '', newUrl.toString());
              onNavigate?.('freelancer-profile', 'slide-right');
            }}
            data-testid={`freelancer-link-${project.freelancer.id}`}
          >
            <Avatar className="h-5 w-5 flex-shrink-0">
              <AvatarImage src={project.freelancer.avatarUrl || undefined} />
              <AvatarFallback className="text-xs">
                {project.freelancer.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'FL'}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 min-w-0">
              <p className="text-xs text-gray-600 truncate hover:text-blue-600 transition-colors">
                {project.freelancer.displayName || project.freelancer.name}
              </p>
              {project.freelancer.verificationBadge && project.freelancer.verificationBadge !== 'none' && (
                project.freelancer.verificationBadge === 'blue' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-2.5 w-2.5 flex-shrink-0">
                    <g clipPath="url(#clip0_343_1428_portfolio_grid)">
                      <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                      <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                    </g>
                    <defs>
                      <clipPath id="clip0_343_1428_portfolio_grid">
                        <rect width="24" height="24" fill="#fff" />
                      </clipPath>
                    </defs>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-2.5 w-2.5 flex-shrink-0">
                    <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                  </svg>
                )
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(project.viewCount)}
            </span>
            <button 
              className="flex items-center gap-1 hover:text-red-500 transition-colors"
              onClick={(e) => handleLikeToggle(e, project.id)}
              data-testid={`button-like-${project.id}`}
            >
              <Heart 
                className={`h-3 w-3 ${likeStatusData?.[project.id] ? 'fill-red-500 text-red-500' : ''}`} 
              />
              {formatNumber(project.likeCount)}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProjectListItem = ({ project }: { project: ShowcaseProject }) => (
    <Card 
      className="transition-shadow cursor-pointer" 
      onClick={() => handleProjectClick(project)}
      data-testid={`project-list-${project.id}`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-4">
          {/* Thumbnail Carousel */}
          <div className="w-16 sm:w-24 flex-shrink-0">
            <ProjectCover
              images={project.media || []}
              aspectRatio=""
              className="w-16 h-14 sm:w-24 sm:h-20 rounded"
              testIdBase={`project-list-${project.id}`}
              onClick={() => {
                handleProjectClick(project);
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 text-sm sm:text-base mb-2">
              {project.title}
            </h3>
            
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent project modal from opening
                  // Update URL to include freelancer ID
                  const newUrl = new URL(window.location.href);
                  newUrl.searchParams.set('page', 'freelancer-profile');
                  newUrl.searchParams.set('freelancerId', project.freelancer.id);
                  window.history.pushState(null, '', newUrl.toString());
                  onNavigate?.('freelancer-profile', 'slide-right');
                }}
                data-testid={`freelancer-link-list-${project.freelancer.id}`}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={project.freelancer.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {project.freelancer.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'FL'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs text-gray-600 truncate hover:text-blue-600 transition-colors">
                    {project.freelancer.displayName || project.freelancer.name}
                  </span>
                  {project.freelancer.verificationBadge && project.freelancer.verificationBadge !== 'none' && (
                    project.freelancer.verificationBadge === 'blue' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0">
                        <g clipPath="url(#clip0_343_1428_portfolio_list)">
                          <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                          <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                        </g>
                        <defs>
                          <clipPath id="clip0_343_1428_portfolio_list">
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
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {formatNumber(project.viewCount)}
                </span>
                <button 
                  className="flex items-center gap-1 hover:text-red-500 transition-colors"
                  onClick={(e) => handleLikeToggle(e, project.id)}
                  data-testid={`button-like-list-${project.id}`}
                >
                  <Heart 
                    className={`h-3 w-3 ${likeStatusData?.[project.id] ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                  {formatNumber(project.likeCount)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="portfolio-gallery">
      {/* Navigation - Only show when not in dashboard context */}
      {context !== 'dashboard' && (
        <PortfolioNavigation 
          onNavigate={onNavigate || (() => {})} 
          hideDashboardButton={false} 
        />
      )}
      
      {/* Back Navigation - Show when in dashboard context */}
      {context === 'dashboard' && (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex items-center h-14">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (profile?.role === 'admin') {
                    onNavigate?.('admin-dashboard', 'slide-right');
                  } else if (profile?.role === 'teacher') {
                    onNavigate?.('teacher-dashboard', 'slide-right');
                  } else if (profile?.role === 'freelancer') {
                    onNavigate?.('freelancer-dashboard', 'slide-right');
                  } else if (profile?.role === 'general') {
                    onNavigate?.('customer-dashboard', 'slide-right');
                  } else {
                    onNavigate?.('student-dashboard', 'slide-right');
                  }
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                data-testid="button-back-to-dashboard"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin-Managed Hero Section */}
      <PortfolioHeroSection className="" />
      
      {/* Search and Filters Section */}
      <div className="bg-white border-b">
        <div className="px-4 md:px-8 py-4 sm:py-6">

          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            {/* Top Row - Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects and people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                  data-testid="input-search-projects"
                />
              </div>

              {/* Sort and Beautiful View Mode with Burger Menu */}
              <div className="flex gap-2 sm:gap-4 justify-between sm:justify-end items-center">
                {/* Burger Menu for Advanced Filters */}
                <div className="relative" ref={filtersRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300"
                    data-testid="button-burger-menu"
                  >
                    <Menu className="h-4 w-4 text-blue-600" />
                    <span className="ml-2 text-blue-700 font-medium hidden sm:inline">Filters</span>
                  </Button>
                  
                  {/* Dropdown Menu */}
                  {showFilters && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 z-50 p-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            Advanced Filters
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFilters(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Sort Options */}
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-2 block">Sort By</label>
                          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                            <SelectTrigger className="w-full" data-testid="select-sort-advanced">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="recent">Most Recent</SelectItem>
                              <SelectItem value="popular">Most Popular</SelectItem>
                              <SelectItem value="trending">Trending</SelectItem>
                              <SelectItem value="rating">Highest Rated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tags Filter */}
                        {availableTags.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-2 block">Popular Tags</label>
                            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                              {availableTags.slice(0, 12).map((tag) => (
                                <Button
                                  key={tag}
                                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleTag(tag)}
                                  className="text-xs h-7 px-2"
                                  data-testid={`filter-tag-${tag.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                                >
                                  {tag}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Clear Filters */}
                        {(selectedTags.length > 0 || searchQuery) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTags([]);
                              setSearchQuery('');
                              setSortBy('recent');
                            }}
                            className="w-full text-gray-600 hover:text-gray-800"
                            data-testid="button-clear-filters"
                          >
                            Clear All Filters
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Sort Dropdown */}
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-40 bg-white border-gray-200 hover:border-gray-300 transition-colors" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Dropdown */}
                <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid View</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Behance-Style Category Cards */}
            <div className="mt-6">
              <div className="relative">
                {/* Scroll Arrows - Desktop Only */}
                <button 
                  onClick={scrollLeft}
                  className="hidden md:block absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  onClick={scrollRight}
                  className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 hover:bg-gray-50 transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4 text-gray-600 rotate-90" />
                </button>
                
                <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {/* Category Cards */}
                  {[
                    { name: 'IT & Programming', image: programmingImg },
                    { name: 'Design & Creative', image: creativeImg },
                    { name: 'Mobile Apps & Games', image: mobileImg },
                    { name: 'HTML / CSS', image: htmlCssImg },
                    { name: 'Tailwind CSS', image: tailwindImg },
                    { name: 'Web Design', image: webImg },
                    { name: 'UI/UX Design', image: uiuxImg },
                    { name: 'InDesign', image: indesignImg },
                    { name: 'XD', image: xdImg },
                    { name: 'Premiere Pro', image: premiereImg },
                    { name: 'After Effects', image: afterEffectsImg },
                    { name: 'Illustrator', image: illustratorImg },
                    { name: 'Photoshop', image: photoshopImg },
                    { name: 'Dimension', image: dimensionImg },
                    { name: 'Capture', image: captureImg },
                    { name: 'Substance 3D Designer', image: substanceImg },
                    { name: 'Substance 3D Painter', image: substance3dPainterImg },
                    { name: 'Substance 3D Sampler', image: substance3dSamplerImg },
                    { name: 'Substance 3D Stager', image: substance3dStagerImg },
                    { name: 'Landing Page Design', image: aeroImg },
                  ].map((category) => (
                    <div
                      key={category.name}
                      className="group relative flex-shrink-0 w-28 h-12 rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105"
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setSearchQuery('');
                        setSelectedTags([]);
                      }}
                      data-testid={`category-${category.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                    >
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${category.image})` }}
                      ></div>
                      
                      {/* Dark Overlay for Readability */}
                      <div className="absolute inset-0 bg-black bg-opacity-75 group-hover:bg-opacity-60 transition-all duration-300"></div>
                      
                      {/* Content */}
                      <div className="relative h-full flex items-center justify-center text-white p-2 z-10">
                        <div className="text-xs font-bold text-center leading-tight" style={{
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0px 0px 8px rgba(0,0,0,0.6)'
                        }}>
                          {category.name}
                        </div>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-8 py-6 sm:py-8">
        {/* Results Info - Hidden clear filters button */}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200"></div>
                <CardContent className="p-3 sm:p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    <div className="h-6 w-12 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-2">Failed to load projects</div>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="text-center py-12">
            <LayoutGrid className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedTags.length > 0 
                ? 'Try adjusting your search or filters'
                : 'No portfolio projects are available yet'
              }
            </p>
          </div>
        )}


        {/* Projects Grid/List */}
        {!isLoading && !error && projects.length > 0 && (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'
              : 'space-y-3 sm:space-y-4'
          }>
            {projects.map((project) => 
              viewMode === 'grid' 
                ? <ProjectCard key={project.id} project={project} />
                : <ProjectListItem key={project.id} project={project} />
            )}
          </div>
        )}
      </div>

      {/* Behance-Style Project Detail Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-[100vw] w-[100vw] max-h-[100vh] h-[100vh] sm:max-w-[95vw] sm:w-[95vw] sm:max-h-[95vh] sm:h-[95vh] p-0 overflow-hidden bg-white sm:rounded-lg" aria-describedby="project-description">
          {selectedProject && (
            <>
              {/* Clean Header - Behance Style */}
              <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-3 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Back Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProject(null)}
                      className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      data-testid="button-close-modal"
                      aria-label="Close"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </Button>
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                      <AvatarImage src={selectedProject.freelancer.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs sm:text-sm font-medium">
                        {selectedProject.freelancer.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'FL'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">{selectedProject.title}</DialogTitle>
                      <div className="flex items-center gap-0.5">
                        <p id="project-description" className="text-xs sm:text-sm text-gray-600 truncate">
                          by {selectedProject.freelancer.displayName || selectedProject.freelancer.name}
                        </p>
                        {selectedProject.freelancer.verificationBadge && selectedProject.freelancer.verificationBadge !== 'none' && (
                          selectedProject.freelancer.verificationBadge === 'blue' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0">
                              <g clipPath="url(#clip0_343_1428_portfolio_header)">
                                <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                              </g>
                              <defs>
                                <clipPath id="clip0_343_1428_portfolio_header">
                                  <rect width="24" height="24" fill="#fff" />
                                </clipPath>
                              </defs>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0">
                              <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                            </svg>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-5 text-xs sm:text-sm text-gray-500 pl-2 pr-1 sm:pl-0 sm:pr-0">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      {formatNumber(selectedProject.viewCount)}
                    </span>
                    <button 
                      className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
                      onClick={(e) => handleLikeToggle(e, selectedProject.id)}
                      data-testid={`button-like-modal-${selectedProject.id}`}
                    >
                      <Heart 
                        className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${likeStatusData?.[selectedProject.id] ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                      {formatNumber(selectedProject.likeCount)}
                    </button>
                    <button 
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                        showComments ? 'text-blue-600' : 'hover:text-blue-500'
                      }`}
                      onClick={handleToggleComments}
                      data-testid={`comment-count-${selectedProject.id}`}
                    >
                      <MessageCircle className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${showComments ? 'fill-blue-600' : ''}`} />
                      {formatNumber(selectedProjectComments.length)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Behance-Style Scrollable Content */}
              <div ref={projectDetailScrollRef} className="flex-1 overflow-y-auto bg-white">
                {/* Project Images Carousel - All images in horizontal line with arrows */}
                {selectedProject.media && selectedProject.media.length > 0 && (
                  <div className="w-full bg-gray-50 py-4 sm:py-8">
                    <div className="max-w-6xl mx-auto">
                      <BehanceStyleFeed
                        images={selectedProject.media}
                        className="max-w-none w-full"
                        testIdBase={`modal-project-${selectedProject.id}`}
                        onClick={() => {
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
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
                          {selectedProject.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="px-2 sm:px-3 py-1 text-xs sm:text-sm border-gray-300 hover:border-gray-400 transition-colors">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* More Projects Section - Behance Style */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">More projects</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects
                          .filter(p => p.id !== selectedProject.id && p.freelancer.id !== selectedProject.freelancer.id)
                          .slice(0, 6)
                          .map((project) => (
                            <div 
                              key={project.id}
                              className="group cursor-pointer transition-all duration-300 overflow-hidden border-0 bg-white rounded-lg"
                              onClick={() => handleProjectClick(project)}
                            >
                              <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                                {project.media && project.media[0] ? (
                                  <img 
                                    src={project.media[0]} 
                                    alt={project.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                                    <Grid className="h-12 w-12 opacity-50 text-gray-500" />
                                  </div>
                                )}
                                
                                <div className="absolute top-3 right-3 flex gap-2">
                                  <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {formatNumber(project.viewCount)}
                                  </div>
                                  <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    {formatNumber(project.likeCount)}
                                  </div>
                                </div>
                              </div>

                              <div className="p-4">
                                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                                  {project.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={project.freelancer.avatarUrl || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {project.freelancer.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'FL'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex items-center gap-0.5">
                                    <span className="text-sm text-gray-700">
                                      {project.freelancer.displayName || project.freelancer.name}
                                    </span>
                                    {project.freelancer.verificationBadge && project.freelancer.verificationBadge !== 'none' && (
                                      project.freelancer.verificationBadge === 'blue' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0">
                                          <g clipPath="url(#clip0_343_1428_portfolio_more)">
                                            <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                            <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                                          </g>
                                          <defs>
                                            <clipPath id="clip0_343_1428_portfolio_more">
                                              <rect width="24" height="24" fill="#fff" />
                                            </clipPath>
                                          </defs>
                                        </svg>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0">
                                          <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                                        </svg>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>

                    {/* Creator Profile Section */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={selectedProject.freelancer.avatarUrl || undefined} />
                          <AvatarFallback className="text-lg font-medium">
                            {selectedProject.freelancer.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'FL'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-0.5">
                            <h4 className="text-xl font-bold text-gray-900">
                              {selectedProject.freelancer.displayName || selectedProject.freelancer.name}
                            </h4>
                            {selectedProject.freelancer.verificationBadge && selectedProject.freelancer.verificationBadge !== 'none' && (
                              selectedProject.freelancer.verificationBadge === 'blue' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0">
                                  <g clipPath="url(#clip0_343_1428_portfolio_creator)">
                                    <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                    <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                                  </g>
                                  <defs>
                                    <clipPath id="clip0_343_1428_portfolio_creator">
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
                          {selectedProject.freelancer.rating && Number(selectedProject.freelancer.rating) > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600 font-medium">
                                {Number(selectedProject.freelancer.rating).toFixed(1)} • {selectedProject.freelancer.reviewCount} reviews
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Published {new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comment Section - Instant expand/collapse like Facebook */}
                    {showComments && (
                      <div ref={commentSectionRef} className="animate-in fade-in-50 duration-200">
                        <PortfolioCommentSection 
                          workId={selectedProject.id} 
                          currentUserId={user?.id}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom spacing for smooth scroll end */}
                <div className="h-16"></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={!!selectedImageUrl} onOpenChange={() => setSelectedImageUrl(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
          {selectedImageUrl && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={selectedImageUrl}
                alt="Portfolio Image"
                className="max-w-full max-h-full object-contain"
                data-testid="portfolio-image-viewer"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={() => setSelectedImageUrl(null)}
                data-testid="button-close-image-viewer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {!onNavigate && <Footer onNavigate={() => {}} />}
    </div>
  );
}

export default PortfolioGallery;
