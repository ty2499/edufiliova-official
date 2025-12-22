import { Request, Response } from 'express';
import { db } from './db';
import { 
  whatsappConversations, 
  whatsappMessageLogs,
  users,
  profiles,
  verificationCodes,
  type WhatsAppConversation
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import * as whatsappService from './whatsapp-service';
import * as chatbot from './whatsapp-chatbot';
import type { FlowState, ParsedMessage } from './whatsapp-chatbot';
import * as authHandler from './whatsapp-handlers/auth-handler';
import * as studentHandler from './whatsapp-handlers/student-handler';
import * as teacherHandler from './whatsapp-handlers/teacher-handler';
import * as freelancerHandler from './whatsapp-handlers/freelancer-handler';
import * as adminHandler from './whatsapp-handlers/admin-handler';
import crypto from 'crypto';

// Generate a 6-digit numeric verification code for email/SMS verification
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export function verifyWebhookSignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) return false;

  const signatureHash = signature.split('sha256=')[1];
  const appSecret = process.env.WHATSAPP_APP_SECRET || '';
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  return signatureHash === expectedHash;
}

export async function handleWebhookVerification(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'edufiliova_verify_token_2024';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ WhatsApp webhook verification failed');
    res.sendStatus(403);
  }
}

async function getOrCreateConversation(whatsappPhone: string): Promise<WhatsAppConversation> {
  let conversation = await db.query.whatsappConversations.findFirst({
    where: eq(whatsappConversations.whatsappPhone, whatsappPhone)
  });

  if (!conversation) {
    const [newConversation] = await db.insert(whatsappConversations).values({
      whatsappPhone,
      isActive: true,
      currentFlow: 'idle',
      flowState: { flow: 'idle', data: {}, lastActivity: new Date() }
    }).returning();
    conversation = newConversation;
  }

  return conversation;
}

async function logIncomingMessage(
  whatsappPhone: string,
  messageType: string,
  messageContent: any,
  messageId: string
) {
  const conversation = await getOrCreateConversation(whatsappPhone);
  
  await db.insert(whatsappMessageLogs).values({
    conversationId: conversation.id,
    whatsappPhone,
    direction: 'inbound',
    messageType,
    messageContent,
    messageId,
    status: 'received'
  });
}

function parseWhatsAppMessage(message: any, whatsappPhone: string): ParsedMessage {
  const parsed: ParsedMessage = {
    from: whatsappPhone,
    messageId: message.id,
    timestamp: message.timestamp || new Date().toISOString(),
    type: message.type
  };

  if (message.type === 'text') {
    parsed.text = message.text?.body;
  } else if (message.type === 'interactive') {
    const interactive = message.interactive;
    if (interactive.type === 'button_reply') {
      parsed.buttonId = interactive.button_reply?.id;
    } else if (interactive.type === 'list_reply') {
      parsed.listId = interactive.list_reply?.id;
    }
  }

  return parsed;
}

