import { Router } from "express";
import { db } from "../db";
import { teacherApplications, users, profiles, pendingRegistrations } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { upload } from "../upload.js";
import { cloudinaryStorage } from "../cloudinary-storage.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "../storage.js";
import { emailService } from "../utils/email";

const router = Router();

function generateUserId(): string {
  const timestamp = Date.now().toString().slice(-7);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `T${timestamp}${random}`;
}

const teacherApplicationSchema = z.object({
  passportPhotoUrl: z.string().optional(),
  fullName: z.string().min(2),
  displayName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(10),
  dateOfBirth: z.string(),
  gender: z.string().optional(),
  country: z.string(),
  teachingCategories: z.array(z.string()).min(1),
  gradeLevels: z.array(z.string()).min(1),
  preferredTeachingStyle: z.string().optional(),
  highestQualification: z.string(),
  qualificationCertificates: z.array(z.string()).optional(),
  idPassportDocument: z.string(),
  cvResume: z.string().optional(),
  yearsOfExperience: z.string(),
  experienceSummary: z.string().min(50),
  proofOfTeaching: z.array(z.string()).optional(),
  sampleMaterials: z.array(z.string()).optional(),
  introductionVideo: z.string().optional(),
  agreementTruthful: z.boolean(),
  agreementContent: z.boolean(),
  agreementTerms: z.boolean(),
  agreementUnderstand: z.boolean(),
  agreementSafety: z.boolean(),
});

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Initiate teacher application - Stores data in pending_registrations and sends verification code
// User/profile/application is NOT created until verification code is entered
router.post("/teacher-applications/initiate", async (req, res) => {
  try {
    const { fullName, displayName, email, country, password } = req.body;

    if (!fullName || !displayName || !email || !country || !password) {
      return res.status(400).json({
        success: false,
        error: "All fields are required: fullName, displayName, email, country, password"
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

    // Check if email already exists in approved teacher applications
    const existingApplication = await storage.getTeacherApplicationByEmail(email);
    if (existingApplication) {
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
      registrationType: 'teacher',
      passwordHash: hashedPassword,
      fullName,
      displayName,
      phoneNumber: '',
      country,
      additionalData: {},
      expiresAt
    });

    // Send verification email with code
    const emailSent = await emailService.sendTeacherVerificationEmail(email, {
      fullName,
      code: verificationCode,
      expiresIn: '24 hours'
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
    console.error('❌ Teacher application initiation error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate teacher application"
    });
  }
});

// Verify email via link token - Creates user/profile/application when clicked
router.get("/teacher-applications/verify-link", async (req, res) => {
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

    // Check if it's a teacher registration
    if (pending.registrationType !== 'teacher') {
      return res.status(400).json({
        success: false,
        error: "Invalid verification link for teacher registration."
      });
    }

    // Check if link has expired
    if (new Date() > pending.expiresAt) {
      await db.delete(pendingRegistrations).where(eq(pendingRegistrations.token, token));
      return res.status(400).json({
        success: false,
        error: "Verification link has expired. Please register again."
      });
    }

    // Check if user already exists
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
      role: 'teacher',
      status: 'active'
    });

    const application = await storage.createTeacherApplication({
      userId: newUser.id,
      fullName: pending.fullName,
      displayName: pending.displayName,
      email: pending.email,
      phoneNumber: '',
      dateOfBirth: '',
      country: pending.country,
      teachingCategories: [],
      gradeLevels: [],
      highestQualification: '',
      yearsOfExperience: '',
      experienceSummary: '',
      idPassportDocument: '',
      agreementTruthful: false,
      agreementContent: false,
      agreementTerms: false,
      agreementUnderstand: false,
      agreementSafety: false,
      status: 'pending'
    });

    // Delete the pending registration
    await db.delete(pendingRegistrations).where(eq(pendingRegistrations.token, token));

    console.log(`✅ Email verified and user created for ${pending.email}`);

    // Redirect to success page
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.BASE_URL || 'http://localhost:5000';
      return res.redirect(`${baseUrl}/?verified=teacher&email=${encodeURIComponent(pending.email)}`);
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

// Resend verification link
router.post("/teacher-applications/resend-link", async (req, res) => {
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

    res.json({
      success: true,
      message: "Verification link has been resent to your email"
    });

  } catch (error) {
    console.error('❌ Resend verification link error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to resend verification link"
    });
  }
});

// Verify email code - Creates user/profile/application when code is verified
router.post("/teacher-applications/verify-code", async (req, res) => {
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

    // Check if it's a teacher registration
    if (pending.registrationType !== 'teacher') {
      return res.status(400).json({
        success: false,
        error: "Invalid registration type for teacher verification."
      });
    }

    // Check if code matches (trim both to handle any whitespace)
    const storedCode = (pending.verificationCode || '').toString().trim();
    const submittedCode = (code || '').toString().trim();
    
    console.log(`🔐 Teacher verify - Stored: "${storedCode}", Submitted: "${submittedCode}", Match: ${storedCode === submittedCode}`);
    
    if (storedCode !== submittedCode) {
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
      role: 'teacher',
      status: 'active'
    });

    const application = await storage.createTeacherApplication({
      userId: newUser.id,
      fullName: pending.fullName,
      displayName: pending.displayName,
      email: pending.email,
      phoneNumber: '',
      dateOfBirth: '',
      country: pending.country,
      teachingCategories: [],
      gradeLevels: [],
      highestQualification: '',
      yearsOfExperience: '',
      experienceSummary: '',
      idPassportDocument: '',
      agreementTruthful: false,
      agreementContent: false,
      agreementTerms: false,
      agreementUnderstand: false,
      agreementSafety: false,
      status: 'pending'
    });

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

// Resend verification code
router.post("/teacher-applications/resend-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    // Check for pending registration
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

    const emailSent = await emailService.sendTeacherVerificationEmail(email, {
      fullName: pending.fullName,
      code: newVerificationCode,
      expiresIn: '24 hours'
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

// File upload endpoint for teacher application documents
router.post("/teacher-applications/upload", upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { documentType } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    console.log(`📁 Uploading ${files.length} teacher application files (${documentType})`);

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          const result = await cloudinaryStorage.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            'teacher-applications'
          );
          return {
            success: true,
            url: result.url,
            fileName: file.originalname,
            documentType
          };
        } catch (error) {
          console.error(`❌ Failed to upload ${file.originalname}:`, error);
          return {
            success: false,
            fileName: file.originalname,
            error: 'Upload failed'
          };
        }
      })
    );

    const successfulUploads = uploadedFiles.filter(f => f.success);
    const failedUploads = uploadedFiles.filter(f => !f.success);

    console.log(`✅ Uploaded ${successfulUploads.length}/${files.length} files successfully`);

    res.json({
      success: true,
      files: successfulUploads,
      failed: failedUploads,
      message: `Successfully uploaded ${successfulUploads.length} files`
    });
  } catch (error) {
    console.error('❌ Teacher application file upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files. Please try again.'
    });
  }
});

