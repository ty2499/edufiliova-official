import { Request, Response } from 'express';
import { db } from './db';
import { users, profiles, verificationCodes } from '@shared/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as whatsappService from './whatsapp-service';

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

interface FlowDataExchangeRequest {
  version: string;
  action: string;
  screen: string;
  data: Record<string, any>;
  flow_token: string;
}

interface FlowResponse {
  version: string;
  screen?: string;
  data?: Record<string, any>;
}

function decryptFlowRequest(encryptedBody: string, privateKey: string, passphrase: string): any {
  try {
    const [encryptedAesKey, iv, ciphertext] = encryptedBody.split(':');
    
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        passphrase: passphrase,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      Buffer.from(encryptedAesKey, 'base64')
    );
    
    const decipher = crypto.createDecipheriv(
      'aes-128-gcm',
      decryptedAesKey,
      Buffer.from(iv, 'base64')
    );
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final()
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('Flow decryption error:', error);
    return null;
  }
}

function encryptFlowResponse(response: FlowResponse, aesKey: Buffer, iv: Buffer): string {
  const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(response), 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([encrypted, authTag]).toString('base64');
}

export async function handleFlowEndpoint(req: Request, res: Response) {
  try {
    console.log('📱 WhatsApp Flow endpoint called');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { action, screen, data, flow_token, version } = req.body as FlowDataExchangeRequest;
    
    if (action === 'ping') {
      return res.json({
        version: version || '3.0',
        data: { status: 'active' }
      });
    }
    
    if (action === 'INIT') {
      return res.json({
        version: version || '3.0',
        screen: 'SIGN_IN',
        data: {}
      });
    }
    
    if (action === 'data_exchange') {
      const flowAction = data?.action;
      const phone = extractPhoneFromToken(flow_token);
      
      console.log(`📱 Flow action: ${flowAction}, screen: ${screen}`);
      
      switch (flowAction) {
        case 'sign_in':
          return await handleFlowSignIn(req, res, data, phone);
          
        case 'sign_up':
          return await handleFlowSignUp(req, res, data, phone);
          
        case 'forgot_password':
          return await handleFlowForgotPassword(req, res, data, phone);
          
        default:
          if (screen === 'SIGN_IN') {
            return await handleFlowSignIn(req, res, data, phone);
          } else if (screen === 'SIGN_UP') {
            return await handleFlowSignUp(req, res, data, phone);
          } else if (screen === 'FORGOT_PASSWORD') {
            return await handleFlowForgotPassword(req, res, data, phone);
          }
      }
    }
    
    return res.json({
      version: version || '3.0',
      data: { status: 'unknown_action' }
    });
    
  } catch (error: any) {
    console.error('Flow endpoint error:', error);
    return res.status(500).json({
      version: '3.0',
      data: { error: 'Internal server error' }
    });
  }
}

function extractPhoneFromToken(flowToken: string): string | null {
  try {
    if (flowToken && flowToken.includes('_')) {
      const parts = flowToken.split('_');
      return parts[0];
    }
    return flowToken;
  } catch {
    return null;
  }
}

async function handleFlowSignIn(req: Request, res: Response, data: any, phone: string | null) {
  const { email, password } = data;
  
  if (!email || !password) {
    return res.json({
      version: '3.0',
      data: {
        error: true,
        error_message: 'Email and password are required'
      }
    });
  }
  
  try {
    let user = await db
      .select()
      .from(users)
      .where(or(
        eq(users.email, email.toLowerCase()),
        eq(users.userId, email)
      ))
      .limit(1);
    
    if (user.length === 0) {
      const normalizedPhone = email.replace(/\+/g, '');
      const profilesWithPhone = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(or(
          eq(profiles.phoneNumber, email),
          eq(profiles.phoneNumber, `+${normalizedPhone}`),
          eq(profiles.phoneNumber, normalizedPhone)
        ))
        .limit(1);
      
      if (profilesWithPhone.length > 0) {
        user = await db
          .select()
          .from(users)
          .where(eq(users.id, profilesWithPhone[0].userId))
          .limit(1);
      }
    }
    
    if (user.length === 0) {
      return res.json({
        version: '3.0',
        data: {
          error: true,
          error_message: 'Invalid email or password'
        }
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user[0].passwordHash);
    if (!isValidPassword) {
      return res.json({
        version: '3.0',
        data: {
          error: true,
          error_message: 'Invalid email or password'
        }
      });
    }
    
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user[0].id))
      .limit(1);
    
    if (profile.length === 0) {
      return res.json({
        version: '3.0',
        data: {
          error: true,
          error_message: 'User profile not found'
        }
      });
    }
    
    if (profile[0].status === 'banned' || profile[0].status === 'suspended') {
      return res.json({
        version: '3.0',
        data: {
          error: true,
          error_message: 'Account has been suspended. Please contact support.'
        }
      });
    }
    
    if (phone) {
      await whatsappService.sendTextMessage(
        phone,
        `✅ Login successful!\n\nWelcome back, ${profile[0].name}!\n\nYou are now signed into EduFiliova. Access your dashboard at:\nhttps://${process.env.REPLIT_DEV_DOMAIN || 'edufiliova.com'}`
      );
    }
    
    return res.json({
      version: '3.0',
      screen: 'SUCCESS',
      data: {
        extension_message_response: {
          params: {
            flow_token: `${user[0].id}_login_success`,
            logged_in: true,
            user_name: profile[0].name,
            user_role: profile[0].role
          }
        }
      }
    });
    
  } catch (error: any) {
    console.error('Flow sign in error:', error);
    return res.json({
      version: '3.0',
      data: {
        error: true,
        error_message: 'Login failed. Please try again.'
      }
    });
  }
}

