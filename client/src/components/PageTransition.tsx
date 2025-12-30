import { ReactNode } from 'react';
import { TransitionType } from '@/hooks/usePageTransition';

interface PageTransitionProps {
  children: ReactNode;
  isActive: boolean;
  transitionType: TransitionType;
  isTransitioning: boolean;
  isExiting?: boolean;
}

const PageTransition = ({ 
  children, 
  isActive, 
  transitionType, 
  isTransitioning,
  isExiting = false
}: PageTransitionProps) => {
  if (!isActive) {
    return null;
  }

  const getAnimationStyle = (): React.CSSProperties => {
    if (transitionType === 'instant') {
      return { opacity: 1 };
    }

    if (isExiting) {
      return {
        opacity: 1,
        filter: 'blur(20px)',
        transform: 'scale(1.05)',
        transition: 'filter 600ms ease-in-out, transform 600ms ease-in-out, opacity 600ms ease-in-out',
      };
    }

    if (isTransitioning) {
      return {
        opacity: 0.8,
        filter: 'blur(20px)',
        transform: 'scale(1.05)',
        transition: 'none', // Keep it static while loading overlay is on top
      };
    }

    return {
      opacity: 1,
      transform: 'translateY(0)',
      filter: 'blur(0px)',
      transition: 'opacity 500ms ease-in-out, filter 500ms ease-in-out, transform 500ms ease-in-out',
    };
  };

  return (
    <div 
      className="page-container"
      style={getAnimationStyle()}
    >
      {children}
    </div>
  );
};

export default PageTransition;
