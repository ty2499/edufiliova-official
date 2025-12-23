import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Download, Search, Send, User, ArrowLeft, Clock, FileText, FileIcon, Smile, X, UserPlus, Hash, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHelpChat } from '@/contexts/HelpChatContext';
// Quick response interface for this component
interface QuickResponse {
  id: number;
  title: string;
  shortcut: string;
  content: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

// These hardcoded avatar imports are no longer needed as we use database agents

interface HelpChatMessage {
  id: string;
  message: string;
  sender: 'visitor' | 'admin';
  timestamp: string;
  adminName?: string;
  adminAvatar?: string;
  agentId?: string;
  isAutoMessage?: boolean;
}

interface HelpChatConversation {
  guestId: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
  unreadCount: number;
  isActive: boolean;
}

interface SupportAgent {
  id: number;
  name: string;
  avatarUrl?: string;
  role?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const getCurrentAgent = (agentId?: string | number, agents: SupportAgent[] = []): SupportAgent | null => {
  if (!agentId || !agents.length) return null;
  return agents.find(agent => agent.id.toString() === agentId.toString()) || null;
};

// Helper function for agent avatar display
const getAgentDisplayAvatar = (agent: SupportAgent): string => {
  return agent.avatarUrl || '👤'; // Default emoji for agents without avatars
};

export default function AdminHelpChatManager() {
  const { user, profile } = useAuth();
  const { setIsChatOpen } = useHelpChat();

  // Check if user has chat management access (admin, moderator, or customer_service)
  const hasChatAccess = profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'customer_service';

  // Show access denied if user doesn't have proper access
  if (!hasChatAccess && profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 max-w-md text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin, moderator, or customer service privileges to access chat management.
          </p>
        </Card>
      </div>
    );
  }
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'txt' | 'pdf'>('csv');
  const [isConnected, setIsConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAgentSelectionDialog, setShowAgentSelectionDialog] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [assignedAgent, setAssignedAgent] = useState<SupportAgent | null>(null);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [quickResponseQuery, setQuickResponseQuery] = useState('');
  const [selectedQuickResponseIndex, setSelectedQuickResponseIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const quickResponsesRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // Popular emojis for quick access
  const popularEmojis = [
    '😊', '😂', '❤️', '👍', '👎', '🎉', '🔥', '💯',
    '😍', '🤔', '😢', '😭', '😡', '🙏', '👌', '💪',
    '🎈', '🎊', '✨', '⭐', '🌟', '💫', '☀️', '🌙',
    '🚀', '💡', '📚', '🎯', '🏆', '🎪', '🎭', '🎨'
  ];

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Insert quick response
  const insertQuickResponse = (response: QuickResponse) => {
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
  };

  // Handle input changes with quick response detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Check for quick response trigger (only for support staff)
    if (hasChatAccess) {
      const cursorPosition = e.target.selectionStart || 0;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
      
      console.log('🔍 Quick Response Debug:', { 
        value, 
        textBeforeCursor, 
        lastSlashIndex, 
        quickResponsesCount: quickResponses.length,
        hasQuickResponses: quickResponses.length > 0
      });
      
      if (lastSlashIndex !== -1) {
        // Check if "/" is at the start or after whitespace
        const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCursor[lastSlashIndex - 1] : ' ';
        if (charBeforeSlash === ' ' || lastSlashIndex === 0) {
          const query = textBeforeCursor.substring(lastSlashIndex + 1);
          console.log('✅ Quick Response Triggered:', { query, charBeforeSlash, shouldShow: true });
          setQuickResponseQuery(query);
          setShowQuickResponses(true);
          setSelectedQuickResponseIndex(0);
        } else {
          console.log('❌ Quick Response Not Triggered: "/" not at start or after whitespace');
          setShowQuickResponses(false);
        }
      } else {
        console.log('❌ Quick Response Not Triggered: No "/" found');
        setShowQuickResponses(false);
      }
    }
  };

