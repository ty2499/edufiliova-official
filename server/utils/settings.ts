import { db } from '../db';
import { adminSettings, systemSettings } from '../../shared/schema';
import { eq } from 'drizzle-orm';

interface SettingCache {
  [key: string]: { value: string | null; timestamp: number };
}

const settingsCache: SettingCache = {};
const systemSettingsCache: SettingCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getSetting(key: string, fallbackEnvKey?: string): Promise<string | null> {
  const now = Date.now();
  
  // Check cache first
  if (settingsCache[key] && (now - settingsCache[key].timestamp) < CACHE_TTL) {
    return settingsCache[key].value;
  }

  try {
    // Try to get from database first
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, key))
      .limit(1);

    if (setting && setting.settingValue && setting.isActive) {
      // Cache the value
      settingsCache[key] = { value: setting.settingValue, timestamp: now };
      return setting.settingValue;
    }
  } catch (error) {
    console.warn(`Failed to retrieve setting '${key}' from database:`, error);
  }

  // Fallback to environment variable
  const envValue = fallbackEnvKey ? process.env[fallbackEnvKey] : process.env[key];
  
  if (envValue) {
    settingsCache[key] = { value: envValue, timestamp: now };
    return envValue;
  }

  // No value found
  settingsCache[key] = { value: null, timestamp: now };
  return null;
}

export async function getSystemSetting(key: string): Promise<string | null> {
  const now = Date.now();
  
  // Check cache first
  if (systemSettingsCache[key] && (now - systemSettingsCache[key].timestamp) < CACHE_TTL) {
    return systemSettingsCache[key].value;
  }

  try {
    // Get from system_settings table
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (setting && setting.value) {
      // Cache the value
      systemSettingsCache[key] = { value: setting.value, timestamp: now };
      return setting.value;
    }
  } catch (error) {
    console.warn(`Failed to retrieve system setting '${key}' from database:`, error);
  }

  // No value found
  systemSettingsCache[key] = { value: null, timestamp: now };
  return null;
}

export function clearSettingsCache(key?: string) {
  if (key) {
    delete settingsCache[key];
    delete systemSettingsCache[key];
  } else {
    Object.keys(settingsCache).forEach(k => delete settingsCache[k]);
    Object.keys(systemSettingsCache).forEach(k => delete systemSettingsCache[k]);
  }
}

// Specific helper functions for common settings
export async function getStripeSecretKey(): Promise<string | null> {
  return getSetting('stripe_secret_key', 'STRIPE_SECRET_KEY');
}

export async function getStripePublishableKey(): Promise<string | null> {
  return getSetting('stripe_publishable_key', 'STRIPE_PUBLISHABLE_KEY');
}

export async function getOpenAIKey(): Promise<string | null> {
  return getSetting('openai_api_key', 'OPENAI_API_KEY');
}

export async function getCloudinaryConfig(): Promise<{
  cloudName: string | null;
  apiKey: string | null;
  apiSecret: string | null;
}> {
  const [cloudName, apiKey, apiSecret] = await Promise.all([
    getSetting('cloudinary_cloud_name', 'CLOUDINARY_CLOUD_NAME'),
    getSetting('cloudinary_api_key', 'CLOUDINARY_API_KEY'),
    getSetting('cloudinary_api_secret', 'CLOUDINARY_API_SECRET')
  ]);

  return { cloudName, apiKey, apiSecret };
}

export async function getEmailConfig(): Promise<{
  host: string | null;
  port: string | null;
  user: string | null;
  pass: string | null;
}> {
  const [host, port, user, pass] = await Promise.all([
    getSetting('smtp_host', 'SMTP_HOST'),
    getSetting('smtp_port', 'SMTP_PORT'),
    getSetting('smtp_user', 'SMTP_USER'),
    getSetting('smtp_pass', 'SMTP_PASS')
  ]);

  return { host, port, user, pass };
}

export async function getVonageConfig(): Promise<{
  apiKey: string | null;
  apiSecret: string | null;
}> {
  const [apiKey, apiSecret] = await Promise.all([
    getSetting('vonage_api_key', 'VONAGE_API_KEY'),
    getSetting('vonage_api_secret', 'VONAGE_API_SECRET')
  ]);

  return { apiKey, apiSecret };
}

/**
 * Resolve secret key - supports ENV: prefix for environment variables
 */
function resolveSecretKey(secretKey: string | null | undefined): string | null {
  if (!secretKey) return null;
  if (secretKey.startsWith('ENV:')) {
    const envVar = secretKey.substring(4);
    return process.env[envVar] || null;
  }
  return secretKey;
}

