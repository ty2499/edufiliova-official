import { Router } from 'express';
import { db } from '../db.js';
import { freelancerApplications, portfolioSamples, users, profiles, pendingRegistrations, insertFreelancerApplicationSchema, insertPortfolioSampleSchema } from '../../shared/schema.js';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { emailService } from '../utils/email.js';
import { eq, desc, and, gt } from 'drizzle-orm';
import { storage as dbStorage } from '../storage.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function generateUserId(): string {
  const timestamp = Date.now().toString().slice(-7);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `F${timestamp}${random}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/portfolio-samples';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and ZIP files are allowed.'));
    }
  }
});

const portfolioSampleValidation = z.object({
  title: z.string().min(1, 'Sample title is required'),
  category: z.string().min(1, 'Sample category is required'),
  description: z.string().min(1, 'Sample description is required'),
  files: z.array(z.string()).min(1, 'At least one file is required for each sample'),
});

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Initiate freelancer application - Stores data in pending_registrations and sends verification code
// User/profile/application is NOT created until verification code is entered
router.post('/applications/initiate', async (req, res) => {
  try {
    const { fullName, displayName, email, phoneNumber, country, password } = req.body;

    if (!fullName || !displayName || !email || !phoneNumber || !country || !password) {
      return res.status(400).json({
        success: false,
        error: "All fields are required: fullName, displayName, email, phoneNumber, country, password"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    // Check if email already exists in verified users
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists"
      });
    }

    // Check if email already exists in approved freelancer applications
    const existingApplication = await db
      .select()
      .from(freelancerApplications)
      .where(eq(freelancerApplications.email, email))
      .limit(1);

    if (existingApplication.length > 0) {
      return res.status(400).json({
        success: false,
        error: "An application with this email already exists"
      });
    }

    // Delete any existing pending registration for this email (allows re-registration)
    await db.delete(pendingRegistrations).where(eq(pendingRegistrations.email, email));

    // Hash password and generate verification code
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationCode = generateVerificationCode();

    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store in pending_registrations - NO user/profile/application created yet
    await db.insert(pendingRegistrations).values({
      email,
      token: verificationToken,
      verificationCode,
      registrationType: 'freelancer',
      passwordHash: hashedPassword,
      fullName,
      displayName,
      phoneNumber: phoneNumber || '',
      country,
      additionalData: {},
      expiresAt
    });

    // Send verification email with code
    const emailSent = await emailService.sendFreelancerVerificationEmail(email, {
      fullName,
      verificationCode
    });

    if (emailSent) {
      console.log(`✅ Verification code email sent to ${email}`);
    } else {
      console.warn(`⚠️ Failed to send verification email to ${email}`);
    }

    res.json({
      success: true,
      message: "Please check your email and enter the verification code to complete your registration.",
      email
    });

  } catch (error) {
    console.error('❌ Freelancer application initiation error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate freelancer application"
    });
  }
});

// Verify email via link token - Creates user/profile/application when clicked
router.get('/applications/verify-link', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Verification token is required"
      });
    }

    // Find pending registration by token
    const [pending] = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.token, token))
      .limit(1);

    if (!pending) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification link. Please register again."
      });
    }

    // Check if link has expired
    if (new Date() > pending.expiresAt) {
      // Delete expired pending registration
      await db.delete(pendingRegistrations).where(eq(pendingRegistrations.token, token));
      return res.status(400).json({
        success: false,
        error: "Verification link has expired. Please register again."
      });
    }

    // Check if user already exists (edge case - someone registered with same email after pending was created)
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, pending.email))
      .limit(1);

    if (existingUser.length > 0) {
      await db.delete(pendingRegistrations).where(eq(pendingRegistrations.token, token));
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists"
      });
    }

    // NOW create the user, profile, and application
    const userId = generateUserId();

    const [newUser] = await db.insert(users).values({
      userId,
      email: pending.email,
      passwordHash: pending.passwordHash,
      educationLevel: 'other',
      hasCompletedProfile: false,
      hasSelectedRole: true
    }).returning();

    await db.insert(profiles).values({
      userId: newUser.id,
      name: pending.fullName,
      displayName: pending.displayName,
      email: pending.email,
      age: 25,
      grade: 13,
      country: pending.country,
      phoneNumber: pending.phoneNumber || '',
      role: 'freelancer',
      status: 'active'
    });

    const [application] = await db.insert(freelancerApplications).values({
      userId: newUser.id,
      fullName: pending.fullName,
      displayName: pending.displayName,
      email: pending.email,
      phoneNumber: pending.phoneNumber,
      country: pending.country,
      primaryCategory: '',
      tagline: '',
      about: '',
      skills: [],
      servicesOffered: [],
      status: 'pending'
    }).returning();

    // Delete the pending registration
    await db.delete(pendingRegistrations).where(eq(pendingRegistrations.token, token));

    console.log(`✅ Email verified and user created for ${pending.email}`);

    // Redirect to success page or return JSON based on Accept header
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
      // Redirect to frontend verification success page
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.BASE_URL || 'http://localhost:5000';
      return res.redirect(`${baseUrl}/?verified=freelancer&email=${encodeURIComponent(pending.email)}`);
    }

    res.json({
      success: true,
      message: "Email verified successfully! Your account has been created. You can now log in.",
      userId: newUser.id,
      applicationId: application.id,
      email: pending.email
    });

  } catch (error) {
    console.error('❌ Email verification link error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to verify email"
    });
  }
});

// Resend verification code
router.post('/applications/resend-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    const [pending] = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, email))
      .limit(1);

    if (!pending) {
      return res.status(404).json({
        success: false,
        error: "No pending registration found with this email"
      });
    }

    // Generate new verification code and update expiry
    const newVerificationCode = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await db.update(pendingRegistrations)
      .set({ verificationCode: newVerificationCode, expiresAt })
      .where(eq(pendingRegistrations.email, email));

    const emailSent = await emailService.sendFreelancerVerificationEmail(email, {
      fullName: pending.fullName,
      verificationCode: newVerificationCode
    });

    if (emailSent) {
      console.log(`✅ Verification code resent to ${email}`);
    } else {
      console.warn(`⚠️ Failed to resend verification email to ${email}`);
    }

    res.json({
      success: true,
      message: "Verification code has been resent to your email"
    });

  } catch (error) {
    console.error('❌ Resend verification code error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to resend verification code"
    });
  }
});

// Verify email code - Creates user/profile/application when code is verified
router.post('/applications/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: "Email and verification code are required"
      });
    }

    // Find pending registration by email
    const [pending] = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, email))
      .limit(1);

    if (!pending) {
      return res.status(400).json({
        success: false,
        error: "No pending registration found. Please sign up again."
      });
    }

    // Check if it's a freelancer registration
    if (pending.registrationType !== 'freelancer') {
      return res.status(400).json({
        success: false,
        error: "Invalid registration type for freelancer verification."
      });
    }

    // Check if code matches
    if (pending.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        error: "Invalid verification code. Please check and try again."
      });
    }

    // Check if code has expired
    if (new Date() > pending.expiresAt) {
      await db.delete(pendingRegistrations).where(eq(pendingRegistrations.email, email));
      return res.status(400).json({
        success: false,
        error: "Verification code has expired. Please sign up again."
      });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, pending.email))
      .limit(1);

    if (existingUser.length > 0) {
      await db.delete(pendingRegistrations).where(eq(pendingRegistrations.email, email));
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists"
      });
    }

    // NOW create the user, profile, and application
    const userId = generateUserId();

    const [newUser] = await db.insert(users).values({
      userId,
      email: pending.email,
      passwordHash: pending.passwordHash,
      educationLevel: 'other',
      hasCompletedProfile: false,
      hasSelectedRole: true
    }).returning();

    await db.insert(profiles).values({
      userId: newUser.id,
      name: pending.fullName,
      displayName: pending.displayName,
      email: pending.email,
      age: 25,
      grade: 13,
      country: pending.country,
      phoneNumber: pending.phoneNumber || '',
      role: 'freelancer',
      status: 'active'
    });

    const [application] = await db.insert(freelancerApplications).values({
      userId: newUser.id,
      fullName: pending.fullName,
      displayName: pending.displayName,
      email: pending.email,
      phoneNumber: pending.phoneNumber,
      country: pending.country,
      primaryCategory: '',
      tagline: '',
      about: '',
      skills: [],
      servicesOffered: [],
      status: 'pending'
    }).returning();

    // Delete the pending registration
    await db.delete(pendingRegistrations).where(eq(pendingRegistrations.email, email));

    console.log(`✅ Email verified via code and user created for ${pending.email}`);

    res.json({
      success: true,
      message: "Email verified successfully! Your account has been created. You can now log in.",
      userId: newUser.id,
      applicationId: application.id,
      email: pending.email
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to verify email"
    });
  }
});

// Resend verification link
router.post('/applications/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    // Check for pending registration first (new flow)
    const [pending] = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, email))
      .limit(1);

    if (pending) {
      // Generate new token and update expiry
      const newToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await db.update(pendingRegistrations)
        .set({ token: newToken, expiresAt })
        .where(eq(pendingRegistrations.email, email));

      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.BASE_URL || 'http://localhost:5000';
      const verificationLink = `${baseUrl}/verify-email?token=${newToken}`;

      const emailSent = await emailService.sendVerificationLinkEmail(email, {
        fullName: pending.fullName,
        verificationLink,
        expiresIn: '24 hours'
      });

      if (emailSent) {
        console.log(`✅ Verification link resent to ${email}`);
      } else {
        console.warn(`⚠️ Failed to resend verification email to ${email}`);
      }

      return res.json({
        success: true,
        message: "Verification link has been resent to your email"
      });
    }

    // Fallback: Check for legacy application (old flow)
    const [application] = await db
      .select()
      .from(freelancerApplications)
      .where(eq(freelancerApplications.email, email))
      .limit(1);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "No pending registration found with this email"
      });
    }

    // Legacy code path for old registrations
    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await dbStorage.updateEmailVerificationCode(email, newVerificationCode, expiresAt);

    const emailSent = await emailService.sendTeacherVerificationEmail(email, {
      fullName: application.fullName,
      verificationCode: newVerificationCode
    });

    if (emailSent) {
      console.log(`✅ Verification code resent to ${email}`);
    } else {
      console.warn(`⚠️ Failed to resend verification email to ${email}, but verification code was saved`);
    }

    res.json({
      success: true,
      message: "Verification code has been resent to your email"
    });

  } catch (error) {
    console.error('❌ Resend verification code error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to resend verification code"
    });
  }
});

router.post('/apply', upload.any(), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    let parsedSkills: string[];
    let parsedServices: string[];
    
    try {
      parsedSkills = req.body.skills ? JSON.parse(req.body.skills) : [];
      parsedServices = req.body.servicesOffered ? JSON.parse(req.body.servicesOffered) : [];
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format for skills or services' });
    }

    const applicationData = {
      fullName: req.body.fullName,
      displayName: req.body.displayName,
      email: req.body.email,
      country: req.body.country,
      primaryCategory: req.body.primaryCategory,
      tagline: req.body.tagline,
      about: req.body.about,
      skills: parsedSkills,
      servicesOffered: parsedServices,
      behanceUrl: req.body.behanceUrl || null,
      githubUrl: req.body.githubUrl || null,
      websiteUrl: req.body.websiteUrl || null,
    };

    const applicationValidation = insertFreelancerApplicationSchema.safeParse(applicationData);
    if (!applicationValidation.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: applicationValidation.error.issues 
      });
    }

    const samplePattern = /^sample_(\d+)_(title|category|description)$/;
    const samplesData: Record<number, any> = {};

    for (const key in req.body) {
      const match = key.match(samplePattern);
      if (match) {
        const [, index, field] = match;
        const idx = parseInt(index, 10);
        if (!samplesData[idx]) samplesData[idx] = {};
        samplesData[idx][field] = req.body[key];
      }
    }

    const sampleFilePattern = /^sample_(\d+)_file_\d+$/;
    for (const file of files) {
      const match = file.fieldname.match(sampleFilePattern);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (!samplesData[idx]) samplesData[idx] = {};
        if (!samplesData[idx].files) samplesData[idx].files = [];
        samplesData[idx].files.push(`/uploads/portfolio-samples/${file.filename}`);
      }
    }

    const samples = Object.values(samplesData);
    
    if (samples.length < 9) {
      return res.status(400).json({ error: 'Please upload at least 9 portfolio samples before submitting your application.' });
    }

    for (let i = 0; i < samples.length; i++) {
      const sampleValidation = portfolioSampleValidation.safeParse(samples[i]);
      if (!sampleValidation.success) {
        return res.status(400).json({ 
          error: `Portfolio sample ${i + 1} is invalid`,
          details: sampleValidation.error.errors
        });
      }
    }

    let application: typeof freelancerApplications.$inferSelect | undefined;
    await db.transaction(async (tx) => {
      const [app] = await tx.insert(freelancerApplications).values(applicationValidation.data).returning();
      application = app;

      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        await tx.insert(portfolioSamples).values({
          applicationId: app.id,
          title: sample.title,
          category: sample.category,
          description: sample.description,
          fileUrls: sample.files,
          displayOrder: i,
        });
      }
    });

    if (!application) {
      throw new Error('Failed to create application');
    }

    // Send freelancer application submitted email with professional template
    try {
      await emailService.sendFreelancerApplicationSubmittedEmail(applicationValidation.data.email, {
        fullName: applicationValidation.data.fullName
      });
      console.log(`✅ Freelancer application submitted email sent to ${applicationValidation.data.email}`);
    } catch (emailError) {
      console.warn(`⚠️ Failed to send freelancer application email to ${applicationValidation.data.email}:`, emailError);
    }

    return res.status(200).json({ 
      success: true,
      message: 'Application submitted successfully. Check your email and WhatsApp for verification.',
      applicationId: application.id
    });
    
  } catch (error: any) {
    console.error('Error submitting freelancer application:', error);
    return res.status(500).json({ 
      error: 'Failed to submit application. Please try again.' 
    });
  }
});

router.get('/applications', async (req, res) => {
  try {
    const { status } = req.query;

    let applications;
    if (status && typeof status === 'string') {
      applications = await db
        .select()
        .from(freelancerApplications)
        .where(eq(freelancerApplications.status, status as any))
        .orderBy(desc(freelancerApplications.createdAt));
    } else {
      applications = await db
        .select()
        .from(freelancerApplications)
        .orderBy(desc(freelancerApplications.createdAt));
    }

    const applicationsWithSamples = await Promise.all(
      applications.map(async (app) => {
        let samples: typeof portfolioSamples.$inferSelect[] = [];
        try {
          samples = await db
            .select()
            .from(portfolioSamples)
            .where(eq(portfolioSamples.applicationId, app.id));
        } catch (sampleError) {
          console.log('Portfolio samples not available yet (this is expected for new applications)');
        }
        
        return {
          ...app,
          portfolioSamples: samples
        };
      })
    );

    res.json(applicationsWithSamples);
  } catch (error) {
    console.error('Error fetching freelancer applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [application] = await db
      .select()
      .from(freelancerApplications)
      .where(eq(freelancerApplications.id, id));

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    let samples: typeof portfolioSamples.$inferSelect[] = [];
    try {
      samples = await db
        .select()
        .from(portfolioSamples)
        .where(eq(portfolioSamples.applicationId, id));
    } catch (sampleError) {
      console.log('Portfolio samples not available yet (this is expected for new applications)');
    }

    res.json({
      ...application,
      portfolioSamples: samples
    });
  } catch (error) {
    console.error('Error fetching freelancer application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

router.put('/applications/:id', upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    
    let parsedSkills: string[];
    let parsedServices: string[];
    
    try {
      parsedSkills = req.body.skills ? JSON.parse(req.body.skills) : [];
      parsedServices = req.body.servicesOffered ? JSON.parse(req.body.servicesOffered) : [];
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format for skills or services' });
    }

    const samples: any[] = [];
    const sampleFiles: { [key: string]: string[] } = {};

    if (files && files.length > 0) {
      files.forEach((file) => {
        const match = file.fieldname.match(/sample_(\d+)_file_\d+/);
        if (match) {
          const sampleIndex = match[1];
          if (!sampleFiles[sampleIndex]) {
            sampleFiles[sampleIndex] = [];
          }
          sampleFiles[sampleIndex].push(`/uploads/portfolio-samples/${file.filename}`);
        }
      });
    }

    Object.keys(req.body).forEach(key => {
      const match = key.match(/sample_(\d+)_title/);
      if (match) {
        const index = match[1];
        samples.push({
          title: req.body[`sample_${index}_title`],
          category: req.body[`sample_${index}_category`],
          description: req.body[`sample_${index}_description`],
          files: sampleFiles[index] || []
        });
      }
    });

    const updateData = {
      primaryCategory: req.body.primaryCategory,
      tagline: req.body.tagline,
      about: req.body.about,
      skills: parsedSkills,
      servicesOffered: parsedServices,
      behanceUrl: req.body.behanceUrl || null,
      githubUrl: req.body.githubUrl || null,
      websiteUrl: req.body.websiteUrl || null,
      status: 'pending',
      rejectionReason: null,
      adminNotes: null,
      approvedBy: null,
      approvedAt: null,
      updatedAt: new Date(),
    };

    const [updatedApplication] = await db
      .update(freelancerApplications)
      .set(updateData)
      .where(eq(freelancerApplications.id, id))
      .returning();

    if (!updatedApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await db.delete(portfolioSamples).where(eq(portfolioSamples.applicationId, id));

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      await db.insert(portfolioSamples).values({
        applicationId: id,
        title: sample.title,
        category: sample.category,
        description: sample.description,
        fileUrls: sample.files,
        displayOrder: i,
      });
    }

    res.json({
      success: true,
      message: 'Application updated successfully',
      application: updatedApplication
    });

  } catch (error: any) {
    console.error('Error updating freelancer application:', error);
    res.status(500).json({ 
      error: 'Failed to update application. Please try again.' 
    });
  }
});

router.put('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, rejectionReason } = req.body;

    if (!['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (adminNotes) updateData.adminNotes = adminNotes;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;
    if (status === 'approved' || status === 'rejected') {
      updateData.approvedAt = new Date();
    }

    const [updatedApplication] = await db
      .update(freelancerApplications)
      .set(updateData)
      .where(eq(freelancerApplications.id, id))
      .returning();

    if (!updatedApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Send email notifications based on status change
    try {
      let emailSent = false;
      if (status === 'under_review') {
        emailSent = await emailService.sendFreelancerUnderReviewEmail(
          updatedApplication.email,
          { fullName: updatedApplication.fullName }
        );
        if (emailSent) {
          console.log(`✅ Under review email sent to ${updatedApplication.email}`);
        }
      } else if (status === 'approved') {
        emailSent = await emailService.sendFreelancerApplicationStatusEmail(
          updatedApplication.email,
          { fullName: updatedApplication.fullName, status: 'approved' }
        );
        if (emailSent) {
          console.log(`✅ Approval email sent to ${updatedApplication.email}`);
        }
      } else if (status === 'rejected') {
        emailSent = await emailService.sendFreelancerApplicationStatusEmail(
          updatedApplication.email,
          { fullName: updatedApplication.fullName, status: 'rejected', rejectionReason }
        );
        if (emailSent) {
          console.log(`✅ Rejection email sent to ${updatedApplication.email}`);
        }
      }
      if (!emailSent && status !== 'pending') {
        console.warn(`⚠️ Failed to send status email to ${updatedApplication.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send freelancer status email:', emailError);
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Error updating freelancer application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Get freelancer application status by userId
router.get('/applications/status/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        error: 'Invalid user ID',
      });
    }

    const application = await db
      .select()
      .from(freelancerApplications)
      .where(eq(freelancerApplications.userId, userId))
      .limit(1);

    if (application.length === 0) {
      return res.json(null);
    }

    res.json(application[0]);
  } catch (error) {
    console.error('Get freelancer application status error:', error);
    res.status(500).json({
      error: 'Failed to fetch application status',
    });
  }
});

