import axios from 'axios';
import { storage } from '../storage.js';

interface EcoCashConfig {
  apiBaseUrl: string;
  username: string;
  password: string;
  merchantNumber: string;
  merchantCode: string;
  merchantPin: string;
  superMerchantName: string;
  merchantName: string;
  terminalId: string;
  location: string;
  notifyUrl: string;
  currencyCode: string;
  countryCode: string;
  clientCorrelatorPrefix: string;
  description: string;
  onBehalfOf: string;
  paymentRemarks: string;
  referenceCode: string;
  purchaseCategoryCode: string;
  refundRemarks: string;
}

interface ChargeResponse {
  success: boolean;
  transactionId?: string;
  clientCorrelator?: string;
  status?: string;
  message?: string;
  error?: string;
}

interface TransactionStatusResponse {
  success: boolean;
  status?: string;
  transactionId?: string;
  amount?: number;
  subscriberNumber?: string;
  message?: string;
  error?: string;
}

let configCache: EcoCashConfig | null = null;
let lastConfigFetch: Date | null = null;
const CONFIG_CACHE_TTL = 60000;

async function getEcoCashConfig(): Promise<EcoCashConfig | null> {
  try {
    if (configCache && lastConfigFetch && (Date.now() - lastConfigFetch.getTime() < CONFIG_CACHE_TTL)) {
      return configCache;
    }

    const gateway = await storage.getPaymentGateway('ecocash');
    
    if (!gateway || !gateway.isEnabled) {
      console.log('EcoCash gateway is not enabled');
      return null;
    }

    const config: EcoCashConfig = {
      apiBaseUrl: gateway.apiEndpoint || process.env.ECOCASH_API_URL || 'https://api.ecocash.co.zw',
      username: gateway.publishableKey || process.env.ECOCASH_USERNAME || '',
      password: gateway.secretKey || process.env.ECOCASH_PASSWORD || '',
      merchantNumber: gateway.webhookSecret || process.env.ECOCASH_MERCHANT_NUMBER || '',
      merchantCode: process.env.ECOCASH_MERCHANT_CODE || '',
      merchantPin: process.env.ECOCASH_MERCHANT_PIN || '',
      superMerchantName: process.env.ECOCASH_SUPER_MERCHANT_NAME || 'EduFiliova',
      merchantName: process.env.ECOCASH_MERCHANT_NAME || 'EduFiliova',
      terminalId: process.env.ECOCASH_TERMINAL_ID || 'EDUFILIOVA001',
      location: process.env.ECOCASH_LOCATION || 'Online',
      notifyUrl: process.env.ECOCASH_NOTIFY_URL || `${process.env.APP_URL || 'https://edufiliova.com'}/api/ecocash/webhook`,
      currencyCode: 'USD',
      countryCode: 'ZW',
      clientCorrelatorPrefix: 'EDU',
      description: 'EduFiliova Payment',
      onBehalfOf: 'EduFiliova Educational Platform',
      paymentRemarks: 'Course/Product Purchase',
      referenceCode: 'EDUFILIOVA',
      purchaseCategoryCode: 'Online Payment',
      refundRemarks: 'EduFiliova Refund',
    };

    configCache = config;
    lastConfigFetch = new Date();
    return config;
  } catch (error) {
    console.error('Error getting EcoCash config:', error);
    return null;
  }
}

function generateClientCorrelator(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`.toUpperCase().substring(0, 20);
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '263' + cleaned.substring(1);
  } else if (!cleaned.startsWith('263')) {
    cleaned = '263' + cleaned;
  }
  
  return cleaned;
}

async function getAuthToken(config: EcoCashConfig): Promise<string | null> {
  try {
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    
    const response = await axios.post(
      `${config.apiBaseUrl}/auth/token`,
      {
        grant_type: 'client_credentials'
      },
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.access_token || null;
  } catch (error: any) {
    console.error('EcoCash auth error:', error.response?.data || error.message);
    return null;
  }
}

export async function chargeSubscriber(
  subscriberNumber: string,
  amount: number,
  orderId: string,
  description?: string
): Promise<ChargeResponse> {
  try {
    const config = await getEcoCashConfig();
    if (!config) {
      return { success: false, error: 'EcoCash is not configured' };
    }

    const formattedPhone = formatPhoneNumber(subscriberNumber);
    const clientCorrelator = generateClientCorrelator(config.clientCorrelatorPrefix);

    console.log(`📱 EcoCash: Initiating payment for ${formattedPhone}, amount: $${amount}`);

    const token = await getAuthToken(config);
    if (!token) {
      return { success: false, error: 'Failed to authenticate with EcoCash' };
    }

    const paymentPayload = {
      notifyUrl: config.notifyUrl,
      referenceCode: orderId,
      clientCorrelator: clientCorrelator,
      currency: config.currencyCode,
      amount: amount.toFixed(2),
      merchantCode: config.merchantCode,
      merchantPin: config.merchantPin,
      merchantNumber: config.merchantNumber,
      subscriberMsisdn: formattedPhone,
      countryCode: config.countryCode,
      terminalId: config.terminalId,
      location: config.location,
      superMerchantName: config.superMerchantName,
      merchantName: config.merchantName,
      description: description || config.description,
      onBehalfOf: config.onBehalfOf,
      purchaseCategoryCode: config.purchaseCategoryCode,
      metadata: {
        orderId: orderId,
        platform: 'EduFiliova'
      }
    };

    const response = await axios.post(
      `${config.apiBaseUrl}/transactions/amount`,
      paymentPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ EcoCash: Payment initiated, correlator: ${clientCorrelator}`);

    return {
      success: true,
      transactionId: response.data.serverReferenceCode || response.data.transactionId,
      clientCorrelator: clientCorrelator,
      status: response.data.status || 'PENDING',
      message: 'Payment request sent. Please check your phone for EcoCash prompt.'
    };
  } catch (error: any) {
    console.error('❌ EcoCash charge error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Payment failed'
    };
  }
}

