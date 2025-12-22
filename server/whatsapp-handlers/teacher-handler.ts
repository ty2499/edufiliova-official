import { db } from '../db';
import { 
  users, 
  profiles, 
  teacherApplications,
  appointments,
  assignments,
  courses,
  teacherAvailability,
  creatorEarningEvents,
  creatorBalances,
  creatorPayoutRequests,
  payoutAccounts,
  type WhatsAppConversation
} from '@shared/schema';
import { eq, and, desc, gte, or } from 'drizzle-orm';
import * as whatsappService from '../whatsapp-service';
import * as chatbot from '../whatsapp-chatbot';
import type { FlowState, ParsedMessage } from '../whatsapp-chatbot';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function handleTeacherMenuSelection(
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

    // Check if teacher application is rejected - only show status
    const application = await db.query.teacherApplications.findFirst({
      where: eq(teacherApplications.userId, userId),
      orderBy: [desc(teacherApplications.createdAt)]
    });

    if (application?.status === 'rejected') {
      // Rejected teachers can only see their status or sign out
      if (selection === 'tch_status') {
        await handleApplicationStatus(phone, userId);
        return;
      } else if (selection === 'tch_signout') {
        await chatbot.signOutUser(phone, conversation.id);
        return;
      } else {
        // Redirect to status-only view for rejected teachers
        await sendRejectedTeacherMenu(phone, userId);
        return;
      }
    }

    switch (selection) {
      case 'tch_status':
        await handleApplicationStatus(phone, userId);
        break;
      case 'tch_bookings':
        await handleMyBookings(phone, userId, conversation);
        break;
      case 'tch_assignments':
        await handleAssignments(phone, userId, conversation);
        break;
      case 'tch_availability':
        await handleAvailability(phone, userId, conversation);
        break;
      case 'tch_earnings':
        await handleEarnings(phone, userId);
        break;
      case 'tch_withdraw':
        await handleWithdraw(phone, userId, conversation);
        break;
      case 'tch_help':
        await handleTeacherHelp(phone);
        break;
      case 'tch_signout':
        await chatbot.signOutUser(phone, conversation.id);
        break;
      default:
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, userId)
        });
        // Check application status before showing full menu
        if (application?.status === 'pending' || application?.status === 'under_review') {
          await sendPendingTeacherMenu(phone, profile?.name || 'Teacher');
        } else {
          await chatbot.sendTeacherMenu(phone, profile?.name || 'Teacher');
        }
    }
  } catch (error) {
    console.error(`[WhatsApp] Teacher menu selection error for ${phone}:`, error);
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    await whatsappService.sendTextMessage(
      phone,
      "Sorry, something went wrong. Type MENU to see your options."
    );
  }
}

async function sendRejectedTeacherMenu(phone: string, userId: string): Promise<void> {
  const application = await db.query.teacherApplications.findFirst({
    where: eq(teacherApplications.userId, userId),
    orderBy: [desc(teacherApplications.createdAt)]
  });

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId)
  });

  let message = `Hello ${profile?.name || 'Teacher'},\n\n`;
  message += `Application Status: Not Approved\n`;
  message += `Submitted: ${application?.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'N/A'}\n`;
  
  if (application?.adminNotes) {
    message += `\nFeedback:\n${application.adminNotes}\n`;
  }

  message += `\nIf you believe this decision was made in error, please contact support@edufiliova.com`;

  await whatsappService.sendButtonMessage(
    phone,
    message,
    [
      { id: 'tch_signout', title: 'Sign Out' }
    ],
    'Application Status'
  );
}

async function sendPendingTeacherMenu(phone: string, name: string): Promise<void> {
  await whatsappService.sendListMessage(
    phone,
    `Hello ${name}!\n\nYour application is being reviewed. You can check your status below.`,
    'View Options',
    [{
      title: 'Teacher Services',
      rows: [
        { id: 'tch_status', title: 'Application Status', description: 'Check approval status' },
        { id: 'tch_help', title: 'Help & Support', description: 'Get assistance' },
        { id: 'tch_signout', title: 'Sign Out', description: 'Log out of your account' }
      ]
    }],
    'Teacher Menu'
  );
}

