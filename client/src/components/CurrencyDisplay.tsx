import { useEffect, useState } from 'react';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
  MXN: '$',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  NOK: 'kr',
  SEK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RUB: '₽',
  ZAR: 'R',
  TRY: '₺',
  THB: '฿',
  NZD: 'NZ$',
  ILS: '₪',
  AED: 'د.إ',
  SAR: 'ر.س',
  EGP: '£',
  NGN: '₦',
  MAD: 'د.م.',
  TND: 'د.ت',
  KES: 'KSh',
  GHS: '₵',
  UGX: 'USh',
  ZWL: 'Z$',
};

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.00,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  INR: 74.5,
  BRL: 5.2,
  MXN: 20.1,
  KRW: 1180.0,
  SGD: 1.35,
  HKD: 7.8,
  NOK: 8.6,
  SEK: 8.9,
  DKK: 6.4,
  PLN: 3.9,
  CZK: 22.0,
  HUF: 298.0,
  RUB: 74.0,
  ZAR: 14.8,
  TRY: 8.5,
  THB: 31.5,
  NZD: 1.42,
  ILS: 3.3,
  AED: 3.67,
  SAR: 3.75,
  EGP: 15.7,
  NGN: 411.0,
  MAD: 8.9,
  TND: 2.8,
  KES: 108.0,
  GHS: 5.8,
  UGX: 3550.0,
  ZWL: 322.0,
};

export default function CurrencyDisplay({ amount, currency = 'USD', className = '' }: CurrencyDisplayProps) {
  const [userCurrency, setUserCurrency] = useState('USD');
  const [convertedAmount, setConvertedAmount] = useState(amount);

  useEffect(() => {
    // Try to detect user's currency from their location
    const detectCurrency = async () => {
      try {
        // Try to get user's locale first
        const locale = navigator.language || 'en-US';
        const regions: Record<string, string> = {
          'en-US': 'USD',
          'en-GB': 'GBP',
          'en-CA': 'CAD',
          'en-AU': 'AUD',
          'de': 'EUR',
          'fr': 'EUR',
          'es': 'EUR',
          'it': 'EUR',
          'pt-BR': 'BRL',
          'ja': 'JPY',
          'ko': 'KRW',
          'zh': 'CNY',
          'hi': 'INR',
          'ar': 'SAR',
          'th': 'THB',
          'tr': 'TRY',
          'pl': 'PLN',
          'cs': 'CZK',
          'hu': 'HUF',
          'ru': 'RUB',
          'sv': 'SEK',
          'no': 'NOK',
          'da': 'DKK',
          'nl': 'EUR',
          'fi': 'EUR',
          'he': 'ILS',
          'id': 'USD', // Default for Indonesia
          'ms': 'USD', // Default for Malaysia
          'vi': 'USD', // Default for Vietnam
          'tl': 'USD', // Default for Philippines
        };

        const detectedCurrency = regions[locale] || regions[locale.split('-')[0]] || 'USD';
        setUserCurrency(detectedCurrency);
      } catch (error) {
        console.log('Currency detection failed, using USD');
        setUserCurrency('USD');
      }
    };

    detectCurrency();
  }, []);

  useEffect(() => {
    if (currency === userCurrency) {
      setConvertedAmount(amount);
    } else {
      // Convert from USD (base currency) to user currency
      const rate = EXCHANGE_RATES[userCurrency] || 1;
      setConvertedAmount(amount * rate);
    }
  }, [amount, currency, userCurrency]);

  const formatCurrency = (value: number, curr: string) => {
    const symbol = CURRENCY_SYMBOLS[curr] || curr;
    
    // Format based on currency
    if (curr === 'JPY' || curr === 'KRW' || curr === 'HUF' || curr === 'UGX') {
      // No decimal places for these currencies
      return `${symbol}${Math.round(value).toLocaleString()}`;
    } else {
      return `${symbol}${value.toFixed(2)}`;
    }
  };

  return (
    <span className="text-[29px]">
      {formatCurrency(convertedAmount, userCurrency)}
      {userCurrency !== 'USD' && (
        <span className={`text-xs ml-1 ${className?.includes('text-white') ? 'text-white opacity-75' : 'text-gray-500'}`}>
          (≈ ${amount.toFixed(2)} USD)
        </span>
      )}
    </span>
  );
}
