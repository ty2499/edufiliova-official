import { emailService } from './server/utils/email';

async function sendDemoEmail() {
  console.log('📧 Sending email template demo to teach@pacreatives.co.za...\n');
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0C332C 0%, #1a4d44 100%); padding: 40px; color: white; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { padding: 40px; }
    .section { margin: 30px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb; }
    .section h2 { margin: 0 0 15px 0; color: #0C332C; font-size: 18px; font-weight: 600; }
    .list { list-style: none; padding: 0; margin: 0; }
    .list li { padding: 8px 0; color: #333; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
    .list li:last-child { border-bottom: none; }
    .list strong { color: #0C332C; font-weight: 600; }
    .footer { background: #f5f7fa; border-top: 1px solid #e5e7eb; padding: 30px 40px; text-align: center; color: #666; font-size: 13px; }
    .highlight { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; border-radius: 4px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 EduFiliova Email System</h1>
      <p>Email Template Configuration Overview</p>
    </div>
    
    <div class="content">
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Hello,
      </p>
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        This email demonstrates the comprehensive email template system configured in EduFiliova.
      </p>

      <div class="section">
        <h2>📋 Email Templates (16+)</h2>
        <ul class="list">
          <li><strong>Verification:</strong> Teacher, Freelancer, Shop Customer codes & links</li>
          <li><strong>Purchases:</strong> Courses, Digital Products, Subscriptions, Advertisements</li>
          <li><strong>Authentication:</strong> Password resets, Login verification, Account security</li>
          <li><strong>Approvals:</strong> Application approvals/rejections with detailed feedback</li>
          <li><strong>Marketing:</strong> Welcome series, Re-engagement, Account notifications</li>
          <li><strong>Engagement:</strong> Course reminders, Downloads, Recommendations</li>
        </ul>
      </div>

      <div class="section">
        <h2>⚙️ Configuration Features</h2>
        <ul class="list">
          <li><strong>Service:</strong> NodeMailer with multi-account SMTP support</li>
          <li><strong>Templates:</strong> /server/templates/ and server/utils/email.ts</li>
          <li><strong>Images:</strong> Cloudinary URL mapping & optimization</li>
          <li><strong>Database:</strong> PostgreSQL for account & campaign tracking</li>
          <li><strong>Marketing:</strong> Campaign management with segment targeting</li>
          <li><strong>Files:</strong> Attachment support with cloud storage</li>
        </ul>
      </div>

      <div class="section">
        <h2>✅ Key Features</h2>
        <ul class="list">
          <li>Bulletproof name replacement (handles 10+ variations)</li>
          <li>iPhone font stack for cross-client compatibility</li>
          <li>Responsive mobile-first design</li>
          <li>Multi-account SMTP transporter selection</li>
          <li>Email reply threading & conversation management</li>
          <li>IMAP email sync with 30-second intervals</li>
          <li>Connection testing for IMAP/SMTP</li>
          <li>WebSocket real-time admin updates</li>
        </ul>
      </div>

      <div class="highlight">
        <strong>🚀 Production Ready</strong><br>
        16+ professional templates with responsive design, brand colors, clear CTAs, compliance footers, and cross-client optimization.
      </div>

      <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        For complete documentation, see EMAIL_TEMPLATES_OVERVIEW.md in the project root.
      </p>
    </div>

    <div class="footer">
      <p>🚀 EduFiliova Email System Configuration</p>
      <p>© 2025 EduFiliova. All rights reserved.</p>
      <p>Support: support@edufiliova.com</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await emailService.sendEmail({
      to: 'teach@pacreatives.co.za',
      subject: 'EduFiliova Email System Configuration - Template Overview',
      html: htmlContent,
      from: '"EduFiliova Support" <support@edufiliova.com>'
    });

    if (result) {
      console.log('✅ Email sent successfully!');
      console.log('To: teach@pacreatives.co.za');
      console.log('Subject: EduFiliova Email System Configuration - Template Overview');
      console.log('\n📧 Email includes:');
      console.log('   • 16+ Email Templates overview');
      console.log('   • Configuration features');
      console.log('   • Multi-account SMTP support');
      console.log('   • Cloudinary image optimization');
      console.log('   • Marketing automation features');
      console.log('   • Key features & capabilities');
    } else {
      console.log('❌ Failed to send email');
    }
  } catch (error) {
    console.log('❌ Error:', (error as Error).message);
  }
}

sendDemoEmail();
