import { emailService } from './email.ts';

export async function sendGiftVoucherEmail(recipientEmail, recipientName, buyerName, voucherCode, amount, personalMessage) {
  console.log(`📧 Sending gift voucher email to ${recipientEmail}...`);
  console.log(`   - Recipient: ${recipientName}`);
  console.log(`   - From: ${buyerName}`);
  console.log(`   - Code: ${voucherCode}`);
  console.log(`   - Amount: $${amount}`);
  
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0C332C; text-align: center;">You've Received a Gift Voucher!</h2>
        <p>Hi ${recipientName},</p>
        <p>${buyerName} has sent you a gift voucher for <strong>EduFiliova</strong>!</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0; color: #666;">Voucher Amount</h3>
          <div style="font-size: 32px; font-weight: bold; color: #e84a2a; margin: 10px 0;">$${amount}</div>
          <h3 style="margin: 0; color: #666;">Your Voucher Code</h3>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0C332C; margin: 10px 0; padding: 10px; border: 2px dashed #0C332C; display: inline-block;">${voucherCode}</div>
        </div>

        ${personalMessage ? `
        <div style="margin: 20px 0; font-style: italic; color: #555; border-left: 4px solid #eee; padding-left: 15px;">
          "${personalMessage}"
        </div>` : ''}

        <p>You can use this code during checkout to apply the discount to your purchase.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://edufiliova.com" style="background-color: #0C332C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit EduFiliova</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
          © ${new Date().getFullYear()} EduFiliova. All rights reserved.
        </p>
      </div>
    `;

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: `You've received a $${amount} Gift Voucher from ${buyerName}!`,
      html,
      from: `"EduFiliova" <orders@edufiliova.com>`
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