// Resubmit rejected freelancer application
router.post('/applications/:id/resubmit', async (req, res) => {
  try {
    const { id } = req.params;

    const [application] = await db
      .select()
      .from(freelancerApplications)
      .where(eq(freelancerApplications.id, id))
      .limit(1);

    if (!application) {
      return res.status(404).json({
        error: 'Application not found',
      });
    }

    if (application.status !== 'rejected') {
      return res.status(400).json({
        error: 'Only rejected applications can be resubmitted',
      });
    }

    // Reset status to pending and clear rejection details
    const [updatedApplication] = await db
      .update(freelancerApplications)
      .set({
        status: 'pending',
        rejectionReason: null,
        adminNotes: null,
        approvedBy: null,
        approvedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(freelancerApplications.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Application resubmitted successfully. Awaiting review.',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Resubmit freelancer application error:', error);
    res.status(500).json({
      error: 'Failed to resubmit application',
    });
  }
});

// Get or create freelancer application for authenticated user
router.get('/applications/user/current', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Please log in'
      });
    }

    // Try to find existing application for this user
    const [existingApp] = await db
      .select()
      .from(freelancerApplications)
      .where(eq(freelancerApplications.userId, userId))
      .limit(1);

    if (existingApp) {
      return res.json({
        success: true,
        application: existingApp
      });
    }

    // Create new application for authenticated user
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userProf = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const profileData = userProf[0] || {};

    const [newApp] = await db.insert(freelancerApplications).values({
      userId,
      fullName: profileData.name || '',
      displayName: profileData.displayName || '',
      email: userRecord[0].email,
      phoneNumber: profileData.phoneNumber || '',
      country: profileData.country || '',
      primaryCategory: '',
      tagline: '',
      about: '',
      skills: [],
      servicesOffered: [],
      status: 'pending'
    }).returning();

    res.json({
      success: true,
      application: newApp
    });
  } catch (error) {
    console.error('Error getting/creating freelancer application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get or create application'
    });
  }
});

export default router;
