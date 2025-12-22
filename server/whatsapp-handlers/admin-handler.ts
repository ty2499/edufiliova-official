import { db } from '../db';
import { 
  users, 
  profiles, 
  whatsappConversations,
  courses,
  products,
  shopSupportTickets,
  adminAuditLogs,
  type WhatsAppConversation
} from '@shared/schema';
import { eq, and, desc, sql, count, isNull, or } from 'drizzle-orm';
import * as whatsappService from '../whatsapp-service';
import * as chatbot from '../whatsapp-chatbot';
import type { FlowState, ParsedMessage } from '../whatsapp-chatbot';
import crypto from 'crypto';

const ADMIN_SECRET = process.env.WHATSAPP_ADMIN_SECRET || 'edufiliova#admin2024';
const MAX_FAILED_ATTEMPTS = 3;
const ADMIN_SESSION_TIMEOUT = 15 * 60 * 1000;

const failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return crypto.timingSafeEqual(
      Buffer.from(a.padEnd(Math.max(a.length, b.length))),
      Buffer.from(b.padEnd(Math.max(a.length, b.length)))
    );
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function checkAdminSecretWithRateLimit(phone: string, text: string): { isSecret: boolean; isRateLimited: boolean } {
  const trimmedText = text.trim();
  
  // Only check admin secret if text looks like it could be an admin secret attempt
  // Admin secrets typically have special patterns - don't count regular commands as failed attempts
  const looksLikeSecretAttempt = trimmedText.includes('#') || 
                                   trimmedText.toLowerCase().includes('admin') ||
                                   trimmedText.length > 15;
  
  // If it doesn't look like a secret attempt, skip rate limiting check entirely
  if (!looksLikeSecretAttempt) {
    return { isSecret: false, isRateLimited: false };
  }
  
  // Only apply rate limiting for suspected secret attempts
  if (isRateLimited(phone)) {
    return { isSecret: false, isRateLimited: true };
  }
  
  const isMatch = constantTimeCompare(trimmedText, ADMIN_SECRET);
  
  if (!isMatch) {
    // Only record failed attempt if it looked like a secret attempt but was wrong
    recordFailedAttempt(phone);
  } else {
    clearFailedAttempts(phone);
  }
  
  return { isSecret: isMatch, isRateLimited: false };
}

export function isAdminSecret(text: string): boolean {
  return constantTimeCompare(text.trim(), ADMIN_SECRET);
}

export function isRateLimited(phone: string): boolean {
  const attempt = failedAttempts.get(phone);
  if (!attempt) return false;
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (attempt.lastAttempt < fiveMinutesAgo) {
    failedAttempts.delete(phone);
    return false;
  }
  
  return attempt.count >= MAX_FAILED_ATTEMPTS;
}

export function recordFailedAttempt(phone: string): void {
  const attempt = failedAttempts.get(phone) || { count: 0, lastAttempt: new Date() };
  attempt.count++;
  attempt.lastAttempt = new Date();
  failedAttempts.set(phone, attempt);
}

export function clearFailedAttempts(phone: string): void {
  failedAttempts.delete(phone);
}

async function logAdminAction(
  adminUserId: string,
  action: string,
  targetId: string | null,
  details: Record<string, any>
): Promise<void> {
  try {
    await db.insert(adminAuditLogs).values({
      adminUserId,
      action,
      targetUserId: targetId,
      details,
      channel: 'whatsapp'
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
  console.log(`🔐 ADMIN ACTION: ${action} by ${adminUserId} on ${targetId}`, details);
}

export async function verifyAdminAccess(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId)
  });
  
  return profile?.role === 'admin';
}

export async function handleAdminSecretEntry(
  phone: string,
  conversation: WhatsAppConversation,
  text: string
): Promise<boolean> {
  const isAdmin = await verifyAdminAccess(conversation.userId || '');
  
  if (!isAdmin) {
    await whatsappService.sendTextMessage(
      phone,
      "Access denied. You don't have admin privileges."
    );
    return true;
  }

  await chatbot.updateConversationFlow(conversation.id, 'admin_menu', {
    adminSessionStart: new Date()
  });
  
  await sendAdminMenu(phone);
  return true;
}

export function isAdminSessionExpired(flowState: FlowState | null): boolean {
  if (!flowState?.data?.adminSessionStart) return true;
  const sessionStart = new Date(flowState.data.adminSessionStart).getTime();
  return Date.now() - sessionStart > ADMIN_SESSION_TIMEOUT;
}

