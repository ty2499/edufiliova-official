import axios from 'axios';

// Test WhatsApp Business API credentials
async function testWhatsAppCredentials() {
  console.log('\n🔍 Testing WhatsApp Business API Credentials...\n');

  // Check environment variables
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // Step 1: Check if credentials exist
  console.log('📋 Credential Check:');
  console.log(`✓ WHATSAPP_PHONE_NUMBER_ID: ${phoneNumberId ? '✅ Set' : '❌ Missing'}`);
  console.log(`✓ WHATSAPP_BUSINESS_ACCOUNT_ID: ${businessAccountId ? '✅ Set' : '❌ Missing'}`);
  console.log(`✓ WHATSAPP_ACCESS_TOKEN: ${accessToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`✓ WHATSAPP_WEBHOOK_VERIFY_TOKEN: ${verifyToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`✓ WHATSAPP_APP_SECRET: ${appSecret ? '✅ Set' : '❌ Missing'}\n`);

  if (!phoneNumberId || !accessToken) {
    console.log('❌ Missing required credentials. Cannot proceed with API test.\n');
    process.exit(1);
  }

  // Step 2: Test API connection by fetching phone number info
  console.log('🔌 Testing API Connection...\n');

  try {
    // Try to get phone number details from Meta API
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        fields: 'verified_name,display_phone_number,quality_rating'
      }
    });

    console.log('✅ API Connection Successful!\n');
    console.log('📱 WhatsApp Business Account Details:');
    console.log(`   Business Name: ${response.data.verified_name || 'N/A'}`);
    console.log(`   Phone Number: ${response.data.display_phone_number || 'N/A'}`);
    console.log(`   Quality Rating: ${response.data.quality_rating || 'N/A'}\n`);

    // Step 3: Check Business Account details
    if (businessAccountId) {
      try {
        const businessUrl = `https://graph.facebook.com/v18.0/${businessAccountId}`;
        const businessResponse = await axios.get(businessUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            fields: 'name,timezone_id'
          }
        });

        console.log('🏢 Business Account Details:');
        console.log(`   Account Name: ${businessResponse.data.name || 'N/A'}`);
        console.log(`   Timezone: ${businessResponse.data.timezone_id || 'N/A'}\n`);
      } catch (error: any) {
        console.log('⚠️  Could not fetch business account details');
        if (error.response?.data?.error) {
          console.log(`   Error: ${error.response.data.error.message}\n`);
        }
      }
    }

    console.log('✅ All credentials are valid and working!\n');
    console.log('🎉 Your WhatsApp Bot is ready to use!\n');
    console.log('Next steps:');
    console.log('1. Configure webhook URL in Meta Developer Console');
    console.log('2. Students can start messaging your WhatsApp number');
    console.log('3. Monitor conversations in the admin dashboard\n');

  } catch (error: any) {
    console.log('❌ API Connection Failed!\n');
    
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      console.log(`Error Code: ${apiError.code}`);
      console.log(`Error Type: ${apiError.type}`);
      console.log(`Error Message: ${apiError.message}\n`);

      // Provide helpful suggestions based on error type
      if (apiError.code === 190) {
        console.log('💡 Suggestion: Your access token may be invalid or expired.');
        console.log('   - Generate a new access token in Meta Developer Console');
        console.log('   - Make sure you\'re using a permanent token, not a temporary one\n');
      } else if (apiError.message.includes('Phone number')) {
        console.log('💡 Suggestion: Check your WHATSAPP_PHONE_NUMBER_ID');
        console.log('   - Go to Meta Developer Console > WhatsApp > API Setup');
        console.log('   - Copy the correct Phone Number ID\n');
      } else {
        console.log('💡 Suggestion: Verify all credentials in Meta Developer Console');
        console.log('   - Phone Number ID: WhatsApp > API Setup');
        console.log('   - Access Token: WhatsApp > API Setup (generate permanent token)');
        console.log('   - Business Account ID: WhatsApp > Getting Started\n');
      }
    } else {
      console.log(`Error: ${error.message}\n`);
    }

    process.exit(1);
  }
}

// Run the test
testWhatsAppCredentials().catch(console.error);
