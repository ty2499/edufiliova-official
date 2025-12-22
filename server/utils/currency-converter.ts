/**
 * Currency Conversion Utility
 * Provides real-time currency conversion using exchange rates API
 */

interface ExchangeRates {
  base: string;
  rates: { [currency: string]: number };
  timestamp?: number;
}

// Cache exchange rates for 1 hour to reduce API calls
let ratesCache: ExchangeRates | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Country code to currency mapping
 */
export const COUNTRY_TO_CURRENCY: { [key: string]: string } = {
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'EU': 'EUR', 'DE': 'EUR', 'FR': 'EUR', 'ES': 'EUR', 'IT': 'EUR',
  'AU': 'AUD', 'NZ': 'NZD', 'JP': 'JPY', 'CN': 'CNY', 'IN': 'INR', 'BR': 'BRL', 'MX': 'MXN',
  'ZA': 'ZAR', 'NG': 'NGN', 'KE': 'KES', 'GH': 'GHS', 'EG': 'EGP', 'MA': 'MAD',
  'RU': 'RUB', 'KR': 'KRW', 'TH': 'THB', 'VN': 'VND', 'ID': 'IDR', 'MY': 'MYR', 'PH': 'PHP', 'SG': 'SGD',
  'AR': 'ARS', 'CL': 'CLP', 'CO': 'COP', 'PE': 'PEN', 'UY': 'UYU', 'VE': 'VES',
  'TR': 'TRY', 'SA': 'SAR', 'AE': 'AED', 'IL': 'ILS', 'JO': 'JOD', 'LB': 'LBP',
  'PL': 'PLN', 'CZ': 'CZK', 'HU': 'HUF', 'RO': 'RON', 'BG': 'BGN', 'HR': 'HRK',
  'NO': 'NOK', 'SE': 'SEK', 'DK': 'DKK', 'FI': 'EUR', 'IS': 'ISK',
  'CH': 'CHF', 'AT': 'EUR', 'BE': 'EUR', 'NL': 'EUR', 'LU': 'EUR', 'IE': 'EUR', 'PT': 'EUR',
  'ZW': 'USD' // Zimbabwe uses USD
};

/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS: { [key: string]: string } = {
  'USD': '$', 'CAD': 'C$', 'GBP': '£', 'EUR': '€', 'AUD': 'A$', 'NZD': 'NZ$',
  'JPY': '¥', 'CNY': '¥', 'INR': '₹', 'BRL': 'R$', 'MXN': '$', 'ZAR': 'R',
  'NGN': '₦', 'KES': 'KSh', 'GHS': 'GH₵', 'EGP': 'E£', 'MAD': 'MAD',
  'RUB': '₽', 'KRW': '₩', 'THB': '฿', 'VND': '₫', 'IDR': 'Rp', 'MYR': 'RM',
  'PHP': '₱', 'SGD': 'S$', 'ARS': '$', 'CLP': '$', 'COP': '$', 'PEN': 'S/',
  'UYU': '$U', 'VES': 'Bs', 'TRY': '₺', 'SAR': '﷼', 'AED': 'د.إ', 'ILS': '₪',
  'JOD': 'JD', 'LBP': 'L£', 'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft', 'RON': 'lei',
  'BGN': 'лв', 'HRK': 'kn', 'NOK': 'kr', 'SEK': 'kr', 'DKK': 'kr', 'ISK': 'kr',
  'CHF': 'CHF'
};

/**
 * Fetch latest exchange rates from API
 * Uses caching to reduce API calls
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (ratesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return ratesCache;
  }

  try {
    // Fetch latest rates from free API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('Exchange rate API failed');
    }

    const data = await response.json();
    
    ratesCache = {
      base: 'USD',
      rates: data.rates,
      timestamp: now
    };
    cacheTimestamp = now;

    console.log('✅ Exchange rates fetched and cached:', Object.keys(data.rates).length, 'currencies');
    
    return ratesCache;
  } catch (error) {
    console.error('❌ Failed to fetch exchange rates:', error);
    
    // Return fallback rates if API fails
    if (ratesCache) {
      console.log('⚠️ Using stale exchange rate cache');
      return ratesCache;
    }

    // Ultimate fallback: return 1:1 rates
    return {
      base: 'USD',
      rates: { USD: 1 }
    };
  }
}

/**
 * Convert amount from USD to target currency
 */
export async function convertFromUSD(amountUSD: number, targetCurrency: string): Promise<number> {
  if (targetCurrency.toUpperCase() === 'USD') {
    return amountUSD;
  }

  try {
    const rates = await getExchangeRates();
    const rate = rates.rates[targetCurrency.toUpperCase()];
    
    if (!rate) {
      console.warn(`⚠️ No exchange rate found for ${targetCurrency}, using USD`);
      return amountUSD;
    }

    const converted = amountUSD * rate;
    return Math.round(converted * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amountUSD;
  }
}

/**
 * Convert amount from source currency to USD
 */
export async function convertToUSD(amount: number, sourceCurrency: string): Promise<number> {
  if (sourceCurrency.toUpperCase() === 'USD') {
    return amount;
  }

  try {
    const rates = await getExchangeRates();
    const rate = rates.rates[sourceCurrency.toUpperCase()];
    
    if (!rate) {
      console.warn(`⚠️ No exchange rate found for ${sourceCurrency}, using amount as USD`);
      return amount;
    }

    const usdAmount = amount / rate;
    return Math.round(usdAmount * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount;
  }
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
}

/**
 * Get currency code for a country
 */
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || 'USD';
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toFixed(2);
  
  // For some currencies, symbol goes after the amount
  const symbolAfter = ['EUR'];
  
  if (symbolAfter.includes(currency.toUpperCase())) {
    return `${formatted} ${symbol}`;
  }
  
  return `${symbol}${formatted}`;
}
