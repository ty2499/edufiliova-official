import { db } from './db';
import { 
  whatsappConversations, 
  whatsappMessageLogs,
  users,
  profiles,
  verificationCodes,
  type WhatsAppConversation
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import * as whatsappService from './whatsapp-service';

export type ConversationFlow = 
  | 'idle'
  | 'main_menu'
  | 'login_email'
  | 'login_phone'
  | 'login_userid'
  | 'login_password'
  | 'register_role'
  | 'register_name'
  | 'register_email'
  | 'register_password'
  | 'register_continent'
  | 'register_country'
  | 'register_age'
  | 'register_grade'
  | 'verify_email_code'
  | 'link_account_email'
  | 'link_account_password'
  | 'student_menu'
  | 'teacher_menu'
  | 'freelancer_menu'
  | 'voucher_type'
  | 'voucher_amount'
  | 'voucher_custom_amount'
  | 'voucher_recipient_email'
  | 'voucher_recipient_name'
  | 'voucher_message'
  | 'voucher_confirm'
  | 'assignment_select_course'
  | 'assignment_title'
  | 'assignment_due_date'
  | 'availability_select_day'
  | 'availability_set_hours'
  | 'withdraw_amount'
  | 'withdraw_method'
  | 'download_app'
  | 'upgrade_plan_select'
  | 'upgrade_plan_confirm'
  | 'frl_withdraw_amount'
  | 'frl_withdraw_method'
  | 'admin_menu'
  | 'admin_block_user'
  | 'admin_block_confirm'
  | 'admin_unblock_user'
  | 'admin_delete_user'
  | 'admin_delete_confirm'
  | 'admin_broadcast'
  | 'admin_broadcast_confirm'
  | 'change_password_email'
  | 'change_password_verify'
  | 'change_password_new'
  | 'change_password_confirm';

export interface FlowState {
  flow: ConversationFlow;
  data: Record<string, any>;
  lastActivity: Date;
}

export interface ParsedMessage {
  from: string;
  messageId: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'image' | 'document' | 'audio' | 'video';
  text?: string;
  buttonId?: string;
  listId?: string;
}

export async function getOrCreateConversation(phone: string): Promise<WhatsAppConversation> {
  const normalizedPhone = phone.replace(/\+/g, '');
  
  let conversation = await db.query.whatsappConversations.findFirst({
    where: eq(whatsappConversations.whatsappPhone, normalizedPhone)
  });

  if (!conversation) {
    const [newConversation] = await db.insert(whatsappConversations).values({
      whatsappPhone: normalizedPhone,
      currentFlow: 'idle',
      flowState: { flow: 'idle', data: {}, lastActivity: new Date() },
      isActive: true
    }).returning();
    conversation = newConversation;
  }

  return conversation;
}

export async function updateConversationFlow(
  conversationId: string, 
  flow: ConversationFlow, 
  data: Record<string, any> = {}
): Promise<void> {
  const flowState: FlowState = {
    flow,
    data,
    lastActivity: new Date()
  };

  await db.update(whatsappConversations)
    .set({ 
      currentFlow: flow,
      flowState,
      lastMessageAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(whatsappConversations.id, conversationId));
}

export async function linkUserToConversation(conversationId: string, userId: string): Promise<void> {
  await db.update(whatsappConversations)
    .set({ userId, updatedAt: new Date() })
    .where(eq(whatsappConversations.id, conversationId));
}

export async function logIncomingMessage(
  conversationId: string | undefined,
  phone: string,
  message: ParsedMessage
): Promise<void> {
  await db.insert(whatsappMessageLogs).values({
    conversationId,
    whatsappPhone: phone.replace(/\+/g, ''),
    direction: 'inbound',
    messageType: message.type,
    messageContent: message,
    messageId: message.messageId,
    status: 'received'
  });
}

export function parseIncomingMessage(webhookData: any): ParsedMessage | null {
  try {
    const entry = webhookData.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) return null;

    const parsed: ParsedMessage = {
      from: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      type: message.type
    };

    if (message.type === 'text') {
      parsed.text = message.text?.body;
    } else if (message.type === 'interactive') {
      if (message.interactive?.type === 'button_reply') {
        parsed.buttonId = message.interactive.button_reply?.id;
        parsed.text = message.interactive.button_reply?.title;
      } else if (message.interactive?.type === 'list_reply') {
        parsed.listId = message.interactive.list_reply?.id;
        parsed.text = message.interactive.list_reply?.title;
      }
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing WhatsApp message:', error);
    return null;
  }
}

export async function getUserByPhone(phone: string): Promise<any | null> {
  const normalizedPhone = phone.replace(/\+/g, '');
  
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.phoneNumber, normalizedPhone)
  });

  if (!profile) {
    const profileWithPlus = await db.query.profiles.findFirst({
      where: eq(profiles.phoneNumber, `+${normalizedPhone}`)
    });
    
    if (profileWithPlus) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, profileWithPlus.userId)
      });
      return user ? { user, profile: profileWithPlus } : null;
    }
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, profile.userId)
  });

  return user ? { user, profile } : null;
}

