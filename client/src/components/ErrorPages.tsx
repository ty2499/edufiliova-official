import { Button } from "@/components/ui/button";
import { ArrowLeft, WifiOff, Wrench, Unplug, Lock, Package, Home, RefreshCw, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export type ErrorType = 'offline' | 'server-error' | 'not-found' | 'access-denied' | 'empty-search';

interface ErrorPageProps {
  type: ErrorType;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  onClearSearch?: () => void;
  searchQuery?: string;
}

const errorConfig = {
  'offline': {
    icon: WifiOff,
    iconColor: 'text-purple-600',
    title: "You're Offline—That's One Way to Disconnect",
    description: "Looks like we lost signal. You may be in a tunnel, or your end might be acting up. Either way, we're here to help.",
    primaryAction: 'refresh',
    primaryText: 'Refresh Page',
    secondaryText: 'Return Home'
  },
  'server-error': {
    icon: Wrench,
    iconColor: 'text-purple-600',
    title: "This is what happens when cats mess around.",
    description: "Something on our side went sideways. We're probably already on it—try refreshing in a moment.",
    primaryAction: 'retry',
    primaryText: 'Try Again',
    secondaryText: 'Return Home'
  },
  'not-found': {
    icon: Unplug,
    iconColor: 'text-purple-600',
    title: "A glitch in the matrix... or maybe just a broken link.",
    description: "We looked everywhere, but this page just doesn't seem to exist. Maybe it moved—or maybe it never did.",
    primaryAction: 'home',
    primaryText: 'Return Home',
    secondaryText: null
  },
  'access-denied': {
    icon: Lock,
    iconColor: 'text-purple-600',
    title: "This is kind of... top secret. Wanna try logging in?",
    description: "You're trying to view something that needs permission. We're just playing by the rules.",
    primaryAction: 'login',
    primaryText: 'Let Me In',
    secondaryText: 'Return Home'
  },
  'empty-search': {
    icon: Package,
    iconColor: 'text-purple-600',
    title: "...That Turned Up Empty.",
    description: "Nothing's showing up—yet. Try changing your search terms or removing filters.",
    primaryAction: 'clear',
    primaryText: 'Clear Search',
    secondaryText: 'Return Home'
  }
};

export function ErrorPage({ 
  type, 
  onRetry, 
  onGoHome, 
  onGoBack, 
  onClearSearch,
  searchQuery 
}: ErrorPageProps) {
  const config = errorConfig[type];
  const IconComponent = config.icon;
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const navigateHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      // If authenticated, go to dashboard; otherwise go to home
      if (user?.id) {
        navigate('/?page=student-dashboard');
      } else {
        navigate('/');
      }
    }
  };

  const handlePrimaryAction = () => {
    switch (config.primaryAction) {
      case 'refresh':
        window.location.reload();
        break;
      case 'retry':
        if (onRetry) onRetry();
        else window.location.reload();
        break;
      case 'home':
        navigateHome();
        break;
      case 'login':
        navigate('/?page=login');
        break;
      case 'clear':
        if (onClearSearch) onClearSearch();
        break;
    }
  };

  const handleGoHome = () => {
    navigateHome();
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateHome();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid={`error-page-${type}`}>
      <div className="p-4 border-b border-border">
        <button 
          onClick={handleGoBack}
          className="flex items-center gap-2 text-foreground hover:text-foreground transition-colors"
          data-testid="button-go-back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Go Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          <div className={`mx-auto w-24 h-24 flex items-center justify-center ${config.iconColor}`}>
            <IconComponent className="w-16 h-16 stroke-[1.5]" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-xl font-semibold text-foreground" data-testid={`text-error-title-${type}`}>
              {config.title}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed" data-testid={`text-error-description-${type}`}>
              {config.description}
            </p>
            {searchQuery && type === 'empty-search' && (
              <p className="text-muted-foreground text-xs mt-2">
                Search: "{searchQuery}"
              </p>
            )}
          </div>

          <div className="space-y-3 pt-4">
            {config.secondaryText && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleGoHome}
                data-testid="button-return-home"
              >
                <Home className="w-4 h-4 mr-2" />
                {config.secondaryText}
              </Button>
            )}
            
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handlePrimaryAction}
              data-testid={`button-primary-action-${type}`}
            >
              {config.primaryAction === 'refresh' && <RefreshCw className="w-4 h-4 mr-2" />}
              {config.primaryAction === 'retry' && <RefreshCw className="w-4 h-4 mr-2" />}
              {config.primaryAction === 'clear' && <Search className="w-4 h-4 mr-2" />}
              {config.primaryText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage({ onGoHome }: { onGoHome?: () => void }) {
  return <ErrorPage type="not-found" onGoHome={onGoHome} />;
}

export function ServerErrorPage({ onRetry }: { onRetry?: () => void }) {
  return <ErrorPage type="server-error" onRetry={onRetry} />;
}

export function OfflinePage() {
  return <ErrorPage type="offline" />;
}

export function AccessDeniedPage({ onGoHome }: { onGoHome?: () => void }) {
  return <ErrorPage type="access-denied" onGoHome={onGoHome} />;
}

export function EmptySearchPage({ 
  onClearSearch, 
  searchQuery 
}: { 
  onClearSearch?: () => void; 
  searchQuery?: string;
}) {
  return (
    <ErrorPage 
      type="empty-search" 
      onClearSearch={onClearSearch}
      searchQuery={searchQuery}
    />
  );
}

export default ErrorPage;
