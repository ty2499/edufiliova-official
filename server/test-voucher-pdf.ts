import { sendBulkVouchersEmail } from './email';

async function testVoucherPDF() {
  const testEmail = 'tylerwillsza@gmail.com';
  
  console.log('📧 Sending test bulk vouchers email to', testEmail, '...\n');

  try {
    const bulkVouchers = Array.from({ length: 5 }, (_, i) => ({
      code: `BULK2025-${String(i + 1).padStart(3, '0')}`,
      amount: 50,
      description: 'Corporate Gift Voucher',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    
    await sendBulkVouchersEmail(
      testEmail,
      'Tyler Williams',
      bulkVouchers
    );
    
    console.log('✅ Bulk vouchers email sent successfully!');
    console.log('📎 PDF attachment with updated layout included');
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

testVoucherPDF()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
