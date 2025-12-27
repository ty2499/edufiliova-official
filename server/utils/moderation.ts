import { getOpenAIClient } from '../openai';
import { db } from '../db.js';
import { profiles } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { emailService } from './email';

export interface ModerationResult {
  passed: boolean;
  violations: string[];
  autoAction?: 'ban' | 'notify';
}

class ModerationService {
  // Phone number regex patterns
  private phonePatterns = [
    /\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US/Canada
    /\+?[1-9]\d{1,14}/g, // International E.164 format
    /(\+44|0)[0-9]{10}/g, // UK
    /(\+61|0)[0-9]{9}/g, // Australia
    /(\+86)[0-9]{10}/g, // China
    /(\+91)[0-9]{10}/g, // India
  ];

  /**
   * Detect phone numbers in text
   */
  detectPhoneNumbers(text: string): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    // Skip common false positives
    if (lowerText.includes('version') || lowerText.includes('example')) {
      return false;
    }
    for (const pattern of this.phonePatterns) {
      pattern.lastIndex = 0; // Reset regex
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detect nude/NSFW images using OpenAI Vision
   */
  async detectNudeInImage(imageUrl: string): Promise<boolean> {
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.warn('OpenAI not configured for image moderation');
        return false;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
              {
                type: 'text',
                text: 'Analyze this image strictly for NSFW/nude content. Only respond with "NSFW" if there is nudity, sexually explicit content, or highly inappropriate imagery. Otherwise respond with "SAFE". Be strict.',
              },
            ],
          },
        ],
      });

      const result = response.choices[0]?.message?.content?.toUpperCase() || '';
      return result.includes('NSFW');
    } catch (error) {
      console.error('Error detecting nude in image:', error);
      return false;
    }
  }

  /**
   * Detect dating/romantic content using OpenAI
   */
  async detectDatingContent(text: string): Promise<boolean> {
    try {
      if (!text || text.length < 10) return false;

      const openai = await getOpenAIClient();
      if (!openai) {
        console.warn('OpenAI not configured for content moderation');
        return false;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: `Analyze this text for dating/romantic solicitation, flirting, or relationship-seeking. Respond with only "DATING_CONTENT" if it contains dating/romantic intent, otherwise respond with "SAFE". Be strict.

Text: "${text.substring(0, 500)}"`,
          },
        ],
      });

      const result = response.choices[0]?.message?.content?.toUpperCase() || '';
      return result.includes('DATING_CONTENT');
    } catch (error) {
      console.error('Error detecting dating content:', error);
      return false;
    }
  }

  /**
   * Comprehensive moderation check
   */
  async checkContent(options: {
    text?: string;
    imageUrl?: string;
    userType: 'teacher' | 'freelancer' | 'student' | 'user';
    contentType: 'message' | 'course' | 'product' | 'post';
  }): Promise<ModerationResult> {
    const violations: string[] = [];

    // Check text for phone numbers and dating content
    if (options.text) {
      if (this.detectPhoneNumbers(options.text)) {
        violations.push('Phone number detected');
      }
      if (await this.detectDatingContent(options.text)) {
        violations.push('Dating/romantic content detected');
      }
    }

    // Check image for nudity
    if (options.imageUrl) {
      if (await this.detectNudeInImage(options.imageUrl)) {
        violations.push('Nude/NSFW image detected');
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      autoAction: violations.length > 0 ? 'notify' : undefined, // Default to notify admin
    };
  }

  /**
   * Handle moderation violation
   */
  async handleViolation(options: {
    userId: string;
    violations: string[];
    userEmail?: string;
    userName?: string;
    contentType: string;
    action: 'ban' | 'notify';
    contentPreview?: string;
  }): Promise<boolean> {
    try {
      if (options.action === 'ban') {
        // Ban the user
        await db
          .update(profiles)
          .set({ status: 'banned', updatedAt: new Date() })
          .where(eq(profiles.userId, options.userId));

        console.log(`🚫 User ${options.userId} banned for: ${options.violations.join(', ')}`);
      }

      if (options.action === 'notify' && options.userEmail) {
        // Send admin notification
        await emailService.sendEmail({
          to: 'support@edufiliova.com',
          subject: `Moderation Alert: Policy Violation Detected`,
          html: this.generateAdminNotificationEmail({
            userId: options.userId,
            userName: options.userName || 'Unknown',
            userEmail: options.userEmail,
            violations: options.violations,
            contentType: options.contentType,
            contentPreview: options.contentPreview,
            action: options.action,
          }),
          from: `"EduFiliova System" <support@edufiliova.com>`,
        });

        console.log(`📧 Admin notified about violations for user ${options.userId}`);
      }

      return true;
    } catch (error) {
      console.error('Error handling violation:', error);
      return false;
    }
  }

  /**
   * Generate admin notification email
   */
  private generateAdminNotificationEmail(options: {
    userId: string;
    userName: string;
    userEmail: string;
    violations: string[];
    contentType: string;
    contentPreview?: string;
    action: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
    .header { background-color: #d32f2f; color: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
    .section { margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #d32f2f; }
    .section h3 { margin-top: 0; color: #d32f2f; }
    .violations { list-style: none; padding: 0; }
    .violations li { padding: 8px; background-color: #fff3cd; margin: 5px 0; border-radius: 4px; color: #856404; }
    .action-btn { display: inline-block; background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Moderation Alert - Policy Violation</h2>
    </div>

    <div class="section">
      <h3>User Information</h3>
      <p><strong>User ID:</strong> ${options.userId}</p>
      <p><strong>Name:</strong> ${options.userName}</p>
      <p><strong>Email:</strong> ${options.userEmail}</p>
    </div>

    <div class="section">
      <h3>Violations Detected</h3>
      <ul class="violations">
        ${options.violations.map((v) => `<li>${v}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h3>Content Information</h3>
      <p><strong>Type:</strong> ${options.contentType}</p>
      ${options.contentPreview ? `<p><strong>Preview:</strong> ${options.contentPreview.substring(0, 200)}...</p>` : ''}
    </div>

    <div class="section">
      <h3>Action Taken</h3>
      <p>Status: <strong>${options.action === 'ban' ? 'USER AUTO-BANNED' : 'FLAGGED FOR REVIEW'}</strong></p>
      <p>Please review this case and take appropriate action.</p>
      <a href="https://edufiliova.com/admin/users/${options.userId}" class="action-btn">Review User</a>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export const moderationService = new ModerationService();