export async function sendAdminMenu(phone: string): Promise<void> {
  await whatsappService.sendListMessage(
    phone,
    "🔐 *Admin Control Panel*\n\nSelect an action to perform:",
    'Admin Actions',
    [{
      title: 'User Management',
      rows: [
        { id: 'adm_block', title: 'Block User', description: 'Block a user from the platform' },
        { id: 'adm_unblock', title: 'Unblock User', description: 'Unblock a blocked user' },
        { id: 'adm_delete', title: 'Delete User', description: 'Permanently delete a user' },
        { id: 'adm_view_user', title: 'View User Info', description: 'Get user details' }
      ]
    }, {
      title: 'Support & Notifications',
      rows: [
        { id: 'adm_tickets', title: 'Support Tickets', description: 'View pending support tickets' },
        { id: 'adm_broadcast', title: 'Broadcast Alert', description: 'Send message to all users' }
      ]
    }, {
      title: 'System',
      rows: [
        { id: 'adm_stats', title: 'System Stats', description: 'View platform statistics' },
        { id: 'adm_audit', title: 'Recent Actions', description: 'View admin audit log' },
        { id: 'adm_exit', title: 'Exit Admin Mode', description: 'Return to normal menu' }
      ]
    }],
    '🔐 Admin Panel'
  );
}

export async function handleAdminMenuSelection(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const flowState = conversation.flowState as FlowState;
  const sessionStart = flowState?.data?.adminSessionStart;
  
  if (sessionStart && new Date().getTime() - new Date(sessionStart).getTime() > ADMIN_SESSION_TIMEOUT) {
    await whatsappService.sendTextMessage(phone, "Admin session expired. Please re-authenticate.");
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    await chatbot.sendNewUserMenu(phone);
    return;
  }

  const selection = message.listId || message.buttonId || message.text?.toLowerCase();

  switch (selection) {
    case 'adm_block':
      await chatbot.updateConversationFlow(conversation.id, 'admin_block_user', flowState.data);
      await whatsappService.sendTextMessage(
        phone,
        "Enter the email or phone number of the user you want to block:"
      );
      break;

    case 'adm_unblock':
      await chatbot.updateConversationFlow(conversation.id, 'admin_unblock_user', flowState.data);
      await whatsappService.sendTextMessage(
        phone,
        "Enter the email or phone number of the user you want to unblock:"
      );
      break;

    case 'adm_delete':
      await chatbot.updateConversationFlow(conversation.id, 'admin_delete_user', flowState.data);
      await whatsappService.sendTextMessage(
        phone,
        "⚠️ *WARNING: This action cannot be undone!*\n\nEnter the email or phone number of the user you want to delete:"
      );
      break;

    case 'adm_view_user':
      await chatbot.updateConversationFlow(conversation.id, 'admin_block_user', { ...flowState.data, viewOnly: true });
      await whatsappService.sendTextMessage(
        phone,
        "Enter the email or phone number of the user you want to view:"
      );
      break;

    case 'adm_stats':
      await handleSystemStats(phone, conversation);
      break;

    case 'adm_tickets':
      await handleSupportTickets(phone, conversation);
      break;

    case 'adm_audit':
      await handleAuditLog(phone, conversation);
      break;

    case 'adm_broadcast':
      await chatbot.updateConversationFlow(conversation.id, 'admin_broadcast', flowState.data);
      await whatsappService.sendTextMessage(
        phone,
        "Enter the message you want to broadcast to all WhatsApp users:\n\n(Type CANCEL to abort)"
      );
      break;

    case 'adm_exit':
      await chatbot.updateConversationFlow(conversation.id, 'idle', {});
      await whatsappService.sendTextMessage(phone, "Exited admin mode.");
      
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, conversation.userId!)
      });
      await chatbot.sendStudentMenu(phone, profile?.name || 'Admin');
      break;

    default:
      await sendAdminMenu(phone);
  }
}