router.post("/teacher-applications", async (req, res) => {
  try {
    const validatedData = teacherApplicationSchema.parse(req.body);

    const existingApplication = await db
      .select()
      .from(teacherApplications)
      .where(eq(teacherApplications.email, validatedData.email))
      .limit(1);

    if (existingApplication.length > 0) {
      const app = existingApplication[0];
      if (app.status === 'rejected') {
        // Allow updating rejected applications via the main POST endpoint
        const [updatedApplication] = await db
          .update(teacherApplications)
          .set({
            ...validatedData,
            status: "pending",
            updatedAt: new Date(),
          })
          .where(eq(teacherApplications.id, app.id))
          .returning();

        // Send resubmission notification email
        try {
          await emailService.sendApplicationResubmittedEmail(validatedData.email, {
            fullName: validatedData.fullName,
            applicationType: 'teacher'
          });
          console.log(`✅ Teacher resubmission notification email sent to ${validatedData.email}`);
        } catch (emailError) {
          console.warn(`⚠️ Failed to send resubmission notification email to ${validatedData.email}:`, emailError);
        }

        return res.status(200).json({
          success: true,
          message: "Teacher application resubmitted successfully",
          id: updatedApplication.id,
          application: updatedApplication,
        });
      }
      return res.status(400).json({
        error: "An application with this email already exists. Please check your application status.",
      });
    }

    const [application] = await db
      .insert(teacherApplications)
      .values({
        ...validatedData,
        status: "pending",
      })
      .returning();

    // Send application submission confirmation email
    try {
      await emailService.sendApplicationSubmittedEmail(validatedData.email, {
        fullName: validatedData.fullName,
        applicationType: 'teacher'
      });
      console.log(`✅ Teacher application submission email sent to ${validatedData.email}`);
    } catch (emailError) {
      console.warn(`⚠️ Failed to send submission confirmation email to ${validatedData.email}:`, emailError);
    }

    res.status(201).json({
      success: true,
      message: "Teacher application submitted successfully",
      id: application.id,
      application,
    });
  } catch (error) {
    console.error("Teacher application submission error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    res.status(500).json({
      error: "Failed to submit teacher application. Please try again.",
    });
  }
});

router.get("/teacher-applications/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const application = await storage.getTeacherApplicationById(id);

    if (!application) {
      return res.status(404).json({
        error: "Application not found",
      });
    }

    res.json(application);
  } catch (error) {
    console.error("Get teacher application error:", error);
    res.status(500).json({
      error: "Failed to fetch application status",
    });
  }
});

