import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BouncingBoxLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  message?: string;
}

export const BouncingBoxLoader: React.FC<BouncingBoxLoaderProps> = ({
  className,
  size = 'md',
  color = '#2f5a4e',
  message
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const boxVariants = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 90, 180, 270, 360],
      borderRadius: ["20%", "20%", "50%", "50%", "20%"],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const shadowVariants = {
    animate: {
      scale: [1, 0.6, 1],
      opacity: [0.3, 0.1, 0.3],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6", className)}>
      <div className="relative">
        <motion.div
          className={cn(sizeMap[size], "shadow-lg")}
          style={{ backgroundColor: color }}
          variants={boxVariants}
          animate="animate"
        />
        <motion.div
          className={cn(
            size === 'sm' ? 'w-6 h-1' : size === 'md' ? 'w-12 h-2' : 'w-20 h-3',
            "bg-black/10 rounded-full blur-sm mt-4 mx-auto"
          )}
          variants={shadowVariants}
          animate="animate"
        />
      </div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-muted-foreground font-medium animate-pulse"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export const BouncingCircleLoader: React.FC<BouncingBoxLoaderProps> = ({
  className,
  color = '#2f5a4e',
  message
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="flex space-x-2">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              y: [0, -15, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.1
            }}
          />
        ))}
      </div>
      {message && (
        <p className="text-sm text-muted-foreground font-medium animate-pulse mt-2">
          {message}
        </p>
      )}
    </div>
  );
};
