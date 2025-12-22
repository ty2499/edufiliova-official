import express, { Request, Response } from 'express';
import { db } from '../db';
import { certificates, users, courses, profiles, courseEnrollments } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateCertificateWithCertifier, generateVerificationCode } from '../utils/certifier-certificate-generator';
import { emailService } from '../utils/email';
import { certifierAPI } from '../utils/certifier-api';

const router = express.Router();

// Generate certificate for a completed course
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if certificate already exists
    const existingCert = await db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.userId, userId),
          eq(certificates.courseId, courseId)
        )
      )
      .limit(1);

    if (existingCert.length > 0) {
      // Certificate exists, send email and return it
      const cert = existingCert[0];
      console.log('🔍 Found existing certificate:', cert.id);
      
      // Get user email for sending notification
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      console.log('🔍 Email check:', {
        hasUserRecord: userRecord.length > 0,
        hasEmail: userRecord[0]?.email ? 'yes' : 'no',
        hasCertUrl: cert.certificateUrl ? 'yes' : 'no',
        certUrl: cert.certificateUrl
      });

      if (userRecord.length && userRecord[0].email && cert.certificateUrl) {
        try {
          console.log(`📧 Resending certificate email to ${userRecord[0].email}`);
          const emailSent = await emailService.sendCertificateEmail(userRecord[0].email, {
            studentName: cert.studentName,
            courseTitle: cert.courseTitle,
            completionDate: cert.completionDate,
            verificationCode: cert.verificationCode,
            certificateUrl: cert.certificateUrl,
            finalScore: cert.finalScore || undefined,
          });
          
          if (emailSent) {
            console.log(`✅ Certificate email resent successfully to ${userRecord[0].email}`);
          } else {
            console.log(`⚠️ Certificate email may not have been resent to ${userRecord[0].email}`);
          }
        } catch (emailError) {
          console.error('❌ Failed to resend certificate email:', emailError);
        }
      } else {
        console.log('⚠️ Skipping email send - condition not met');
      }
      
      return res.json(cert);
    }

    // Get user profile
    const userProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!userProfile.length) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get course details
    const courseDetails = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!courseDetails.length) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if user has completed the course
    const enrollment = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      )
      .limit(1);

    if (!enrollment.length || enrollment[0].progress !== 100) {
      return res.status(400).json({ 
        error: 'Course not completed. You must complete 100% of the course to receive a certificate.' 
      });
    }

    const course = courseDetails[0];
    const profile = userProfile[0];
    const verificationCode = generateVerificationCode();

    // Get user email
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRecord.length || !userRecord[0].email) {
      return res.status(400).json({ error: 'User email is required for certificate generation' });
    }

    // Generate certificate using Certifier API
    const { certificateUrl, previewImageUrl, certifierId, certifierPublicId, certifierGroupId } = await generateCertificateWithCertifier({
      studentName: profile.name,
      studentEmail: userRecord[0].email,
      courseTitle: course.title,
      courseDescription: course.description || undefined,
      completionDate: enrollment[0].completedAt || new Date(),
      verificationCode,
      instructorName: course.publisherName || undefined,
      finalScore: enrollment[0].progress,
      certificateType: (course.certificationType as 'certificate' | 'diploma') || 'certificate',
    });

    // Save certificate to database
    const newCertificate = await db
      .insert(certificates)
      .values({
        userId,
        courseId,
        studentName: profile.name,
        studentEmail: userRecord[0].email,
        courseTitle: course.title,
        courseDescription: course.description,
        verificationCode,
        certificateUrl,
        previewImageUrl,
        completionDate: enrollment[0].completedAt || new Date(),
        finalScore: enrollment[0].progress,
        instructorName: course.publisherName,
        certificateType: course.certificationType || 'certificate',
        certifierId,
        certifierPublicId,
        certifierGroupId,
      })
      .returning();

    // Send certificate email notification
    try {
      console.log(`📧 Attempting to send certificate email to ${userRecord[0].email}`);
      const emailSent = await emailService.sendCertificateEmail(userRecord[0].email, {
        studentName: profile.name,
        courseTitle: course.title,
        completionDate: enrollment[0].completedAt || new Date(),
        verificationCode,
        certificateUrl,
        finalScore: enrollment[0].progress,
      });
      
      if (emailSent) {
        console.log(`✅ Certificate email sent successfully to ${userRecord[0].email}`);
      } else {
        console.log(`⚠️ Certificate email may not have sent to ${userRecord[0].email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send certificate email:', emailError);
      // Don't fail the request if email fails
    }

    res.json(newCertificate[0]);
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// Get all certificates for a user
router.get('/my-certificates', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }

    const userCertificates = await db
      .select({
        id: certificates.id,
        userId: certificates.userId,
        courseId: certificates.courseId,
        studentName: certificates.studentName,
        courseTitle: certificates.courseTitle,
        courseDescription: certificates.courseDescription,
        verificationCode: certificates.verificationCode,
        certificateUrl: certificates.certificateUrl,
        previewImageUrl: certificates.previewImageUrl,
        completionDate: certificates.completionDate,
        finalScore: certificates.finalScore,
        instructorName: certificates.instructorName,
        issueDate: certificates.issueDate,
        isRevoked: certificates.isRevoked,
        revokedAt: certificates.revokedAt,
        revokedReason: certificates.revokedReason,
        createdAt: certificates.createdAt,
        updatedAt: certificates.updatedAt,
        certificateType: certificates.certificateType,
        certifierId: certificates.certifierId,
        certifierPublicId: certificates.certifierPublicId,
        certifierGroupId: certificates.certifierGroupId,
      })
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issueDate));

    res.json(userCertificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Public route: Verify a certificate by verification code
// NOTE: This MUST come before the /:id route to prevent Express from matching "verify" as an ID
router.get('/verify/:verificationCode', async (req: Request, res: Response) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await db
      .select({
        id: certificates.id,
        studentName: certificates.studentName,
        courseTitle: certificates.courseTitle,
        courseDescription: certificates.courseDescription,
        verificationCode: certificates.verificationCode,
        completionDate: certificates.completionDate,
        issueDate: certificates.issueDate,
        instructorName: certificates.instructorName,
        finalScore: certificates.finalScore,
        isRevoked: certificates.isRevoked,
        revokedReason: certificates.revokedReason,
        certificateType: certificates.certificateType,
      })
      .from(certificates)
      .where(eq(certificates.verificationCode, verificationCode))
      .limit(1);

    if (!certificate.length) {
      return res.status(404).json({ 
        valid: false,
        error: 'Certificate not found' 
      });
    }

    const cert = certificate[0];

    if (cert.isRevoked) {
      return res.json({
        valid: false,
        revoked: true,
        revokedReason: cert.revokedReason,
      });
    }

    res.json({
      valid: true,
      certificate: {
        studentName: cert.studentName,
        courseTitle: cert.courseTitle,
        courseDescription: cert.courseDescription,
        completionDate: cert.completionDate,
        issueDate: cert.issueDate,
        instructorName: cert.instructorName,
        finalScore: cert.finalScore,
        verificationCode: cert.verificationCode,
        certificateType: cert.certificateType,
      },
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

// Get certificate by course ID
router.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }

    let certificate = await db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.courseId, courseId),
          eq(certificates.userId, userId)
        )
      )
      .limit(1);

    if (!certificate.length) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    let certData = certificate[0];
    
    console.log('Certificate data:', {
      id: certData.id,
      previewImageUrl: certData.previewImageUrl,
      certifierId: certData.certifierId,
      certificateUrl: certData.certificateUrl
    });

    // If preview image is missing and we have a certifierId, try to fetch from Certifier
    if (!certData.previewImageUrl && certData.certifierId) {
      try {
        console.log(`Fetching certificate files from Certifier for ID: ${certData.certifierId}`);
        const files = await certifierAPI.getCredentialFiles(certData.certifierId);
        
        const updates: any = {};
        
        // Only update certificateUrl if we don't have one yet and Certifier provides a PDF
        if (!certData.certificateUrl && files.downloadablePdfUrl) {
          updates.certificateUrl = files.downloadablePdfUrl;
          console.log(`Updated certificate PDF URL from Certifier: ${files.downloadablePdfUrl}`);
        }
        
        if (files.shareableImageUrl) {
          updates.previewImageUrl = files.shareableImageUrl;
          console.log(`Updated preview image URL from Certifier: ${files.shareableImageUrl}`);
        }
        
        if (!certData.certifierPublicId && files.publicId) {
          updates.certifierPublicId = files.publicId;
          console.log(`Updated public ID from Certifier: ${files.publicId}`);
        }
        
        // Update the database if we got new data
        if (Object.keys(updates).length > 0) {
          await db
            .update(certificates)
            .set(updates)
            .where(eq(certificates.id, certData.id));
          
          certData = { ...certData, ...updates };
        }
      } catch (certifierError) {
        console.error('Error fetching files from Certifier API:', certifierError);
        // Continue with existing data even if Certifier fetch fails
      }
    }

    res.json({ certificate: certData });
  } catch (error) {
    console.error('Error fetching certificate by course:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Get a specific certificate (must come AFTER /verify and /course routes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }

    const certificate = await db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.id, id),
          eq(certificates.userId, userId)
        )
      )
      .limit(1);

    if (!certificate.length) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json(certificate[0]);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Download certificate (redirect to PDF URL)
router.get('/download/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }

    const certificate = await db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.id, id),
          eq(certificates.userId, userId)
        )
      )
      .limit(1);

    if (!certificate.length) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (!certificate[0].certificateUrl) {
      return res.status(404).json({ error: 'Certificate PDF not available' });
    }

    // Redirect to the Cloudinary URL
    res.redirect(certificate[0].certificateUrl);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
});

// Admin: Update certificate details (e.g., cover pages, course info)
router.put('/admin/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { 
      courseTitle, 
      courseDescription, 
      instructorName, 
      certificateType,
      previewImageUrl,
      certificateUrl 
    } = req.body;

    const updates: any = {};
    if (courseTitle !== undefined) updates.courseTitle = courseTitle;
    if (courseDescription !== undefined) updates.courseDescription = courseDescription;
    if (instructorName !== undefined) updates.instructorName = instructorName;
    if (certificateType !== undefined) updates.certificateType = certificateType;
    if (previewImageUrl !== undefined) updates.previewImageUrl = previewImageUrl;
    if (certificateUrl !== undefined) updates.certificateUrl = certificateUrl;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.updatedAt = new Date();

    const [updatedCertificate] = await db
      .update(certificates)
      .set(updates)
      .where(eq(certificates.id, id))
      .returning();

    if (!updatedCertificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    console.log(`✅ Admin updated certificate ${id}`);
    res.json(updatedCertificate);
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: 'Failed to update certificate' });
  }
});

// Admin: Get all certificates (with pagination and filtering)
router.get('/admin/all', async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 20, search = '', courseId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select().from(certificates);

    // Apply filters if provided
    if (courseId) {
      query = query.where(eq(certificates.courseId, courseId as string)) as any;
    }

    // TODO: Add search functionality if needed

    const allCertificates = await query
      .orderBy(desc(certificates.issueDate))
      .limit(Number(limit))
      .offset(offset);

    res.json({
      certificates: allCertificates,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Error fetching all certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

export default router;
