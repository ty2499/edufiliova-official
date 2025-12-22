import { db } from '../db';
import { adminSettings } from '@shared/schema';
import { decryptValue } from './api-keys';
import { eq, sql } from 'drizzle-orm';

// Essential keys that MUST be in environment variables (not database)
// These are needed before database connection or are platform-specific
const ESSENTIAL_ENV_KEYS = [
  'DATABASE_URL',           // Required to connect to database
  'SESSION_SECRET',         // Required for encryption before DB is available
  'NODE_ENV',               // Runtime environment
  'PORT',                   // Server port
  'REPL_IDENTITY',          // Replit platform identity
];

export async function loadApiKeysToEnv(): Promise<void> {
  console.log('🔑 Loading API keys from database...');
  
  try {
    const settings = await db.select().from(adminSettings);
    let loadedCount = 0;
    
    for (const setting of settings) {
      if (setting.settingValue && setting.isActive) {
        const envKey = setting.settingKey.toUpperCase();
        
        // Database values OVERRIDE environment variables (except essential keys)
        // This ensures database is the source of truth for API keys
        if (!ESSENTIAL_ENV_KEYS.includes(envKey)) {
          const value = setting.isEncrypted ? decryptValue(setting.settingValue) : setting.settingValue;
          process.env[envKey] = value;
          loadedCount++;
        }
      }
    }
    
    console.log(`✅ Loaded ${loadedCount} API keys from database`);
    console.log(`📋 Essential env-only keys: ${ESSENTIAL_ENV_KEYS.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Failed to load API keys from database:', error);
  }
}

export async function getConfigValue(key: string, fallbackEnvVar?: string): Promise<string | null> {
  const upperKey = key.toUpperCase();
  
  // Essential keys always come from environment (needed before/without database)
  if (ESSENTIAL_ENV_KEYS.includes(upperKey)) {
    return process.env[upperKey] || null;
  }
  
  // For all other keys: DATABASE FIRST, then fallback to env
  try {
    const [setting] = await db.select().from(adminSettings)
      .where(sql`lower(${adminSettings.settingKey}) = ${key.toLowerCase()}`)
      .limit(1);
    
    if (setting?.settingValue && setting.isActive) {
      return setting.isEncrypted ? decryptValue(setting.settingValue) : setting.settingValue;
    }
  } catch (error) {
    console.log(`Config lookup failed for ${key}, falling back to env`);
  }
  
  // Fallback to environment variable only if not in database
  if (process.env[upperKey]) {
    return process.env[upperKey] || null;
  }
  
  if (fallbackEnvVar && process.env[fallbackEnvVar]) {
    return process.env[fallbackEnvVar] || null;
  }
  
  return null;
}

// Helper to check if a key should come from env or database
export function isEssentialEnvKey(key: string): boolean {
  return ESSENTIAL_ENV_KEYS.includes(key.toUpperCase());
}
