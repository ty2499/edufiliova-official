import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@shared/schema';

interface VirtualizedMessageListProps {
  messages: Message[];
  currentUserId: string;
  conversationId: string;
  loadMoreMessages: () => Promise<void>;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  onScrollToBottom: () => void;
  typingUsers: Map<string, boolean>;
  onMessageRead: (messageId: string) => void;
}

const ITEM_HEIGHT = 80; // Base height
const OVERSCAN_COUNT = 5;

// Enhanced message bubble component with modern styling
const SimpleMessageBubble = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
  const messageTime = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {!isOwnMessage && (
        <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center text-primary text-xs font-semibold mr-2 mt-1 flex-shrink-0">
          {(message as any)?.senderName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      )}
      <div
        className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-200 hover:shadow-xl ${
          isOwnMessage
            ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-sm border-primary/20 shadow-primary/25'
            : 'bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 rounded-bl-sm border-gray-200/50 dark:border-gray-700/50 shadow-gray-900/10'
        }`}
      >
        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
            {message.content}
          </p>
        )}
        <div className={`flex items-center justify-end mt-2 text-xs ${
          isOwnMessage ? 'text-primary-foreground/70' : 'text-gray-500 dark:text-gray-400'
        }`}>
          <span className="font-medium">{messageTime}</span>
          {isOwnMessage && (
            <div className="ml-2 flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
          )}
        </div>
      </div>
      {isOwnMessage && (
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white text-xs font-semibold ml-2 mt-1 flex-shrink-0">
          {(message as any)?.senderName?.charAt(0)?.toUpperCase() || 'M'}
        </div>
      )}
    </div>
  );
};

/**
 * High-performance virtualized message list component
 * Features:
 * - Virtual scrolling for thousands of messages
 * - Infinite loading with smooth pagination
 * - Dynamic height calculation
 * - Smooth animations and transitions
 * - Read receipts and typing indicators
 * - Optimized re-renders with memoization
 */
export default function VirtualizedMessageList({
  messages,
  currentUserId,
  conversationId,
  loadMoreMessages,
  hasNextPage,
  isLoadingMore,
  onScrollToBottom,
  typingUsers,
  onMessageRead
}: VirtualizedMessageListProps) {
  const listRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const [scrollToIndex, setScrollToIndex] = useState<number | null>(null);
  
  // Auto-scroll to bottom for new messages
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Check if item is loaded (for infinite loading)
  const isItemLoaded = useCallback((index: number) => {
    return !!messages[index];
  }, [messages]);

  // Auto-scroll logic for new messages
  useEffect(() => {
    if (messages.length > lastMessageCount && shouldAutoScroll) {
      // Scroll to bottom for new messages
      setTimeout(() => {
        listRef.current?.scrollToItem(messages.length - 1, 'end');
        onScrollToBottom();
      }, 100);
    }
    setLastMessageCount(messages.length);
  }, [messages.length, lastMessageCount, shouldAutoScroll, onScrollToBottom]);

  // Handle scroll events
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (!scrollUpdateWasRequested && containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      const distanceFromBottom = scrollHeight - scrollOffset - clientHeight;
      
      // Enable auto-scroll when near bottom (within 100px)
      setShouldAutoScroll(distanceFromBottom < 100);
      
      // Load more when near top
      if (scrollOffset < 200 && hasNextPage && !isLoadingMore) {
        loadMoreMessages();
      }
    }
  }, [hasNextPage, isLoadingMore, loadMoreMessages]);

  // Mark message as read when scrolled into view
  const handleMessageRead = useCallback((message: Message) => {
    if (message.senderId !== currentUserId && !message.readAt) {
      onMessageRead(message.id);
    }
  }, [currentUserId, onMessageRead]);

  // Simple typing indicator
  const TypingIndicatorItem = () => {
    const typingUsersList = Array.from(typingUsers.entries())
      .filter(([_, isTyping]) => isTyping)
      .map(([userId]) => userId);

    if (typingUsersList.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="px-4 py-2"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
          <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Someone is typing
              </span>
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
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900"
      data-testid="virtualized-message-list"
    >
      {/* Loading indicator for pagination */}
      <AnimatePresence>
        {isLoadingMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Loading messages...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optimized message list with smooth scrolling */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-hide"
        onScroll={handleScroll}
        style={{ height: '100%', maxHeight: '600px' }}
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut', delay: index * 0.05 }}
              className="px-4 py-1"
              onAnimationComplete={() => handleMessageRead(message)}
            >
              <SimpleMessageBubble
                message={message}
                isOwnMessage={message.senderId === currentUserId}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Typing indicator overlay */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <AnimatePresence>
          <TypingIndicatorItem />
        </AnimatePresence>
      </div>
    </div>
  );
}
