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
        opacity: 0,
        transform: 'translateY(-8px)',
        transition: 'opacity 200ms ease-out, transform 200ms ease-out',
      };
    }

    if (isTransitioning && !isExiting) {
      return {
        opacity: 1,
        transform: 'translateY(0)',
        filter: 'blur(12px)',
        transition: 'opacity 400ms ease-in-out, filter 400ms ease-in-out, transform 400ms ease-in-out',
      };
    }

    return {
      opacity: 1,
      transform: 'translateY(0)',
      transition: 'opacity 250ms ease-out, transform 250ms ease-out',
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
