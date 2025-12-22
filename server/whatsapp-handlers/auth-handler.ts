import { db } from '../db';
import { 
  users, 
  profiles, 
  verificationCodes,
  countries,
  whatsappConversations,
  type WhatsAppConversation
} from '@shared/schema';
import { eq, and, ilike } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import * as whatsappService from '../whatsapp-service';
import * as chatbot from '../whatsapp-chatbot';
import type { FlowState, ParsedMessage } from '../whatsapp-chatbot';

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateUserId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function handleLoginEmail(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const input = message.text?.trim();
  
  if (!input) {
    await whatsappService.sendTextMessage(phone, "Please enter your email or phone number:");
    return;
  }

  const isEmail = input.includes('@');
  
  let userProfile = null;
  let authUser = null;

  if (isEmail) {
    authUser = await db.query.users.findFirst({
      where: eq(users.email, input.toLowerCase())
    });
    if (authUser) {
      userProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, authUser.id)
      });
    }
  } else {
    const normalizedPhone = input.replace(/\+/g, '').replace(/\s/g, '');
    userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.phoneNumber, normalizedPhone)
    });
    if (!userProfile) {
      userProfile = await db.query.profiles.findFirst({
        where: eq(profiles.phoneNumber, `+${normalizedPhone}`)
      });
    }
    if (userProfile) {
      authUser = await db.query.users.findFirst({
        where: eq(users.id, userProfile.userId)
      });
    }
  }

  if (!authUser || !userProfile) {
    await whatsappService.sendButtonMessage(
      phone,
      "No account found with that email or phone number.\n\nWould you like to create a new account?",
      [
        { id: 'btn_create_account', title: 'Create Account' },
        { id: 'btn_try_again', title: 'Try Again' }
      ]
    );
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    return;
  }

  await chatbot.updateConversationFlow(conversation.id, 'login_password', {
    userId: authUser.id,
    userEmail: authUser.email,
    userName: userProfile.name,
    userRole: userProfile.role
  });

  await whatsappService.sendTextMessage(phone, "Please enter your password:");
}

export async function handleLoginPassword(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const flowState = conversation.flowState as FlowState;
  const password = message.text?.trim();

  if (!password) {
    await whatsappService.sendTextMessage(phone, "Please enter your password:");
    return;
  }

  const { userId, userName, userRole } = flowState.data;

  const authUser = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!authUser || !authUser.passwordHash) {
    await whatsappService.sendTextMessage(phone, "Login failed. Please try again.");
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    return;
  }

  const isValid = await bcrypt.compare(password, authUser.passwordHash);

  if (!isValid) {
    await whatsappService.sendButtonMessage(
      phone,
      "Incorrect password. Please try again.",
      [
        { id: 'btn_try_again_pwd', title: 'Try Again' },
        { id: 'btn_forgot_pwd', title: 'Forgot Password' },
        { id: 'btn_cancel', title: 'Cancel' }
      ]
    );
    return;
  }

  await chatbot.linkUserToConversation(conversation.id, userId);

  const normalizedPhone = phone.replace(/\+/g, '');
  await db.update(profiles)
    .set({ phoneNumber: normalizedPhone, updatedAt: new Date() })
    .where(eq(profiles.userId, userId));

  await chatbot.updateConversationFlow(conversation.id, 'idle', { loggedIn: true });

  await whatsappService.sendTextMessage(
    phone,
    `Login successful!\n\nWelcome back, ${userName}!`
  );

  if (userRole === 'teacher') {
    await chatbot.sendTeacherMenu(phone, userName);
  } else if (userRole === 'freelancer') {
    await chatbot.sendFreelancerMenu(phone, userName);
  } else {
    await chatbot.sendStudentMenu(phone, userName);
  }
}

