import { storage } from './storage';

interface EmailAccountConfig {
  email: string;
  displayName: string;
  purpose: string;
}

const emailAccountsToSeed: EmailAccountConfig[] = [
  {
    email: 'verify@edufiliova.com',
    displayName: 'EduFiliova Verification',
    purpose: 'Account registration and password recovery'
  },
  {
    email: 'orders@edufiliova.com',
    displayName: 'EduFiliova Orders',
    purpose: 'Purchase confirmations and order management'
  },
  {
    email: 'design@edufiliova.com',
    displayName: 'EduFiliova Design Team',
    purpose: 'Customer inquiries and design requests'
  },
  {
    email: 'support@edufiliova.com',
    displayName: 'EduFiliova Support',
    purpose: 'Customer support and assistance'
  },
  {
    email: 'noreply@edufiliova.com',
    displayName: 'EduFiliova Notifications',
    purpose: 'One-way system notifications'
  }
];

const EMAIL_PASSWORD = process.env.EDUFILIOVA_EMAIL_PASSWORD || '';
const IMAP_HOST = 'mail.spacemail.com';
const SMTP_HOST = 'mail.spacemail.com';

export async function seedEmailAccounts() {
  if (!EMAIL_PASSWORD) {
    console.log('⚠️  EDUFILIOVA_EMAIL_PASSWORD not set, skipping email account seeding');
    return;
  }

  console.log('📧 Seeding email accounts...');
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const config of emailAccountsToSeed) {
    try {
      const accounts = await storage.getEmailAccounts();
      const existing = accounts.find(acc => acc.email === config.email);
      
      if (existing) {
        console.log(`  ⏭️  ${config.email} already configured, skipping...`);
        skippedCount++;
        continue;
      }
      
      await storage.createEmailAccount({
        email: config.email,
        displayName: config.displayName,
        imapHost: IMAP_HOST,
        imapPort: 993,
        imapSecure: true,
        imapUsername: config.email,
        imapPassword: EMAIL_PASSWORD,
        smtpHost: SMTP_HOST,
        smtpPort: 465,
        smtpSecure: true,
        smtpUsername: config.email,
        smtpPassword: EMAIL_PASSWORD,
        isActive: true,
        syncStatus: 'idle'
      });
      
      console.log(`  ✅ Configured ${config.email} - ${config.purpose}`);
      seededCount++;
    } catch (error) {
      console.error(`  ❌ Error seeding ${config.email}:`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log(`📧 Email account seeding complete: ${seededCount} configured, ${skippedCount} skipped`);
}
