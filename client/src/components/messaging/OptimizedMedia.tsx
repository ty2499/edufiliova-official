import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedMediaProps {
  src: string;
  type: 'image' | 'video';
  alt?: string;
  className?: string;
  onLoad?: () => void;
  thumbnail?: string;
}

/**
 * Optimized media component with lazy loading and compression
 * Features:
 * - Progressive loading (thumbnail → full quality)
 * - Lazy loading with intersection observer
 * - Video preview with controls
 * - Smooth loading animations
 * - Error handling and fallbacks
 */
export default function OptimizedMedia({
  src,
  type,
  alt = '',
  className = '',
  onLoad,
  thumbnail
}: OptimizedMediaProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!mediaRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(mediaRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Handle successful load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsLoading(false);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle load error
  const handleError = useCallback(() => {
    setError(true);
    setIsLoading(false);
  }, []);

  // Enhanced thumbnail generation with aggressive optimization
  const getThumbnailUrl = useCallback((url: string) => {
    if (thumbnail) return thumbnail;
    
    // For Cloudinary URLs, add aggressive optimization parameters for thumbnails
    if (url.includes('cloudinary.com')) {
      // Insert optimized thumbnail transformations right after /upload/
      return url.replace(
        '/upload/',
        '/upload/w_300,h_200,c_fill,g_auto,f_auto,q_auto:low,dpr_auto,fl_progressive/'
      );
    }
    
    // For other URLs, return original (could implement more thumbnail logic)
    return url;
  }, [thumbnail]);

  // Enhanced full image URL with optimization
  const getOptimizedUrl = useCallback((url: string) => {
    if (url.includes('cloudinary.com')) {
      // Add optimizations for full quality image
      return url.replace(
        '/upload/',
        '/upload/f_auto,q_auto:good,dpr_auto,fl_progressive,w_auto,c_scale/'
      );
    }
    return url;
  }, []);

  if (type === 'image') {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-500">Failed to load image</span>
          </div>
        )}

        {/* Progressive image loading */}
        {shouldLoad && (
          <>
            {/* Thumbnail (low quality) */}
            <motion.img
              src={getThumbnailUrl(src)}
              alt={alt}
              className={cn(
                'w-full h-auto rounded-lg transition-opacity duration-300',
                isLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100'
              )}
              onLoad={() => {
                // Don't trigger main load callback for thumbnail
                setIsLoading(false);
              }}
              onError={handleError}
            />

            {/* Full quality image with optimization */}
            <motion.img
              ref={mediaRef as React.RefObject<HTMLImageElement>}
              src={getOptimizedUrl(src)}
              alt={alt}
              className={cn(
                'w-full h-auto rounded-lg transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={handleLoad}
              onError={handleError}
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              loading="lazy"
              decoding="async"
            />
          </>
        )}

        {/* Placeholder div for intersection observer */}
        {!shouldLoad && (
          <div
            ref={mediaRef as React.RefObject<HTMLDivElement>}
            className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        )}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <VideoPlayer
        ref={mediaRef as React.RefObject<HTMLVideoElement>}
        src={src}
        thumbnail={getThumbnailUrl(src)}
        className={className}
        shouldLoad={shouldLoad}
        onLoad={handleLoad}
        onError={handleError}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  return null;
}

// Separate video player component for cleaner code
interface VideoPlayerProps {
  src: string;
  thumbnail: string;
  className: string;
  shouldLoad: boolean;
  onLoad: () => void;
  onError: () => void;
  isLoading: boolean;
  error: boolean;
}

const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, thumbnail, className, shouldLoad, onLoad, onError, isLoading, error }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false);

    const handlePlayPause = useCallback(async () => {
      const video = ref as React.RefObject<HTMLVideoElement>;
      if (!video.current) return;

      try {
        if (isPlaying) {
          video.current.pause();
          setIsPlaying(false);
        } else {
          await video.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Video playback error:', error);
      }
    }, [isPlaying, ref]);

    return (
      <div 
        className={cn('relative overflow-hidden group cursor-pointer', className)}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={handlePlayPause}
      >
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-500">Failed to load video</span>
          </div>
        )}

        {/* Video element */}
        {shouldLoad && (
          <motion.video
            ref={ref}
            src={src}
            poster={thumbnail}
            className="w-full h-auto rounded-lg"
            onLoadedData={onLoad}
            onError={onError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            muted
            playsInline
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Play/Pause overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-gray-800" />
            ) : (
              <Play className="w-6 h-6 text-gray-800 ml-1" />
            )}
          </motion.button>
        </motion.div>

        {/* Video duration (optional) */}
        {shouldLoad && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            <Volume2 className="w-3 h-3" />
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