export async function handleRegisterRole(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const buttonId = message.buttonId || message.listId;
  const text = message.text?.toLowerCase();

  if (buttonId === 'btn_role_teacher' || buttonId === 'role_teacher' || text === 'teacher') {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';
    
    await whatsappService.sendTextMessage(
      phone,
      `Teacher Registration\n\nTeacher applications require document verification and cannot be completed via WhatsApp.\n\nPlease sign in or create an account on our website:\n${baseUrl}/auth\n\nOnce logged in, you can apply to become a teacher from your dashboard.`
    );
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    return;
  }

  if (buttonId === 'btn_role_freelancer' || buttonId === 'role_freelancer' || text === 'freelancer') {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';
    
    await whatsappService.sendTextMessage(
      phone,
      `Freelancer Registration\n\nFreelancer applications require portfolio submission and cannot be completed via WhatsApp.\n\nPlease sign in or create an account on our website:\n${baseUrl}/auth\n\nOnce logged in, you can apply to become a freelancer from your dashboard.`
    );
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    return;
  }

  await chatbot.updateConversationFlow(conversation.id, 'register_name', { role: 'student' });
  await whatsappService.sendTextMessage(phone, "Let's create your student account!\n\nWhat is your full name?");
}

export async function handleRegisterName(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const name = message.text?.trim();

  if (!name || name.length < 2) {
    await whatsappService.sendTextMessage(phone, "Please enter a valid full name (at least 2 characters):");
    return;
  }

  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || { role: 'student' };
  
  await chatbot.updateConversationFlow(conversation.id, 'register_email', {
    ...existingData,
    name
  });

  await whatsappService.sendTextMessage(phone, `Nice to meet you, ${name}!\n\nWhat is your email address?`);
}