async function handleSupportTickets(phone: string, conversation: WhatsAppConversation): Promise<void> {
  const flowState = conversation.flowState as FlowState;
  
  const openTickets = await db.query.shopSupportTickets.findMany({
    where: or(
      eq(shopSupportTickets.status, 'open'),
      eq(shopSupportTickets.status, 'pending')
    ),
    orderBy: [desc(shopSupportTickets.createdAt)],
    limit: 10
  });

  if (openTickets.length === 0) {
    await whatsappService.sendTextMessage(
      phone,
      "🎫 *Support Tickets*\n\n✅ No open tickets at the moment!"
    );
  } else {
    let ticketList = "🎫 *Open Support Tickets*\n\n";
    
    for (const ticket of openTickets) {
      const statusEmoji = ticket.status === 'open' ? '🔴' : '🟡';
      const priorityEmoji = ticket.priority === 'high' ? '🔥' : ticket.priority === 'medium' ? '⚠️' : '📝';
      ticketList += `${statusEmoji} *#${ticket.id.slice(0, 8)}*\n`;
      ticketList += `   ${priorityEmoji} ${ticket.subject}\n`;
      ticketList += `   📅 ${new Date(ticket.createdAt).toLocaleDateString()}\n\n`;
    }
    
    ticketList += `\n📊 Total open: ${openTickets.length} ticket(s)`;
    
    await whatsappService.sendTextMessage(phone, ticketList);
  }

  await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
  await sendAdminMenu(phone);
}

async function handleAuditLog(phone: string, conversation: WhatsAppConversation): Promise<void> {
  const flowState = conversation.flowState as FlowState;
  
  const recentActions = await db.query.adminAuditLogs.findMany({
    orderBy: [desc(adminAuditLogs.createdAt)],
    limit: 10
  });

  if (recentActions.length === 0) {
    await whatsappService.sendTextMessage(
      phone,
      "📋 *Admin Audit Log*\n\nNo admin actions recorded yet."
    );
  } else {
    let auditList = "📋 *Recent Admin Actions*\n\n";
    
    for (const action of recentActions) {
      const actionEmoji = 
        action.action.includes('BLOCK') ? '🚫' :
        action.action.includes('UNBLOCK') ? '✅' :
        action.action.includes('DELETE') ? '🗑️' :
        action.action.includes('BROADCAST') ? '📢' : '⚡';
      
      auditList += `${actionEmoji} *${action.action}*\n`;
      auditList += `   📅 ${new Date(action.createdAt).toLocaleString()}\n`;
      if (action.targetUserId) {
        auditList += `   🎯 Target: ${action.targetUserId.slice(0, 8)}...\n`;
      }
      auditList += `\n`;
    }
    
    await whatsappService.sendTextMessage(phone, auditList);
  }

  await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
  await sendAdminMenu(phone);
}

async function findUserByEmailOrPhone(query: string): Promise<{ user: any; profile: any } | null> {
  const normalizedQuery = query.replace(/\+/g, '').trim();
  
  let profile = await db.query.profiles.findFirst({
    where: eq(profiles.email, query.trim())
  });

  if (!profile) {
    profile = await db.query.profiles.findFirst({
      where: eq(profiles.phoneNumber, normalizedQuery)
    });
  }

  if (!profile) {
    profile = await db.query.profiles.findFirst({
      where: eq(profiles.phoneNumber, `+${normalizedQuery}`)
    });
  }

  if (!profile) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, profile.userId)
  });

  return user ? { user, profile } : null;
}

export async function handleBlockUser(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const text = message.text?.trim() || '';
  const flowState = conversation.flowState as FlowState;

  if (text.toLowerCase() === 'cancel') {
    await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
    await sendAdminMenu(phone);
    return;
  }

  const result = await findUserByEmailOrPhone(text);

  if (!result) {
    await whatsappService.sendTextMessage(phone, "User not found. Please try again or type CANCEL to go back.");
    return;
  }

  const { user, profile } = result;

  if (flowState.data.viewOnly) {
    const blockedStatus = user.isBlocked ? '🚫 BLOCKED' : '✅ Active';
    await whatsappService.sendTextMessage(
      phone,
      `*User Information*\n\n` +
      `👤 Name: ${profile.name}\n` +
      `📧 Email: ${profile.email || 'N/A'}\n` +
      `📱 Phone: ${profile.phoneNumber || 'N/A'}\n` +
      `🎭 Role: ${profile.role}\n` +
      `📊 Status: ${blockedStatus}\n` +
      `📅 Joined: ${new Date(user.createdAt).toLocaleDateString()}`
    );
    await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
    await sendAdminMenu(phone);
    return;
  }

  await chatbot.updateConversationFlow(conversation.id, 'admin_block_confirm', {
    ...flowState.data,
    targetUserId: user.id,
    targetUserName: profile.name,
    targetUserEmail: profile.email
  });

  await whatsappService.sendButtonMessage(
    phone,
    `Are you sure you want to block this user?\n\n👤 Name: ${profile.name}\n📧 Email: ${profile.email || 'N/A'}\n🎭 Role: ${profile.role}`,
    [
      { id: 'confirm_block', title: 'Yes, Block User' },
      { id: 'cancel_block', title: 'Cancel' }
    ],
    '⚠️ Confirm Block'
  );
}

