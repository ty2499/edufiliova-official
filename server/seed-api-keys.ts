import { db } from './db';
import { adminSettings } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { encryptValue } from './lib/api-keys';

interface APIKey {
  key: string;
  envVar: string;
  category: string;
  description: string;
  isSensitive: boolean;
}

const apiKeysToSeed: APIKey[] = [
  // ==================== PAYMENT ====================
  { key: 'stripe_secret_key', envVar: 'STRIPE_SECRET_KEY', category: 'payment', description: 'Stripe secret key for payment processing', isSensitive: true },
  { key: 'stripe_publishable_key', envVar: 'STRIPE_PUBLISHABLE_KEY', category: 'payment', description: 'Stripe publishable key (public)', isSensitive: false },
  { key: 'stripe_webhook_secret', envVar: 'STRIPE_WEBHOOK_SECRET', category: 'payment', description: 'Stripe webhook secret for validating events', isSensitive: true },
  { key: 'paypal_client_id', envVar: 'PAYPAL_CLIENT_ID', category: 'payment', description: 'PayPal client ID', isSensitive: true },
  { key: 'paypal_client_secret', envVar: 'PAYPAL_CLIENT_SECRET', category: 'payment', description: 'PayPal client secret', isSensitive: true },
  { key: 'paypal_environment', envVar: 'PAYPAL_ENVIRONMENT', category: 'payment', description: 'PayPal environment (sandbox or production)', isSensitive: false },
  { key: 'paystack_secret_key', envVar: 'PAYSTACK_SECRET_KEY', category: 'payment', description: 'Paystack secret key', isSensitive: true },
  { key: 'paystack_public_key', envVar: 'PAYSTACK_PUBLIC_KEY', category: 'payment', description: 'Paystack public key', isSensitive: false },
  { key: 'dodo_api_key', envVar: 'DODO_API_KEY', category: 'payment', description: 'Dodo Payments API key', isSensitive: true },
  { key: 'dodo_webhook_secret', envVar: 'DODO_WEBHOOK_SECRET', category: 'payment', description: 'Dodo Payments webhook secret', isSensitive: true },

  // ==================== STORAGE ====================
  { key: 'cloudinary_cloud_name', envVar: 'CLOUDINARY_CLOUD_NAME', category: 'storage', description: 'Cloudinary cloud name', isSensitive: false },
  { key: 'cloudinary_api_key', envVar: 'CLOUDINARY_API_KEY', category: 'storage', description: 'Cloudinary API key', isSensitive: true },
  { key: 'cloudinary_api_secret', envVar: 'CLOUDINARY_API_SECRET', category: 'storage', description: 'Cloudinary API secret', isSensitive: true },
  { key: 'cloudflare_account_id', envVar: 'CLOUDFLARE_ACCOUNT_ID', category: 'storage', description: 'Cloudflare account ID', isSensitive: true },
  { key: 'cloudflare_r2_access_key_id', envVar: 'CLOUDFLARE_R2_ACCESS_KEY_ID', category: 'storage', description: 'Cloudflare R2 access key', isSensitive: true },
  { key: 'cloudflare_r2_secret_access_key', envVar: 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', category: 'storage', description: 'Cloudflare R2 secret key', isSensitive: true },
  { key: 'cloudflare_r2_bucket_name', envVar: 'CLOUDFLARE_R2_BUCKET_NAME', category: 'storage', description: 'Cloudflare R2 bucket name', isSensitive: false },
  { key: 'cloudflare_r2_public_url', envVar: 'CLOUDFLARE_R2_PUBLIC_URL', category: 'storage', description: 'Cloudflare R2 public URL', isSensitive: false },

  // ==================== EMAIL ====================
  { key: 'smtp_host', envVar: 'SMTP_HOST', category: 'email', description: 'SMTP server hostname', isSensitive: false },
  { key: 'smtp_port', envVar: 'SMTP_PORT', category: 'email', description: 'SMTP server port', isSensitive: false },
  { key: 'smtp_user', envVar: 'SMTP_USER', category: 'email', description: 'SMTP username/email', isSensitive: false },
  { key: 'smtp_pass', envVar: 'SMTP_PASS', category: 'email', description: 'SMTP password', isSensitive: true },
  { key: 'smtp_pass_design', envVar: 'SMTP_PASS_DESIGN', category: 'email', description: 'SMTP password for design@edufiliova.com', isSensitive: true },
  { key: 'smtp_pass_noreply', envVar: 'SMTP_PASS_NOREPLY', category: 'email', description: 'SMTP password for noreply@edufiliova.com', isSensitive: true },
  { key: 'smtp_pass_support', envVar: 'SMTP_PASS_SUPPORT', category: 'email', description: 'SMTP password for support@edufiliova.com', isSensitive: true },
  { key: 'smtp_pass_verify', envVar: 'SMTP_PASS_VERIFY', category: 'email', description: 'SMTP password for verify@edufiliova.com', isSensitive: true },
  { key: 'email_from_name', envVar: 'EMAIL_FROM_NAME', category: 'email', description: 'Default email sender name', isSensitive: false },
  { key: 'email_from_email', envVar: 'EMAIL_FROM_EMAIL', category: 'email', description: 'Default email sender address', isSensitive: false },

  // ==================== SMS ====================
  { key: 'vonage_api_key', envVar: 'VONAGE_API_KEY', category: 'sms', description: 'Vonage API key for SMS', isSensitive: true },
  { key: 'vonage_api_secret', envVar: 'VONAGE_API_SECRET', category: 'sms', description: 'Vonage API secret', isSensitive: true },
  { key: 'vonage_phone_number', envVar: 'VONAGE_PHONE_NUMBER', category: 'sms', description: 'Vonage phone number for sending SMS', isSensitive: false },

  // ==================== MESSAGING (WhatsApp) ====================
  { key: 'whatsapp_access_token', envVar: 'WHATSAPP_ACCESS_TOKEN', category: 'messaging', description: 'WhatsApp Business API access token', isSensitive: true },
  { key: 'whatsapp_phone_number_id', envVar: 'WHATSAPP_PHONE_NUMBER_ID', category: 'messaging', description: 'WhatsApp Business phone number ID', isSensitive: false },
  { key: 'whatsapp_business_account_id', envVar: 'WHATSAPP_BUSINESS_ACCOUNT_ID', category: 'messaging', description: 'WhatsApp Business account ID', isSensitive: false },
  { key: 'whatsapp_app_secret', envVar: 'WHATSAPP_APP_SECRET', category: 'messaging', description: 'WhatsApp app secret for webhook verification', isSensitive: true },
  { key: 'whatsapp_webhook_verify_token', envVar: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', category: 'messaging', description: 'WhatsApp webhook verify token', isSensitive: true },
  { key: 'whatsapp_admin_secret', envVar: 'WHATSAPP_ADMIN_SECRET', category: 'messaging', description: 'Admin secret for WhatsApp message API', isSensitive: true },
  { key: 'whatsapp_webhook_url', envVar: '', category: 'messaging', description: 'WhatsApp webhook callback URL', isSensitive: false },

  // ==================== AUTH ====================
  { key: 'facebook_app_id', envVar: 'FACEBOOK_APP_ID', category: 'auth', description: 'Facebook App ID for social login', isSensitive: false },
  { key: 'facebook_app_secret', envVar: 'FACEBOOK_APP_SECRET', category: 'auth', description: 'Facebook App Secret for social login', isSensitive: true },
  { key: 'supabase_url', envVar: 'SUPABASE_URL', category: 'auth', description: 'Supabase project URL', isSensitive: false },
  { key: 'supabase_anon_key', envVar: 'SUPABASE_ANON_KEY', category: 'auth', description: 'Supabase anonymous key', isSensitive: true },
  { key: 'supabase_service_key', envVar: 'SUPABASE_SERVICE_KEY', category: 'auth', description: 'Supabase service role key', isSensitive: true },
  { key: 'session_secret', envVar: 'SESSION_SECRET', category: 'auth', description: 'Session encryption secret', isSensitive: true },

  // ==================== AI ====================
  { key: 'openai_api_key', envVar: 'OPENAI_API_KEY', category: 'ai', description: 'OpenAI API key for ChatGPT', isSensitive: true },
  { key: 'anthropic_api_key', envVar: 'ANTHROPIC_API_KEY', category: 'ai', description: 'Anthropic API key for Claude', isSensitive: true },
  { key: 'google_ai_api_key', envVar: 'GOOGLE_AI_API_KEY', category: 'ai', description: 'Google AI API key for Gemini', isSensitive: true },

  // ==================== VIDEO ====================
  { key: 'agora_app_id', envVar: 'AGORA_APP_ID', category: 'video', description: 'Agora app ID for video/audio calls', isSensitive: false },
  { key: 'agora_app_certificate', envVar: 'AGORA_APP_CERTIFICATE', category: 'video', description: 'Agora app certificate', isSensitive: true },

  // ==================== CERTIFICATE ====================
  { key: 'certifier_api_key', envVar: 'CERTIFIER_API_KEY', category: 'certificate', description: 'Certifier API key for certificates', isSensitive: true },
  { key: 'certifier_certificate_group_id', envVar: 'CERTIFIER_CERTIFICATE_GROUP_ID', category: 'certificate', description: 'Certifier certificate template group ID', isSensitive: false },
  { key: 'certifier_diploma_group_id', envVar: 'CERTIFIER_DIPLOMA_GROUP_ID', category: 'certificate', description: 'Certifier diploma template group ID', isSensitive: false },

  // ==================== GITHUB ====================
  { key: 'github_token', envVar: 'GITHUB_TOKEN', category: 'general', description: 'GitHub personal access token', isSensitive: true },
  { key: 'github_repo_owner', envVar: 'GITHUB_REPO_OWNER', category: 'general', description: 'GitHub repository owner', isSensitive: false },
  { key: 'github_repo_name', envVar: 'GITHUB_REPO_NAME', category: 'general', description: 'GitHub repository name', isSensitive: false },
];

export async function seedAPIKeys() {
  console.log('🔑 Seeding ALL API keys to database (DB-first approach)...');
  
  let seededCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const apiKey of apiKeysToSeed) {
    try {
      const [existing] = await db
        .select()
        .from(adminSettings)
        .where(eq(adminSettings.settingKey, apiKey.key))
        .limit(1);
      
      const envValue = apiKey.envVar ? process.env[apiKey.envVar] : null;
      
      if (existing) {
        if (envValue && !existing.settingValue) {
          const valueToStore = apiKey.isSensitive ? encryptValue(envValue) : envValue;
          await db
            .update(adminSettings)
            .set({
              settingValue: valueToStore,
              category: apiKey.category,
              description: apiKey.description,
              isEncrypted: apiKey.isSensitive,
              isActive: true,
              updatedAt: new Date()
            })
            .where(eq(adminSettings.settingKey, apiKey.key));
          console.log(`  ✅ Updated ${apiKey.key} from environment`);
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        const valueToStore = envValue 
          ? (apiKey.isSensitive ? encryptValue(envValue) : envValue)
          : null;
        
        await db.insert(adminSettings).values({
          settingKey: apiKey.key,
          settingValue: valueToStore,
          category: apiKey.category,
          description: apiKey.description,
          isEncrypted: apiKey.isSensitive,
          isActive: !!envValue,
          updatedBy: 'system'
        });
        
        if (envValue) {
          console.log(`  ✅ Seeded ${apiKey.key} from environment`);
          seededCount++;
        } else {
          console.log(`  ℹ️  Created placeholder for ${apiKey.key}`);
          skippedCount++;
        }
      }
    } catch (error) {
      console.error(`  ❌ Error seeding ${apiKey.key}:`, error);
    }
  }
  
  console.log(`\n🔑 API key seeding complete:`);
  console.log(`   - ${seededCount} new keys seeded`);
  console.log(`   - ${updatedCount} existing keys updated`);
  console.log(`   - ${skippedCount} placeholders/skipped`);
  console.log(`\n📝 All keys can now be managed from Admin Dashboard → API Keys`);
}

export async function getApiKeyFromDB(key: string): Promise<string | null> {
  try {
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, key))
      .limit(1);
    
    return setting?.settingValue || null;
  } catch {
    return null;
  }
}
