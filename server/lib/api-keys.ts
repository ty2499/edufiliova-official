import { db } from '../db';
import { adminSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

const apiKeyCache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const ENCRYPTION_KEY = process.env.SESSION_SECRET || 'edufiliova-default-encryption-key-2024';
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

export function encryptValue(value: string): string {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptValue(encryptedValue: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedValue.split(':');
    if (!ivHex || !authTagHex || !encrypted) {
      return encryptedValue;
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return encryptedValue;
  }
}

export async function getApiKey(key: string, fallbackEnvVar?: string): Promise<string | null> {
  const cached = apiKeyCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const [setting] = await db.select().from(adminSettings)
      .where(eq(adminSettings.settingKey, key))
      .limit(1);
    
    if (setting?.settingValue && setting.isActive) {
      const decryptedValue = setting.isEncrypted ? decryptValue(setting.settingValue) : setting.settingValue;
      apiKeyCache.set(key, { value: decryptedValue, expiresAt: Date.now() + CACHE_TTL });
      return decryptedValue;
    }
  } catch (error) {
    console.log(`DB lookup failed for ${key}, trying env fallback`);
  }

  if (fallbackEnvVar && process.env[fallbackEnvVar]) {
    return process.env[fallbackEnvVar] || null;
  }

  return null;
}

export async function setApiKey(
  key: string, 
  value: string, 
  category: string, 
  description?: string, 
  updatedBy?: string,
  isSensitive: boolean = false
): Promise<boolean> {
  try {
    const valueToStore = isSensitive ? encryptValue(value) : value;
    
    const existing = await db.select().from(adminSettings)
      .where(eq(adminSettings.settingKey, key))
      .limit(1);

    if (existing.length > 0) {
      await db.update(adminSettings)
        .set({ 
          settingValue: valueToStore, 
          category, 
          description, 
          updatedBy,
          isEncrypted: isSensitive,
          isActive: true,
          updatedAt: new Date() 
        })
        .where(eq(adminSettings.settingKey, key));
    } else {
      await db.insert(adminSettings).values({
        settingKey: key,
        settingValue: valueToStore,
        category,
        description,
        isEncrypted: isSensitive,
        isActive: true,
        updatedBy,
      });
    }

    apiKeyCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
    return true;
  } catch (error) {
    console.error(`Failed to set API key ${key}:`, error);
    return false;
  }
}

export async function getAllApiKeys(category?: string): Promise<Array<{ 
  key: string; 
  category: string; 
  description: string | null; 
  isActive: boolean; 
  hasValue: boolean;
  isEncrypted: boolean;
}>> {
  try {
    const results = await db.select({
      key: adminSettings.settingKey,
      category: adminSettings.category,
      description: adminSettings.description,
      isActive: adminSettings.isActive,
      value: adminSettings.settingValue,
      isEncrypted: adminSettings.isEncrypted,
    }).from(adminSettings);
    
    return results
      .filter(r => !category || r.category === category)
      .map(r => ({
        key: r.key,
        category: r.category,
        description: r.description,
        isActive: r.isActive ?? false,
        hasValue: !!r.value,
        isEncrypted: r.isEncrypted ?? false,
      }));
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return [];
  }
}

export async function deleteApiKey(key: string): Promise<boolean> {
  try {
    await db.delete(adminSettings).where(eq(adminSettings.settingKey, key));
    apiKeyCache.delete(key);
    return true;
  } catch (error) {
    console.error(`Failed to delete API key ${key}:`, error);
    return false;
  }
}

export async function toggleApiKeyStatus(key: string, isActive: boolean): Promise<boolean> {
  try {
    await db.update(adminSettings)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(adminSettings.settingKey, key));
    
    if (!isActive) {
      apiKeyCache.delete(key);
    }
    return true;
  } catch (error) {
    console.error(`Failed to toggle API key ${key}:`, error);
    return false;
  }
}

export function clearApiKeyCache(): void {
  apiKeyCache.clear();
}

export const API_KEY_CATEGORIES = {
  PAYMENT: 'payment',
  EMAIL: 'email',
  SMS: 'sms',
  STORAGE: 'storage',
  AI: 'ai',
  VIDEO: 'video',
  CERTIFICATE: 'certificate',
  MESSAGING: 'messaging',
  AUTH: 'auth',
  GENERAL: 'general',
} as const;

