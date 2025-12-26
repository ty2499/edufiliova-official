import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  User, 
  ChevronLeft,
  Smile,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { useHelpChat } from '@/contexts/HelpChatContext';


interface SupportAgent {
  id: string;
  name: string;
  avatar: string;
  description: string;
}

interface HelpChatMessage {
  id: string;
  message: string;
  sender: 'visitor' | 'admin';
  timestamp: string;
  adminName?: string;
  adminAvatar?: string;
  isAutoMessage?: boolean;
  agentId?: string;
}

interface VisitorHelpChatProps {
  isAuthenticated?: boolean;
  alwaysVisible?: boolean; // Force visibility for specific user types like freelancers
  userRole?: string | null; // User role to determine visibility
}

// Generate unique guest ID for visitor session
const generateGuestId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `guest_${timestamp}_${randomStr}`;
};

// Get or create guest ID from localStorage
const getGuestId = (): string => {
  let guestId = localStorage.getItem('helpChatGuestId');
  if (!guestId) {
    guestId = generateGuestId();
    localStorage.setItem('helpChatGuestId', guestId);
  }
  return guestId;
};

// Support agents are now fetched from the database by the server
// No hardcoded agent data needed on client-side

// Get assigned agent for session - Server assigns, client persists for display
const getSessionAgent = (guestId: string): SupportAgent | null => {
  const savedAgentData = localStorage.getItem(`selectedAgentData_${guestId}`);
  if (savedAgentData) {
    try {
      const agent = JSON.parse(savedAgentData);
      console.log(`👨‍💼 Restored server-assigned agent: ${agent.name} for guest ${guestId}`);
      return agent;
    } catch {
      localStorage.removeItem(`selectedAgentData_${guestId}`);
    }
  }
  
  // No saved agent - server will assign one on first admin message
  console.log(`👨‍💼 No saved agent for guest ${guestId}, server will assign`);
  return null;
};

// Working hours check (8:00 AM - 11:00 PM local time)
const isWithinWorkingHours = (): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= 8 && currentHour < 23;
};

// Global audio context - initialized after user interaction
let globalAudioContext: AudioContext | null = null;

// Initialize audio context after user interaction
const initializeAudioContext = () => {
  if (!globalAudioContext) {
    try {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🔊 Audio context initialized');
    } catch (error) {
      console.error('🔊 Failed to create audio context:', error);
    }
  }
  return globalAudioContext;
};

