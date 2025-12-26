import cron from 'node-cron';
import { db } from "./db";
import { meetingNotifications, meetings, profiles, users } from "@shared/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import nodemailer from 'nodemailer';
import { Vonage } from '@vonage/server-sdk';

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: 'noreply@edufiliova.com',
    pass: process.env.SMTP_PASS_NOREPLY || process.env.SMTP_PASS,
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

    const template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="format-detection" content="telephone=no, date=no, address=no, email=no"><meta name="x-apple-disable-message-reformatting"><meta name="keywords" content="DAG8LLZe5qE, BAG4G5R9kJI"><!--[if mso]><div>
                <noscript>
                  <xml>
                    <o:OfficeDocumentSettings>
                      <o:AllowPNG/>
                      <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                  </xml>
                </noscript></div><![endif]--><!--[if !mso]><!--><style>@media (max-width: 1px) {
        .layout-0 {
          display: none !important;
        }
      }
@media (max-width: 1px) and (min-width: 0px) {
        .layout-0-under-1 {
          display: table !important;
        }
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 450px) {
        .layout-1 {
          display: none !important;
        }
      }
@media (max-width: 450px) and (min-width: 0px) {
        .layout-1-under-450 {
          display: table !important;
        }
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 200px) {
        .layout-2 {
          display: none !important;
        }
      }
@media (max-width: 200px) and (min-width: 0px) {
        .layout-2-under-200 {
          display: table !important;
        }
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 450px) {
        .layout-3 {
          display: none !important;
        }
      }
@media (max-width: 450px) and (min-width: 0px) {
        .layout-3-under-450 {
          display: table !important;
        }
      }</style><!--<![endif]--><!--[if !mso]><!--><style>@media (max-width: 1px) {
        .layout-4 {
          display: none !important;
        }
      }
@media (max-width: 1px) and (min-width: 0px) {
        .layout-4-under-1 {
          display: table !important;
        }
      }</style><!--<![endif]--></head><body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0"><table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5" style="background-color:#f0f1f5"><tbody><tr><td style="background-color:#f0f1f5"><!--[if mso]><center>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
                      <tbody>
                        <tr>
                          <td><![endif]--><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;min-height:600px;margin:0 auto;background-color:#ffffff"><tbody><tr><td style="vertical-align:top"></td></tr><tr><td style="vertical-align:top;padding:10px
           0px
           0px
           0px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:10px 0 10px 0;vertical-align:top"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table border="0" cellpadding="0" cellspacing="0" class="layout-0" align="center" style="display:table;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto;background-color:#0d3931;border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:0;border-bottom-right-radius:0"><tbody><tr><td style="text-align:center;padding:12.979552793324286px 0px"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;max-width:600px;table-layout:fixed;margin:0 auto"><tbody><tr><td width="28.12%" style="width:28.12%;box-sizing:border-box;vertical-align:bottom;border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:0;border-bottom-right-radius:0"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="left"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:165px"><tbody><tr><td style="width:100%;padding:0 0"><img src="cid:logo_main" width="165" height="58" style="display:block;width:100%;height:auto;max-width:100%"></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td><td width="16" style="width:16px;box-sizing:border-box;font-size:0">&nbsp;</td><td width="69.21%" style="width:69.21%;box-sizing:border-box;vertical-align:bottom;border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:0;border-bottom-right-radius:0"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="right"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:407px"><tbody><tr><td style="width:100%;padding:0 0"><img src="cid:header_graphic" width="407" height="152" style="display:block;width:100%;height:auto;max-width:100%"></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><div style="padding:20px;color:#333;font-family:Arial, sans-serif;">
