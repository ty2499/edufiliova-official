import { createEmailTransporterSync } from './email';
import * as fs from 'fs';
import * as path from 'path';

const recipientEmail = 'hallpt7@gmail.com';

async function sendAllTemplates() {
  try {
    const transporter = createEmailTransporterSync();

    // Collect all template information
    let emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; background: #f5f5f5; padding: 20px; }
    .container { background: white; padding: 30px; border-radius: 8px; }
    h1 { color: #0C332C; margin-bottom: 30px; }
    h2 { color: #0C332C; margin-top: 40px; margin-bottom: 15px; border-bottom: 2px solid #0C332C; padding-bottom: 10px; }
    .template-item { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #0C332C; }
    .template-title { font-weight: bold; font-size: 16px; color: #0C332C; margin-bottom: 10px; }
    .template-content { background: white; padding: 15px; border-radius: 3px; max-height: 300px; overflow-y: auto; font-size: 12px; border: 1px solid #ddd; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
    .summary { background: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Complete Email Templates Archive</h1>
    
    <div class="summary">
      <strong>Total Templates:</strong> ${getTemplateCount()} templates
    </div>
`;

    // 1. File-based templates
    emailContent += '<h2>1. File-Based Templates (HTML & Text)</h2>';
    const templateDir = './server/templates';
    const dirs = fs.readdirSync(templateDir).filter(d => 
      fs.statSync(path.join(templateDir, d)).isDirectory()
    );

    dirs.forEach(dir => {
      const htmlPath = path.join(templateDir, dir, 'email.html');
      const txtPath = path.join(templateDir, dir, 'email.txt');

      if (fs.existsSync(htmlPath)) {
        const content = fs.readFileSync(htmlPath, 'utf-8');
        const displayName = dir.replace(/_/g, ' ').replace('template', '').trim();
        emailContent += `
    <div class="template-item">
      <div class="template-title">📄 ${displayName} (HTML)</div>
      <div class="template-content"><pre>${escapeHtml(content.substring(0, 500))}</pre>...</div>
    </div>`;
      }

      if (fs.existsSync(txtPath)) {
        const content = fs.readFileSync(txtPath, 'utf-8');
        const displayName = dir.replace(/_/g, ' ').replace('template', '').trim();
        emailContent += `
    <div class="template-item">
      <div class="template-title">📄 ${displayName} (Text)</div>
      <div class="template-content"><pre>${escapeHtml(content.substring(0, 500))}</pre>...</div>
    </div>`;
      }
    });

    emailContent += '<h2>2. Notification Templates</h2>';
    try {
      const notificationTemplates = [
        'incomplete_registration_1h',
        'incomplete_registration_24h',
        'welcome_day_0',
        'welcome_day_2',
        'welcome_day_5',
        'learning_inactivity_3d',
        'course_not_started_3d',
        'download_reminder_24h',
        'teacher_no_content_3d',
        'freelancer_no_content_5d'
      ];

      notificationTemplates.forEach(template => {
        emailContent += `
    <div class="template-item">
      <div class="template-title">⏰ ${template}</div>
      <div class="template-content">Located in: <code>./server/templates/notifications/email-templates.ts</code></div>
    </div>`;
      });
    } catch (error) {
      console.error('Error reading notification templates:', error);
    }

    emailContent += '<h2>3. Seeded Email Templates</h2>';
    const seededTemplates = [
      'Welcome New User',
      'Newsletter',
      'Special Promotion',
      'Course Completion Congratulations',
      'Re-engagement Campaign',
      'New Course Announcement',
      'Order Confirmation',
      'Payment Receipt',
      'Teacher Welcome',
      'Freelancer Welcome',
      'Grade Update for Students',
      'Feedback Request',
      'Seasonal Sale',
      'Subscription Expiring',
      'Digital Purchase Order'
    ];

    seededTemplates.forEach(template => {
      emailContent += `
    <div class="template-item">
      <div class="template-title">✉️ ${template}</div>
      <div class="template-content">Located in: <code>./server/seed-email-templates.ts</code></div>
    </div>`;
    });

    emailContent += `
  </div>
</body>
</html>`;

    // Send the email
    const mailOptions = {
      from: `"EduFiliova Templates" <${process.env.SMTP_USER || 'orders@edufiliova.com'}>`,
      to: recipientEmail,
      subject: '📧 Complete Email Templates Archive - All Systems',
      html: emailContent,
      attachments: [
        {
          filename: 'all-templates-summary.json',
          content: JSON.stringify({
            generatedAt: new Date().toISOString(),
            totalTemplates: getTemplateCount(),
            categories: {
              'File-based': dirs.length * 2,
              'Notification': 10,
              'Seeded': seededTemplates.length
            },
            templates: {
              fileBased: dirs,
              notification: notificationTemplates,
              seeded: seededTemplates
            }
          }, null, 2)
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email with all templates sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

function getTemplateCount(): number {
  const templateDir = './server/templates';
  const dirs = fs.readdirSync(templateDir).filter(d => 
    fs.statSync(path.join(templateDir, d)).isDirectory()
  );
  const fileBased = dirs.length * 2; // HTML + TXT for each
  const notification = 10;
  const seeded = 15;
  return fileBased + notification + seeded;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const notificationTemplates = [
  'incomplete_registration_1h',
  'incomplete_registration_24h',
  'welcome_day_0',
  'welcome_day_2',
  'welcome_day_5',
  'learning_inactivity_3d',
  'course_not_started_3d',
  'download_reminder_24h',
  'teacher_no_content_3d',
  'freelancer_no_content_5d'
];

sendAllTemplates().catch(console.error);
