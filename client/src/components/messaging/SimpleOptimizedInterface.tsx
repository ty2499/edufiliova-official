import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, Smile, MessageCircle, Hash } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Message, QuickResponse } from '@shared/schema';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface SimpleOptimizedInterfaceProps {
  conversationId: string;
  otherUserId: string;
  otherUserName?: string;
  onBack?: () => void;
}

/**
 * Simplified high-performance messaging interface
 * Features optimizations without complex dependencies
 */
export default function SimpleOptimizedInterface({
  conversationId,
  otherUserId,
  otherUserName = 'Unknown User',
  onBack
}: SimpleOptimizedInterfaceProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [quickResponseQuery, setQuickResponseQuery] = useState('');
  const [selectedQuickResponseIndex, setSelectedQuickResponseIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const quickResponsesRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Fetch messages with optimized caching
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/messages/conversation/${otherUserId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false
  });

  // Fetch active quick responses for admins and customer service
  const { data: quickResponses = [] } = useQuery({
    queryKey: ['/api/admin/quick-responses'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/admin/quick-responses', {
        headers: { Authorization: sessionId || '' }
      });
      return (response.data || []).filter((response: QuickResponse) => response.isActive === true);
    },
    enabled: profile?.role === 'admin' || profile?.role === 'customer_service' // Fetch for admins and customer service
  });

  // Send message mutation with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: otherUserId,
          content
        })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onMutate: async (content) => {
      // Optimistic update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: user?.id || '',
        receiverId: otherUserId,
        groupId: null,
        threadId: null,
        content,
        messageType: 'text',
        fileUrl: null,
        fileType: null,
        isRead: null,
        deliveredAt: null,
        readAt: null,
        createdAt: new Date()
      };

      queryClient.setQueryData(['messages', conversationId], (old: Message[] = []) => [
        ...old,
        optimisticMessage
      ]);

      return { optimisticMessage };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      setNewMessage('');
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      queryClient.setQueryData(['messages', conversationId], (old: Message[] = []) =>
        old.filter(msg => msg.id !== context?.optimisticMessage.id)
      );
    }
  });

  // Handle sending messages
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage.trim());
  }, [newMessage, sendMessageMutation]);

  // Enhanced scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        });
      });
    }
  }, [shouldAutoScroll]);

  // Handle scroll events to detect user manual scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100; // 100px buffer
    setShouldAutoScroll(isAtBottom);
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom, shouldAutoScroll]);

  // Filter quick responses based on query
  const filteredQuickResponses = quickResponses.filter((response: QuickResponse) => 
    response.shortcut?.toLowerCase().includes(quickResponseQuery.toLowerCase()) ||
    response.title.toLowerCase().includes(quickResponseQuery.toLowerCase())
  );

  // Insert quick response
  const insertQuickResponse = useCallback((response: QuickResponse) => {
    const input = inputRef.current;
    if (!input) return;

    const cursorPosition = input.selectionStart || 0;
    const textBeforeCursor = newMessage.substring(0, cursorPosition);
    const textAfterCursor = newMessage.substring(cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlashIndex !== -1) {
      const newMessageText = textBeforeCursor.substring(0, lastSlashIndex) + response.content + textAfterCursor;
      setNewMessage(newMessageText);
      setShowQuickResponses(false);
      
      // Set cursor position after the inserted content
      setTimeout(() => {
        const newCursorPosition = lastSlashIndex + response.content.length;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
        input.focus();
      }, 0);
    }
  }, [newMessage]);

  // Handle input changes with quick response detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Check for quick response trigger (for admins and customer service)
    if ((profile?.role === 'admin' || profile?.role === 'customer_service') && quickResponses.length > 0) {
      const cursorPosition = e.target.selectionStart || 0;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
      
      if (lastSlashIndex !== -1) {
        // Check if "/" is at the start or after whitespace
        const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCursor[lastSlashIndex - 1] : ' ';
        if (charBeforeSlash === ' ' || lastSlashIndex === 0) {
          const query = textBeforeCursor.substring(lastSlashIndex + 1);
          setQuickResponseQuery(query);
          setShowQuickResponses(true);
          setSelectedQuickResponseIndex(0);
        } else {
          setShowQuickResponses(false);
        }
      } else {
        setShowQuickResponses(false);
      }
    }
  }, [profile?.role, quickResponses.length]);

  // Handle keyboard navigation for quick responses
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showQuickResponses && filteredQuickResponses.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedQuickResponseIndex(prev => 
            prev < filteredQuickResponses.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedQuickResponseIndex(prev => 
            prev > 0 ? prev - 1 : filteredQuickResponses.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          insertQuickResponse(filteredQuickResponses[selectedQuickResponseIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          setShowQuickResponses(false);
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [showQuickResponses, filteredQuickResponses, selectedQuickResponseIndex, insertQuickResponse, handleSendMessage]);

  // Enhanced message bubble component with modern styling
  const MessageBubble = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
    const messageTime = new Date(message.createdAt).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return (
      <div className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        {!isOwnMessage && (
          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center text-primary text-xs font-semibold mr-2 mt-1 flex-shrink-0">
            {otherUserName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <div
          className={cn(
            'max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-200 hover:shadow-xl',
            isOwnMessage
              ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-sm border-primary/20 shadow-primary/25'
              : 'bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 rounded-bl-sm border-gray-200/50 dark:border-gray-700/50 shadow-gray-900/10'
          )}
        >
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
              {message.content}
            </p>
          )}
          <div className={cn(
            'flex items-center justify-end mt-2 text-xs',
            isOwnMessage ? 'text-primary-foreground/70' : 'text-gray-500 dark:text-gray-400'
          )}>
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
            {profile?.name?.charAt(0)?.toUpperCase() || 'M'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
          
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {otherUserName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Online
            </p>
          </div>
        </div>
      </motion.div>

      {/* Messages - Full Height WhatsApp-like */}
      <div className="flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="space-y-4 w-full max-w-md">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="animate-pulse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={`flex mb-4 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg max-w-xs" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <MessageCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No messages yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start the conversation by sending a message</p>
            </div>
          </div>
        ) : (
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-2 scroll-smooth"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            }}
            onScroll={handleScroll}
          >
            <div className="space-y-1">
              <AnimatePresence>
                {messages.map((message: any, index: number) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.4, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: Math.min(index * 0.02, 0.3)
                    }}
                  >
                    <MessageBubble
                      message={message as any}
                      isOwnMessage={message.senderId === user?.id}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {/* Scroll anchor */}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Message input */}
      <motion.div 
        className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <div className="relative">
              {/* Quick Responses Dropdown */}
              <AnimatePresence>
                {showQuickResponses && filteredQuickResponses.length > 0 && (
                  <motion.div
                    ref={quickResponsesRef}
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto z-50"
                  >
                    <div className="p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 border-b border-gray-200 dark:border-gray-700">
                        Quick Responses
                      </div>
                      {filteredQuickResponses.map((response: QuickResponse, index: number) => (
                        <button
                          key={response.id}
                          onClick={() => insertQuickResponse(response)}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-md transition-colors mt-1',
                            'hover:bg-gray-100 dark:hover:bg-gray-700',
                            index === selectedQuickResponseIndex && 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3 text-gray-400" />
                            <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                              /{response.shortcut || response.title}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {response.content.slice(0, 50)}...
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Type your message...${(profile?.role === 'admin' || profile?.role === 'customer_service') ? ' (/ for quick responses)' : ''}`}
                disabled={sendMessageMutation.isPending}
                className={cn(
                  'w-full pl-4 pr-12 py-3 rounded-2xl border-2 border-gray-200/50 dark:border-gray-600/50',
                  'bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 backdrop-blur-sm',
                  'resize-none overflow-hidden transition-all duration-300 shadow-lg',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
                  'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                  'font-medium text-sm',
                  sendMessageMutation.isPending && 'opacity-50 cursor-not-allowed'
                )}
                style={{ maxHeight: '120px', minHeight: '52px' }}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors">
                  <Smile className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          <motion.button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className={cn(
              'p-3 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg transition-all duration-300',
              'hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed',
              'disabled:hover:scale-100 disabled:hover:shadow-lg',
              !newMessage.trim() ? 'bg-gray-400 dark:bg-gray-600' : ''
            )}
            whileHover={{ scale: newMessage.trim() ? 1.05 : 1 }}
            whileTap={{ scale: newMessage.trim() ? 0.95 : 1 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