async function handleApplicationStatus(phone: string, userId: string): Promise<void> {
  const application = await db.query.teacherApplications.findFirst({
    where: eq(teacherApplications.userId, userId),
    orderBy: [desc(teacherApplications.createdAt)]
  });

  if (!application) {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';

    await whatsappService.sendButtonMessage(
      phone,
      "You haven't submitted a teacher application yet.\n\nApply now to start teaching on EduFiliova!",
      [
        { id: 'btn_back_menu', title: 'Back to Menu' }
      ],
      'Application Status'
    );
    
    await whatsappService.sendTextMessage(
      phone,
      `Apply at: ${baseUrl}/apply/teacher`
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
    case 'under_review':
      statusText = 'Under Review';
      break;
  }

  let message = `Application Status\n\n`;
  message += `Status: ${statusText}\n`;
  message += `Submitted: ${new Date(application.submittedAt).toLocaleDateString()}\n`;
  
  if (application.status === 'rejected' && application.adminNotes) {
    message += `\nFeedback:\n${application.adminNotes}\n`;
  }

  if (application.status === 'approved') {
    message += `\nCongratulations! You can now create courses and schedule sessions.`;
  }

  await whatsappService.sendButtonMessage(
    phone,
    message,
    [
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Teacher Status'
  );
}

async function handleMyBookings(phone: string, userId: string, conversation: WhatsAppConversation): Promise<void> {
  const now = new Date();
  
  const bookings = await db.select({
    id: appointments.id,
    title: appointments.title,
    startDate: appointments.startDate,
    endDate: appointments.endDate,
    status: appointments.status,
    subject: appointments.subject,
    studentId: appointments.studentId,
    meetingUrl: appointments.meetingUrl
  })
  .from(appointments)
  .where(
    and(
      eq(appointments.teacherId, userId),
      gte(appointments.startDate, now),
      or(
        eq(appointments.status, 'confirmed'),
        eq(appointments.status, 'scheduled'),
        eq(appointments.status, 'pending')
      )
    )
  )
  .orderBy(appointments.startDate)
  .limit(10);

  if (bookings.length === 0) {
    await whatsappService.sendButtonMessage(
      phone,
      "You don't have any upcoming bookings.\n\nUpdate your availability to receive new booking requests!",
      [
        { id: 'tch_availability', title: 'Set Availability' },
        { id: 'btn_back_menu', title: 'Back to Menu' }
      ],
      'My Bookings'
    );
    return;
  }

  const bookingRows = bookings.map(b => {
    const date = new Date(b.startDate);
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return {
      id: `booking_${b.id}`,
      title: (b.title || b.subject || 'Session').substring(0, 24),
      description: `${dateStr} at ${timeStr} - ${b.status}`
    };
  });

  await whatsappService.sendListMessage(
    phone,
    `You have ${bookings.length} upcoming booking(s).\n\nSelect one to view details or manage:`,
    'View Bookings',
    [{
      title: 'Upcoming Bookings',
      rows: bookingRows
    }],
    'My Bookings'
  );
}

async function handleAssignments(phone: string, userId: string, conversation: WhatsAppConversation): Promise<void> {
  await chatbot.updateConversationFlow(conversation.id, 'assignment_select_course', {});

  const teacherCourses = await db.select({
    id: courses.id,
    title: courses.title
  })
  .from(courses)
  .where(eq(courses.instructorId, userId))
  .limit(10);

  if (teacherCourses.length === 0) {
    await whatsappService.sendButtonMessage(
      phone,
      "You don't have any courses yet.\n\nCreate a course first to add assignments!",
      [
        { id: 'btn_back_menu', title: 'Back to Menu' }
      ],
      'Assignments'
    );
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    return;
  }

  const courseRows = teacherCourses.map(c => ({
    id: `assign_course_${c.id}`,
    title: c.title.substring(0, 24),
    description: 'Select to create assignment'
  }));

  await whatsappService.sendListMessage(
    phone,
    "Create Assignment\n\nSelect a course to add an assignment:",
    'Select Course',
    [{
      title: 'Your Courses',
      rows: courseRows
    }],
    'New Assignment'
  );
}

export async function handleAssignmentSelectCourse(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.listId;
  
  if (!selection?.startsWith('assign_course_')) {
    await whatsappService.sendTextMessage(phone, "Please select a course from the list.");
    return;
  }

  const courseId = selection.replace('assign_course_', '');
  
  await chatbot.updateConversationFlow(conversation.id, 'assignment_title', {
    courseId
  });

  await whatsappService.sendTextMessage(
    phone,
    "Enter the assignment title:\n\n(Example: Week 3 Quiz - Chapter 5)"
  );
}

export async function handleAssignmentTitle(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const title = message.text?.trim();

  if (!title || title.length < 3) {
    await whatsappService.sendTextMessage(
      phone,
      "Please enter a valid assignment title (at least 3 characters):"
    );
    return;
  }

  const flowState = conversation.flowState as FlowState;
  await chatbot.updateConversationFlow(conversation.id, 'assignment_due_date', {
    ...flowState.data,
    title
  });

  await whatsappService.sendTextMessage(
    phone,
    "Enter the due date:\n\n(Format: DD/MM/YYYY)\nExample: 15/12/2024"
  );
}

export async function handleAssignmentDueDate(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const dateText = message.text?.trim();
  
  if (!dateText) {
    await whatsappService.sendTextMessage(phone, "Please enter a due date (DD/MM/YYYY):");
    return;
  }

  const parts = dateText.split(/[\/\-\.]/);
  if (parts.length !== 3) {
    await whatsappService.sendTextMessage(
      phone,
      "Invalid date format. Please use DD/MM/YYYY (e.g., 15/12/2024):"
    );
    return;
  }

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);
  
  const dueDate = new Date(year, month, day, 23, 59, 59);
  
  if (isNaN(dueDate.getTime()) || dueDate < new Date()) {
    await whatsappService.sendTextMessage(
      phone,
      "Please enter a valid future date (DD/MM/YYYY):"
    );
    return;
  }

  const flowState = conversation.flowState as FlowState;
  const { courseId, title } = flowState.data;

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId)
  });

  await db.insert(assignments).values({
    teacherId: conversation.userId!,
    title,
    description: `Assignment for ${course?.title || 'Course'}`,
    subject: course?.title?.split(' ')[0] || 'General',
    grade: 7,
    dueDate,
    status: 'published'
  });

  await chatbot.updateConversationFlow(conversation.id, 'idle', {});

  await whatsappService.sendButtonMessage(
    phone,
    `Assignment Created!\n\nTitle: ${title}\nDue: ${dueDate.toLocaleDateString()}\n\nStudents enrolled in this course will be notified.`,
    [
      { id: 'tch_assignments', title: 'Add Another' },
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Success'
  );
}