router.put("/teacher-applications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = teacherApplicationSchema.parse(req.body);

    const existingApplication = await storage.getTeacherApplicationById(id);

    if (!existingApplication) {
      return res.status(404).json({
        error: "Application not found",
      });
    }

    const updatedApplication = await storage.updateTeacherApplication(id, {
      ...validatedData,
      status: "pending",
      updatedAt: new Date(),
    });

    if (!updatedApplication) {
      return res.status(404).json({
        error: "Failed to update application",
      });
    }

    res.json({
      success: true,
      message: "Teacher application updated successfully",
      id: updatedApplication.id,
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Teacher application update error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    res.status(500).json({
      error: "Failed to update teacher application. Please try again.",
    });
  }
});

router.get("/teacher-applications", async (req, res) => {
  try {
    const { email, status } = req.query;

    if (email) {
      const applications = await db
        .select()
        .from(teacherApplications)
        .where(eq(teacherApplications.email, email as string));

      return res.json(applications);
    }

    let query = db.select().from(teacherApplications);
    
    if (status && typeof status === 'string') {
      query = query.where(eq(teacherApplications.status, status));
    }

    const applications = await query.orderBy(teacherApplications.submittedAt);

    res.json(applications);
  } catch (error) {
    console.error("Get teacher applications error:", error);
    res.status(500).json({
      error: "Failed to fetch applications",
    });
  }
});

router.put("/teacher-applications/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!["pending", "under_review", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status value",
      });
    }

    const [updatedApplication] = await db
      .update(teacherApplications)
      .set({
        status,
        adminNotes,
        reviewedAt: status === "approved" || status === "rejected" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(teacherApplications.id, id))
      .returning();

    if (!updatedApplication) {
      return res.status(404).json({
        error: "Application not found",
      });
    }

    // Send email notifications based on status change
    try {
      if (status === "approved") {
        const emailSent = await emailService.sendTeacherApprovalEmail(
          updatedApplication.email,
          {
            fullName: updatedApplication.fullName,
            displayName: updatedApplication.displayName
          }
        );
        if (emailSent) {
          console.log(`✅ Approval email sent to ${updatedApplication.email}`);
        } else {
          console.warn(`⚠️ Failed to send approval email to ${updatedApplication.email}`);
        }
      } else if (status === "under_review") {
        const emailSent = await emailService.sendTeacherUnderReviewEmail(
          updatedApplication.email,
          { fullName: updatedApplication.fullName }
        );
        if (emailSent) {
          console.log(`✅ Under review email sent to ${updatedApplication.email}`);
        } else {
          console.warn(`⚠️ Failed to send under review email to ${updatedApplication.email}`);
        }
      } else if (status === "rejected") {
        const emailSent = await emailService.sendTeacherRejectionEmail(
          updatedApplication.email,
          { fullName: updatedApplication.fullName, reason: adminNotes }
        );
        if (emailSent) {
          console.log(`✅ Rejection email sent to ${updatedApplication.email}`);
        } else {
          console.warn(`⚠️ Failed to send rejection email to ${updatedApplication.email}`);
        }
      }
    } catch (emailError) {
      console.error('Failed to send status change email:', emailError);
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Update teacher application status error:", error);
    res.status(500).json({
      error: "Failed to update application status",
    });
  }
});

// Get teacher application status by userId
router.get("/teacher-applications/status/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    const application = await db
      .select()
      .from(teacherApplications)
      .where(eq(teacherApplications.userId, userId))
      .limit(1);

    if (application.length === 0) {
      return res.json(null);
    }

    res.json(application[0]);
  } catch (error) {
    console.error("Get teacher application status error:", error);
    res.status(500).json({
      error: "Failed to fetch application status",
    });
  }
});

// Resubmit rejected teacher application
router.post("/teacher-applications/:id/resubmit", async (req, res) => {
  try {
    const { id } = req.params;

    const [application] = await db
      .select()
      .from(teacherApplications)
      .where(eq(teacherApplications.id, id))
      .limit(1);

    if (!application) {
      return res.status(404).json({
        error: "Application not found",
      });
    }

    if (application.status !== "rejected") {
      return res.status(400).json({
        error: "Only rejected applications can be resubmitted",
      });
    }

    // Reset status to pending and clear admin notes
    const [updatedApplication] = await db
      .update(teacherApplications)
      .set({
        status: "pending",
        adminNotes: null,
        reviewedAt: null,
        reviewedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(teacherApplications.id, id))
      .returning();

    res.json({
      success: true,
      message: "Application resubmitted successfully. Awaiting review.",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Resubmit teacher application error:", error);
    res.status(500).json({
      error: "Failed to resubmit application",
    });
  }
});

export default router;
