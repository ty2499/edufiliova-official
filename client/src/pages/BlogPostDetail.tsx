import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, Mail, Copy, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string | null;
  youtubeUrl: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  publishedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "DevOps Success": "bg-purple-100 text-purple-700 border-purple-200",
  "QA": "bg-green-100 text-green-700 border-green-200",
  "Continuous Testing": "bg-pink-100 text-pink-700 border-pink-200",
  "AI Test Scripts": "bg-blue-100 text-blue-700 border-blue-200",
  "Test Automation": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Code Coverage": "bg-orange-100 text-orange-700 border-orange-200"
};

interface BlogPostDetailProps {
  onNavigate: (page: string) => void;
  slug?: string | null;
}

function BlogPostDetail({ onNavigate, slug }: BlogPostDetailProps) {
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ['/api/blog-posts', slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog-posts/${slug}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch blog post');
      }
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // 15 minutes - blog content rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache longer
  });

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    try {
      let videoId: string | null = null;
      
      if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        videoId = match ? match[1] : null;
      } else if (url.includes('youtube.com')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      }
      
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch {
      return null;
    }
  };

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';
  const shareUrl = post?.slug ? `${baseUrl}/?page=blog-post-detail&slug=${post.slug}` : baseUrl;
  const shareTitle = post?.title || '';
  const shareDescription = post?.excerpt || '';

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedDescription = encodeURIComponent(shareDescription);

    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
        break;
      case 'copy':
        setShowCopyDialog(true);
        return;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowCopyDialog(false);
      }, 1500);
    } catch (err) {
      // Silent error handling - AJAX only
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const handleBackToBlog = () => {
    onNavigate('blog');
  };

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Blog post not found</h2>
          <Button onClick={handleBackToBlog}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        {/* Back Button and Share */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleBackToBlog}
            data-testid="button-back-to-blog"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </div>

        {/* Blog Post */}
        <Card className="bg-white dark:bg-gray-800 p-8 md:p-12">
          {/* Category & Date */}
          <div className="flex items-center gap-4 mb-6">
            <Badge 
              className={`${getCategoryColor(post.category)} border px-4 py-1.5 text-sm font-medium rounded-full`}
            >
              {post.category}
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(post.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h1 className="md:text-5xl font-bold text-gray-900 dark:text-white mb-8 text-[26px] font-['StackSans_Headline']">
            {post.title}
          </h1>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img 
                src={post.coverImage} 
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* YouTube Video */}
          {post.youtubeUrl && getYouTubeEmbedUrl(post.youtubeUrl) && (
            <div className="mb-8">
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={getYouTubeEmbedUrl(post.youtubeUrl)!}
                  title="YouTube video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* Share Section at Bottom */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Share this article
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('facebook')}
                  data-testid="share-bottom-facebook"
                  className="h-9 w-9 p-0 flex items-center justify-center rounded-full border-gray-300 dark:border-gray-600 hover:border-[#ff5834] hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Facebook className="h-4 w-4 text-blue-600 flex-shrink-0" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('twitter')}
                  data-testid="share-bottom-twitter"
                  className="h-9 w-9 p-0 flex items-center justify-center rounded-full border-gray-300 dark:border-gray-600 hover:border-[#ff5834] hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Twitter className="h-4 w-4 text-blue-600 flex-shrink-0" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('linkedin')}
                  data-testid="share-bottom-linkedin"
                  className="h-9 w-9 p-0 flex items-center justify-center rounded-full border-gray-300 dark:border-gray-600 hover:border-[#ff5834] hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Linkedin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('copy')}
                  data-testid="share-bottom-copy"
                  className="h-9 w-9 p-0 flex items-center justify-center rounded-full border-gray-300 dark:border-gray-600 hover:border-[#ff5834] hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LinkIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Copy Link Dialog */}
        <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Copy Link</DialogTitle>
              <DialogDescription>
                Share this blog post by copying the link below.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <Input
                value={shareUrl}
                readOnly
                data-testid="input-copy-link"
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopyToClipboard}
                data-testid="button-copy-to-clipboard"
                className="px-3"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default BlogPostDetail;