async function handleAvailability(phone: string, userId: string, conversation: WhatsAppConversation): Promise<void> {
  await chatbot.updateConversationFlow(conversation.id, 'availability_select_day', {});

  const availability = await db.select()
    .from(teacherAvailability)
    .where(
      and(
        eq(teacherAvailability.teacherId, userId),
        eq(teacherAvailability.isActive, true)
      )
    );

  const availabilityMap = new Map<number, { start: string; end: string }>();
  availability.forEach(a => {
    availabilityMap.set(a.dayOfWeek, { start: a.startTime, end: a.endTime });
  });

  const dayRows = DAYS_OF_WEEK.map((day, index) => {
    const slot = availabilityMap.get(index);
    const status = slot ? `${slot.start} - ${slot.end}` : 'Not set';
    return {
      id: `avail_day_${index}`,
      title: day,
      description: status
    };
  });

  await whatsappService.sendListMessage(
    phone,
    "Update Availability\n\nSelect a day to set your available hours:",
    'Select Day',
    [{
      title: 'Days of Week',
      rows: dayRows
    }],
    'Availability'
  );
}

export async function handleAvailabilitySelectDay(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.listId;
  
  if (!selection?.startsWith('avail_day_')) {
    await whatsappService.sendTextMessage(phone, "Please select a day from the list.");
    return;
  }

  const dayIndex = parseInt(selection.replace('avail_day_', ''));
  const dayName = DAYS_OF_WEEK[dayIndex];

  await chatbot.updateConversationFlow(conversation.id, 'availability_set_hours', {
    dayOfWeek: dayIndex,
    dayName
  });

  await whatsappService.sendButtonMessage(
    phone,
    `Set availability for ${dayName}:\n\nAre you available on ${dayName}?`,
    [
      { id: 'avail_set_hours', title: 'Set Hours' },
      { id: 'avail_not_available', title: 'Not Available' },
      { id: 'btn_back_menu', title: 'Cancel' }
    ],
    `${dayName}`
  );
}