export async function sendWelcomeMenu(phone: string, name?: string): Promise<void> {
  const greeting = name ? `Welcome back, ${name}!` : 'Welcome to EduFiliova!';
  
  await whatsappService.sendButtonMessage(
    phone,
    `${greeting}\n\nHow can I assist you today?`,
    [
      { id: 'btn_student', title: 'Student Services' },
      { id: 'btn_teacher', title: 'Teacher Services' },
      { id: 'btn_freelancer', title: 'Freelancer Services' }
    ],
    'EduFiliova',
    'Select your role to continue'
  );
}

export async function sendNewUserMenu(phone: string): Promise<void> {
  await whatsappService.sendButtonMessage(
    phone,
    "Welcome to EduFiliova!\n\nI don't recognize this phone number.\n\nWhat would you like to do?",
    [
      { id: 'btn_create_account', title: 'Create Account' },
      { id: 'btn_login', title: 'Login' },
      { id: 'btn_link_number', title: 'Link Number' }
    ],
    'EduFiliova',
    'Select an option'
  );
}

export async function sendStudentMenu(phone: string, name: string): Promise<void> {
  await whatsappService.sendListMessage(
    phone,
    `Hello ${name}!\n\nWhat would you like to do?`,
    'View Options',
    [{
      title: 'Student Services',
      rows: [
        { id: 'stu_courses', title: 'My Courses', description: 'View enrolled courses' },
        { id: 'stu_voucher', title: 'Buy Voucher', description: 'Purchase gift vouchers' },
        { id: 'stu_wallet', title: 'My Wallet', description: 'Check balance' },
        { id: 'stu_certificates', title: 'Certificates', description: 'View certificates' },
        { id: 'stu_referral', title: 'Referral Program', description: 'Earn rewards' },
        { id: 'stu_chgpwd', title: 'Change Password', description: 'Update your password' },
        { id: 'stu_download', title: 'Download App', description: 'Get mobile app' },
        { id: 'stu_help', title: 'Help & Support', description: 'Get assistance' },
        { id: 'stu_signout', title: 'Sign Out', description: 'Log out of your account' }
      ]
    }],
    'Student Menu'
  );
}

export async function sendTeacherMenu(phone: string, name: string): Promise<void> {
  await whatsappService.sendListMessage(
    phone,
    `Hello ${name}!\n\nWhat would you like to do?`,
    'View Options',
    [{
      title: 'Teacher Services',
      rows: [
        { id: 'tch_status', title: 'Application Status', description: 'Check approval status' },
        { id: 'tch_bookings', title: 'My Bookings', description: 'View scheduled sessions' },
        { id: 'tch_assignments', title: 'Assignments', description: 'Manage assignments' },
        { id: 'tch_availability', title: 'Availability', description: 'Update schedule' },
        { id: 'tch_earnings', title: 'Earnings', description: 'View earnings' },
        { id: 'tch_withdraw', title: 'Withdraw', description: 'Request payout' },
        { id: 'tch_chgpwd', title: 'Change Password', description: 'Update your password' },
        { id: 'tch_help', title: 'Help & Support', description: 'Get assistance' },
        { id: 'tch_signout', title: 'Sign Out', description: 'Log out of your account' }
      ]
    }],
    'Teacher Menu'
  );
}

