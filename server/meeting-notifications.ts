import cron from 'node-cron';
import { db } from "./db";
import { meetingNotifications, meetings, profiles, users } from "@shared/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import nodemailer from 'nodemailer';
import { Vonage } from '@vonage/server-sdk';

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Vonage SMS client
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY?.trim() || '',
  apiSecret: process.env.VONAGE_API_SECRET?.trim() || ''
});

// Send email notification
async function sendEmailNotification(
  email: string,
  name: string,
  meetingTitle: string,
  scheduledTime: Date,
  meetingId: string
) {
  try {
    const timeString = scheduledTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const meetingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/meeting/${meetingId}`;

    await emailTransporter.sendMail({
      from: `"EduFiliova" <noreply@edufiliova.com>`,
      to: email,
      subject: `[Reminder] "${meetingTitle}" starts in 15 minutes`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .meeting-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 10px;">
                  <rect x="4" y="10" width="30" height="28" rx="4" fill="white"/>
                  <path d="M34 20L44 14V34L34 28V20Z" fill="white"/>
                </svg>
                Your meeting is starting soon!
              </h1>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <p>This is a reminder that your video meeting is starting in <strong>15 minutes</strong>.</p>
              
              <div class="meeting-info">
                <h3 style="margin-top: 0; color: #667eea;">Meeting Details</h3>
                <p><strong>Title:</strong> ${meetingTitle}</p>
                <p><strong>Time:</strong> ${timeString}</p>
              </div>

              <p>Make sure you:</p>
              <ul>
                <li>Have a stable internet connection</li>
                <li>Test your camera and microphone</li>
                <li>Find a quiet space</li>
              </ul>

              <center>
                <a href="${meetingUrl}" class="button">Join Meeting Now</a>
              </center>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">You can join up to 15 minutes before the scheduled time.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EduFiliova - Excellence in Online Education</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Email sent to ${email} for meeting ${meetingId}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send SMS notification
async function sendSMSNotification(
  phoneNumber: string,
  name: string,
  meetingTitle: string,
  scheduledTime: Date,
  meetingId: string
) {
  try {
    if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
      console.log('⚠️ Vonage credentials not configured, skipping SMS');
      return { success: false, error: 'SMS service not configured' };
    }

    const timeString = scheduledTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const meetingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/meeting/${meetingId}`;
    
    const message = `Hi ${name}! Your meeting "${meetingTitle}" starts at ${timeString}. Join now: ${meetingUrl}`;

    const from = "EduFiliova";
    const to = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    const response = await vonage.sms.send({ to, from, text: message });
    
    console.log(`✅ SMS sent to ${phoneNumber} for meeting ${meetingId}`);
    return { success: true, messageId: response.messages[0]?.['message-id'] };
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Process pending notifications
async function processPendingNotifications() {
  try {
    const now = new Date();
    const fiveMinutesAhead = new Date(now.getTime() + 5 * 60000);

    // Find pending notifications that should be sent now
    const pendingNotifications = await db.query.meetingNotifications.findMany({
      where: and(
        eq(meetingNotifications.status, 'pending'),
        lte(meetingNotifications.scheduledFor, fiveMinutesAhead),
        gte(meetingNotifications.scheduledFor, new Date(now.getTime() - 5 * 60000)) // Don't send very old ones
      ),
      with: {
        meeting: true,
        user: {
          with: {
            profile: true
          }
        }
      },
      limit: 50, // Process in batches
    });

    if (pendingNotifications.length === 0) {
      return;
    }

    console.log(`📬 Processing ${pendingNotifications.length} pending notifications...`);

    for (const notification of pendingNotifications) {
      const { meeting, user } = notification;
      
      if (!meeting || !user || !user.profile) {
        console.warn(`⚠️ Skipping notification ${notification.id}: missing data`);
        await db.update(meetingNotifications)
          .set({ status: 'failed', errorMessage: 'Missing meeting or user data' })
          .where(eq(meetingNotifications.id, notification.id));
        continue;
      }

      // Skip if meeting is cancelled
      if (meeting.status === 'cancelled' || meeting.status === 'completed') {
        await db.update(meetingNotifications)
          .set({ status: 'failed', errorMessage: 'Meeting cancelled or completed' })
          .where(eq(meetingNotifications.id, notification.id));
        continue;
      }

      const profile = user.profile;
      
      try {
        let result;

        if (notification.notificationType === 'email_15min' && user.email) {
          result = await sendEmailNotification(
            user.email,
            profile.name,
            meeting.title,
            new Date(meeting.scheduledTime),
            meeting.id
          );
        } else if (notification.notificationType === 'sms_5min' && profile.phoneNumber) {
          result = await sendSMSNotification(
            profile.phoneNumber,
            profile.name,
            meeting.title,
            new Date(meeting.scheduledTime),
            meeting.id
          );
        } else {
          result = { success: false, error: 'Missing contact info' };
        }

        if (result.success) {
          await db.update(meetingNotifications)
            .set({ status: 'sent', sentAt: new Date() })
            .where(eq(meetingNotifications.id, notification.id));
        } else {
          await db.update(meetingNotifications)
            .set({ 
              status: 'failed', 
              errorMessage: result.error || 'Unknown error' 
            })
            .where(eq(meetingNotifications.id, notification.id));
        }
      } catch (error) {
        console.error(`❌ Error processing notification ${notification.id}:`, error);
        await db.update(meetingNotifications)
          .set({ 
            status: 'failed', 
            errorMessage: error instanceof Error ? error.message : 'Unknown error' 
          })
          .where(eq(meetingNotifications.id, notification.id));
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Processed ${pendingNotifications.length} notifications`);
  } catch (error) {
    console.error('❌ Error in processPendingNotifications:', error);
  }
}

// Initialize notification scheduler
export function initializeMeetingNotificationScheduler() {
  console.log('🔔 Initializing meeting notification scheduler...');

  // Run every minute to check for pending notifications
  cron.schedule('* * * * *', async () => {
    await processPendingNotifications();
  });

  console.log('✅ Meeting notification scheduler started (checks every minute)');
}

// Export for manual testing
export { sendEmailNotification, sendSMSNotification, processPendingNotifications };
