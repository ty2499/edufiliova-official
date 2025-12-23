import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  ChevronLeft,
  Check,
  CheckCheck,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest } from '@/lib/queryClient';
import { useFreelancerChat } from '@/contexts/FreelancerChatContext';

interface FreelancerChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType?: 'text' | 'voice' | 'image' | 'video' | 'document' | 'location';
  sentAt?: string;
  isRead?: boolean;
  createdAt: string;
  readAt?: string;
  senderName?: string;
  senderAvatarUrl?: string;
}

export function FreelancerChatWidget() {
  const { freelancerInfo: freelancer, currentUserId, isChatOpen, setIsChatOpen } = useFreelancerChat();
  const [messages, setMessages] = useState<FreelancerChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const isMobile = useIsMobile();

  // Debug logging BEFORE any early returns
  console.log('🔵 FreelancerChatWidget START render - isChatOpen:', isChatOpen, 'freelancer:', freelancer, 'currentUserId:', currentUserId, 'conversationId:', conversationId);
  console.log('🔵 Messages count:', messages.length, 'Messages:', messages);

  // Reset scroll state when conversation changes
  useEffect(() => {
    lastMessageIdRef.current = null;
    isInitialLoadRef.current = true;
  }, [conversationId, threadId]);

  // Smart auto-scroll: only scroll when new messages arrive and user is near bottom
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || messages.length === 0) return;

    // Get the latest message ID
    const latestMessage = messages[messages.length - 1];
    const latestMessageId = latestMessage?.id;

    // Check if this is actually a new message (by comparing IDs, not count)
    const hasNewMessage = latestMessageId && latestMessageId !== lastMessageIdRef.current;

    if (hasNewMessage || isInitialLoadRef.current) {
      const scrollHeight = scrollContainer.scrollHeight;
      const scrollTop = scrollContainer.scrollTop;
      const clientHeight = scrollContainer.clientHeight;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom

      // Only auto-scroll if:
      // 1. This is the initial load OR
      // 2. User is already near the bottom (not viewing old messages)
      if (isInitialLoadRef.current || isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }

      // Update tracking
      lastMessageIdRef.current = latestMessageId;
      isInitialLoadRef.current = false;
    }
  }, [messages]);

  // Initialize chat - start conversation with freelancer
  useEffect(() => {
    if (!freelancer || !currentUserId || !isChatOpen) return;
    
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        const sessionId = localStorage.getItem('sessionId');
        
        // Start chat with freelancer
        const chatResponse = await apiRequest('/api/messages/start-freelancer-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionId}`
          },
          body: JSON.stringify({ freelancerId: freelancer.id })
        });

        if (chatResponse.conversationId) {
          setConversationId(chatResponse.conversationId);
          setThreadId(chatResponse.threadId);
          
          // Load existing messages
          loadMessages(chatResponse.conversationId);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [freelancer?.id, currentUserId, isChatOpen]);

  // Load messages for conversation
  const loadMessages = async (convId: string) => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/messages/conversation/${convId}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      
      console.log('📨 Chat widget received response:', response);
      console.log('📨 Response data:', response.data);
      console.log('📨 Messages to set:', response.data || response);
      
      let messageData = response.data || response;
      
      // Sort messages by creation date to ensure proper order
      if (Array.isArray(messageData) && messageData.length > 0) {
        messageData = messageData.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        console.log('✅ Setting messages:', messageData.length, 'messages');
        setMessages(messageData);
      } else {
        console.log('⚠️ No messages in response or not an array');
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!conversationId) return;

    const pollInterval = setInterval(() => {
      loadMessages(conversationId);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [conversationId]);
  
  // Only hide widget when chat is explicitly closed
  if (!isChatOpen) {
    return null;
  }
  
  // Show loading state if freelancer info or current user ID is not ready
  if (!freelancer || !currentUserId) {
    return null; // Could show a loading spinner here instead
  }
  
  const onClose = () => setIsChatOpen(false);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || isSending) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const sessionId = localStorage.getItem('sessionId');
      await apiRequest('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify({
          receiverId: freelancer.id,
          content: messageToSend,
          threadId: threadId
        })
      });

      // Reload messages to show the new one
      await loadMessages(conversationId);
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageToSend); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mobile view (fullscreen)
  if (isMobile) {
    return (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 bg-white flex flex-col"
        style={{ height: '100dvh' }}
      >
        {/* Header */}
        <div className="bg-[#0C332C] text-white p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-md flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-9 w-9"
            data-testid="button-close-chat"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
            <AvatarImage src={freelancer.avatarUrl} alt={freelancer.name} />
            <AvatarFallback className="bg-white/20 text-white text-sm">
              {freelancer.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate">{freelancer.name}</h3>
            {freelancer.professionalTitle && (
              <p className="text-xs text-white/80 truncate">{freelancer.professionalTitle}</p>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollContainerRef} className="flex-1 bg-gray-50 overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C332C] mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading chat...</p>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-6">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.senderId === currentUserId;
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2 items-end",
                        isOwnMessage ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {!isOwnMessage && (
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                          <AvatarImage src={message.senderAvatarUrl || freelancer.avatarUrl} />
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                            {(message.senderName || freelancer.name).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[75%] sm:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3",
                          isOwnMessage
                            ? "bg-[#0C332C] text-white rounded-br-sm"
                            : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed overflow-wrap-anywhere">{message.content}</p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1.5 sm:mt-2 text-xs",
                          isOwnMessage ? "text-white/70" : "text-gray-500"
                        )}>
                          <span className="text-[10px] sm:text-xs">{new Date(message.sentAt || message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                          {isOwnMessage && (
                            message.readAt ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="bg-white border-t p-2.5 sm:p-3 flex-shrink-0" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
          <div className="flex gap-2 items-center">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 rounded-full border-gray-300 focus:border-[#0C332C] focus:ring-[#0C332C] h-10 text-sm"
              disabled={isLoading || isSending}
              data-testid="input-message"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading || isSending}
              size="icon"
              className="rounded-full bg-[#0C332C] hover:bg-[#2548c9] text-white h-10 w-10 flex-shrink-0"
              data-testid="button-send"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Desktop view (popup widget)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          "fixed bottom-4 right-4 z-50 w-96 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col",
          isMinimized ? "h-auto" : "h-[550px]"
        )}
      >
        {/* Header */}
        <div className="bg-[#0C332C] text-white p-3 flex items-center gap-3 flex-shrink-0">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={freelancer.avatarUrl} alt={freelancer.name} />
            <AvatarFallback className="bg-white/20 text-white text-sm">
              {freelancer.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{freelancer.name}</h3>
            {freelancer.professionalTitle && (
              <p className="text-xs text-white/80 truncate">{freelancer.professionalTitle}</p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 h-8 w-8"
              data-testid="button-minimize"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8"
              data-testid="button-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div ref={scrollContainerRef} className="flex-1 bg-gray-50 overflow-y-auto overflow-x-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C332C] mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading chat...</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3 pb-6">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No messages yet. Start a conversation!
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.senderId === currentUserId;
                      
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2 items-end",
                            isOwnMessage ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          {!isOwnMessage && (
                            <Avatar className="h-7 w-7 flex-shrink-0">
                              <AvatarImage src={message.senderAvatarUrl || freelancer.avatarUrl} />
                              <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                {(message.senderName || freelancer.name).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-3 py-2",
                              isOwnMessage
                                ? "bg-[#0C332C] text-white rounded-br-sm"
                                : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed overflow-wrap-anywhere">{message.content}</p>
                            <div className={cn(
                              "flex items-center gap-1 mt-1.5 text-xs",
                              isOwnMessage ? "text-white/70" : "text-gray-500"
                            )}>
                              <span className="text-[11px]">{new Date(message.sentAt || message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                              {isOwnMessage && (
                                message.readAt ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t p-3 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border-gray-300 focus:border-[#0C332C] focus:ring-[#0C332C] text-sm h-9"
                  disabled={isLoading || isSending}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading || isSending}
                  size="icon"
                  className="rounded-full bg-[#0C332C] hover:bg-[#2548c9] text-white h-9 w-9 flex-shrink-0"
                  data-testid="button-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
