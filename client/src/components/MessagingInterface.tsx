import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SimpleOptimizedInterface from './messaging/SimpleOptimizedInterface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  Paperclip,
  Mic,
  MicOff,
  Play,
  Pause,
  Download,
  X,
  ChevronLeft,
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Smile,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  BadgeCheck,
  Settings,
  Edit,
  Camera,
  Check,
  CheckCheck,
  Hash
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsAppSocket } from '@/hooks/useWhatsAppSocket';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import OptimizedMedia from './messaging/OptimizedMedia';
import ImageViewer from './messaging/ImageViewer';
import type { QuickResponse } from '@shared/schema';
import { getGradeFeatureRestrictions } from '@shared/schema';

interface User {
  id: string; // Profile UUID
  userId: string; // Text ID like "HJOR2AC54I"  
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  pronouns?: string;
  avatarUrl?: string;
  verificationBadge?: 'none' | 'green' | 'blue';
}

interface FileMetadata {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  thumbnail?: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content?: string;
  messageType: string;
  fileMetadata?: FileMetadata;
  isRead: boolean;
  createdAt: string;
  senderName: string;
  senderAvatarUrl?: string;
  verificationBadge?: 'none' | 'green' | 'blue';
  isGroup?: boolean;
  readAt?: string;
  deliveredAt?: string;
}

interface Conversation {
  otherUserId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  otherUser: User;
}

interface MessagingInterfaceProps {
  userRole: 'student' | 'teacher' | 'admin' | 'freelancer';
  onChatModeChange?: (isInChat: boolean) => void;
  useOptimizedInterface?: boolean; // Enable high-performance messaging
}

