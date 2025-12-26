import { emailService } from './utils/email';

async function testDigitalProductsReceiptEmail() {
  console.log('📧 Sending digital products purchase receipt email...\n');

  const success = await emailService.sendDigitalProductsPurchaseReceiptEmail(
    'hallpt7@gmail.com',
    {
      customerName: 'Test Customer',
      orderId: 'ORD-20251226-001',
      totalPrice: '49.99',
      purchaseDate: new Date().toLocaleString(),
      items: [
        { name: 'Advanced JavaScript Course', downloadLink: 'https://example.com/download/js-course' },
        { name: 'React Mastery Bundle', downloadLink: 'https://example.com/download/react-bundle' },
        { name: 'Web Design Templates Pack', downloadLink: 'https://example.com/download/templates' }
      ],
      expiryHours: 72
    }
  );

  if (success) {
    console.log('✅ Digital products receipt email sent successfully to hallpt7@gmail.com');
    console.log('📧 Email includes:');
    console.log('   - Order details (ID, total, date)');
    console.log('   - Product download links');
    console.log('   - Download information and expiry notice');
    console.log('   - All template images embedded');
    console.log('   - Professional EduFiliova branding');
  } else {
    console.log('❌ Failed to send digital products receipt email');
  }
}

testDigitalProductsReceiptEmail().catch(console.error);
