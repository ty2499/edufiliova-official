import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaCarousel } from '@/components/MediaCarousel';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Youtube,
  Image as ImageIcon,
  Tags,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  BarChart3,
  Heart,
  MessageCircle,
  Grid3X3,
  List,
  Loader2,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Types
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

// Portfolio Manager Component
interface PortfolioManagerProps {
  onNavigate?: (page: string, transition?: string, data?: any) => void;
}

export function PortfolioManager({ onNavigate }: PortfolioManagerProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'analytics'>('portfolio');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const queryClient = useQueryClient();

  // Fetch portfolio works
  const { data: works = [], isLoading: worksLoading, error: worksError, refetch: refetchWorks } = useQuery<PortfolioWork[]>({
    queryKey: ['/api/portfolio/my/works'],
    queryFn: async () => {
      console.log('🎨 Fetching portfolio works...');
      const response = await apiRequest('/api/portfolio/my/works');
      console.log('🎨 Portfolio API response:', response);
      const data = response.data || response || [];
      console.log('🎨 Portfolio works data:', data, 'length:', data.length);
      return data;
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Delete work mutation
  const deleteWorkMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/portfolio/works/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/my/works'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete portfolio work:', error.message);
    }
  });

  // Preview work handler
  const handlePreview = (work: PortfolioWork) => {
    if (onNavigate) {
      onNavigate('portfolio-preview', '', { workId: work.id });
    } else {
      window.open(`/portfolio/works/${work.id}`, '_blank');
    }
  };

  // Edit work handler
  const handleEdit = (work: PortfolioWork) => {
    if (onNavigate) {
      onNavigate('portfolio-edit', '', { workId: work.id, work });
    } else {
      window.location.href = `?page=portfolio-edit&workId=${work.id}`;
    }
  };

  // Premium circular loading component
  const PremiumLoader = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6', 
      lg: 'h-8 w-8'
    };
    
    return (
      <div className="flex items-center justify-center">
        <div className={`${sizeClasses[size]} relative`}>
          <div className={`${sizeClasses[size]} rounded-full border-2 border-blue-200 animate-pulse`}></div>
          <div className={`${sizeClasses[size]} absolute top-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin`}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="portfolio-manager">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary p-3 md:p-6 rounded-lg">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-white">Portfolio Management</h2>
          <p className="text-white text-sm md:text-base mt-1">
            Create and manage your portfolio projects and showcase submissions
          </p>
        </div>
      </div>

      {/* Tabs and View Toggle */}
      <div className="border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
          <div className="flex space-x-2 md:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'portfolio'
                  ? 'border-[#2f5a4e] text-[#2f5a4e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              data-testid="tab-portfolio"
            >
              Portfolio Works ({works.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-[#2f5a4e] text-[#2f5a4e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              data-testid="tab-analytics"
            >
              Analytics
            </button>
          </div>
          
          {/* View Dropdown - Only show on portfolio tab */}
          {activeTab === 'portfolio' && (
            <Select value={viewMode} onValueChange={(value: 'grid' | 'list') => setViewMode(value)}>
              <SelectTrigger className="w-full md:w-32" data-testid="select-view-mode">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
            <h3 className="text-lg font-semibold">Your Portfolio Works</h3>
            <Button 
              onClick={() => {
                if (onNavigate) {
                  onNavigate('portfolio-create', '', {});
                } else {
                  window.location.href = '?page=portfolio-create';
                }
              }} 
              className="w-10 h-10 md:w-auto bg-primary hover:bg-primary text-[#ffffff] p-0 md:p-2" transition-all duration-300 
              data-testid="button-create-work"
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Create New Work</span>
            </Button>
          </div>

          {worksError && (
            <Card className="border-red-200 bg-primary/10">
              <CardContent className="p-4 flex items-center justify-between">
                <p className="text-primary">Error loading works: {(worksError as Error).message}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchWorks()}
                  className="ml-4"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {worksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : works.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio works yet</h3>
                <p className="text-gray-500 mb-4">Create your first portfolio work to get started</p>
                <Button 
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('portfolio-create', '', {});
                    } else {
                      window.location.href = '?page=portfolio-create';
                    }
                  }} 
                  className="bg-primary hover:bg-primary text-white" transition-all duration-300
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Work
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((work) => (
                <Card key={work.id} className="group hover:shadow-lg transition-shadow" transition-all duration-300>
                  <CardContent className="p-0">
                    {/* Smart Media Preview Carousel - Clickable like Behance */}
                    <MediaCarousel
                      images={work.media?.filter(m => m.type === 'image').map(m => m.url) || []}
                      aspectRatio=""
                      heightClass="h-48"
                      testIdBase={`portfolio-work-${work.id}`}
                      onClick={() => handlePreview(work)}
                      className="rounded-t-lg"
                    />

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-2">
                          <h3 className="font-semibold text-lg truncate">{work.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                            {work.description}
                          </p>
                        </div>
                        <Badge 
                          variant={work.visibility === 'public' ? 'default' : 'secondary'}
                          className={work.visibility === 'public' ? 'text-white border-0' : ''}
                          style={work.visibility === 'public' ? { backgroundColor: '#2f5a4e' } : {}}
                        >
                          {work.visibility}
                        </Badge>
                      </div>

                      {/* Tags */}
                      {work.tags && work.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {work.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {work.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{work.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {work.viewsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {work.likesCount}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(work)}
                          className="flex-1 h-8 text-xs px-2 text-white border-0"
                          style={{ backgroundColor: '#0C332C' }}
                          data-testid={`button-edit-${work.id}`}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => deleteWorkMutation.mutate(work.id)}
                          disabled={deleteWorkMutation.isPending}
                          className="h-8 w-8 p-0 text-white border-0"
                          style={{ backgroundColor: '#0C332C' }}
                          data-testid={`button-delete-${work.id}`}
                        >
                          {deleteWorkMutation.isPending && deleteWorkMutation.variables === work.id ? (
                            <PremiumLoader size="sm" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-4">
              {works.map((work) => (
                <Card key={work.id} className="hover:shadow-lg transition-shadow" transition-all duration-300>
                  <CardContent className="p-3 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Thumbnail Carousel - Clickable for preview */}
                      <div className="w-full md:w-32 flex-shrink-0">
                        <MediaCarousel
                          images={work.media?.filter(m => m.type === 'image').map(m => m.url) || []}
                          aspectRatio=""
                          heightClass="h-20"
                          testIdBase={`portfolio-list-${work.id}`}
                          onClick={() => handlePreview(work)}
                          className="rounded-lg"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-0 mb-2">
                          <div className="flex-1 min-w-0 md:mr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg truncate">{work.title}</h3>
                              <Badge 
                                variant={work.visibility === 'public' ? 'default' : 'secondary'}
                                className={work.visibility === 'public' ? 'text-white border-0' : ''}
                                style={work.visibility === 'public' ? { backgroundColor: '#2f5a4e' } : {}}
                              >
                                {work.visibility}
                              </Badge>
                            </div>
                            <p className="text-gray-600 line-clamp-2 mb-2">
                              {work.description}
                            </p>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 flex-shrink-0 w-full md:w-auto">
                            <Button 
                              size="sm" 
                              onClick={() => handleEdit(work)}
                              className="h-8 text-xs px-3 text-white border-0 flex-1 md:flex-none"
                              style={{ backgroundColor: '#0C332C' }}
                              data-testid={`button-edit-list-${work.id}`}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => deleteWorkMutation.mutate(work.id)}
                              disabled={deleteWorkMutation.isPending}
                              className="h-8 w-8 p-0 text-white border-0"
                              style={{ backgroundColor: '#0C332C' }}
                              data-testid={`button-delete-list-${work.id}`}
                            >
                              {deleteWorkMutation.isPending && deleteWorkMutation.variables === work.id ? (
                                <PremiumLoader size="sm" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Tags */}
                        {work.tags && work.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {work.tags.slice(0, 5).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {work.tags.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{work.tags.length - 5}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {work.viewsCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {work.likesCount}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>{new Date(work.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Portfolio Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <Card>
              <CardContent className="p-4 md:p-6">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Works</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">{works.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                  {works.reduce((sum, work) => sum + work.viewsCount, 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Likes</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                  {works.reduce((sum, work) => sum + work.likesCount, 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Comments</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                  {works.reduce((sum, work) => sum + work.commentsCount, 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Works Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Works Performance</CardTitle>
              <CardDescription>Your latest portfolio works and their engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {works
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((work, index) => (
                    <div key={work.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 p-3 md:p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded overflow-hidden bg-gray-100">
                          {work.media[0] && (
                            <img
                              src={work.media[0].url}
                              alt={work.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{work.title}</p>
                          <p className="text-sm text-gray-500">
                            Created {new Date(work.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm w-full md:w-auto">
                        <div className="flex-1 md:flex-none text-center">
                          <p className="font-semibold text-sm">{work.viewsCount}</p>
                          <p className="text-gray-500 text-xs">Views</p>
                        </div>
                        <div className="flex-1 md:flex-none text-center">
                          <p className="font-semibold text-sm">{work.likesCount}</p>
                          <p className="text-gray-500 text-xs">Likes</p>
                        </div>
                        <div className="flex-1 md:flex-none text-center">
                          <p className="font-semibold text-sm">{work.commentsCount}</p>
                          <p className="text-gray-500 text-xs">Comments</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Visibility Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Visibility</CardTitle>
              <CardDescription>Distribution of your work visibility settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['public', 'unlisted', 'private'].map((visibility) => {
                  const count = works.filter(work => work.visibility === visibility).length;
                  const percentage = works.length > 0 ? Math.round((count / works.length) * 100) : 0;
                  return (
                    <div key={visibility} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          visibility === 'public' ? 'bg-[#2f5a4e]' :
                          visibility === 'unlisted' ? 'bg-[#2f5a4e]/60' : 'bg-[#2f5a4e]/30'
                        }`}></div>
                        <span className="text-sm capitalize">{visibility}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{count}</span>
                        <span className="text-xs text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Empty State */}
          {works.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data yet</h3>
                <p className="text-gray-500 mb-4">Create portfolio works to see detailed analytics and insights</p>
                <Button 
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('portfolio-create', '', {});
                    } else {
                      window.location.href = '?page=portfolio-create';
                    }
                  }}
                  className="bg-primary hover:bg-primary text-white" transition-all duration-300
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Work
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