export async function handleRegisterEmail(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const email = message.text?.trim().toLowerCase();

  if (!email || !email.includes('@') || !email.includes('.')) {
    await whatsappService.sendTextMessage(phone, "Please enter a valid email address:");
    return;
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (existingUser) {
    await whatsappService.sendButtonMessage(
      phone,
      "An account with this email already exists.\n\nWould you like to login instead?",
      [
        { id: 'btn_login', title: 'Login' },
        { id: 'btn_different_email', title: 'Use Different Email' }
      ]
    );
    return;
  }

  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || { role: 'student' };
  
  await chatbot.updateConversationFlow(conversation.id, 'register_password', {
    ...existingData,
    email
  });

  await whatsappService.sendTextMessage(
    phone,
    "Create a password for your account.\n\n(Minimum 8 characters, include letters and numbers)"
  );
}

// Continent data for country selection
const CONTINENT_COUNTRIES: Record<string, string[]> = {
  'Africa': ['Nigeria', 'South Africa', 'Ghana', 'Kenya', 'Egypt', 'Ethiopia', 'Tanzania', 'Uganda', 'Morocco', 'Algeria'],
  'Europe': ['United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Poland', 'Belgium', 'Sweden', 'Portugal'],
  'North America': ['United States', 'Canada', 'Mexico'],
  'South America': ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela'],
  'Asia': ['India', 'China', 'Japan', 'Indonesia', 'Philippines', 'Pakistan', 'Bangladesh', 'Vietnam', 'Thailand', 'Malaysia'],
  'Oceania': ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea']
};

export async function handleRegisterPassword(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const password = message.text?.trim();

  if (!password || password.length < 8) {
    await whatsappService.sendTextMessage(
      phone,
      "Password must be at least 8 characters long. Please try again:"
    );
    return;
  }

  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || { role: 'student' };
  const passwordHash = await bcrypt.hash(password, 10);
  
  await chatbot.updateConversationFlow(conversation.id, 'register_continent', {
    ...existingData,
    passwordHash
  });

  // Show continent selection first
  await whatsappService.sendListMessage(
    phone,
    "Which continent are you in?\n\nSelect your continent, then choose your country.",
    'Select Continent',
    [{
      title: 'Continents',
      rows: [
        { id: 'continent_africa', title: 'Africa' },
        { id: 'continent_europe', title: 'Europe' },
        { id: 'continent_north_america', title: 'North America' },
        { id: 'continent_south_america', title: 'South America' },
        { id: 'continent_asia', title: 'Asia' },
        { id: 'continent_oceania', title: 'Oceania' }
      ]
    }],
    'Continent'
  );
}

export async function handleRegisterContinent(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const selection = message.listId || message.text?.toLowerCase().trim();
  
  let continent = '';
  
  if (selection?.startsWith('continent_')) {
    const continentKey = selection.replace('continent_', '').replace(/_/g, ' ');
    continent = Object.keys(CONTINENT_COUNTRIES).find(c => 
      c.toLowerCase() === continentKey
    ) || '';
  } else if (selection) {
    // User typed continent name
    continent = Object.keys(CONTINENT_COUNTRIES).find(c => 
      c.toLowerCase().includes(selection)
    ) || '';
  }

  if (!continent) {
    await whatsappService.sendListMessage(
      phone,
      "Please select a continent from the list:",
      'Select Continent',
      [{
        title: 'Continents',
        rows: [
          { id: 'continent_africa', title: 'Africa' },
          { id: 'continent_europe', title: 'Europe' },
          { id: 'continent_north_america', title: 'North America' },
          { id: 'continent_south_america', title: 'South America' },
          { id: 'continent_asia', title: 'Asia' },
          { id: 'continent_oceania', title: 'Oceania' }
        ]
      }],
      'Continent'
    );
    return;
  }

  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || { role: 'student' };
  
  await chatbot.updateConversationFlow(conversation.id, 'register_country', {
    ...existingData,
    continent
  });

  // Get countries for selected continent from database
  const allCountries = await db.select({ id: countries.id, name: countries.name })
    .from(countries)
    .orderBy(countries.name);

  const continentCountryNames = CONTINENT_COUNTRIES[continent] || [];
  const countryRows = continentCountryNames
    .map(name => allCountries.find(c => c.name === name))
    .filter(Boolean)
    .map(c => ({
      id: `country_${c!.id}`,
      title: c!.name.substring(0, 24)
    }));

  await whatsappService.sendListMessage(
    phone,
    `Select your country in ${continent}:\n\nOr type your country name if not listed.`,
    'Select Country',
    [{
      title: `${continent} Countries`,
      rows: countryRows.length > 0 ? countryRows : [{ id: 'country_other', title: 'Other (type name)' }]
    }],
    'Country'
  );
}

export async function handleRegisterCountry(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  let countryName = '';
  
  if (message.listId?.startsWith('country_')) {
    const countryId = parseInt(message.listId.replace('country_', ''));
    const country = await db.query.countries.findFirst({
      where: eq(countries.id, countryId)
    });
    countryName = country?.name || '';
  } else {
    countryName = message.text?.trim() || '';
  }

  if (!countryName) {
    await whatsappService.sendTextMessage(phone, "Please select or type your country:");
    return;
  }

  const country = await db.query.countries.findFirst({
    where: ilike(countries.name, `%${countryName}%`)
  });

  if (!country) {
    await whatsappService.sendTextMessage(
      phone,
      "Country not found. Please try again or type a different country name:"
    );
    return;
  }

  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || { role: 'student' };
  
  await chatbot.updateConversationFlow(conversation.id, 'register_age', {
    ...existingData,
    country: country.name,
    countryId: country.id
  });

  await whatsappService.sendTextMessage(phone, "How old are you? (Enter your age as a number)");
}

export async function handleRegisterAge(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const ageText = message.text?.trim();
  const age = parseInt(ageText || '');

  if (isNaN(age) || age < 5 || age > 100) {
    await whatsappService.sendTextMessage(phone, "Please enter a valid age (5-100):");
    return;
  }

  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || { role: 'student' };
  
  await chatbot.updateConversationFlow(conversation.id, 'register_grade', {
    ...existingData,
    age
  });

  await whatsappService.sendListMessage(
    phone,
    "What is your education level?",
    'Select Level',
    [{
      title: 'Education Level',
      rows: [
        { id: 'grade_1', title: 'Grade 1-3 (Primary)' },
        { id: 'grade_4', title: 'Grade 4-6 (Primary)' },
        { id: 'grade_7', title: 'Grade 7-9 (Middle)' },
        { id: 'grade_10', title: 'Grade 10-12 (High)' },
        { id: 'grade_college', title: 'College' },
        { id: 'grade_university', title: 'University' }
      ]
    }],
    'Education'
  );
}

export async function handleRegisterGrade(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  console.log(`📝 handleRegisterGrade called for ${phone}`);
  const gradeId = message.listId || message.text?.toLowerCase();
  console.log(`📝 Grade selection: ${gradeId}`);
  
  let grade = 7;
  let educationLevel = 'grade';

  if (gradeId?.includes('1') || gradeId?.includes('grade_1')) {
    grade = 2;
  } else if (gradeId?.includes('4') || gradeId?.includes('grade_4')) {
    grade = 5;
  } else if (gradeId?.includes('7') || gradeId?.includes('grade_7')) {
    grade = 8;
  } else if (gradeId?.includes('10') || gradeId?.includes('grade_10')) {
    grade = 11;
  } else if (gradeId?.includes('college')) {
    grade = 13;
    educationLevel = 'college';
  } else if (gradeId?.includes('university')) {
    grade = 14;
    educationLevel = 'university';
  }

  const flowState = conversation.flowState as FlowState | null;
  const existingData = flowState?.data || { role: 'student' };
  const registrationData: Record<string, any> = {
    ...existingData,
    grade,
    educationLevel
  };

  const emailCode = generateVerificationCode();

  await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, registrationData.email));

  await db.insert(verificationCodes).values({
    contactInfo: registrationData.email,
    type: 'email',
    code: emailCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    userData: {
      ...registrationData,
      phone: phone.replace(/\+/g, ''),
      emailCode
    }
  });

  const { sendEmail, getEmailTemplate } = await import('../routes');
  
  try {
    console.log(`[WhatsApp Registration] Sending verification email to ${registrationData.email} with code ${emailCode}`);
    const emailResult = await sendEmail(
      registrationData.email,
      'Verify Your EduFiliova Account',
      getEmailTemplate('verification', { code: emailCode })
    );
    if (emailResult?.success) {
      console.log(`[WhatsApp Registration] Email sent successfully to ${registrationData.email}, messageId: ${emailResult.messageId}`);
    } else {
      console.error(`[WhatsApp Registration] Email sending failed:`, emailResult?.error || 'Unknown error');
    }
  } catch (error) {
    console.error('[WhatsApp Registration] Failed to send verification email:', error);
  }

  await chatbot.updateConversationFlow(conversation.id, 'verify_email_code', registrationData);

  await whatsappService.sendTextMessage(
    phone,
    `Verification Code Sent!\n\nWe've sent a 6-digit code to:\n${registrationData.email}\n\nPlease enter the code to complete your registration:`
  );
}

