import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import BehanceStyleUpload, { UploadedImage } from '@/components/BehanceStyleUpload';
import { PORTFOLIO_CATEGORIES } from '@shared/portfolioCategories';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Upload, 
  Youtube, 
  Image as ImageIcon, 
  Video, 
  Eye, 
  EyeOff, 
  Lock,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// Portfolio work creation form schema aligned with server expectations
const createWorkFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().nullable().optional(),
  category: z.enum(PORTFOLIO_CATEGORIES as unknown as [string, ...string[]]).nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  visibility: z.enum(['public', 'unlisted', 'private']).optional().default('public')
});

type CreateWorkForm = z.infer<typeof createWorkFormSchema>;

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'youtube' | 'vimeo';
  url: string;
  thumbUrl?: string;
  order: number;
}

const COMMON_TAGS = [
  'Web Design', 'Mobile App', 'Logo Design', 'Branding', 'Photography', 'Illustration',
  'UI/UX', 'Frontend', 'Backend', 'Full Stack', 'React', 'Vue', 'Angular', 'Node.js',
  'Python', 'Digital Marketing', 'Content Writing', 'Video Editing', 'Animation', '3D Modeling'
];

interface PortfolioCreateProps {
  onNavigate?: (page: string, transition?: string, data?: any) => void;
}

