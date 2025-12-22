import { db } from '../db';
import { 
  users, 
  profiles, 
  courseEnrollments,
  courses,
  certificates,
  shopCustomers,
  shopTransactions,
  giftVoucherPurchases,
  type WhatsAppConversation
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import * as whatsappService from '../whatsapp-service';
import * as chatbot from '../whatsapp-chatbot';
import type { FlowState, ParsedMessage } from '../whatsapp-chatbot';

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'EF';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateReferralCode(name: string): string {
  const cleanName = name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${random}`;
}

export async function handleStudentMenuSelection(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  try {
    const selection = message.listId || message.buttonId || message.text?.toLowerCase();
    
    if (!selection) {
      await whatsappService.sendTextMessage(phone, "Please select an option from the menu.");
      return;
    }

    const userId = conversation.userId;
    if (!userId) {
      await chatbot.sendNewUserMenu(phone);
      return;
    }

    switch (selection) {
      case 'stu_courses':
        await handleMyCourses(phone, userId, conversation);
        break;
      case 'stu_voucher':
        await handleBuyVoucher(phone, conversation);
        break;
      case 'stu_wallet':
        await handleMyWallet(phone, userId);
        break;
      case 'stu_certificates':
        await handleCertificates(phone, userId);
        break;
      case 'stu_referral':
        await handleReferralProgram(phone, userId);
        break;
      case 'stu_download':
        await handleDownloadApp(phone, conversation);
        break;
      case 'stu_help':
        await handleHelpSupport(phone);
        break;
      case 'stu_signout':
        await chatbot.signOutUser(phone, conversation.id);
        break;
      default:
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, userId)
        });
        await chatbot.sendStudentMenu(phone, profile?.name || 'Student');
    }
  } catch (error) {
    console.error(`❌ [WhatsApp] Student menu selection error for ${phone}:`, error);
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    await whatsappService.sendTextMessage(
      phone,
      "Sorry, something went wrong. Type MENU to see your options."
    );
  }
}

async function handleMyCourses(phone: string, userId: string, conversation: WhatsAppConversation): Promise<void> {
  const enrollments = await db.select({
    enrollmentId: courseEnrollments.id,
    courseId: courseEnrollments.courseId,
    progress: courseEnrollments.progress,
    enrolledAt: courseEnrollments.enrolledAt,
    courseTitle: courses.title,
    courseDescription: courses.description,
  })
  .from(courseEnrollments)
  .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
  .where(
    and(
      eq(courseEnrollments.userId, userId),
      eq(courseEnrollments.isActive, true)
    )
  )
  .limit(10);

  if (enrollments.length === 0) {
    await whatsappService.sendButtonMessage(
      phone,
      "You haven't enrolled in any courses yet.\n\nBrowse our course catalog to start learning!",
      [
        { id: 'btn_browse_courses', title: 'Browse Courses' },
        { id: 'btn_back_menu', title: 'Back to Menu' }
      ],
      'My Courses'
    );
    return;
  }

  const courseRows = enrollments.map(e => ({
    id: `course_view_${e.courseId}`,
    title: (e.courseTitle || 'Untitled Course').substring(0, 24),
    description: `Progress: ${e.progress || 0}%`
  }));

  await whatsappService.sendListMessage(
    phone,
    `You are enrolled in ${enrollments.length} course(s).\n\nSelect a course to view details:`,
    'View Courses',
    [{
      title: 'Your Courses',
      rows: courseRows
    }],
    'My Courses',
    'Tap to see progress'
  );
}

async function handleBuyVoucher(phone: string, conversation: WhatsAppConversation): Promise<void> {
  await chatbot.updateConversationFlow(conversation.id, 'voucher_type', {});
  
  await whatsappService.sendButtonMessage(
    phone,
    "Gift Vouchers\n\nVouchers can be used for courses, subscriptions, and more!\n\nWho is this voucher for?",
    [
      { id: 'voucher_self', title: 'For Myself' },
      { id: 'voucher_gift', title: 'Gift Someone' }
    ],
    'Buy Voucher'
  );
}

export async function handleVoucherType(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.buttonId || message.text?.toLowerCase();
  
  if (selection === 'voucher_gift' || selection?.includes('gift')) {
    await chatbot.updateConversationFlow(conversation.id, 'voucher_recipient_email', { 
      isGift: true 
    });
    await whatsappService.sendTextMessage(
      phone,
      "Who would you like to gift this voucher to?\n\nPlease enter the recipient's email address:"
    );
  } else {
    await chatbot.updateConversationFlow(conversation.id, 'voucher_amount', { 
      isGift: false 
    });
    await sendVoucherAmountOptions(phone);
  }
}

export async function handleVoucherRecipientEmail(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const email = message.text?.trim().toLowerCase();
  
  if (!email || !email.includes('@') || !email.includes('.')) {
    await whatsappService.sendTextMessage(phone, "Please enter a valid email address:");
    return;
  }

  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || { isGift: true };
  
  await chatbot.updateConversationFlow(conversation.id, 'voucher_recipient_name', {
    ...existingData,
    recipientEmail: email
  });

  await whatsappService.sendTextMessage(
    phone,
    "What is the recipient's name?\n\n(This will appear on the voucher)"
  );
}

export async function handleVoucherRecipientName(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const name = message.text?.trim();
  
  if (!name || name.length < 2) {
    await whatsappService.sendTextMessage(phone, "Please enter a valid name:");
    return;
  }

  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || { isGift: true };
  
  await chatbot.updateConversationFlow(conversation.id, 'voucher_message', {
    ...existingData,
    recipientName: name
  });

  await whatsappService.sendButtonMessage(
    phone,
    "Would you like to add a personal message?\n\n(This will be included in the gift email)",
    [
      { id: 'voucher_add_msg', title: 'Add Message' },
      { id: 'voucher_skip_msg', title: 'Skip' }
    ]
  );
}

export async function handleVoucherMessage(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || {};
  const selection = message.buttonId;
  
  if (selection === 'voucher_skip_msg') {
    await chatbot.updateConversationFlow(conversation.id, 'voucher_amount', {
      ...existingData,
      personalMessage: null
    });
    await sendVoucherAmountOptions(phone);
    return;
  }

  if (selection === 'voucher_add_msg') {
    await whatsappService.sendTextMessage(
      phone,
      "Enter your personal message for the recipient:\n\n(Max 200 characters)"
    );
    return;
  }

  const personalMessage = message.text?.trim().substring(0, 200);
  await chatbot.updateConversationFlow(conversation.id, 'voucher_amount', {
    ...existingData,
    personalMessage
  });
  await sendVoucherAmountOptions(phone);
}

async function sendVoucherAmountOptions(phone: string): Promise<void> {
  await whatsappService.sendListMessage(
    phone,
    "Select the voucher amount:",
    'Select Amount',
    [{
      title: 'Voucher Amounts',
      rows: [
        { id: 'voucher_5', title: '$5 Voucher', description: 'Quick gift' },
        { id: 'voucher_25', title: '$25 Voucher', description: 'Great starter value' },
        { id: 'voucher_50', title: '$50 Voucher', description: 'Best value for courses' },
        { id: 'voucher_100', title: '$100 Voucher', description: 'Premium gift' },
        { id: 'voucher_150', title: '$150 Voucher', description: 'Ultimate gift' },
        { id: 'voucher_custom', title: 'Custom Amount', description: 'Enter your own amount' }
      ]
    }],
    'Select Amount'
  );
}

export async function handleVoucherAmount(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.listId || message.buttonId;
  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || {};
  
  let amount: number | null = null;
  
  switch (selection) {
    case 'voucher_5': amount = 5; break;
    case 'voucher_25': amount = 25; break;
    case 'voucher_50': amount = 50; break;
    case 'voucher_100': amount = 100; break;
    case 'voucher_150': amount = 150; break;
    case 'voucher_custom':
      await chatbot.updateConversationFlow(conversation.id, 'voucher_custom_amount', existingData);
      await whatsappService.sendTextMessage(
        phone,
        "Enter your custom amount in USD (minimum $5, maximum $500):\n\n(Example: 75)"
      );
      return;
  }

  if (!amount) {
    await sendVoucherAmountOptions(phone);
    return;
  }

  await confirmVoucherPurchase(phone, conversation, amount, existingData);
}

export async function handleVoucherCustomAmount(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const amountText = message.text?.replace(/[^0-9.]/g, '');
  const amount = parseFloat(amountText || '0');

  if (isNaN(amount) || amount < 5 || amount > 500) {
    await whatsappService.sendTextMessage(
      phone,
      "Please enter a valid amount between $5 and $500:"
    );
    return;
  }

  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || {};
  await confirmVoucherPurchase(phone, conversation, amount, existingData);
}

async function confirmVoucherPurchase(
  phone: string,
  conversation: WhatsAppConversation,
  amount: number,
  data: Record<string, any>
): Promise<void> {
  await chatbot.updateConversationFlow(conversation.id, 'voucher_confirm', {
    ...data,
    amount
  });

  // Get wallet balance to show in message
  const customer = await db.query.shopCustomers.findFirst({
    where: eq(shopCustomers.userId, conversation.userId!)
  });
  const walletBalance = parseFloat(customer?.walletBalance || '0');

  let confirmMessage = `Voucher Summary\n\n`;
  confirmMessage += `Amount: $${amount.toFixed(2)}\n`;
  
  if (data.isGift) {
    confirmMessage += `Recipient: ${data.recipientEmail}\n`;
    confirmMessage += `Name: ${data.recipientName}\n`;
    if (data.personalMessage) {
      confirmMessage += `Message: "${data.personalMessage}"\n`;
    }
  } else {
    confirmMessage += `Voucher will be sent to your email\n`;
  }
  
  confirmMessage += `\nWallet Balance: $${walletBalance.toFixed(2)}`;
  if (walletBalance >= amount) {
    confirmMessage += ` (Sufficient)`;
  }
  confirmMessage += `\n\nHow would you like to pay?`;

  await whatsappService.sendListMessage(
    phone,
    confirmMessage,
    'Payment Method',
    [{
      title: 'Payment Options',
      rows: [
        { id: 'voucher_pay_wallet', title: 'Pay with Wallet', description: `Balance: $${walletBalance.toFixed(2)}` },
        { id: 'voucher_pay_card', title: 'Pay with Card', description: 'Secure via Dodo Payments' },
        { id: 'voucher_cancel', title: 'Cancel', description: 'Return to menu' }
      ]
    }],
    'Confirm Voucher'
  );
}

export async function handleVoucherConfirm(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.buttonId || message.listId;
  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || {};

  if (selection === 'voucher_cancel') {
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, conversation.userId!)
    });
    await chatbot.sendStudentMenu(phone, profile?.name || 'Student');
    return;
  }

  // Handle wallet payment
  if (selection === 'voucher_pay_wallet') {
    const { amount, isGift, recipientEmail, recipientName, personalMessage } = existingData;
    
    // Get customer and wallet balance
    const customer = await db.query.shopCustomers.findFirst({
      where: eq(shopCustomers.userId, conversation.userId!)
    });
    
    const walletBalance = parseFloat(customer?.walletBalance || '0');
    
    if (walletBalance < amount) {
      await whatsappService.sendButtonMessage(
        phone,
        `Insufficient wallet balance.\n\nYour balance: $${walletBalance.toFixed(2)}\nVoucher cost: $${amount.toFixed(2)}\n\nWould you like to add funds or pay with card?`,
        [
          { id: 'wallet_add_funds', title: 'Add Funds' },
          { id: 'voucher_pay_card', title: 'Pay with Card' }
        ]
      );
      return;
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, conversation.userId!)
    });

    const voucherCode = generateVoucherCode();

    // Deduct from wallet
    const newBalance = (walletBalance - amount).toFixed(2);
    await db.update(shopCustomers)
      .set({ walletBalance: newBalance, updatedAt: new Date() })
      .where(eq(shopCustomers.id, customer!.id));

    // Record transaction
    await db.insert(shopTransactions).values({
      customerId: customer!.id,
      type: 'purchase',
      amount: amount.toString(),
      description: `Gift Voucher Purchase - ${voucherCode}`,
      referenceId: voucherCode
    });

    // Create the voucher as paid
    await db.insert(giftVoucherPurchases).values({
      code: voucherCode,
      buyerId: conversation.userId,
      buyerEmail: profile?.email || '',
      buyerName: profile?.name || '',
      recipientEmail: isGift ? recipientEmail : profile?.email || '',
      recipientName: isGift ? recipientName : profile?.name || '',
      amount: amount.toString(),
      personalMessage: personalMessage || null,
      sendToSelf: !isGift,
      paymentMethod: 'wallet',
      paymentStatus: 'completed',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });

    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    
    await whatsappService.sendTextMessage(
      phone,
      `Payment Successful!\n\n` +
      `Paid: $${amount.toFixed(2)} from wallet\n` +
      `New Balance: $${newBalance}\n` +
      `Voucher Code: ${voucherCode}\n\n` +
      `The voucher has been sent to ${isGift ? recipientEmail : "your email"}.\n\n` +
      `Type MENU to return to the main menu.`
    );
    return;
  }

  // Handle Dodo Payments for vouchers
  if (selection === 'voucher_pay' || selection === 'voucher_pay_card') {
    const { amount, isGift, recipientEmail, recipientName, personalMessage } = existingData;
    const voucherCode = generateVoucherCode();

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, conversation.userId!)
    });

    await db.insert(giftVoucherPurchases).values({
      code: voucherCode,
      buyerId: conversation.userId,
      buyerEmail: profile?.email || '',
      buyerName: profile?.name || '',
      recipientEmail: isGift ? recipientEmail : profile?.email || '',
      recipientName: isGift ? recipientName : profile?.name || '',
      amount: amount.toString(),
      personalMessage: personalMessage || null,
      sendToSelf: !isGift,
      paymentMethod: 'dodo',
      paymentStatus: 'pending',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });

    // Dodo Payment Links provided by user
    const dodoProductLinks: Record<number, string> = {
      5: 'https://checkout.dodopayments.com/buy/pdt_0NUau2qZPELIXx6MEZCtH?quantity=1',
      25: 'https://checkout.dodopayments.com/buy/pdt_0NUc4itV57TEkMx00ACtO?quantity=1',
      50: 'https://checkout.dodopayments.com/buy/pdt_0NUc4pfcz2Z1ZJIODtnKU?quantity=1',
      100: 'https://checkout.dodopayments.com/buy/pdt_0NUc505VRJcMBLRPjLib1?quantity=1',
      150: 'https://checkout.dodopayments.com/buy/pdt_0NUc5A2ErZcUIAx36YcYb?quantity=1'
    };

    let paymentUrl = dodoProductLinks[amount];

    // If no direct link exists, or for custom amounts, we'd ideally use the Dodo API
    // For now, we use the provided links or a fallback if needed.
    if (!paymentUrl) {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.BASE_URL || process.env.APP_URL || 'https://edufiliova.com';
      paymentUrl = `${baseUrl}/checkout/voucher?code=${voucherCode}&amount=${amount}&gateway=dodo`;
    }

    await whatsappService.sendPaymentLink(
      phone,
      paymentUrl,
      `$${amount.toFixed(2)}`,
      'Gift Voucher'
    );

    await chatbot.updateConversationFlow(conversation.id, 'idle', {});

    await whatsappService.sendTextMessage(
      phone,
      "Once payment is complete, the voucher will be sent to " +
      (isGift ? `${recipientEmail}` : "your email") + ".\n\n" +
      "Type MENU to return to the main menu."
    );
  }
}

async function handleMyWallet(phone: string, userId: string): Promise<void> {
  const customer = await db.query.shopCustomers.findFirst({
    where: eq(shopCustomers.userId, userId)
  });

  const balance = customer?.walletBalance || '0.00';

  const transactions = await db.select()
    .from(shopTransactions)
    .where(eq(shopTransactions.customerId, customer?.id || ''))
    .orderBy(desc(shopTransactions.createdAt))
    .limit(5);

  let message = `Your Wallet\n\n`;
  message += `Current Balance: $${parseFloat(balance).toFixed(2)}\n\n`;

  if (transactions.length > 0) {
    message += `Recent Transactions:\n`;
    transactions.forEach((t, i) => {
      const sign = t.type === 'add_funds' || t.type === 'refund' ? '+' : '-';
      message += `${i + 1}. ${sign}$${parseFloat(t.amount).toFixed(2)} - ${t.description}\n`;
    });
  } else {
    message += `No recent transactions.`;
  }

  await whatsappService.sendButtonMessage(
    phone,
    message,
    [
      { id: 'wallet_add_funds', title: 'Add Funds' },
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Wallet'
  );
}

async function handleCertificates(phone: string, userId: string): Promise<void> {
  const userCerts = await db.select({
    id: certificates.id,
    courseTitle: certificates.courseTitle,
    verificationCode: certificates.verificationCode,
    certificateUrl: certificates.certificateUrl,
    issueDate: certificates.issueDate
  })
  .from(certificates)
  .where(eq(certificates.userId, userId))
  .orderBy(desc(certificates.issueDate))
  .limit(10);

  if (userCerts.length === 0) {
    await whatsappService.sendButtonMessage(
      phone,
      "You haven't earned any certificates yet.\n\nComplete a course to receive your certificate!",
      [
        { id: 'btn_browse_courses', title: 'Browse Courses' },
        { id: 'btn_back_menu', title: 'Back to Menu' }
      ],
      'Certificates'
    );
    return;
  }

  const certRows = userCerts.map(c => ({
    id: `cert_${c.id}`,
    title: c.courseTitle.substring(0, 24),
    description: c.issueDate 
      ? `Issued: ${new Date(c.issueDate).toLocaleDateString()}`
      : 'View Certificate'
  }));

  await whatsappService.sendListMessage(
    phone,
    `You have ${userCerts.length} certificate(s)!\n\nSelect one to view or download:`,
    'View Certificates',
    [{
      title: 'Your Certificates',
      rows: certRows
    }],
    'Certificates'
  );
}

async function handleReferralProgram(phone: string, userId: string): Promise<void> {
  let customer = await db.query.shopCustomers.findFirst({
    where: eq(shopCustomers.userId, userId)
  });

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId)
  });

  let referralCode = customer?.referralCode;
  
  if (!referralCode && profile) {
    referralCode = generateReferralCode(profile.name);
    
    if (customer) {
      await db.update(shopCustomers)
        .set({ referralCode })
        .where(eq(shopCustomers.id, customer.id));
    }
  }

  const referralCount = customer?.referralCount || 0;
  const rewardThreshold = 5;
  const rewardsEarned = Math.floor(referralCount / rewardThreshold);
  const nextRewardIn = rewardThreshold - (referralCount % rewardThreshold);

  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.BASE_URL || process.env.APP_URL || 'https://edufiliova.com';
  const referralLink = `${baseUrl}/register?ref=${referralCode}`;

  let message = `Referral Program\n\n`;
  message += `Your Referral Code:\n${referralCode}\n\n`;
  message += `Share this link:\n${referralLink}\n\n`;
  message += `Your Stats:\n`;
  message += `• Friends Referred: ${referralCount}\n`;
  message += `• Rewards Earned: ${rewardsEarned}\n`;
  message += `• Next Reward In: ${nextRewardIn} more referrals\n\n`;
  message += `Earn $5 credit for every 5 friends who sign up using your code!`;

  await whatsappService.sendButtonMessage(
    phone,
    message,
    [
      { id: 'ref_share', title: 'Share Link' },
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Referrals'
  );
}

async function handleDownloadApp(phone: string, conversation: WhatsAppConversation): Promise<void> {
  await chatbot.updateConversationFlow(conversation.id, 'download_app', {});
  
  await whatsappService.sendButtonMessage(
    phone,
    "Download EduFiliova App\n\nGet the full experience with our mobile app!\n\nSelect your device:",
    [
      { id: 'app_ios', title: 'iPhone' },
      { id: 'app_android', title: 'Android' },
      { id: 'app_huawei', title: 'Huawei' }
    ],
    'Download App'
  );
}

export async function handleDownloadAppSelection(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.buttonId;
  
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.BASE_URL || process.env.APP_URL || 'https://edufiliova.com';

  let appLink = '';
  let platform = '';

  switch (selection) {
    case 'app_ios':
      appLink = 'https://apps.apple.com/app/edufiliova';
      platform = 'iPhone';
      break;
    case 'app_android':
      appLink = 'https://play.google.com/store/apps/details?id=com.edufiliova';
      platform = 'Android';
      break;
    case 'app_huawei':
      appLink = 'https://appgallery.huawei.com/app/edufiliova';
      platform = 'Huawei';
      break;
    default:
      await handleDownloadApp(phone, conversation);
      return;
  }

  await whatsappService.sendTextMessage(
    phone,
    `Download EduFiliova for ${platform}\n\n${appLink}\n\nNote: Mobile app coming soon! For now, use our web app:\n${baseUrl}\n\nType MENU to return to the main menu.`
  );

  await chatbot.updateConversationFlow(conversation.id, 'idle', {});
}

async function handleHelpSupport(phone: string): Promise<void> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.BASE_URL || process.env.APP_URL || 'https://edufiliova.com';

  await whatsappService.sendButtonMessage(
    phone,
    "Help & Support\n\nHow can we help you?\n\n• For account issues, reply ACCOUNT\n• For payment issues, reply PAYMENT\n• For technical help, reply TECH\n\nOr visit our help center:\n" + baseUrl + "/help",
    [
      { id: 'help_contact', title: 'Contact Support' },
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Help'
  );
}

export async function handleBackToMenu(
  phone: string,
  conversation: WhatsAppConversation
): Promise<void> {
  await chatbot.updateConversationFlow(conversation.id, 'idle', {});
  
  if (!conversation.userId) {
    await chatbot.sendNewUserMenu(phone);
    return;
  }

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
}

export default {
  handleStudentMenuSelection,
  handleVoucherType,
  handleVoucherRecipientEmail,
  handleVoucherRecipientName,
  handleVoucherMessage,
  handleVoucherAmount,
  handleVoucherCustomAmount,
  handleVoucherConfirm,
  handleDownloadAppSelection,
  handleBackToMenu
};
