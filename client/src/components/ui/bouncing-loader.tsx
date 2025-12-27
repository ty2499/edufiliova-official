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

  const boxVariants: any = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 90, 180, 270, 360],
      borderRadius: ["20%", "20%", "50%", "50%", "20%"],
      backgroundColor: ["#0c332c", "#1a4d43", "#0c332c"],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const shadowVariants: any = {
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
          style={{ backgroundColor: "#0c332c" }}
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
  color = '#0c332c',
  message
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="flex space-x-3">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: color }}
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.15
            }}
          />
        ))}
      </div>
      {message && (
        <p className="text-sm text-[#0c332c]/70 font-semibold animate-pulse mt-4 tracking-wide uppercase">
          {message}
        </p>
      )}
    </div>
  );
};
