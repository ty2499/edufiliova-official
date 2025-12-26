import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

// Simple cover image component for project cards
interface ProjectCoverProps {
  images: string[];
  aspectRatio?: string;
  className?: string;
  testIdBase: string;
  onClick?: (e?: React.MouseEvent | React.TouchEvent) => void;
}

export function ProjectCover({
  images,
  aspectRatio = 'aspect-[4/3]',
  className = '',
  testIdBase,
  onClick
}: ProjectCoverProps) {
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't stop propagation - let it bubble to parent Card
    onClick?.(e);
  };

  if (!images || images.length === 0) {
    return (
      <div 
        className={`${aspectRatio} ${className} bg-gray-100 flex items-center justify-center cursor-pointer rounded-lg touch-manipulation`}
        onClick={handleInteraction}
        onTouchEnd={handleInteraction}
        data-testid={`${testIdBase}-no-image`}
      >
        <div className="text-gray-400 text-sm">No image</div>
      </div>
    );
  }

  return (
    <div 
      className={`${aspectRatio} ${className} relative overflow-hidden bg-gray-100 cursor-pointer rounded-lg touch-manipulation active:scale-95 transition-transform`}
      onClick={handleInteraction}
      onTouchEnd={handleInteraction}
      data-testid={`${testIdBase}-cover`}
    >
      <img
        src={images[0]} // Only show first image as cover
        alt="Project cover"
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      
    </div>
  );
}

// Lightbox component for BehanceStyleFeed
interface BehanceImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

