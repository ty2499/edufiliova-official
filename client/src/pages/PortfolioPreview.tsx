import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share,
  ExternalLink,
  Bookmark,
  Youtube,
  Play,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Tag,
  Globe,
  Lock,
  EyeOff,
  Grid,
  Maximize2
} from 'lucide-react';
import PortfolioCommentSection from '@/components/PortfolioCommentSection';

// Types
interface WorkMedia {
  id: string;
  type: 'image' | 'video' | 'youtube' | 'vimeo';
  url: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
  provider?: string;
  providerId?: string;
  sortOrder: number;
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
  userId: string;
  user?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
  };
}

interface PortfolioPreviewProps {
  onNavigate?: (page: string, transition?: string, data?: any) => void;
  workId?: string;
  commentId?: string;
}

export default function PortfolioPreview({ onNavigate, workId, commentId }: PortfolioPreviewProps) {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const commentSectionRef = useRef<HTMLDivElement>(null);

  // Get workId and commentId from URL or props
  const urlParams = new URLSearchParams(window.location.search);
  const currentWorkId = workId || urlParams.get('workId');
  const currentCommentId = commentId || urlParams.get('commentId');
  
  // Scroll to comment section when commentId is provided
  useEffect(() => {
    if (currentCommentId && commentSectionRef.current) {
      setTimeout(() => {
        commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [currentCommentId]);

  // Fetch portfolio work
  const { data: workData, isLoading, error } = useQuery({
    queryKey: ['/api/portfolio/works', currentWorkId],
    queryFn: async () => {
      if (!currentWorkId) throw new Error('No work ID provided');
      const data = await apiRequest(`/api/portfolio/works/${currentWorkId}`);
      console.log('🎨 Portfolio work API response:', data);
      // Ensure we return a valid object even if data is undefined
      return data || null;
    },
    enabled: !!currentWorkId
  });

  // Transform the data to match the expected format
  const work: PortfolioWork | undefined = workData ? {
    ...workData,
    media: (workData.media || []).map((media: any) => ({
      ...media,
      sortOrder: media.sortOrder ?? media.order ?? 0
    })),
    // Ensure all count fields have default values to prevent undefined errors
    likesCount: workData.likesCount ?? 0,
    commentsCount: workData.commentsCount ?? 0,
    viewsCount: workData.viewsCount ?? 0,
    user: workData.user ? {
      id: workData.userId,
      displayName: workData.user.displayName || workData.user.name,
      avatarUrl: workData.user.avatarUrl,
      bio: workData.user.bio || null
    } : undefined
  } : undefined;

  // Fetch similar projects for "More projects" section
  const { data: similarProjects = [] } = useQuery({
    queryKey: ['/api/showcase/approved'],
    queryFn: async () => {
      const response = await fetch('/api/showcase/approved');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!work // Only fetch when we have a current work
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/portfolio/works/${currentWorkId}/like`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/works', currentWorkId] });},
    onError: (error: any) => {}
  });

  const handleLike = () => {
    if (!user) {
      onNavigate?.('auth', 'slide-left');
      return;
    }
    likeMutation.mutate();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    // Try native share API first (mobile/modern browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: work?.title,
          text: work?.description,
          url: shareUrl,
        });
        // Note: Only fires if share completes, not if user cancels
      } catch (error: any) {
        // AbortError means user cancelled, which is normal behavior
        if (error.name !== 'AbortError') {
          // Fall through to clipboard copy
          copyToClipboard(shareUrl);
        }
      }
    } else {
      // Fallback to clipboard copy
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);return;
      } catch (error) {
        // Falls through to manual fallback
      }
    }
    
    // Fallback for older browsers or insecure contexts
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {} else {
        throw new Error('Copy command failed');
      }
    } catch (error) {}
  };

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (!work?.media.length) return;
    
    if (direction === 'prev') {
      setSelectedMediaIndex(prev => 
        prev === 0 ? work.media.length - 1 : prev - 1
      );
    } else {
      setSelectedMediaIndex(prev => 
        prev === work.media.length - 1 ? 0 : prev + 1
      );
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'unlisted':
        return <EyeOff className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const renderMedia = (media: WorkMedia, isMain = false) => {
    const className = isMain 
      ? "w-full max-h-[80vh] object-contain cursor-pointer transition-transform hover:scale-[1.02]" 
      : "w-full h-full object-cover transition-all hover:opacity-90";

    if (media.type === 'youtube' || media.type === 'vimeo') {
      let embedUrl = '';
      
      if (media.type === 'youtube' && media.providerId) {
        embedUrl = `https://www.youtube.com/embed/${media.providerId}`;
      } else if (media.type === 'vimeo' && media.providerId) {
        embedUrl = `https://player.vimeo.com/video/${media.providerId}`;
      }

      if (isMain && embedUrl) {
        return (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              title={`Video: ${media.providerId}`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      } else {
        return (
          <div className={`${className} bg-gray-900 flex items-center justify-center text-white relative`}>
            <Youtube className={isMain ? "h-16 w-16" : "h-8 w-8"} />
            {isMain && <Play className="absolute h-12 w-12 opacity-80" />}
          </div>
        );
      }
    }

    return (
      <img
        src={media.url}
        alt={`Media ${media.sortOrder + 1}`}
        className={className}
        onClick={() => isMain && setShowImageViewer(true)}
      />
    );
  };

  if (!currentWorkId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Work Not Found</h2>
            <p className="text-gray-600 mb-4">No portfolio work ID provided.</p>
            <Button onClick={() => onNavigate?.('portfolio-gallery')}>
              Browse Freelance Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-6xl">
          <div className="animate-pulse space-y-4 sm:space-y-8">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 sm:h-96 bg-gray-200 rounded"></div>
            <div className="space-y-3 sm:space-y-4">
              <div className="h-4 sm:h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Work Not Found</h2>
            <p className="text-gray-600 mb-4">This portfolio work doesn't exist or has been removed.</p>
            <Button onClick={() => onNavigate?.('portfolio-gallery')}>
              Browse Freelance Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMedia = work.media[selectedMediaIndex];
  const isOwner = user?.id === work.userId;

  return (
    <div className="min-h-screen bg-white" data-testid="portfolio-preview">
      {/* Behance-Style Header */}
      <div className="bg-white border-b sticky top-0 z-20 backdrop-blur-sm bg-white/90">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate?.('back')}
                data-testid="button-back-to-gallery"
                className="hover:bg-gray-100 transition-colors flex-shrink-0 px-2 sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Back</span>
              </Button>
              
              {/* View Mode Dropdown */}
              {work?.media && work.media.length > 1 && (
                <Select value={viewMode} onValueChange={(value: 'single' | 'grid') => setViewMode(value)}>
                  <SelectTrigger className="w-32" data-testid="select-view-mode">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single View</SelectItem>
                    <SelectItem value="grid">Grid View</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                data-testid="button-share-work"
                className="hover:bg-gray-100 px-2 sm:px-3"
              >
                <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              
              {!isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  data-testid="button-like-work"
                  className="hover:bg-red-50 hover:text-red-600 px-2 sm:px-3"
                >
                  <Heart className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${likeMutation.isPending ? 'animate-pulse' : ''}`} />
                  <span className="text-sm">{work.likesCount}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Behance-Style Content Area */}
      <div className="bg-white">
        {viewMode === 'single' && currentMedia ? (
          /* Single Image/Video View - Behance Style */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
            {/* Main Media */}
            <div className="mb-6 sm:mb-8">
              <div className="relative bg-gray-50 rounded-lg sm:rounded-xl overflow-hidden shadow-sm">
                <div className="relative min-h-[50vh] sm:min-h-[70vh] flex items-center justify-center">
                  {renderMedia(currentMedia, true)}
                  
                  {/* Media Navigation */}
                  {work.media.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute left-2 sm:left-6 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm p-2 sm:p-3"
                        onClick={() => navigateMedia('prev')}
                        data-testid="button-prev-media"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute right-2 sm:right-6 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm p-2 sm:p-3"
                        onClick={() => navigateMedia('next')}
                        data-testid="button-next-media"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Enhanced Thumbnails Bar */}
              {work.media.length > 1 && (
                <div className="mt-4 sm:mt-6">
                  <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {work.media.map((media, index) => (
                      <div
                        key={media.id}
                        className={`flex-shrink-0 w-20 h-16 sm:w-32 sm:h-24 rounded-md sm:rounded-lg cursor-pointer border-2 transition-all hover:scale-105 hover:shadow-md ${
                          index === selectedMediaIndex 
                            ? 'border-blue-500 shadow-md ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedMediaIndex(index)}
                        data-testid={`thumbnail-${index}`}
                      >
                        <div className="w-full h-full rounded-sm sm:rounded-md overflow-hidden">
                          {renderMedia(media)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Grid View - Behance Gallery Style */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
              {work.media.map((media, index) => (
                <div 
                  key={media.id}
                  className="break-inside-avoid group cursor-pointer rounded-lg sm:rounded-xl overflow-hidden bg-gray-50 hover:shadow-xl transition-all duration-300"
                  onClick={() => {
                    setSelectedMediaIndex(index);
                    setShowImageViewer(true);
                  }}
                  data-testid={`grid-media-${index}`}
                >
                  <div className="relative">
                    {renderMedia(media, false)}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/95 rounded-full p-2 sm:p-3 backdrop-blur-sm">
                        <Maximize2 className="h-4 w-4 sm:h-6 sm:w-6 text-gray-700" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Info Section */}
        <div className="bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="space-y-6 sm:space-y-8">
              
              {/* Work Details */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">{work.title}</h1>
                {work.description && (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                      {work.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {work.tags && work.tags.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Skills & Tools</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {work.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="px-2 sm:px-3 py-1 text-xs sm:text-sm border-gray-300 hover:border-gray-400 transition-colors">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Stats and Manage Work - Horizontal Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                
                {/* Project Stats */}
                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Project Stats</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600 text-sm sm:text-base">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        Views
                      </span>
                      <span className="font-semibold text-sm sm:text-base">{work.viewsCount > 999 ? `${Math.floor(work.viewsCount/1000)}k` : work.viewsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600 text-sm sm:text-base">
                        <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                        Likes
                      </span>
                      <span className="font-semibold text-sm sm:text-base">{work.likesCount > 999 ? `${Math.floor(work.likesCount/1000)}k` : work.likesCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600 text-sm sm:text-base">
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        Comments
                      </span>
                      <span className="font-semibold text-sm sm:text-base">{work.commentsCount > 999 ? `${Math.floor(work.commentsCount/1000)}k` : work.commentsCount}</span>
                    </div>
                    <Separator className="my-2 sm:my-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        Published
                      </span>
                      <span className="font-medium">
                        {new Date(work.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Management Actions */}
                {isOwner && (
                  <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Manage Work</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full text-sm sm:text-base"
                        onClick={() => onNavigate?.('portfolio-edit', '', { workId: work.id, work })}
                        data-testid="button-edit-work"
                      >
                        Edit Work
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full text-sm sm:text-base"
                        onClick={() => onNavigate?.('back')}
                        data-testid="button-manage-portfolio"
                      >
                        Back to Portfolio
                      </Button>
                    </div>
                    
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                      <div className="flex items-center justify-center gap-2">
                        {getVisibilityIcon(work.visibility)}
                        <Badge variant="outline" className="capitalize text-xs sm:text-sm">
                          {work.visibility}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div ref={commentSectionRef} className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-14 py-8">
          <PortfolioCommentSection 
            workId={currentWorkId!} 
            currentUserId={user?.id}
          />
        </div>

        {/* More Projects Section - Behance Style */}
        {similarProjects.length > 0 && (
          <div className="bg-white border-t">
            <div className="max-w-6xl mx-auto px-6 py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">More projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {similarProjects
                  .filter((project: any) => project.freelancer?.id !== work?.userId)
                  .slice(0, 6)
                  .map((project: any) => (
                    <div 
                      key={project.id}
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm bg-white rounded-lg"
                      onClick={() => onNavigate?.('portfolio-preview', 'slide-left', { workId: project.id })}
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
                            {project.viewCount}
                          </div>
                          <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {project.likeCount}
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {project.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={project.freelancer?.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {project.freelancer?.displayName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'FL'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700">
                            {project.freelancer?.displayName || project.freelancer?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Image Viewer */}
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          {currentMedia && currentMedia.type === 'image' && (
            <img
              src={currentMedia.url}
              alt={work.title}
              className="w-full h-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
