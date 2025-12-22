import { sendVoucherEmail } from './email.ts';

export async function sendGiftVoucherEmail(recipientEmail, recipientName, buyerName, voucherCode, amount, personalMessage) {
  console.log(`📧 Sending gift voucher email to ${recipientEmail}...`);
  console.log(`   - Recipient: ${recipientName}`);
  console.log(`   - From: ${buyerName}`);
  console.log(`   - Code: ${voucherCode}`);
  console.log(`   - Amount: $${amount}`);
  
  try {
    const result = await sendVoucherEmail({
      recipientEmail,
      recipientName,
      voucherCode,
      amount,
      personalMessage,
      senderName: buyerName || 'Someone special'
    });
    
    if (result) {
      console.log(`✅ Gift voucher email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`❌ Gift voucher email failed to send to ${recipientEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending gift voucher email:`, error);
    throw error;
  }
}
