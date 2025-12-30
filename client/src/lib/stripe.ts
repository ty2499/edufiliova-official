import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;
let cachedPublishableKey: string | null = null;

async function fetchStripePublishableKey(): Promise<string | null> {
  if (cachedPublishableKey) {
    return cachedPublishableKey;
  }

  try {
    const response = await fetch('/api/payment/stripe/publishable-key');
    const data = await response.json();
    
    if (data.success && data.publishableKey) {
      cachedPublishableKey = data.publishableKey;
      return data.publishableKey;
    }
    
    // Fallback to env variable if API doesn't return key
    if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      cachedPublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      return cachedPublishableKey;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Stripe publishable key:', error);
    // Fallback to env variable
    if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      return import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    }
    return null;
  }
}

export async function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = (async () => {
      const publishableKey = await fetchStripePublishableKey();
      if (publishableKey) {
        console.log('Stripe public key: loaded from API');
        return loadStripe(publishableKey);
      }
      console.warn('Stripe publishable key not available');
      return null;
    })();
  }
  return stripePromise;
}

export function getStripePromiseSync(): Promise<Stripe | null> | null {
  return stripePromise;
}

export async function initializeStripe(): Promise<void> {
  await getStripePromise();
}
