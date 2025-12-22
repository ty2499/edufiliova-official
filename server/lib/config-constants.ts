/**
 * Core Environment Variables (Required - only 5!)
 * These are the ONLY environment variables that should be set
 */
export const CORE_ENV_VARS = {
  DATABASE_URL: 'DATABASE_URL',
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  SESSION_SECRET: 'SESSION_SECRET',
  INITIAL_ADMIN_PASSWORD: 'INITIAL_ADMIN_PASSWORD',
} as const;

/**
 * All Supported Configuration Keys
 * These are loaded from database via adminSettings table
 */
export const DB_CONFIG_KEYS = {
  // Payment
  STRIPE_SECRET_KEY: 'stripe_secret_key',
  STRIPE_PUBLISHABLE_KEY: 'stripe_publishable_key',
  STRIPE_WEBHOOK_SECRET: 'stripe_webhook_secret',
  PAYPAL_CLIENT_ID: 'paypal_client_id',
  PAYPAL_CLIENT_SECRET: 'paypal_client_secret',
  PAYPAL_ENVIRONMENT: 'paypal_environment',
  PAYSTACK_SECRET_KEY: 'paystack_secret_key',
  DODO_PAYMENTS_API_KEY: 'dodo_api_key',
  DODO_WEBHOOK_SECRET: 'dodo_webhook_secret',

  // Email
  SMTP_HOST: 'smtp_host',
  SMTP_PORT: 'smtp_port',
  SMTP_USER: 'smtp_user',
  SMTP_PASS: 'smtp_pass',
  EDUFILIOVA_EMAIL_PASSWORD: 'edufiliova_email_password',

  // SMS & Messaging
  VONAGE_API_KEY: 'vonage_api_key',
  VONAGE_API_SECRET: 'vonage_api_secret',
  WHATSAPP_ACCESS_TOKEN: 'whatsapp_access_token',
  WHATSAPP_APP_SECRET: 'whatsapp_app_secret',
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'whatsapp_webhook_verify_token',
  WHATSAPP_PHONE_NUMBER_ID: 'whatsapp_phone_number_id',
  WHATSAPP_BUSINESS_ACCOUNT_ID: 'whatsapp_business_account_id',

  // Cloud Storage
  CLOUDINARY_CLOUD_NAME: 'cloudinary_cloud_name',
  CLOUDINARY_API_KEY: 'cloudinary_api_key',
  CLOUDINARY_API_SECRET: 'cloudinary_api_secret',
  CLOUDFLARE_ACCOUNT_ID: 'cloudflare_account_id',
  CLOUDFLARE_R2_ACCESS_KEY_ID: 'cloudflare_r2_access_key_id',
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'cloudflare_r2_secret_access_key',
  CLOUDFLARE_R2_BUCKET_NAME: 'cloudflare_r2_bucket_name',
  CLOUDFLARE_R2_PUBLIC_URL: 'cloudflare_r2_public_url',
  SPACESHIP_ENDPOINT: 'spaceship_endpoint',
  SPACESHIP_ACCESS_KEY: 'spaceship_access_key',
  SPACESHIP_SECRET_KEY: 'spaceship_secret_key',
  SPACESHIP_BUCKET_NAME: 'spaceship_bucket_name',

  // Video
  AGORA_APP_ID: 'agora_app_id',
  AGORA_APP_CERTIFICATE: 'agora_app_certificate',

  // AI
  OPENAI_API_KEY: 'openai_api_key',
  ANTHROPIC_API_KEY: 'anthropic_api_key',

  // Version Control
  GITHUB_TOKEN: 'github_token',

  // Replit
  REPLIT_DEV_DOMAIN: 'replit_dev_domain',
  REPLIT_DOMAINS: 'replit_domains',
  REPLIT_DEPLOYMENT: 'replit_deployment',
  REPLIT_CONNECTORS_HOSTNAME: 'replit_connectors_hostname',
  REPL_IDENTITY: 'repl_identity',

  // Application
  BASE_URL: 'base_url',
  FRONTEND_URL: 'frontend_url',
  EDUFILIOVA_WHITE_LOGO_URL: 'edufiliova_white_logo_url',
  FEATURE_LOG_LOCATION: 'feature_log_location',
  USE_DATABASE_STORAGE: 'use_database_storage',
  WEB_REPL_RENEWAL: 'web_repl_renewal',
} as const;

export const SENSITIVE_KEYS = new Set([
  'stripe_secret_key',
  'stripe_webhook_secret',
  'paypal_client_id',
  'paypal_client_secret',
  'paystack_secret_key',
  'dodo_api_key',
  'dodo_webhook_secret',
  'smtp_pass',
  'edufiliova_email_password',
  'vonage_api_key',
  'vonage_api_secret',
  'whatsapp_access_token',
  'whatsapp_app_secret',
  'whatsapp_webhook_verify_token',
  'cloudinary_api_key',
  'cloudinary_api_secret',
  'cloudflare_r2_access_key_id',
  'cloudflare_r2_secret_access_key',
  'spaceship_access_key',
  'spaceship_secret_key',
  'agora_app_certificate',
  'openai_api_key',
  'anthropic_api_key',
  'github_token',
]);

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}
