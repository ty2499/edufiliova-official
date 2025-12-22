import { db } from '../db';
import { 
  users, 
  profiles, 
  freelancerApplications,
  projects,
  shopCustomers,
  shopMemberships,
  shopTransactions,
  creatorBalances,
  creatorPayoutRequests,
  payoutAccounts,
  type WhatsAppConversation
} from '@shared/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import * as whatsappService from '../whatsapp-service';
import * as chatbot from '../whatsapp-chatbot';
import type { FlowState, ParsedMessage } from '../whatsapp-chatbot';

const MEMBERSHIP_PLANS = {
  free: { name: 'Free', monthlyPrice: 0, features: ['Basic profile', '5 downloads/day', 'Limited uploads'] },
  creator: { name: 'Creator', monthlyPrice: 9.99, features: ['Enhanced profile', '30 downloads/day', 'Priority listing', '1 ad/year'] },
  pro: { name: 'Pro', monthlyPrice: 24.99, features: ['Premium profile', 'Unlimited downloads', 'Featured listing', '3 ads/year'] },
  business: { name: 'Business', monthlyPrice: 49.99, features: ['Business profile', 'Unlimited everything', 'Top listing', 'Unlimited ads'] }
};

export async function handleFreelancerMenuSelection(
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
      case 'frl_status':
        await handleApplicationStatus(phone, userId);
        break;
      case 'frl_orders':
        await handleMyOrders(phone, userId);
        break;
      case 'frl_wallet':
        await handleWalletAndEarnings(phone, userId);
        break;
      case 'frl_upgrade':
        await handleUpgradePlan(phone, userId, conversation);
        break;
      case 'frl_withdraw':
        await handleWithdraw(phone, userId, conversation);
        break;
      case 'frl_help':
        await handleFreelancerHelp(phone);
        break;
      case 'frl_signout':
        await chatbot.signOutUser(phone, conversation.id);
        break;
      default:
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, userId)
        });
        await chatbot.sendFreelancerMenu(phone, profile?.name || 'Freelancer');
    }
  } catch (error) {
    console.error(`❌ [WhatsApp] Freelancer menu selection error for ${phone}:`, error);
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    await whatsappService.sendTextMessage(
      phone,
      "Sorry, something went wrong. Type MENU to see your options."
    );
  }
}

