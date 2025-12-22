import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth, getSessionId } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface TypingIndicator {
  userId: string;
  isTyping: boolean;
}

interface RecordingIndicator {
  userId: string;
  isRecording: boolean;
}

interface PresenceStatus {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  isOnline?: boolean;
}

export function useWhatsAppSocket() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const [recordingUsers, setRecordingUsers] = useState<Map<string, boolean>>(new Map());
  const [userPresence, setUserPresence] = useState<Map<string, PresenceStatus>>(new Map());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const recordingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Call event handlers
  const [callEventHandlers, setCallEventHandlers] = useState<{
    onCallOffer?: (data: any) => void;
    onCallAnswer?: (data: any) => void;
    onCallIceCandidate?: (data: any) => void;
    onCallEnd?: (data: any) => void;
  }>({});

  // Instant query invalidation for real-time messaging - NO DEBOUNCING
  const invalidateMessagingQueries = useCallback(() => {
    // Invalidate immediately for instant message delivery
    queryClient.invalidateQueries({ queryKey: ['messaging'] });
    queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    queryClient.invalidateQueries({ queryKey: ['messaging', 'unified-conversations'] });
    queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
  }, [queryClient]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.userId || !profile) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const wsUrl = `${protocol}//${hostname}${port}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('🔌 WhatsApp WebSocket connected, authenticating...');
      console.log('🔌 User data:', { userId: user.userId });
      setIsConnected(true);
      
      // Authenticate user with sessionId for PWA support
      const sessionId = getSessionId();
      wsRef.current?.send(JSON.stringify({
        type: 'auth',
        userId: user.userId, // Use the text ID like HJOR2AC54I
        role: profile.role || 'student', // Use actual user role
        sessionId: sessionId // Include sessionId for PWA where cookies may be blocked
      }));
      
      // Store WebSocket connection globally for MessagingInterface
      (window as any).ws = wsRef.current;
      
      // Send initial presence update
      wsRef.current?.send(JSON.stringify({
        type: 'presence_update',
        status: 'online'
      }));
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'auth_success':
            console.log('✅ WhatsApp authentication successful');
            invalidateMessagingQueries();
            break;
            
          case 'new_message':
            console.log('📨 Received new message via WebSocket - instant update');
            // Instantly refresh queries for real-time feel
            invalidateMessagingQueries();
            break;
            
          case 'message_sent':
            console.log('✅ Message sent confirmed via WebSocket - instant update');
            // Instantly refresh queries
            invalidateMessagingQueries();
            break;
            
          case 'user_typing':
            handleTypingIndicator(data.data);
            break;
            
          case 'user_recording':
            handleRecordingIndicator(data.data);
            break;
            
          case 'presence_update':
            handlePresenceUpdate(data.data);
            break;
            
          case 'appointment_approved':
            console.log('📅 Appointment approved:', data.data);
            // Invalidate appointments query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            // Show notification to user
            alert(data.data.message);
            break;
            
          case 'appointment_status_update':
            console.log('📅 Appointment status updated:', data.data);
            // Invalidate appointments query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            // Show notification to user
            alert(data.data.message);
            break;
            
          case 'message_error':
            console.error('Message error:', data.message);
            // Don't show alert for file upload errors since HTTP API handles files
            // Only log for debugging purposes
            break;
            
          case 'error':
            console.error('WebSocket error:', data.message);
            break;
          
          case 'call_offer':
            console.log('📞 Incoming call offer from:', data.senderId);
            if (callEventHandlers.onCallOffer) {
              callEventHandlers.onCallOffer(data);
            }
            break;
            
          case 'call_answer':
            console.log('📞 Call answer from:', data.senderId);
            if (callEventHandlers.onCallAnswer) {
              callEventHandlers.onCallAnswer(data);
            }
            break;
            
          case 'call_ice_candidate':
            console.log('📞 ICE candidate from:', data.senderId);
            if (callEventHandlers.onCallIceCandidate) {
              callEventHandlers.onCallIceCandidate(data);
            }
            break;
            
          case 'call_end':
            console.log('📞 Call ended by:', data.senderId);
            if (callEventHandlers.onCallEnd) {
              callEventHandlers.onCallEnd(data);
            }
            break;
            
          case 'call_error':
            console.error('Call error:', data.message);
            // Handle call errors (receiver not available, etc.)
            break;
            
          default:
            console.log('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = () => {
      console.log('WhatsApp WebSocket disconnected');
      setIsConnected(false);
    };

    wsRef.current.onerror = (error) => {
      console.error('🔌 WhatsApp WebSocket error:', error);
      console.log('🔌 WebSocket state:', wsRef.current?.readyState);
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Clear all typing and recording timeouts
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      recordingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [user?.userId, profile?.role, queryClient]);

  // Handle typing indicator
  const handleTypingIndicator = (data: TypingIndicator) => {
    setTypingUsers(prev => {
      const newMap = new Map(prev);
      newMap.set(data.userId, data.isTyping);
      
      // Clear existing timeout for this user
      const existingTimeout = typingTimeoutRef.current.get(data.userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // If user is typing, set a timeout to clear it
      if (data.isTyping) {
        const timeout = setTimeout(() => {
          setTypingUsers(current => {
            const updated = new Map(current);
            updated.set(data.userId, false);
            return updated;
          });
        }, 2000); // Clear typing indicator after 2 seconds (faster)
        
        typingTimeoutRef.current.set(data.userId, timeout);
      } else {
        typingTimeoutRef.current.delete(data.userId);
      }
      
      return newMap;
    });
  };

  // Handle recording indicator
  const handleRecordingIndicator = (data: RecordingIndicator) => {
    setRecordingUsers(prev => {
      const newMap = new Map(prev);
      newMap.set(data.userId, data.isRecording);
      
      // Clear existing timeout for this user
      const existingTimeout = recordingTimeoutRef.current.get(data.userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // If user is recording, set a timeout to clear it (in case they disconnect)
      if (data.isRecording) {
        const timeout = setTimeout(() => {
          setRecordingUsers(current => {
            const updated = new Map(current);
            updated.set(data.userId, false);
            return updated;
          });
        }, 60000); // Clear recording indicator after 60 seconds
        
        recordingTimeoutRef.current.set(data.userId, timeout);
      } else {
        recordingTimeoutRef.current.delete(data.userId);
      }
      
      return newMap;
    });
  };

  // Handle presence update
  const handlePresenceUpdate = (data: PresenceStatus) => {
    setUserPresence(prev => {
      const newMap = new Map(prev);
      newMap.set(data.userId, data);
      return newMap;
    });
  };

  // Send typing start indicator
  const sendTypingStart = (receiverId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing_start',
        receiverId
      }));
    }
  };

  // Send typing stop indicator
  const sendTypingStop = (receiverId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing_stop',
        receiverId
      }));
    }
  };

  // Send recording start indicator
  const sendRecordingStart = (receiverId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'recording_start',
        receiverId
      }));
    }
  };

  // Send recording stop indicator
  const sendRecordingStop = (receiverId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'recording_stop',
        receiverId
      }));
    }
  };

  // Update presence status
  const updatePresence = (status: 'online' | 'away' | 'offline') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'presence_update',
        status
      }));
    }
  };

  // Check if user is typing
  const isUserTyping = (userId: string): boolean => {
    return typingUsers.get(userId) || false;
  };

  // Check if user is recording
  const isUserRecording = (userId: string): boolean => {
    return recordingUsers.get(userId) || false;
  };

  // Get user presence status
  const getUserPresence = (userId: string): PresenceStatus | null => {
    return userPresence.get(userId) || null;
  };

  // Format last seen time
  const formatLastSeen = (lastSeen: string): string => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'online';
    } else if (diffInMinutes < 60) {
      return `last seen ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `last seen ${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Call handling functions
  const setCallHandlers = (handlers: {
    onCallOffer?: (data: any) => void;
    onCallAnswer?: (data: any) => void;
    onCallIceCandidate?: (data: any) => void;
    onCallEnd?: (data: any) => void;
  }) => {
    setCallEventHandlers(handlers);
  };
  
  // Send call offer
  const sendCallOffer = (receiverId: string, callType: 'voice' | 'video', offer: RTCSessionDescriptionInit) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_offer',
        receiverId,
        callType,
        offer
      }));
    }
  };
  
  // Send call answer
  const sendCallAnswer = (receiverId: string, answer: RTCSessionDescriptionInit) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_answer',
        receiverId,
        answer
      }));
    }
  };
  
  // Send ICE candidate
  const sendIceCandidate = (receiverId: string, candidate: RTCIceCandidate) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_ice_candidate',
        receiverId,
        candidate
      }));
    }
  };
  
  // Send call end
  const sendCallEnd = (receiverId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_end',
        receiverId
      }));
    }
  };

  return {
    isConnected,
    wsRef,
    sendTypingStart,
    sendTypingStop,
    sendRecordingStart,
    sendRecordingStop,
    updatePresence,
    isUserTyping,
    isUserRecording,
    getUserPresence,
    formatLastSeen,
    // Call functions
    setCallHandlers,
    sendCallOffer,
    sendCallAnswer,
    sendIceCandidate,
    sendCallEnd
  };
}