  // Handle keyboard navigation for quick responses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      if (newMessage.trim()) {
        sendMessage();
      }
    }
  };

  // Fetch assignment mode settings
  const { data: assignmentSettings } = useQuery({
    queryKey: ['admin', 'help-chat', 'settings'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/admin/help-chat-settings', {
        headers: { Authorization: sessionId || '' }
      });
      return response.settings || {};
    }
  });

  // Fetch ALL support agents for manual assignment (including inactive ones)
  const { data: supportAgents = [], isLoading: supportAgentsLoading, error: supportAgentsError } = useQuery({
    queryKey: ['admin', 'support-agents', 'all'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/admin/support-agents', {
        headers: { Authorization: sessionId || '' }
      });
      // Return ALL agents (both active and inactive) for manual assignment
      const rawData = response.data || [];
      console.log('📋 All Support Agents Query Result (for manual assignment):', { 
        raw: response, 
        totalCount: rawData.length,
        agents: rawData
      });
      return rawData;
    },
    staleTime: 0, // Force fresh data
    refetchOnMount: true
  });

  // Fetch all conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['admin', 'help-chat', 'conversations'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/admin/help-chat/conversations', {
        headers: { Authorization: sessionId || '' }
      });
      return response.conversations || [];
    },
    refetchInterval: false // Disabled polling - rely on WebSocket for real-time updates
  });

  // Fetch conversation details
  const { data: conversationDetails, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin', 'help-chat', 'conversation', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/admin/help-chat/conversation/${selectedConversation}`, {
        headers: { Authorization: sessionId || '' }
      });
      return response;
    },
    enabled: !!selectedConversation
  });

  // Fetch active quick responses (only for support staff)
  const { data: quickResponses = [] } = useQuery({
    queryKey: ['/api/quick-responses/active'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/quick-responses/active', {
        headers: { Authorization: sessionId || '' }
      });
      
      console.log('📋 Quick Responses API Response:', response);
      
      // Handle both wrapped and unwrapped responses
      return Array.isArray(response) ? response : (response.data || []);
    },
    enabled: hasChatAccess,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false
  });

  // Filter quick responses based on query
  const filteredQuickResponses = quickResponses.filter((response: QuickResponse) => 
    response.shortcut?.toLowerCase().includes(quickResponseQuery.toLowerCase()) ||
    response.title.toLowerCase().includes(quickResponseQuery.toLowerCase())
  );

  // WebSocket connection for real-time messages
  useEffect(() => {
    console.log('🔄 Admin WebSocket useEffect running', { 
      hasUser: !!user, 
      userId: user?.userId, 
      hasProfile: !!profile, 
      role: profile?.role,
      selectedConversation 
    });
    
    if (!user?.userId || !profile?.role) {
      console.log('⏳ Waiting for user and profile to load', { user: !!user, profile: !!profile, role: profile?.role });
      return;
    }

    console.log('✅ User and profile loaded, connecting WebSocket');

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log('🔌 Attempting Admin Help Chat WebSocket connection for role:', profile.role);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('🔌 Admin Help Chat WebSocket connected');
          setIsConnected(true);
          
          // Authenticate for help chat with actual user role
          const authMessage = {
            type: 'auth',
            userId: user.userId,
            role: profile.role
          };
          console.log('📤 Sending auth message:', authMessage);
          wsRef.current?.send(JSON.stringify(authMessage));
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'auth_success':
                console.log('✅ Admin Help Chat authenticated');
                break;
                
              case 'help_chat_message':
                // Only update the specific conversation if guestId is provided
                if (data.guestId) {
                  // Update conversations list only for this specific guest
                  queryClient.invalidateQueries({ queryKey: ['admin', 'help-chat', 'conversations'] });
                  
                  // Update the specific conversation if it's currently selected
                  if (selectedConversation === data.guestId) {
                    queryClient.invalidateQueries({ queryKey: ['admin', 'help-chat', 'conversation', data.guestId] });
                  }
                  
                  console.log(`📨 Updated help chat conversation for guest ${data.guestId}`);
                } else {
                  // Fallback: refresh all conversations if guestId is missing
                  queryClient.invalidateQueries({ queryKey: ['admin', 'help-chat', 'conversations'] });
                  if (selectedConversation) {
                    queryClient.invalidateQueries({ queryKey: ['admin', 'help-chat', 'conversation', selectedConversation] });
                  }
                }
                break;
                
              case 'admin_join_success':
                // Update assigned agent when join is successful
                if (data.assignedAgent && selectedConversation === data.guestId) {
                  setAssignedAgent(data.assignedAgent);
                }
                break;
                
              case 'help_chat_guest_online':
                console.log(`👋 Guest ${data.guestId} came online`);
                queryClient.invalidateQueries({ queryKey: ['admin', 'help-chat', 'conversations'] });
                break;
                
              case 'conversation_assignment_cleared':
                console.log(`🔄 Agent assignment cleared for guest ${data.guestId}`);
                // Reset local assigned agent state if this is the current conversation
                if (selectedConversation === data.guestId) {
                  setAssignedAgent(null);
                }
                // Invalidate queries to refresh UI state
                queryClient.invalidateQueries({ queryKey: ['admin', 'help-chat', 'conversations'] });
                if (data.guestId) {
                  queryClient.invalidateQueries({ queryKey: ['admin', 'help-chat', 'conversation', data.guestId] });
                }
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('❌ Admin Help Chat WebSocket disconnected');
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('Admin Help Chat WebSocket error:', error);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('Failed to create Admin Help Chat WebSocket connection:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.userId, profile?.role, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedConversation) throw new Error('No conversation selected');
      
      // Send via WebSocket if available, otherwise fall back to HTTP
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'help_chat_send_message',
          guestId: selectedConversation,
          message: message,
          sender: 'admin'
        }));
        return Promise.resolve(); // WebSocket sent successfully
      } else {
        // HTTP fallback only when WebSocket is unavailable
        const sessionId = localStorage.getItem('sessionId');
        return apiRequest('/api/help-chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionId}`
          },
          body: JSON.stringify({
            guestId: selectedConversation,
            message: message,
            sender: 'admin'
          })
        });
      }
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'help-chat', 'conversation', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'help-chat', 'conversations'] });
    }
  });

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (conversationDetails?.messages) {
      scrollToBottom();
    }
  }, [conversationDetails?.messages]);

  // Handle conversation selection and trigger agent assignment
  const handleConversationSelect = (guestId: string) => {
    setSelectedConversation(guestId);
    setIsChatOpen(true); // Hide navigation when opening chat
    setAssignedAgent(null); // Reset assigned agent when switching conversations
    
    // Check assignment mode
    const assignmentMode = assignmentSettings?.assignmentMode || 'auto';
    
    if (assignmentMode === 'manual') {
      // Show agent selection dialog for manual mode
      setPendingConversationId(guestId);
      setShowAgentSelectionDialog(true);
    } else {
      // Automatic mode - send admin_join_conversation message immediately
      joinConversationWithAgent(guestId, null);
    }
  };

  // Join conversation with selected agent (or null for automatic assignment)
  const joinConversationWithAgent = (guestId: string, agentId: string | null) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'admin_join_conversation',
        guestId: guestId,
        selectedAgentId: agentId
      }));
    }
  };

  // Send signal to server to handle agent leaving (server will create message and clear assignment)
  const sendAgentLeftMessage = (guestId: string, agentName: string) => {
    console.log(`🔍 Leave chat attempt - guestId: ${guestId}, agentName: ${agentName}, wsReady: ${wsRef.current?.readyState === WebSocket.OPEN}`);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'admin_leave_conversation',
        guestId: guestId
      }));
      console.log(`👋 Sent agent leave signal for ${guestId}: ${agentName} will be marked as left`);
    } else {
      console.error('❌ WebSocket not ready for leave message');
    }
  };

  // Handle agent selection and join conversation
  const handleAgentSelection = () => {
    if (pendingConversationId && selectedAgentId) {
      joinConversationWithAgent(pendingConversationId, selectedAgentId);
      setShowAgentSelectionDialog(false);
      setPendingConversationId(null);
      setSelectedAgentId(null);
    }
  };

  // Cancel agent selection
  const handleCancelAgentSelection = () => {
    // Send "agent left chat" message if agent was assigned
    if (assignedAgent && selectedConversation) {
      sendAgentLeftMessage(selectedConversation, assignedAgent.name);
    }
    setShowAgentSelectionDialog(false);
    setPendingConversationId(null);
    setSelectedAgentId(null);
    setSelectedConversation(null); // Go back to conversations list
    setAssignedAgent(null); // Clear assigned agent
    setIsChatOpen(false); // Show navigation when closing chat
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleExport = (guestId?: string) => {
    const params = new URLSearchParams({ format: exportFormat });
    if (guestId) params.append('guestId', guestId);
    
    const sessionId = localStorage.getItem('sessionId');
    const url = `/api/admin/help-chat/export?${params.toString()}`;
    
    // Create temporary link for download
    const link = document.createElement('a');
    link.href = url;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatLastMessageTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageTime.toLocaleDateString();
  };

  const filteredConversations = conversations.filter((conv: HelpChatConversation) =>
    conv.guestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If a conversation is selected, show full-screen chat interface
  if (selectedConversation) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col z-50">
        {/* Chat Header */}
        <div className={cn(
          "flex items-center justify-between border-b border-gray-100 flex-shrink-0",
          isMobile ? "p-4" : "p-3"
        )} style={{ backgroundColor: '#0C332C' }}>
          <div className="flex items-center gap-3 flex-1">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Always send leave message if there's a selected conversation
                // Server will handle getting the agent name and clearing assignments
                if (selectedConversation) {
                  const agentName = assignedAgent?.name || 'Agent'; // Fallback name
                  sendAgentLeftMessage(selectedConversation, agentName);
                }
                setSelectedConversation(null);
                setAssignedAgent(null); // Clear assigned agent
                setIsChatOpen(false); // Show navigation when closing chat
              }}
              className="text-white hover:bg-white/10 p-2"
              data-testid="back-to-conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {/* Active Agent Avatar */}
            <div className="flex items-center gap-3">
              {assignedAgent ? (
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src={assignedAgent.avatarUrl} className="rounded-full" />
                  <AvatarFallback className="bg-blue-500 text-white text-sm font-bold">
                    {assignedAgent.name.split(' ').map((n: string) => n.charAt(0)).join('')}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarFallback className="bg-gray-400 text-white text-sm font-bold">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Guest {selectedConversation.slice(-8)}
                </h3>
                <p className="text-xs text-white/80">
                  {isConnected ? (assignedAgent ? `Connected with ${assignedAgent.name}` : 'Connecting...') : 'Disconnected'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport(selectedConversation)}
              className="text-white hover:bg-white/10"
              data-testid="export-conversation"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          className={cn(
            "flex-1 overflow-y-auto scrollbar-hide",
            isMobile ? "bg-gray-50" : "bg-white"
          )}
          style={{ 
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div className={cn(isMobile ? "px-6 py-4" : "px-4 py-3")}>
            {messagesLoading ? (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Loading Messages
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Please wait while we load the conversation...
                </p>
              </div>
            ) : !conversationDetails?.messages || conversationDetails.messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  No Messages Yet
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Start a conversation with this guest to see messages here.
                </p>
              </div>
            ) : (
              conversationDetails.messages.map((message: HelpChatMessage) => {
                const isFromAdmin = message.sender === 'admin';
                const agent = getCurrentAgent(message.agentId, supportAgents);
                return (
                  <div key={message.id} className={cn(
                    "flex items-end gap-2 mb-4",
                    isFromAdmin ? "justify-end" : "justify-start"
                  )}>
                    {/* Sender's Avatar - Left Side */}
                    {!isFromAdmin && (
                      <Avatar className="h-10 w-10 flex-shrink-0 rounded-full mb-1">
                        <AvatarFallback className="text-white text-lg font-bold flex items-center justify-center h-full w-full" style={{ backgroundColor: '#0C332C' }}>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={cn(
                      "max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-[25px] px-4 py-3 relative transition-all duration-200",
                      isFromAdmin 
                        ? "text-white" 
                        : "bg-white text-black"
                    )} style={isFromAdmin ? { backgroundColor: '#0C332C' } : {}}>
                      <div className="space-y-1">
                        {/* Text Content */}
                        <p className="text-[15px] leading-[20px] whitespace-pre-wrap break-words" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                          {message.message}
                        </p>
                      </div>
                      
                      {/* Message Time */}
                      <div className={cn(
                        "flex items-center gap-1 mt-1 px-2",
                        isFromAdmin ? "justify-end" : "justify-start"
                      )}>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Sender's Avatar - Right Side */}
                    {isFromAdmin && (
                      <Avatar className="h-10 w-10 flex-shrink-0 rounded-full mb-1">
                        <AvatarImage src={agent?.avatarUrl || assignedAgent?.avatarUrl} className="rounded-full" />
                        <AvatarFallback className="text-white text-lg font-bold flex items-center justify-center h-full w-full bg-blue-500">
                          {(agent?.name || assignedAgent?.name || 'S').split(' ').map((n: string) => n.charAt(0)).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className={cn(
          "border-t border-gray-100 bg-white flex-shrink-0",
          isMobile ? "px-3 sm:px-6 py-3 sm:py-4" : "px-3 py-3"
        )}>
          {/* Quick Responses Dropdown */}
          <AnimatePresence>
            {showQuickResponses && filteredQuickResponses.length > 0 && (
              <motion.div
                ref={quickResponsesRef}
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="mb-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto z-50"
              >
                <div className="p-2">
                  <div className="text-xs text-gray-500 px-2 py-1 border-b border-gray-200">
                    Quick Responses
                  </div>
                  {filteredQuickResponses.map((response: QuickResponse, index: number) => (
                    <button
                      key={response.id}
                      onClick={() => insertQuickResponse(response)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md transition-colors mt-1',
                        'hover:bg-gray-100',
                        index === selectedQuickResponseIndex && 'bg-blue-50 border-l-2 border-blue-500'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-mono text-blue-600">
                          /{response.shortcut || response.title}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {response.content}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mb-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-8 gap-1">
                {popularEmojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg text-base transition-all"
                    onClick={() => handleEmojiSelect(emoji)}
                    data-testid={`emoji-${index}`}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-3">
            {/* Main input container */}
            <div className="flex-1 flex items-center bg-white rounded-full border border-gray-300 px-4 py-2 min-h-[40px]">
              {/* Text input */}
              <input
                ref={inputRef}
                type="text"
                placeholder={isConnected ? "Type your reply..." : "Connecting..."}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={!isConnected || sendMessageMutation.isPending}
                className="flex-1 bg-transparent border-0 focus:outline-none text-sm placeholder:text-gray-500"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
                data-testid="admin-message-input"
              />
              
              {/* Emoji button inside input */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 flex-shrink-0 ml-2"
                data-testid="emoji-button"
              >
                <Smile className="h-5 w-5" style={{ color: '#000000' }} />
              </button>
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!newMessage.trim() || !isConnected || sendMessageMutation.isPending}
              className={cn(
                "h-10 w-10 p-0 rounded-full flex-shrink-0 flex items-center justify-center transition-colors shadow-sm",
                newMessage.trim() && isConnected && !sendMessageMutation.isPending
                  ? "bg-primary hover:bg-primary text-white" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
              data-testid="send-admin-message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {!isConnected && (
            <p className="text-xs text-primary mt-2 text-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Connection lost. Trying to reconnect...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default view: Show conversation list
  return (
    <div className="h-full max-w-4xl mx-auto">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Help Chat ({conversations.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500 animate-pulse" : "bg-primary"
              )} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="search-conversations"
              />
            </div>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'txt' | 'pdf') => setExportFormat(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="txt">TXT</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleExport()}
              title="Export all conversations"
              data-testid="export-all"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {conversationsLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? 'No conversations match your search' : 'No help chat conversations yet'}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation: HelpChatConversation) => (
                  <div
                    key={conversation.guestId}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                      selectedConversation === conversation.guestId ? "bg-muted" : ""
                    )}
                    onClick={() => handleConversationSelect(conversation.guestId)}
                    data-testid={`conversation-${conversation.guestId}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-primary text-white text-xs">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">Guest {conversation.guestId.slice(-8)}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={conversation.isActive ? "default" : "secondary"} className="text-xs">
                              {conversation.isActive ? 'Active' : 'Offline'}
                            </Badge>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount} new
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatLastMessageTime(conversation.lastMessageTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conversation.messageCount} messages
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Agent Selection Dialog */}
      <Dialog open={showAgentSelectionDialog} onOpenChange={setShowAgentSelectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              Select Support Agent
            </DialogTitle>
            <DialogDescription>
              Choose which support agent should handle this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {supportAgentsLoading ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-300 animate-pulse" />
                <p className="text-sm">Loading support agents...</p>
              </div>
            ) : supportAgentsError ? (
              <div className="text-center py-8 text-primary">
                <User className="h-12 w-12 mx-auto mb-3 text-red-300" />
                <p className="text-sm">Error loading support agents</p>
                <p className="text-xs mt-1">{supportAgentsError?.message}</p>
              </div>
            ) : supportAgents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No support agents found</p>
                <p className="text-xs mt-1">Create support agents in the Support Profiles section first</p>
                <p className="text-xs mt-1 text-blue-500">Debug: API returned {supportAgents.length} agents</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {supportAgents.map((agent: SupportAgent) => (
                  <div
                    key={agent.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedAgentId === agent.id.toString() 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    )}
                    onClick={() => setSelectedAgentId(agent.id.toString())}
                    data-testid={`agent-option-${agent.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={agent.avatarUrl} className="rounded-full" />
                      <AvatarFallback className="text-white text-sm font-bold flex items-center justify-center h-full w-full bg-blue-500">
                        {agent.name.split(' ').map((n: string) => n.charAt(0)).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{agent.name}</h4>
                        <Badge variant={agent.isActive ? "default" : "secondary"} className="text-xs">
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{agent.role || 'Support Agent'}</p>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground mt-1">{agent.description}</p>
                      )}
                    </div>
                    {selectedAgentId === agent.id.toString() && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={handleCancelAgentSelection}
                className="flex-1"
                data-testid="button-cancel-agent-selection"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAgentSelection}
                disabled={!selectedAgentId}
                className="flex-1"
                data-testid="button-confirm-agent-selection"
              >
                Assign Agent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
