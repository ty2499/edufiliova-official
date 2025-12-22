import { storage } from './storage';
import { emailService } from './utils/email';

async function sendMarketingEmailsToAudrey() {
  const targetEmails = ['audreynyoni83@gmail.com', 'hallpt7@gmail.com'];
  const recipientName = 'Audrey';
  
  console.log('🚀 Sending marketing emails to:', targetEmails.join(', '));

  const results: { email: string; template: string; success: boolean; error?: string }[] = [];

  let allTemplates: any[] = [];
  try {
    allTemplates = await storage.getEmailMarketingTemplates({});
    console.log(`Found ${allTemplates.length} marketing templates available\n`);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return;
  }

  // Select 3 templates for freelancers/general marketing
  const templatesToSend = allTemplates.slice(0, 3);
  
  if (templatesToSend.length === 0) {
    console.log('No templates found. Using default marketing content.');
    
    // Send 3 default marketing emails
    const defaultEmails = [
      {
        subject: 'Welcome to EduFiliova - Your Creative Journey Starts Here!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ff5834;">Welcome, ${recipientName}! 🎨</h1>
            <p>We're thrilled to have you join EduFiliova's community of talented freelancers.</p>
            <p>As a creative professional, you now have access to:</p>
            <ul>
              <li>Showcase your portfolio to thousands of potential clients</li>
              <li>Connect with students and businesses worldwide</li>
              <li>Earn from your expertise and creativity</li>
            </ul>
            <p>Start building your profile today and let your talent shine!</p>
            <a href="https://edufiliova.com" style="display: inline-block; background: #ff5834; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Get Started</a>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">EduFiliova Team</p>
          </div>
        `
      },
      {
        subject: 'Boost Your Freelance Career with EduFiliova',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ff5834;">Ready to Level Up, ${recipientName}? 🚀</h1>
            <p>Here are some tips to maximize your success on EduFiliova:</p>
            <ol>
              <li><strong>Complete Your Profile</strong> - Add your skills, bio, and profile photo</li>
              <li><strong>Upload Your Best Work</strong> - Showcase projects that highlight your expertise</li>
              <li><strong>Set Competitive Rates</strong> - Price your services to attract clients</li>
              <li><strong>Stay Active</strong> - Regular engagement helps you get discovered</li>
            </ol>
            <p>Freelancers with complete profiles get 3x more inquiries!</p>
            <a href="https://edufiliova.com" style="display: inline-block; background: #ff5834; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Update Your Profile</a>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">EduFiliova Team</p>
          </div>
        `
      },
      {
        subject: 'Special Offer: Premium Features for Freelancers',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ff5834;">Exclusive Opportunity, ${recipientName}! ⭐</h1>
            <p>As a valued member of our freelancer community, we're offering you exclusive access to premium features:</p>
            <ul>
              <li>✨ Featured placement in search results</li>
              <li>📊 Advanced analytics for your portfolio</li>
              <li>💬 Priority support</li>
              <li>🎯 Access to premium client projects</li>
            </ul>
            <p>Take your freelance career to new heights with EduFiliova Premium!</p>
            <a href="https://edufiliova.com" style="display: inline-block; background: #ff5834; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Learn More</a>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">EduFiliova Team</p>
          </div>
        `
      }
    ];

    for (const email of targetEmails) {
      for (let i = 0; i < defaultEmails.length; i++) {
        try {
          console.log(`Sending email ${i + 1}/3 to ${email}...`);
          await emailService.sendEmail({
            to: email,
            subject: defaultEmails[i].subject,
            html: defaultEmails[i].html,
            from: `"EduFiliova" <noreply@edufiliova.com>`,
          });
          results.push({ email, template: `Marketing Email ${i + 1}`, success: true });
          console.log('✅ Sent successfully\n');
        } catch (error) {
          results.push({ email, template: `Marketing Email ${i + 1}`, success: false, error: String(error) });
          console.log('❌ Failed:', error, '\n');
        }
      }
    }
  } else {
    // Send templates from database
    for (const email of targetEmails) {
      for (let i = 0; i < Math.min(3, templatesToSend.length); i++) {
        const template = templatesToSend[i];
        try {
          console.log(`Sending "${template.name}" to ${email}...`);

          let htmlContent = template.htmlContent || '';
          let subject = template.subject || '';

          const replacements: Record<string, string> = {
            '{{recipientName}}': recipientName,
            '{{recipientEmail}}': email,
            '{{unsubscribeLink}}': 'https://edufiliova.com/unsubscribe',
            '{{gradeLevel}}': '10',
            '{{expiryDate}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            '{{courseName}}': 'Creative Design Masterclass',
            '{{productName}}': 'Premium Freelancer Bundle',
          };

          for (const [placeholder, value] of Object.entries(replacements)) {
            const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
            htmlContent = htmlContent.replace(regex, value);
            subject = subject.replace(regex, value);
          }

          await emailService.sendEmail({
            to: email,
            subject: subject,
            html: htmlContent,
            from: `"EduFiliova" <noreply@edufiliova.com>`,
          });

          results.push({ email, template: template.name, success: true });
          console.log('✅ Sent successfully\n');
        } catch (error) {
          results.push({ email, template: template.name, success: false, error: String(error) });
          console.log('❌ Failed:', error, '\n');
        }
      }
    }
  }

  // Print Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 MARKETING EMAIL SUMMARY');
  console.log('═══════════════════════════════════════════════\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total: ${results.length} emails`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('Failed emails:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.email} (${r.template}): ${r.error}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════\n');
}

sendMarketingEmailsToAudrey()
  .then(() => {
    console.log('✅ Marketing emails sent!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error sending marketing emails:', error);
    process.exit(1);
  });
