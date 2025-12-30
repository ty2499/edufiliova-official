import { motion } from 'framer-motion';

/**
 * WhatsApp-style animations and transitions
 * Features:
 * - Smooth slide-in animations for messages
 * - Staggered animations for message lists
 * - Bounce effects for interactions
 * - Page transitions
 * - Loading states with skeletons
 */

// Message entrance animations
export const messageVariants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      duration: 0.4
    }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

// Staggered list animations
export const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Conversation slide animations
export const conversationVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    x: '-100%', 
    opacity: 0,
    transition: {
      duration: 0.3
    }
  }
};

// Button interactions
export const buttonVariants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17
    }
  },
  tap: { 
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
};

// Floating action button
export const fabVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17
    }
  },
  hover: {
    scale: 1.1,
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
    transition: {
      duration: 0.2
    }
  }
};

// Typing indicator animation
export const typingVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { 
    opacity: 1, 
    height: 'auto',
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    height: 0,
    transition: {
      duration: 0.2
    }
  }
};

// Media loading animation
export const mediaVariants = {
  loading: {
    opacity: 0.6,
    scale: 0.95
  },
  loaded: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

// Skeleton loading animation
export const skeletonVariants = {
  loading: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as const
    }
  }
};

// Modal/overlay animations
export const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

export const modalVariants = {
  hidden: { 
    scale: 0.8, 
    opacity: 0,
    y: 50 
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    scale: 0.8, 
    opacity: 0,
    y: 50,
    transition: {
      duration: 0.2
    }
  }
};

// Notification badge animation
export const badgeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 20
    }
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  },
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 2
    }
  }
};

// Slide up from bottom animation (for sheets/modals)
export const slideUpVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    y: '100%', 
    opacity: 0,
    transition: {
      duration: 0.3
    }
  }
};

// Loading spinner animation
export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Reusable animated components
export const AnimatedMessage = motion.div;
export const AnimatedList = motion.div;
export const AnimatedButton = motion.button;
export const AnimatedModal = motion.div;
export const AnimatedOverlay = motion.div;

// Pre-configured animated components
export function MessageSkeleton() {
  return (
    <motion.div
      className="px-4 py-2"
      variants={skeletonVariants}
      animate="loading"
    >
      <div className="flex justify-end mb-4">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-12 w-48 max-w-xs" />
      </div>
      <div className="flex justify-start">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-8 w-32 max-w-xs" />
      </div>
    </motion.div>
  );
}

export function ConversationSkeleton() {
  return (
    <motion.div
      className="p-4 border-b border-gray-200 dark:border-gray-700"
      variants={skeletonVariants}
      animate="loading"
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="bg-gray-200 dark:bg-gray-700 h-4 w-24 mb-2 rounded" />
          <div className="bg-gray-200 dark:bg-gray-700 h-3 w-32 rounded" />
        </div>
      </div>
    </motion.div>
  );
}

// Animation wrapper component
interface AnimationWrapperProps {
  children: React.ReactNode;
  variants?: any;
  className?: string;
  initial?: string;
  animate?: string;
  exit?: string;
}

export function AnimationWrapper({
  children,
  variants = messageVariants,
  className = '',
  initial = 'hidden',
  animate = 'visible',
  exit = 'exit'
}: AnimationWrapperProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      layout
    >
      {children}
    </motion.div>
  );
}