async function routeMessage(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const flowState = conversation.flowState as FlowState | null;
  const currentFlow = flowState?.flow || 'idle';
  const text = message.text?.toLowerCase().trim() || '';
  const rawText = message.text?.trim() || '';
  
  // Check for session staleness - reset if last activity was more than 30 minutes ago
  const lastActivity = flowState?.lastActivity ? new Date(flowState.lastActivity) : null;
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const isSessionStale = lastActivity && lastActivity < thirtyMinutesAgo;
  
  // If session is stale and not in idle state, reset to prevent stuck states
  if (isSessionStale && currentFlow !== 'idle') {
    console.log(`📲 [WhatsApp] Session stale for ${phone}, resetting flow from ${currentFlow} to idle`);
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    // Re-fetch the conversation to get updated flow state
    const freshConversation = await getOrCreateConversation(phone.replace(/\+/g, ''));
    conversation = freshConversation;
  }

  const adminCheck = adminHandler.checkAdminSecretWithRateLimit(phone, rawText);
  if (adminCheck.isRateLimited) {
    await whatsappService.sendTextMessage(phone, "Too many failed attempts. Please try again later.");
    return;
  }
  if (adminCheck.isSecret) {
    const handled = await adminHandler.handleAdminSecretEntry(phone, conversation, rawText);
    if (handled) return;
  }

  if (text === 'menu' || text === 'start' || text === 'hi' || text === 'hello') {
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    
    if (conversation.userId) {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, conversation.userId)
      });

      if (profile?.role === 'teacher') {
        await chatbot.sendTeacherMenu(phone, profile.name);
      } else if (profile?.role === 'freelancer') {
        await chatbot.sendFreelancerMenu(phone, profile.name);
      } else {
        await chatbot.sendStudentMenu(phone, profile?.name || 'Student');
      }
    } else {
      await chatbot.sendNewUserMenu(phone);
    }
    return;
  }

  if (['login', 'register', 'link', 'link_account'].includes(text)) {
    if (text === 'login') {
      await chatbot.updateConversationFlow(conversation.id, 'login_email', {});
      await whatsappService.sendTextMessage(phone, "Please enter your email address:");
    } else if (text === 'register') {
      await chatbot.updateConversationFlow(conversation.id, 'register_role', {});
      await whatsappService.sendButtonMessage(
        phone,
        "What type of account would you like to create?",
        [
          { id: 'role_student', title: 'Student' },
          { id: 'role_teacher', title: 'Teacher' },
          { id: 'role_freelancer', title: 'Freelancer' }
        ],
        'Create Account'
      );
    } else {
      await chatbot.updateConversationFlow(conversation.id, 'link_account_email', {});
      await whatsappService.sendTextMessage(
        phone,
        "Link your existing EduFiliova account.\n\nPlease enter your email address:"
      );
    }
    return;
  }

  // Handle specific menu button interactions that should override flow state
  const buttonOrListId = message.buttonId || message.listId;
  const menuButtons = [
    'btn_login', 'btn_register', 'btn_create_account', 'btn_link', 'btn_link_number',
    'btn_try_again', 'btn_try_again_pwd', 'btn_try_again_link', 'btn_different_email',
    'btn_cancel', 'btn_resend_code', 'btn_forgot_pwd', 'btn_back_menu',
    'btn_student', 'btn_teacher', 'btn_freelancer'
  ];
  
  // Handle role selection buttons - these need special handling to show the correct menu
  if (buttonOrListId === 'btn_student') {
    if (conversation.userId) {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, conversation.userId)
      });
      await chatbot.updateConversationFlow(conversation.id, 'student_menu', {});
      await chatbot.sendStudentMenu(phone, profile?.name || 'Student');
    } else {
      await chatbot.sendNewUserMenu(phone);
    }
    return;
  }
  
  if (buttonOrListId === 'btn_teacher') {
    if (conversation.userId) {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, conversation.userId)
      });
      await chatbot.updateConversationFlow(conversation.id, 'teacher_menu', {});
      await chatbot.sendTeacherMenu(phone, profile?.name || 'Teacher');
    } else {
      await chatbot.sendNewUserMenu(phone);
    }
    return;
  }
  
  if (buttonOrListId === 'btn_freelancer') {
    if (conversation.userId) {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, conversation.userId)
      });
      await chatbot.updateConversationFlow(conversation.id, 'freelancer_menu', {});
      await chatbot.sendFreelancerMenu(phone, profile?.name || 'Freelancer');
    } else {
      await chatbot.sendNewUserMenu(phone);
    }
    return;
  }
  
  if (buttonOrListId && menuButtons.includes(buttonOrListId)) {
    await handleMenuSelection(phone, conversation, message);
    return;
  }

  // Wrap all handler calls in try-catch to prevent silent failures
  try {
    switch (currentFlow) {
      case 'login_email':
        await authHandler.handleLoginEmail(phone, conversation, message);
        break;
      case 'login_password':
        await authHandler.handleLoginPassword(phone, conversation, message);
        break;
      case 'register_role':
        await authHandler.handleRegisterRole(phone, conversation, message);
        break;
      case 'register_name':
        await authHandler.handleRegisterName(phone, conversation, message);
        break;
      case 'register_email':
        await authHandler.handleRegisterEmail(phone, conversation, message);
        break;
      case 'register_password':
        await authHandler.handleRegisterPassword(phone, conversation, message);
        break;
      case 'register_continent':
        await authHandler.handleRegisterContinent(phone, conversation, message);
        break;
      case 'register_country':
        await authHandler.handleRegisterCountry(phone, conversation, message);
        break;
      case 'register_age':
        await authHandler.handleRegisterAge(phone, conversation, message);
        break;
      case 'register_grade':
        await authHandler.handleRegisterGrade(phone, conversation, message);
        break;
      case 'verify_email_code':
        await authHandler.handleVerifyEmailCode(phone, conversation, message);
        break;
      case 'link_account_email':
        await authHandler.handleLinkAccountEmail(phone, conversation, message);
        break;
      case 'link_account_password':
        await authHandler.handleLinkAccountPassword(phone, conversation, message);
        break;

      case 'voucher_type':
        await studentHandler.handleVoucherType(phone, conversation, message);
        break;
      case 'voucher_recipient_email':
        await studentHandler.handleVoucherRecipientEmail(phone, conversation, message);
        break;
      case 'voucher_recipient_name':
        await studentHandler.handleVoucherRecipientName(phone, conversation, message);
        break;
      case 'voucher_message':
        await studentHandler.handleVoucherMessage(phone, conversation, message);
        break;
      case 'voucher_amount':
        await studentHandler.handleVoucherAmount(phone, conversation, message);
        break;
      case 'voucher_custom_amount':
        await studentHandler.handleVoucherCustomAmount(phone, conversation, message);
        break;
      case 'voucher_confirm':
        await studentHandler.handleVoucherConfirm(phone, conversation, message);
        break;
      case 'download_app':
        await studentHandler.handleDownloadAppSelection(phone, conversation, message);
        break;

      case 'assignment_select_course':
        await teacherHandler.handleAssignmentSelectCourse(phone, conversation, message);
        break;
      case 'assignment_title':
        await teacherHandler.handleAssignmentTitle(phone, conversation, message);
        break;
      case 'assignment_due_date':
        await teacherHandler.handleAssignmentDueDate(phone, conversation, message);
        break;
      case 'availability_select_day':
        await teacherHandler.handleAvailabilitySelectDay(phone, conversation, message);
        break;
      case 'availability_set_hours':
        await teacherHandler.handleAvailabilitySetHours(phone, conversation, message);
        break;
      case 'withdraw_amount':
        await teacherHandler.handleWithdrawAmount(phone, conversation, message);
        break;
      case 'withdraw_method':
        await teacherHandler.handleWithdrawMethod(phone, conversation, message);
        break;

      case 'upgrade_plan_select':
        await freelancerHandler.handleUpgradePlanSelect(phone, conversation, message);
        break;
      case 'upgrade_plan_confirm':
        await freelancerHandler.handleUpgradePlanConfirm(phone, conversation, message);
        break;
      case 'frl_withdraw_amount':
        await freelancerHandler.handleFreelancerWithdrawAmount(phone, conversation, message);
        break;
      case 'frl_withdraw_method':
        await freelancerHandler.handleFreelancerWithdrawMethod(phone, conversation, message);
        break;

      case 'admin_menu':
      case 'admin_block_user':
      case 'admin_block_confirm':
      case 'admin_unblock_user':
      case 'admin_delete_user':
      case 'admin_delete_confirm':
      case 'admin_broadcast':
      case 'admin_broadcast_confirm':
        if (adminHandler.isAdminSessionExpired(flowState)) {
          await chatbot.updateConversationFlow(conversation.id, 'idle', {});
          await whatsappService.sendTextMessage(phone, "Admin session expired. Please re-authenticate.");
          await chatbot.sendNewUserMenu(phone);
          return;
        }
        if (currentFlow === 'admin_menu') {
          await adminHandler.handleAdminMenuSelection(phone, conversation, message);
        } else if (currentFlow === 'admin_block_user') {
          await adminHandler.handleBlockUser(phone, conversation, message);
        } else if (currentFlow === 'admin_block_confirm') {
          await adminHandler.handleBlockConfirm(phone, conversation, message);
        } else if (currentFlow === 'admin_unblock_user') {
          await adminHandler.handleUnblockUser(phone, conversation, message);
        } else if (currentFlow === 'admin_delete_user') {
          await adminHandler.handleDeleteUser(phone, conversation, message);
        } else if (currentFlow === 'admin_delete_confirm') {
          await adminHandler.handleDeleteConfirm(phone, conversation, message);
        } else if (currentFlow === 'admin_broadcast') {
          await adminHandler.handleBroadcast(phone, conversation, message);
        } else if (currentFlow === 'admin_broadcast_confirm') {
          await adminHandler.handleBroadcastConfirm(phone, conversation, message);
        }
        break;
      
      // Handle menu states explicitly
      case 'student_menu':
      case 'teacher_menu':
      case 'freelancer_menu':
      case 'idle':
      default:
        await handleMenuSelection(phone, conversation, message);
    }
  } catch (handlerError) {
    console.error(`❌ [WhatsApp] Handler error for flow ${currentFlow}:`, handlerError);
    // Reset to idle state to prevent getting stuck
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    await whatsappService.sendTextMessage(
      phone,
      "Sorry, something went wrong. Please type MENU to start over."
    );
  }
}

