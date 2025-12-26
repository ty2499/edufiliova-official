import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Download, Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
  disableLightbox?: boolean;
  showDots?: boolean;
}

interface LightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

const ImageLightbox = ({ images, currentIndex, isOpen, onClose, productName }: LightboxProps) => {
  const [currentScrollIndex, setCurrentScrollIndex] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      setCurrentScrollIndex(currentIndex);
      setZoom(1);
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            left: currentIndex * scrollContainerRef.current.offsetWidth,
            behavior: 'auto'
          });
        }
      }, 0);
    }
  }, [currentIndex, isOpen]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || images.length <= 1) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth;
      const index = Math.round(scrollLeft / itemWidth);
      setCurrentScrollIndex(index);
      setZoom(1);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[currentScrollIndex];
    link.download = `${productName}-image-${currentScrollIndex + 1}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const goToPrevious = () => {
    const container = scrollContainerRef.current;
    if (container && images.length > 1) {
      const newIndex = currentScrollIndex === 0 ? images.length - 1 : currentScrollIndex - 1;
      container.scrollTo({
        left: newIndex * container.offsetWidth,
        behavior: 'smooth'
      });
    }
  };

  const goToNext = () => {
    const container = scrollContainerRef.current;
    if (container && images.length > 1) {
      const newIndex = currentScrollIndex === images.length - 1 ? 0 : currentScrollIndex + 1;
      container.scrollTo({
        left: newIndex * container.offsetWidth,
        behavior: 'smooth'
      });
    }
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-full max-h-screen p-0 bg-black/90">
        <DialogTitle className="sr-only">
          {productName} - Image {currentScrollIndex + 1} of {images.length}
        </DialogTitle>
        
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
          <div className="text-white text-sm bg-black/50 px-3 py-1 rounded">
            {currentScrollIndex + 1} / {images.length}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              data-testid="button-download-image"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              data-testid="button-close-lightbox"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative h-full w-full">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-scroll snap-x snap-mandatory scrollbar-hide h-full w-full"
            style={{ 
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory'
            }}
          >
            {images.map((image, index) => (
              <div 
                key={index}
                className="flex-shrink-0 w-full h-full snap-start flex items-center justify-center"
                style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
              >
                <img
                  src={image}
                  alt={`${productName} - Image ${index + 1}`}
                  className="max-w-full max-h-full object-contain transition-transform duration-300"
                  style={{
                    transform: `scale(${zoom})`,
                    cursor: zoom > 1 ? 'grab' : 'default'
                  }}
                  data-testid={`lightbox-image-${index}`}
                />
              </div>
            ))}
          </div>

          {/* Controls Overlay */}
          {images.length > 1 && (
            <div className="absolute inset-0 z-[60] pointer-events-none">
              {/* Navigation Arrows */}
              <button
                onClick={goToPrevious}
                className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all transition-all duration-300"
                aria-label="Previous image"
                data-testid="button-lightbox-previous"
              >
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>
              
              <button
                onClick={goToNext}
                className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all transition-all duration-300"
                aria-label="Next image"
                data-testid="button-lightbox-next"
              >
                <ChevronRight className="h-6 w-6 text-gray-700" />
              </button>

              {/* Pagination Dots */}
              <div className="pointer-events-auto absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center bg-black/50 px-3 py-2 rounded-lg" style={{ gap: '6px' }}>
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const container = scrollContainerRef.current;
                        if (container) {
                          container.scrollTo({
                            left: index * container.offsetWidth,
                            behavior: 'smooth'
                          });
                        }
                      }}
                      className={`rounded-full transition-all p-0 border-0 ${
                        index === currentScrollIndex 
                          ? 'bg-white' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      style={{ width: '4px', height: '4px', minWidth: '4px', minHeight: '4px' }}
                      aria-label={`Go to image ${index + 1}`}
                      data-testid={`lightbox-dot-${index}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ImageGallery = ({ images, productName, className = '', disableLightbox = false, showDots = false }: ImageGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const uniqueImages = Array.from(new Set(images)).filter(Boolean);
  const hasHoverEffect = uniqueImages.length >= 2;
  
  // Show second image on hover if there are multiple images
  const currentImage = hasHoverEffect && isHovered ? uniqueImages[1] : uniqueImages[0];
  
  // Check if current image is a video
  const isVideo = currentImage?.match(/\.(mp4|webm|ogg|mov)$/i) || currentImage?.includes('video');

  const openLightbox = (index: number, event?: React.MouseEvent) => {
    if (disableLightbox) return;
    
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (uniqueImages.length === 0) {
    return (
      <div className={`mb-4 ${className}`}>
        <div className="relative w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">No images available</p>
            <p className="text-xs text-gray-300">for {productName}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${className}`}>
        <div 
          className="relative h-full w-full flex items-center justify-center overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isVideo ? (
            <video
              src={currentImage}
              className={`max-w-full max-h-full object-contain rounded-lg border transition-all duration-500 ease-in-out transform ${!disableLightbox ? 'cursor-pointer' : ''}`}
              style={{
                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
              }}
              onClick={(e) => openLightbox(0, e)}
              data-testid="img-product-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={currentImage}
              alt={`${productName} preview`}
              className={`max-w-full max-h-full object-contain rounded-lg border transition-all duration-500 ease-in-out transform ${!disableLightbox ? 'cursor-pointer' : ''}`}
              style={{
                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
              }}
              onClick={(e) => openLightbox(0, e)}
              data-testid="img-product-cover"
              draggable={false}
            />
          )}
        </div>
      </div>

      <ImageLightbox
        images={uniqueImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        productName={productName}
      />
    </>
  );
};

export default ImageGallery;