export async function getPayPalConfig(): Promise<{
  clientId: string | null;
  clientSecret: string | null;
  environment: string | null;
}> {
  try {
    // First try to get from payment_gateways table (admin dashboard)
    const { storage } = await import('../storage');
    const paypalGateway = await storage.getPaymentGateway('paypal');
    
    if (paypalGateway && paypalGateway.isEnabled) {
      // Resolve keys (supports ENV: prefix for environment variables)
      const clientId = resolveSecretKey(paypalGateway.publishableKey);
      const clientSecret = resolveSecretKey(paypalGateway.secretKey);
      
      // Environment based on test_mode flag
      const environment = paypalGateway.testMode ? 'sandbox' : 'production';
      
      if (clientId && clientSecret) {
        console.log(`✅ PayPal config loaded from dashboard (${environment} mode)`);
        return { clientId, clientSecret, environment };
      }
    }
  } catch (error) {
    console.warn('Failed to get PayPal config from dashboard:', error);
  }

  // Fallback to adminSettings/environment variables
  const [clientId, clientSecret, environment] = await Promise.all([
    getSetting('paypal_client_id', 'PAYPAL_CLIENT_ID'),
    getSetting('paypal_client_secret', 'PAYPAL_CLIENT_SECRET'),
    getSetting('paypal_environment', 'PAYPAL_ENVIRONMENT')
  ]);

  return { clientId, clientSecret, environment };
}

export async function getCloudflareR2Config(): Promise<{
  accountId: string | null;
  accessKeyId: string | null;
  secretAccessKey: string | null;
  bucketName: string | null;
  publicUrl: string | null;
}> {
  const [accountId, accessKeyId, secretAccessKey, bucketName, publicUrl] = await Promise.all([
    getSetting('cloudflare_account_id', 'CLOUDFLARE_ACCOUNT_ID'),
    getSetting('cloudflare_r2_access_key_id', 'CLOUDFLARE_R2_ACCESS_KEY_ID'),
    getSetting('cloudflare_r2_secret_access_key', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
    getSetting('cloudflare_r2_bucket_name', 'CLOUDFLARE_R2_BUCKET_NAME'),
    getSetting('cloudflare_r2_public_url', 'CLOUDFLARE_R2_PUBLIC_URL')
  ]);

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export async function getSupabaseConfig(): Promise<{
  url: string | null;
  anonKey: string | null;
  serviceRoleKey: string | null;
}> {
  const [url, anonKey, serviceRoleKey] = await Promise.all([
    getSetting('supabase_url', 'SUPABASE_URL'),
    getSetting('supabase_anon_key', 'SUPABASE_ANON_KEY'),
    getSetting('supabase_service_role_key', 'SUPABASE_SERVICE_ROLE_KEY')
  ]);

  return { url, anonKey, serviceRoleKey };
}

export async function getAgoraConfig(): Promise<{
  appId: string | null;
  appCertificate: string | null;
}> {
  const [appId, appCertificate] = await Promise.all([
    getSetting('agora_app_id', 'AGORA_APP_ID'),
    getSetting('agora_app_certificate', 'AGORA_APP_CERTIFICATE')
  ]);

  return { appId, appCertificate };
}

export async function getCertifierConfig(): Promise<{
  apiKey: string | null;
  certificateGroupId: string | null;
  diplomaGroupId: string | null;
}> {
  const [apiKey, certificateGroupId, diplomaGroupId] = await Promise.all([
    getSetting('certifier_api_key', 'CERTIFIER_API_KEY'),
    getSetting('certifier_certificate_group_id', 'CERTIFIER_CERTIFICATE_GROUP_ID'),
    getSetting('certifier_diploma_group_id', 'CERTIFIER_DIPLOMA_GROUP_ID')
  ]);

  return { apiKey, certificateGroupId, diplomaGroupId };
}

export async function getWhatsAppConfig(): Promise<{
  accessToken: string | null;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  webhookVerifyToken: string | null;
}> {
  const [accessToken, phoneNumberId, businessAccountId, webhookVerifyToken] = await Promise.all([
    getSetting('whatsapp_access_token', 'WHATSAPP_ACCESS_TOKEN'),
    getSetting('whatsapp_phone_number_id', 'WHATSAPP_PHONE_NUMBER_ID'),
    getSetting('whatsapp_business_account_id', 'WHATSAPP_BUSINESS_ACCOUNT_ID'),
    getSetting('whatsapp_webhook_verify_token', 'WHATSAPP_WEBHOOK_VERIFY_TOKEN')
  ]);

  return { accessToken, phoneNumberId, businessAccountId, webhookVerifyToken };
}

export async function getAnthropicKey(): Promise<string | null> {
  return getSetting('anthropic_api_key', 'ANTHROPIC_API_KEY');
}

export async function getSessionSecret(): Promise<string | null> {
  return getSetting('session_secret', 'SESSION_SECRET');
}
