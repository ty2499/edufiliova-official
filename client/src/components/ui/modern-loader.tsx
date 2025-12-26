import { cn } from '@/lib/utils'

// Modern Pulse Loader
export const PulseLoader = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center space-x-2", className)}>
    <div className="w-3 h-3 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
    <div className="w-3 h-3 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
  </div>
)

// Spinner Loader
export const SpinnerLoader = ({ className, size = "md" }: { 
  className?: string
  size?: "sm" | "md" | "lg" 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }
  
  return (
    <div className={cn("animate-spin rounded-full border-2 border-muted border-t-primary", sizeClasses[size], className)}></div>
  )
}

// Skeleton Wave Loader
export const SkeletonWave = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded-md", className)}></div>
)

// Progress Bar Loader
export const ProgressLoader = ({ 
  progress, 
  className,
  showPercentage = false 
}: { 
  progress: number
  className?: string
  showPercentage?: boolean 
}) => (
  <div className={cn("w-full", className)}>
    <div className="bg-muted rounded-full h-2 overflow-hidden">
      <div 
        className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      ></div>
    </div>
    {showPercentage && (
      <div className="text-xs text-muted-foreground mt-1 text-center">
        {Math.round(progress)}%
      </div>
    )}
  </div>
)

// Modern Card Skeleton
export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("border rounded-lg p-4 space-y-3", className)}>
    <SkeletonWave className="h-4 w-3/4" />
    <SkeletonWave className="h-3 w-1/2" />
    <div className="space-y-2">
      <SkeletonWave className="h-3 w-full" />
      <SkeletonWave className="h-3 w-5/6" />
    </div>
  </div>
)

// Loading Overlay
export const LoadingOverlay = ({ 
  isLoading, 
  children,
  message = "Loading...",
  className 
}: {
  isLoading: boolean
  children: React.ReactNode
  message?: string
  className?: string
}) => (
  <div className={cn("relative", className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
        <div className="text-center space-y-4">
          <SpinnerLoader size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    )}
  </div>
)

// Infinite Scroll Loader
export const InfiniteScrollLoader = ({ 
  isLoading,
  hasMore,
  onLoadMore,
  className 
}: {
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  className?: string
}) => {
  React.useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        if (hasMore && !isLoading) {
          onLoadMore()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading, onLoadMore])

  if (!hasMore) return null

  return (
    <div className={cn("flex justify-center py-8", className)}>
      {isLoading ? (
        <SpinnerLoader />
      ) : (
        <button 
          onClick={onLoadMore}
          className="text-foreground hover:text-foreground/80 text-sm transition-all duration-300"
        >
          Load more
        </button>
      )}
    </div>
  )
}
