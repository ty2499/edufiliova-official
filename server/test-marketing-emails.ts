import { storage } from './storage';
import { emailService } from './utils/email';

async function sendMarketingTemplateEmails() {
  const testEmail = 'tylerwillsza@gmail.com';
  console.log('🚀 Starting to send all marketing template previews to', testEmail, '...\n');

  const results: { template: string; success: boolean; error?: string }[] = [];

  // Get all marketing templates from storage
  let allTemplates: any[] = [];
  try {
    allTemplates = await storage.getEmailMarketingTemplates({});
    console.log(`Found ${allTemplates.length} marketing templates to preview\n`);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return;
  }

  // Send each template as a preview
  for (let i = 0; i < allTemplates.length; i++) {
    const template = allTemplates[i];
    try {
      console.log(`Sending ${i + 1}/${allTemplates.length}: ${template.name}...`);

      // Replace template variables with sample data
      let htmlContent = template.htmlContent || '';
      let subject = template.subject || '';

      // Replace all common template variables with sample data
      const replacements: Record<string, string> = {
        '{{recipientName}}': 'Tyler Williams',
        '{{recipientEmail}}': testEmail,
        '{{unsubscribeLink}}': 'https://edufiliova.com/unsubscribe',
        '{{gradeLevel}}': '10',
        '{{expiryDate}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        '{{orderNumber}}': 'ORD-2025-12345',
        '{{orderDate}}': new Date().toLocaleDateString(),
        '{{orderTotal}}': '$149.99',
        '{{trackingNumber}}': 'TRACK123456789',
        '{{shippingCarrier}}': 'DHL Express',
        '{{courseName}}': 'Advanced JavaScript Masterclass',
        '{{productName}}': 'Premium Learning Bundle',
        '{{referralCode}}': 'TYLER2025',
        '{{referralLink}}': 'https://edufiliova.com/ref/TYLER2025',
        '{{milestone}}': '10 Courses Completed',
        '{{birthday}}': 'November 28',
      };

      for (const [placeholder, value] of Object.entries(replacements)) {
        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
        htmlContent = htmlContent.replace(regex, value);
        subject = subject.replace(regex, value);
      }

      await emailService.sendEmail({
        to: testEmail,
        subject: `[PREVIEW] ${subject}`,
        html: htmlContent,
        from: `"EduFiliova Marketing" <noreply@edufiliova.com>`,
      });

      results.push({ template: template.name, success: true });
      console.log('✅ Sent successfully\n');
    } catch (error) {
      results.push({ template: template.name, success: false, error: String(error) });
      console.log('❌ Failed:', error, '\n');
    }
  }

  // Print Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 MARKETING EMAIL PREVIEW SUMMARY');
  console.log('═══════════════════════════════════════════════\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total: ${results.length} emails`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('Failed templates:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.template}: ${r.error}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════\n');
}

sendMarketingTemplateEmails()
  .then(() => {
    console.log('✅ All marketing email previews sent!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error sending marketing emails:', error);
    process.exit(1);
  });
