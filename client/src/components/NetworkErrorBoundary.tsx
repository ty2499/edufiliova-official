import { Component, ReactNode } from 'react';
import { ServerErrorPage, OfflinePage } from '@/components/ErrorPages';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorType: 'network' | 'runtime' | null;
  isOffline: boolean;
}

class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorType: null,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false
    };
  }

  static getDerivedStateFromError(error: Error) {
    const isNetworkError = error.message?.toLowerCase().includes('network') ||
                          error.message?.toLowerCase().includes('fetch') ||
                          error.name === 'TypeError';
    
    return { 
      hasError: true, 
      errorType: isNetworkError ? 'network' : 'runtime'
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('NetworkErrorBoundary caught error:', error);
    console.error('Error info:', errorInfo?.componentStack);
  }

  componentDidMount() {
    if (!navigator.onLine) {
      this.setState({ isOffline: true });
    }
    
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('online', this.handleOnline);
  }

  componentWillUnmount() {
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('online', this.handleOnline);
  }

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  handleOnline = () => {
    this.setState({ isOffline: false });
    if (this.state.hasError && this.state.errorType === 'network') {
      this.handleRetry();
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, errorType: null });
    window.location.reload();
  };

  render() {
    if (this.state.isOffline) {
      return <OfflinePage />;
    }

    if (this.state.hasError) {
      return <ServerErrorPage onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;