export async function handleVerifyEmailCode(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const code = message.text?.trim().replace(/\s/g, '');

  if (!code || code.length !== 6) {
    await whatsappService.sendTextMessage(phone, "Please enter the 6-digit verification code:");
    return;
  }

  const flowState = conversation.flowState as FlowState;
  const { email } = flowState.data;

  const verification = await db.query.verificationCodes.findFirst({
    where: and(
      eq(verificationCodes.contactInfo, email),
      eq(verificationCodes.type, 'email'),
      eq(verificationCodes.isUsed, false)
    )
  });

  if (!verification || verification.code !== code) {
    await whatsappService.sendButtonMessage(
      phone,
      "Invalid verification code. Please check and try again.",
      [
        { id: 'btn_resend_code', title: 'Resend Code' },
        { id: 'btn_cancel', title: 'Cancel' }
      ]
    );
    return;
  }

  if (new Date() > verification.expiresAt) {
    await whatsappService.sendButtonMessage(
      phone,
      "This verification code has expired.",
      [
        { id: 'btn_resend_code', title: 'Resend Code' },
        { id: 'btn_cancel', title: 'Cancel' }
      ]
    );
    return;
  }

  const userData = verification.userData as any;

  const [newUser] = await db.insert(users).values({
    userId: generateUserId(),
    email: userData.email,
    passwordHash: userData.passwordHash,
    educationLevel: userData.educationLevel === 'grade' ? 'primary' : 
                    userData.educationLevel === 'college' ? 'college' : 'university',
    authProvider: 'email',
    hasCompletedProfile: true,
    hasSelectedRole: true
  }).returning();

  await db.insert(profiles).values({
    userId: newUser.id,
    name: userData.name,
    email: userData.email,
    age: userData.age,
    grade: userData.grade,
    educationLevel: userData.educationLevel,
    country: userData.country,
    countryId: userData.countryId,
    phoneNumber: phone.replace(/\+/g, ''),
    role: 'student',
    status: 'active'
  });

  await db.update(verificationCodes)
    .set({ isUsed: true })
    .where(eq(verificationCodes.id, verification.id));

  await chatbot.linkUserToConversation(conversation.id, newUser.id);
  await chatbot.updateConversationFlow(conversation.id, 'idle', { loggedIn: true });

  await whatsappService.sendTextMessage(
    phone,
    `Account Created Successfully!\n\nWelcome to EduFiliova, ${userData.name}!\n\nYou can now login with your email or this phone number.`
  );

  await chatbot.sendStudentMenu(phone, userData.name);
}

