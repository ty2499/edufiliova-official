import OpenAI from 'openai';
import { getOpenAIKey } from './utils/settings';

let openaiClient: OpenAI | null = null;
let openaiConfigured = false;

async function initializeOpenAI(): Promise<OpenAI | null> {
  if (openaiClient) {
    return openaiClient;
  }
  
  const apiKey = await getOpenAIKey();
  
  if (!apiKey) {
    console.warn('⚠️ OpenAI API key not found in database or environment. AI features will be disabled.');
    return null;
  }
  
  openaiClient = new OpenAI({ apiKey });
  openaiConfigured = true;
  console.log('✅ OpenAI client initialized');
  return openaiClient;
}

export async function getOpenAIClient(): Promise<OpenAI | null> {
  return initializeOpenAI();
}

export function isOpenAIConfigured(): boolean {
  return openaiConfigured;
}

// Legacy export for backwards compatibility - initialize lazily
const openai = new Proxy({} as OpenAI, {
  get: (_, prop) => {
    if (!openaiClient) {
      throw new Error('OpenAI not initialized. Use getOpenAIClient() instead.');
    }
    return (openaiClient as any)[prop];
  }
});

export { openai };