// Enhanced sound effects - WhatsApp style send/receive + iPhone typing sounds
const playSound = (soundType: 'send' | 'receive' | 'typing' | 'join') => {
  try {
    const audioContext = globalAudioContext || initializeAudioContext();
    if (!audioContext) {
      console.log('🔊 Audio context not available');
      return;
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('🔊 Audio context resumed');
        // Retry playing the sound
        playSound(soundType);
      }).catch((error) => {
        console.error('🔊 Failed to resume audio context:', error);
      });
      return;
    }
    
    switch (soundType) {
      case 'send':
        // WhatsApp-style send sound: Quick "whoosh" with gentle frequency sweep
        const sendOsc = audioContext.createOscillator();
        const sendGain = audioContext.createGain();
        const sendFilter = audioContext.createBiquadFilter();
        
        sendOsc.connect(sendFilter);
        sendFilter.connect(sendGain);
        sendGain.connect(audioContext.destination);
        
        sendOsc.type = 'sine';
        sendFilter.type = 'lowpass';
        sendFilter.frequency.setValueAtTime(2000, audioContext.currentTime);
        sendFilter.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
        
        sendOsc.frequency.setValueAtTime(800, audioContext.currentTime);
        sendOsc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
        
        sendGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        sendGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        
        sendOsc.start(audioContext.currentTime);
        sendOsc.stop(audioContext.currentTime + 0.15);
        break;
        
      case 'receive':
        // WhatsApp-style receive sound: Two distinct tones with realistic timing
        const createReceiveTone = (frequency: number, startTime: number, duration: number) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const filter = audioContext.createBiquadFilter();
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.type = 'sine';
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(frequency * 2, audioContext.currentTime + startTime);
          
          osc.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
          gain.gain.setValueAtTime(0.06, audioContext.currentTime + startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
          
          osc.start(audioContext.currentTime + startTime);
          osc.stop(audioContext.currentTime + startTime + duration);
        };
        
        createReceiveTone(480, 0, 0.12);      // First tone
        createReceiveTone(640, 0.08, 0.12);   // Second tone, slightly overlapping
        break;
        
      case 'typing':
        // iPhone-style typing sound: Sharp, short click with realistic resonance
        const typeOsc = audioContext.createOscillator();
        const typeGain = audioContext.createGain();
        const typeFilter = audioContext.createBiquadFilter();
        
        typeOsc.connect(typeFilter);
        typeFilter.connect(typeGain);
        typeGain.connect(audioContext.destination);
        
        typeOsc.type = 'square';
        typeFilter.type = 'highpass';
        typeFilter.frequency.setValueAtTime(1200, audioContext.currentTime);
        
        typeOsc.frequency.setValueAtTime(1800, audioContext.currentTime);
        typeOsc.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.03);
        
        typeGain.gain.setValueAtTime(0.03, audioContext.currentTime);
        typeGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.03);
        
        typeOsc.start(audioContext.currentTime);
        typeOsc.stop(audioContext.currentTime + 0.03);
        break;
        
      case 'join':
        // Welcoming chime sequence - pleasant and professional
        const createJoinTone = (frequency: number, startTime: number, duration: number, volume: number) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
          gain.gain.setValueAtTime(volume, audioContext.currentTime + startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
          
          osc.start(audioContext.currentTime + startTime);
          osc.stop(audioContext.currentTime + startTime + duration);
        };
        
        createJoinTone(523, 0, 0.15, 0.08);      // C5
        createJoinTone(659, 0.12, 0.15, 0.06);   // E5
        createJoinTone(784, 0.24, 0.2, 0.08);    // G5
        break;
    }
  } catch (error) {
    // Log audio context errors for debugging
    console.error('🔊 Audio playback failed:', error);
    console.log('🔊 Audio context not available or user interaction required');
  }
};