async function handleMenuSelection(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  try {
    const selection = message.listId || message.buttonId || '';
    const textInput = message.text?.toLowerCase().trim() || '';

    // Handle back to menu button
    if (selection === 'btn_back_menu') {
      await studentHandler.handleBackToMenu(phone, conversation);
      return;
    }
    
    // Handle help/contact buttons from any menu
    if (selection === 'help_contact' || textInput === 'help') {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'https://edufiliova.com';
      await whatsappService.sendTextMessage(
        phone,
        `Need help? Here are your options:\n\n` +
        `1. Visit our Help Center: ${baseUrl}/help\n` +
        `2. Email: support@edufiliova.com\n` +
        `3. Type MENU to go back to the main menu`
      );
      return;
    }
    
    // Handle browse courses button
    if (selection === 'btn_browse_courses') {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'https://edufiliova.com';
      await whatsappService.sendTextMessage(
        phone,
        `Browse our courses at:\n${baseUrl}/courses\n\nType MENU to go back.`
      );
      return;
    }
    
    // Handle wallet add funds button
    if (selection === 'wallet_add_funds') {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'https://edufiliova.com';
      await whatsappService.sendTextMessage(
        phone,
        `Add funds to your wallet at:\n${baseUrl}/dashboard/wallet\n\nType MENU to go back.`
      );
      return;
    }
    
    // Handle share referral button
    if (selection === 'ref_share') {
      await whatsappService.sendTextMessage(
        phone,
        `Share your referral link with friends and earn rewards!\n\nType REFERRAL to see your referral code, or MENU to go back.`
      );
      return;
    }

  if (selection.startsWith('btn_')) {
    if (selection === 'btn_login') {
      await chatbot.updateConversationFlow(conversation.id, 'login_email', {});
      await whatsappService.sendTextMessage(phone, "Please enter your email address:");
    } else if (selection === 'btn_register' || selection === 'btn_create_account') {
      await chatbot.updateConversationFlow(conversation.id, 'register_role', {});
      await whatsappService.sendButtonMessage(
        phone,
        "What type of account would you like to create?",
        [
          { id: 'role_student', title: 'Student' },
          { id: 'role_teacher', title: 'Teacher' },
          { id: 'role_freelancer', title: 'Freelancer' }
        ],
        'Create Account'
      );
    } else if (selection === 'btn_link' || selection === 'btn_link_number') {
      await chatbot.updateConversationFlow(conversation.id, 'link_account_email', {});
      await whatsappService.sendTextMessage(
        phone,
        "Link your existing EduFiliova account.\n\nPlease enter your email address:"
      );
    } else if (selection === 'btn_try_again') {
      await chatbot.updateConversationFlow(conversation.id, 'login_email', {});
      await whatsappService.sendTextMessage(phone, "Please enter your email or phone number:");
    } else if (selection === 'btn_try_again_pwd') {
      await whatsappService.sendTextMessage(phone, "Please enter your password:");
    } else if (selection === 'btn_try_again_link') {
      // Keep the current flow state (link_account_password) and just prompt for password again
      const flowState = conversation.flowState as FlowState;
      if (flowState?.flow === 'link_account_password' && flowState?.data) {
        await whatsappService.sendTextMessage(phone, "Please enter your password to link this number:");
      } else {
        // If flow state is lost, restart the link flow
        await chatbot.updateConversationFlow(conversation.id, 'link_account_email', {});
        await whatsappService.sendTextMessage(phone, "Link your existing EduFiliova account.\n\nPlease enter your email address:");
      }
    } else if (selection === 'btn_different_email') {
      await chatbot.updateConversationFlow(conversation.id, 'register_email', conversation.flowState || {});
      await whatsappService.sendTextMessage(phone, "Please enter a different email address:");
    } else if (selection === 'btn_cancel') {
      await chatbot.updateConversationFlow(conversation.id, 'idle', {});
      await chatbot.sendNewUserMenu(phone);
    } else if (selection === 'btn_resend_code') {
      const flowState = conversation.flowState as FlowState | null;
      const email = flowState?.data?.email;
      
      if (!email) {
        await chatbot.updateConversationFlow(conversation.id, 'idle', {});
        await whatsappService.sendTextMessage(phone, "Session expired. Please start registration again.");
        await chatbot.sendNewUserMenu(phone);
        return;
      }
      
      const newCode = generateVerificationCode();
      
      await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, email));
      
      await db.insert(verificationCodes).values({
        contactInfo: email,
        type: 'email',
        code: newCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        userData: {
          ...flowState?.data,
          emailCode: newCode
        }
      });
      
      const { sendEmail, getEmailTemplate } = await import('./routes');
      
      try {
        await sendEmail(
          email,
          'Verify Your EduFiliova Account',
          getEmailTemplate('verification', { code: newCode })
        );
        console.log(`[Resend Code] Successfully sent verification email to ${email}`);
      } catch (error) {
        console.error('[Resend Code] Failed to send verification email:', error);
      }
      
      await whatsappService.sendTextMessage(phone, "A new verification code has been sent to your email. Please enter the 6-digit code:");
    } else if (selection === 'btn_forgot_pwd') {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'https://edufiliova.com';
      await whatsappService.sendTextMessage(
        phone,
        `To reset your password, please visit:\n${baseUrl}/forgot-password\n\nType MENU to return to the main menu.`
      );
      await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    }
    return;
  }

  if (selection.startsWith('role_')) {
    await authHandler.handleRegisterRole(phone, conversation, message);
    return;
  }

  if (selection.startsWith('stu_')) {
    await studentHandler.handleStudentMenuSelection(phone, conversation, message);
    return;
  }

  if (selection.startsWith('tch_')) {
    await teacherHandler.handleTeacherMenuSelection(phone, conversation, message);
    return;
  }

  if (selection.startsWith('frl_')) {
    await freelancerHandler.handleFreelancerMenuSelection(phone, conversation, message);
    return;
  }

  if (selection.startsWith('adm_')) {
    await adminHandler.handleAdminMenuSelection(phone, conversation, message);
    return;
  }

  if (conversation.userId) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, conversation.userId)
    });

    if (profile?.role === 'teacher') {
      await chatbot.sendTeacherMenu(phone, profile.name);
    } else if (profile?.role === 'freelancer') {
      await chatbot.sendFreelancerMenu(phone, profile.name);
    } else {
      await chatbot.sendStudentMenu(phone, profile?.name || 'Student');
    }
  } else {
    await chatbot.sendNewUserMenu(phone);
  }
  } catch (menuError) {
    console.error(`❌ [WhatsApp] Menu selection error:`, menuError);
    // Reset to idle and show menu to recover from error
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    await whatsappService.sendTextMessage(
      phone,
      "Sorry, something went wrong. Type MENU to see your options."
    );
  }
}