async function handleApplicationStatus(phone: string, userId: string): Promise<void> {
  const application = await db.query.freelancerApplications.findFirst({
    where: eq(freelancerApplications.userId, userId),
    orderBy: [desc(freelancerApplications.createdAt)]
  });

  if (!application) {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';

    await whatsappService.sendButtonMessage(
      phone,
      "You haven't submitted a freelancer application yet.\n\nJoin our community of creative professionals!",
      [
        { id: 'btn_back_menu', title: 'Back to Menu' }
      ],
      'Application Status'
    );
    
    await whatsappService.sendTextMessage(
      phone,
      `Apply at: ${baseUrl}/apply/freelancer`
    );
    return;
  }

  let statusText = 'Pending Review';
  
  switch (application.status) {
    case 'approved':
      statusText = 'Approved';
      break;
    case 'rejected':
      statusText = 'Rejected';
      break;
  }

  let message = `Application Status\n\n`;
  message += `Status: ${statusText}\n`;
  message += `Display Name: ${application.displayName}\n`;
  message += `Category: ${application.primaryCategory}\n`;
  message += `Submitted: ${new Date(application.createdAt).toLocaleDateString()}\n`;
  
  if (application.status === 'rejected' && application.rejectionReason) {
    message += `\nReason:\n${application.rejectionReason}\n`;
  }

  if (application.status === 'approved') {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';
    message += `\nYour profile is live!\nView it: ${baseUrl}/freelancer/${application.displayName}`;
  }

  await whatsappService.sendButtonMessage(
    phone,
    message,
    [
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Freelancer Status'
  );
}

async function handleMyOrders(phone: string, userId: string): Promise<void> {
  const orders = await db.select({
    id: projects.id,
    title: projects.title,
    status: projects.status,
    budget: projects.budget,
    deadline: projects.deadline,
    createdAt: projects.createdAt
  })
  .from(projects)
  .where(eq(projects.freelancerId, userId))
  .orderBy(desc(projects.createdAt))
  .limit(10);

  if (orders.length === 0) {
    await whatsappService.sendButtonMessage(
      phone,
      "You don't have any orders yet.\n\nComplete your profile and portfolio to start receiving orders!",
      [
        { id: 'btn_back_menu', title: 'Back to Menu' }
      ],
      'My Orders'
    );
    return;
  }

  const activeOrders = orders.filter(o => 
    ['active', 'pending', 'in_progress', 'waiting_review'].includes(o.status)
  );
  const completedOrders = orders.filter(o => o.status === 'completed');

  let message = `Your Orders\n\n`;
  message += `Active: ${activeOrders.length}\n`;
  message += `Completed: ${completedOrders.length}\n\n`;

  if (activeOrders.length > 0) {
    message += `Active Orders:\n`;
    activeOrders.slice(0, 5).forEach((o, i) => {
      const status = o.status.replace(/_/g, ' ');
      const budget = o.budget ? `$${parseFloat(o.budget).toFixed(2)}` : 'TBD';
      message += `${i + 1}. ${o.title.substring(0, 20)} - ${status} (${budget})\n`;
    });
  }

  const orderRows = orders.map(o => ({
    id: `order_${o.id}`,
    title: o.title.substring(0, 24),
    description: `${o.status.replace(/_/g, ' ')} - $${o.budget ? parseFloat(o.budget).toFixed(2) : '0'}`
  }));

  await whatsappService.sendListMessage(
    phone,
    message,
    'View Orders',
    [{
      title: 'All Orders',
      rows: orderRows
    }],
    'Orders'
  );
}

async function handleWalletAndEarnings(phone: string, userId: string): Promise<void> {
  const customer = await db.query.shopCustomers.findFirst({
    where: eq(shopCustomers.userId, userId)
  });

  const balance = await db.query.creatorBalances.findFirst({
    where: eq(creatorBalances.creatorId, userId)
  });

  const walletBalance = parseFloat(customer?.walletBalance || '0');
  const availableBalance = parseFloat(balance?.availableBalance || '0');
  const pendingBalance = parseFloat(balance?.pendingBalance || '0');
  const lifetimeEarnings = parseFloat(balance?.lifetimeEarnings || '0');

  const transactions = await db.select()
    .from(shopTransactions)
    .where(eq(shopTransactions.customerId, customer?.id || ''))
    .orderBy(desc(shopTransactions.createdAt))
    .limit(5);

  let message = `Wallet & Earnings\n\n`;
  message += `Wallet Balance: $${walletBalance.toFixed(2)}\n`;
  message += `Available for Withdrawal: $${availableBalance.toFixed(2)}\n`;
  message += `Pending: $${pendingBalance.toFixed(2)}\n`;
  message += `Lifetime Earnings: $${lifetimeEarnings.toFixed(2)}\n\n`;

  if (transactions.length > 0) {
    message += `Recent Activity:\n`;
    transactions.forEach((t, i) => {
      const sign = t.type === 'add_funds' || t.type === 'refund' ? '+' : '-';
      message += `${i + 1}. ${sign}$${parseFloat(t.amount).toFixed(2)} - ${t.description.substring(0, 20)}\n`;
    });
  }

  await whatsappService.sendButtonMessage(
    phone,
    message,
    [
      { id: 'frl_withdraw', title: 'Withdraw' },
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Wallet'
  );
}

async function handleUpgradePlan(phone: string, userId: string, conversation: WhatsAppConversation): Promise<void> {
  const customer = await db.query.shopCustomers.findFirst({
    where: eq(shopCustomers.userId, userId)
  });

  const membership = await db.query.shopMemberships.findFirst({
    where: customer ? eq(shopMemberships.customerId, customer.id) : undefined
  });

  const currentPlan = membership?.plan || customer?.accountType || 'free';
  const currentPlanInfo = MEMBERSHIP_PLANS[currentPlan as keyof typeof MEMBERSHIP_PLANS] || MEMBERSHIP_PLANS.free;

  let message = `Your Plan: ${currentPlanInfo.name}\n\n`;
  message += `Current Features:\n`;
  currentPlanInfo.features.forEach(f => {
    message += `• ${f}\n`;
  });
  message += `\n`;

  const availablePlans = Object.entries(MEMBERSHIP_PLANS)
    .filter(([key]) => key !== currentPlan)
    .map(([key, plan]) => ({
      id: `plan_${key}`,
      title: plan.name,
      description: plan.monthlyPrice > 0 ? `$${plan.monthlyPrice}/month` : 'Free'
    }));

  if (availablePlans.length === 0 || currentPlan === 'business') {
    await whatsappService.sendButtonMessage(
      phone,
      message + "You're on the highest plan!",
      [
        { id: 'btn_back_menu', title: 'Back to Menu' }
      ],
      'Your Plan'
    );
    return;
  }

  await chatbot.updateConversationFlow(conversation.id, 'upgrade_plan_select', {
    currentPlan
  });

  await whatsappService.sendListMessage(
    phone,
    message + "Select a plan to upgrade:",
    'View Plans',
    [{
      title: 'Available Plans',
      rows: availablePlans
    }],
    'Upgrade Plan'
  );
}

export async function handleUpgradePlanSelect(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.listId;
  
  if (!selection?.startsWith('plan_')) {
    await whatsappService.sendTextMessage(phone, "Please select a plan from the list.");
    return;
  }

  const planKey = selection.replace('plan_', '') as keyof typeof MEMBERSHIP_PLANS;
  const plan = MEMBERSHIP_PLANS[planKey];

  if (!plan) {
    await whatsappService.sendTextMessage(phone, "Invalid plan selection. Please try again.");
    return;
  }

  const flowState = conversation.flowState as FlowState;
  
  if (plan.monthlyPrice === 0) {
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    await whatsappService.sendTextMessage(
      phone,
      "You're already eligible for the Free plan. No action needed!\n\nType MENU to return to the main menu."
    );
    return;
  }

  await chatbot.updateConversationFlow(conversation.id, 'upgrade_plan_confirm', {
    ...flowState.data,
    selectedPlan: planKey,
    planName: plan.name,
    monthlyPrice: plan.monthlyPrice
  });

  let message_text = `Upgrade to ${plan.name}\n\n`;
  message_text += `Price: $${plan.monthlyPrice}/month\n\n`;
  message_text += `Features:\n`;
  plan.features.forEach(f => {
    message_text += `• ${f}\n`;
  });
  message_text += `\nProceed with upgrade?`;

  await whatsappService.sendButtonMessage(
    phone,
    message_text,
    [
      { id: 'upgrade_confirm', title: 'Upgrade Now' },
      { id: 'btn_back_menu', title: 'Cancel' }
    ],
    'Confirm Upgrade'
  );
}

export async function handleUpgradePlanConfirm(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.buttonId;

  if (selection !== 'upgrade_confirm') {
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, conversation.userId!)
    });
    await chatbot.sendFreelancerMenu(phone, profile?.name || 'Freelancer');
    return;
  }

  const flowState = conversation.flowState as FlowState;
  const { selectedPlan, planName, monthlyPrice } = flowState.data;

  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'https://edufiliova.com';
  
  const paymentUrl = `${baseUrl}/checkout/membership?plan=${selectedPlan}`;

  await whatsappService.sendPaymentLink(
    phone,
    paymentUrl,
    `$${monthlyPrice}/month`,
    `${planName} Plan`
  );

  await chatbot.updateConversationFlow(conversation.id, 'idle', {});
  
  await whatsappService.sendTextMessage(
    phone,
    "Complete the payment to activate your new plan.\n\nType MENU to return to the main menu."
  );
}

