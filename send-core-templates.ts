import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

async function sendTemplates() {
  const recipient = 'teach@pacreatives.co.za';
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'mail.spacemail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || 'orders@edufiliova.com',
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD,
    },
  };

  const transporter = nodemailer.createTransport(smtpConfig);

  const templatesDir = path.join(process.cwd(), 'server', 'templates');
  const templateFolders = fs.readdirSync(templatesDir).filter(f => 
    fs.statSync(path.join(templatesDir, f)).isDirectory() && f !== 'notifications'
  );

  console.log(`Found ${templateFolders.length} template folders.`);

  for (const folder of templateFolders) {
    const htmlPath = path.join(templatesDir, folder, 'email.html');
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const subject = `Core Template: ${folder.replace(/_/g, ' ')}`;
      
      try {
        await transporter.sendMail({
          from: `"EduFiliova System" <${smtpConfig.auth.user}>`,
          to: recipient,
          subject: subject,
          html: html,
        });
        console.log(`✅ Sent: ${subject}`);
      } catch (error) {
        console.error(`❌ Failed to send ${folder}:`, error);
      }
    }
  }

  // Also send the approval template from utils
  const approvalTemplatePath = path.join(process.cwd(), 'server', 'utils', 'approval-template.html');
  if (fs.existsSync(approvalTemplatePath)) {
    const html = fs.readFileSync(approvalTemplatePath, 'utf-8');
    try {
      await transporter.sendMail({
        from: `"EduFiliova System" <${smtpConfig.auth.user}>`,
        to: recipient,
        subject: 'Core Template: Teacher Approval (Utils)',
        html: html,
      });
      console.log('✅ Sent: Teacher Approval Template');
    } catch (error) {
      console.error('❌ Failed to send Approval Template:', error);
    }
  }
}

sendTemplates().catch(console.error);