async function handleFlowSignUp(req: Request, res: Response, data: any, phone: string | null) {
  const { full_name, email, password, confirm_password, terms_agreement } = data;
  
  if (!full_name || !email || !password) {
    return res.json({
      version: '3.0',
      data: {
        error: true,
        error_message: 'All fields are required'
      }
    });
  }
  
  if (password !== confirm_password) {
    return res.json({
      version: '3.0',
      data: {
        error: true,
        error_message: 'Passwords do not match'
      }
    });
  }
  
  if (!terms_agreement) {
    return res.json({
      version: '3.0',
      data: {
        error: true,
        error_message: 'You must agree to the terms and conditions'
      }
    });
  }
  
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });
    
    if (existingUser) {
      return res.json({
        version: '3.0',
        data: {
          error: true,
          error_message: 'An account with this email already exists'
        }
      });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [newUser] = await db.insert(users).values({
      userId: generateUserId(),
      email: email.toLowerCase(),
      passwordHash,
      educationLevel: 'primary',
      authProvider: 'whatsapp_flow',
      hasCompletedProfile: false,
      hasSelectedRole: false
    }).returning();
    
    await db.insert(profiles).values({
      userId: newUser.id,
      name: full_name,
      email: email.toLowerCase(),
      phoneNumber: phone?.replace(/\+/g, '') || null,
      role: 'student',
      status: 'active'
    });
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://edufiliova.com';
    
    if (phone) {
      await whatsappService.sendTextMessage(
        phone,
        `🎉 Account Created Successfully!\n\nWelcome to EduFiliova, ${full_name}!\n\nYour account has been created. You can now:\n\n• Browse courses\n• Subscribe to unlock all features\n• Connect with teachers\n\nVisit your dashboard:\n${baseUrl}`
      );
    }
    
    return res.json({
      version: '3.0',
      screen: 'SUCCESS',
      data: {
        extension_message_response: {
          params: {
            flow_token: `${newUser.id}_signup_success`,
            account_created: true,
            user_name: full_name
          }
        }
      }
    });
    
  } catch (error: any) {
    console.error('Flow sign up error:', error);
    return res.json({
      version: '3.0',
      data: {
        error: true,
        error_message: 'Registration failed. Please try again.'
      }
    });
  }
}

async function handleFlowForgotPassword(req: Request, res: Response, data: any, phone: string | null) {
  const { email } = data;
  
  if (!email) {
    return res.json({
      version: '3.0',
      data: {
        error: true,
        error_message: 'Email address is required'
      }
    });
  }
  
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });
    
    if (!user) {
      return res.json({
        version: '3.0',
        data: {
          success: true,
          message: 'If an account exists with this email, a reset link has been sent.'
        }
      });
    }
    
    const resetCode = generateVerificationCode();
    
    await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, email.toLowerCase()));
    
    await db.insert(verificationCodes).values({
      contactInfo: email.toLowerCase(),
      type: 'password_reset',
      code: resetCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userData: { userId: user.id }
    });
    
    const { sendEmail, getEmailTemplate } = await import('./routes');
    
    try {
      await sendEmail(
        email.toLowerCase(),
        'Reset Your EduFiliova Password',
        getEmailTemplate('password_reset', { code: resetCode })
      );
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }
    
    if (phone) {
      await whatsappService.sendTextMessage(
        phone,
        `🔐 Password Reset\n\nWe've sent a password reset link to:\n${email}\n\nCheck your email and follow the instructions to reset your password.\n\nThe link expires in 24 hours.`
      );
    }
    
    return res.json({
      version: '3.0',
      screen: 'SUCCESS',
      data: {
        extension_message_response: {
          params: {
            flow_token: 'password_reset_sent',
            reset_sent: true
          }
        }
      }
    });
    
  } catch (error: any) {
    console.error('Flow forgot password error:', error);
    return res.json({
      version: '3.0',
      data: {
        error: true,
        error_message: 'Failed to process request. Please try again.'
      }
    });
  }
}

export async function handleFlowHealthCheck(req: Request, res: Response) {
  return res.json({
    version: '3.0',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
}