export async function handleWhatsAppWebhook(req: Request, res: Response) {
  try {
    const body = req.body;
    console.log('📲 [WhatsApp] Webhook received:', JSON.stringify(body).substring(0, 500));

    if (!body.entry || !body.entry[0]) {
      console.log('📲 [WhatsApp] No entry in body, returning 200');
      return res.sendStatus(200);
    }

    const changes = body.entry[0].changes;
    if (!changes || !changes[0]) {
      console.log('📲 [WhatsApp] No changes in entry, returning 200');
      return res.sendStatus(200);
    }

    const value = changes[0].value;
    if (!value.messages || !value.messages[0]) {
      if (value.statuses) {
        console.log('📲 [WhatsApp] Status update received, returning 200');
        return res.sendStatus(200);
      }
      console.log('📲 [WhatsApp] No messages in value, returning 200');
      return res.sendStatus(200);
    }

    const rawMessage = value.messages[0];
    const whatsappPhone = rawMessage.from;
    const messageId = rawMessage.id;
    console.log(`📲 [WhatsApp] Message from ${whatsappPhone}: type=${rawMessage.type}, text=${rawMessage.text?.body || rawMessage.interactive?.button_reply?.id || 'N/A'}`);

    // IMMEDIATELY respond to WhatsApp (prevents timeout/delays)
    res.sendStatus(200);

    // Process message in background (non-blocking)
    setImmediate(async () => {
      try {
        console.log(`📲 [WhatsApp] Processing message from ${whatsappPhone}...`);
        await logIncomingMessage(whatsappPhone, rawMessage.type, rawMessage, messageId);
        console.log(`📲 [WhatsApp] Message logged, getting conversation...`);
        const conversation = await getOrCreateConversation(whatsappPhone);
        console.log(`📲 [WhatsApp] Conversation found: id=${conversation.id}, userId=${conversation.userId || 'none'}, flow=${conversation.currentFlow}`);
        const parsedMessage = parseWhatsAppMessage(rawMessage, whatsappPhone);
        console.log(`📲 [WhatsApp] Routing message: text="${parsedMessage.text}", buttonId="${parsedMessage.buttonId}", listId="${parsedMessage.listId}"`);
        await routeMessage(whatsappPhone, conversation, parsedMessage);
        console.log(`📲 [WhatsApp] Message routed successfully`);
      } catch (error) {
        console.error('❌ Error processing WhatsApp message:', error);
        // Send error message to user so they know something went wrong
        try {
          await whatsappService.sendTextMessage(
            whatsappPhone,
            "Sorry, something went wrong processing your message. Please try again or type MENU to start over."
          );
        } catch (sendError) {
          console.error('❌ Failed to send error message:', sendError);
        }
      }
    });

  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    res.sendStatus(500);
  }
}

export default {
  handleWebhookVerification,
  handleWhatsAppWebhook,
  verifyWebhookSignature
};
