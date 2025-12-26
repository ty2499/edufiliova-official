import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Video, MoreVertical, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOptimizedSocket } from '../../hooks/useOptimizedSocket';
import { useMessageCache } from '../../hooks/useMessageCache';
import VirtualizedMessageList from './VirtualizedMessageList';
import MessageComposer from './MessageComposer';
import TypingIndicator from './TypingIndicator';
import { Message } from '@shared/schema';
import { cn } from '@/lib/utils';
import { 
  conversationVariants, 
  AnimationWrapper,
  MessageSkeleton 
} from './MessageAnimations';

interface OptimizedMessagingInterfaceProps {
  conversationId: string;
  otherUserId: string;
  otherUserName?: string;
  onBack?: () => void;
}

/**
 * High-performance messaging interface with all optimizations
 * Features:
 * - Virtualized message list for performance
 * - Infinite scrolling with lazy loading
 * - Real-time updates with WebSocket
 * - Local caching for instant loading
 * - Optimized media handling
 * - Smooth WhatsApp-like animations
 * - Typing indicators and presence
 * - Voice messages and file uploads
 */
export default function OptimizedMessagingInterface({
  conversationId,
  otherUserId,
  otherUserName = 'Unknown User',
  onBack
}: OptimizedMessagingInterfaceProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Optimized hooks
  const { 
    connect, 
    disconnect, 
    sendTypingIndicator, 
    isConnected 
  } = useOptimizedSocket({
    typingThrottleMs: 1000,
    reconnectDelayMs: 1000,
    maxReconnectAttempts: 5
  });
  
  const {
    cacheMessage,
    getCachedMessages,
    cacheConversationMetadata,
    preloadMessages
  } = useMessageCache(conversationId);

  // Connect to WebSocket on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Listen for typing indicators
  useEffect(() => {
    const handleTyping = (event: CustomEvent) => {
      const { userId, isTyping } = event.detail;
      if (userId !== user?.userId) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(userId, isTyping);
          return newMap;
        });
      }
    };

    window.addEventListener('typing-indicator', handleTyping as EventListener);
    return () => {
      window.removeEventListener('typing-indicator', handleTyping as EventListener);
    };
  }, [user?.userId]);

  // Infinite query for messages with caching
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      // Try cache first
      if (pageParam === 1) {
        const cached = await getCachedMessages(50, 0);
        if (cached.length > 0) {
          return { data: cached, hasMore: true, page: pageParam };
        }
      }

      // Fetch from API
      const response = await fetch(
        `/api/messages/conversation/${otherUserId}?page=${pageParam}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const result = await response.json();
      
      // Cache messages
      if (result.success && result.data) {
        result.data.forEach((message: Message) => {
          cacheMessage(message.id, message);
        });
      }
      
      return {
        data: result.data || [],
        hasMore: result.data?.length === 50,
        page: pageParam
      };
    },
    getNextPageParam: (lastPage: any) => 
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Flatten messages from pages
  const messages = useMemo(() => {
    return messagesData?.pages.flatMap((page: any) => page.data) || [];
  }, [messagesData]);

  // Preload adjacent messages for smooth scrolling
  useEffect(() => {
    if (messages.length > 0) {
      const messageIds = messages.slice(-10).map(m => m.id);
      preloadMessages(messageIds);
    }
  }, [messages, preloadMessages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, file }: { content: string; file?: File }) => {
      const formData = new FormData();
      formData.append('receiverId', otherUserId);
      formData.append('content', content);
      
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Add optimistic update
      if (data.success && data.message) {
        queryClient.setQueryData(['messages', conversationId], (old: any) => {
          if (!old) return old;
          
          const newPages = [...old.pages];
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              data: [data.message, ...newPages[0].data]
            };
          }
          
          return { ...old, pages: newPages };
        });
        
        // Cache the new message
        cacheMessage(data.message.id, data.message);
      }
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    }
  });

  // Mark message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate unread count
      queryClient.invalidateQueries({ 
        queryKey: ['/api/messages', user?.id, 'unread-count'] 
      });
    }
  });

  // Handle sending messages
  const handleSendMessage = useCallback((content: string, file?: File) => {
    if (!content.trim() && !file) return;
    
    sendMessageMutation.mutate({ content, file });
    sendTypingIndicator(false);
  }, [sendMessageMutation, sendTypingIndicator]);

  // Handle marking messages as read
  const handleMessageRead = useCallback((messageId: string) => {
    markAsReadMutation.mutate(messageId);
  }, [markAsReadMutation]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle scroll to bottom
  const handleScrollToBottom = useCallback(() => {
    // Mark recent messages as read
    const unreadMessages = messages
      .filter(m => m.senderId !== user?.userId && !m.readAt)
      .slice(0, 5); // Only mark last 5 as read to avoid spam
    
    unreadMessages.forEach(message => {
      handleMessageRead(message.id);
    });
  }, [messages, user?.userId, handleMessageRead]);

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    
    return messages.filter(message =>
      message.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-primary mb-2">Failed to load messages</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimationWrapper
      variants={conversationVariants}
      className="flex flex-col h-full bg-white dark:bg-gray-900"
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors transition-all duration-300"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {otherUserName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors transition-all duration-300"
            data-testid="search-button"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors transition-all duration-300">
            <Phone className="w-5 h-5" />
          </button>
          
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors transition-all duration-300">
            <Video className="w-5 h-5" />
          </button>
          
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors transition-all duration-300">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4">
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <MessageSkeleton key={i} />
            ))}
          </div>
        ) : (
          <VirtualizedMessageList
            messages={filteredMessages}
            currentUserId={user?.id || ''}
            conversationId={conversationId}
            loadMoreMessages={loadMoreMessages}
            hasNextPage={hasNextPage || false}
            isLoadingMore={isFetchingNextPage}
            onScrollToBottom={handleScrollToBottom}
            typingUsers={typingUsers}
            onMessageRead={handleMessageRead}
          />
        )}
      </div>

      {/* Message composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        disabled={sendMessageMutation.isPending}
        conversationId={conversationId}
      />
    </AnimationWrapper>
  );
}
