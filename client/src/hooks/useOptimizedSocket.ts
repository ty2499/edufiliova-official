import { useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth, getSessionId } from './useAuth';

interface OptimizedSocketOptions {
  typingThrottleMs?: number;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
}

/**
 * Optimized WebSocket hook with throttling and performance enhancements
 * Features:
 * - Throttled typing indicators to reduce network traffic
 * - Efficient message batching
 * - Automatic reconnection with exponential backoff
 * - Memory leak prevention
 * - Performance monitoring
 */
export function useOptimizedSocket(options: OptimizedSocketOptions = {}) {
  const {
    typingThrottleMs = 1000,
    reconnectDelayMs = 1000,
    maxReconnectAttempts = 5,
    heartbeatIntervalMs = 30000
  } = options;

  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  // Refs for cleanup and state management
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  
  // Throttling refs
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTypingTimeRef = useRef(0);
  const pendingMessagesRef = useRef<any[]>([]);
  const messageBatchTimeoutRef = useRef<NodeJS.Timeout>();

  // Performance metrics
  const metricsRef = useRef({
    messagesSent: 0,
    messagesReceived: 0,
    reconnections: 0,
    avgLatency: 0,
    lastPingTime: 0
  });

  // Throttled typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    const now = Date.now();
    
    if (isTyping) {
      // Throttle typing start events
      if (now - lastTypingTimeRef.current < typingThrottleMs) {
        return;
      }
      lastTypingTimeRef.current = now;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping,
        timestamp: now
      }));
    }

    // Auto-stop typing after period of inactivity
    if (isTyping) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, typingThrottleMs * 2);
    }
  }, [typingThrottleMs]);

  // Batch message sending for performance
  const batchSendMessage = useCallback((message: any) => {
    pendingMessagesRef.current.push(message);
    
    clearTimeout(messageBatchTimeoutRef.current);
    messageBatchTimeoutRef.current = setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN && pendingMessagesRef.current.length > 0) {
        // Send all pending messages at once
        const messages = [...pendingMessagesRef.current];
        pendingMessagesRef.current = [];
        
        wsRef.current.send(JSON.stringify({
          type: 'message_batch',
          messages,
          timestamp: Date.now()
        }));
        
        metricsRef.current.messagesSent += messages.length;
      }
    }, 50); // Batch messages within 50ms
  }, []);

  // Optimized message handler with debouncing
  const messageHandler = useMemo(() => {
    let queryInvalidationTimeout: NodeJS.Timeout;
    
    return (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        metricsRef.current.messagesReceived++;

        switch (data.type) {
          case 'new_message':
          case 'message_sent':
            // Debounce query invalidations to reduce re-renders
            clearTimeout(queryInvalidationTimeout);
            queryInvalidationTimeout = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['messaging'] });
              queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
            }, 100);
            break;

          case 'typing':
            // Handle typing indicators without query invalidation
            window.dispatchEvent(new CustomEvent('typing-indicator', {
              detail: data
            }));
            break;

          case 'presence_update':
            // Handle presence updates efficiently
            window.dispatchEvent(new CustomEvent('presence-update', {
              detail: data
            }));
            break;

          case 'pong':
            // Calculate latency
            const latency = Date.now() - metricsRef.current.lastPingTime;
            metricsRef.current.avgLatency = (metricsRef.current.avgLatency + latency) / 2;
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, [queryClient]);

  // Enhanced connection with retry logic
  const connect = useCallback(() => {
    if (!user?.userId || !profile) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      const wsUrl = `${protocol}//${hostname}${port}/ws`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Optimized WebSocket connected');
        reconnectAttemptsRef.current = 0;
        
        // Authenticate with sessionId for PWA support
        const sessionId = getSessionId();
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          userId: user.userId,
          role: profile.role || 'student',
          sessionId: sessionId // Include sessionId for PWA where cookies may be blocked
        }));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            metricsRef.current.lastPingTime = Date.now();
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, heartbeatIntervalMs);
      };

      wsRef.current.onmessage = messageHandler;

      wsRef.current.onclose = () => {
        console.log('Optimized WebSocket disconnected');
        
        // Clear intervals
        clearInterval(heartbeatIntervalRef.current);
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectDelayMs * Math.pow(2, reconnectAttemptsRef.current);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            metricsRef.current.reconnections++;
            console.log(`Reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Optimized WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [user?.userId, profile?.role, messageHandler, reconnectDelayMs, maxReconnectAttempts, heartbeatIntervalMs]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear all timeouts
    clearTimeout(typingTimeoutRef.current);
    clearTimeout(messageBatchTimeoutRef.current);
    clearTimeout(reconnectTimeoutRef.current);
    clearInterval(heartbeatIntervalRef.current);
    
    // Close connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Performance monitoring
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Check connection status
  const isConnected = wsRef.current?.readyState === WebSocket.OPEN;

  return {
    connect,
    disconnect: cleanup,
    sendTypingIndicator,
    batchSendMessage,
    isConnected,
    getMetrics,
    
    // Direct WebSocket access for advanced usage
    ws: wsRef.current
  };
}
