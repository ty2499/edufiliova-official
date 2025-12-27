import axios from 'axios';
import { db } from './db';
import { whatsappMessageLogs, whatsappConversations, WhatsAppMessageLog } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getWhatsAppConfig as getWhatsAppConfigFromDB } from './utils/settings';

interface WhatsAppConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  apiVersion: string;
}

let cachedWhatsAppConfig: WhatsAppConfig | null = null;
let whatsappConfigured = false;
let configInitPromise: Promise<void> | null = null;

// Get WhatsApp configuration from database first, then environment
async function initializeWhatsAppConfig(): Promise<void> {
  if (cachedWhatsAppConfig) return;
  
  const dbConfig = await getWhatsAppConfigFromDB();
  
  cachedWhatsAppConfig = {
    phoneNumberId: dbConfig.phoneNumberId || '',
    businessAccountId: dbConfig.businessAccountId || '',
    accessToken: dbConfig.accessToken || '',
    apiVersion: 'v18.0'
  };
  
  whatsappConfigured = !!(cachedWhatsAppConfig.phoneNumberId && cachedWhatsAppConfig.businessAccountId && cachedWhatsAppConfig.accessToken);
  
  if (whatsappConfigured) {
    console.log('✅ WhatsApp integration initialized');
  } else {
    console.log('⚠️ WhatsApp not configured - credentials missing in database and environment');
  }
}

async function ensureWhatsAppInitialized(): Promise<void> {
  if (!configInitPromise) {
    configInitPromise = initializeWhatsAppConfig();
  }
  await configInitPromise;
}

function getWhatsAppConfig(): WhatsAppConfig {
  return cachedWhatsAppConfig || {
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    apiVersion: 'v18.0'
  };
}

// Check if WhatsApp is configured
export function isWhatsAppConfigured(): boolean {
  return whatsappConfigured;
}

// Initialize on module load
ensureWhatsAppInitialized().catch(err => console.error("WhatsApp init error:", err));

// Base API URL for WhatsApp Cloud API
function getApiUrl(): string {
  const config = getWhatsAppConfig();
  return `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
}

// Headers for WhatsApp API requests
function getHeaders(): Record<string, string> {
  const config = getWhatsAppConfig();
  return {
    'Authorization': `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json'
  };
}

// Log message to database (non-blocking)
function logMessage(
  whatsappPhone: string,
  direction: 'inbound' | 'outbound',
  messageType: string,
  messageContent: any,
  messageId?: string,
  status: string = 'sent',
  errorMessage?: string
): void {
  // Fire and forget - don't block message sending
  setImmediate(async () => {
    try {
      const existingConversation = await db.query.whatsappConversations.findFirst({
        where: eq(whatsappConversations.whatsappPhone, whatsappPhone)
      });

      await db.insert(whatsappMessageLogs).values({
        conversationId: existingConversation?.id,
        whatsappPhone,
        direction,
        messageType,
        messageContent,
        messageId,
        status,
        errorMessage
      });
    } catch (error) {
      console.error('Error logging WhatsApp message:', error);
    }
  });
}