<p style="font-size:18px;font-weight:bold;color:#0d3931">Learning • Skills • Careers</p>
<p>Hi ${name},</p>
<p>This is a friendly reminder that your scheduled meeting on EduFiliova will begin in 15 minutes.</p>
<p>Please review the details below and get ready to join.</p>
<div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #0d3931">
<h3 style="margin-top:0;color:#0d3931">Meeting Information:</h3>
<p><strong>Meeting Title:</strong> ${meetingTitle}</p>
<p><strong>Date & Time:</strong> ${timeString}</p>
</div>
<div style="text-align:center;margin:30px 0">
<a href="${meetingUrl}" style="background-color:#0d3931;color:#ffffff;padding:15px 35px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block;font-size:16px">Join Meeting Now</a>
</div>
<h3 style="color:#0d3931">Helpful Tips Before Joining</h3>
<p>To ensure a smooth experience:</p>
<ul>
<li>Check your internet connection</li>
<li>Test your camera and microphone</li>
<li>Join a few minutes early if possible</li>
<li>Use a quiet environment for better audio quality</li>
</ul>
<h3 style="color:#0d3931">Important Notes</h3>
<ul>
<li>Meetings are hosted securely within EduFiliova</li>
<li>Late arrivals may miss part of the session</li>
</ul>
<p>We wish you a productive and successful session.</p>
<p>Best regards,<br><strong>The EduFiliova Team</strong></p>
<hr style="border:0;border-top:1px solid #eee;margin:20px 0">
<p style="font-size:12px;color:#999;text-align:center">
Visit the <a href="https://edufiliova.com/help" style="color:#0d3931">Help Center</a> | Contact us at <a href="mailto:support@edufiliova.com" style="color:#0d3931">support@edufiliova.com</a>
</p>
</div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!--[if !mso]><!--><table border="0" cellpadding="0" cellspacing="0" class="layout-1-under-450" align="center" style="display:none;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto;background-color:#0d3931"><tbody><tr><td style="text-align:center;padding:24.342896675586754px 20px"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;max-width:450px;table-layout:fixed;margin:0 auto"><tbody><tr><td width="100.00%" style="width:100.00%;box-sizing:border-box;vertical-align:top"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td style="padding:12px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="left"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:25px"><tbody><tr><td style="width:100%;padding:0 0"><img src="cid:icon_main" width="25" height="25" style="display:block;width:100%;height:auto;max-width:100%"></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td dir="ltr" style="font-size:16px;font-family:&quot;Stack Sans Text&quot;, Arial, Helvetica, sans-serif;text-align:left"><span style="font-size:18.6667px;color:#ffffff;white-space:pre-wrap">Meeting Reminder</span></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!--<![endif]--></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td><table border="0" cellpadding="0" cellspacing="0" class="layout-2" align="center" style="display:table;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto;background-color:#0c332c"><tbody><tr><td style="text-align:center;padding:12.467991689542888px 20px"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;max-width:201px;table-layout:fixed;margin:0 auto"><tbody><tr><td width="82.84%" style="width:82.84%;box-sizing:border-box;vertical-align:middle"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:145px"><tbody><tr><td style="width:100%;padding:0 0"><img src="cid:footer_logo" width="145" height="64" style="display:block;width:100%;height:auto;max-width:100%"></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td><td width="16" style="width:16px;box-sizing:border-box;font-size:0">&nbsp;</td><td width="9.20%" style="width:9.20%;box-sizing:border-box;vertical-align:middle"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="right"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:16px"><tbody><tr><td style="width:100%;padding:0 0"><img src="cid:footer_icon" width="16" height="16" style="display:block;width:100%;height:auto;max-width:100%"></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!--[if mso]>
                </tr>
              </tbody>
            </table>
          </center><![endif]--></td></tr></tbody></table></body></html>`;

    await emailTransporter.sendMail({
      from: `"EduFiliova" <noreply@edufiliova.com>`,
      to: email,
      subject: `[Reminder] "${meetingTitle}" starts in 15 minutes`,
      html: template,
      attachments: [
        {
          filename: 'logo.png',
          path: './attached_assets/9f7291948d8486bdd26690d0c32796e0_1766737469414.png',
          cid: 'logo_main'
        },
        {
          filename: 'header.png',
          path: './attached_assets/db561a55b2cf0bc6e877bb934b39b700_1766737469429.png',
          cid: 'header_graphic'
        },
        {
          filename: 'icon.png',
          path: './attached_assets/3d94f798ad2bd582f8c3afe175798088_1766737469410.png',
          cid: 'icon_main'
        },
        {
          filename: 'footer_logo.png',
          path: './attached_assets/53185829a16faf137a533f19db64d893_1766737469424.png',
          cid: 'footer_logo'
        },
        {
          filename: 'footer_icon.png',
          path: './attached_assets/3d94f798ad2bd582f8c3afe175798088_1766737469410.png',
          cid: 'footer_icon'
        }
      ]
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