export async function checkTransactionStatus(
  subscriberNumber: string,
  clientCorrelator: string
): Promise<TransactionStatusResponse> {
  try {
    const config = await getEcoCashConfig();
    if (!config) {
      return { success: false, error: 'EcoCash is not configured' };
    }

    const formattedPhone = formatPhoneNumber(subscriberNumber);

    const token = await getAuthToken(config);
    if (!token) {
      return { success: false, error: 'Failed to authenticate with EcoCash' };
    }

    const response = await axios.get(
      `${config.apiBaseUrl}/transactions/${formattedPhone}/${clientCorrelator}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const status = response.data.paymentStatus || response.data.status;
    const isSuccess = ['COMPLETED', 'SUCCESSFUL', 'SUCCESS'].includes(status?.toUpperCase());

    return {
      success: isSuccess,
      status: status,
      transactionId: response.data.serverReferenceCode || response.data.transactionId,
      amount: parseFloat(response.data.amount) || 0,
      subscriberNumber: formattedPhone,
      message: isSuccess ? 'Payment completed successfully' : `Payment status: ${status}`
    };
  } catch (error: any) {
    console.error('❌ EcoCash status check error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to check status'
    };
  }
}

export async function refundTransaction(
  subscriberNumber: string,
  transactionId: string,
  amount: number,
  reason?: string
): Promise<ChargeResponse> {
  try {
    const config = await getEcoCashConfig();
    if (!config) {
      return { success: false, error: 'EcoCash is not configured' };
    }

    const formattedPhone = formatPhoneNumber(subscriberNumber);
    const clientCorrelator = generateClientCorrelator(config.clientCorrelatorPrefix);

    const token = await getAuthToken(config);
    if (!token) {
      return { success: false, error: 'Failed to authenticate with EcoCash' };
    }

    const refundPayload = {
      referenceCode: transactionId,
      clientCorrelator: clientCorrelator,
      currency: config.currencyCode,
      amount: amount.toFixed(2),
      merchantCode: config.merchantCode,
      merchantPin: config.merchantPin,
      subscriberMsisdn: formattedPhone,
      remarks: reason || config.refundRemarks
    };

    const response = await axios.post(
      `${config.apiBaseUrl}/transactions/reversal`,
      refundPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ EcoCash: Refund initiated for ${transactionId}`);

    return {
      success: true,
      transactionId: response.data.serverReferenceCode || response.data.transactionId,
      clientCorrelator: clientCorrelator,
      status: response.data.status || 'PENDING',
      message: 'Refund request submitted successfully'
    };
  } catch (error: any) {
    console.error('❌ EcoCash refund error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Refund failed'
    };
  }
}

export async function listTransactions(subscriberNumber: string): Promise<any[]> {
  try {
    const config = await getEcoCashConfig();
    if (!config) {
      return [];
    }

    const formattedPhone = formatPhoneNumber(subscriberNumber);

    const token = await getAuthToken(config);
    if (!token) {
      return [];
    }

    const response = await axios.get(
      `${config.apiBaseUrl}/transactions/${formattedPhone}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.transactions || [];
  } catch (error: any) {
    console.error('❌ EcoCash list transactions error:', error.response?.data || error.message);
    return [];
  }
}

export async function isEcoCashEnabled(): Promise<boolean> {
  const config = await getEcoCashConfig();
  return config !== null;
}

export function invalidateEcoCashCache(): void {
  configCache = null;
  lastConfigFetch = null;
  console.log('✅ EcoCash cache invalidated');
}
