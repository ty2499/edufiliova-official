import axios from 'axios';
import { getCertifierConfig } from './settings';

const CERTIFIER_API_BASE = 'https://api.certifier.io/v1';
const CERTIFIER_VERSION = '2022-10-26';

interface CertifierRecipient {
  name: string;
  email: string;
}

interface CertifierCredentialData {
  groupId: string;
  recipient: CertifierRecipient;
  customAttributes?: Record<string, any>;
  issueDate?: string;
  expiryDate?: string;
}

interface CertifierCredentialResponse {
  id: string;
  publicId?: string;
  status: string;
  certificateUrl?: string;
  verificationUrl?: string;
  recipient: CertifierRecipient;
  customAttributes?: Record<string, any>;
}

let cachedCertifierApiKey: string | null = null;
let certifierInitialized = false;

async function initializeCertifierConfig(): Promise<string | null> {
  if (certifierInitialized) return cachedCertifierApiKey;
  
  const config = await getCertifierConfig();
  cachedCertifierApiKey = config.apiKey;
  certifierInitialized = true;
  
  if (cachedCertifierApiKey) {
    console.log('✅ Certifier API configured');
  } else {
    console.log('⚠️ Certifier API key not found in database or environment');
  }
  
  return cachedCertifierApiKey;
}

export class CertifierAPI {
  private apiKey: string | null;
  private headers: Record<string, string>;
  private initialized: boolean = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
    this.headers = {};
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  private setApiKey(key: string): void {
    this.apiKey = key;
    this.headers = {
      'Authorization': `Bearer ${key}`,
      'Certifier-Version': CERTIFIER_VERSION,
      'Content-Type': 'application/json',
    };
    this.initialized = true;
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized && this.apiKey) return;
    
    const apiKey = await initializeCertifierConfig();
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new Error('Certifier API key is required. Please add it in Admin Dashboard or set CERTIFIER_API_KEY environment variable.');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async createIssueAndSendCredential(data: CertifierCredentialData): Promise<CertifierCredentialResponse> {
    this.ensureApiKey();
    try {
      const response = await axios.post(
        `${CERTIFIER_API_BASE}/credentials/create-issue-send`,
        data,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Certifier API Error:', error.response?.data || error.message);
      throw new Error(`Failed to create certificate: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async createCredential(data: CertifierCredentialData): Promise<CertifierCredentialResponse> {
    this.ensureApiKey();
    try {
      const response = await axios.post(
        `${CERTIFIER_API_BASE}/credentials`,
        data,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Certifier API Error:', error.response?.data || error.message);
      throw new Error(`Failed to create credential: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async issueCredential(credentialId: string): Promise<CertifierCredentialResponse> {
    this.ensureApiKey();
    try {
      const response = await axios.post(
        `${CERTIFIER_API_BASE}/credentials/${credentialId}/issue`,
        {},
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Certifier API Error:', error.response?.data || error.message);
      throw new Error(`Failed to issue credential: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async sendCredential(credentialId: string): Promise<CertifierCredentialResponse> {
    this.ensureApiKey();
    try {
      const response = await axios.post(
        `${CERTIFIER_API_BASE}/credentials/${credentialId}/send`,
        {},
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Certifier API Error:', error.response?.data || error.message);
      throw new Error(`Failed to send credential: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getCredential(credentialId: string): Promise<CertifierCredentialResponse> {
    this.ensureApiKey();
    try {
      const response = await axios.get(
        `${CERTIFIER_API_BASE}/credentials/${credentialId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Certifier API Error:', error.response?.data || error.message);
      throw new Error(`Failed to get credential: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async listDesigns(): Promise<any[]> {
    this.ensureApiKey();
    try {
      const response = await axios.get(
        `${CERTIFIER_API_BASE}/designs`,
        { headers: this.headers }
      );
      return response.data.designs || [];
    } catch (error: any) {
      console.error('Certifier API Error:', error.response?.data || error.message);
      throw new Error(`Failed to list designs: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getWorkspace(): Promise<any> {
    this.ensureApiKey();
    try {
      const response = await axios.get(
        `${CERTIFIER_API_BASE}/workspace`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Certifier API Error:', error.response?.data || error.message);
      throw new Error(`Failed to get workspace: ${error.response?.data?.error?.message || error.message}`);
    }
  }


  getDigitalWalletUrl(publicId: string): string {
    return `https://verify.certifier.me/verify/${publicId}`;
  }
}

export const certifierAPI = new CertifierAPI();
