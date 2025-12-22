import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface TypingIndicatorProps {
  userIds: string[];
}

/**
 * Animated typing indicator component
 * Features:
 * - Smooth fade in/out animations
 * - Multiple user support
 * - Bouncing dots animation
 * - User name display
 */
export default function TypingIndicator({ userIds }: TypingIndicatorProps) {
  const [visibleUsers, setVisibleUsers] = useState<string[]>([]);

  // Fetch user names for display
  const { data: userProfiles } = useQuery({
    queryKey: ['/api/profiles', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      
      const promises = userIds.map(userId =>
        fetch(`/api/profiles/${userId}`).then(res => res.json())
      );
      
      return Promise.all(promises);
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update visible users with animation delay
  useEffect(() => {
    if (userIds.length > 0) {
      setVisibleUsers(userIds);
    } else {
      // Delay hiding to allow exit animation
      const timeout = setTimeout(() => setVisibleUsers([]), 200);
      return () => clearTimeout(timeout);
    }
  }, [userIds]);

  // Format user names for display
  const getUserNames = () => {
    if (!userProfiles || userProfiles.length === 0) return 'Someone';
    
    const names = userProfiles
      .filter(profile => profile.success)
      .map(profile => profile.data?.name || 'Unknown')
      .filter(name => name !== 'Unknown');
    
    if (names.length === 0) return 'Someone';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]} and ${names.length - 1} others`;
  };

  if (visibleUsers.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex items-center space-x-2 px-4 py-2"
      >
        {/* Avatar placeholder */}
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
        
        {/* Typing bubble */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-2 shadow-sm"
        >
          <div className="flex items-center space-x-1">
            {/* Typing text */}
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {getUserNames()} {visibleUsers.length === 1 ? 'is' : 'are'} typing
            </span>
            
            {/* Animated dots */}
            <div className="flex space-x-0.5 ml-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 bg-gray-400 rounded-full"
                  animate={{
                    y: [0, -4, 0],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
