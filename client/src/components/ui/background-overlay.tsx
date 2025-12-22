import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface BackgroundOverlayProps {
  children: React.ReactNode
  className?: string
  overlayOpacity?: number
  gradientDirection?: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl'
  gradientColors?: string[]
  parallax?: boolean
  animated?: boolean
  customImage?: string
}

export const BackgroundOverlay = ({
  children,
  className,
  overlayOpacity = 0.7,
  gradientDirection = 'to-br',
  gradientColors = ['from-black/80', 'via-black/70', 'to-black/60'],
  parallax = false,
  animated = true,
  customImage
}: BackgroundOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Use a default gradient if no custom image is provided
  const backgroundImage = customImage
  const useGradientBackground = !backgroundImage

  useEffect(() => {
    setIsVisible(true)
    
    // Preload the image for faster loading if customImage is provided
    if (backgroundImage) {
      const img = new Image()
      img.onload = () => setImageLoaded(true)
      img.src = backgroundImage
    } else {
      setImageLoaded(true) // No image to load, mark as loaded
    }
  }, [backgroundImage])

  return (
    <section 
      className={cn(
        "relative min-h-screen flex items-center justify-center text-white overflow-hidden bg-faded-image",
        parallax && "parallax-bg",
        animated && "fade-in-background",
        isVisible && imageLoaded && "background-loaded",
        className
      )}
      style={{
        backgroundImage: backgroundImage && imageLoaded ? `url(${backgroundImage})` : 'none',
        background: useGradientBackground ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: imageLoaded ? 0.6 : 0.3,
        filter: imageLoaded ? 'brightness(0.7) contrast(0.85)' : 'brightness(0.9)',
        transition: 'opacity 0.4s ease-in-out, filter 0.4s ease-in-out',
        backgroundColor: useGradientBackground ? 'transparent' : '#1a1a2e',
        ...(parallax && { backgroundAttachment: 'fixed' })
      }}
    >
      {/* Loading indicator */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Gradient overlay with fading effect */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-",
          gradientDirection,
          ...gradientColors,
          animated && "animate-fade-in-overlay"
        )}
        style={{ opacity: overlayOpacity * 0.85 }}
      />

      {/* Animated particles effect */}
      {animated && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-white rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-white/40 rounded-full animate-pulse delay-300"></div>
        </div>
      )}

      {/* Content container with fade-in effect */}
      <div className={cn(
        "relative z-10 w-full",
        animated && "animate-slide-in-up"
      )}>
        {children}
      </div>
    </section>
  )
}

// Specialized variants
export const HeroOverlay = ({ children, className, ...props }: BackgroundOverlayProps) => (
  <BackgroundOverlay
    className={cn("min-h-[100vh]", className)}
    overlayOpacity={0.8}
    gradientDirection="to-br"
    gradientColors={['from-black/90', 'via-black/75', 'to-black/70']}
    parallax={true}
    animated={true}
    {...props}
  >
    {children}
  </BackgroundOverlay>
)

export const SectionOverlay = ({ children, className, ...props }: BackgroundOverlayProps) => (
  <BackgroundOverlay
    className={cn("min-h-[60vh] py-20", className)}
    overlayOpacity={0.6}
    gradientDirection="to-r"
    gradientColors={['from-primary/20', 'via-transparent', 'to-primary/20']}
    parallax={false}
    animated={true}
    {...props}
  >
    {children}
  </BackgroundOverlay>
)

export const CallToActionOverlay = ({ children, className, ...props }: BackgroundOverlayProps) => (
  <BackgroundOverlay
    className={cn("min-h-[50vh] py-16", className)}
    overlayOpacity={0.85}
    gradientDirection="to-br"
    gradientColors={['from-primary/90', 'via-primary/80', 'to-primary/70']}
    parallax={true}
    animated={true}
    {...props}
  >
    {children}
  </BackgroundOverlay>
)