export async function sendFreelancerMenu(phone: string, name: string): Promise<void> {
  await whatsappService.sendListMessage(
    phone,
    `Hello ${name}!\n\nWhat would you like to do?`,
    'View Options',
    [{
      title: 'Freelancer Services',
      rows: [
        { id: 'frl_status', title: 'Application Status', description: 'Check approval status' },
        { id: 'frl_orders', title: 'My Orders', description: 'View active orders' },
        { id: 'frl_wallet', title: 'Wallet & Earnings', description: 'Check balance' },
        { id: 'frl_upgrade', title: 'Upgrade Plan', description: 'View plans' },
        { id: 'frl_withdraw', title: 'Withdraw', description: 'Request payout' },
        { id: 'frl_chgpwd', title: 'Change Password', description: 'Update your password' },
        { id: 'frl_help', title: 'Help & Support', description: 'Get assistance' },
        { id: 'frl_signout', title: 'Sign Out', description: 'Log out of your account' }
      ]
    }],
    'Freelancer Menu'
  );
}

export async function sendErrorMessage(phone: string, message?: string): Promise<void> {
  await whatsappService.sendTextMessage(
    phone,
    message || "I'm sorry, I didn't understand that. Please try again or type MENU to see options."
  );
}

export async function sendMainMenuPrompt(phone: string): Promise<void> {
  await whatsappService.sendTextMessage(
    phone,
    "Type MENU to see available options, or select from the options above."
  );
}

export function isQuickCommand(text: string): string | null {
  const normalized = text.toUpperCase().trim();
  const commands: Record<string, string> = {
    'MENU': 'menu',
    'HOME': 'menu',
    'START': 'menu',
    'HI': 'greeting',
    'HELLO': 'greeting',
    'HEY': 'greeting',
    'HELP': 'help',
    'BALANCE': 'balance',
    'STATUS': 'status',
    'LOGOUT': 'logout',
    'REFER': 'referral',
    'REFERRAL': 'referral',
    'DOWNLOAD': 'download',
    'APP': 'download',
    'VOUCHER': 'voucher',
    'ASSIGNMENT': 'assignment',
    'AVAILABILITY': 'availability',
    'WITHDRAW': 'withdraw',
    'EARNINGS': 'earnings'
  };
  return commands[normalized] || null;
}

export async function isSessionExpired(conversation: WhatsAppConversation): Promise<boolean> {
  const flowState = conversation.flowState as FlowState | null;
  if (!flowState?.lastActivity) return true;
  
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return new Date(flowState.lastActivity) < thirtyMinutesAgo;
}

export async function resetSession(conversationId: string): Promise<void> {
  await updateConversationFlow(conversationId, 'idle', {});
}

export async function signOutUser(phone: string, conversationId: string): Promise<void> {
  await db.update(whatsappConversations)
    .set({ 
      userId: null,
      currentFlow: 'idle',
      flowState: { flow: 'idle', data: {}, lastActivity: new Date() },
      updatedAt: new Date()
    })
    .where(eq(whatsappConversations.id, conversationId));
  
  await whatsappService.sendTextMessage(
    phone,
    "You have been signed out successfully.\n\nType MENU or send any message to start again."
  );
  
  await sendNewUserMenu(phone);
}

export default {
  getOrCreateConversation,
  updateConversationFlow,
  linkUserToConversation,
  logIncomingMessage,
  parseIncomingMessage,
  getUserByPhone,
  sendWelcomeMenu,
  sendNewUserMenu,
  sendStudentMenu,
  sendTeacherMenu,
  sendFreelancerMenu,
  sendErrorMessage,
  sendMainMenuPrompt,
  isQuickCommand,
  isSessionExpired,
  resetSession,
  signOutUser
};