export async function handleLinkAccountEmail(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const email = message.text?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    await whatsappService.sendTextMessage(phone, "Please enter a valid email address:");
    return;
  }

  const authUser = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (!authUser) {
    await whatsappService.sendButtonMessage(
      phone,
      "No account found with this email.\n\nWould you like to create a new account?",
      [
        { id: 'btn_create_account', title: 'Create Account' },
        { id: 'btn_try_again', title: 'Try Again' }
      ]
    );
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    return;
  }

  const userProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, authUser.id)
  });

  await chatbot.updateConversationFlow(conversation.id, 'link_account_password', {
    userId: authUser.id,
    userEmail: authUser.email,
    userName: userProfile?.name || 'User',
    userRole: userProfile?.role || 'student'
  });

  await whatsappService.sendTextMessage(phone, "Please enter your password to link this number:");
}

export async function handleLinkAccountPassword(
  phone: string,
  conversation: WhatsAppConversation,
  message: ParsedMessage
): Promise<void> {
  const password = message.text?.trim();
  const flowState = conversation.flowState as FlowState;
  const { userId, userName, userRole } = flowState.data;

  if (!password) {
    await whatsappService.sendTextMessage(phone, "Please enter your password:");
    return;
  }

  const authUser = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!authUser?.passwordHash) {
    await whatsappService.sendTextMessage(phone, "Login failed. Please try again.");
    await chatbot.updateConversationFlow(conversation.id, 'idle', {});
    return;
  }

  const isValid = await bcrypt.compare(password, authUser.passwordHash);

  if (!isValid) {
    await whatsappService.sendButtonMessage(
      phone,
      "Incorrect password.",
      [
        { id: 'btn_try_again_link', title: 'Try Again' },
        { id: 'btn_cancel', title: 'Cancel' }
      ]
    );
    return;
  }

  const normalizedPhone = phone.replace(/\+/g, '');
  await db.update(profiles)
    .set({ phoneNumber: normalizedPhone, updatedAt: new Date() })
    .where(eq(profiles.userId, userId));

  await chatbot.linkUserToConversation(conversation.id, userId);
  await chatbot.updateConversationFlow(conversation.id, 'idle', { loggedIn: true });

  await whatsappService.sendTextMessage(
    phone,
    `Phone Number Linked!\n\nThis WhatsApp number is now linked to your account.\n\nYou can now login with:\nEmail: ${flowState.data.userEmail}\nPhone: ${normalizedPhone}`
  );

  if (userRole === 'teacher') {
    await chatbot.sendTeacherMenu(phone, userName);
  } else if (userRole === 'freelancer') {
    await chatbot.sendFreelancerMenu(phone, userName);
  } else {
    await chatbot.sendStudentMenu(phone, userName);
  }
}

