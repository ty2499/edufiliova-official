import { EmailService } from './utils/email';

async function sendReminderEmail() {
  const testEmail = 'hallpt7@gmail.com';
  const emailService = new EmailService();
  
  try {
    console.log('📧 Sending reminder email to', testEmail, '...\n');
    
    // Send a subscription confirmation email as a reminder test
    const success = await emailService.sendSubscriptionConfirmationEmail(testEmail, {
      customerName: 'Test User',
      planName: 'Premium Learning Plan',
      billingCycle: 'Monthly',
      orderId: 'REMINDER-TEST-001',
      price: '29.99',
      activationDate: new Date().toLocaleDateString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      dashboardUrl: 'https://edufiliova.com/dashboard'
    });
    
    if (success) {
      console.log('✅ Email sent successfully to', testEmail);
    } else {
      console.log('⚠️ Email sending returned false');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    process.exit(1);
  }
}

sendReminderEmail();