export function MessagingInterface({ userRole, onChatModeChange, useOptimizedInterface = false }: MessagingInterfaceProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { 
    isConnected, 
    wsRef, 
    sendTypingStart,
    sendTypingStop,
    sendRecordingStart,
    sendRecordingStop,
    isUserTyping,
    isUserRecording,
    setCallHandlers,
    sendCallOffer,
    sendCallAnswer,
    sendIceCandidate,
    sendCallEnd,
    getUserPresence
  } = useWhatsAppSocket();
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const userGrade = profile?.grade || profile?.gradeLevel;
  const isElementary = userGrade && (
    (typeof userGrade === 'number' && userGrade >= 1 && userGrade <= 7) ||
    (typeof userGrade === 'string' && ['1', '2', '3', '4', '5', '6', '7'].includes(userGrade))
  );
  
  const [activeTab, setActiveTab] = useState<'chats' | 'new' | 'groups' | 'teachers' | 'support'>(isElementary ? 'support' : 'chats');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: number}>({});
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    src: string;
    alt?: string;
    fileName?: string;
  }>({ isOpen: false, src: '', alt: '', fileName: '' });
  const [previewFiles, setPreviewFiles] = useState<{file: File, preview: string, id: string}[]>([]);
  
  // Quick responses state for admin users
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [quickResponseQuery, setQuickResponseQuery] = useState('');
  const [selectedQuickResponseIndex, setSelectedQuickResponseIndex] = useState(0);

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const quickResponsesRef = useRef<HTMLDivElement>(null);

  // Audio playback state management
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Call state management
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'connected' | 'ended'>('idle');
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    senderId: string;
    senderName: string;
    callType: 'voice' | 'video';
    offer: RTCSessionDescriptionInit;
  } | null>(null);
  
  // Group settings state
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  
  
  // Profile preview state
  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  
  // WebRTC refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  // Selected user will be defined after contacts are loaded

  // Get available contacts with optimized caching
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['messaging', 'contacts'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const result = await apiRequest('/api/messages/contacts', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      // Handle both direct array response and wrapped response
      return Array.isArray(result) ? result : (result.data || []);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // Data considered fresh for 2 minutes (contacts don't change often)
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus for better performance
    refetchOnReconnect: true,
    retry: 1 // Reduce retries for faster failure handling
  });

  // Get unified conversations (user chats + support chats) with optimized caching
  const { data: rawConversations = [], isLoading: rawConversationsLoading } = useQuery({
    queryKey: ['messaging', 'unified-conversations'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const result = await apiRequest('/api/messages/unified-conversations', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      // Handle both direct array response and wrapped response
      return Array.isArray(result) ? result : (result.data || []);
    },
    enabled: !!user,
    staleTime: 0, // Always fresh - instant updates
    gcTime: 10 * 1000, // Short cache - 10 seconds
    refetchOnWindowFocus: true,
    refetchInterval: false, // Don't poll - rely on WebSocket for updates
    retry: 1
  });

  // Get pending friend requests for students
  const { data: friendRequests = [], isLoading: friendRequestsLoading } = useQuery({
    queryKey: ['messaging', 'friend-requests'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const result = await apiRequest('/api/messages/friend-requests', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return Array.isArray(result) ? result : (result.data || []);
    },
    enabled: !!user && userRole === 'student'
  });


  // Get user groups for chat integration (keep for backward compatibility)
  const { data: userGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['messaging', 'user-groups'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const result = await apiRequest('/api/groups', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      // The API returns groups directly as an array, not wrapped in .data
      const groupsData = Array.isArray(result) ? result : (result.data || []);
      
      // Filter only groups the user is a member of and add proper formatting for chat list
      const memberGroups = Array.isArray(groupsData) ? groupsData.filter((group: any) => group.isMember) : [];
      
      return memberGroups.map((group: any) => ({
        ...group,
        originalId: group.id, // Keep original ID for API calls
        id: `group_${group.id}`, // Prefix for group chat identification
        displayName: group.name,
        lastMessage: `Group • ${group.memberCount} members`,
        lastMessageTime: group.createdAt,
        unreadCount: group.unreadCount ?? 0, // Use real unread count from server
        isGroup: true
      }));
    },
    enabled: !!user,
    staleTime: 60 * 1000, // Cache for 1 minute (optimized from 5s polling)
    refetchOnWindowFocus: true
  });

  const conversations = rawConversations;
  

  // Get current user's profile for avatar and name display
  const { data: currentUserProfile } = useQuery({
    queryKey: ['user', 'profile', user?.userId],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const result = await apiRequest(`/api/profile`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      // Return the profile directly, not nested in .profile
      return result.profile || result;
    },
    enabled: !!user?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Fetch active quick responses for admin and customer service only
  const { data: quickResponses = [] } = useQuery({
    queryKey: ['/api/quick-responses/active'],
    queryFn: async () => {
      const result = await apiRequest('/api/quick-responses/active');
      // Handle both wrapped and unwrapped responses
      return Array.isArray(result) ? result : (result.data || []);
    },
    enabled: !!user && (profile?.role === 'admin' || profile?.role === 'customer_service'), // Only admin and customer service
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false
  });

  // Check if selected conversation is a group
  const isGroupConversation = selectedConversation?.startsWith('group_');
  const groupId = isGroupConversation && selectedConversation ? selectedConversation.replace('group_', '') : undefined;

  // Get messages for selected conversation
  // Function to enhance messages with avatar information - memoized to prevent re-renders
  const enhanceMessagesWithAvatars = useCallback((messages: any[]) => {
    return messages.map(msg => {
      let senderAvatarUrl = msg.senderAvatarUrl;
      let senderName = msg.senderName || 'Unknown';
      let verificationBadge = msg.verificationBadge || 'none';
      
      // Check if sender is current user (match both profile ID and user ID)
      if (msg.senderId === currentUserProfile?.id || 
          msg.senderId === user?.id || 
          msg.senderId === profile?.id) {
        senderAvatarUrl = currentUserProfile?.avatarUrl || profile?.avatarUrl;
        senderName = currentUserProfile?.name || profile?.name || user?.email || 'You';
        verificationBadge = currentUserProfile?.verificationBadge || profile?.verificationBadge || 'none';
      } else if (contacts && Array.isArray(contacts)) {
        // Find sender in contacts (match both profile UUID and user ID)
        const senderContact = contacts.find((c: any) => 
          c.id === msg.senderId || 
          c.userId === msg.senderId
        );
        if (senderContact) {
          senderAvatarUrl = senderContact.avatarUrl;
          senderName = senderContact.name || senderContact.email || 'Unknown';
          verificationBadge = senderContact.verificationBadge || 'none';
        }
      }
      
      return { ...msg, senderAvatarUrl, senderName, verificationBadge };
    });
  }, [contacts, currentUserProfile, user, profile]);

  // Performance optimization states
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // Enhanced scroll to bottom with performance optimization
  const enhancedScrollToBottom = useCallback(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        });
      });
    }
  }, [shouldAutoScroll]);

  // Quick responses functionality for admin and customer service only
  // Filter quick responses based on query
  const filteredQuickResponses = useMemo(() => {
    if (!quickResponses.length) return [];
    return quickResponses.filter((response: QuickResponse) => 
      response.shortcut?.toLowerCase().includes(quickResponseQuery.toLowerCase()) ||
      response.title.toLowerCase().includes(quickResponseQuery.toLowerCase())
    );
  }, [quickResponses, quickResponseQuery]);

  // Insert quick response
  const insertQuickResponse = useCallback((response: QuickResponse) => {
    const input = messageInputRef.current;
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

  // Handle input changes with quick response detection for admin and customer service only
  const handleMessageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Quick response detection for admin and customer service only
    const isAuthorizedStaff = profile?.role === 'admin' || profile?.role === 'customer_service';
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlashIndex !== -1 && isAuthorizedStaff && quickResponses.length > 0) {
      // Check if "/" is at the start or after whitespace
      const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCursor[lastSlashIndex - 1] : ' ';
      if (charBeforeSlash === ' ' || charBeforeSlash === '\n' || lastSlashIndex === 0) {
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

    // Handle typing indicators
    if (selectedConversation) {
      sendTypingStart(selectedConversation);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStop(selectedConversation);
      }, 2000);
    }
  }, [userRole, selectedConversation, sendTypingStart, sendTypingStop, profile?.role, quickResponses.length]);

  // Handle keyboard navigation for quick responses
  const handleMessageKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
        case 'Tab':
        case 'Enter':
          if (showQuickResponses) {
            e.preventDefault();
            insertQuickResponse(filteredQuickResponses[selectedQuickResponseIndex]);
            break;
          }
          // Let normal form submission handle Enter if no quick responses are shown
          break;
        case 'Escape':
          e.preventDefault();
          setShowQuickResponses(false);
          break;
      }
    }
    // Normal Enter handling will be handled by the form onSubmit
  }, [userRole, showQuickResponses, filteredQuickResponses, selectedQuickResponseIndex, insertQuickResponse]);

  // Click outside handler to close quick responses dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickResponsesRef.current && !quickResponsesRef.current.contains(event.target as Node) &&
          messageInputRef.current && !messageInputRef.current.contains(event.target as Node)) {
        setShowQuickResponses(false);
      }
    };

    if (showQuickResponses) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQuickResponses]);

  // Auto-select conversation when coming from "Hire Me" button
  useEffect(() => {
    const openConversationId = localStorage.getItem('openConversationId');
    if (openConversationId) {
      setSelectedConversation(openConversationId);
      setActiveTab('chats');
      localStorage.removeItem('openConversationId');
    }
  }, []);
  
  // Set up WebSocket call event handlers - removed contacts dependency to prevent infinite renders
  const handleCallOffer = useCallback(async (data: any) => {
    const { senderId, callType, offer } = data;
    
    // Get sender name dynamically without depending on contacts array
    let senderName = 'Unknown caller';
    if (contacts && Array.isArray(contacts)) {
      const senderInfo = contacts.find(contact => contact.userId === senderId || contact.id === senderId);
      senderName = senderInfo?.name || 'Unknown caller';
    }
    
    console.log('📞 Incoming call offer from:', senderName, 'Type:', callType);
    
    setIncomingCall({
      senderId,
      senderName,
      callType,
      offer
    });
    setCallState('incoming');
  }, []); // Remove contacts dependency to prevent infinite renders
  
  const handleCallAnswer = useCallback(async (data: any) => {
    const { answer } = data;
    console.log('📞 Call answered, setting remote description');
    
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(answer);
      setCallState('connected');
      setCallStartTime(new Date());
    }
  }, []);
  
  const handleCallIceCandidate = useCallback(async (data: any) => {
    const { candidate } = data;
    console.log('📞 Received ICE candidate');
    
    if (peerConnectionRef.current && candidate) {
      await peerConnectionRef.current.addIceCandidate(candidate);
    }
  }, []);
  
  const handleCallEndRemote = useCallback(() => {
    console.log('📞 Call ended by remote user');
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Reset state
    setCallState('idle');
    setCallStartTime(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(false);
    setIncomingCall(null);
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    setCallHandlers({
      onCallOffer: handleCallOffer,
      onCallAnswer: handleCallAnswer,
      onCallIceCandidate: handleCallIceCandidate,
      onCallEnd: handleCallEndRemote
    });
  }, [handleCallOffer, handleCallAnswer, handleCallIceCandidate, handleCallEndRemote]);
  
  // Handle scroll events to detect user manual scrolling  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50; // 50px buffer
    setShouldAutoScroll(isAtBottom);
  }, []);

  const { data: rawMessages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messaging', 'conversation', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      const sessionId = localStorage.getItem('sessionId');
      
      // Handle group conversations
      if (selectedConversation.startsWith('group_')) {
        const groupId = selectedConversation.replace('group_', '');
        try {
          const result = await apiRequest(`/api/messages/group/${groupId}`, {
            headers: { Authorization: `Bearer ${sessionId}` }
          });
          
          // Handle different response structures
          let messagesData = [];
          if (Array.isArray(result.data)) {
            messagesData = result.data;
          } else if (Array.isArray(result)) {
            messagesData = result;
          } else if (result.success && Array.isArray(result.data)) {
            messagesData = result.data;
          }
          
          const processedMessages = messagesData.map((msg: any) => ({
            id: msg.id,
            senderId: msg.senderId,
            groupId: groupId,
            content: msg.content,
            fileUrl: msg.fileUrl,
            fileType: msg.fileType,
            messageType: msg.messageType || 'text',
            createdAt: msg.createdAt,
            senderName: msg.senderName || 'Unknown',
            senderAvatarUrl: msg.senderAvatarUrl,
            isGroup: true
          }));
          return processedMessages;
        } catch (error) {
          console.error('Failed to load group messages:', error);
          return [];
        }
      }
      
      // Handle individual conversations
      try {
        const result = await apiRequest(`/api/messages/enhanced/${selectedConversation}`, {
          headers: { Authorization: `Bearer ${sessionId}` }
        });
        
        const conversationData = result.conversation || [];
        const normalized = conversationData.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content,
          fileUrl: msg.fileUrl,
          fileType: msg.fileType,
          messageType: msg.messageType || msg.fileType || 'text',
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt,
          createdAt: msg.createdAt,
          isRead: !!msg.readAt,
          senderName: msg.senderProfile?.name || 'Unknown',
          senderAvatarUrl: msg.senderProfile?.avatarUrl,
          fileMetadata: msg.fileUrl ? {
            url: msg.fileUrl,
            fileName: `file.${msg.fileType}`,
            fileSize: 0,
            mimeType: msg.fileType === 'voice' ? 'audio/webm' : 'application/octet-stream'
          } : undefined
        }));
        
        return normalized;
        
      } catch (error) {
        const result = await apiRequest(`/api/messages/conversation/${selectedConversation}`, {
          headers: { Authorization: `Bearer ${sessionId}` }
        });
        
        const messagesData = Array.isArray(result) ? result : (result.data || []);
        
        const normalized = messagesData.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content,
          fileUrl: msg.fileUrl,
          fileType: msg.fileType,
          messageType: msg.messageType || msg.fileType || 'text',
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt,
          createdAt: msg.createdAt,
          isRead: !!msg.readAt,
          senderName: 'Unknown',
          senderAvatarUrl: undefined,
          fileMetadata: msg.fileUrl ? {
            url: msg.fileUrl,
            fileName: `file.${msg.fileType}`,
            fileSize: 0,
            mimeType: msg.fileType === 'voice' ? 'audio/webm' : 'application/octet-stream'
          } : undefined
        }));
        
        return normalized;
      }
    },
    enabled: !!selectedConversation && !!user,
    staleTime: 0, // Always fresh - instant updates
    gcTime: 10 * 1000, // Short cache time - 10 seconds
    refetchOnWindowFocus: true, // Refetch when user comes back
    refetchOnReconnect: true, // Refetch on network reconnect
    retry: 0, // No retries for fastest response
    networkMode: 'online',
    placeholderData: (previousData) => previousData, // Keep data while refetching for smooth UX
    refetchInterval: false // Don't poll - rely on WebSocket for updates
  });

  // Enhance messages with avatar data
  const messages = enhanceMessagesWithAvatars(rawMessages);

  // Memoized unread messages count to prevent unstable dependencies
  const unreadMessagesCount = useMemo(() => {
    if (!rawMessages?.length || !user || selectedConversation?.startsWith('group_')) return 0;
    return rawMessages.filter((msg: any) => msg.receiverId === user.id && !msg.readAt).length;
  }, [rawMessages, user?.id, selectedConversation]);

  // Removed redundant read marking useEffect to avoid race conditions with markConversationAsRead

  // Audio playback functions
  const toggleAudioPlayback = (messageId: string, audioUrl: string) => {
    const currentAudio = audioRefs.current[messageId];
    
    if (playingAudio === messageId) {
      if (currentAudio) {
        currentAudio.pause();
      }
      setPlayingAudio(null);
    } else {
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
        audioRefs.current[playingAudio].currentTime = 0;
      }
      
      if (!currentAudio) {
        const audio = new Audio(audioUrl);
        audioRefs.current[messageId] = audio;
        
        audio.addEventListener('ended', () => {
          setPlayingAudio(null);
          setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
        });
        
        audio.addEventListener('timeupdate', () => {
          const progress = (audio.currentTime / audio.duration) * 100;
          setAudioProgress(prev => ({ ...prev, [messageId]: progress }));
        });
      }
      
      audioRefs.current[messageId].play().catch(console.error);
      setPlayingAudio(messageId);
    }
  };

  // WebRTC Configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize call
  const initiateCall = async (type: 'voice' | 'video') => {
    if (!selectedConversation || !selectedUser) return;
    
    try {
      setCallType(type);
      setCallState('calling');
      setCallStartTime(new Date());
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      const peerConnection = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = peerConnection;
      
      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && selectedConversation) {
          sendIceCandidate(selectedConversation, event.candidate);
        }
      };
      
      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send call offer via WebSocket
      sendCallOffer(selectedConversation, type, offer);
      
    } catch (error) {
      console.error('Error initiating call:', error);
      endCall();
    }
  };

  // End call
  const endCall = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Reset state
    setCallState('idle');
    setCallStartTime(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(false);
    setIncomingCall(null);
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Notify other user via WebSocket
    if (selectedConversation) {
      sendCallEnd(selectedConversation);
    }
  }, [selectedConversation, sendCallEnd]);

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;
    
    try {
      setCallType(incomingCall.callType);
      setCallState('connected');
      setCallStartTime(new Date());
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === 'video'
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      const peerConnection = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = peerConnection;
      
      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(incomingCall.senderId, event.candidate);
        }
      };
      
      // Set remote description and create answer
      await peerConnection.setRemoteDescription(incomingCall.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send answer via WebSocket
      sendCallAnswer(incomingCall.senderId, answer);
      
      // Clear incoming call state
      setIncomingCall(null);
      
    } catch (error) {
      console.error('Error accepting call:', error);
      rejectCall();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall) return;
    
    // Send call end to notify caller
    sendCallEnd(incomingCall.senderId);
    
    // Reset states
    setIncomingCall(null);
    setCallState('idle');
  };

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected' && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState, callStartTime]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { receiverId?: string; groupId?: string; content: string; messageType?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      
      // Determine endpoint based on message type
      const endpoint = data.groupId ? '/api/messages/group' : '/api/messages';
      
      return apiRequest(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversation', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'user-groups'] });
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, name, description }: { groupId: string; name?: string; description?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return await apiRequest(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${sessionId}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name, description })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setShowGroupSettings(false);
      setIsUpdatingGroup(false);
    }
  });

  // Update group avatar mutation
  const updateGroupAvatarMutation = useMutation({
    mutationFn: async ({ groupId, avatarFile }: { groupId: string; avatarFile: File }) => {
      const sessionId = localStorage.getItem('sessionId');
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      return await apiRequest(`/api/groups/${groupId}/avatar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${sessionId}` },
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setShowGroupSettings(false);
    }
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      console.log('🤝 Sending friend request to:', targetUserId);
      return await apiRequest('/api/community/friend-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify({ targetUserId })
      });
    },
    onSuccess: (data) => {
      console.log('✅ Friend request sent successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['messaging', 'contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'friend-requests'] });
    },
    onError: (error) => {
      console.error('❌ Friend request failed:', error);
    }
  });

  // Friend request response mutation
  const respondToFriendRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'accept' | 'reject' }) => {
      const sessionId = localStorage.getItem('sessionId');
      console.log('🔍 Sending friend request response:', { requestId, action });
      return apiRequest(`/api/messages/friend-requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    }
  });

  // Profile preview query
  const { data: profilePreview, isLoading: profilePreviewLoading } = useQuery({
    queryKey: ['user-profile-preview', selectedProfileUserId],
    queryFn: async () => {
      if (!selectedProfileUserId) return null;
      const sessionId = localStorage.getItem('sessionId');
      const result = await apiRequest(`/api/users/${selectedProfileUserId}/profile-preview`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return result.data;
    },
    enabled: !!selectedProfileUserId && profilePreviewOpen
  });

  // Handle profile preview
  const handleShowProfilePreview = (userId: string) => {
    setSelectedProfileUserId(userId);
    setProfilePreviewOpen(true);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        if (selectedConversation) {
          sendRecordingStop(selectedConversation);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      if (selectedConversation) {
        sendRecordingStart(selectedConversation);
      }
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (selectedConversation) {
        sendRecordingStop(selectedConversation);
      }
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (selectedConversation) {
        sendRecordingStop(selectedConversation);
      }
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Send voice message
  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedConversation) return;
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-message.webm');
      formData.append('receiverId', selectedConversation);
      formData.append('messageType', 'voice');
      formData.append('fileType', 'voice');
      
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/messages/file', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionId}`
        },
        body: formData
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['messaging', 'conversation', selectedConversation] });
        queryClient.invalidateQueries({ queryKey: ['messaging', 'unified-conversations'] });
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  // File upload handler with progress tracking
  const handleFileUpload = async (file: File, fileType: string) => {
    if (!selectedConversation) return;

    const fileId = Math.random().toString(36).substr(2, 9);
    setUploadingFiles(prev => ({ ...prev, [fileId]: 0 }));

    const formData = new FormData();
    formData.append('receiverId', selectedConversation);
    formData.append('file', file);
    formData.append('fileType', fileType);

    try {
      const sessionId = localStorage.getItem('sessionId');
      
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => {
          const current = prev[fileId] || 0;
          if (current < 90) {
            return { ...prev, [fileId]: current + 10 };
          }
          return prev;
        });
      }, 100);

      const response = await fetch('/api/messages/file', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionId}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadingFiles(prev => ({ ...prev, [fileId]: 100 }));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with status:', response.status, 'Error:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (isConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'send_message',
          receiverId: selectedConversation,
          messageType: fileType,
          fileMetadata: result.fileMetadata
        }));
        queryClient.invalidateQueries({ queryKey: ['messaging', 'conversation', selectedConversation] });
        queryClient.invalidateQueries({ queryKey: ['messaging', 'unified-conversations'] });
      }

      // Clean up after successful upload
      setTimeout(() => {
        setUploadingFiles(prev => {
          const { [fileId]: _, ...rest } = prev;
          return rest;
        });
        setPreviewFiles(prev => prev.filter(p => p.id !== fileId));
      }, 1000);

      setShowAttachMenu(false);
    } catch (error) {
      console.error('File upload error:', error);
      setUploadingFiles(prev => {
        const { [fileId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle file selection with preview
  const handleFileSelect = (file: File, fileType: string) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      const fileId = Math.random().toString(36).substr(2, 9);
      
      reader.onload = (e) => {
        setPreviewFiles(prev => [...prev, {
          file,
          preview: e.target?.result as string,
          id: fileId
        }]);
      };
      reader.readAsDataURL(file);
    } else {
      // For documents and other files, upload directly
      handleFileUpload(file, fileType);
    }
  };

  // Send file with preview
  const sendFileWithPreview = (fileData: {file: File, preview: string, id: string}) => {
    const fileType = fileData.file.type.startsWith('image/') ? 'image' : 'document';
    handleFileUpload(fileData.file, fileType);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const fileType = file.type.startsWith('image/') ? 'image' : 'document';
      handleFileSelect(file, fileType);
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for responsive feel
    
    // Create optimistic message for instant UI update
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      senderId: user?.id || '',
      receiverId: isGroupConversation ? '' : selectedConversation,
      groupId: isGroupConversation ? groupId : null,
      content: messageContent,
      messageType: 'text',
      isRead: false,
      createdAt: new Date().toISOString(),
      senderName: profile?.name || 'You',
      senderAvatarUrl: profile?.avatarUrl,
      isGroup: isGroupConversation,
      isPending: true, // Mark as pending for UI indication
    };

    // Add optimistic message to cache immediately
    queryClient.setQueryData(['messaging', 'conversation', selectedConversation], (old: any) => {
      if (!old) return [optimisticMessage];
      return [...old, optimisticMessage];
    });

    // Prepare message data based on conversation type
    const messageData = isGroupConversation && groupId
      ? { groupId, content: messageContent }
      : { receiverId: selectedConversation, content: messageContent };

    try {
      if (isConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send via WebSocket for instant real-time delivery
        wsRef.current.send(JSON.stringify({
          type: 'send_message',
          ...messageData,
          messageType: 'text',
          tempId: optimisticMessage.id // Include temp ID for replacement
        }));
        
        // Instantly update conversation list without waiting for server response
        queryClient.setQueryData(['messaging', 'unified-conversations'], (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((conv: any) => {
            if (conv.id === selectedConversation || conv.otherUserId === selectedConversation) {
              return {
                ...conv,
                lastMessage: messageContent,
                lastMessageTime: new Date().toISOString()
              };
            }
            return conv;
          });
        });
      } else {
        // Fallback to HTTP API
        console.warn('⚠️ WebSocket not connected, using HTTP fallback');
        await sendMessageMutation.mutateAsync(messageData);
        // Update conversation list after HTTP send
        queryClient.invalidateQueries({ queryKey: ['messaging', 'unified-conversations'] });
      }
    } catch (error) {
      // Remove optimistic message on error
      queryClient.setQueryData(['messaging', 'conversation', selectedConversation], (old: any) => {
        if (!old) return [];
        return old.filter((msg: any) => msg.id !== optimisticMessage.id);
      });
      
      // Show error feedback
      console.error('Failed to send message:', error);
    }
  };

  const handleSelectConversation = (userId: string) => {
    setSelectedConversation(userId);
    setNewMessage('');
    
    // Mark unread messages as read when opening conversation for quick count updates
    markConversationAsRead(userId);
    
    // Don't call onChatModeChange - we're staying in messaging mode, just switching conversations
  };

  // Function to mark all unread messages in a conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      // Handle different conversation types with appropriate endpoints
      if (conversationId.startsWith('group_')) {
        const groupId = conversationId.replace('group_', '');
        await apiRequest(`/api/messages/group/${groupId}/mark-read`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${sessionId}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // For direct/support conversations, mark conversation as read
        await apiRequest(`/api/messages/conversation/${conversationId}/mark-read`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${sessionId}`,
            'Content-Type': 'application/json'
          }
        });
      }

      // Invalidate relevant queries to update unread counts
      queryClient.invalidateQueries({ queryKey: ['messaging', 'unified-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'user-groups'] });
      
      // Optimistic cache update for immediate UI response
      queryClient.setQueryData(['messaging', 'unified-conversations'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((conversation: any) => {
          if (conversation.id === conversationId || conversation.otherUserId === conversationId) {
            return { ...conversation, unreadCount: 0 };
          }
          return conversation;
        });
      });

      // Also update groups cache if this is a group conversation
      if (conversationId.startsWith('group_')) {
        queryClient.setQueryData(['messaging', 'user-groups'], (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((group: any) => {
            if (group.id === conversationId) {
              return { ...group, unreadCount: 0 };
            }
            return group;
          });
        });
      }

    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      // Still invalidate to refresh from server
      queryClient.invalidateQueries({ queryKey: ['messaging', 'unified-conversations'] });
    }
  }, [queryClient]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && shouldAutoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [shouldAutoScroll]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      const timer = setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, shouldAutoScroll]);

  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // WebSocket message listener - Instant updates with optimistic UI
  const messageHandler = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        console.log('📨 New message received via WebSocket:', data.data);
        // Instantly add message to cache for immediate UI update
        queryClient.setQueryData(['messaging', 'conversation', selectedConversation], (old: any) => {
          if (!old) return [data.data];
          // Avoid duplicates
          const exists = old.some((msg: any) => msg.id === data.data.id);
          if (exists) return old;
          return [...old, data.data];
        });
        // Also update conversation list
        queryClient.invalidateQueries({ queryKey: ['messaging', 'unified-conversations'] });
        
      } else if (data.type === 'message_sent' && data.tempId) {
        console.log('✅ Message sent confirmed, replacing optimistic message:', data.tempId);
        // Replace optimistic message with real server message
        queryClient.setQueryData(['messaging', 'conversation', selectedConversation], (old: any) => {
          if (!old) return [data.data];
          return old.map((msg: any) => 
            msg.id === data.tempId 
              ? { ...data.data, isPending: false } // Replace with server message
              : msg
          );
        });
        
      } else if (data.type === 'message_error') {
        console.error('❌ Message error:', data.message);
        if (data.tempId) {
          // Remove failed optimistic message
          queryClient.setQueryData(['messaging', 'conversation', selectedConversation], (old: any) => {
            if (!old) return [];
            return old.filter((msg: any) => msg.id !== data.tempId);
          });
        }
        
      } else if (data.type === 'presence_update') {
        // Update presence without full query invalidation
        queryClient.setQueryData(['messaging', 'contacts'], (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((contact: any) => {
            if (contact.userId === data.data?.userId) {
              return { ...contact, isOnline: data.data?.isOnline };
            }
            return contact;
          });
        });
      } else if (data.type === 'call_offer') {
        setCallState('incoming');
        setCallType(data.callType);
      } else if (data.type === 'call_answer') {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallState('connected');
          setCallStartTime(new Date());
        }
      } else if (data.type === 'call_ice_candidate') {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } else if (data.type === 'call_end') {
        endCall();
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [selectedConversation, profile?.userId, queryClient]);

  useEffect(() => {
    if (!wsRef.current) return;

    const ws = wsRef.current;
    ws.addEventListener('message', messageHandler);
    return () => {
      ws.removeEventListener('message', messageHandler);
    };
  }, [messageHandler]);

  // Cleanup audio refs on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  // Get status indicator for users - consistent for all roles
  const getStatusIndicator = (role: string) => {
    if (role === 'admin') return 'bg-green-500';
    if (role === 'teacher') return 'bg-blue-500';
    return 'bg-gray-400';
  };

  // Combine contacts and conversations for sidebar
  const combinedContacts = useMemo(() => {
    const contactMap = new Map();
    const idToCanonicalId = new Map(); // Maps any ID to its canonical ID
    
    // Helper function to get all possible IDs for a user
    const getPossibleIds = (user: any) => {
      const ids = new Set<string>();
      if (user.userId) ids.add(user.userId);
      if (user.id) ids.add(user.id);
      return Array.from(ids).filter(id => id); // Filter out empty values
    };
    
    // First, add all contacts
    contacts.forEach((contact: User) => {
      const possibleIds = getPossibleIds(contact);
      
      // Check if this contact already exists under any ID
      const existingCanonicalId = possibleIds.find(id => idToCanonicalId.has(id));
      
      if (!existingCanonicalId) {
        // New contact - use first available ID as canonical
        const canonicalId = contact.userId || contact.id;
        
        // Find matching conversation
        const conversation = conversations.find((conv: Conversation) => {
          if (conv.otherUser?.userId === contact.userId) return true;
          if (conv.otherUserId === contact.id) return true;
          if (conv.otherUser?.id === contact.id) return true;
          if (conv.otherUserId === contact.userId) return true;
          return false;
        });
        
        // Map all possible IDs to this canonical ID
        possibleIds.forEach(id => idToCanonicalId.set(id, canonicalId));
        
        contactMap.set(canonicalId, {
          ...contact,
          // Prefer conversation avatarUrl if available (it's more up to date)
          avatarUrl: conversation?.avatarUrl || conversation?.otherUser?.avatarUrl || contact.avatarUrl,
          lastMessage: conversation?.lastMessage || '',
          lastMessageTime: conversation?.lastMessageTime || '',
          unreadCount: conversation?.unreadCount || 0
        });
      }
    });
    
    // Then, add conversations that don't have a matching contact
    conversations.forEach((conv: any) => {
      const otherUser = conv.otherUser || {};
      const possibleIds = getPossibleIds({
        userId: conv.otherUserId || otherUser.userId,
        id: otherUser.id
      });
      
      // Check if any of the possible IDs already exist
      const existingCanonicalId = possibleIds.find(id => idToCanonicalId.has(id));
      
      if (!existingCanonicalId) {
        // Use the first available ID as the canonical key
        const canonicalId = conv.otherUserId || otherUser.userId || otherUser.id;
        
        // Map all possible IDs to this canonical ID
        possibleIds.forEach(id => idToCanonicalId.set(id, canonicalId));
        
        contactMap.set(canonicalId, {
          id: otherUser.id || conv.otherUserId,
          userId: otherUser.userId || conv.otherUserId,
          email: otherUser.email || '',
          name: conv.title || otherUser.name || otherUser.email || 'Unknown',
          role: otherUser.role || 'student',
          avatarUrl: conv.avatarUrl || otherUser.avatarUrl,
          lastMessage: conv.lastMessage || '',
          lastMessageTime: conv.lastMessageTime || '',
          unreadCount: conv.unreadCount || 0,
          friendshipStatus: 'accessible' // Allow messaging if there's a conversation
        });
      }
    });
    
    return Array.from(contactMap.values());
  }, [contacts, conversations]);

  // Sort contacts: unread messages first, then by last message time (newest first)
  const sortedContacts = useMemo(() => {
    return [...combinedContacts].sort((a, b) => {
      // First, prioritize unread messages
      const unreadA = Number(a.unreadCount) || 0;
      const unreadB = Number(b.unreadCount) || 0;
      
      if (unreadA > 0 && unreadB === 0) return -1; // a has unread, b doesn't - a comes first
      if (unreadA === 0 && unreadB > 0) return 1;  // b has unread, a doesn't - b comes first
      
      // If both have unread or both don't have unread, sort by last message time
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      return timeB - timeA; // Newest first
    });
  }, [combinedContacts]);

  // Calculate total unread messages across ALL conversations (independent of search/filters)
  const totalGlobalUnreadCount = useMemo(() => {
    return combinedContacts.reduce((sum: number, contact: any) => {
      const unreadCount = Number(contact.unreadCount) || 0;
      return sum + unreadCount;
    }, 0);
  }, [combinedContacts]);

  // Calculate unread counts for Groups and Support tabs
  const groupsUnreadCount = useMemo(() => {
    // Sum all unread messages across all groups
    // Exclude the currently selected group conversation to immediately reflect read status
    return userGroups.reduce((sum: number, group: any) => {
      // Skip the selected group since it's being viewed
      if (selectedConversation && group.id === selectedConversation) {
        return sum;
      }
      const unreadCount = Number(group.unreadCount) || 0;
      return sum + unreadCount;
    }, 0);
  }, [userGroups, selectedConversation]);

  const supportUnreadCount = useMemo(() => {
    // Sum all unread messages from admin/support contacts
    return combinedContacts.reduce((sum: number, contact: any) => {
      if (contact.role === 'admin' || contact.otherUser?.role === 'admin') {
        const unreadCount = Number(contact.unreadCount) || 0;
        return sum + unreadCount;
      }
      return sum;
    }, 0);
  }, [combinedContacts]);

  const filteredContacts = sortedContacts.filter((contact: any) => {
    const query = searchQuery.toLowerCase();
    
    // Admins and Freelancers can see and message everyone without restrictions
    if (userRole === 'admin' || userRole === 'freelancer') {
      return (
        contact.name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.role?.toLowerCase().includes(query)
      );
    }
    
    // Grade-based contact restrictions for students (child safety)
    if (userRole === 'student') {
      const gradeRestrictions = getGradeFeatureRestrictions(profile?.grade);
      const contactRole = contact.role?.toLowerCase();
      
      // Check if contact role is allowed based on grade restrictions
      const allowedRoles = gradeRestrictions.allowedMessageContacts;
      
      // Map contact roles to restriction categories
      const isAdmin = contactRole === 'admin';
      const isTeacher = contactRole === 'teacher';
      const isStudent = contactRole === 'student';
      
      // Apply grade-based filtering:
      // Grade 1-7: Only admins
      // Grade 8-11: Admins + teachers
      // Grade 12+: All (admins, teachers, students/community)
      if (!allowedRoles.includes('admin') && !isAdmin && !isTeacher && !isStudent) {
        // If role is not in standard categories, hide it
        return false;
      }
      
      if (isAdmin) {
        // Always show admins
        return (
          contact.name?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.role?.toLowerCase().includes(query)
        );
      }
      
      if (isTeacher) {
        // Show teachers only if allowed
        if (!gradeRestrictions.canSeeTeachersInMessages) {
          return false;
        }
        return (
          contact.name?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.role?.toLowerCase().includes(query)
        );
      }
      
      if (isStudent) {
        // Show other students only if grade 12+ and they have accepted friendship
        if (!gradeRestrictions.canSeeCommunityInMessages) {
          return false;
        }
        if (contact.friendshipStatus !== 'accepted' && contact.friendshipStatus !== 'accessible') {
          return false;
        }
        return (
          contact.name?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.role?.toLowerCase().includes(query)
        );
      }
    }
    
    // For non-student roles (teachers), always show teachers and admins
    if (contact.role === 'teacher' || contact.role === 'admin') {
      return (
        contact.name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.role?.toLowerCase().includes(query)
      );
    }
    
    // For other contacts, only show if they have accepted friendship status
    if (contact.role === 'student') {
      if (contact.friendshipStatus !== 'accepted' && contact.friendshipStatus !== 'accessible') {
        return false;
      }
    }
    
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.role?.toLowerCase().includes(query)
    );
  });

  // Get selected user from conversations or contacts
  const selectedUser = selectedConversation ? (
    conversations.find((conv: any) => 
      conv.otherUserId === selectedConversation || 
      conv.otherUser?.textUserId === selectedConversation ||
      conv.otherUser?.userId === selectedConversation
    )?.otherUser ||
    contacts.find((contact: any) => 
      contact.userId === selectedConversation || 
      contact.id === selectedConversation ||
      contact.textUserId === selectedConversation
    )
  ) : null;
  const selectedGroup = isGroupConversation ? userGroups.find((g: any) => g.id === selectedConversation) : null;
  
  // Group settings handlers
  const handleOpenGroupSettings = () => {
    if (selectedGroup) {
      setGroupName(selectedGroup.name || '');
      setGroupDescription(selectedGroup.description || '');
      setShowGroupSettings(true);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !groupName.trim()) return;
    
    setIsUpdatingGroup(true);
    try {
      await updateGroupMutation.mutateAsync({
        groupId: selectedGroup.originalId,
        name: groupName.trim(),
        description: groupDescription.trim()
      });
    } catch (error) {
      console.error('Update group error:', error);
      setIsUpdatingGroup(false);
    }
  };

  const handleGroupAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedGroup) return;

    try {
      await updateGroupAvatarMutation.mutateAsync({
        groupId: selectedGroup.originalId,
        avatarFile: file
      });
    } catch (error) {
      console.error('Update group avatar error:', error);
    }
  };

  // Handle opening user profile modal
  const handleOpenUserProfile = async (userIdOrProfileId: string, userName?: string) => {
    try {
      // First try to find user in contacts
      const contact = contacts.find((c: any) => c.userId === userIdOrProfileId || c.id === userIdOrProfileId);
      
      // Check if this is an admin or support user - don't open profile for them
      if (contact && (contact.role === 'admin' || contact.name === 'Support' || contact.name === 'Tech Support' || userIdOrProfileId.startsWith('ADMIN'))) {
        return; // Don't show profile modal for admin/support users
      }
      
      if (contact) {
        // Fetch real user data from API instead of using placeholder data
        const response = await apiRequest(`/api/profile/${contact.userId}`, {
          method: 'GET'
        });
        
        if (response.success && response.profile) {
          // Get real-time presence from WebSocket
          const presence = getUserPresence(contact.userId);
          
          setSelectedUserProfile({
            id: response.profile.id,
            userId: response.profile.userId || response.user?.userId,
            name: response.profile.name || response.user?.email,
            email: response.user?.email || response.profile.email,
            avatarUrl: response.profile.avatarUrl,
            country: response.profile.country || 'Unknown',
            grade: response.profile.grade || 0,
            role: response.profile.role || 'student',
            createdAt: response.profile.createdAt || response.profile.updatedAt,
            bio: response.profile.bio || 'No bio available',
            isOnline: presence?.isOnline ?? response.profile.isOnline
          });
        } else {
          // Fallback to contact data but still use real info
          setSelectedUserProfile({
            id: contact.id,
            userId: contact.userId,
            name: contact.name || contact.email,
            email: contact.email,
            avatarUrl: contact.avatarUrl,
            country: contact.country,
            grade: contact.grade,
            role: contact.role,
            createdAt: contact.createdAt,
            bio: contact.bio,
            isOnline: contact.isOnline
          });
        }
        // Profile modal removed
      } else {
        // If not found in contacts, check if it's admin/support before fetching
        if (userIdOrProfileId.startsWith('ADMIN') || userName === 'Support' || userName === 'Tech Support') {
          return; // Don't show profile modal for admin/support users
        }
        
        // If not found in contacts, fetch from API
        const response = await apiRequest(`/api/profile/${userIdOrProfileId}`, {
          method: 'GET'
        });
        
        if (response.success && response.profile) {
          // Check role from API response too
          if (response.profile.role === 'admin') {
            return; // Don't show profile for admin users
          }
          
          // Get real-time presence from WebSocket
          const presence = getUserPresence(userIdOrProfileId);
          
          setSelectedUserProfile({
            id: response.profile.id,
            userId: response.profile.userId || response.user?.userId,
            name: response.profile.name || userName || response.user?.email,
            email: response.user?.email || response.profile.email,
            avatarUrl: response.profile.avatarUrl,
            country: response.profile.country || 'Unknown',
            grade: response.profile.grade || 0,
            role: response.profile.role || 'student',
            createdAt: response.profile.createdAt || response.profile.updatedAt,
            bio: response.profile.bio || 'No bio available',
            isOnline: presence?.isOnline ?? response.profile.isOnline
          });
          // Profile modal removed
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Don't show fallback profile for admin/support users
      if (userIdOrProfileId.startsWith('ADMIN') || userName === 'Support' || userName === 'Tech Support') {
        return;
      }
    }
  };

  // WhatsApp-style clean contacts view
  if (!selectedConversation) {
    return (
      <div className="flex flex-col bg-white fixed inset-0 md:relative md:inset-auto z-50 md:z-auto" style={{ fontFamily: 'Satoshi, sans-serif', height: '100dvh', minHeight: '-webkit-fill-available' }}>
        {/* Clean WhatsApp Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onChatModeChange) {
                  onChatModeChange(false);
                } else {
                  if (userRole === 'student') {
                    window.location.href = '/';
                  } else if (userRole === 'admin') {
                    window.location.href = '/?page=admin-dashboard';
                  } else if (userRole === 'teacher') {
                    window.location.href = '/?page=teacher-dashboard';
                  } else if (userRole === 'freelancer') {
                    window.location.href = '/?page=freelancer-dashboard';
                  } else {
                    window.history.back();
                  }
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors" transition-all duration-300
              data-testid="back-to-dashboard"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          </div>
          <div className="flex items-center gap-1">
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2 bg-white border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#A0FAB2]"
              data-testid="search-conversations"
            />
          </div>
        </div>

        {/* WhatsApp-style Navigation Tabs */}
        <div className="px-4 py-2 bg-white border-b border-gray-100">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {(() => {
              const userGrade = profile?.grade || profile?.gradeLevel;
              const isElementary = userGrade && (
                (typeof userGrade === 'number' && userGrade >= 1 && userGrade <= 7) ||
                (typeof userGrade === 'string' && ['1', '2', '3', '4', '5', '6', '7'].includes(userGrade))
              );
              
              if (isElementary) {
                return [{ key: 'support', label: 'Support', count: supportUnreadCount }];
              }
              
              return [
                { 
                  key: 'chats', 
                  label: 'Chats',
                  count: totalGlobalUnreadCount,
                  hasUnread: totalGlobalUnreadCount > 0
                },
                ...(userRole !== 'freelancer' ? [{ key: 'groups', label: 'Groups', count: groupsUnreadCount }] : []),
                ...(userRole === 'student' ? [{ key: 'teachers', label: 'Teachers', count: 0 }] : []),
                { key: 'support', label: 'Support', count: supportUnreadCount }
              ];
            })().map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  activeTab === tab.key
                    ? "bg-[#2f5a4e] text-white shadow-sm"
                    : tab.key === 'chats' && tab.hasUnread
                      ? "bg-[#2f5a4e]/20 text-[#2f5a4e] hover:bg-[#2f5a4e]/30" // Highlight chats tab when there are unreads
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                data-testid={`tab-${tab.key}`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center",
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-300 text-gray-700"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Contacts List */}
        <div className="flex-1 overflow-y-auto bg-white scrollbar-hide"
             style={{ 
               WebkitOverflowScrolling: 'touch',
               scrollbarWidth: 'none',
               msOverflowStyle: 'none'
             }}>
          <div className="p-2 space-y-1">
            {contactsLoading ? (
              <div className="text-sm text-gray-500 text-center py-4">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">No contacts found</div>
            ) : (
              <>
                {/* Filter content based on active tab */}
                {activeTab === 'chats' && (
                  <>
                    {/* Regular Conversations for Chats Tab - show all contacts with existing conversations, exclude admins */}
                    {filteredContacts
                      .filter((contact: any) => {
                        const role = contact.role || contact.otherUser?.role;
                        const hasConversation = contact.lastMessageTime && contact.lastMessageTime !== '';
                        // Exclude admins (they show in Support tab)
                        // Include teachers only if they have an existing conversation
                        if (role === 'admin') return false;
                        if (role === 'teacher') return hasConversation; // Only show teachers with existing chats
                        return true; // Show all other roles (students, freelancers, etc.)
                      })
                      .map((contact: any) => {
                        // Freelancers can message anyone who has messaged them (has a conversation)
                        // Teachers and admins can always be messaged
                        const hasConversation = contact.lastMessageTime && contact.lastMessageTime !== '';
                        const canMessage = userRole === 'admin' ||
                                           userRole === 'freelancer' ||
                                           contact.role === 'teacher' || 
                                           contact.role === 'admin' ||
                                           contact.friendshipStatus === 'accepted' || 
                                           contact.friendshipStatus === 'accessible' ||
                                           hasConversation;
                        
                        return (
                          <div
                            key={contact.userId || contact.id || contact.email}
                            onClick={() => canMessage ? handleSelectConversation(contact.userId) : undefined}
                            className={cn(
                              "flex items-center gap-3 p-3 mx-1 rounded-xl transition-all duration-200",
                              canMessage ? "cursor-pointer hover:bg-gray-50" : "cursor-default",
                              selectedConversation === contact.userId ? "bg-blue-50 border-l-4 border-primary" : "",
                              !canMessage && contact.friendshipStatus === 'none' ? "opacity-75" : ""
                            )}
                            data-testid={`contact-${contact.userId}`}
                          >
                          <div className="relative">
                            <Avatar className="h-12 w-12 rounded-full">
                              <AvatarImage src={contact.avatarUrl} className="rounded-full" />
                              <AvatarFallback className="bg-primary text-primary-foreground rounded-full font-semibold">
                                {contact.name?.charAt(0) || contact.email?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                              contact.isOnline ? "bg-green-500" : "bg-gray-400"
                            )} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <p className="font-semibold text-gray-900 truncate">{contact.name || contact.email}</p>
                                {contact.role === 'teacher' && (
                                  <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white">
                                      <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                                    </svg>
                                  </div>
                                )}
                                {contact.verificationBadge === 'green' && (
                                  <div title="Premium Verified">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5" data-testid={`contact-badge-green-${contact.userId}`}>
                                      <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                                {contact.verificationBadge === 'blue' && (
                                  <div title="Verified User">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5" data-testid={`contact-badge-blue-${contact.userId}`}>
                                      <g clipPath="url(#clip0_343_1428_contact)">
                                        <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                        <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                                      </g>
                                      <defs>
                                        <clipPath id="clip0_343_1428_contact">
                                          <rect width="24" height="24" fill="#fff" />
                                        </clipPath>
                                      </defs>
                                    </svg>
                                  </div>
                                )}
                              </div>
                              {contact.lastMessageTime && (
                                <span className="text-xs text-gray-500">
                                  {formatMessageTime(contact.lastMessageTime)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500 truncate">
                                {contact.lastMessage || "Start a conversation"}
                              </p>
                              <div className="flex items-center gap-2">
                                {/* Friend request button for students who aren't friends */}
                                {!canMessage && contact.friendshipStatus === 'none' && contact.role === 'student' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs px-2 py-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendFriendRequestMutation.mutate(contact.userId);
                                    }}
                                    disabled={sendFriendRequestMutation.isPending}
                                  >
                                    Add Friend
                                  </Button>
                                )}
                                {contact.unreadCount > 0 && selectedConversation !== contact.userId && (
                                  <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center font-semibold">
                                    {contact.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    {filteredContacts.filter((contact: any) => {
                      const role = contact.role || contact.otherUser?.role;
                      const hasConversation = contact.lastMessageTime && contact.lastMessageTime !== '';
                      if (role === 'admin') return false;
                      if (role === 'teacher') return hasConversation;
                      return true;
                    }).length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-8">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        No chats yet
                      </div>
                    )}
                  </>
                )}


                {/* Groups Tab */}
                {activeTab === 'groups' && (
                  <>
                    {userGroups.map((group: any) => (
                      <div
                        key={group.id}
                        onClick={() => {
                          const groupId = group.originalId || group.id.replace('group_', '');
                          const fullGroupId = `group_${groupId}`;
                          handleSelectConversation(fullGroupId);
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 mx-1 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50",
                          selectedConversation === `group_${group.originalId || group.id.replace('group_', '')}` ? "bg-blue-50 border-l-4 border-primary" : ""
                        )}
                        data-testid={`group-${group.id}`}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12 rounded-full">
                            <AvatarImage src={group.avatarUrl} className="rounded-full" />
                            <AvatarFallback className="bg-green-600 text-white rounded-full font-semibold">
                              {group.name?.charAt(0)?.toUpperCase() || 'G'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                              <Hash className="h-3 w-3 text-gray-500" />
                            </div>
                            {group.lastMessageTime && (
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(group.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate">
                              {group.actualLastMessage || group.description || `Group • ${group.memberCount} members`}
                            </p>
                            {group.unreadCount > 0 && selectedConversation !== `group_${group.originalId || group.id.replace('group_', '')}` && (
                              <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center font-semibold">
                                {group.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {userGroups.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-8">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        No groups yet
                      </div>
                    )}
                  </>
                )}

                {/* Teachers Tab - For Premium Students - Only show teachers who accept student bookings */}
                {activeTab === 'teachers' && (
                  <>
                    {filteredContacts
                      .filter((contact: any) => {
                        const role = contact.role || contact.otherUser?.role;
                        // Only show teachers who have availability settings (accept student bookings)
                        return role === 'teacher' && contact.availabilitySettings;
                      })
                      .map((contact: any) => {
                        const hasConversation = contact.lastMessageTime && contact.lastMessageTime !== '';
                        const canMessage = true; // Students can always message teachers who accept bookings
                        
                        return (
                          <div
                            key={contact.userId || contact.id || contact.email}
                            onClick={() => canMessage ? handleSelectConversation(contact.userId) : undefined}
                            className={cn(
                              "flex items-center gap-3 p-3 mx-1 rounded-xl transition-all duration-200",
                              canMessage ? "cursor-pointer hover:bg-gray-50" : "cursor-default",
                              selectedConversation === contact.userId ? "bg-blue-50 border-l-4 border-primary" : ""
                            )}
                            data-testid={`teacher-contact-${contact.userId}`}
                          >
                            <div className="relative">
                              <Avatar className="h-12 w-12 rounded-full">
                                <AvatarImage src={contact.avatarUrl} className="rounded-full" />
                                <AvatarFallback className="bg-primary text-white rounded-full font-semibold">
                                  {contact.name?.charAt(0) || contact.email?.charAt(0)?.toUpperCase() || 'T'}
                                </AvatarFallback>
                              </Avatar>
                              <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                                contact.isOnline ? "bg-green-500" : "bg-gray-400"
                              )} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <p className="font-semibold text-gray-900 truncate">{contact.name || contact.email}</p>
                                  <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white">
                                      <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                                    </svg>
                                  </div>
                                  {contact.verificationBadge === 'green' && (
                                    <div title="Premium Verified">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5" data-testid={`teacher-badge-green-${contact.userId}`}>
                                        <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  {contact.verificationBadge === 'blue' && (
                                    <div title="Verified Teacher">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5" data-testid={`teacher-badge-blue-${contact.userId}`}>
                                        <g clipPath="url(#clip0_teachers)">
                                          <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                          <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                                        </g>
                                        <defs>
                                          <clipPath id="clip0_teachers">
                                            <rect width="24" height="24" fill="#fff" />
                                          </clipPath>
                                        </defs>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                {contact.lastMessageTime && (
                                  <span className="text-xs text-gray-500">
                                    {formatMessageTime(contact.lastMessageTime)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500 truncate">
                                  {contact.lastMessage || "Start a conversation"}
                                </p>
                                {contact.unreadCount > 0 && selectedConversation !== contact.userId && (
                                  <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center font-semibold">
                                    {contact.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {filteredContacts.filter((contact: any) => {
                      const role = contact.role || contact.otherUser?.role;
                      return role === 'teacher' && contact.availabilitySettings;
                    }).length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-8">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        No teachers available for booking
                      </div>
                    )}
                  </>
                )}

                {/* Support Tab */}
                {activeTab === 'support' && (
                  <>
                    {filteredContacts
                      .filter((contact: any) => (contact.role || contact.otherUser?.role) === 'admin')
                      .map((contact: any) => (
                        <div
                          key={contact.userId || contact.id || contact.email}
                          onClick={() => handleSelectConversation(contact.userId)}
                          className={cn(
                            "flex items-center gap-3 p-3 mx-1 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50",
                            selectedConversation === contact.userId ? "bg-blue-50 border-l-4 border-primary" : ""
                          )}
                          data-testid={`contact-${contact.userId}`}
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12 rounded-full">
                              <AvatarImage src={contact.avatarUrl} className="rounded-full" />
                              <AvatarFallback className="bg-primary text-primary-foreground rounded-full font-semibold">
                                {contact.name?.charAt(0) || contact.email?.charAt(0)?.toUpperCase() || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                              contact.isOnline ? "bg-green-500" : "bg-gray-400"
                            )} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <p className="font-semibold text-gray-900 truncate">{contact.name || contact.email}</p>
                                <div className="w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3747D6' }}>
                                  <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                  </svg>
                                </div>
                              </div>
                              {contact.lastMessageTime && (
                                <span className="text-xs text-gray-500">
                                  {formatMessageTime(contact.lastMessageTime)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500 truncate">
                                {contact.lastMessage || "24/7 Support Available"}
                              </p>
                              <div className="flex items-center gap-2">
                                {contact.unreadCount > 0 && selectedConversation !== contact.userId && (
                                  <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center font-semibold">
                                    {contact.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {filteredContacts.filter((contact: any) => (contact.role || contact.otherUser?.role) === 'admin').length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-8">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        No support contacts available
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full-screen chat when conversation is selected
  // Use optimized interface if enabled and in conversation mode
  if (useOptimizedInterface && selectedConversation && selectedUser) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col z-50" style={{ fontFamily: 'Satoshi, sans-serif', height: '100dvh', minHeight: '-webkit-fill-available' }}>
        <SimpleOptimizedInterface
          conversationId={selectedConversation}
          otherUserId={selectedUser.userId}
          otherUserName={selectedUser.name || selectedUser.email}
          onBack={() => setSelectedConversation(null)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-50" style={{ fontFamily: 'Satoshi, sans-serif', height: '100dvh', minHeight: '-webkit-fill-available' }}>
      {selectedConversation && (selectedUser || selectedGroup) ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Chat Header - Fixed */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 mr-3 hover:bg-gray-100 rounded-full transition-colors" transition-all duration-300
                  data-testid="back-to-contacts"
                >
                  <ChevronLeft className="h-6 w-6 text-black stroke-[3]" style={{ color: '#000000' }} />
                </button>
                <Avatar 
                  className="h-10 w-10 rounded-full hover:ring-2 hover:ring-[#A0FAB2] hover:ring-offset-1 transition-all cursor-pointer" transition-all duration-300
                  onClick={() => {
                    if (selectedUser && !isGroupConversation) {
                      handleOpenUserProfile(selectedUser.userId, selectedUser.name);
                    }
                  }}
                >
                  <AvatarImage src={selectedGroup?.avatarUrl || selectedUser?.avatarUrl} className="rounded-full" />
                  <AvatarFallback className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground rounded-full font-semibold">
                    {selectedGroup ? selectedGroup.name?.charAt(0)?.toUpperCase() || 'G' : (selectedUser?.name?.charAt(0) || selectedUser?.email?.charAt(0)?.toUpperCase() || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold text-gray-900 truncate max-w-[200px]">
                      {selectedGroup ? selectedGroup.name : (selectedUser?.name || selectedUser?.email)}
                    </h3>
                    {selectedUser?.role === 'admin' && (
                      <div className="w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3747D6' }}>
                        <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </div>
                    )}
                    {selectedUser?.verificationBadge === 'green' && (
                      <div className="flex items-center justify-center" title="Premium Verified">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5" data-testid="header-badge-green">
                          <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {selectedUser?.verificationBadge === 'blue' && (
                      <div className="flex items-center justify-center" title="Verified User">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5" data-testid="header-badge-blue">
                          <g clipPath="url(#clip0_343_1428_header)">
                            <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                            <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                          </g>
                          <defs>
                            <clipPath id="clip0_343_1428_header">
                              <rect width="24" height="24" fill="#fff" />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                    )}
                    {selectedGroup && (
                      <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white">
                          <path d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {selectedGroup ? `Group • ${selectedGroup.memberCount} members` : (selectedUser?.role === 'admin' ? 'EduFiliova 24/7 Support' : selectedUser?.role === 'user' ? 'Student' : selectedUser?.role)}
                    </span>
                    {selectedConversation && isUserTyping(selectedConversation) && (
                      <span className="text-sm text-foreground font-medium">typing...</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedGroup && (
                  <button 
                    className="h-8 w-8 p-0 rounded-full flex items-center justify-center"
                    onClick={handleOpenGroupSettings}
                    data-testid="group-settings-button"
                  >
                    <Settings className="h-4 w-4" style={{ color: '#000000' }} />
                  </button>
                )}
              </div>
            </div>

          {/* Messages Area - Flexible Height Container */}
          <div 
            className="flex-1 overflow-y-auto bg-white scrollbar-hide"
            onScroll={handleScroll}
            style={{ 
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '16px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
              <div className="px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {messagesLoading ? (
                  <div className="text-center text-gray-600 py-8">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="h-4 w-4 bg-gray-400 rounded-full animate-bounce"></div>
                      <span>Loading messages...</span>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-gray-500">Your messages are end-to-end encrypted</p>
                    </div>
                  </div>
                ) : (
                  messages
                    ?.sort((a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((message: Message) => {
                      // Use multiple user identifiers to determine message ownership
                      const isFromCurrentUser = message.senderId === currentUserProfile?.id || 
                                               message.senderId === user?.id || 
                                               message.senderId === profile?.id;
                      
                      
                      
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex items-end gap-2 mb-3 max-w-full",
                            isFromCurrentUser ? "justify-end" : "justify-start"
                          )}
                          data-testid={`message-${message.id}`}
                        >
                          {/* Receiver's Avatar - Left Side */}
                          {!isFromCurrentUser && (
                            <Avatar 
                              className="h-10 w-10 flex-shrink-0 rounded-full mb-1 cursor-pointer hover:ring-2 hover:ring-[#A0FAB2] hover:ring-offset-2 transition-all" transition-all duration-300
                              onClick={() => handleOpenUserProfile(message.senderId, message.senderName)}
                            >
                              <AvatarImage src={message.senderAvatarUrl} className="rounded-full" />
                              <AvatarFallback className="bg-blue-500 text-white text-lg font-bold flex items-center justify-center h-full w-full" style={{backgroundColor: '#3B82F6', color: '#FFFFFF'}}>
                                {message.senderName?.charAt(0)?.toUpperCase() || selectedUser?.name?.charAt(0)?.toUpperCase() || message.senderName?.charAt(0) || 'A'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={cn(
                            "flex flex-col max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]",
                            isFromCurrentUser ? "items-end" : "items-start"
                          )}>
                            
                            {/* Sender name for group chats (only for incoming messages) */}
                            {!isFromCurrentUser && (message.isGroup || isGroupConversation) && (
                              <div className="flex items-center gap-1 mb-1 px-2">
                                <span className="text-xs text-gray-600 font-medium">
                                  {message.senderName}
                                </span>
                                {message.verificationBadge === 'green' && (
                                  <div title="Premium Verified">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5" data-testid="badge-green">
                                      <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                                {message.verificationBadge === 'blue' && (
                                  <div title="Verified User">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5" data-testid="badge-blue">
                                      <g clipPath="url(#clip0_343_1428)">
                                        <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                        <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                                      </g>
                                      <defs>
                                        <clipPath id="clip0_343_1428">
                                          <rect width="24" height="24" fill="#fff" />
                                        </clipPath>
                                      </defs>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className={cn(
                              "px-3 py-2 break-words relative max-w-[280px] sm:max-w-sm",
                              isFromCurrentUser 
                                ? "rounded-[18px] rounded-br-[6px] bg-[#a7fba3] text-[#000000]" 
                                : "rounded-[18px] rounded-bl-[6px] bg-white text-gray-900"
                            )}>
                              {/* Text Message */}
                              {message.messageType === 'text' && message.content && (
                                <p className="text-[15px] leading-[20px]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                  {message.content}
                                </p>
                              )}
                              
                              {/* Voice Message */}
                              {message.messageType === 'voice' && message.fileMetadata && (
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  <Button
                                    onClick={() => toggleAudioPlayback(message.id, message.fileMetadata!.url)}
                                    className={cn(
                                      "h-8 w-8 rounded-full p-0 border-0",
                                      isFromCurrentUser 
                                        ? "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm" 
                                        : "bg-[#007AFF] text-white hover:bg-[#007AFF]/90"
                                    )}
                                  >
                                    {playingAudio === message.id ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>
                                  
                                  {/* Audio waveform */}
                                  <div className="flex items-center gap-1 flex-1">
                                    {[...Array(15)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={cn(
                                          "w-1 rounded-full transition-all",
                                          isFromCurrentUser ? "bg-white/60" : "bg-[#007AFF]/60",
                                          i % 3 === 0 ? "h-6" : i % 2 === 0 ? "h-4" : "h-3"
                                        )}
                                      />
                                    ))}
                                  </div>
                                  
                                  <span className={cn(
                                    "text-xs font-medium",
                                    isFromCurrentUser ? "text-white/80" : "text-gray-600"
                                  )}>
                                    Voice
                                  </span>
                                </div>
                              )}
                              
                              {/* Image Message - WhatsApp Style */}
                              {(message.messageType === 'image' || message.fileMetadata?.mimeType?.startsWith('image/')) && message.fileMetadata?.url && (
                                <div 
                                  className="relative max-w-[280px] min-w-[200px] group cursor-pointer"
                                  onClick={() => setImageViewer({
                                    isOpen: true,
                                    src: message.fileMetadata?.url || '',
                                    alt: message.fileMetadata?.fileName || "Shared image",
                                    fileName: message.fileMetadata?.fileName
                                  })}
                                >
                                  <div className="relative overflow-hidden rounded-[8px] bg-gray-100 dark:bg-gray-800">
                                    <OptimizedMedia
                                      src={message.fileMetadata?.url || ''}
                                      type="image"
                                      alt={message.fileMetadata?.fileName || "Shared image"}
                                      className="w-full h-auto max-h-[400px] object-cover transition-transform duration-200 hover:scale-105" transition-all duration-300
                                    />
                                    
                                    {/* WhatsApp-style overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 cursor-pointer" transition-all duration-300>
                                      {/* Download/View button */}
                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" transition-all duration-300>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0" transition-all duration-300
                                          onClick={() => window.open(message.fileMetadata?.url, '_blank')}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Message timestamp overlay - WhatsApp style */}
                                  <div className="absolute bottom-1 right-2 flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                                    <span className="text-xs text-white font-medium">
                                      {formatMessageTime(message.createdAt || new Date().toISOString())}
                                    </span>
                                    {isFromCurrentUser && (
                                      <div className="text-white">
                                        {message.isRead ? (
                                          <CheckCheck className="h-3 w-3" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Document Message */}
                              {message.messageType === 'document' && message.fileMetadata && (
                                <div className="flex items-center gap-3 p-2">
                                  <div className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center",
                                    isFromCurrentUser ? "bg-white/20" : "bg-gray-100"
                                  )}>
                                    <FileText className={cn(
                                      "h-5 w-5",
                                      isFromCurrentUser ? "text-white" : "text-gray-600"
                                    )} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      "text-sm font-medium truncate",
                                      isFromCurrentUser ? "text-white" : "text-gray-900"
                                    )}>
                                      {message.fileMetadata.fileName}
                                    </p>
                                    <p className={cn(
                                      "text-xs",
                                      isFromCurrentUser ? "text-white/70" : "text-gray-500"
                                    )}>
                                      Document
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => window.open(message.fileMetadata!.url, '_blank')}
                                    className={cn(
                                      "h-8 w-8 rounded-full p-0",
                                      isFromCurrentUser 
                                        ? "bg-white/20 text-white hover:bg-white/30" 
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    )}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              
                              {/* Fallback for any content that doesn't match specific message types */}
                              {!['text', 'voice', 'image', 'document'].includes(message.messageType) && message.content && (
                                <p className="text-[15px] leading-[20px]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                  {message.content}
                                </p>
                              )}
                              
                            </div>
                            
                            {/* Message Time and Delivery Status */}
                            <div className={cn(
                              "flex items-center gap-1 mt-1 px-2",
                              isFromCurrentUser ? "justify-end" : "justify-start"
                            )}>
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(message.createdAt)}
                              </span>
                              
                              {/* Delivery Status - Only for outgoing messages */}
                              {isFromCurrentUser && (
                                <div className="flex items-center">
                                  {message.readAt ? (
                                    // Read (double check, blue)
                                    (<CheckCheck className="h-3 w-3 text-blue-500" />)
                                  ) : message.deliveredAt ? (
                                    // Delivered (double check, gray)
                                    (<CheckCheck className="h-3 w-3 text-gray-400" />)
                                  ) : (
                                    // Sent (single check, gray)
                                    (<Check className="h-3 w-3 text-gray-400" />)
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Sender's Avatar - Right Side */}
                          {isFromCurrentUser && (
                            <Avatar className="h-10 w-10 flex-shrink-0 rounded-full mb-1">
                              <AvatarImage src={currentUserProfile?.avatarUrl} className="rounded-full" />
                              <AvatarFallback className="bg-blue-500 text-white text-lg font-bold flex items-center justify-center h-full w-full" style={{backgroundColor: '#3B82F6', color: '#FFFFFF'}}>
                                {currentUserProfile?.name?.charAt(0)?.toUpperCase() || currentUserProfile?.email?.charAt(0)?.toUpperCase() || 'T'}
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

          {/* Message Input - Flexible at Bottom */}
          <div 
            className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-white flex-shrink-0 relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mb-2 p-3 bg-white rounded-xl border border-gray-100">
                  <div className="grid grid-cols-8 gap-1">
                    {popularEmojis.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg text-base transition-all" transition-all duration-300
                        onClick={() => handleEmojiSelect(emoji)}
                        data-testid={`emoji-${index}`}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice Recording UI */}
              {isRecording && (
                <div className="mb-3 px-4 py-2 bg-primary/10 border border-red-200 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="font-medium text-primary text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      Recording {formatRecordingTime(recordingTime)}
                    </span>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* Attachment Menu */}
              {showAttachMenu && (
                <div className="mb-3 p-4 bg-white border border-gray-200 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="ghost"
                      className="flex flex-col items-center gap-3 h-auto p-4 hover:bg-gray-50 rounded-xl transition-all" transition-all duration-300
                      onClick={() => {
                        documentInputRef.current?.click();
                        setShowAttachMenu(false);
                      }}
                      data-testid="attach-document"
                    >
                      <FileText className="h-8 w-8 text-foreground" />
                      <span className="text-sm font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>Document</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex flex-col items-center gap-3 h-auto p-4 hover:bg-gray-50 rounded-xl transition-all" transition-all duration-300
                      onClick={() => {
                        imageInputRef.current?.click();
                        setShowAttachMenu(false);
                      }}
                      data-testid="attach-image"
                    >
                      <ImageIcon className="h-8 w-8 text-foreground" />
                      <span className="text-sm font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>Photo</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                {/* Attachment button */}
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="p-2 flex-shrink-0"
                  data-testid="attach-button"
                >
                  <Paperclip className="h-5 w-5" style={{ color: '#000000' }} />
                </button>

                {/* Main input container */}
                <div className="flex-1 flex items-center bg-white rounded-full border border-gray-300 px-4 py-2 min-h-[40px]">
                  {/* Text input */}
                  <input
                    ref={messageInputRef}
                    type="text"
                    inputMode="text"
                    enterKeyHint="send"
                    autoComplete="off"
                    autoCorrect="on"
                    placeholder="Type a message"
                    value={newMessage}
                    onChange={handleMessageInputChange}
                    onKeyDown={handleMessageKeyDown}
                    onFocus={() => {
                      setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 300);
                    }}
                    className="flex-1 bg-transparent border-0 focus:outline-none text-sm placeholder:text-gray-500 text-base"
                    style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '16px' }}
                    data-testid="input-message"
                    aria-expanded={showQuickResponses}
                    aria-haspopup="listbox"
                    aria-activedescendant={showQuickResponses && selectedQuickResponseIndex >= 0 ? `quick-response-${filteredQuickResponses[selectedQuickResponseIndex]?.id}` : undefined}
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

                {/* Voice/Send button */}
                {newMessage.trim() ? (
                  <button
                    type="submit"
                    disabled={sendMessageMutation.isPending}
                    className="h-10 w-10 p-0 hover:bg-[#3ae374] text-white rounded-full flex-shrink-0 flex items-center justify-center transition-colors bg-[#0C332C]" transition-all duration-300
                    data-testid="send-button"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onMouseDown={() => {
                      if (!isRecording) {
                        startRecording();
                      }
                    }}
                    onMouseUp={() => {
                      if (isRecording) {
                        stopRecording();
                      }
                    }}
                    onMouseLeave={() => {
                      if (isRecording) {
                        stopRecording();
                      }
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      if (!isRecording) {
                        startRecording();
                      }
                    }}
                    onTouchEnd={() => {
                      if (isRecording) {
                        stopRecording();
                      }
                    }}
                    className="p-1 sm:p-2 flex-shrink-0 text-[#ffffff] bg-white rounded-full"
                    data-testid="voice-button"
                  >
                    <Mic className="h-5 w-5" style={{ color: '#000000' }} />
                  </button>
                )}
              </form>

              {/* Quick responses dropdown for admin and customer service only */}
              {showQuickResponses && filteredQuickResponses.length > 0 && (
                <div 
                  ref={quickResponsesRef}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
                  role="listbox"
                  data-testid="menu-quick-responses"
                >
                  <div className="p-2 border-b bg-gray-50 text-xs text-gray-600 font-medium">
                    <Hash className="h-3 w-3 inline mr-1" />
                    Quick Responses ({filteredQuickResponses.length})
                  </div>
                  {filteredQuickResponses.map((response: QuickResponse, index: number) => (
                    <div
                      key={response.id}
                      id={`quick-response-${response.id}`}
                      onClick={() => insertQuickResponse(response)}
                      className={cn(
                        "px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0",
                        index === selectedQuickResponseIndex ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      )}
                      role="option"
                      aria-selected={index === selectedQuickResponseIndex}
                      data-testid={`option-quick-response-${response.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-blue-600">
                              /{response.shortcut || response.title}
                            </code>
                            <span className="text-xs text-gray-500 capitalize">
                              {response.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                            {response.content}
                          </p>
                        </div>
                        {index === selectedQuickResponseIndex && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="p-2 bg-gray-50 text-xs text-gray-500 border-t">
                    ↑↓ Navigate • Enter/Tab Select • Esc Close
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              {/* File Previews */}
              {previewFiles.length > 0 && (
                <div className="mb-3 flex gap-2 flex-wrap">
                  {previewFiles.map((fileData) => (
                    <div key={fileData.id} className="relative bg-white rounded-[15px] p-2 border border-gray-200">
                      <img 
                        src={fileData.preview} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded-[10px]"
                      />
                      <div className="absolute -top-2 -right-2 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewFiles(prev => prev.filter(p => p.id !== fileData.id))}
                          className="h-6 w-6 p-0 bg-primary text-white hover:bg-primary rounded-full" transition-all duration-300
                          data-testid={`remove-preview-${fileData.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => sendFileWithPreview(fileData)}
                          className="h-6 w-6 p-0 bg-[#2D5DDC] text-white hover:bg-[#2D5DDC]/80 rounded-full" transition-all duration-300
                          data-testid={`send-preview-${fileData.id}`}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                      {uploadingFiles[fileData.id] !== undefined && (
                        <div className="absolute inset-0 bg-black/50 rounded-[10px] flex items-center justify-center">
                          <div className="text-white text-xs font-medium">
                            {uploadingFiles[fileData.id]}%
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Progress Indicators */}
              {Object.keys(uploadingFiles).length > 0 && (
                <div className="mb-3 space-y-2">
                  {Object.entries(uploadingFiles).map(([fileId, progress]) => (
                    <div key={fileId} className="bg-white rounded-[15px] p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Satoshi, sans-serif' }}>Uploading file...</span>
                        <span className="text-sm text-gray-500">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#2D5DDC] h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Drag and Drop Overlay */}
              {isDragOver && (
                <div className="absolute inset-0 bg-[#2D5DDC]/10 border-2 border-dashed border-[#2D5DDC] rounded-[25px] flex items-center justify-center z-10">
                  <div className="text-center">
                    <Paperclip className="h-8 w-8 text-[#2D5DDC] mx-auto mb-2" />
                    <p className="text-[#2D5DDC] font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>Drop files here to send</p>
                  </div>
                </div>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const fileType = file.type.startsWith('video/') ? 'video' : 'image';
                    handleFileSelect(file, fileType);
                  }
                  e.target.value = '';
                }}
              />
              <input
                ref={documentInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(file, 'document');
                  }
                  e.target.value = '';
                }}
              />
            </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-600">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-gray-500">Your messages are end-to-end encrypted</p>
            </div>
          </div>
        </div>
      )}
      {/* Group Settings Modal */}
      <Dialog open={showGroupSettings} onOpenChange={setShowGroupSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Group Avatar Section */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedGroup?.avatarUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {selectedGroup?.name?.charAt(0)?.toUpperCase() || 'G'}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={updateGroupAvatarMutation.isPending}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGroupAvatarUpload}
              />
              <p className="text-sm text-gray-500">Click camera to change avatar</p>
            </div>

            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                maxLength={50}
                disabled={isUpdatingGroup}
              />
              <p className="text-xs text-gray-500">{groupName.length}/50 characters</p>
            </div>

            {/* Group Description */}
            <div className="space-y-2">
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Input
                id="group-description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description"
                maxLength={100}
                disabled={isUpdatingGroup}
              />
              <p className="text-xs text-gray-500">{groupDescription.length}/100 characters</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowGroupSettings(false)}
                disabled={isUpdatingGroup}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateGroup}
                disabled={isUpdatingGroup || !groupName.trim()}
              >
                {isUpdatingGroup ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-gray-700">
            {/* Caller Avatar */}
            <div className="mb-6">
              <div className="relative mx-auto w-24 h-24 mb-4">
                <Avatar className="h-24 w-24 border-4 border-gray-600 shadow-lg">
                  <AvatarImage 
                    src={contacts.find((c: any) => c.userId === incomingCall.senderId)?.avatarUrl} 
                    className="rounded-full object-cover" 
                  />
                  <AvatarFallback className="bg-gray-600 text-white text-2xl font-bold">
                    {incomingCall.senderName.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {/* Pulsing ring animation */}
                <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-75"></div>
                <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-50" style={{ animationDelay: '1s' }}></div>
              </div>
              
              {/* Caller Name */}
              <h3 className="text-xl font-semibold text-white mb-1 truncate">
                {incomingCall.senderName}
              </h3>
              
              {/* Call Status */}
              <p className="text-sm text-gray-300 mb-1">
                is calling you
              </p>
              
              {/* Call Type */}
              <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                {incomingCall.callType === 'video' ? (
                  <>
                    <Video className="h-3 w-3" />
                    <span>Video call</span>
                  </>
                ) : (
                  <>
                    <Phone className="h-3 w-3" />
                    <span>Voice call</span>
                  </>
                )}
              </div>
            </div>

            {/* Call Controls */}
            <div className="flex justify-center gap-8">
              {/* Decline Button */}
              <Button
                onClick={rejectCall}
                className="h-14 w-14 rounded-full bg-primary hover:bg-primary text-white p-0 shadow-lg border-2 border-primary transition-all duration-200 hover:scale-105" transition-all duration-300
                data-testid="reject-call-button"
              >
                <X className="h-6 w-6" />
              </Button>
              
              {/* Accept Button */}
              <Button
                onClick={acceptCall}
                className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white p-0 shadow-lg border-2 border-green-400 transition-all duration-200 hover:scale-105" transition-all duration-300
                data-testid="accept-call-button"
              >
                <Phone className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Additional Actions (Mobile style) */}
            <div className="mt-6 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white text-xs" transition-all duration-300
                onClick={() => {
                  // Could add message functionality here
                }}
              >
                Send message
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Active Call Interface Modal */}
      {(callState === 'calling' || callState === 'connected') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center">
            {/* User Info */}
            <div className="mb-6">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={selectedUser?.avatarUrl} className="rounded-full" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {selectedUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">{selectedUser?.name}</h3>
              <p className="text-sm text-gray-500">
                {callState === 'calling' && 'Calling...'}
                {callState === 'connected' && `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`}
              </p>
            </div>

            {/* Video Elements */}
            {callType === 'video' && callState === 'connected' && (
              <div className="mb-6 relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-xl bg-gray-900"
                  style={{ maxHeight: '300px' }}
                />
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute bottom-4 right-4 w-24 h-32 rounded-lg bg-gray-900 border-2 border-white"
                />
              </div>
            )}

            {/* Call Controls */}
            <div className="flex justify-center gap-4">
              {callState === 'connected' ? (
                <>
                  <Button
                    onClick={toggleMute}
                    className={cn(
                      "h-12 w-12 rounded-full p-0",
                      isMuted ? "bg-primary hover:bg-primary text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    )}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  
                  {callType === 'video' && (
                    <Button
                      onClick={toggleVideo}
                      className={cn(
                        "h-12 w-12 rounded-full p-0",
                        !isVideoEnabled ? "bg-primary hover:bg-primary text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      )}
                    >
                      <Video className="h-5 w-5" />
                    </Button>
                  )}
                  
                  <Button
                    onClick={endCall}
                    className="h-12 w-12 rounded-full bg-primary hover:bg-primary text-white p-0" transition-all duration-300
                    data-testid="end-call-button"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={endCall}
                  className="h-12 w-12 rounded-full bg-primary hover:bg-primary text-white p-0" transition-all duration-300
                  data-testid="end-call-button"
                >
                  <X className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Profile Preview Modal */}
      <Dialog open={profilePreviewOpen} onOpenChange={setProfilePreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {profilePreviewLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="ml-2 text-sm text-gray-500">Loading profile...</span>
            </div>
          ) : profilePreview ? (
            <div className="space-y-4">
              {/* Avatar and basic info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profilePreview.avatarUrl} />
                  <AvatarFallback className="bg-blue-500 text-white text-lg font-semibold">
                    {profilePreview.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{profilePreview.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{profilePreview.role}</p>
                  {profilePreview.pronouns && (
                    <p className="text-sm text-gray-400">{profilePreview.pronouns}</p>
                  )}
                </div>
              </div>

              {/* Profile details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {profilePreview.age && (
                  <div>
                    <label className="font-medium text-gray-700">Age</label>
                    <p className="text-gray-900">{profilePreview.age} years old</p>
                  </div>
                )}
                {profilePreview.grade && (
                  <div>
                    <label className="font-medium text-gray-700">Grade</label>
                    <p className="text-gray-900">Grade {profilePreview.grade}</p>
                  </div>
                )}
                {profilePreview.country && (
                  <div>
                    <label className="font-medium text-gray-700">Country</label>
                    <p className="text-gray-900">{profilePreview.country}</p>
                  </div>
                )}
                {profilePreview.educationLevel && (
                  <div>
                    <label className="font-medium text-gray-700">Education Level</label>
                    <p className="text-gray-900 capitalize">{profilePreview.educationLevel}</p>
                  </div>
                )}
              </div>

              {/* Join date */}
              {profilePreview.createdAt && (
                <div className="pt-2 border-t">
                  <label className="font-medium text-gray-700">Member Since</label>
                  <p className="text-gray-900">
                    {new Date(profilePreview.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {/* Bio */}
              {profilePreview.bio && (
                <div className="pt-2 border-t">
                  <label className="font-medium text-gray-700">About</label>
                  <p className="text-gray-900 text-sm leading-relaxed">{profilePreview.bio}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <p>Unable to load profile information</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={imageViewer.isOpen}
        onClose={() => setImageViewer(prev => ({ ...prev, isOpen: false }))}
        src={imageViewer.src}
        alt={imageViewer.alt}
        fileName={imageViewer.fileName}
      />
    </div>
  );
}
