import { certifierAPI } from './certifier-api';
import { storage } from '../storage';
import type { InsertCertificate } from '@shared/schema';

// Certifier Group IDs - You need to create these in your Certifier dashboard
// Go to https://app.certifier.io/ → Groups → Create groups for:
// 1. A group for "Certificates" 
// 2. A group for "Diplomas"
// Then paste the group IDs below:

const CERTIFIER_GROUPS = {
  certificate: process.env.CERTIFIER_CERTIFICATE_GROUP_ID || '', // Replace with your certificate group ID
  diploma: process.env.CERTIFIER_DIPLOMA_GROUP_ID || '', // Replace with your diploma group ID
};

export interface CertificateData {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseDescription?: string;
  completionDate: Date;
  verificationCode: string;
  instructorName?: string;
  finalScore?: number;
  certificateType?: 'certificate' | 'diploma';
}


/**
 * Generate a certificate using Certifier API
 * This sends a professional certificate directly to the student's email
 */
export async function generateCertificateWithCertifier(data: CertificateData): Promise<{
  certificateUrl: string;
  previewImageUrl: string;
  certifierId: string;
  certifierPublicId: string;
  certifierGroupId: string;
}> {
  try {
    const isDiploma = data.certificateType === 'diploma';
    const groupId = isDiploma ? CERTIFIER_GROUPS.diploma : CERTIFIER_GROUPS.certificate;

    if (!groupId) {
      throw new Error(
        `Certifier group ID not configured for ${isDiploma ? 'diploma' : 'certificate'}. ` +
        `Please set ${isDiploma ? 'CERTIFIER_DIPLOMA_GROUP_ID' : 'CERTIFIER_CERTIFICATE_GROUP_ID'} in your environment variables.`
      );
    }

    // Format the issue date
    const issueDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Prepare custom attributes for the certificate template
    // Using only custom.course_title which should already be configured in Certifier
    // Other data uses Certifier's built-in attributes:
    // - [recipient.name] = student name
    // - [recipient.email] = student email  
    // - [certificate.issued_on] = issue date
    const customAttributes = {
      'custom.course_title': data.courseTitle,
    };

    // Create, issue, and send the credential via Certifier API
    const credential = await certifierAPI.createIssueAndSendCredential({
      groupId,
      recipient: {
        name: data.studentName,
        email: data.studentEmail,
      },
      issueDate,
      customAttributes,
    });

    console.log('Certificate created successfully:', credential.id);
    console.log('Full Certifier response:', JSON.stringify(credential, null, 2));

    // Use the credential data returned from Certifier
    // Certifier sends the certificate via email to the recipient
    const certifierPublicId = credential.publicId || '';
    let certificateUrl = credential.certificateUrl || credential.verificationUrl || '';
    const previewImageUrl = '';

    // Construct the digital wallet verification URL using publicId
    if (certifierPublicId) {
      certificateUrl = certifierAPI.getDigitalWalletUrl(certifierPublicId);
      console.log('Using digital wallet URL:', certificateUrl);
    }

    console.log('✅ Certificate generated and sent by Certifier to', data.studentEmail);

    return {
      certificateUrl,
      previewImageUrl,
      certifierId: credential.id,
      certifierPublicId,
      certifierGroupId: groupId,
    };
  } catch (error) {
    console.error('Error generating certificate with Certifier:', error);
    throw error;
  }
}

// Generate a unique verification code
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-';
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if user has completed a course and is eligible for a certificate
export async function checkCertificateEligibility(userId: string, courseId: string): Promise<{
  eligible: boolean;
  reason?: string;
  progress?: number;
  finalScore?: number;
}> {
  // Check if certificate already exists
  const existingCertificates = await storage.getCertificatesByUserId(userId);
  const alreadyHasCertificate = existingCertificates.some(cert => cert.courseId === courseId);
  
  if (alreadyHasCertificate) {
    return {
      eligible: false,
      reason: 'Certificate already issued for this course'
    };
  }

  // Check course completion
  const completion = await storage.checkCourseCompletion(userId, courseId);
  
  if (!completion.completed) {
    return {
      eligible: false,
      reason: `Course not completed. Progress: ${completion.progress}%`,
      progress: completion.progress
    };
  }

  // Check if final score meets minimum requirement (80% passing grade)
  const minimumScore = 80;
  if (completion.finalScore && completion.finalScore < minimumScore) {
    return {
      eligible: false,
      reason: `Minimum score not met. Required: ${minimumScore}%, Achieved: ${completion.finalScore}%`,
      finalScore: completion.finalScore
    };
  }

  return {
    eligible: true,
    progress: completion.progress,
    finalScore: completion.finalScore
  };
}

// Main function to generate and store certificate using Certifier
export async function generateCertificate(
  userId: string,
  courseId: string,
  studentName: string,
  studentEmail: string
): Promise<{ success: boolean; certificate?: any; error?: string }> {
  try {
    // Check eligibility
    const eligibility = await checkCertificateEligibility(userId, courseId);
    
    if (!eligibility.eligible) {
      return {
        success: false,
        error: eligibility.reason
      };
    }

    // Get course details
    const courseInfo = await storage.getCourseWithInstructor(courseId);
    if (!courseInfo) {
      return {
        success: false,
        error: 'Course not found'
      };
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Prepare certificate data
    const completionDate = new Date();
    const certData: CertificateData = {
      studentName,
      studentEmail,
      courseTitle: courseInfo.title,
      courseDescription: courseInfo.description,
      completionDate,
      verificationCode,
      instructorName: courseInfo.instructorName,
      finalScore: eligibility.finalScore,
      certificateType: (courseInfo.certificateType as 'certificate' | 'diploma') || 'certificate'
    };

    // Generate certificate using Certifier API
    const { certificateUrl, certifierId, certifierGroupId } = await generateCertificateWithCertifier(certData);

    // Create certificate record in database
    const certificateRecord: InsertCertificate = {
      userId,
      courseId,
      studentName,
      studentEmail,
      courseTitle: courseInfo.title,
      courseDescription: courseInfo.description || null,
      verificationCode,
      certificateUrl,
      completionDate,
      finalScore: eligibility.finalScore || null,
      instructorName: courseInfo.instructorName || null,
      certificateType: courseInfo.certificateType || 'certificate',
      issueDate: new Date(),
      isRevoked: false,
      revokedAt: null,
      revokedReason: null,
      certifierId,
      certifierGroupId,
    };

    const certificate = await storage.createCertificate(certificateRecord);

    return {
      success: true,
      certificate
    };
  } catch (error) {
    console.error('Error generating certificate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Trigger certificate generation when course is completed
export async function onCourseCompletion(
  userId: string,
  courseId: string,
  studentName: string,
  studentEmail: string
) {
  const result = await generateCertificate(userId, courseId, studentName, studentEmail);
  
  if (result.success) {
    console.log(`Certificate generated for user ${userId} for course ${courseId}`);
    return result.certificate;
  } else {
    console.error(`Failed to generate certificate: ${result.error}`);
    return null;
  }
}
