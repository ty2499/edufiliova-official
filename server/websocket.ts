import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { db } from './db.js';
import { 
  profiles,
  messages,
  communityPosts,
  lessonProgress,
  announcements,
  users,
  communityGroupMembers,
  friendships,
  teacherStudentAssignments,
  helpChatMessages,
  supportAgents,
  helpChatSettings,
  supportChatSessions
} from '../shared/schema.js';
import { eq, desc, and, or, like, asc } from 'drizzle-orm';

export interface AppWebSocketServer extends WebSocketServer {
  clients: Set<WebSocket>;
  userConnections: Map<string, WebSocket>;
  adminConnections: Set<WebSocket>;
  teacherConnections: Map<string, WebSocket>;
  guestConnections: Map<string, WebSocket>; // Help chat guest connections
}

// Rate limiting for WebSocket messages
const messageRateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_MESSAGES_PER_MINUTE = 30;

// Agent assignment persistence - ONE agent per conversation
const conversationAgents = new Map<string, {
  id: string;
  name: string;
  avatarUrl?: string;
}>();

// Track pending welcome messages - send after guest's first message
const pendingWelcomeMessages = new Map<string, {
  agentInfo: { id: string; name: string; avatar: string; role?: string };
  welcomeMessage: string;
}>();

export function setupWebSocket(server: Server): AppWebSocketServer {
  const wss = new WebSocketServer({ 
    noServer: true
  }) as AppWebSocketServer;
  
  // Handle upgrade manually
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.userConnections = new Map();
  wss.adminConnections = new Set();
  wss.teacherConnections = new Map();
  wss.guestConnections = new Map();

  // Make WebSocket connections accessible globally for HTTP API
  (global as any).wsClients = wss.userConnections;
  (global as any).wss = wss;

  wss.on('connection', (ws: WebSocket, request) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Rate limiting check (skip only for initial auth)
        if (message.type !== 'auth' && !checkRateLimit(ws, message)) {
          ws.send(JSON.stringify({ 
            type: 'rate_limit_exceeded', 
            message: 'Too many requests. Please slow down.' 
          }));
          return;
        }

        console.log(`📨 WebSocket message received:`, message.type, 'from user:', message.userId);
        switch (message.type) {
          case 'auth':
            await handleAuth(ws, message, wss);
            break;
            
          case 'send_message':
            await handleSendMessage(ws, message, wss);
            break;
            
          case 'join_chat':
            await handleJoinChat(ws, message, wss);
            break;
            
          case 'community_post':
            await handleCommunityPost(ws, message, wss);
            break;
            
          case 'lesson_progress':
            await handleLessonProgress(ws, message, wss);
            break;
            
          case 'teacher_notification':
            await handleTeacherNotification(ws, message, wss);
            break;
            
          case 'typing_start':
            await handleTypingStart(ws, message, wss);
            break;
            
          case 'typing_stop':
            await handleTypingStop(ws, message, wss);
            break;
            
          case 'recording_start':
            await handleRecordingStart(ws, message, wss);
            break;
            
          case 'recording_stop':
            await handleRecordingStop(ws, message, wss);
            break;
            
          case 'presence_update':
            await handlePresenceUpdate(ws, message, wss);
            break;

          case 'call_offer':
            await handleCallOffer(ws, message, wss);
            break;
            
          case 'call_answer':
            await handleCallAnswer(ws, message, wss);
            break;
            
          case 'call_ice_candidate':
            await handleCallIceCandidate(ws, message, wss);
            break;
            
          case 'call_end':
            await handleCallEnd(ws, message, wss);
            break;
            
          case 'friend_request':
            await handleFriendRequestNotification(ws, message, wss);
            break;
            
          case 'friend_request_response':
            await handleFriendRequestResponse(ws, message, wss);
            break;

          case 'help_chat_auth':
            await handleHelpChatAuth(ws, message, wss);
            break;
            
          case 'help_chat_send_message':
            await handleHelpChatSendMessage(ws, message, wss);
            break;
            
          case 'help_chat_typing':
            await handleHelpChatTyping(ws, message, wss);
            break;
            
          case 'admin_join_conversation':
            await handleAdminJoinConversation(ws, message, wss);
            break;
            
          case 'admin_leave_conversation':
            await handleAdminLeaveConversation(ws, message, wss);
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Failed to process message' 
        }));
      }
    });

    ws.on('close', async () => {
      const userId = (ws as any).userId;
      const guestId = (ws as any).guestId;
      const isHelpChatGuest = (ws as any).isHelpChatGuest;
      
      // Handle help chat guest disconnection
      // Only delete if the stored connection matches this websocket (prevents race condition during reconnects)
      if (isHelpChatGuest && guestId) {
        const storedConnection = wss.guestConnections.get(guestId);
        if (storedConnection === ws) {
          wss.guestConnections.delete(guestId);
          console.log(`WebSocket connection closed for help chat guest ${guestId}`);
        } else {
          console.log(`WebSocket connection closed for help chat guest ${guestId}, but not removing (newer connection exists)`);
        }
      }
      
      // Set user as offline when they disconnect
      if (userId) {
        try {
          const userUuid = await getProfileUuidByUserId(userId);
          if (userUuid) {
            await db.update(profiles)
              .set({ 
                isOnline: false,
                lastSeen: new Date()
              })
              .where(eq(profiles.userId, userUuid));
            
            // Broadcast offline status to friends
            await broadcastPresenceToFriends(userId, 'offline', false, wss);
          }
        } catch (error) {
          console.error('Error setting user offline:', error);
        }
      }
      
      // Remove from all connection maps
      wss.userConnections.forEach((socket, userIdKey) => {
        if (socket === ws) {
          wss.userConnections.delete(userIdKey);
        }
      });
      
      wss.adminConnections.delete(ws);
      console.log(`WebSocket connection closed for user ${userId || guestId || 'unknown'}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

async function handleAuth(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { userId } = message;
  
  if (!userId) {
    ws.send(JSON.stringify({ 
      type: 'auth_error', 
      message: 'Missing userId' 
    }));
    return;
  }

  // SECURITY: Get user profile information for proper identification
  // NEVER trust client-provided role - only use database-verified role
  let userProfile = null;
  try {
    const profileData = await getUserWithProfile(userId);
    if (!profileData) {
      // Reject authentication if user not found in database
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'User not found or unauthorized' 
      }));
      return;
    }
    
    userProfile = {
      userId: profileData.userId,
      textUserId: profileData.textUserId,
      role: profileData.role,
      name: profileData.name,
      avatarUrl: profileData.avatarUrl
    };
  } catch (error) {
    console.error('Error getting user profile during auth:', error);
    ws.send(JSON.stringify({ 
      type: 'auth_error', 
      message: 'Authentication failed' 
    }));
    return;
  }

  // Store user connection
  wss.userConnections.set(userId, ws);
  
  // SECURITY FIX: Use database-verified role, NEVER client-provided role
  // Add to role-specific connections based on database-verified role only
  if (userProfile.role === 'admin' || userProfile.role === 'customer_service' || userProfile.role === 'moderator') {
    wss.adminConnections.add(ws);
  } else if (userProfile.role === 'teacher') {
    wss.teacherConnections.set(userId, ws);
  }
  
  // Add user-specific data to websocket - use database-verified role
  (ws as any).userId = userId;
  (ws as any).userRole = userProfile.role; // Database-verified role
  (ws as any).userProfile = userProfile;
  
  // Set user as online when they connect
  try {
    const userUuid = await getProfileUuidByUserId(userId);
    if (userUuid) {
      await db.update(profiles)
        .set({ 
          isOnline: true,
          lastSeen: new Date()
        })
        .where(eq(profiles.userId, userUuid));
      
      // Broadcast online status to friends
      await broadcastPresenceToFriends(userId, 'online', true, wss);
    }
  } catch (error) {
    console.error('Error setting user online:', error);
  }
  
  ws.send(JSON.stringify({ 
    type: 'auth_success', 
    message: 'Authentication successful',
    role: userProfile.role // Send back the database-verified role
  }));
  
  console.log(`✅ User ${userId} (${userProfile.role}) authenticated via WebSocket with database-verified role`);
  console.log(`🔗 Active WebSocket connections: ${Array.from(wss.userConnections.keys()).join(', ')}`);
}

// Assignment mode helper functions
async function getAssignmentSettings() {
  const settingsQuery = await db
    .select()
    .from(helpChatSettings)
    .where(
      eq(helpChatSettings.settingKey, 'assignment_mode')
    )
    .limit(1);
  
  const assignmentMode = settingsQuery.length > 0 ? settingsQuery[0].settingValue : 'auto';
  
  // Get other settings
  const settings = await db
    .select()
    .from(helpChatSettings);
  
  const settingsMap = new Map(settings.map(s => [s.settingKey, s.settingValue]));
  
  return {
    assignmentMode: assignmentMode as 'auto' | 'manual',
    enableRoundRobin: settingsMap.get('auto_assign_round_robin') === 'true',
    considerAgentLoad: settingsMap.get('auto_assign_consider_load') === 'true',
    maxActiveChatsPerAgent: parseInt(settingsMap.get('max_active_chats_per_agent') || '5'),
    workingHoursOnly: settingsMap.get('working_hours_only') === 'true',
    autoAssignWelcomeMessage: settingsMap.get('auto_assign_welcome_message') || 'Hello! You have been connected to a support agent who will assist you shortly.',
    manualQueueWelcomeMessage: settingsMap.get('manual_queue_welcome_message') || 'Hello! Your request has been received. An agent will be with you shortly.',
    allowAgentSelection: settingsMap.get('allow_agent_selection') === 'true',
    showQueuePosition: settingsMap.get('show_queue_position') === 'true',
    estimatedWaitTime: settingsMap.get('estimated_wait_time') || '5-10 minutes'
  };
}

async function getAvailableAgents() {
  const agents = await db
    .select()
    .from(supportAgents)
    .where(eq(supportAgents.isActive, true));
  
  return agents;
}

async function getAgentWorkload(agentId: number) {
  const activeSessions = await db
    .select()
    .from(supportChatSessions)
    .where(eq(supportChatSessions.assignedAgentId, agentId));
  
  return activeSessions.length;
}

async function findBestAgent(settings: any) {
  const availableAgents = await getAvailableAgents();
  
  if (availableAgents.length === 0) {
    return null;
  }
  
  // Filter by working hours if enabled
  if (settings.workingHoursOnly) {
    // For now, we'll implement basic logic. Could be enhanced with time zones
    const currentHour = new Date().getHours();
    if (currentHour < 9 || currentHour > 17) {
      return null; // Outside working hours
    }
  }
  
  if (!settings.considerAgentLoad) {
    // Simple random/round-robin selection
    if (settings.enableRoundRobin) {
      // Get the least recently assigned agent (basic round-robin)
      const sortedAgents = availableAgents.sort((a, b) => 
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      );
      return sortedAgents[0];
    } else {
      // Random selection
      return availableAgents[Math.floor(Math.random() * availableAgents.length)];
    }
  }
  
  // Consider agent workload
  const agentsWithLoad = await Promise.all(
    availableAgents.map(async (agent) => ({
      ...agent,
      currentLoad: await getAgentWorkload(agent.id)
    }))
  );
  
  // Filter agents who haven't reached their max capacity
  const availableAgentsWithCapacity = agentsWithLoad.filter(
    agent => agent.currentLoad < settings.maxActiveChatsPerAgent
  );
  
  if (availableAgentsWithCapacity.length === 0) {
    return null; // All agents at capacity
  }
  
  // Find agent with lowest workload
  const bestAgent = availableAgentsWithCapacity.reduce((best, current) => 
    current.currentLoad < best.currentLoad ? current : best
  );
  
  return bestAgent;
}

async function autoAssignAgent(guestId: string, wss: AppWebSocketServer) {
  const settings = await getAssignmentSettings();
  
  if (settings.assignmentMode !== 'auto') {
    return false; // Not in auto mode
  }
  
  const selectedAgent = await findBestAgent(settings);
  
  if (!selectedAgent) {
    // No agents available, send manual queue message
    const guestWs = wss.guestConnections.get(guestId);
    if (guestWs && guestWs.readyState === WebSocket.OPEN) {
      guestWs.send(JSON.stringify({
        type: 'help_chat_message',
        message: settings.manualQueueWelcomeMessage,
        sender: 'system',
        timestamp: new Date().toISOString(),
        agentInfo: null
      }));
    }
    return false;
  }
  
  // Assign the agent
  await assignAgentToSession(guestId, selectedAgent, wss, settings.autoAssignWelcomeMessage);
  return true;
}

async function assignAgentToSession(guestId: string, agent: any, wss: AppWebSocketServer, welcomeMessage?: string) {
  try {
    // Store assignment in conversation map
    conversationAgents.set(guestId, {
      id: agent.id.toString(),
      name: agent.name,
      avatarUrl: agent.avatarUrl
    });
    
    // Create support chat session (handle potential duplicates)
    try {
      await db.insert(supportChatSessions).values({
        guestId,
        assignedAgentId: agent.id,
        isActive: true,
        sessionStartedAt: new Date(),
        lastActivityAt: new Date()
      });
    } catch (dbError: any) {
      // If duplicate key error, update existing session
      if (dbError?.code === '23505') {
        await db.update(supportChatSessions)
          .set({
            assignedAgentId: agent.id,
            isActive: true,
            lastActivityAt: new Date()
          })
          .where(eq(supportChatSessions.guestId, guestId));
        console.log(`🔄 Updated existing session for guest ${guestId} with agent ${agent.name}`);
      } else {
        throw dbError; // Re-throw if it's a different error
      }
    }
    
    // Store welcome message to send AFTER guest's first message
    const agentInfo = {
      id: agent.id.toString(),
      name: agent.name,
      avatar: agent.avatarUrl || agent.name.split(' ').map((n: string) => n[0]).join(''),
      role: agent.role
    };
    
    pendingWelcomeMessages.set(guestId, {
      agentInfo,
      welcomeMessage: welcomeMessage || `${agent.name} has joined the chat and will assist you.`
    });
    
    console.log(`⏳ Welcome message queued for guest ${guestId} - will send after their first message`);
    
    // Notify all admins about the assignment
    wss.adminConnections.forEach((adminWs) => {
      if (adminWs.readyState === WebSocket.OPEN) {
        adminWs.send(JSON.stringify({
          type: 'help_chat_agent_assigned',
          guestId: guestId,
          agent: {
            id: agent.id.toString(),
            name: agent.name,
            avatar: agent.avatar || agent.name.split(' ').map((n: string) => n[0]).join(''),
            role: agent.role
          },
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    console.log(`🤝 Auto-assigned agent ${agent.name} to guest ${guestId}`);
  } catch (error) {
    console.error('Error assigning agent to session:', error);
  }
}

// Rate limiting function
function checkRateLimit(ws: WebSocket, message: any): boolean {
  const userId = (ws as any).userId;
  const wsGuestId = (ws as any).guestId;
  const messageGuestId = message.guestId;
  const isHelpChat = message.type?.startsWith('help_chat_');
  
  // For help chat messages, try multiple sources for guestId
  let identifier: string;
  if (isHelpChat) {
    const guestId = messageGuestId || wsGuestId;
    if (guestId) {
      identifier = `guest_${guestId}`;
    } else {
      return false; // Block help chat without guestId
    }
  } else if (userId) {
    identifier = `user_${userId}`;
  } else {
    return false; // Block if no identifier available
  }
  
  const now = Date.now();
  const key = `${identifier}_${message.type}`;
  
  // Clean up expired entries
  const keysToDelete: string[] = [];
  messageRateLimits.forEach((v, k) => {
    if (now > v.resetTime) {
      keysToDelete.push(k);
    }
  });
  keysToDelete.forEach(k => messageRateLimits.delete(k));
  
  let bucket = messageRateLimits.get(key);
  if (!bucket || now > bucket.resetTime) {
    bucket = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    messageRateLimits.set(key, bucket);
  }
  
  if (bucket.count >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }
  
  bucket.count++;
  return true;
}

// Helper function to get profile UUID by text userId  
async function getProfileUuidByUserId(textUserId: string): Promise<string | null> {
  try {
    // First get the user UUID from auth_users
    const authUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, textUserId))
      .limit(1);
    
    if (authUser.length === 0) return null;
    
    // Then get the profile UUID
    const profile = await db
      .select({ id: profiles.id })
      .from(profiles) 
      .where(eq(profiles.userId, authUser[0].id))
      .limit(1);
      
    return profile.length > 0 ? profile[0].id : null;
  } catch (error) {
    console.error('Error getting profile UUID:', error);
    return null;
  }
}

// Helper function to get user with profile information
async function getUserWithProfile(userIdOrTextId: string) {
  try {
    let userId: string;
    
    // Check if it's already a UUID or text ID
    if (userIdOrTextId.length === 36 && userIdOrTextId.includes('-')) {
      // It's a UUID
      userId = userIdOrTextId;
    } else {
      // It's a text ID, convert to UUID
      const userRecord = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.userId, userIdOrTextId))
        .limit(1);
      if (userRecord.length === 0) return null;
      userId = userRecord[0].id;
    }

    // Get user with profile
    const result = await db.select({
      userId: users.id,
      textUserId: users.userId,
      role: profiles.role,
      name: profiles.name,
      avatarUrl: profiles.avatarUrl
    })
    .from(users)
    .innerJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.id, userId))
    .limit(1);

    if (result.length === 0) return null;

    return {
      userId: result[0].userId,
      textUserId: result[0].textUserId,
      role: result[0].role || 'student',
      name: result[0].name,
      avatarUrl: result[0].avatarUrl
    };
  } catch (error) {
    console.error('Error getting user with profile:', error);
    return null;
  }
}

// Check messaging permissions helper for WebSocket
async function checkMessagingPermissions(sender: any, receiver: any) {
  if (sender.role === 'admin') {
    return true; // Admins can message anyone
  }
  
  // Accountant and customer service can message anyone
  if (sender.role === 'accountant' || sender.role === 'customer_service') {
    return true; // Support staff can message anyone
  }
  
  // All users can message teachers, admins, accountants, and customer service without restrictions
  if (receiver.role === 'teacher' || receiver.role === 'admin' || receiver.role === 'accountant' || receiver.role === 'customer_service') {
    return true;
  }
  
  if (sender.role === 'teacher') {
    return true; // Teachers can message anyone
  }
  
  // Freelancer permissions - match HTTP route logic exactly
  if (sender.role === 'freelancer' && receiver.role === 'admin') {
    return true; // Freelancers can message admins for support
  }
  
  if (sender.role === 'freelancer' && receiver.role === 'teacher') {
    return true; // Freelancers can message teachers
  }
  
  if ((receiver.role === 'freelancer') && (sender.role === 'student' || sender.role === 'user')) {
    return true; // Students/users can contact freelancers
  }
  
  if (sender.role === 'teacher' && receiver.role === 'freelancer') {
    return true; // Teachers can message freelancers
  }
  
  // Student-to-student messaging requires accepted friendship
  if ((sender.role === 'student' || sender.role === 'user') && (receiver.role === 'student' || receiver.role === 'user')) {
    // Check for accepted friendship between the two users
    const friendship = await db.select()
      .from(friendships)
      .where(and(
        or(
          and(eq(friendships.requesterId, sender.userId), eq(friendships.receiverId, receiver.userId)),
          and(eq(friendships.requesterId, receiver.userId), eq(friendships.receiverId, sender.userId))
        ),
        eq(friendships.status, 'accepted')
      ))
      .limit(1);
    
    return friendship.length > 0;
  }
  
  return false; // All other cases are not permitted
}

// Handle real-time messaging
async function handleSendMessage(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId, groupId, content, threadId, messageType, fileMetadata } = message;
  const senderUserId = (ws as any).userId; // This is text ID like "ADMIN00001"
  
  if (!senderUserId || (!receiverId && !groupId)) {
    ws.send(JSON.stringify({ 
      type: 'message_error', 
      message: 'Missing required fields' 
    }));
    return;
  }

  // Validate based on message type
  const msgType = messageType || 'text';
  if (msgType === 'text' && (!content || content.length > 2000)) {
    ws.send(JSON.stringify({ 
      type: 'message_error', 
      message: content ? 'Message too long. Maximum 2000 characters.' : 'Content is required for text messages'
    }));
    return;
  }


  // For file messages, either use HTTP upload endpoint or provide fileMetadata via WebSocket
  if (['voice', 'image', 'video', 'document'].includes(msgType) && !fileMetadata) {
    ws.send(JSON.stringify({ 
      type: 'message_error', 
      message: 'File uploads should use the HTTP API endpoint /api/messages/file. WebSocket file messages require fileMetadata.' 
    }));
    return;
  }
  
  try {
    // Convert text IDs to profile UUIDs for database insertion
    const senderUuid = await getProfileUuidByUserId(senderUserId);
    let receiverUuid = null;
    
    if (!senderUuid) {
      console.log(`Sender UUID not found for text ID: ${senderUserId}`);
      ws.send(JSON.stringify({ 
        type: 'message_error', 
        message: 'Unable to send message' 
      }));
      return;
    }

    // For direct messages, get receiver UUID and check permissions
    if (receiverId) {
      receiverUuid = await getProfileUuidByUserId(receiverId);
      if (!receiverUuid) {
        console.log(`Receiver UUID not found for text ID: ${receiverId}`);
        ws.send(JSON.stringify({ 
          type: 'message_error', 
          message: 'Unable to send message' 
        }));
        return;
      }

      // Check messaging permissions for direct messages
      const sender = await getUserWithProfile(senderUserId);
      const receiver = await getUserWithProfile(receiverId);

      if (!sender || !receiver) {
        ws.send(JSON.stringify({ 
          type: 'message_error', 
          message: 'Unable to verify user permissions' 
        }));
        return;
      }

      const canMessage = await checkMessagingPermissions(sender, receiver);
      if (!canMessage) {
        ws.send(JSON.stringify({ 
          type: 'message_error', 
          message: 'You are not authorized to message this user. Students can only message friends, teachers, and admins.' 
        }));
        return;
      }
    }

    // For group messages, validate group membership
    if (groupId) {
      // Get the user UUID from profile UUID for group membership check
      const senderProfile = await db.select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.id, senderUuid))
        .limit(1);

      if (senderProfile.length === 0) {
        ws.send(JSON.stringify({ 
          type: 'message_error', 
          message: 'Unable to send message' 
        }));
        return;
      }

      const senderUserUuid = senderProfile[0].userId;

      // Check if sender is a member of the group using user UUID
      const membership = await db.select()
        .from(communityGroupMembers)
        .where(and(
          eq(communityGroupMembers.groupId, groupId),
          eq(communityGroupMembers.userId, senderUserUuid)
        ))
        .limit(1);

      if (membership.length === 0) {
        ws.send(JSON.stringify({ 
          type: 'message_error', 
          message: 'You are not a member of this group' 
        }));
        return;
      }
    }

    // Save message to database using UUIDs and new schema
    const [newMessage] = await db.insert(messages).values({
      senderId: senderUuid, // Use UUID 
      receiverId: receiverUuid, // Use UUID or null for group messages
      groupId: groupId || null, // Group ID for group messages
      content: content || null,
      messageType: msgType,
      fileType: msgType === 'text' ? null : msgType,
      fileUrl: fileMetadata?.url || null,
      isRead: false
    }).returning({
      id: messages.id,
      senderId: messages.senderId,
      receiverId: messages.receiverId, 
      groupId: messages.groupId,
      content: messages.content,
      messageType: messages.messageType,
      fileUrl: messages.fileUrl,
      fileType: messages.fileType,
      isRead: messages.isRead,
      deliveredAt: messages.deliveredAt,
      readAt: messages.readAt,
      createdAt: messages.createdAt
    });

    
    // Handle message broadcasting based on type (group vs direct)
    if (groupId) {
      // For group messages, broadcast to all group members
      console.log(`📨 Broadcasting group message to group ${groupId}`);
      
      // Get all group members
      const groupMembers = await db.select({ userId: communityGroupMembers.userId })
        .from(communityGroupMembers)
        .where(eq(communityGroupMembers.groupId, groupId));
      
      let sentCount = 0;
      for (const member of groupMembers) {
        // Convert user UUID back to text ID for WebSocket lookup
        const memberProfile = await db.select({ userId: users.userId })
          .from(users)
          .where(eq(users.id, member.userId))
          .limit(1);
        
        if (memberProfile.length > 0) {
          const memberTextId = memberProfile[0].userId;
          const memberWs = wss.userConnections.get(memberTextId);
          
          if (memberWs && memberWs.readyState === WebSocket.OPEN) {
            memberWs.send(JSON.stringify({
              type: 'new_message',
              data: newMessage
            }));
            sentCount++;
          }
        }
      }
      
      console.log(`✅ Group message broadcasted to ${sentCount} online members`);
    } else if (receiverId) {
      // For direct messages, send to specific receiver
      const receiverWs = wss.userConnections.get(receiverId);
      console.log(`📨 Looking for receiver ${receiverId}, connection found: ${!!receiverWs}, state: ${receiverWs?.readyState}`);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify({
          type: 'new_message',
          data: newMessage
        }));
        console.log(`✅ Message sent to receiver ${receiverId} via WebSocket`);
      } else {
        console.log(`❌ Receiver ${receiverId} not connected or connection closed`);
      }
    }
    
    // Confirm to sender with temp ID for optimistic UI replacement
    ws.send(JSON.stringify({
      type: 'message_sent',
      data: newMessage,
      tempId: message.tempId // Include tempId for frontend replacement
    }));
    
    console.log(`${msgType} message sent from ${senderUserId} to ${groupId ? `group ${groupId}` : `receiver ${receiverId}`}`);
  } catch (error) {
    console.error('Error sending message:', error);
    ws.send(JSON.stringify({ 
      type: 'message_error', 
      message: 'Failed to send message' 
    }));
  }
}


// Handle joining chat rooms
async function handleJoinChat(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { chatId } = message;
  const userId = (ws as any).userId;
  
  // Add user to chat room (implement chat room logic as needed)
  (ws as any).currentChat = chatId;
  
  ws.send(JSON.stringify({
    type: 'chat_joined',
    chatId: chatId
  }));
  
  console.log(`User ${userId} joined chat ${chatId}`);
}

// Handle real-time community posts
async function handleCommunityPost(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { title, content, body, subject, grade } = message;
  const authorId = (ws as any).userId;
  
  if (!authorId || !title || !content) {
    ws.send(JSON.stringify({ 
      type: 'post_error', 
      message: 'Missing required fields' 
    }));
    return;
  }
  
  // Validate content length
  if (content.length > 2000 || (body && body.length > 2000)) {
    ws.send(JSON.stringify({ 
      type: 'post_error', 
      message: 'Post too long. Maximum 2000 characters.' 
    }));
    return;
  }
  
  try {
    // Save post to database
    const [newPost] = await db.insert(communityPosts).values({
      authorId,
      title,
      content,
      body: body || content,
      subject,
      grade
    }).returning();
    
    // Broadcast to all connected users
    const postData = {
      type: 'new_community_post',
      data: newPost
    };
    
    wss.userConnections.forEach((userWs) => {
      if (userWs.readyState === WebSocket.OPEN) {
        userWs.send(JSON.stringify(postData));
      }
    });
    
    // Confirm to author
    ws.send(JSON.stringify({
      type: 'post_created',
      data: newPost
    }));
    
    console.log(`Community post created by ${authorId}`);
  } catch (error) {
    console.error('Error creating community post:', error);
    ws.send(JSON.stringify({ 
      type: 'post_error', 
      message: 'Failed to create post' 
    }));
  }
}

// Handle real-time lesson progress updates
async function handleLessonProgress(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { lessonId, courseOrSubjectId, progressPercent, completed } = message;
  const userId = (ws as any).userId;
  
  if (!userId || !lessonId || !courseOrSubjectId) {
    ws.send(JSON.stringify({ 
      type: 'progress_error', 
      message: 'Missing required fields' 
    }));
    return;
  }
  
  try {
    // Update or create lesson progress
    const progressData = {
      userId,
      lessonId,
      courseOrSubjectId,
      progressPercent: progressPercent || 0,
      completedAt: completed ? new Date() : null
    };
    
    // First try to update existing progress
    const existing = await db.select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, lessonId)
      ))
      .limit(1);
    
    let updatedProgress;
    if (existing.length > 0) {
      // Update existing record
      [updatedProgress] = await db.update(lessonProgress)
        .set({
          progressPercent: progressPercent || 0,
          completedAt: completed ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(lessonProgress.id, existing[0].id))
        .returning();
    } else {
      // Create new record
      [updatedProgress] = await db.insert(lessonProgress)
        .values(progressData)
        .returning();
    }
    
    // Notify teachers assigned to this student
    wss.teacherConnections.forEach((teacherWs, teacherId) => {
      if (teacherWs.readyState === WebSocket.OPEN) {
        teacherWs.send(JSON.stringify({
          type: 'student_progress_update',
          data: {
            studentId: userId,
            lessonId: lessonId,
            progress: updatedProgress
          }
        }));
      }
    });
    
    // Confirm to student
    ws.send(JSON.stringify({
      type: 'progress_updated',
      data: updatedProgress
    }));
    
    console.log(`Progress updated for user ${userId}, lesson ${lessonId}: ${progressPercent}%`);
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    ws.send(JSON.stringify({ 
      type: 'progress_error', 
      message: 'Failed to update progress' 
    }));
  }
}

// Handle teacher notifications
async function handleTeacherNotification(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { title, content, targetGrade, targetStudentIds } = message;
  const teacherId = (ws as any).userId;
  const userRole = (ws as any).userRole;
  
  if (userRole !== 'teacher' && userRole !== 'admin') {
    ws.send(JSON.stringify({ 
      type: 'notification_error', 
      message: 'Unauthorized: Only teachers can send notifications' 
    }));
    return;
  }
  
  if (!teacherId || !title || !content) {
    ws.send(JSON.stringify({ 
      type: 'notification_error', 
      message: 'Missing required fields' 
    }));
    return;
  }
  
  try {
    // Save announcement to database
    const [newAnnouncement] = await db.insert(announcements).values({
      teacherId,
      title,
      content,
      targetGrade,
      targetStudentIds: targetStudentIds || []
    }).returning();
    
    // Send to targeted students
    const notificationData = {
      type: 'teacher_announcement',
      data: newAnnouncement
    };
    
    if (targetStudentIds && targetStudentIds.length > 0) {
      // Send to specific students
      targetStudentIds.forEach((studentId: string) => {
        const studentWs = wss.userConnections.get(studentId);
        if (studentWs && studentWs.readyState === WebSocket.OPEN) {
          studentWs.send(JSON.stringify(notificationData));
        }
      });
    } else {
      // Send to all students (or by grade if specified)
      wss.userConnections.forEach((userWs, userId) => {
        const userRole = (userWs as any).userRole;
        if (userRole === 'student' && userWs.readyState === WebSocket.OPEN) {
          userWs.send(JSON.stringify(notificationData));
        }
      });
    }
    
    // Confirm to teacher
    ws.send(JSON.stringify({
      type: 'notification_sent',
      data: newAnnouncement
    }));
    
    console.log(`Teacher notification sent by ${teacherId}: ${title}`);
  } catch (error) {
    console.error('Error sending teacher notification:', error);
    ws.send(JSON.stringify({ 
      type: 'notification_error', 
      message: 'Failed to send notification' 
    }));
  }
}

// Broadcast system-wide notifications
export function broadcastToAllUsers(wss: AppWebSocketServer, message: any) {
  const broadcastData = JSON.stringify(message);
  
  wss.userConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(broadcastData);
    }
  });
}

// Broadcast to teachers only
export function broadcastToTeachers(wss: AppWebSocketServer, message: any) {
  const broadcastData = JSON.stringify(message);
  
  wss.teacherConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(broadcastData);
    }
  });
}

// Broadcast to admins only
export function broadcastToAdmins(wss: AppWebSocketServer, message: any) {
  const broadcastData = JSON.stringify(message);
  
  wss.adminConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(broadcastData);
    }
  });
}

// Handle typing start indicator
async function handleTypingStart(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId } = message;
  const senderId = (ws as any).userId;
  
  if (!senderId || !receiverId) {
    return;
  }
  
  // Send typing indicator to receiver
  const receiverWs = wss.userConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'user_typing',
      data: {
        userId: senderId,
        isTyping: true
      }
    }));
  }
}

// Handle typing stop indicator
async function handleTypingStop(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId } = message;
  const senderId = (ws as any).userId;
  
  if (!senderId || !receiverId) {
    return;
  }
  
  // Send typing stopped indicator to receiver
  const receiverWs = wss.userConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'user_typing',
      data: {
        userId: senderId,
        isTyping: false
      }
    }));
  }
}

// Handle presence updates (online/offline status)
// Handle recording start indicator
async function handleRecordingStart(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId } = message;
  const senderId = (ws as any).userId;
  
  if (!senderId || !receiverId) {
    return;
  }
  
  // Send recording indicator to receiver
  const receiverWs = wss.userConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'user_recording',
      data: {
        userId: senderId,
        isRecording: true
      }
    }));
  }
}

// Handle recording stop indicator
async function handleRecordingStop(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId } = message;
  const senderId = (ws as any).userId;
  
  if (!senderId || !receiverId) {
    return;
  }
  
  // Send recording stopped indicator to receiver
  const receiverWs = wss.userConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'user_recording',
      data: {
        userId: senderId,
        isRecording: false
      }
    }));
  }
}

// Helper function to check if two users are friends
async function areUsersFriends(userId1: string, userId2: string): Promise<boolean> {
  try {
    // Get UUIDs for both users
    const user1Uuid = await getProfileUuidByUserId(userId1);
    const user2Uuid = await getProfileUuidByUserId(userId2);
    
    if (!user1Uuid || !user2Uuid) {
      return false;
    }
    
    // Check for accepted friendship
    const friendship = await db.select()
      .from(friendships)
      .where(and(
        or(
          and(eq(friendships.requesterId, user1Uuid), eq(friendships.receiverId, user2Uuid)),
          and(eq(friendships.requesterId, user2Uuid), eq(friendships.receiverId, user1Uuid))
        ),
        eq(friendships.status, 'accepted')
      ))
      .limit(1);
    
    return friendship.length > 0;
  } catch (error) {
    console.error('Error checking friendship:', error);
    return false;
  }
}

// Helper function to get user role
async function getUserRole(userId: string): Promise<string> {
  try {
    const userUuid = await getProfileUuidByUserId(userId);
    if (!userUuid) {
      return 'user';
    }
    
    const profile = await db.select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.userId, userUuid))
      .limit(1);
    
    return profile[0]?.role || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

async function handlePresenceUpdate(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const userId = (ws as any).userId;
  const { status } = message; // 'online', 'away', 'offline'
  
  if (!userId) {
    return;
  }
  
  try {
    // Get the UUID for this user first
    const userUuid = await getProfileUuidByUserId(userId);
    if (!userUuid) {
      return;
    }
    
    // Update both last_seen and online status in the database
    const isOnline = status === 'online';
    await db.update(profiles)
      .set({ 
        lastSeen: new Date(),
        isOnline: isOnline
      })
      .where(eq(profiles.userId, userUuid));
    
    // Get user's role to determine who can see their status
    const userRole = await getUserRole(userId);
    
    // Broadcast presence update only to friends (except for admins who can see everyone)
    const presenceData = {
      type: 'presence_update',
      data: {
        userId: userId,
        status: status || 'online',
        lastSeen: new Date().toISOString(),
        isOnline: isOnline
      }
    };
    
    // Send to connected users based on friendship and role rules
    wss.userConnections.forEach(async (userWs, connectedUserId) => {
      if (connectedUserId === userId || userWs.readyState !== WebSocket.OPEN) {
        return;
      }
      
      const connectedUserRole = await getUserRole(connectedUserId);
      
      // Admins can see everyone's status
      if (connectedUserRole === 'admin') {
        userWs.send(JSON.stringify(presenceData));
        return;
      }
      
      // Teachers and admins are visible to everyone
      if (userRole === 'admin' || userRole === 'teacher') {
        userWs.send(JSON.stringify(presenceData));
        return;
      }
      
      // For students, only send to accepted friends
      if ((userRole === 'student' || userRole === 'user') && 
          (connectedUserRole === 'student' || connectedUserRole === 'user')) {
        const areFriends = await areUsersFriends(userId, connectedUserId);
        if (areFriends) {
          userWs.send(JSON.stringify(presenceData));
        }
      }
    });
    
  } catch (error) {
    console.error('Error updating presence:', error);
  }
}

// Helper function to broadcast presence to friends
async function broadcastPresenceToFriends(userId: string, status: string, isOnline: boolean, wss: AppWebSocketServer) {
  try {
    const userRole = await getUserRole(userId);
    
    const presenceData = {
      type: 'presence_update',
      data: {
        userId: userId,
        status: status,
        lastSeen: new Date().toISOString(),
        isOnline: isOnline
      }
    };
    
    // Send to connected users based on friendship and role rules
    wss.userConnections.forEach(async (userWs, connectedUserId) => {
      if (connectedUserId === userId || userWs.readyState !== WebSocket.OPEN) {
        return;
      }
      
      const connectedUserRole = await getUserRole(connectedUserId);
      
      // Admins can see everyone's status
      if (connectedUserRole === 'admin') {
        userWs.send(JSON.stringify(presenceData));
        return;
      }
      
      // Teachers and admins are visible to everyone
      if (userRole === 'admin' || userRole === 'teacher') {
        userWs.send(JSON.stringify(presenceData));
        return;
      }
      
      // For students, only send to accepted friends
      if ((userRole === 'student' || userRole === 'user') && 
          (connectedUserRole === 'student' || connectedUserRole === 'user')) {
        const areFriends = await areUsersFriends(userId, connectedUserId);
        if (areFriends) {
          userWs.send(JSON.stringify(presenceData));
        }
      }
    });
  } catch (error) {
    console.error('Error broadcasting presence:', error);
  }
}

// Handle call offer
async function handleCallOffer(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId, callType, offer } = message;
  const senderId = (ws as any).userId;
  
  if (!senderId || !receiverId) {
    ws.send(JSON.stringify({ 
      type: 'call_error', 
      message: 'Missing sender or receiver ID' 
    }));
    return;
  }
  
  // Forward call offer to receiver
  const receiverWs = wss.userConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'call_offer',
      senderId: senderId,
      callType: callType,
      offer: offer
    }));
    console.log(`📞 Call offer sent from ${senderId} to ${receiverId}`);
  } else {
    ws.send(JSON.stringify({ 
      type: 'call_error', 
      message: 'Receiver not available' 
    }));
  }
}

// Handle call answer
async function handleCallAnswer(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId, answer } = message;
  const senderId = (ws as any).userId;
  
  if (!senderId || !receiverId) {
    return;
  }
  
  // Forward call answer to original caller
  const receiverWs = wss.userConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'call_answer',
      senderId: senderId,
      answer: answer
    }));
    console.log(`📞 Call answer sent from ${senderId} to ${receiverId}`);
  }
}

// Handle ICE candidate
async function handleCallIceCandidate(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId, candidate } = message;
  const senderId = (ws as any).userId;
  
  if (!senderId || !receiverId) {
    return;
  }
  
  // Forward ICE candidate to peer
  const receiverWs = wss.userConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'call_ice_candidate',
      senderId: senderId,
      candidate: candidate
    }));
  }
}

// Handle call end
async function handleCallEnd(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId } = message;
  const senderId = (ws as any).userId;
  
  if (!senderId || !receiverId) {
    return;
  }
  
  // Forward call end to peer
  const receiverWs = wss.userConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'call_end',
      senderId: senderId
    }));
    console.log(`📞 Call ended between ${senderId} and ${receiverId}`);
  }
}

// Handle friend request notification
async function handleFriendRequestNotification(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId, requesterName, requesterId } = message;
  const senderId = (ws as any).userId;
  
  if (!senderId || !receiverId) {
    return;
  }
  
  // Send notification to receiver
  const receiverWs = wss.userConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'friend_request_received',
      requesterId: requesterId || senderId,
      requesterName: requesterName || 'Someone',
      message: `${requesterName || 'Someone'} sent you a friend request`
    }));
    console.log(`👥 Friend request notification sent from ${senderId} to ${receiverId}`);
  }
}

// Handle friend request response
async function handleFriendRequestResponse(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { receiverId, action, responderName } = message; // action: 'accepted' | 'rejected'
  const senderId = (ws as any).userId;
  
  if (!senderId || !receiverId) {
    return;
  }
  
  // Send response notification to original requester
  const receiverWs = wss.userConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'friend_request_response',
      responderId: senderId,
      responderName: responderName || 'Someone',
      action: action,
      message: action === 'accepted' 
        ? `${responderName || 'Someone'} accepted your friend request` 
        : `${responderName || 'Someone'} declined your friend request`
    }));
    console.log(`👥 Friend request ${action} notification sent from ${senderId} to ${receiverId}`);
  }
}

// Help Chat Authentication
async function handleHelpChatAuth(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { guestId, isVisitor } = message;
  
  if (!guestId) {
    ws.send(JSON.stringify({ 
      type: 'help_chat_auth_error', 
      message: 'Missing guest ID' 
    }));
    return;
  }

  if (isVisitor) {
    // Store guest connection
    wss.guestConnections.set(guestId, ws);
    (ws as any).guestId = guestId;
    (ws as any).isHelpChatGuest = true;
    
    console.log(`🆔 Help chat guest ${guestId} connected`);
    
    ws.send(JSON.stringify({ 
      type: 'help_chat_auth_success', 
      message: 'Guest authenticated for help chat',
      guestId: guestId
    }));
    
    // Attempt auto-assignment if enabled
    const autoAssigned = await autoAssignAgent(guestId, wss);
    
    if (!autoAssigned) {
      // No auto-assignment, notify all admins that a guest is available for help
      wss.adminConnections.forEach((adminWs) => {
        if (adminWs.readyState === WebSocket.OPEN) {
          adminWs.send(JSON.stringify({
            type: 'help_chat_guest_online',
            guestId: guestId,
            timestamp: new Date().toISOString()
          }));
        }
      });
    }
  } else {
    // Authenticated user connecting to help chat system
    const userId = (ws as any).userId;
    const userRole = (ws as any).userRole;
    
    if (userRole === 'admin' || userRole === 'moderator' || userRole === 'customer_service') {
      (ws as any).isHelpChatAdmin = true;
      
      ws.send(JSON.stringify({ 
        type: 'help_chat_auth_success', 
        message: 'Admin authenticated for help chat' 
      }));
      
      console.log(`👨‍💼 ${userRole} ${userId} connected to help chat system`);
    } else if (userRole === 'freelancer') {
      // Freelancers can use help chat similar to visitors, but they're authenticated
      // Use their userId as the guestId for tracking
      const freelancerGuestId = `freelancer_${userId}`;
      wss.guestConnections.set(freelancerGuestId, ws);
      (ws as any).guestId = freelancerGuestId;
      (ws as any).isHelpChatGuest = true;
      (ws as any).isFreelancer = true;
      
      ws.send(JSON.stringify({ 
        type: 'help_chat_auth_success', 
        message: 'Freelancer authenticated for help chat',
        guestId: freelancerGuestId
      }));
      
      console.log(`👨‍💼 Freelancer ${userId} connected to help chat system as ${freelancerGuestId}`);
      
      // Attempt auto-assignment for freelancers too
      const autoAssigned = await autoAssignAgent(freelancerGuestId, wss);
      
      if (!autoAssigned) {
        // No auto-assignment, notify all admins that a freelancer needs help
        wss.adminConnections.forEach((adminWs) => {
          if (adminWs.readyState === WebSocket.OPEN) {
            adminWs.send(JSON.stringify({
              type: 'help_chat_guest_online',
              guestId: freelancerGuestId,
              isFreelancer: true,
              timestamp: new Date().toISOString()
            }));
          }
        });
      }
    } else {
      ws.send(JSON.stringify({ 
        type: 'help_chat_auth_error', 
        message: 'Access denied. Only admins, moderators, customer service, and freelancers can access help chat.' 
      }));
    }
  }
}

// Help Chat Send Message
async function handleHelpChatSendMessage(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { guestId, message: messageContent, sender } = message;
  
  if (!guestId || !messageContent || !sender) {
    ws.send(JSON.stringify({ 
      type: 'help_chat_error', 
      message: 'Missing required fields' 
    }));
    return;
  }

  // Validate message length
  if (messageContent.length > 2000) {
    ws.send(JSON.stringify({ 
      type: 'help_chat_error', 
      message: 'Message too long. Maximum 2000 characters.' 
    }));
    return;
  }

  try {
    let receiverId = null;
    let adminName = null;
    let adminAvatar = null;

    // If message is from admin, determine name/avatar based on role
    if (sender === 'admin') {
      const adminUserId = (ws as any).userId;
      const userProfile = (ws as any).userProfile;
      const userRole = (ws as any).userRole;
      
      // LOGIC SPLIT: Admin vs Customer Service
      if (userRole === 'customer_service' || userRole === 'moderator') {
        // CUSTOMER SERVICE → Use REAL user's profile
        adminName = userProfile?.name || 'Support Agent';
        adminAvatar = userProfile?.avatarUrl || '👤';
        console.log(`📨 Customer Service ${adminName} sending help chat message to guest ${guestId}`);
      } else if (userRole === 'admin') {
        // ADMIN → Use support agent from conversationAgents map
        let assignedAgent = conversationAgents.get(guestId);
        
        if (!assignedAgent) {
          // Fetch active support agents for assignment
          const activeSupportAgents = await db
            .select()
            .from(supportAgents)
            .where(eq(supportAgents.isActive, true))
            .orderBy(asc(supportAgents.sortOrder), asc(supportAgents.name));
          
          if (activeSupportAgents.length === 0) {
            console.log('⚠️ No active support agents found in database');
            adminName = 'Support';
            adminAvatar = '👤';
          } else {
            // Select agent for this conversation
            const agentIndex = parseInt(guestId.slice(-1), 16) % activeSupportAgents.length;
            const selectedDbAgent = activeSupportAgents[agentIndex];
            
            assignedAgent = {
              id: selectedDbAgent.id.toString(),
              name: selectedDbAgent.name,
              avatarUrl: selectedDbAgent.avatarUrl || undefined
            };
            
            // Persist the agent assignment
            conversationAgents.set(guestId, assignedAgent);
            adminName = assignedAgent.name;
            adminAvatar = assignedAgent.avatarUrl || '👤';
            console.log(`🎯 Agent assigned for guest ${guestId}: ${assignedAgent.name}`);
          }
        } else {
          // Use existing assigned agent
          adminName = assignedAgent.name;
          adminAvatar = assignedAgent.avatarUrl || '👤';
        }
        
        console.log(`📨 Admin using agent ${adminName} to send help chat message to guest ${guestId}`);
      }
      
      if (adminUserId) {
        const adminProfile = await db.select({
          userId: profiles.userId
        })
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .where(eq(users.userId, adminUserId))
        .limit(1);

        if (adminProfile.length > 0) {
          receiverId = adminProfile[0].userId;
        }
      }
    }

    // Save message to database
    const [newMessage] = await db.insert(helpChatMessages).values({
      guestId: guestId,
      receiverId: receiverId,
      message: messageContent,
      sender: sender,
    }).returning({
      id: helpChatMessages.id,
      guestId: helpChatMessages.guestId,
      receiverId: helpChatMessages.receiverId,
      message: helpChatMessages.message,
      sender: helpChatMessages.sender,
      createdAt: helpChatMessages.createdAt
    });

    const helpChatMessageData = {
      type: 'help_chat_message',
      id: newMessage.id,
      guestId: newMessage.guestId,
      message: newMessage.message,
      sender: newMessage.sender,
      timestamp: newMessage.createdAt.toISOString(),
      adminName: adminName,
      adminAvatar: adminAvatar
    };

    // Broadcast message based on sender type
    if (sender === 'visitor') {
      // Check if this is the guest's first message and send pending welcome message
      const pendingWelcome = pendingWelcomeMessages.get(guestId);
      if (pendingWelcome) {
        // Send welcome message AFTER guest's first message
        const guestWs = wss.guestConnections.get(guestId);
        if (guestWs && guestWs.readyState === WebSocket.OPEN) {
          guestWs.send(JSON.stringify({
            type: 'help_chat_message',
            message: pendingWelcome.welcomeMessage,
            sender: 'system',
            timestamp: new Date().toISOString(),
            agentInfo: pendingWelcome.agentInfo
          }));
          console.log(`✅ Welcome message sent to guest ${guestId} after their first message`);
        }
        
        // Remove from pending queue
        pendingWelcomeMessages.delete(guestId);
      }
      
      // Send to all connected admins with guestId for proper conversation targeting
      let adminNotified = false;
      wss.adminConnections.forEach((adminWs) => {
        if (adminWs.readyState === WebSocket.OPEN) {
          adminWs.send(JSON.stringify({
            ...helpChatMessageData,
            conversationUpdate: true // Flag to indicate this is a conversation update
          }));
          adminNotified = true;
        }
      });
      
      console.log(`📨 Help chat message from guest ${guestId} broadcasted to ${adminNotified ? 'admins' : 'no admins online'}`);
    } else if (sender === 'admin') {
      // For admin messages, check if there's an assigned agent for this conversation
      let assignedAgentId = null;
      
      try {
        const existingAgentMessage = await db
          .select()
          .from(helpChatMessages)
          .where(
            and(
              eq(helpChatMessages.guestId, guestId),
              eq(helpChatMessages.sender, 'admin'),
              like(helpChatMessages.message, '%joined the chat')
            )
          )
          .limit(1);

        if (existingAgentMessage.length > 0 && existingAgentMessage[0].agentId) {
          // Use the agentId from the existing message instead of hardcoded lookup
          assignedAgentId = existingAgentMessage[0].agentId.toString();
        }
      } catch (error) {
        console.log('Could not determine assigned agent, using default');
      }
      
      // Send to specific guest with agent info
      const guestWs = wss.guestConnections.get(guestId);
      if (guestWs && guestWs.readyState === WebSocket.OPEN) {
        guestWs.send(JSON.stringify({
          ...helpChatMessageData,
          agentId: assignedAgentId // Include the assigned agent ID
        }));
        console.log(`📨 Help chat reply sent to guest ${guestId}`);
      } else {
        console.log(`❌ Guest ${guestId} not connected`);
      }
      
      // Also notify all admins about the admin reply for conversation list updates
      wss.adminConnections.forEach((adminWs) => {
        if (adminWs.readyState === WebSocket.OPEN) {
          adminWs.send(JSON.stringify({
            ...helpChatMessageData,
            conversationUpdate: true // Flag to indicate this is a conversation update
          }));
        }
      });
    }

    // Confirm to sender
    ws.send(JSON.stringify({
      type: 'help_chat_message_sent',
      data: helpChatMessageData
    }));
    
    // 🔒 SECURE CACHE INVALIDATION: Only notify admins about conversation updates
    // Send lightweight cache invalidation event to admins for conversation list updates
    wss.adminConnections.forEach((adminWs) => {
      if (adminWs.readyState === WebSocket.OPEN) {
        adminWs.send(JSON.stringify({
          type: 'unified_conversation_update',
          conversationType: 'support',
          guestId: guestId,
          hasNewMessage: true,
          timestamp: helpChatMessageData.timestamp
        }));
      }
    });

  } catch (error) {
    console.error('Error sending help chat message:', error);
    ws.send(JSON.stringify({ 
      type: 'help_chat_error', 
      message: 'Failed to send message' 
    }));
  }
}

// Help Chat Typing Indicator
async function handleHelpChatTyping(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { guestId, isTyping, sender } = message;
  
  if (!guestId || typeof isTyping !== 'boolean' || !sender) {
    return;
  }

  // Get admin information for typing indicator based on role
  let agentName = null;
  let agentAvatar = null;
  if (sender === 'admin') {
    const userRole = (ws as any).userRole;
    const userProfile = (ws as any).userProfile;
    
    // LOGIC SPLIT: Admin vs Customer Service
    if (userRole === 'customer_service' || userRole === 'moderator') {
      // CUSTOMER SERVICE → Use REAL user's profile
      agentName = userProfile?.name || 'Support Agent';
      agentAvatar = userProfile?.avatarUrl || '👤';
    } else if (userRole === 'admin') {
      // ADMIN → Use support agent from conversationAgents map
      const assignedAgent = conversationAgents.get(guestId);
      if (assignedAgent) {
        agentName = assignedAgent.name;
        agentAvatar = assignedAgent.avatarUrl;
      } else {
        // Fallback: get from database if not in memory
        try {
          const existingSession = await db
            .select()
            .from(supportChatSessions)
            .where(eq(supportChatSessions.guestId, guestId))
            .limit(1);
            
          if (existingSession.length > 0 && existingSession[0].assignedAgentId) {
            const agent = await db
              .select()
              .from(supportAgents)
              .where(eq(supportAgents.id, existingSession[0].assignedAgentId))
              .limit(1);
              
            if (agent.length > 0) {
              agentName = agent[0].name;
              agentAvatar = agent[0].avatarUrl;
            }
          }
        } catch (error) {
          console.error('Error getting assigned agent for typing indicator:', error);
        }
      }
      
      // Fallback to generic support if no agent found
      if (!agentName) {
        agentName = 'Support';
      }
    }
  }

  const typingData = {
    type: 'help_chat_typing',
    guestId: guestId,
    isTyping: isTyping,
    sender: sender,
    adminName: agentName, // Include assigned agent name for visitor display
    adminAvatar: agentAvatar // Include assigned agent avatar
  };

  // Broadcast typing indicator based on sender type
  if (sender === 'visitor') {
    // Send to all connected admins
    wss.adminConnections.forEach((adminWs) => {
      if (adminWs.readyState === WebSocket.OPEN) {
        adminWs.send(JSON.stringify(typingData));
      }
    });
    console.log(`⌨️ Guest ${guestId} typing indicator sent to admins`);
  } else if (sender === 'admin') {
    // Send to specific guest with assigned agent info
    const guestWs = wss.guestConnections.get(guestId);
    if (guestWs && guestWs.readyState === WebSocket.OPEN) {
      guestWs.send(JSON.stringify(typingData));
      console.log(`⌨️ Agent ${agentName} typing indicator sent to guest ${guestId}`);
    }
  }
}

// Admin Join Conversation - Show REAL customer service user's name and profile
async function handleAdminJoinConversation(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { guestId, selectedAgentId } = message;
  
  if (!guestId) {
    ws.send(JSON.stringify({ 
      type: 'admin_join_error', 
      message: 'Missing guestId' 
    }));
    return;
  }

  // Verify permissions - allow admin, customer_service, and moderator roles
  const userRole = (ws as any).userRole;
  const userProfile = (ws as any).userProfile;
  
  if (!['admin', 'customer_service', 'moderator'].includes(userRole)) {
    ws.send(JSON.stringify({ 
      type: 'admin_join_error', 
      message: 'Access denied. Admin, customer service, or moderator privileges required.' 
    }));
    return;
  }

  try {
    // LOGIC SPLIT: Admin vs Customer Service
    // - ADMIN role → Assign from support_agents table
    // - CUSTOMER_SERVICE role → Use REAL logged-in user's profile
    
    if (userRole === 'customer_service' || userRole === 'moderator') {
      // USE REAL CUSTOMER SERVICE USER'S PROFILE
      const realUserName = userProfile?.name || 'Support Agent';
      const realUserAvatar = userProfile?.avatarUrl || null;
      const realUserId = userProfile?.userId; // Profile UUID
      
      console.log(`👨‍💼 Customer Service "${realUserName}" joining conversation with guest ${guestId}`);

      // Create join message with REAL user's name and avatar
      const joinMessage = await db.insert(helpChatMessages).values({
        guestId: guestId,
        message: `${realUserName} joined the chat`,
        sender: 'admin',
        isAutoMessage: true
      }).returning();

      // Send join message to guest with REAL user info
      const guestWs = wss.guestConnections.get(guestId);
      if (guestWs && guestWs.readyState === WebSocket.OPEN) {
        guestWs.send(JSON.stringify({
          type: 'help_chat_message',
          id: joinMessage[0].id,
          message: joinMessage[0].message,
          sender: 'admin',
          timestamp: joinMessage[0].createdAt,
          adminName: realUserName,
          adminAvatar: realUserAvatar || '👤',
          isAutoMessage: true,
          guestId: guestId
        }));
      }

      // Notify all admins about the customer service user joining
      wss.adminConnections.forEach((adminWs) => {
        if (adminWs.readyState === WebSocket.OPEN) {
          adminWs.send(JSON.stringify({
            type: 'help_chat_message',
            id: joinMessage[0].id,
            message: joinMessage[0].message,
            sender: 'admin',
            timestamp: joinMessage[0].createdAt,
            adminName: realUserName,
            adminAvatar: realUserAvatar || '👤',
            isAutoMessage: true,
            guestId: guestId,
            conversationUpdate: true
          }));
        }
      });

      // Store REAL user info in conversation map
      conversationAgents.set(guestId, {
        id: realUserId || 'customer_service',
        name: realUserName,
        avatarUrl: realUserAvatar || undefined
      });

      console.log(`✅ Customer service user ${realUserName} joined conversation with guest ${guestId}`);
      
      // Confirm to the customer service user
      ws.send(JSON.stringify({
        type: 'admin_join_success',
        guestId: guestId,
        assignedAgent: {
          name: realUserName,
          avatarUrl: realUserAvatar
        },
        message: `You (${realUserName}) have joined this conversation`
      }));
      
    } else if (userRole === 'admin') {
      // ADMIN ROLE → Use support_agents table assignment
      console.log(`🔧 Admin opening chat - assigning support agent from database for guest ${guestId}`);
      
      // Fetch active support agents from database
      const activeSupportAgents = await db
        .select()
        .from(supportAgents)
        .where(eq(supportAgents.isActive, true))
        .orderBy(asc(supportAgents.sortOrder), asc(supportAgents.name));

      if (activeSupportAgents.length === 0) {
        console.log('⚠️ No active support agents found in database');
        ws.send(JSON.stringify({
          type: 'admin_join_error',
          message: 'No active support agents available. Please create support agents first.'
        }));
        return;
      }

      // Check if this conversation already has an assigned agent
      const existingSession = await db
        .select()
        .from(supportChatSessions)
        .where(eq(supportChatSessions.guestId, guestId))
        .limit(1);

      // Select agent from support_agents table
      let selectedAgent;
      if (selectedAgentId) {
        selectedAgent = activeSupportAgents.find((agent: any) => agent.id.toString() === selectedAgentId.toString());
        if (!selectedAgent) {
          selectedAgent = activeSupportAgents[Math.floor(Math.random() * activeSupportAgents.length)];
          console.log(`⚠️ Invalid selectedAgentId ${selectedAgentId}, falling back to random agent ${selectedAgent.name}`);
        } else {
          console.log(`🎯 Manual agent selection: ${selectedAgent.name} for guest ${guestId}`);
        }
      } else {
        selectedAgent = activeSupportAgents[Math.floor(Math.random() * activeSupportAgents.length)];
        console.log(`🎲 Random agent assignment: ${selectedAgent.name} for guest ${guestId}`);
      }
      
      // Create or update support chat session
      if (existingSession.length === 0) {
        await db.insert(supportChatSessions).values({
          guestId: guestId,
          assignedAgentId: selectedAgent.id,
          isActive: true,
          sessionStartedAt: new Date(),
          lastActivityAt: new Date()
        });
      } else {
        await db.update(supportChatSessions)
          .set({ 
            assignedAgentId: selectedAgent.id,
            lastActivityAt: new Date()
          })
          .where(eq(supportChatSessions.guestId, guestId));
      }

      // Create join message with assigned support agent
      const joinMessage = await db.insert(helpChatMessages).values({
        guestId: guestId,
        message: `${selectedAgent.name} joined the chat`,
        sender: 'admin',
        agentId: selectedAgent.id,
        isAutoMessage: true
      }).returning();

      // Send join message to guest
      const guestWs = wss.guestConnections.get(guestId);
      if (guestWs && guestWs.readyState === WebSocket.OPEN) {
        guestWs.send(JSON.stringify({
          type: 'help_chat_message',
          id: joinMessage[0].id,
          message: joinMessage[0].message,
          sender: 'admin',
          timestamp: joinMessage[0].createdAt,
          adminName: selectedAgent.name,
          adminAvatar: selectedAgent.avatarUrl || '👤',
          agentId: selectedAgent.id.toString(),
          isAutoMessage: true,
          guestId: guestId
        }));
      }

      // Notify all admins
      wss.adminConnections.forEach((adminWs) => {
        if (adminWs.readyState === WebSocket.OPEN) {
          adminWs.send(JSON.stringify({
            type: 'help_chat_message',
            id: joinMessage[0].id,
            message: joinMessage[0].message,
            sender: 'admin',
            timestamp: joinMessage[0].createdAt,
            adminName: selectedAgent.name,
            adminAvatar: selectedAgent.avatarUrl || '👤',
            agentId: selectedAgent.id.toString(),
            isAutoMessage: true,
            guestId: guestId,
            conversationUpdate: true
          }));
        }
      });

      // Store assignment in conversation map
      conversationAgents.set(guestId, {
        id: selectedAgent.id.toString(),
        name: selectedAgent.name,
        avatarUrl: selectedAgent.avatarUrl || undefined
      });

      console.log(`🎯 Admin assigned ${selectedAgent.name} to help chat conversation for guest ${guestId}`);
      
      // Confirm to the admin
      ws.send(JSON.stringify({
        type: 'admin_join_success',
        guestId: guestId,
        assignedAgent: selectedAgent,
        message: `${selectedAgent.name} has been assigned to this conversation`
      }));
    }

  } catch (error) {
    console.error('Error in handleAdminJoinConversation:', error);
    ws.send(JSON.stringify({ 
      type: 'admin_join_error', 
      message: 'Failed to join conversation' 
    }));
  }
}

// Handle admin/customer service leaving conversation - Show REAL user's name when customer service leaves
async function handleAdminLeaveConversation(ws: WebSocket, message: any, wss: AppWebSocketServer) {
  const { guestId } = message;
  
  if (!guestId) {
    ws.send(JSON.stringify({ 
      type: 'admin_leave_error', 
      message: 'Missing guestId' 
    }));
    return;
  }

  // Verify permissions
  const userRole = (ws as any).userRole;
  const userProfile = (ws as any).userProfile;
  
  if (!['admin', 'customer_service', 'moderator'].includes(userRole)) {
    ws.send(JSON.stringify({ 
      type: 'admin_leave_error', 
      message: 'Access denied. Admin, customer service, or moderator privileges required.' 
    }));
    return;
  }
  
  console.log(`👋 ${userRole} user leaving conversation with guest ${guestId}`);

  try {
    // LOGIC SPLIT: Customer Service vs Admin
    // - CUSTOMER_SERVICE role → Use REAL user's name from profile
    // - ADMIN role → Use support agent from memory/database
    
    if (userRole === 'customer_service' || userRole === 'moderator') {
      // CUSTOMER SERVICE LEAVING - Use REAL user's profile
      const realUserName = userProfile?.name || 'Support Agent';
      const realUserAvatar = userProfile?.avatarUrl || null;
      
      console.log(`👋 Customer Service "${realUserName}" leaving conversation with guest ${guestId}`);

      // Clear conversation agent mapping
      conversationAgents.delete(guestId);

      // Create leave message with REAL user's name
      const leaveMessage = await db.insert(helpChatMessages).values({
        guestId: guestId,
        message: `${realUserName} left the chat`,
        sender: 'admin',
        isAutoMessage: true
      }).returning();

      // Send leave message to guest with REAL user info
      const guestWs = wss.guestConnections.get(guestId);
      if (guestWs && guestWs.readyState === WebSocket.OPEN) {
        guestWs.send(JSON.stringify({
          type: 'help_chat_message',
          id: leaveMessage[0].id,
          message: leaveMessage[0].message,
          sender: 'admin',
          timestamp: leaveMessage[0].createdAt,
          adminName: realUserName,
          adminAvatar: realUserAvatar || '👤',
          isAutoMessage: true,
          guestId: guestId
        }));
        console.log(`📨 Leave message sent to guest ${guestId} for customer service user ${realUserName}`);
      }

      // Notify all admins
      wss.adminConnections.forEach((adminWs) => {
        if (adminWs.readyState === WebSocket.OPEN) {
          adminWs.send(JSON.stringify({
            type: 'help_chat_message',
            id: leaveMessage[0].id,
            message: leaveMessage[0].message,
            sender: 'admin',
            timestamp: leaveMessage[0].createdAt,
            adminName: realUserName,
            adminAvatar: realUserAvatar || '👤',
            isAutoMessage: true,
            guestId: guestId,
            conversationUpdate: true
          }));
          
          // Notify assignment cleared
          adminWs.send(JSON.stringify({
            type: 'conversation_assignment_cleared',
            guestId: guestId,
            previousAgent: { name: realUserName, avatarUrl: realUserAvatar }
          }));
        }
      });

      console.log(`✅ Customer service user ${realUserName} left conversation with guest ${guestId}`);
      
      // Confirm to the customer service user
      ws.send(JSON.stringify({
        type: 'admin_leave_success',
        guestId: guestId,
        message: `You (${realUserName}) have left the conversation`
      }));
      
    } else if (userRole === 'admin') {
      // ADMIN LEAVING - Use support agent from memory/database
      const assignedAgentFromMemory = conversationAgents.get(guestId);
      
      // Check database for assigned agent
      const existingSession = await db
        .select({
          assignedAgentId: supportChatSessions.assignedAgentId
        })
        .from(supportChatSessions)
        .where(eq(supportChatSessions.guestId, guestId))
        .limit(1);

      let agentInfo = null;
      let agentName = 'The agent';
      
      // Try to get agent info from memory first
      if (assignedAgentFromMemory) {
        agentInfo = assignedAgentFromMemory;
        agentName = assignedAgentFromMemory.name;
        console.log(`📋 Using agent info from memory: ${agentName}`);
      } else if (existingSession.length > 0 && existingSession[0].assignedAgentId) {
        // Fetch agent info from database if not in memory
        const dbAgent = await db
          .select({
            id: supportAgents.id,
            name: supportAgents.name,
            avatarUrl: supportAgents.avatarUrl
          })
          .from(supportAgents)
          .where(eq(supportAgents.id, existingSession[0].assignedAgentId))
          .limit(1);
          
        if (dbAgent.length > 0) {
          agentInfo = {
            id: dbAgent[0].id.toString(),
            name: dbAgent[0].name,
            avatarUrl: dbAgent[0].avatarUrl || undefined
          };
          agentName = dbAgent[0].name;
          console.log(`📋 Fetched agent info from DB: ${agentName}`);
        }
      }

      // Clear the agent assignment from memory and database
      if (assignedAgentFromMemory) {
        conversationAgents.delete(guestId);
      }
      
      if (existingSession.length > 0) {
        await db.update(supportChatSessions)
          .set({ 
            assignedAgentId: null,
            lastActivityAt: new Date()
          })
          .where(eq(supportChatSessions.guestId, guestId));
        console.log(`🗂️ Cleared DB assignment for guest ${guestId}`);
      }

      // Create and save the admin leave message
      if (agentInfo || (existingSession.length > 0 && existingSession[0].assignedAgentId)) {
        const leaveMessage = await db.insert(helpChatMessages).values({
          guestId: guestId,
          message: `${agentName} left the chat`,
          sender: 'admin',
          agentId: agentInfo?.id ? (Number.isInteger(+agentInfo.id) ? +agentInfo.id : null) : null,
          isAutoMessage: true
        }).returning();

        // Send leave message to guest
        const guestWs = wss.guestConnections.get(guestId);
        if (guestWs && guestWs.readyState === WebSocket.OPEN) {
          guestWs.send(JSON.stringify({
            type: 'help_chat_message',
            id: leaveMessage[0].id,
            message: leaveMessage[0].message,
            sender: 'admin',
            timestamp: leaveMessage[0].createdAt,
            adminName: agentName,
            adminAvatar: agentInfo?.avatarUrl || '👤',
            agentId: agentInfo?.id || null,
            isAutoMessage: true,
            guestId: guestId
          }));
          console.log(`📨 Leave message sent to guest ${guestId} for agent ${agentName}`);
        }

        // Notify all admins
        wss.adminConnections.forEach((adminWs) => {
          if (adminWs.readyState === WebSocket.OPEN) {
            adminWs.send(JSON.stringify({
              type: 'help_chat_message',
              id: leaveMessage[0].id,
              message: leaveMessage[0].message,
              sender: 'admin',
              timestamp: leaveMessage[0].createdAt,
              adminName: agentName,
              adminAvatar: agentInfo?.avatarUrl || '👤',
              agentId: agentInfo?.id || null,
              isAutoMessage: true,
              guestId: guestId,
              conversationUpdate: true
            }));
            
            // Send explicit assignment cleared notification
            adminWs.send(JSON.stringify({
              type: 'conversation_assignment_cleared',
              guestId: guestId,
              previousAgent: agentInfo
            }));
          }
        });

        console.log(`👋 Agent ${agentName} left conversation with guest ${guestId} - assignment cleared`);
      }
      
      // Confirm to the admin
      ws.send(JSON.stringify({
        type: 'admin_leave_success',
        guestId: guestId,
        message: `You have left the conversation with ${guestId}`
      }));
    }

  } catch (error) {
    console.error('Error in handleAdminLeaveConversation:', error);
    ws.send(JSON.stringify({ 
      type: 'admin_leave_error', 
      message: 'Failed to leave conversation' 
    }));
  }
}