async function handleWithdraw(phone: string, userId: string, conversation: WhatsAppConversation): Promise<void> {
  const balance = await db.query.creatorBalances.findFirst({
    where: eq(creatorBalances.creatorId, userId)
  });

  const available = parseFloat(balance?.availableBalance || '0');

  if (available < 50) {
    await whatsappService.sendButtonMessage(
      phone,
      `💳 Withdraw Funds\n\nYour available balance: $${available.toFixed(2)}\n\nMinimum withdrawal for freelancers is $50.00\n\nKeep creating to earn more!`,
      [
        { id: 'btn_back_menu', title: 'Back to Menu' }
      ],
      '💳 Withdraw'
    );
    return;
  }

  const payoutAccount = await db.query.payoutAccounts.findFirst({
    where: and(
      eq(payoutAccounts.userId, userId),
      eq(payoutAccounts.isDefault, true)
    )
  });

  await chatbot.updateConversationFlow(conversation.id, 'frl_withdraw_amount', {
    availableBalance: available,
    payoutAccountId: payoutAccount?.id
  });

  let message = `💳 Withdraw Funds\n\n`;
  message += `💵 Available: $${available.toFixed(2)}\n`;
  
  if (payoutAccount) {
    message += `🏦 Payout Method: ${payoutAccount.accountName}\n`;
  }
  
  message += `\nEnter the amount to withdraw (minimum $50):`;

  await whatsappService.sendTextMessage(phone, message);
}