const BehanceImageLightbox = ({ images, currentIndex, isOpen, onClose, projectName = 'Project' }: BehanceImageLightboxProps) => {
  const [index, setIndex] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);

  // Sync internal index state when currentIndex or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setIndex(currentIndex);
      setZoom(1);
    }
  }, [currentIndex, isOpen]);

  // Add keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const goToPrevious = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoom(1);
  };

  const goToNext = () => {
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };


  if (!isOpen || images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-full max-h-screen p-0 bg-black/90" showClose={false} aria-describedby="lightbox-description">
        <DialogTitle className="sr-only">
          {projectName} - Image {index + 1} of {images.length}
        </DialogTitle>
        <div id="lightbox-description" className="sr-only">
          Full screen view of portfolio image {index + 1} of {images.length}. Use arrow keys to navigate, escape to close.
        </div>
        
        {/* Close Button at Top Right */}
        <button
          onClick={onClose}
          data-testid="button-close-lightbox"
          aria-label="Close lightbox"
          className="absolute top-6 right-6 z-50 w-12 h-12 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/30 shadow-lg transition-all duration-300"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        {/* Zoom Controls */}
        <div className="absolute bottom-20 right-6 z-50 flex flex-col gap-3">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            data-testid="button-zoom-out"
            aria-label="Zoom out"
            className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 transition-all duration-300"
          >
            <ZoomOut className="h-5 w-5 text-white" />
          </button>
          
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            data-testid="button-zoom-in"
            aria-label="Zoom in"
            className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 transition-all duration-300"
          >
            <ZoomIn className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Main Image */}
        <div className="flex items-center justify-center w-full h-full relative overflow-hidden">
          <img
            src={images[index]}
            alt={`${projectName} - Image ${index + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-300"
            style={{
              transform: `scale(${zoom})`,
              cursor: zoom > 1 ? 'grab' : 'default'
            }}
            data-testid={`lightbox-image-${index}`}
          />
        </div>

        {/* Navigation Controls */}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-6 top-1/2 transform -translate-y-1/2 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 border border-white/20 transition-all duration-300"
              onClick={goToPrevious}
              data-testid="button-previous-image"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            
            <button
              className="absolute right-6 top-1/2 transform -translate-y-1/2 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 border border-white/20 transition-all duration-300"
              onClick={goToNext}
              data-testid="button-next-image"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex gap-2 bg-black/50 p-2 rounded-lg max-w-md overflow-x-auto">
              {images.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => { setIndex(idx); setZoom(1); }}
                  className={`relative flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                    idx === index ? 'border-white' : 'border-gray-500 hover:border-gray-300'
                  }`}
                  data-testid={`thumbnail-${idx}`}
                  aria-label={`Go to image ${idx + 1}`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Behance-style vertical image feed component for modal
interface BehanceStyleFeedProps {
  images: string[];
  className?: string;
  testIdBase: string;
  onClick?: (e?: React.MouseEvent) => void;
  projectName?: string;
  disableLightbox?: boolean;
}

export function BehanceStyleFeed({
  images,
  className = '',
  testIdBase,
  onClick,
  projectName = 'Project',
  disableLightbox = false
}: BehanceStyleFeedProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const uniqueImages = Array.from(new Set(images)).filter(Boolean);

  const openLightbox = (index: number, event?: React.MouseEvent | React.TouchEvent) => {
    // Prevent click bubbling to parent elements
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (!images || images.length === 0) {
    return (
      <div 
        className={`${className} bg-gray-100 flex items-center justify-center p-8 cursor-pointer`}
        onClick={onClick}
        data-testid={`${testIdBase}-no-image`}
      >
        <div className="text-gray-400">No images</div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`${className}`}
        data-testid={`${testIdBase}-feed`}
      >
        {/* Vertical stack of images with no gaps */}
        {uniqueImages.map((image, index) => (
          <div
            key={index}
            className="w-full cursor-pointer group block touch-manipulation"
            data-testid={`${testIdBase}-image-${index}`}
            onClick={(e) => {
              if (disableLightbox && onClick) {
                onClick(e);
              } else {
                openLightbox(index, e);
              }
            }}
            onTouchEnd={(e) => {
              if (!disableLightbox) {
                openLightbox(index, e);
              }
            }}
          >
            <img
              src={image}
              alt={`Portfolio image ${index + 1}`}
              className="w-full h-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] block select-none transition-all duration-300"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {!disableLightbox && (
        <BehanceImageLightbox
          images={uniqueImages}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          projectName={projectName}
        />
      )}
    </>
  );
}

interface MediaCarouselProps {
  images: string[];
  aspectRatio?: string;
  heightClass?: string;
  rounded?: boolean;
  showDots?: boolean;
  showCounter?: boolean;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
  testIdBase: string;
  onClick?: (e?: React.MouseEvent) => void;
}

export function MediaCarousel({
  images,
  aspectRatio = 'aspect-[4/3]',
  heightClass,
  rounded = true,
  showDots = false,
  showCounter = false,
  initialIndex = 0,
  onIndexChange,
  className = '',
  testIdBase,
  onClick
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Don't render carousel for empty arrays
  if (!images || images.length === 0) {
    return (
      <div 
        className={`${aspectRatio} ${heightClass || ''} ${rounded ? 'rounded-lg' : ''} ${className} bg-gray-100 flex items-center justify-center cursor-pointer`}
        onClick={onClick}
        data-testid={`${testIdBase}-no-image`}
      >
        <div className="text-gray-400">No image</div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div 
        className={`${aspectRatio} ${heightClass || ''} ${rounded ? 'rounded-lg' : ''} ${className} relative overflow-hidden bg-gray-100 cursor-pointer`}
        onClick={onClick}
        data-testid={`${testIdBase}-single-image`}
      >
        <img
          src={images[0]}
          alt="Portfolio image"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  // Simple navigation functions without complex dependencies
  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    console.log('Previous clicked: current', currentIndex, '-> new', newIndex);
    
    if (trackRef.current) {
      const slideWidth = trackRef.current.clientWidth;
      trackRef.current.scrollTo({
        left: newIndex * slideWidth,
        behavior: 'smooth'
      });
    }
    
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    console.log('Next clicked: current', currentIndex, '-> new', newIndex);
    
    if (trackRef.current) {
      const slideWidth = trackRef.current.clientWidth;
      trackRef.current.scrollTo({
        left: newIndex * slideWidth,
        behavior: 'smooth'
      });
    }
    
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  const navigateToIndex = (index: number) => {
    if (index < 0 || index >= images.length) return;
    
    console.log('Navigate to index:', index);
    
    if (trackRef.current) {
      const slideWidth = trackRef.current.clientWidth;
      trackRef.current.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });
    }
    
    setCurrentIndex(index);
    onIndexChange?.(index);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrevious(e as any);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext(e as any);
    }
  };

  // Handle initial index on mount and when it changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < images.length && initialIndex !== currentIndex) {
      navigateToIndex(initialIndex);
    }
  }, [initialIndex, images.length]);

  // Handle resize to recalculate positions
  useEffect(() => {
    const handleResize = () => {
      if (trackRef.current) {
        const slideWidth = trackRef.current.clientWidth;
        trackRef.current.scrollLeft = currentIndex * slideWidth;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex]);

  return (
    <div 
      ref={containerRef}
      className={`${aspectRatio} ${heightClass || ''} ${rounded ? 'rounded-lg' : ''} ${className} relative overflow-hidden bg-gray-100 group cursor-pointer`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-testid={`${testIdBase}-carousel`}
    >
      {/* Image Track */}
      <div
        ref={trackRef}
        className="flex w-full h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ scrollSnapType: 'x mandatory' }}
        onScroll={() => {}}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full snap-center"
            data-testid={`${testIdBase}-slide-${index}`}
          >
            <img
              src={image}
              alt={`Portfolio image ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Image clicked:', image, 'Index:', index);
                // Prevent opening Cloudinary URL directly
                if (onClick) {
                  onClick(e);
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      {showDots && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                navigateToIndex(index);
              }}
              data-testid={`${testIdBase}-dot-${index}`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {showCounter && (
        <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

export default MediaCarousel;