export async function handleAvailabilitySetHours(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.buttonId;
  const flowState = conversation.flowState as FlowState;
  const { dayOfWeek, dayName } = flowState.data;

  if (selection === 'avail_not_available') {
    await db.update(teacherAvailability)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(teacherAvailability.teacherId, conversation.userId!),
          eq(teacherAvailability.dayOfWeek, dayOfWeek)
        )
      );

    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    await whatsappService.sendTextMessage(
      phone,
      `${dayName} marked as not available.\n\nType MENU to return to the main menu.`
    );
    return;
  }

  if (selection === 'avail_set_hours') {
    await whatsappService.sendTextMessage(
      phone,
      `Enter your available hours for ${dayName}:\n\n(Format: HH:MM - HH:MM)\nExample: 09:00 - 17:00`
    );
    return;
  }

  const hoursText = message.text?.trim();
  if (!hoursText) {
    await whatsappService.sendTextMessage(
      phone,
      "Please enter hours in format: HH:MM - HH:MM"
    );
    return;
  }

  const match = hoursText.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) {
    await whatsappService.sendTextMessage(
      phone,
      "Invalid format. Please use HH:MM - HH:MM (e.g., 09:00 - 17:00):"
    );
    return;
  }

  const startTime = `${match[1].padStart(2, '0')}:${match[2]}`;
  const endTime = `${match[3].padStart(2, '0')}:${match[4]}`;

  const existingSlot = await db.query.teacherAvailability.findFirst({
    where: and(
      eq(teacherAvailability.teacherId, conversation.userId!),
      eq(teacherAvailability.dayOfWeek, dayOfWeek)
    )
  });

  if (existingSlot) {
    await db.update(teacherAvailability)
      .set({ 
        startTime, 
        endTime, 
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(teacherAvailability.id, existingSlot.id));
  } else {
    await db.insert(teacherAvailability).values({
      teacherId: conversation.userId!,
      dayOfWeek,
      startTime,
      endTime,
      isActive: true
    });
  }

  await chatbot.updateConversationFlow(conversation.id, 'idle', {});

  await whatsappService.sendButtonMessage(
    phone,
    `Availability Updated!\n\n${dayName}: ${startTime} - ${endTime}\n\nStudents can now book sessions during these hours.`,
    [
      { id: 'tch_availability', title: 'Update More' },
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Updated'
  );
}

async function handleEarnings(phone: string, userId: string): Promise<void> {
  const balance = await db.query.creatorBalances.findFirst({
    where: eq(creatorBalances.creatorId, userId)
  });

  const recentEarnings = await db.select()
    .from(creatorEarningEvents)
    .where(eq(creatorEarningEvents.creatorId, userId))
    .orderBy(desc(creatorEarningEvents.eventDate))
    .limit(5);

  const available = parseFloat(balance?.availableBalance || '0');
  const pending = parseFloat(balance?.pendingBalance || '0');
  const lifetime = parseFloat(balance?.lifetimeEarnings || '0');

  let message = `Your Earnings\n\n`;
  message += `Available Balance: $${available.toFixed(2)}\n`;
  message += `Pending: $${pending.toFixed(2)}\n`;
  message += `Lifetime Earnings: $${lifetime.toFixed(2)}\n\n`;

  if (recentEarnings.length > 0) {
    message += `Recent Earnings:\n`;
    recentEarnings.forEach((e, i) => {
      const date = new Date(e.eventDate).toLocaleDateString();
      message += `${i + 1}. $${parseFloat(e.creatorAmount).toFixed(2)} - ${e.eventType.replace(/_/g, ' ')}\n`;
    });
  }

  await whatsappService.sendButtonMessage(
    phone,
    message,
    [
      { id: 'tch_withdraw', title: 'Withdraw Funds' },
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Earnings'
  );
}

async function handleWithdraw(phone: string, userId: string, conversation: WhatsAppConversation): Promise<void> {
  const balance = await db.query.creatorBalances.findFirst({
    where: eq(creatorBalances.creatorId, userId)
  });

  const available = parseFloat(balance?.availableBalance || '0');

  if (available < 10) {
    await whatsappService.sendButtonMessage(
      phone,
      `Withdraw Funds\n\nYour available balance: $${available.toFixed(2)}\n\nMinimum withdrawal amount is $10.00\n\nKeep teaching to earn more!`,
      [
        { id: 'btn_back_menu', title: 'Back to Menu' }
      ],
      'Withdraw'
    );
    return;
  }

  const payoutAccount = await db.query.payoutAccounts.findFirst({
    where: and(
      eq(payoutAccounts.userId, userId),
      eq(payoutAccounts.isDefault, true)
    )
  });

  await chatbot.updateConversationFlow(conversation.id, 'withdraw_amount', {
    availableBalance: available,
    payoutAccountId: payoutAccount?.id
  });

  let message = `Withdraw Funds\n\n`;
  message += `Available: $${available.toFixed(2)}\n`;
  
  if (payoutAccount) {
    message += `Payout Method: ${payoutAccount.accountName}\n`;
  }
  
  message += `\nEnter the amount to withdraw (minimum $10):`;

  await whatsappService.sendTextMessage(phone, message);
}

export async function handleWithdrawAmount(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const flowState = conversation.flowState as FlowState;
  const { availableBalance, payoutAccountId } = flowState.data;
  
  const amountText = message.text?.replace(/[^0-9.]/g, '');
  const amount = parseFloat(amountText || '0');

  if (isNaN(amount) || amount < 10) {
    await whatsappService.sendTextMessage(
      phone,
      "Minimum withdrawal is $10.00. Please enter a valid amount:"
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
    await chatbot.updateConversationFlow(conversation.id, 'withdraw_method', {
      ...flowState.data,
      amount
    });

    await whatsappService.sendButtonMessage(
      phone,
      "Select your payout method:",
      [
        { id: 'payout_bank', title: 'Bank Transfer' },
        { id: 'payout_paypal', title: 'PayPal' },
        { id: 'payout_mobile', title: 'Mobile Money' }
      ],
      'Payout Method'
    );
    return;
  }

  await processWithdrawal(phone, conversation, amount, payoutAccountId);
}

export async function handleWithdrawMethod(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.buttonId;
  const flowState = conversation.flowState as FlowState;
  const { amount } = flowState.data;

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

async function processWithdrawal(
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
    `Withdrawal Request Submitted!\n\nAmount: $${amount.toFixed(2)}\nMethod: ${payoutAccount?.accountName || 'Default'}\n\nYour request is being processed. Payouts are typically completed by the 5th of each month.`,
    [
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Request Sent'
  );
}

async function handleTeacherHelp(phone: string): Promise<void> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'https://edufiliova.com';

  await whatsappService.sendButtonMessage(
    phone,
    "Teacher Help & Support\n\n• For course creation, reply COURSE\n• For payment issues, reply PAYMENT\n• For student issues, reply STUDENT\n\nVisit our teacher resources:\n" + baseUrl + "/teacher-resources",
    [
      { id: 'help_contact', title: 'Contact Support' },
      { id: 'btn_back_menu', title: 'Back to Menu' }
    ],
    'Help'
  );
}

export default {
  handleTeacherMenuSelection,
  handleAssignmentSelectCourse,
  handleAssignmentTitle,
  handleAssignmentDueDate,
  handleAvailabilitySelectDay,
  handleAvailabilitySetHours,
  handleWithdrawAmount,
  handleWithdrawMethod
};
