
import { EmailService } from '../server/utils/email';
import * as dotenv from 'dotenv';
import { db } from '../db';
import { emailAccounts } from '../shared/schema';

// Load environment variables
dotenv.config();

async function testSendFreelancerApproval() {
  console.log('🏁 Starting test email script...');
  
  // Directly initialize the service
  const emailService = new EmailService();
  
  const recipient = 'teach@pacreatives.co.za';
  const data = {
    fullName: 'Test Freelancer',
    displayName: 'Creative Pro'
  };

  console.log(`🚀 Attempting to send freelancer approval email to ${recipient}...`);
  
  try {
    // Wait a bit for DB initialization if needed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = await emailService.sendFreelancerApprovalEmail(recipient, data);
    if (success) {
      console.log('✅ Success! Email was sent.');
    } else {
      console.error('❌ Failed to send email. Check server logs for details.');
    }
  } catch (error) {
    console.error('❌ Error in test script:', error);
  }
  
  process.exit(0);
}

testSendFreelancerApproval();