// Send text message
export async function sendTextMessage(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  await ensureWhatsAppInitialized();
  
  if (!isWhatsAppConfigured()) {
    console.log('⚠️ WhatsApp not configured, skipping message');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/\+/g, ''),
      type: 'text',
      text: { body: message }
    };

    const response = await axios.post(getApiUrl(), payload, { headers: getHeaders() });
    
    const messageId = response.data.messages?.[0]?.id;
    logMessage(to, 'outbound', 'text', payload, messageId);

    console.log(`✅ WhatsApp text message sent to ${to}`);
    return { success: true, messageId };
  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error(`❌ Failed to send WhatsApp message to ${to}:`, errorMsg);
    
    logMessage(to, 'outbound', 'text', { body: message }, undefined, 'failed', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// Send verification code using WhatsApp Authentication Template
// This is required for sending OTP codes to users who haven't messaged first
export async function sendVerificationCode(
  to: string,
  code: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  await ensureWhatsAppInitialized();
  
  if (!isWhatsAppConfigured()) {
    console.log('⚠️ WhatsApp not configured, skipping verification code');
    return { success: false, error: 'WhatsApp not configured' };
  }

  const formattedPhone = to.replace(/\+/g, '');
  console.log(`📱 Attempting to send WhatsApp OTP to: ${formattedPhone}`);

  // Try multiple template formats - different templates may have different structures
  const templateConfigs = [
    // Standard authentication template with OTP button
    {
      name: 'edufiliova_otp',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }]
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: code }]
        }
      ]
    },
    // Simple body-only template
    {
      name: 'edufiliova_otp',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }]
        }
      ]
    },
    // Authentication template with copy code button
    {
      name: 'edufiliova_otp',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }]
        },
        {
          type: 'button',
          sub_type: 'copy_code',
          index: '0',
          parameters: [{ type: 'coupon_code', coupon_code: code }]
        }
      ]
    }
  ];

  // Try each template configuration
  for (let i = 0; i < templateConfigs.length; i++) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: templateConfigs[i]
      };

      console.log(`📤 Trying template config ${i + 1}/${templateConfigs.length}...`);
      const response = await axios.post(getApiUrl(), payload, { headers: getHeaders() });
      
      const messageId = response.data.messages?.[0]?.id;
      logMessage(to, 'outbound', 'template', payload, messageId);

      console.log(`✅ WhatsApp OTP template message sent to ${formattedPhone}, messageId: ${messageId}`);
      return { success: true, messageId };
    } catch (templateError: any) {
      const errorMsg = templateError.response?.data?.error?.message || templateError.message;
      const errorCode = templateError.response?.data?.error?.code;
      console.warn(`⚠️ Template config ${i + 1} failed (code: ${errorCode}): ${errorMsg}`);
      
      // If it's not a template structure issue, don't try other configs
      if (errorCode !== 132000 && errorCode !== 132001 && errorCode !== 132015) {
        console.error(`❌ Non-template error, stopping attempts: ${errorMsg}`);
        break;
      }
    }
  }

  // Fallback: Try sending as text message (only works if user has messaged within 24 hours)
  console.log(`📤 All template attempts failed, trying text message fallback...`);
  try {
    const textPayload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: { 
        body: `Your EduFiliova verification code is: *${code}*\n\nThis code expires in 10 minutes.\nDo not share this code with anyone.`
      }
    };

    const response = await axios.post(getApiUrl(), textPayload, { headers: getHeaders() });
    
    const messageId = response.data.messages?.[0]?.id;
    logMessage(to, 'outbound', 'text', textPayload, messageId);

    console.log(`✅ WhatsApp text OTP sent to ${formattedPhone} (fallback), messageId: ${messageId}`);
    return { success: true, messageId };
  } catch (textError: any) {
    const textErrorMsg = textError.response?.data?.error?.message || textError.message;
    const textErrorCode = textError.response?.data?.error?.code;
    console.error(`❌ Failed to send WhatsApp OTP to ${formattedPhone} (code: ${textErrorCode}):`, textErrorMsg);
    
    // Provide helpful error message
    let userFriendlyError = textErrorMsg;
    if (textErrorCode === 131047 || textErrorMsg.includes('Re-engagement')) {
      userFriendlyError = 'WhatsApp messages can only be sent if you have messaged our WhatsApp number first within the last 24 hours, or if a pre-approved template is properly configured. Please try email verification instead, or first send a message to our WhatsApp number.';
    } else if (textErrorMsg.includes('template')) {
      userFriendlyError = 'WhatsApp OTP template configuration issue. Please contact support or use email verification.';
    } else if (textErrorCode === 131026) {
      userFriendlyError = 'This phone number is not registered on WhatsApp. Please use a WhatsApp-enabled number or try email verification.';
    }
    
    logMessage(to, 'outbound', 'text', { code }, undefined, 'failed', textErrorMsg);
    return { success: false, error: userFriendlyError };
  }
}

