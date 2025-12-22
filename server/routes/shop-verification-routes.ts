import { Router } from "express";
import { db } from "../db";
import { users, profiles, shopCustomers, shopMemberships, userLoginSessions } from "../../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../storage.js";
import { emailService } from "../utils/email.js";

const router = Router();

function generateUserId(): string {
  const timestamp = Date.now().toString().slice(-7);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `S${timestamp}${random}`;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send 6-digit verification code to shop customer email
router.post("/shop/send-verification-code", async (req, res) => {
  try {
    const { email, fullName, password } = req.body;

    if (!email || !fullName || !password) {
      return res.status(400).json({
        success: false,
        error: "Email, full name, and password are required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long"
      });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Email already registered. Please sign in instead."
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Delete any existing pending signup for this email
    await storage.deletePendingShopSignup(email).catch(() => {});
    
    await storage.createPendingShopSignup({
      email,
      fullName,
      passwordHash: hashedPassword,
      verificationCode,
      expiresAt
    });

    // Send verification code email
    const emailSent = await emailService.sendShopVerificationEmail(email, {
      fullName,
      verificationCode
    });

    if (emailSent) {
      console.log(`✅ Shop verification code email sent to ${email}`);
    } else {
      console.warn(`⚠️ Failed to send shop verification email to ${email}, but verification code was saved`);
    }

    res.json({
      success: true,
      message: "Please check your email for the verification code.",
      email,
      needsVerification: true // Code-based verification
    });

  } catch (error) {
    console.error('❌ Shop send verification code error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to send verification code"
    });
  }
});

// Verify shop customer via link token and create account
router.get("/shop/verify-link", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Verification token is required"
      });
    }

    // Find pending signup by token
    const pendingSignup = await storage.getPendingShopSignupByToken(token);

    if (!pendingSignup) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification link. Please register again."
      });
    }

    if (new Date() > pendingSignup.expiresAt) {
      await storage.deletePendingShopSignup(pendingSignup.email);
      return res.status(400).json({
        success: false,
        error: "Verification link has expired. Please register again."
      });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, pendingSignup.email))
      .limit(1);

    if (existingUser.length > 0) {
      await storage.deletePendingShopSignup(pendingSignup.email);
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists"
      });
    }

    // Create the user account
    let userIdToUse = generateUserId();

    const newUser = await db.insert(users).values({
      userId: userIdToUse,
      email: pendingSignup.email,
      passwordHash: pendingSignup.passwordHash,
      isEmailVerified: true,
      isPhoneVerified: false
    }).returning();

    const newProfile = await db.insert(profiles).values({
      userId: newUser[0].id,
      name: pendingSignup.fullName,
      age: 18,
      grade: 12,
      country: 'United States',
      role: 'general',
      status: 'active'
    }).returning();

    const newCustomer = await db.insert(shopCustomers).values({
      userId: newUser[0].id,
      fullName: pendingSignup.fullName,
      email: pendingSignup.email,
      accountType: 'free'
    }).returning();

    if (newCustomer[0]) {
      await db.insert(shopMemberships).values({
        customerId: newCustomer[0].id,
        plan: 'free',
        status: 'active',
        billingCycle: 'monthly'
      });
    }

    // Create session
    const sessionId = uuidv4();
    await db.insert(userLoginSessions).values({
      userId: newUser[0].id,
      sessionId,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || 'Unknown',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Clean up pending signup
    await storage.deletePendingShopSignup(pendingSignup.email);

    // Redirect to shop with session info in URL (will be picked up by frontend)
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.BASE_URL || 'http://localhost:5000';
    
    res.redirect(`${baseUrl}/shop-auth?verified=true&session=${sessionId}`);

  } catch (error) {
    console.error('❌ Shop verify link error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to verify email"
    });
  }
});

// Keep legacy code verification endpoint for backwards compatibility
router.post("/shop/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: "Email and verification code are required"
      });
    }

    const pendingSignup = await storage.getPendingShopSignup(email);

    if (!pendingSignup) {
      return res.status(400).json({
        success: false,
        error: "No pending signup found. Please start the signup process again."
      });
    }

    if (pendingSignup.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        error: "Invalid verification code"
      });
    }

    if (new Date() > pendingSignup.expiresAt) {
      return res.status(400).json({
        success: false,
        error: "Verification code has expired. Please request a new code."
      });
    }

    let userIdToUse = generateUserId();

    const newUser = await db.insert(users).values({
      userId: userIdToUse,
      email: pendingSignup.email,
      passwordHash: pendingSignup.passwordHash,
      isEmailVerified: true,
      isPhoneVerified: false
    }).returning();

    const newProfile = await db.insert(profiles).values({
      userId: newUser[0].id,
      name: pendingSignup.fullName,
      age: 18,
      grade: 12,
      country: 'United States',
      role: 'general',
      status: 'active'
    }).returning();

    const newCustomer = await db.insert(shopCustomers).values({
      userId: newUser[0].id,
      fullName: pendingSignup.fullName,
      email: pendingSignup.email,
      accountType: 'free'
    }).returning();

    if (newCustomer[0]) {
      await db.insert(shopMemberships).values({
        customerId: newCustomer[0].id,
        plan: 'free',
        status: 'active',
        billingCycle: 'monthly'
      });
    }

    const sessionId = uuidv4();
    await db.insert(userLoginSessions).values({
      userId: newUser[0].id,
      sessionId,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || 'Unknown',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await storage.deletePendingShopSignup(email);

    res.json({
      success: true,
      user: {
        id: newUser[0].id,
        userId: newUser[0].userId,
        email: newUser[0].email
      },
      profile: newProfile[0],
      sessionId
    });

  } catch (error) {
    console.error('❌ Shop verify code error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to verify code"
    });
  }
});

// Resend 6-digit verification code for shop signup
router.post("/shop/resend-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    const pendingSignup = await storage.getPendingShopSignup(email);
    if (!pendingSignup) {
      return res.status(404).json({
        success: false,
        error: "No pending signup found with this email"
      });
    }

    // Generate new 6-digit verification code
    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    await storage.updatePendingShopSignupCode(email, newVerificationCode, expiresAt);

    // Send verification code email
    const emailSent = await emailService.sendShopVerificationEmail(email, {
      fullName: pendingSignup.fullName,
      verificationCode: newVerificationCode
    });

    if (emailSent) {
      console.log(`✅ Shop verification code resent to ${email}`);
    } else {
      console.warn(`⚠️ Failed to resend shop verification email to ${email}, but verification code was saved`);
    }

    res.json({
      success: true,
      message: "A new verification code has been sent to your email"
    });

  } catch (error) {
    console.error('❌ Shop resend code error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to resend verification code"
    });
  }
});

export default router;