export default function VisitorHelpChat({ isAuthenticated = false, alwaysVisible = false, userRole = null }: VisitorHelpChatProps) {
  const { isChatOpen: isOpen, setIsChatOpen: setIsOpen } = useHelpChat();
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [supportStatus, setSupportStatus] = useState<'online' | 'offline'>('offline');
  const [guestId] = useState(getGuestId);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Single agent state management
  const [assignedAgentId, setAssignedAgentId] = useState<string | null>(() => {
    return localStorage.getItem(`selectedAgent_${getGuestId()}`) || null;
  });
  
  const [currentAgent, setCurrentAgent] = useState<SupportAgent | null>(() => getSessionAgent(getGuestId()));
  const [hasReceivedWelcome, setHasReceivedWelcome] = useState(false);
  const [isWithinHours, setIsWithinHours] = useState(isWithinWorkingHours());
  const [userTyping, setUserTyping] = useState(false);
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(() => {
    return !!localStorage.getItem(`firstMessageSent_${getGuestId()}`);
  });
  const [afterHoursName, setAfterHoursName] = useState('');
  const [afterHoursEmail, setAfterHoursEmail] = useState('');
  const [hasSubmittedAfterHoursInfo, setHasSubmittedAfterHoursInfo] = useState(() => {
    return !!localStorage.getItem(`afterHoursSubmitted_${getGuestId()}`);
  });
  const [showAfterHoursBanner, setShowAfterHoursBanner] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAssignedAgent = useRef<boolean>(!!assignedAgentId);

  // Fetch active support agents to display in team header
  const { data: supportAgents = [] } = useQuery({
    queryKey: ['support-agents', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/support-agents/active');
      if (!response.ok) {
        console.warn('Failed to fetch support agents:', response.status);
        return []; // Return empty array if fetch fails
      }
      const data = await response.json();
      // Return first 5 agents for display (they're already filtered to active and sorted - customer_service first)
      return (data.data || []).slice(0, 5);
    },
    staleTime: 300000, // 5 minutes
    refetchOnMount: false
  });
  
  // Idle management state
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());
  const [idleReminderSent, setIdleReminderSent] = useState(false);
  const [chatClosed, setChatClosed] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isMobile = useIsMobile();

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  // Check working hours every minute
  useEffect(() => {
    const hoursTimer = setInterval(() => {
      setIsWithinHours(isWithinWorkingHours());
    }, 60000); // Check every minute

    return () => clearInterval(hoursTimer);
  }, []);

  // Auto-hide after-hours banner after 10 seconds
  useEffect(() => {
    if (!isWithinHours && showAfterHoursBanner) {
      const timer = setTimeout(() => {
        setShowAfterHoursBanner(false);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isWithinHours, showAfterHoursBanner]);



  // Welcome messages are now handled by the server when an agent joins
  // No client-side hardcoded welcome message needed

  // Idle management functions
  const resetIdleTimer = () => {
    setLastActivityTime(new Date());
    setIdleReminderSent(false);
    
    // Clear existing timers
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    
    // Set 5-minute idle timer
    idleTimerRef.current = setTimeout(() => {
      sendIdleReminder();
    }, 5 * 60 * 1000); // 5 minutes
  };

  const sendIdleReminder = () => {
    if (idleReminderSent || chatClosed) return;
    
    const reminderMessage: HelpChatMessage = {
      id: `idle_reminder_${Date.now()}`,
      message: "Are you still there? We haven't heard from you in a few minutes.",
      sender: 'admin',
      timestamp: new Date().toISOString(),
      isAutoMessage: true
    };
    
    setMessages(prev => [...prev, reminderMessage]);
    setIdleReminderSent(true);
    playSound('receive');
    
    // Set auto-close timer for 1 minute after reminder
    autoCloseTimerRef.current = setTimeout(() => {
      autoCloseChat();
    }, 1 * 60 * 1000); // 1 minute after reminder
  };

  const autoCloseChat = () => {
    if (chatClosed) return;
    
    const closeMessage: HelpChatMessage = {
      id: `auto_close_${Date.now()}`,
      message: "This chat has been closed due to inactivity. If you still need help, start a new chat or leave a message — we'll get back to you.",
      sender: 'admin',
      timestamp: new Date().toISOString(),
      isAutoMessage: true
    };
    
    setMessages(prev => [...prev, closeMessage]);
    setChatClosed(true);
    playSound('receive');
    
    // Close chat after showing the message for 3 seconds
    setTimeout(() => {
      setIsOpen(false);
    }, 3000);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // WebSocket connection for real-time messaging
  useEffect(() => {
    if (!isOpen) return;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:5000';
        const wsUrl = `${protocol}//${host}/ws`;
        
        // Validate URL before creating WebSocket
        if (!host || host.includes('undefined') || host === 'localhost:5000') {
          console.log('⚠️ Invalid host for WebSocket connection, skipping...');
          return;
        }
        
        try {
          wsRef.current = new WebSocket(wsUrl);
        } catch (wsError) {
          console.log('⚠️ WebSocket connection skipped:', wsError);
          return;
        }

        wsRef.current.onopen = () => {
          console.log('🔌 Help Chat WebSocket connected');
          setIsConnected(true);
          
          // Authenticate as visitor
          wsRef.current?.send(JSON.stringify({
            type: 'help_chat_auth',
            guestId: guestId,
            isVisitor: true
          }));
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'help_chat_auth_success':
                console.log('✅ Help Chat authenticated');
                setSupportStatus('online');
                break;
                
              case 'help_chat_message':
                const newMsg: HelpChatMessage = {
                  id: data.id || Date.now().toString(),
                  message: data.message,
                  sender: data.sender,
                  timestamp: data.timestamp || new Date().toISOString(),
                  adminName: data.adminName,
                  adminAvatar: data.adminAvatar,
                  agentId: data.agentId // Include agent ID for avatar mapping
                };
                setMessages(prev => [...prev, newMsg]);
                
                // Handle agent details from server - NO CLIENT-SIDE ASSIGNMENT
                if (data.sender === 'admin') {
                  const isJoinMessage = data.message?.includes('joined the chat');
                  
                  // Use server-provided agent details for header/avatar
                  if (data.adminName && data.agentId) {
                    const serverAgent = {
                      id: data.agentId,
                      name: data.adminName,
                      avatar: data.adminAvatar || data.adminName.split(' ').map((n: string) => n[0]).join(''),
                      description: 'Support Agent' // Add required description field
                    };
                    
                    // Update current agent only if not already set or different
                    if (!currentAgent || currentAgent.id !== serverAgent.id) {
                      setCurrentAgent(serverAgent);
                      setAssignedAgentId(serverAgent.id);
                      hasAssignedAgent.current = true;
                      
                      // Persist server-assigned agent for display consistency
                      localStorage.setItem(`selectedAgent_${guestId}`, serverAgent.id);
                      localStorage.setItem(`selectedAgentData_${guestId}`, JSON.stringify(serverAgent));
                      
                      console.log(`👨‍💼 Server-assigned agent: ${serverAgent.name}`);
                    }
                  }
                  
                  // Play appropriate sounds
                  if (isJoinMessage) {
                    playSound('join');
                  } else {
                    playSound('receive');
                  }
                }
                
                // Reset idle timer on any admin message (unless auto message)
                if (data.sender === 'admin' && !data.isAutoMessage) {
                  resetIdleTimer();
                }
                break;
                
              case 'help_chat_typing':
                if (data.sender === 'admin') {
                  setIsTyping(data.isTyping);
                  if (data.isTyping) {
                    playSound('typing');
                  }
                }
                break;
                
              case 'support_status':
                setSupportStatus(data.status);
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('❌ Help Chat WebSocket disconnected');
          setIsConnected(false);
          setSupportStatus('offline');
          
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isOpen) {
              connectWebSocket();
            }
          }, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, guestId]);

  // Load chat history when opening
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
      // Check if welcome message was already received
      const welcomeReceived = localStorage.getItem(`welcomeReceived_${guestId}`);
      const selectedAgentId = localStorage.getItem(`selectedAgent_${guestId}`);
      
      setHasReceivedWelcome(!!welcomeReceived);
      
      // Restore the selected agent if available (server-assigned agents are persisted in localStorage)
      if (selectedAgentId) {
        const savedAgentData = localStorage.getItem(`selectedAgentData_${guestId}`);
        if (savedAgentData) {
          try {
            const savedAgent = JSON.parse(savedAgentData);
            setCurrentAgent(savedAgent);
            setAssignedAgentId(selectedAgentId);
          } catch (error) {
            console.error('Error parsing saved agent data:', error);
            localStorage.removeItem(`selectedAgentData_${guestId}`);
          }
        }
      }
      
      // Initialize idle timer when chat opens
      resetIdleTimer();
    }
    
    // Clean up timers when chat closes
    if (!isOpen) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      // Reset idle states when chat closes
      setIdleReminderSent(false);
      setChatClosed(false);
    }
  }, [isOpen, guestId]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/help-chat/messages/${guestId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // Handle typing indicators
  const sendTypingIndicator = (isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'help_chat_typing',
        guestId: guestId,
        isTyping: isTyping,
        sender: 'visitor'
      }));
    }
  };

  // Handle user typing state
  const handleTyping = () => {
    if (!userTyping) {
      setUserTyping(true);
      sendTypingIndicator(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setUserTyping(false);
      sendTypingIndicator(false);
    }, 2000); // Stop typing after 2 seconds of inactivity
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');
    
    // Stop typing indicator when sending
    if (userTyping) {
      setUserTyping(false);
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Add message to local state immediately for instant feedback
    const tempMessage: HelpChatMessage = {
      id: Date.now().toString(),
      message: messageToSend,
      sender: 'visitor',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    // Send auto-reply on first message during working hours
    if (!hasSentFirstMessage && isWithinHours) {
      setHasSentFirstMessage(true);
      localStorage.setItem(`firstMessageSent_${guestId}`, 'true');
      
      // Add auto-reply message
      setTimeout(() => {
        const autoReplyMessage: HelpChatMessage = {
          id: `auto_reply_${Date.now()}`,
          message: "Thanks — a support agent will join you shortly. Please describe your issue while you wait.",
          sender: 'admin',
          timestamp: new Date().toISOString(),
          isAutoMessage: true
        };
        setMessages(prev => [...prev, autoReplyMessage]);
        playSound('receive');
      }, 1000);
    }
    
    // Reset idle timer on user message
    resetIdleTimer();
    
    // Play send sound
    playSound('send');

    // Send via WebSocket if available, otherwise fall back to HTTP
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'help_chat_send_message',
        guestId: guestId,
        message: messageToSend,
        sender: 'visitor'
      }));
    } else {
      // HTTP fallback only when WebSocket is unavailable
      try {
        await fetch('/api/help-chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            guestId: guestId,
            message: messageToSend,
            sender: 'visitor'
          })
        });
      } catch (error) {
        console.error('Failed to send message via HTTP fallback:', error);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAfterHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!afterHoursName.trim() || !afterHoursEmail.trim()) {
      return;
    }

    // Send the contact info to the chat thread
    const contactInfoMessage = `📋 Contact Information:\nName: ${afterHoursName}\nEmail: ${afterHoursEmail}`;
    
    // Add to local messages
    const infoMessage: HelpChatMessage = {
      id: `contact_info_${Date.now()}`,
      message: contactInfoMessage,
      sender: 'visitor',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, infoMessage]);

    // Send via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'help_chat_send_message',
        guestId: guestId,
        message: contactInfoMessage,
        sender: 'visitor'
      }));
    }

    // Mark as submitted
    setHasSubmittedAfterHoursInfo(true);
    localStorage.setItem(`afterHoursSubmitted_${guestId}`, 'true');
    
    // Clear form
    setAfterHoursName('');
    setAfterHoursEmail('');
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Don't show for authenticated users (they have regular chat) 
  // But allow showing for testing purposes with a query parameter in development
  // Also always show if alwaysVisible prop is true (for special cases)
  // Hide for freelancers, teachers, students, and staff (admin, customer service, moderator)
  const isDev = import.meta.env.DEV;
  const hasTestingOverride = isDev && new URLSearchParams(window.location.search).has('showHelpChat');
  const shouldHideForAuth = isAuthenticated && !hasTestingOverride && !alwaysVisible;
  const shouldHideForRole = userRole && ['freelancer', 'teacher', 'student', 'admin', 'customer_service', 'moderator'].includes(userRole);
  
  if (shouldHideForAuth || shouldHideForRole) {
    return null;
  }


  return (
    <>
      {/* Floating Chat Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Button
              onClick={() => {
                setIsOpen(true);
                // Initialize audio context on first user interaction
                initializeAudioContext();
              }}
              className="h-14 w-14 md:h-16 md:w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 relative transition-all duration-300"
              style={{ backgroundColor: '#0C332C' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a0fab2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0C332C'}
              data-testid="help-chat-bubble"
              aria-label="Open help chat"
            >
              <MessageCircle className="h-10 w-10 md:h-16 md:w-16" style={{ color: '#ffffff' }} />
              {!isWithinHours && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <Clock className="h-2 w-2 text-white" />
                </div>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Chat Widget Window - Desktop/Tablet vs Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, x: isMobile ? '100%' : 0, y: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, x: isMobile ? '100%' : 0, y: isMobile ? 0 : 20 }}
            className={cn(
              "fixed flex flex-col shadow-xl border border-gray-200",
              isMobile 
                ? "inset-0 bg-white z-[9999] overflow-hidden" 
                : "bg-white bottom-4 right-4 w-72 h-[420px] rounded-2xl z-30"
            )}
            style={{ fontFamily: 'Satoshi, sans-serif' }}
            data-testid="help-chat-window"
          >
            <div className="flex flex-col h-full">
              {/* Chat Header - Responsive Design */}
              <div className={cn(
                "flex items-center justify-between border-b border-gray-100 flex-shrink-0",
                isMobile ? "p-4" : "p-3 rounded-t-2xl"
              )} style={{ backgroundColor: '#0C332C' }}>
                <div className="flex items-center gap-3 flex-1">
                  {isMobile && (
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="p-2 mr-3 hover:bg-white/10 rounded-full transition-colors transition-all duration-300"
                      data-testid="back-to-contacts"
                    >
                      <ChevronLeft className="h-6 w-6 text-white stroke-[2]" />
                    </button>
                  )}
                  
                  {/* Assigned Agent Display */}
                  <div className="flex items-center gap-3">
                    {/* Show assigned agent or team avatars if no agent assigned */}
                    {assignedAgentId ? (
                      // Single assigned agent
                      <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10 border-2 border-white" data-testid="img-agent-primary">
                          <AvatarImage src={
                            supportAgents.find((agent: any) => agent.id.toString() === currentAgent?.id)?.avatarUrl || 
                            currentAgent?.avatar
                          } className="rounded-full" />
                          <AvatarFallback className="bg-blue-500 text-white text-sm font-bold">
                            {currentAgent?.name?.split(' ').map((n: string) => n.charAt(0)).join('') || 'SA'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }} data-testid="text-agent-name">
                            {currentAgent?.name || 'Support Agent'}
                          </h3>
                          <p className="text-xs text-white/80">
                            {isConnected && supportStatus === 'online' ? 'Support Agent' : 'Connecting...'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Team avatars before agent assignment  
                      <>
                        <div className="flex -space-x-2">
                          {supportAgents.slice(0, 5).map((agent: any, index: number) => (
                            <Avatar key={agent.id} className="h-8 w-8 border-2 border-white">
                              {agent.avatarUrl ? (
                                <AvatarImage src={agent.avatarUrl} className="rounded-full" />
                              ) : null}
                              <AvatarFallback className={cn(
                                "text-white text-xs font-bold",
                                index === 0 && "bg-pink-400",
                                index === 1 && "bg-green-400", 
                                index === 2 && "bg-blue-400",
                                index === 3 && "bg-purple-400",
                                index === 4 && "bg-orange-400"
                              )}>
                                {agent.name?.split(' ').map((n: string) => n.charAt(0)).join('').slice(0, 2) || 'SA'}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {/* Show placeholder avatars if less than 5 real agents */}
                          {supportAgents.length < 5 && Array.from({ length: 5 - supportAgents.length }).map((_, index) => (
                            <Avatar key={`placeholder-${index}`} className="h-8 w-8 border-2 border-white">
                              <AvatarFallback className="bg-gray-400 text-white text-xs font-bold">SA</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            Support Team
                          </h3>
                          <p className="text-xs text-white/80">
                            {isConnected && supportStatus === 'online' ? 'Good day! We\'re here to help you.' : 'Connecting...'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors transition-all duration-300"
                      data-testid="close-chat"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Area - Responsive Sizing */}
              <div 
                className={cn(
                  "flex-1 overflow-y-auto scrollbar-hide bg-white"
                )}
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  paddingBottom: '16px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <div className={cn(isMobile ? "px-6 py-4" : "px-4 py-3")}>
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        Welcome to Support Chat
                      </h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        How can we help you today? Our support team is here to assist you with any questions or issues.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isFromCurrentUser = message.sender === 'visitor';
                      return (
                        <div key={message.id} className={cn(
                          "flex items-end gap-2 mb-4",
                          isFromCurrentUser ? "justify-end" : "justify-start"
                        )}>
                          {/* Sender's Avatar - Left Side (Dual Agent Support) */}
                          {!isFromCurrentUser && (
                            <Avatar className="h-10 w-10 flex-shrink-0 rounded-full mb-1" data-testid={`img-msg-agent-${message.id}`}>
                              <AvatarImage src={
                                message.adminAvatar ||
                                supportAgents.find((agent: any) => agent.id.toString() === message.agentId)?.avatarUrl || 
                                currentAgent?.avatar
                              } className="rounded-full" />
                              <AvatarFallback className={cn(
                                "text-white text-lg font-bold flex items-center justify-center h-full w-full",
                                message.agentId === '1' ? "bg-pink-400" :
                                message.agentId === '2' ? "bg-green-400" :
                                message.agentId === '3' ? "bg-blue-400" :
                                message.agentId === '4' ? "bg-purple-400" :
                                message.agentId === '5' ? "bg-orange-400" :
                                // Fallback to current agent if no agentId specified
                                currentAgent ? "bg-blue-500" : "bg-gray-400"
                              )}>
                                {/* Show initials derived from name */}
                                {(message.adminName ? message.adminName.split(' ').map((n: string) => n[0]).join('') : null) ||
                                 (currentAgent?.name.split(' ').map((n: string) => n[0]).join('') || 'A')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          {/* Message Bubble */}
                          <div className={cn(
                            "max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-[25px] px-4 py-3 relative transition-all duration-200",
                            isFromCurrentUser 
                              ? "text-white" 
                              : "bg-white text-black"
                          )} style={isFromCurrentUser ? { backgroundColor: '#0C332C' } : {}}>
                            <div className="space-y-1">
                              {/* Text Content */}
                              <p className="text-[15px] leading-[20px] whitespace-pre-wrap break-words" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                {message.message}
                              </p>
                            </div>
                            
                            {/* Message Time and Delivery Status */}
                            <div className={cn(
                              "flex items-center gap-1 mt-1 px-2",
                              isFromCurrentUser ? "justify-end" : "justify-start"
                            )}>
                              <span className={cn(
                                "text-xs",
                                isFromCurrentUser ? "text-white/80" : "text-gray-500"
                              )}>
                                {formatMessageTime(message.timestamp)}
                              </span>
                              
                              {/* Delivery Status - Only for outgoing messages */}
                              {isFromCurrentUser && (
                                <div className="flex items-center">
                                  <Check className="h-3 w-3 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Sender's Avatar - Right Side */}
                          {isFromCurrentUser && (
                            <Avatar className="h-10 w-10 flex-shrink-0 rounded-full mb-1">
                              <AvatarFallback className="bg-[#f64e3c] text-white text-lg font-bold flex items-center justify-center h-full w-full" style={{backgroundColor: '#f64e3c', color: '#FFFFFF'}}>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })
                  )}
                  
                  {/* Typing indicator (Dual Agent Support) */}
                  {isTyping && (
                    <div className="flex items-end gap-2 mb-4">
                      <Avatar className="h-10 w-10 flex-shrink-0 rounded-full mb-1">
                        <AvatarImage src={
                          supportAgents.find((agent: any) => agent.id.toString() === currentAgent?.id)?.avatarUrl || 
                          currentAgent?.avatar
                        } className="rounded-full" />
                        <AvatarFallback className={cn(
                          "text-white text-lg font-bold flex items-center justify-center h-full w-full",
                          currentAgent?.id === '1' ? "bg-pink-400" :
                          currentAgent?.id === '2' ? "bg-green-400" :
                          currentAgent?.id === '3' ? "bg-blue-400" :
                          currentAgent?.id === '4' ? "bg-purple-400" :
                          currentAgent?.id === '5' ? "bg-orange-400" :
                          "bg-gray-400"
                        )}>
                          {currentAgent?.avatar && typeof currentAgent.avatar === 'string' && currentAgent.avatar.length <= 3 ? 
                            currentAgent.avatar : 
                            currentAgent?.name.split(' ').map((n: string) => n.charAt(0)).join('') || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-white rounded-[25px] px-4 py-3 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span className="text-xs text-gray-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {currentAgent ? `${currentAgent.name} is typing...` : 'Agent is typing...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input - Responsive Bottom */}
              <div className={cn(
                "border-t border-gray-100 bg-white flex-shrink-0",
                isMobile ? "px-3 sm:px-6 py-3 sm:py-4" : "px-3 py-3 rounded-b-2xl"
              )}>
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="mb-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="grid grid-cols-8 gap-1">
                      {popularEmojis.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg text-base transition-all transition-all duration-300"
                          onClick={() => handleEmojiSelect(emoji)}
                          data-testid={`emoji-${index}`}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* After-Hours Form */}
                {!isWithinHours && !hasSubmittedAfterHoursInfo && (
                  <div className="mb-3">
                    {/* After-hours banner - auto-hides after 10 seconds */}
                    {showAfterHoursBanner && (
                      <div className="mb-3 p-3 bg-primary/10 border border-orange-200 rounded-xl">
                        <p className="text-sm text-primary" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                          Support is currently offline. We will take time to respond — our team will reply shortly.
                        </p>
                      </div>
                    )}
                    
                    {/* After-hours contact form */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-800 mb-3" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        You've contacted us after hours. Our team may take some time to reply, but support will respond as soon as they see your message.
                        In case your chat gets disconnected, please enter your name and email below.
                      </p>
                      
                      <form onSubmit={handleAfterHoursSubmit} className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Your Name"
                          value={afterHoursName}
                          onChange={(e) => setAfterHoursName(e.target.value)}
                          className="text-sm"
                          data-testid="input-after-hours-name"
                          required
                        />
                        <Input
                          type="email"
                          placeholder="Your Email"
                          value={afterHoursEmail}
                          onChange={(e) => setAfterHoursEmail(e.target.value)}
                          className="text-sm"
                          data-testid="input-after-hours-email"
                          required
                        />
                        <Button
                          type="submit"
                          className="w-full text-white"
                          style={{ backgroundColor: '#0C332C' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a0fab2'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0C332C'}
                          data-testid="button-submit-after-hours"
                        >
                          Submit
                        </Button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Message Input Form */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">

                  {/* Main input container */}
                  <div className="flex-1 flex items-center bg-white rounded-full border border-gray-300 px-4 py-2 min-h-[40px]">
                    {/* Text input */}
                    <input
                      type="text"
                      placeholder={isConnected ? "Type your message..." : "Type your message (offline mode)..."}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newMessage.trim()) {
                            handleSendMessage(e);
                          }
                        }
                      }}
                      className="flex-1 bg-transparent border-0 focus:outline-none text-sm placeholder:text-gray-500"
                      style={{ fontFamily: 'Satoshi, sans-serif' }}
                      data-testid="message-input"
                    />
                  </div>

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={cn(
                      "h-10 w-10 p-0 rounded-full flex-shrink-0 flex items-center justify-center transition-colors shadow-sm",
                      newMessage.trim() 
                        ? "text-white" 
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                    style={newMessage.trim() ? { backgroundColor: '#0C332C' } : {}}
                    onMouseEnter={(e) => {
                      if (newMessage.trim()) e.currentTarget.style.backgroundColor = '#a0fab2';
                    }}
                    onMouseLeave={(e) => {
                      if (newMessage.trim()) e.currentTarget.style.backgroundColor = '#0C332C';
                    }}
                    data-testid="send-button"
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