export default function PortfolioCreate({ onNavigate }: PortfolioCreateProps) {
  // Detect edit mode from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const workId = urlParams.get('workId');
  const isEditMode = !!workId;


  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [coverImage, setCoverImage] = useState<UploadedImage | null>(null);
  const [videoUrls, setVideoUrls] = useState<MediaItem[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoType, setNewVideoType] = useState<'video' | 'youtube'>('youtube');
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch existing work data when in edit mode
  const { data: existingWork, isLoading: isLoadingWork, error: loadingError } = useQuery({
    queryKey: ['/api/portfolio/works', workId],
    queryFn: async () => {
      if (!workId) return null;
      return await apiRequest(`/api/portfolio/works/${workId}`);
    },
    enabled: isEditMode && !!workId,
  });


  const form = useForm({
    resolver: zodResolver(createWorkFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      tags: [],
      visibility: 'public' as const
    }
  });

  // Update portfolio work mutation
  const updateWorkMutation = useMutation({
    mutationFn: async (data: CreateWorkForm) => {
      // Combine uploaded images and video URLs into single media array
      const allMedia = [
        // Convert uploaded images to media format
        ...uploadedImages.filter(img => !img.uploading && !img.error).map((img, index) => ({
          type: 'image' as const,
          url: img.url,
          ...(img.thumbUrl && { thumbUrl: img.thumbUrl }),
          order: index
        })),
        // Add video URLs
        ...videoUrls.map((video, index) => {
          const mediaItem: any = {
            type: video.type,
            url: video.url,
            order: uploadedImages.length + index
          };
          
          // Add optional fields only if they exist
          if (video.thumbUrl) {
            mediaItem.thumbUrl = video.thumbUrl;
          }
          
          // Add provider info for video platforms
          if (video.type === 'youtube') {
            mediaItem.provider = 'youtube';
            // Extract YouTube video ID from URL
            const youtubeMatch = video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
            if (youtubeMatch) {
              mediaItem.providerId = youtubeMatch[1];
            }
          } else if (video.type === 'vimeo') {
            mediaItem.provider = 'vimeo';
            // Extract Vimeo video ID from URL
            const vimeoMatch = video.url.match(/vimeo\.com\/(\d+)/);
            if (vimeoMatch) {
              mediaItem.providerId = vimeoMatch[1];
            }
          }
          
          return mediaItem;
        })
      ];

      // Prepare cover image data
      const coverImageData = coverImage && !coverImage.uploading && !coverImage.error ? {
        type: 'image' as const,
        url: coverImage.url,
        ...(coverImage.thumbUrl && { thumbUrl: coverImage.thumbUrl })
      } : null;

      return apiRequest(`/api/portfolio/works/${workId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          media: allMedia,
          coverImage: coverImageData
        })
      });
    },
    onSuccess: () => {
      setSubmitState('success');
      setErrorMessage('');
      
      // Invalidate and refetch portfolio works to show updated work
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/my/works'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/works', workId] });
      
      // Navigate back to portfolio preview with a smooth transition
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('portfolio-preview', 'instant', { workId });
        } else {
          window.location.href = `?page=portfolio-preview&workId=${workId}`;
        }
      }, 2000);
    },
    onError: (error: any) => {
      console.error('Update work error:', error);
      setSubmitState('error');
      setErrorMessage(error.message || 'Failed to update portfolio work');
    }
  });

  // Create portfolio work mutation
  const createWorkMutation = useMutation({
    mutationFn: async (data: CreateWorkForm) => {
      // Combine uploaded images and video URLs into single media array
      const allMedia = [
        // Convert uploaded images to media format
        ...uploadedImages.filter(img => !img.uploading && !img.error).map((img, index) => ({
          type: 'image' as const,
          url: img.url,
          ...(img.thumbUrl && { thumbUrl: img.thumbUrl }),
          order: index
        })),
        // Add video URLs
        ...videoUrls.map((video, index) => {
          const mediaItem: any = {
            type: video.type,
            url: video.url,
            order: uploadedImages.length + index
          };
          
          // Add optional fields only if they exist
          if (video.thumbUrl) {
            mediaItem.thumbUrl = video.thumbUrl;
          }
          
          // Add provider info for video platforms
          if (video.type === 'youtube') {
            mediaItem.provider = 'youtube';
            // Extract YouTube video ID from URL
            const youtubeMatch = video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
            if (youtubeMatch) {
              mediaItem.providerId = youtubeMatch[1];
            }
          } else if (video.type === 'vimeo') {
            mediaItem.provider = 'vimeo';
            // Extract Vimeo video ID from URL
            const vimeoMatch = video.url.match(/vimeo\.com\/(\d+)/);
            if (vimeoMatch) {
              mediaItem.providerId = vimeoMatch[1];
            }
          }
          
          return mediaItem;
        })
      ];

      // Prepare cover image data
      const coverImageData = coverImage && !coverImage.uploading && !coverImage.error ? {
        type: 'image' as const,
        url: coverImage.url,
        ...(coverImage.thumbUrl && { thumbUrl: coverImage.thumbUrl })
      } : null;

      return apiRequest('/api/portfolio/works', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          media: allMedia,
          coverImage: coverImageData
        })
      });
    },
    onSuccess: () => {
      setSubmitState('success');
      setErrorMessage('');
      
      // Invalidate and refetch portfolio works to show the new work
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/my/works'] });
      
      // Navigate back to freelancer dashboard with a smooth transition
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('freelancer-dashboard', 'instant', { tab: 'portfolio' });
        } else {
          window.location.href = '?page=freelancer-dashboard';
        }
      }, 2000);
    },
    onError: (error: any) => {
      console.error('Create work error:', error);
      setSubmitState('error');
      setErrorMessage(error.message || 'Failed to create portfolio work');
    }
  });

  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    const currentTags = form.getValues('tags') || [];
    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      form.setValue('tags', [...currentTags, trimmedTag]);
      setCurrentTag('');
    }
  }, [form]);

  const removeTag = useCallback((tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  }, [form]);

  const addVideoUrl = useCallback(() => {
    if (!newVideoUrl.trim()) return;
    
    try {
      new URL(newVideoUrl); // Validate URL
      
      const newVideoItem: MediaItem = {
        id: Date.now().toString(),
        type: newVideoType,
        url: newVideoUrl,
        order: videoUrls.length
      };
      
      setVideoUrls(prev => [...prev, newVideoItem]);
      setNewVideoUrl('');
      
      // Visual feedback handled by UI state
    } catch (error) {
      setValidationErrors(prev => ({ ...prev, videoUrl: 'Please enter a valid URL' }));
      setTimeout(() => {
        setValidationErrors(prev => ({ ...prev, videoUrl: '' }));
      }, 3000);
    }
  }, [newVideoUrl, newVideoType, videoUrls.length]);

  const removeVideoUrl = useCallback((videoId: string) => {
    setVideoUrls(prev => prev.filter(v => v.id !== videoId));
  }, []);

  // Pre-populate form with existing work data in edit mode
  useEffect(() => {
    if (existingWork && isEditMode) {
      const workData = existingWork;
      
      // Populate form fields
      form.setValue('title', workData.title || '');
      form.setValue('description', workData.description || '');
      form.setValue('category', workData.category || '');
      form.setValue('tags', workData.tags || []);
      form.setValue('visibility', workData.visibility || 'public');
      
      // Populate cover image
      if (existingWork.coverImage) {
        setCoverImage({
          id: 'cover-existing',
          url: existingWork.coverImage.url,
          thumbUrl: existingWork.coverImage.thumbUrl || existingWork.coverImage.url,
          originalName: existingWork.coverImage.url.split('/').pop() || 'cover',
          size: 0,
          format: 'jpg',
          order: -1,
          uploading: false
        });
      }
      
      // Populate media
      if (existingWork.media && existingWork.media.length > 0) {
        const images: UploadedImage[] = [];
        const videos: MediaItem[] = [];
        
        existingWork.media.forEach((media: any, index: number) => {
          if (media.type === 'image') {
            images.push({
              id: media.id || `existing-${index}`,
              url: media.url,
              thumbUrl: media.thumbUrl || media.url,
              originalName: media.url.split('/').pop() || 'image',
              size: 0,
              format: 'jpg',
              order: index,
              uploading: false
            });
          } else if (['video', 'youtube', 'vimeo'].includes(media.type)) {
            videos.push({
              id: media.id || `existing-${index}`,
              type: media.type,
              url: media.url,
              thumbUrl: media.thumbUrl,
              order: index
            });
          }
        });
        
        setUploadedImages(images);
        setVideoUrls(videos);
      }
    }
  }, [existingWork, isEditMode, form]);

  const onSubmit = async (data: any) => {
    setValidationErrors({});
    setErrorMessage('');
    
    if (!user) {
      setSubmitState('error');
      setErrorMessage('Please sign in to create portfolio works');
      return;
    }

    // Check if we have any media (uploaded images or video URLs)
    const hasUploadedImages = uploadedImages.some(img => !img.uploading && !img.error);
    const hasVideoUrls = videoUrls.length > 0;
    
    if (!hasUploadedImages && !hasVideoUrls) {
      setSubmitState('error');
      setErrorMessage('Please upload at least one image or add a video/YouTube link');
      return;
    }

    setSubmitState('saving');
    if (isEditMode) {
      updateWorkMutation.mutate(data);
    } else {
      createWorkMutation.mutate(data);
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

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="portfolio-create">
      {/* Header */}
      <div style={{ backgroundColor: '#0C332C' }} className="px-4 sm:px-6 py-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              size="sm"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('freelancer-dashboard', 'instant', { tab: 'portfolio' });
                } else {
                  window.location.href = '?page=freelancer-dashboard';
                }
              }}
              style={{ backgroundColor: '#0C332C' }}
              className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold rounded-full p-2 hover:scale-110 self-start" transition-all duration-300
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-white">
              <h1 className="text-xl sm:text-2xl font-bold">
                {isEditMode ? 'Edit Portfolio Work' : 'Create New Portfolio Work'}
              </h1>
              <p className="text-white/90 text-sm sm:text-base">
                {isEditMode 
                  ? 'Update your existing portfolio work details'
                  : 'Showcase your skills and attract potential clients'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        
        {/* Loading State for Edit Mode */}
        {isEditMode && isLoadingWork && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading portfolio work details...</p>
          </div>
        )}

        {/* Error State for Edit Mode */}
        {isEditMode && loadingError && (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-primary-600" />
            <p className="text-primary-600 mb-4">Failed to load portfolio work details</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* No Work ID Error */}
        {!workId && window.location.search.includes('page=portfolio-edit') && (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-yellow-600" />
            <p className="text-yellow-600 mb-4">No portfolio work ID provided for editing</p>
            <Button 
              onClick={() => {
                if (onNavigate) {
                  onNavigate('freelancer-dashboard', 'instant', { tab: 'portfolio' });
                } else {
                  window.location.href = '?page=freelancer-dashboard';
                }
              }}
            >
              Go to Portfolio
            </Button>
          </div>
        )}

        {/* Show form when: creating new work OR editing and data is loaded OR editing and no error */}
        {(!isEditMode || existingWork || (!isLoadingWork && !loadingError)) && (
          <div className="grid grid-cols-1 gap-8">
            {/* Left Column - Creation Form */}
            <div className="space-y-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the essential details about your portfolio work
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a compelling title for your work"
                          data-testid="input-title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your work, the challenges you solved, technologies used, and your role in the project..."
                          rows={6}
                          data-testid="textarea-description"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        A detailed description helps clients understand your work and expertise.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          {PORTFOLIO_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a category to help clients filter and find your work
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-visibility">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center gap-2">
                              {getVisibilityIcon('public')}
                              <span>Public - Visible to everyone</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="unlisted">
                            <div className="flex items-center gap-2">
                              {getVisibilityIcon('unlisted')}
                              <span>Unlisted - Only visible with direct link</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center gap-2">
                              {getVisibilityIcon('private')}
                              <span>Private - Only visible to you</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Cover Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
                <CardDescription>
                  Upload a cover image for your portfolio work
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coverImage && !coverImage.uploading && coverImage.url ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={coverImage.url}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => setCoverImage(null)}
                        className="absolute top-2 right-2"
                        data-testid="button-remove-cover"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <BehanceStyleUpload
                    images={coverImage ? [coverImage] : []}
                    onImagesChange={(images) => setCoverImage(images[0] || null)}
                    maxImages={1}
                    maxSizePerImage={10}
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">
                  This will be the main cover image displayed for your work. Recommended size: 1200x800px
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags & Skills</CardTitle>
                <CardDescription>
                  Add relevant tags to help clients find your work
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Tags */}
                {(form.watch('tags') || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(form.watch('tags') || []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-primary-500" transition-all duration-300
                          data-testid={`button-remove-tag-${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add Tags */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (e.g., React, Web Design, Photography)"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(currentTag);
                      }
                    }}
                    data-testid="input-add-tag"
                  />
                  <Button
                    type="button"
                    onClick={() => addTag(currentTag)}
                    disabled={!currentTag.trim()}
                    style={{ backgroundColor: '#0C332C' }}
                    className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold" transition-all duration-300
                    data-testid="button-add-tag"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Common Tags */}
                <div>
                  <Label className="text-xs sm:text-sm font-medium mb-2 block">Popular tags:</Label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {COMMON_TAGS.slice(0, 10).map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        size="sm"
                        onClick={() => addTag(tag)}
                        disabled={(form.watch('tags') || []).includes(tag)}
                        style={{ backgroundColor: '#0C332C' }}
                        className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium flex items-center gap-1 disabled:opacity-50" transition-all duration-300
                        data-testid={`button-common-tag-${tag.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <Plus className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                        <span className="truncate max-w-[80px] sm:max-w-none">{tag}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Upload - Behance Style */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Images *</CardTitle>
              </CardHeader>
              <CardContent>
                <BehanceStyleUpload
                  images={uploadedImages}
                  onImagesChange={setUploadedImages}
                  maxImages={20}
                  maxSizePerImage={10}
                />
                
                {/* Video URLs Section */}
                {videoUrls.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <Label>Video Links ({videoUrls.length})</Label>
                    <div className="space-y-2">
                      {videoUrls.map((video) => (
                        <div key={video.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            {getMediaIcon(video.type)}
                            <span className="text-sm font-medium capitalize">{video.type}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{video.url}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => removeVideoUrl(video.id)}
                            style={{ backgroundColor: '#0C332C' }}
                            className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold" transition-all duration-300
                            data-testid={`button-remove-video-${video.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="my-6" />

                {/* Add Video URLs */}
                <div className="space-y-4">
                  <Label>Add Video Links (Optional)</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={newVideoType} onValueChange={(value: 'video' | 'youtube') => setNewVideoType(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              Video
                            </div>
                          </SelectItem>
                          <SelectItem value="youtube">
                            <div className="flex items-center gap-2">
                              <Youtube className="h-4 w-4" />
                              YouTube
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder={`Enter ${newVideoType} URL`}
                        value={newVideoUrl}
                        onChange={(e) => {
                          setNewVideoUrl(e.target.value);
                          if (validationErrors.videoUrl) {
                            setValidationErrors(prev => ({ ...prev, videoUrl: '' }));
                          }
                        }}
                        className={validationErrors.videoUrl ? 'border-primary focus:border-primary' : ''}
                        data-testid="input-video-url"
                      />
                      <Button
                        type="button"
                        onClick={addVideoUrl}
                        disabled={!newVideoUrl.trim()}
                        style={{ backgroundColor: '#0C332C' }}
                        className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold" transition-all duration-300
                        data-testid="button-add-video"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {validationErrors.videoUrl && (
                      <div className="text-primary-500 text-sm animate-in slide-in-from-top-1 duration-200">
                        {validationErrors.videoUrl}
                      </div>
                    )}
                  </div>
                  
                  
                </div>
              </CardContent>
            </Card>

                {/* Premium Feedback States */}
                {(submitState === 'error' || errorMessage) && (
                  <div className="bg-primary/10 border border-red-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-primary-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{errorMessage}</span>
                    </div>
                  </div>
                )}

                {submitState === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600 animate-pulse" />
                      <span className="text-sm font-medium">Portfolio work created successfully! Redirecting...</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-8">
                  <Button
                    type="submit"
                    disabled={submitState === 'saving' || submitState === 'success' || (uploadedImages.length === 0 && videoUrls.length === 0)}
                    className="relative px-12 py-4 text-lg font-bold text-white rounded-full border-0 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#0C332C' }}
                    data-testid="button-create-work"
                  >
                    <div className="relative z-10 flex items-center justify-center">
                      {submitState === 'saving' ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                          <span className="animate-pulse tracking-wide">Creating Magic...</span>
                        </>
                      ) : submitState === 'success' ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-3 text-white animate-bounce" />
                          <span className="tracking-wide">Created Successfully!</span>
                        </>
                      ) : (
                        <span className="tracking-wide">{isEditMode ? 'Edit Portfolio Work' : 'Create Portfolio Work'}</span>
                      )}
                    </div>
                  </Button>
                </div>
              </form>
            </Form>

            {/* Media Preview Grid - Below Submit Button */}
            <div className="pt-8">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Media Preview Grid */}
                  <div className="p-6">
                    {(uploadedImages.length > 0 || videoUrls.length > 0) ? (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Media ({uploadedImages.length + videoUrls.length})</h4>
                        
                        <div className="space-y-6">
                          {/* Images */}
                          {uploadedImages.filter(img => !img.uploading && !img.error).map((image, index) => (
                            <div key={image.id} className="relative group">
                              <div className="rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                                <img
                                  src={image.url}
                                  alt={image.originalName}
                                  loading="lazy"
                                  decoding="async"
                                  style={{ 
                                    display: 'block',
                                    maxWidth: '100%',
                                    height: 'auto',
                                    width: 'auto',
                                    imageRendering: 'crisp-edges'
                                  }}
                                />
                              </div>
                              <div className="absolute top-3 left-3">
                                <Badge variant="secondary" className="text-xs shadow-sm">
                                  {index + 1}
                                </Badge>
                              </div>
                            </div>
                          ))}

                          {/* Videos */}
                          {videoUrls.map((video, index) => (
                            <div key={video.id} className="relative group">
                              <div className="aspect-video rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center shadow-sm">
                                {video.type === 'youtube' ? (
                                  <div className="text-white text-center">
                                    <Youtube className="h-12 w-12 mx-auto mb-2" />
                                    <p className="text-sm opacity-80">YouTube Video</p>
                                  </div>
                                ) : (
                                  <div className="text-white text-center">
                                    <Video className="h-12 w-12 mx-auto mb-2" />
                                    <p className="text-sm opacity-80">Video</p>
                                  </div>
                                )}
                              </div>
                              <div className="absolute top-3 left-3">
                                <Badge variant="secondary" className="text-xs shadow-sm">
                                  {uploadedImages.length + index + 1}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <ImageIcon className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">No media added yet</p>
                        <p className="text-sm">Upload images or add video links to see them here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