export async function handleFreelancerWithdrawAmount(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const flowState = conversation.flowState as FlowState;
  const { availableBalance, payoutAccountId } = flowState.data;
  
  const amountText = message.text?.replace(/[^0-9.]/g, '');
  const amount = parseFloat(amountText || '0');

  if (isNaN(amount) || amount < 50) {
    await whatsappService.sendTextMessage(
      phone,
      "Minimum withdrawal is $50.00. Please enter a valid amount:"
    );
    return;
  }

  if (amount > availableBalance) {
    await whatsappService.sendTextMessage(
      phone,
      `Insufficient balance. Your available balance is $${availableBalance.toFixed(2)}:`
    );
    return;
  }

  if (!payoutAccountId) {
    await chatbot.updateConversationFlow(conversation.id, 'frl_withdraw_method', {
      ...flowState.data,
      amount
    });

    await whatsappService.sendButtonMessage(
      phone,
      "Select your payout method:",
      [
        { id: 'payout_bank', title: '🏦 Bank Transfer' },
        { id: 'payout_paypal', title: '💳 PayPal' },
        { id: 'payout_mobile', title: '📱 Mobile Money' }
      ],
      '💳 Payout Method'
    );
    return;
  }

  await processFreelancerWithdrawal(phone, conversation, amount, payoutAccountId);
}

export async function handleFreelancerWithdrawMethod(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.buttonId;
  const flowState = conversation.flowState as FlowState;

  let payoutMethod = 'bank';
  switch (selection) {
    case 'payout_bank': payoutMethod = 'bank'; break;
    case 'payout_paypal': payoutMethod = 'paypal'; break;
    case 'payout_mobile': payoutMethod = 'mobile_money'; break;
    default:
      await whatsappService.sendTextMessage(phone, "Please select a payout method.");
      return;
  }

  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'https://edufiliova.com';

  await whatsappService.sendTextMessage(
    phone,
    `To complete your withdrawal, please set up your ${payoutMethod === 'mobile_money' ? 'mobile money' : payoutMethod} details on our website:\n\n${baseUrl}/dashboard/payout-settings\n\nOnce set up, you can request withdrawals here.`
  );

  await chatbot.updateConversationFlow(conversation.id, 'idle', {});
}

async function processFreelancerWithdrawal(
  phone: string,
  conversation: WhatsAppConversation,
  amount: number,
  payoutAccountId: string
): Promise<void> {
  const payoutAccount = await db.query.payoutAccounts.findFirst({
    where: eq(payoutAccounts.id, payoutAccountId)
  });

  await db.insert(creatorPayoutRequests).values({
    creatorId: conversation.userId!,
    amountRequested: amount.toString(),
    payoutMethod: payoutAccount?.type || 'bank',
    payoutAccountId,
    status: 'awaiting_admin'
  });

  const currentBalance = await db.query.creatorBalances.findFirst({
    where: eq(creatorBalances.creatorId, conversation.userId!)
  });

  if (currentBalance) {
    await db.update(creatorBalances)
      .set({
        availableBalance: (parseFloat(currentBalance.availableBalance) - amount).toString(),
        pendingBalance: (parseFloat(currentBalance.pendingBalance) + amount).toString(),
        updatedAt: new Date()
      })
      .where(eq(creatorBalances.creatorId, conversation.userId!));
  }

  await chatbot.updateConversationFlow(conversation.id, 'idle', {});

  await whatsappService.sendButtonMessage(
    phone,
    `✅ Withdrawal Request Submitted!\n\n💵 Amount: $${amount.toFixed(2)}\n🏦 Method: ${payoutAccount?.accountName || 'Default'}\n\nPayouts are processed by the 5th of each month.`,
    [
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    '✅ Request Sent'
  );
}

async function handleFreelancerHelp(phone: string): Promise<void> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'https://edufiliova.com';

  await whatsappService.sendButtonMessage(
    phone,
    "❓ Freelancer Help & Support\n\n• For portfolio help, reply PORTFOLIO\n• For payment issues, reply PAYMENT\n• For client issues, reply CLIENT\n\nVisit our freelancer resources:\n" + baseUrl + "/freelancer-resources",
    [
      { id: 'help_contact', title: 'Contact Support' },
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    '❓ Help'
  );
}

export default {
  handleFreelancerMenuSelection,
  handleUpgradePlanSelect,
  handleUpgradePlanConfirm,
  handleFreelancerWithdrawAmount,
  handleFreelancerWithdrawMethod
};