export async function startLoginFlow(phone: string, conversation: WhatsAppConversation): Promise<void> {
  await chatbot.updateConversationFlow(conversation.id, 'login_email', {});
  await whatsappService.sendTextMessage(phone, "Please enter your email or phone number:");
}

export async function startRegisterFlow(phone: string, conversation: WhatsAppConversation): Promise<void> {
  await chatbot.updateConversationFlow(conversation.id, 'register_role', {});
  
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'https://edufiliova.com';
  
  await whatsappService.sendButtonMessage(
    phone,
    `Let's create your account!\n\nBy continuing, you agree to our Terms of Service and Privacy Policy:\n${baseUrl}/terms\n${baseUrl}/privacy-policy\n\nAre you a:`,
    [
      { id: 'btn_role_student', title: 'Student' },
      { id: 'btn_role_teacher', title: 'Teacher' },
      { id: 'btn_role_freelancer', title: 'Freelancer' }
    ],
    'Registration'
  );
}

export async function startLinkFlow(phone: string, conversation: WhatsAppConversation): Promise<void> {
  await chatbot.updateConversationFlow(conversation.id, 'link_account_email', {});
  await whatsappService.sendTextMessage(
    phone,
    "Link this number to your existing account.\n\nPlease enter your account email:"
  );
}

export default {
  handleLoginEmail,
  handleLoginPassword,
  handleRegisterRole,
  handleRegisterName,
  handleRegisterEmail,
  handleRegisterPassword,
  handleRegisterContinent,
  handleRegisterCountry,
  handleRegisterAge,
  handleRegisterGrade,
  handleVerifyEmailCode,
  handleLinkAccountEmail,
  handleLinkAccountPassword,
  startLoginFlow,
  startRegisterFlow,
  startLinkFlow
};

export async function handleLoginPhone(phone: string, conversation: WhatsAppConversation, message: ParsedMessage): Promise<void> {
  const state = conversation.flowState as FlowState | null;
  
  if (!state?.data.loginPhone) {
    await whatsappService.sendTextMessage(
      phone,
      "Please enter your phone number (with or without +):"
    );
    
    await chatbot.updateConversationFlow(conversation.id, 'login_phone', {
      loginPhone: true
    });
  } else {
    const normalizedPhone = message.text?.trim().replace(/\+/g, '') || '';
    
    if (!normalizedPhone) {
      await whatsappService.sendTextMessage(phone, "Please enter a valid phone number");
      return;
    }
    
    await chatbot.updateConversationFlow(conversation.id, 'login_password', {
      loginId: message.text?.trim() || '',
      isPhoneLogin: true
    });
    
    await whatsappService.sendTextMessage(
      phone,
      "Please enter your password:"
    );
  }
}

export async function handleLoginUserID(phone: string, conversation: WhatsAppConversation, message: ParsedMessage): Promise<void> {
  const state = conversation.flowState as FlowState | null;
  
  if (!state?.data.loginUserID) {
    await whatsappService.sendTextMessage(
      phone,
      "Please enter your User ID:"
    );
    
    await chatbot.updateConversationFlow(conversation.id, 'login_userid', {
      loginUserID: true
    });
  } else {
    const userId = message.text?.trim() || '';
    
    if (!userId) {
      await whatsappService.sendTextMessage(phone, "Please enter a valid User ID");
      return;
    }
    
    await chatbot.updateConversationFlow(conversation.id, 'login_password', {
      loginId: userId,
      isUserIDLogin: true
    });
    
    await whatsappService.sendTextMessage(
      phone,
      "Please enter your password:"
    );
  }
}