export async function handleBlockConfirm(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.buttonId || message.text?.toLowerCase();
  const flowState = conversation.flowState as FlowState;

  if (selection === 'confirm_block' || selection === 'yes') {
    const targetUserId = flowState.data.targetUserId;

    await db.update(users)
      .set({ isBlocked: true, updatedAt: new Date() })
      .where(eq(users.id, targetUserId));

    await logAdminAction(
      conversation.userId!,
      'BLOCK_USER',
      targetUserId,
      { userName: flowState.data.targetUserName, email: flowState.data.targetUserEmail }
    );

    await whatsappService.sendTextMessage(
      phone,
      `✅ User "${flowState.data.targetUserName}" has been blocked successfully.`
    );
  } else {
    await whatsappService.sendTextMessage(phone, "Block action cancelled.");
  }

  await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
  await sendAdminMenu(phone);
}

export async function handleUnblockUser(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const text = message.text?.trim() || '';
  const flowState = conversation.flowState as FlowState;

  if (text.toLowerCase() === 'cancel') {
    await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
    await sendAdminMenu(phone);
    return;
  }

  const result = await findUserByEmailOrPhone(text);

  if (!result) {
    await whatsappService.sendTextMessage(phone, "User not found. Please try again or type CANCEL to go back.");
    return;
  }

  const { user, profile } = result;

  if (!user.isBlocked) {
    await whatsappService.sendTextMessage(phone, `User "${profile.name}" is not blocked.`);
    await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
    await sendAdminMenu(phone);
    return;
  }

  await db.update(users)
    .set({ isBlocked: false, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await logAdminAction(
    conversation.userId!,
    'UNBLOCK_USER',
    user.id,
    { userName: profile.name, email: profile.email }
  );

  await whatsappService.sendTextMessage(
    phone,
    `✅ User "${profile.name}" has been unblocked successfully.`
  );

  await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
  await sendAdminMenu(phone);
}

export async function handleDeleteUser(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const text = message.text?.trim() || '';
  const flowState = conversation.flowState as FlowState;

  if (text.toLowerCase() === 'cancel') {
    await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
    await sendAdminMenu(phone);
    return;
  }

  const result = await findUserByEmailOrPhone(text);

  if (!result) {
    await whatsappService.sendTextMessage(phone, "User not found. Please try again or type CANCEL to go back.");
    return;
  }

  const { user, profile } = result;

  await chatbot.updateConversationFlow(conversation.id, 'admin_delete_confirm', {
    ...flowState.data,
    targetUserId: user.id,
    targetUserName: profile.name,
    targetUserEmail: profile.email
  });

  await whatsappService.sendButtonMessage(
    phone,
    `⚠️ *DANGER: This action CANNOT be undone!*\n\nYou are about to PERMANENTLY DELETE:\n\n👤 Name: ${profile.name}\n📧 Email: ${profile.email || 'N/A'}\n🎭 Role: ${profile.role}\n\nAll user data will be lost forever.`,
    [
      { id: 'confirm_delete', title: '⚠️ DELETE FOREVER' },
      { id: 'cancel_delete', title: 'Cancel' }
    ],
    '🗑️ Confirm Delete'
  );
}

export async function handleDeleteConfirm(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.buttonId || message.text?.toLowerCase();
  const flowState = conversation.flowState as FlowState;

  if (selection === 'confirm_delete') {
    const targetUserId = flowState.data.targetUserId;

    await db.update(users)
      .set({ isActive: false, isBlocked: true, updatedAt: new Date() })
      .where(eq(users.id, targetUserId));

    await db.update(profiles)
      .set({ 
        name: '[DELETED]',
        email: null,
        phoneNumber: null,
        updatedAt: new Date()
      })
      .where(eq(profiles.userId, targetUserId));

    await logAdminAction(
      conversation.userId!,
      'DELETE_USER',
      targetUserId,
      { userName: flowState.data.targetUserName, email: flowState.data.targetUserEmail }
    );

    await whatsappService.sendTextMessage(
      phone,
      `🗑️ User "${flowState.data.targetUserName}" has been deleted.`
    );
  } else {
    await whatsappService.sendTextMessage(phone, "Delete action cancelled.");
  }

  await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
  await sendAdminMenu(phone);
}

async function handleSystemStats(phone: string, conversation: WhatsAppConversation): Promise<void> {
  const flowState = conversation.flowState as FlowState;

  const [userStats] = await db.select({ count: count() }).from(users);
  const [blockedStats] = await db.select({ count: count() }).from(users).where(eq(users.isBlocked, true));
  const [courseStats] = await db.select({ count: count() }).from(courses);
  const [productStats] = await db.select({ count: count() }).from(products);
  const [waConvStats] = await db.select({ count: count() }).from(whatsappConversations);

  const statsMessage = 
    `📊 *System Statistics*\n\n` +
    `👥 Total Users: ${userStats.count}\n` +
    `🚫 Blocked Users: ${blockedStats.count}\n` +
    `📚 Total Courses: ${courseStats.count}\n` +
    `🛍️ Total Products: ${productStats.count}\n` +
    `📱 WhatsApp Conversations: ${waConvStats.count}\n` +
    `\n📅 Generated: ${new Date().toLocaleString()}`;

  await whatsappService.sendTextMessage(phone, statsMessage);

  await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
  await sendAdminMenu(phone);
}

export async function handleBroadcast(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const text = message.text?.trim() || '';
  const flowState = conversation.flowState as FlowState;

  if (text.toLowerCase() === 'cancel') {
    await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
    await whatsappService.sendTextMessage(phone, "Broadcast cancelled.");
    await sendAdminMenu(phone);
    return;
  }

  await chatbot.updateConversationFlow(conversation.id, 'admin_broadcast_confirm', {
    ...flowState.data,
    broadcastMessage: text
  });

  await whatsappService.sendButtonMessage(
    phone,
    `*Preview of broadcast message:*\n\n${text}\n\nSend this to all WhatsApp users?`,
    [
      { id: 'confirm_broadcast', title: 'Send to All' },
      { id: 'cancel_broadcast', title: 'Cancel' }
    ],
    '📢 Confirm Broadcast'
  );
}

export async function handleBroadcastConfirm(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.buttonId || message.text?.toLowerCase();
  const flowState = conversation.flowState as FlowState;

  if (selection === 'confirm_broadcast') {
    const broadcastMessage = flowState.data.broadcastMessage;

    const conversations = await db.query.whatsappConversations.findMany({
      where: eq(whatsappConversations.isActive, true)
    });

    let sentCount = 0;
    for (const conv of conversations) {
      if (conv.whatsappPhone !== phone.replace(/\+/g, '')) {
        try {
          await whatsappService.sendTextMessage(
            conv.whatsappPhone,
            `📢 *Announcement from EduFiliova*\n\n${broadcastMessage}`
          );
          sentCount++;
        } catch (error) {
          console.error(`Failed to send broadcast to ${conv.whatsappPhone}:`, error);
        }
      }
    }

    await logAdminAction(
      conversation.userId!,
      'BROADCAST',
      null,
      { message: broadcastMessage, recipientCount: sentCount }
    );

    await whatsappService.sendTextMessage(
      phone,
      `✅ Broadcast sent successfully to ${sentCount} user(s).`
    );
  } else {
    await whatsappService.sendTextMessage(phone, "Broadcast cancelled.");
  }

  await chatbot.updateConversationFlow(conversation.id, 'admin_menu', { adminSessionStart: flowState.data.adminSessionStart });
  await sendAdminMenu(phone);
}

export default {
  isAdminSecret,
  isRateLimited,
  handleAdminSecretEntry,
  sendAdminMenu,
  handleAdminMenuSelection,
  handleBlockUser,
  handleBlockConfirm,
  handleUnblockUser,
  handleDeleteUser,
  handleDeleteConfirm,
  handleBroadcast,
  handleBroadcastConfirm,
  verifyAdminAccess
};
