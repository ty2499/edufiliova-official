import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  MessageSquare, 
  MoreVertical,
  Paperclip,
  Camera,
  Mic,
  MicOff,
  Play,
  Pause,
  MapPin,
  FileText,
  Image as ImageIcon,
  Download,
  Check,
  CheckCheck,
  ArrowLeft,
  Smile,
  X,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsAppSocket } from '@/hooks/useWhatsAppSocket';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface User {
  userId: string;
  name: string;
  role: string;
  pronouns?: string;
  avatarUrl?: string;
}

interface FileMetadata {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  thumbnail?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface EnhancedMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content?: string;
  messageType: 'text' | 'voice' | 'image' | 'video' | 'document' | 'location';
  fileMetadata?: FileMetadata;
  locationData?: LocationData;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  isRead: boolean;
  createdAt: string;
  senderName: string;
  senderAvatarUrl?: string;
}

interface Conversation {
  otherUserId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  otherUser: User;
}

interface FiliovaChatProps {
  userRole: 'student' | 'teacher' | 'admin';
}

export function FiliovaChat({ userRole }: FiliovaChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    isConnected, 
    sendTypingStart, 
    sendTypingStop, 
    sendRecordingStart,
    sendRecordingStop,
    isUserTyping, 
    isUserRecording,
    getUserPresence, 
    formatLastSeen 
  } = useWhatsAppSocket();
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Popular emojis for quick access - organized by categories
  const emojiCategories = {
    smileys: ['😊', '😂', '🤣', '😁', '😃', '😄', '😆', '😍', '🥰', '😘', '😗', '😙', '😚', '🤗', '🤔', '😎', '🤓', '🧐', '😏', '😌'],
    emotions: ['❤️', '💕', '💖', '💗', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💟', '♥️', '💯', '💢', '💥', '💫'],
    gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏'],
    celebrations: ['🎉', '🎊', '🥳', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🎆', '🎇', '✨', '🌟', '⭐', '💫', '🎯', '🏆', '🥇', '🎖️', '🏅'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🎮', '🕹️', '🎲', '🎯', '🎳', '🎪', '🎭', '🎨', '🎤'],
    food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒']
  };
  
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<keyof typeof emojiCategories>('smileys');

  // Get available contacts (friends for students)
  const { data: contactsData = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['messaging', 'contacts'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/messages/contacts', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    enabled: !!user,
    staleTime: 60000 // Contacts don't change often - fresh for 1 minute
  });

  // Use real contacts from API
  const contacts = contactsData;

  // Get conversations
  const { data: conversationsData = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['messaging', 'conversations'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    enabled: !!user,
    staleTime: 30000 // Conversations don't change too often - fresh for 30 seconds
  });

  // Use real conversations from API
  const conversations = conversationsData;

  // Get enhanced messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messaging', 'enhanced', selectedConversation],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/messages/enhanced/${selectedConversation}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    enabled: !!selectedConversation && !!user,
    refetchInterval: false, // Disabled polling - rely on WebSocket for real-time messaging
    staleTime: 30000 // Cache for 30 seconds
  });

  // Send text message mutation
  const sendTextMutation = useMutation({
    mutationFn: (data: { receiverId: string; content: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/messages', {
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
      queryClient.invalidateQueries({ queryKey: ['messaging', 'enhanced', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    }
  });

  // Send file message mutation
  const sendFileMutation = useMutation({
    mutationFn: (data: FormData) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/messages/file', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${sessionId}`
        },
        body: data
      });
    },
    onSuccess: () => {
      setIsUploading(false);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ['messaging', 'enhanced', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    }
  });

  // Send location message mutation
  const sendLocationMutation = useMutation({
    mutationFn: (data: { receiverId: string; latitude: number; longitude: number; address?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/messages/location', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'enhanced', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    }
  });

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/messages/conversation/${selectedConversation}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'enhanced', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    }
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    }
  });

  // Start voice recording
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
        // Send recording stop indicator
        if (selectedConversation) {
          sendRecordingStop(selectedConversation);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Send recording start indicator
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

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Send recording stop indicator
      if (selectedConversation) {
        sendRecordingStop(selectedConversation);
      }
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      // Send recording stop indicator when canceling
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
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice-message.webm');
    formData.append('receiverId', selectedConversation);
    formData.append('messageType', 'voice');
    formData.append('fileType', 'voice');
    
    setIsUploading(true);
    sendFileMutation.mutate(formData);
  };

  // Handle file upload
  const handleFileUpload = (files: FileList, fileType: string) => {
    if (!selectedConversation || files.length === 0) return;
    
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', selectedConversation);
    formData.append('fileType', fileType);
    
    setIsUploading(true);
    sendFileMutation.mutate(formData);
  };

  // Handle location sharing
  const shareLocation = () => {
    if (!selectedConversation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendLocationMutation.mutate({
          receiverId: selectedConversation,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle typing indicators - enhanced for faster response
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    if (!selectedConversation) return;
    
    // Send typing start immediately if they're typing
    if (value.trim() && !typingTimeoutRef.current) {
      sendTypingStart(selectedConversation);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator (faster)
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        if (selectedConversation) {
          sendTypingStop(selectedConversation);
        }
        typingTimeoutRef.current = null;
      }, 800); // Faster typing indicator timeout
    } else {
      // Stop typing immediately if input is empty
      sendTypingStop(selectedConversation);
      typingTimeoutRef.current = null;
    }
  };

  // Handle clearing chat
  const handleClearChat = async () => {
    if (!selectedConversation) return;
    
    // Prevent clearing admin conversation
    if (selectedConversation === 'a952bf87-64e9-453a-ae92-d97444e2d8ac') {
      alert('Admin conversations cannot be deleted for your safety and support history.');
      return;
    }
    
    const confirmed = window.confirm('Are you sure you want to clear this chat history? This action cannot be undone.');
    if (confirmed) {
      clearChatMutation.mutate();
    }
  };

  // Handle sending text message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    sendTypingStop(selectedConversation);

    sendTextMutation.mutate({
      receiverId: selectedConversation,
      content: newMessage.trim()
    });
  };

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get message status icon
  const getMessageStatusIcon = (message: EnhancedMessage) => {
    if (message.senderId !== user?.id) return null;
    
    if (message.readAt) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else if (message.deliveredAt) {
      return <CheckCheck className="h-3 w-3 text-gray-400" />;
    } else {
      return <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  // Render message content based on type
  const renderMessageContent = (message: EnhancedMessage) => {
    switch (message.messageType) {
      case 'text':
        return <p className="break-words">{message.content}</p>;
        
      case 'voice':
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setPlayingAudio(playingAudio === message.id ? null : message.id)}
            >
              {playingAudio === message.id ? 
                <Pause className="h-4 w-4" /> : 
                <Play className="h-4 w-4" />
              }
            </Button>
            <div className="flex-1 h-1 bg-white/20 rounded">
              <div className="h-full bg-white/60 rounded w-1/3"></div>
            </div>
            <span className="text-xs">{message.fileMetadata?.duration || '0:30'}</span>
          </div>
        );
        
      case 'image':
        return (
          <div className="relative">
            <img 
              src={message.fileMetadata?.url} 
              alt="Shared image"
              className="max-w-[250px] max-h-[250px] rounded-lg"
            />
            {message.content && (
              <p className="mt-2 break-words">{message.content}</p>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="relative">
            <video 
              src={message.fileMetadata?.url}
              controls
              className="max-w-[250px] max-h-[250px] rounded-lg"
            />
            {message.content && (
              <p className="mt-2 break-words">{message.content}</p>
            )}
          </div>
        );
        
      case 'document':
        return (
          <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg min-w-[200px]">
            <FileText className="h-8 w-8 text-blue-400" />
            <div className="flex-1">
              <p className="font-medium truncate">{message.fileMetadata?.fileName}</p>
              <p className="text-xs opacity-70">
                {message.fileMetadata?.fileSize ? 
                  `${(message.fileMetadata.fileSize / 1024 / 1024).toFixed(1)} MB` : 
                  'Document'
                }
              </p>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={() => window.open(message.fileMetadata?.url, '_blank')}
              data-testid="download-document"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
        
      case 'location':
        return (
          <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg min-w-[200px]">
            <MapPin className="h-8 w-8 text-red-400" />
            <div className="flex-1">
              <p className="font-medium">Location</p>
              <p className="text-xs opacity-70">
                {message.locationData?.address || 
                 `${message.locationData?.latitude.toFixed(4)}, ${message.locationData?.longitude.toFixed(4)}`}
              </p>
            </div>
          </div>
        );
        
      default:
        return <p className="break-words">{message.content}</p>;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (messages?.conversation) {
      const unreadMessages = messages.conversation.filter(
        (msg: EnhancedMessage) => msg.receiverId === user?.id && !msg.readAt
      );
      
      unreadMessages.forEach((msg: EnhancedMessage) => {
        markAsReadMutation.mutate(msg.id);
      });
    }
  }, [messages?.conversation, user?.id]);

  // Auto-select first conversation if available
  useEffect(() => {
    if (!selectedConversation && user && conversations.length > 0) {
      setSelectedConversation(conversations[0].otherUserId);
    }
  }, [user, conversations, selectedConversation]);

  const selectedUser = contacts.find((c: User) => c.userId === selectedConversation);

  return (
    <div className="flex h-[600px] bg-background border rounded-lg overflow-hidden" data-testid="filiova-chat">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b dark:bg-[#42fa76] text-black bg-[#ff5834]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[#ffffff]">EduFiliova Support</h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Online" />
                <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-white/80">Always here to help</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-[#ffffff]">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Conversations */}
          <div className="p-2">
            {conversations.map((conversation: Conversation) => (
              <div
                key={conversation.otherUserId}
                onClick={() => setSelectedConversation(conversation.otherUserId)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                  selectedConversation === conversation.otherUserId && "bg-gray-100 dark:bg-gray-800"
                )}
                data-testid={`conversation-${conversation.otherUserId}`}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.otherUser.avatarUrl} />
                  <AvatarFallback className="bg-gray-300">
                    {conversation.otherUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{conversation.otherUser.name}</p>
                    <span className="text-xs text-gray-500">
                      {formatMessageTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-[#25d366] h-5 min-w-[20px] text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b dark:bg-[#1f2937] text-white bg-[#ff5834]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/10 md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatarUrl} />
                    <AvatarFallback className="bg-gray-300 text-gray-700">
                      {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedUser.name}</h3>
                    <p className="text-sm opacity-75">
                      {isUserRecording(selectedConversation) ? (
                        <span className="text-red-400 flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          recording audio...
                        </span>
                      ) : isUserTyping(selectedConversation) ? (
                        <span className="text-[#25d366] flex items-center gap-1">
                          <div className="flex gap-1">
                            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          typing...
                        </span>
                      ) : (
                        getUserPresence(selectedConversation)?.status === 'online' ? 'online' :
                        formatLastSeen(getUserPresence(selectedConversation)?.lastSeen || new Date().toISOString())
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-white hover:bg-white/10"
                    onClick={handleClearChat}
                    data-testid="button-clear-chat-filiova"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 p-4 overflow-y-auto"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='grain' width='100' height='100' patternUnits='userSpaceOnUse'%3e%3ccircle cx='25' cy='25' r='1' fill='%23000' opacity='0.02'/%3e%3ccircle cx='75' cy='75' r='1' fill='%23000' opacity='0.02'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100' height='100' fill='url(%23grain)'/%3e%3c/svg%3e")`,
                backgroundColor: '#e5ddd5'
              }}
            >
              <div className="space-y-2">
                {messagesLoading ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages?.conversation?.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Start the conversation!</p>
                  </div>
                ) : (
                  messages?.conversation?.map((message: EnhancedMessage) => {
                    const isFromCurrentUser = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isFromCurrentUser ? "justify-end" : "justify-start"
                        )}
                        data-testid={`message-${message.id}`}
                      >
                        <div className={cn(
                          "max-w-sm px-3 py-2 rounded-lg shadow-sm",
                          isFromCurrentUser 
                            ? "bg-[#dcf8c6] text-gray-800 rounded-br-none" 
                            : "bg-white text-gray-800 rounded-bl-none"
                        )}>
                          {renderMessageContent(message)}
                          <div className={cn(
                            "flex items-center justify-end gap-1 mt-1"
                          )}>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(message.sentAt)}
                            </span>
                            {getMessageStatusIcon(message)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Uploading...</span>
                  <Progress value={uploadProgress} className="flex-1" />
                </div>
              </div>
            )}

            {/* Voice Recording UI */}
            {isRecording && (
              <div className="px-4 py-3 bg-[#075e54] text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>{formatRecordingTime(recordingTime)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/10"
                      onClick={cancelRecording}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/10"
                      onClick={stopRecording}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Message Input */}
            {!isRecording && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900">
                {/* Attachment Menu */}
                {showAttachMenu && (
                  <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant="ghost"
                        className="flex flex-col items-center gap-2 h-auto p-4"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowAttachMenu(false);
                        }}
                      >
                        <FileText className="h-6 w-6 text-blue-500" />
                        <span className="text-xs">Document</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex flex-col items-center gap-2 h-auto p-4"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) handleFileUpload(files, 'image');
                          };
                          input.click();
                          setShowAttachMenu(false);
                        }}
                      >
                        <ImageIcon className="h-6 w-6 text-pink-500" />
                        <span className="text-xs">Gallery</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex flex-col items-center gap-2 h-auto p-4"
                        onClick={() => {
                          shareLocation();
                          setShowAttachMenu(false);
                        }}
                      >
                        <MapPin className="h-6 w-6 text-green-500" />
                        <span className="text-xs">Location</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Enhanced Emoji Picker */}
                {showEmojiPicker && (
                  <div className="mb-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700" data-testid="emoji-picker">
                    {/* Category Tabs */}
                    <div className="flex gap-1 mb-3 overflow-x-auto">
                      {Object.keys(emojiCategories).map((category) => (
                        <Button
                          key={category}
                          variant={selectedEmojiCategory === category ? "default" : "ghost"}
                          size="sm"
                          className="px-3 py-1 text-xs font-medium whitespace-nowrap"
                          onClick={() => setSelectedEmojiCategory(category as keyof typeof emojiCategories)}
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Emoji Grid */}
                    <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                      {emojiCategories[selectedEmojiCategory].map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-lg transition-colors"
                          onClick={() => handleEmojiSelect(emoji)}
                          data-testid={`emoji-${emoji}`}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Quick Send Emoji Section */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 mb-2">Quick Send:</p>
                      <div className="flex gap-1">
                        {['👍', '❤️', '😂', '😊', '🎉'].map((emoji, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-lg"
                            onClick={() => {
                              if (!selectedConversation) return;
                              sendTextMutation.mutate({
                                receiverId: selectedConversation,
                                content: emoji
                              });
                              setShowEmojiPicker(false);
                            }}
                            data-testid={`quick-emoji-${emoji}`}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-sm">
                  {/* Left side buttons - Emoji and Attachment */}
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-full"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      data-testid="emoji-button"
                      title="Add emoji"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-full"
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      data-testid="attach-button"
                      title="Attach file"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Message input field */}
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Type a message..."
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm placeholder:text-gray-500"
                      disabled={sendTextMutation.isPending}
                      data-testid="input-message"
                    />
                  </div>
                  
                  {/* Right side - Send or Mic button */}
                  {newMessage.trim() ? (
                    <Button 
                      type="submit" 
                      size="sm"
                      className="h-9 w-9 p-0 rounded-full bg-[#25d366] hover:bg-[#128c7e] shadow-sm"
                      disabled={sendTextMutation.isPending}
                      data-testid="send-button"
                    >
                      <Send className="h-4 w-4 text-white" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-full bg-[#25d366] hover:bg-[#128c7e] shadow-sm"
                      onClick={startRecording}
                      data-testid="mic-button"
                      title="Record voice message"
                    >
                      <Mic className="h-4 w-4 text-white" />
                    </Button>
                  )}
                </form>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(e.target.files, 'document');
                    }
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium mb-2">WhatsApp Web</h3>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