export const ALL_API_KEYS = [
  { key: 'stripe_secret_key', envVar: 'STRIPE_SECRET_KEY', category: 'payment', description: 'Stripe secret key', sensitive: true },
  { key: 'stripe_publishable_key', envVar: 'STRIPE_PUBLISHABLE_KEY', category: 'payment', description: 'Stripe publishable key', sensitive: false },
  { key: 'stripe_webhook_secret', envVar: 'STRIPE_WEBHOOK_SECRET', category: 'payment', description: 'Stripe webhook secret', sensitive: true },
  { key: 'paypal_client_id', envVar: 'PAYPAL_CLIENT_ID', category: 'payment', description: 'PayPal client ID', sensitive: true },
  { key: 'paypal_client_secret', envVar: 'PAYPAL_CLIENT_SECRET', category: 'payment', description: 'PayPal client secret', sensitive: true },
  { key: 'paystack_secret_key', envVar: 'PAYSTACK_SECRET_KEY', category: 'payment', description: 'Paystack secret key', sensitive: true },
  { key: 'dodo_api_key', envVar: 'DODO_API_KEY', category: 'payment', description: 'Dodo Payments API key', sensitive: true },
  
  { key: 'cloudinary_cloud_name', envVar: 'CLOUDINARY_CLOUD_NAME', category: 'storage', description: 'Cloudinary cloud name', sensitive: false },
  { key: 'cloudinary_api_key', envVar: 'CLOUDINARY_API_KEY', category: 'storage', description: 'Cloudinary API key', sensitive: true },
  { key: 'cloudinary_api_secret', envVar: 'CLOUDINARY_API_SECRET', category: 'storage', description: 'Cloudinary API secret', sensitive: true },
  { key: 'cloudflare_r2_access_key_id', envVar: 'CLOUDFLARE_R2_ACCESS_KEY_ID', category: 'storage', description: 'Cloudflare R2 access key', sensitive: true },
  { key: 'cloudflare_r2_secret_access_key', envVar: 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', category: 'storage', description: 'Cloudflare R2 secret key', sensitive: true },
  { key: 'cloudflare_r2_bucket_name', envVar: 'CLOUDFLARE_R2_BUCKET_NAME', category: 'storage', description: 'Cloudflare R2 bucket name', sensitive: false },
  
  { key: 'smtp_host', envVar: 'SMTP_HOST', category: 'email', description: 'SMTP server hostname', sensitive: false },
  { key: 'smtp_port', envVar: 'SMTP_PORT', category: 'email', description: 'SMTP server port', sensitive: false },
  { key: 'smtp_user', envVar: 'SMTP_USER', category: 'email', description: 'SMTP username', sensitive: false },
  { key: 'smtp_pass', envVar: 'SMTP_PASS', category: 'email', description: 'SMTP password', sensitive: true },
  
  { key: 'vonage_api_key', envVar: 'VONAGE_API_KEY', category: 'sms', description: 'Vonage API key', sensitive: true },
  { key: 'vonage_api_secret', envVar: 'VONAGE_API_SECRET', category: 'sms', description: 'Vonage API secret', sensitive: true },
  
  { key: 'whatsapp_access_token', envVar: 'WHATSAPP_ACCESS_TOKEN', category: 'messaging', description: 'WhatsApp Business API token', sensitive: true },
  { key: 'whatsapp_phone_number_id', envVar: 'WHATSAPP_PHONE_NUMBER_ID', category: 'messaging', description: 'WhatsApp phone number ID', sensitive: false },
  { key: 'whatsapp_business_account_id', envVar: 'WHATSAPP_BUSINESS_ACCOUNT_ID', category: 'messaging', description: 'WhatsApp Business account ID', sensitive: false },
  { key: 'whatsapp_app_secret', envVar: 'WHATSAPP_APP_SECRET', category: 'messaging', description: 'WhatsApp app secret', sensitive: true },
  { key: 'whatsapp_webhook_verify_token', envVar: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', category: 'messaging', description: 'WhatsApp webhook verify token', sensitive: true },
  
  { key: 'openai_api_key', envVar: 'OPENAI_API_KEY', category: 'ai', description: 'OpenAI API key', sensitive: true },
  { key: 'anthropic_api_key', envVar: 'ANTHROPIC_API_KEY', category: 'ai', description: 'Anthropic Claude API key', sensitive: true },
  
  { key: 'agora_app_id', envVar: 'AGORA_APP_ID', category: 'video', description: 'Agora app ID', sensitive: false },
  { key: 'agora_app_certificate', envVar: 'AGORA_APP_CERTIFICATE', category: 'video', description: 'Agora app certificate', sensitive: true },
  
  { key: 'certifier_api_key', envVar: 'CERTIFIER_API_KEY', category: 'certificate', description: 'Certifier API key', sensitive: true },
  { key: 'certifier_certificate_group_id', envVar: 'CERTIFIER_CERTIFICATE_GROUP_ID', category: 'certificate', description: 'Certifier certificate group ID', sensitive: false },
  { key: 'certifier_diploma_group_id', envVar: 'CERTIFIER_DIPLOMA_GROUP_ID', category: 'certificate', description: 'Certifier diploma group ID', sensitive: false },
  
  { key: 'supabase_url', envVar: 'SUPABASE_URL', category: 'auth', description: 'Supabase project URL', sensitive: false },
  { key: 'facebook_app_id', envVar: 'FACEBOOK_APP_ID', category: 'auth', description: 'Facebook App ID', sensitive: false },
  { key: 'facebook_app_secret', envVar: 'FACEBOOK_APP_SECRET', category: 'auth', description: 'Facebook App Secret', sensitive: true },
  { key: 'supabase_anon_key', envVar: 'SUPABASE_ANON_KEY', category: 'auth', description: 'Supabase anon key', sensitive: true },
  { key: 'supabase_service_key', envVar: 'SUPABASE_SERVICE_KEY', category: 'auth', description: 'Supabase service key', sensitive: true },
  
  { key: 'github_token', envVar: 'GITHUB_TOKEN', category: 'general', description: 'GitHub access token', sensitive: true },
] as const;
