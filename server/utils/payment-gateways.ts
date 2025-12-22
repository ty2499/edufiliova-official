import Stripe from 'stripe';
import { storage } from '../storage.js';
import { getUncachableStripeClient, getStripePublishableKey as getConnectorPublishableKey, getStripeSecretKey } from '../stripeClient.js';

// Helper function to clean API keys - removes newlines, tabs, spaces, and invisible chars
function cleanApiKey(key: string): string {
  return key.replace(/[\r\n\t\s\u00A0\u2000-\u200B\uFEFF]/g, '');
}

// Cache for payment gateway instances
let stripeInstance: Stripe | null = null;
let lastStripeUpdate: Date | null = null;
const CACHE_TTL = 60000; // 1 minute cache

// Cache for Replit connector credentials
let connectorPublishableKeyCache: string | null = null;
let connectorKeyLastUpdate: Date | null = null;

/**
 * Get the primary payment gateway from admin settings
 */
export async function getPrimaryPaymentGateway() {
  try {
    const gateway = await storage.getPrimaryPaymentGateway();
    return gateway;
  } catch (error) {
    console.error('Error fetching primary payment gateway:', error);
    return null;
  }
}

/**
 * Get a specific payment gateway by ID
 */
export async function getPaymentGateway(gatewayId: string) {
  try {
    const gateway = await storage.getPaymentGateway(gatewayId);
    return gateway;
  } catch (error) {
    console.error(`Error fetching payment gateway ${gatewayId}:`, error);
    return null;
  }
}

/**
 * Get Stripe instance - prioritizes Replit connector, then admin settings, then env vars
 */
export async function getStripeInstance(): Promise<Stripe | null> {
  try {
    // Check cache
    if (stripeInstance && lastStripeUpdate) {
      const cacheAge = Date.now() - lastStripeUpdate.getTime();
      if (cacheAge < CACHE_TTL) {
        return stripeInstance;
      }
    }

    // First try Replit Stripe connector (new integration)
    try {
      const connectorClient = await getUncachableStripeClient();
      if (connectorClient) {
        console.log('✅ Using Stripe with Replit connector credentials');
        stripeInstance = connectorClient;
        lastStripeUpdate = new Date();
        return stripeInstance;
      }
    } catch (connectorError) {
      console.log('ℹ️ Replit Stripe connector not available, trying other sources...');
    }

    // Then try admin settings
    const stripeGateway = await getPaymentGateway('stripe');
    
    if (stripeGateway && stripeGateway.isEnabled && stripeGateway.secretKey) {
      const cleanedSecretKey = cleanApiKey(stripeGateway.secretKey);
      console.log('✅ Using Stripe with admin-configured credentials');
      stripeInstance = new Stripe(cleanedSecretKey, {
        apiVersion: '2025-08-27.basil'
      });
      lastStripeUpdate = new Date();
      return stripeInstance;
    }

    // Fallback to environment variable
    if (process.env.STRIPE_SECRET_KEY) {
      const cleanedEnvKey = cleanApiKey(process.env.STRIPE_SECRET_KEY);
      console.log('⚠️ Using Stripe with environment variable (fallback)');
      stripeInstance = new Stripe(cleanedEnvKey, {
        apiVersion: '2025-08-27.basil'
      });
      lastStripeUpdate = new Date();
      return stripeInstance;
    }

    console.warn('⚠️ No Stripe configuration found');
    return null;
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    
    // Final fallback to env variable
    if (process.env.STRIPE_SECRET_KEY) {
      const cleanedEnvKey = cleanApiKey(process.env.STRIPE_SECRET_KEY);
      console.log('⚠️ Using Stripe with environment variable (error fallback)');
      return new Stripe(cleanedEnvKey, {
        apiVersion: '2025-08-27.basil'
      });
    }
    
    return null;
  }
}

/**
 * Get Stripe publishable key for frontend - prioritizes Replit connector
 */
export async function getStripePublishableKey(): Promise<string | null> {
  try {
    // Check cache for connector key
    if (connectorPublishableKeyCache && connectorKeyLastUpdate) {
      const cacheAge = Date.now() - connectorKeyLastUpdate.getTime();
      if (cacheAge < CACHE_TTL) {
        return connectorPublishableKeyCache;
      }
    }

    // First try Replit Stripe connector
    try {
      const connectorKey = await getConnectorPublishableKey();
      if (connectorKey) {
        console.log('✅ Using Stripe publishable key from Replit connector');
        connectorPublishableKeyCache = connectorKey;
        connectorKeyLastUpdate = new Date();
        return connectorKey;
      }
    } catch (connectorError) {
      console.log('ℹ️ Replit Stripe connector publishable key not available, trying other sources...');
    }

    // Then try admin settings
    const stripeGateway = await getPaymentGateway('stripe');
    
    if (stripeGateway && stripeGateway.isEnabled && stripeGateway.publishableKey) {
      return stripeGateway.publishableKey;
    }

    // Fallback to environment variable
    return process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLIC_KEY || null;
  } catch (error) {
    console.error('Error getting Stripe publishable key:', error);
    return process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLIC_KEY || null;
  }
}

/**
 * Get payment client instance for a specific gateway
 * Handles Stripe primarily, can be extended for other gateways
 */
export async function getPaymentClientForGateway(gateway: any): Promise<Stripe | null> {
  if (!gateway) return null;
  
  // For Stripe gateway, return Stripe instance
  if (gateway.gatewayId === 'stripe' && gateway.isEnabled && gateway.secretKey) {
    const cleanedSecretKey = cleanApiKey(gateway.secretKey);
    return new Stripe(cleanedSecretKey, {
      apiVersion: '2025-08-27.basil'
    });
  }
  
  // For other gateways, return null (they use different client libraries)
  console.log(`⚠️ Payment client for gateway '${gateway.gatewayId}' not yet implemented, falling back to primary`);
  return null;
}

/**
 * Get the actual payment client instance for the primary gateway
 * This is the main function to use for payment processing
 */
export async function getPrimaryPaymentClient(): Promise<Stripe | null> {
  try {
    const primaryGateway = await getPrimaryPaymentGateway();
    if (!primaryGateway) {
      console.warn('⚠️ No primary payment gateway configured');
      // Fallback to Stripe instance (for backwards compatibility)
      return await getStripeInstance();
    }
    
    const client = await getPaymentClientForGateway(primaryGateway);
    // If gateway client is null (unsupported gateway), fall back to Stripe
    if (!client) {
      console.log('ℹ️ Falling back to Stripe for payment processing');
      return await getStripeInstance();
    }
    return client;
  } catch (error) {
    console.error('Error getting primary payment client:', error);
    // Final fallback to Stripe
    return await getStripeInstance();
  }
}

/**
 * Invalidate the payment gateway cache
 * Call this after updating payment gateway settings
 */
export function invalidatePaymentGatewayCache() {
  stripeInstance = null;
  lastStripeUpdate = null;
  console.log('✅ Payment gateway cache invalidated');
}

/**
 * Get all enabled payment gateways
 */
export async function getEnabledPaymentGateways() {
  try {
    const gateways = await storage.getPaymentGateways(true);
    return gateways;
  } catch (error) {
    console.error('Error fetching enabled payment gateways:', error);
    return [];
  }
}