// Send interactive button message
export async function sendButtonMessage(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  headerText?: string,
  footerText?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  await ensureWhatsAppInitialized();
  
  if (!isWhatsAppConfigured()) {
    console.log('⚠️ WhatsApp not configured, skipping message');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const payload: any = {
      messaging_product: 'whatsapp',
      to: to.replace(/\+/g, ''),
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.slice(0, 3).map(btn => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.title.substring(0, 20) }
          }))
        }
      }
    };

    if (headerText) {
      payload.interactive.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      payload.interactive.footer = { text: footerText };
    }

    const response = await axios.post(getApiUrl(), payload, { headers: getHeaders() });
    
    const messageId = response.data.messages?.[0]?.id;
    logMessage(to, 'outbound', 'interactive', payload, messageId);

    console.log(`✅ WhatsApp button message sent to ${to}`);
    return { success: true, messageId };
  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error(`❌ Failed to send WhatsApp button message to ${to}:`, errorMsg);
    
    logMessage(to, 'outbound', 'interactive', {}, undefined, 'failed', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// Send interactive list message
export async function sendListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
  headerText?: string,
  footerText?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    console.log('⚠️ WhatsApp not configured, skipping message');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const payload: any = {
      messaging_product: 'whatsapp',
      to: to.replace(/\+/g, ''),
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonText,
          sections: sections.map(section => ({
            title: section.title.substring(0, 24),
            rows: section.rows.slice(0, 10).map(row => ({
              id: row.id,
              title: row.title.substring(0, 24),
              description: row.description?.substring(0, 72)
            }))
          }))
        }
      }
    };

    if (headerText) {
      payload.interactive.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      payload.interactive.footer = { text: footerText };
    }

    const response = await axios.post(getApiUrl(), payload, { headers: getHeaders() });
    
    const messageId = response.data.messages?.[0]?.id;
    logMessage(to, 'outbound', 'interactive', payload, messageId);

    console.log(`✅ WhatsApp list message sent to ${to}`);
    return { success: true, messageId };
  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error(`❌ Failed to send WhatsApp list message to ${to}:`, errorMsg);
    
    logMessage(to, 'outbound', 'interactive', {}, undefined, 'failed', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// Send course cards as a list
export async function sendCourseCatalog(
  to: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const allCourses = await db.query.courses.findMany({
    where: eq(courses.isActive, true),
    limit: 10
  });

  const sections = [{
    title: 'Available Courses',
    rows: allCourses.map(course => ({
      id: `course_${course.id}`,
      title: (course.title as string).substring(0, 24),
      description: `${course.currency || '$'} ${course.price}`
    }))
  }];

  return sendListMessage(
    to,
    'Browse our available courses and select one to learn more.',
    'View Courses',
    sections,
    '📚 EduFiliova Courses',
    'Reply with your selection'
  );
}

// Send subscription plans as buttons
export async function sendSubscriptionPlans(
  to: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const buttons = [
    { id: 'plan_elementary', title: 'Elementary $5.99' },
    { id: 'plan_highschool', title: 'High School $9.99' },
    { id: 'plan_college', title: 'College $99' }
  ];

  return sendButtonMessage(
    to,
    'Choose a subscription plan to unlock all features:\n\n📚 Elementary (Grades 1-7): $5.99/month\n🎓 High School (Grades 8-12): $9.99/month\n🎯 College & University: $99/month',
    buttons,
    '✨ Subscription Plans',
    'Select a plan to continue'
  );
}

// Send daily quiz question
export async function sendQuizQuestion(
  to: string,
  question: string,
  options: { A: string; B: string; C: string; D: string },
  subject: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const buttons = [
    { id: 'quiz_A', title: 'A' },
    { id: 'quiz_B', title: 'B' },
    { id: 'quiz_C', title: 'C' },
    { id: 'quiz_D', title: 'D' }
  ];

  const bodyText = `${question}\n\nA. ${options.A}\nB. ${options.B}\nC. ${options.C}\nD. ${options.D}`;

  return sendButtonMessage(
    to,
    bodyText,
    buttons,
    `📝 Daily ${subject} Quiz`,
    'Select your answer'
  );
}

// Send payment link
export async function sendPaymentLink(
  to: string,
  paymentUrl: string,
  amount: string,
  itemName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `💳 Complete your payment for ${itemName}\n\nAmount: ${amount}\n\nClick the link below to pay securely:\n${paymentUrl}\n\nThis link expires in 1 hour.`;
  
  return sendTextMessage(to, message);
}

// Send welcome message
export async function sendWelcomeMessage(
  to: string,
  name: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const buttons = [
    { id: 'action_browse', title: '📚 Browse Courses' },
    { id: 'action_subscribe', title: '✨ Subscribe' },
    { id: 'action_help', title: '❓ Help' }
  ];

  return sendButtonMessage(
    to,
    `Welcome to EduFiliova, ${name}! 🎓\n\nYour account has been created successfully. You can now:\n\n• Browse available courses\n• Subscribe to unlock all features\n• Get help and support\n\nWhat would you like to do?`,
    buttons,
    '🎉 Welcome!',
    'Select an option'
  );
}

// Send main menu
export async function sendMainMenu(
  to: string,
  name?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const sections = [{
    title: 'Main Menu',
    rows: [
      { id: 'menu_courses', title: '📚 Browse Courses', description: 'View available courses' },
      { id: 'menu_subscribe', title: '✨ Subscribe', description: 'Get a subscription plan' },
      { id: 'menu_voucher', title: '🎟️ Buy Voucher', description: 'Purchase gift vouchers' },
      { id: 'menu_profile', title: '👤 My Profile', description: 'View your account' },
      { id: 'menu_help', title: '❓ Help', description: 'Get support' }
    ]
  }];

  const greeting = name ? `Hello ${name}! ` : 'Hello! ';
  
  return sendListMessage(
    to,
    `${greeting}What would you like to do today?`,
    'View Menu',
    sections,
    '📱 EduFiliova Menu'
  );
}

// Send voucher options
export async function sendVoucherOptions(
  to: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const sections = [{
    title: 'Voucher Amounts',
    rows: [
      { id: 'voucher_10', title: '$10 Voucher', description: 'Perfect for trying out' },
      { id: 'voucher_25', title: '$25 Voucher', description: 'Great value' },
      { id: 'voucher_50', title: '$50 Voucher', description: 'Best deal' },
      { id: 'voucher_100', title: '$100 Voucher', description: 'Premium gift' },
      { id: 'voucher_custom', title: 'Custom Amount', description: 'Choose your own amount' }
    ]
  }];

  return sendListMessage(
    to,
    'Purchase a voucher for yourself or as a gift for someone special. Vouchers can be used for courses and subscriptions.',
    'Select Amount',
    sections,
    '🎟️ Gift Vouchers',
    'Valid for 1 year'
  );
}

// Send voucher confirmation
export async function sendVoucherConfirmation(
  to: string,
  voucherCode: string,
  amount: string,
  expiryDate: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `🎉 Voucher Purchased Successfully!\n\n🎟️ Voucher Code: ${voucherCode}\n💰 Amount: ${amount}\n📅 Valid Until: ${expiryDate}\n\nYou can use this code to pay for courses or subscriptions. Share it with friends or keep it for yourself!\n\nTo redeem: Reply with "REDEEM ${voucherCode}"`;
  
  return sendTextMessage(to, message);
}

// Send quiz result
export async function sendQuizResult(
  to: string,
  isCorrect: boolean,
  correctAnswer: string,
  explanation?: string,
  streak?: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let message = isCorrect 
    ? `✅ Correct! Well done!\n\n` 
    : `❌ Incorrect. The correct answer was: ${correctAnswer}\n\n`;
  
  if (explanation) {
    message += `💡 Explanation: ${explanation}\n\n`;
  }
  
  if (streak && streak > 0) {
    message += `🔥 Streak: ${streak} correct answers in a row!`;
  }
  
  return sendTextMessage(to, message);
}

export default {
  sendTextMessage,
  sendVerificationCode,
  sendButtonMessage,
  sendListMessage,
  sendCourseCatalog,
  sendSubscriptionPlans,
  sendQuizQuestion,
  sendPaymentLink,
  sendWelcomeMessage,
  sendMainMenu,
  sendVoucherOptions,
  sendVoucherConfirmation,
  sendQuizResult,
  isWhatsAppConfigured
};
