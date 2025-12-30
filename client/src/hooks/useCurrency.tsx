import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Currency {
  code: string;
  symbol: string;
  rate: number;
}

export function useCurrency() {
  const { profile } = useAuth();
  const [userCurrency, setUserCurrency] = useState<Currency>({ code: 'USD', symbol: '$', rate: 1.0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.country) {
      const countryCode = getCountryCodeFromName(profile.country);
      fetchCurrencyData(countryCode);
    }
  }, [profile?.country]);

  const fetchCurrencyData = async (countryCode: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/currency/${countryCode}`);
      const data = await response.json();
      
      if (data.success) {
        setUserCurrency({
          code: data.currency,
          symbol: data.symbol,
          rate: data.rate
        });
      }
    } catch (error) {
      console.error('Currency fetch error:', error);
      // Fallback to USD
      setUserCurrency({ code: 'USD', symbol: '$', rate: 1.0 });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amountUSD: number) => {
    if (loading) return '$--';
    
    const convertedAmount = amountUSD * userCurrency.rate;
    const formattedAmount = convertedAmount.toFixed(2);
    
    return `${userCurrency.symbol}${formattedAmount}`;
  };

  const convertPrice = (amountUSD: number) => {
    return amountUSD * userCurrency.rate;
  };

  return {
    userCurrency,
    formatPrice,
    convertPrice,
    loading,
  };
}

// Helper function to map country names to codes
// In a real app, this would be more comprehensive and likely come from the database
function getCountryCodeFromName(countryName: string): string {
  const countryMap: Record<string, string> = {
    'United States': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'Germany': 'DE',
    'France': 'FR',
    'Spain': 'ES',
    'Italy': 'IT',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Austria': 'AT',
    'Portugal': 'PT',
    'Ireland': 'IE',
    'Greece': 'GR',
    'Finland': 'FI',
    'Luxembourg': 'LU',
    'Malta': 'MT',
    'Cyprus': 'CY',
    'Estonia': 'EE',
    'Latvia': 'LV',
    'Lithuania': 'LT',
    'Slovakia': 'SK',
    'Slovenia': 'SI',
    'Switzerland': 'CH',
    'Norway': 'NO',
    'Sweden': 'SE',
    'Denmark': 'DK',
    'Iceland': 'IS',
    'Poland': 'PL',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Croatia': 'HR',
    'Serbia': 'RS',
    'Bosnia and Herzegovina': 'BA',
    'North Macedonia': 'MK',
    'Albania': 'AL',
    'Montenegro': 'ME',
    'Kosovo': 'XK',
    'Moldova': 'MD',
    'Ukraine': 'UA',
    'Belarus': 'BY',
    'Russia': 'RU',
    'China': 'CN',
    'Japan': 'JP',
    'South Korea': 'KR',
    'India': 'IN',
    'Indonesia': 'ID',
    'Malaysia': 'MY',
    'Thailand': 'TH',
    'Singapore': 'SG',
    'Philippines': 'PH',
    'Vietnam': 'VN',
    'Bangladesh': 'BD',
    'Pakistan': 'PK',
    'Sri Lanka': 'LK',
    'Myanmar': 'MM',
    'Cambodia': 'KH',
    'Laos': 'LA',
    'Brunei': 'BN',
    'Mongolia': 'MN',
    'Nepal': 'NP',
    'Afghanistan': 'AF',
    'Iran': 'IR',
    'Iraq': 'IQ',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE',
    'Qatar': 'QA',
    'Kuwait': 'KW',
    'Bahrain': 'BH',
    'Oman': 'OM',
    'Jordan': 'JO',
    'Lebanon': 'LB',
    'Syria': 'SY',
    'Yemen': 'YE',
    'Turkey': 'TR',
    'Israel': 'IL',
    'Armenia': 'AM',
    'Azerbaijan': 'AZ',
    'Georgia': 'GE',
    'Kazakhstan': 'KZ',
    'Kyrgyzstan': 'KG',
    'Tajikistan': 'TJ',
    'Turkmenistan': 'TM',
    'Uzbekistan': 'UZ',
    'Australia': 'AU',
    'New Zealand': 'NZ',
    'Fiji': 'FJ',
    'Papua New Guinea': 'PG',
    'Solomon Islands': 'SB',
    'Vanuatu': 'VU',
    'Samoa': 'WS',
    'Tonga': 'TO',
    'Palau': 'PW',
    'Micronesia': 'FM',
    'Marshall Islands': 'MH',
    'Kiribati': 'KI',
    'Nauru': 'NR',
    'Tuvalu': 'TV',
    'Brazil': 'BR',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Peru': 'PE',
    'Venezuela': 'VE',
    'Uruguay': 'UY',
    'Paraguay': 'PY',
    'Bolivia': 'BO',
    'Ecuador': 'EC',
    'Guyana': 'GY',
    'Suriname': 'SR',
    'Mexico': 'MX',
    'Algeria': 'DZ',
    'Angola': 'AO',
    'Benin': 'BJ',
    'Botswana': 'BW',
    'Burkina Faso': 'BF',
    'Burundi': 'BI',
    'Cape Verde': 'CV',
    'Cameroon': 'CM',
    'Central African Republic': 'CF',
    'Chad': 'TD',
    'Comoros': 'KM',
    'Democratic Republic of Congo': 'CD',
    'Republic of Congo': 'CG',
    'Ivory Coast': 'CI',
    'Djibouti': 'DJ',
    'Egypt': 'EG',
    'Equatorial Guinea': 'GQ',
    'Eritrea': 'ER',
    'Eswatini': 'SZ',
    'Ethiopia': 'ET',
    'Gabon': 'GA',
    'Gambia': 'GM',
    'Ghana': 'GH',
    'Guinea': 'GN',
    'Guinea-Bissau': 'GW',
    'Kenya': 'KE',
    'Lesotho': 'LS',
    'Liberia': 'LR',
    'Libya': 'LY',
    'Madagascar': 'MG',
    'Malawi': 'MW',
    'Mali': 'ML',
    'Mauritania': 'MR',
    'Mauritius': 'MU',
    'Morocco': 'MA',
    'Mozambique': 'MZ',
    'Namibia': 'NA',
    'Niger': 'NE',
    'Nigeria': 'NG',
    'Rwanda': 'RW',
    'São Tomé and Príncipe': 'ST',
    'Senegal': 'SN',
    'Seychelles': 'SC',
    'Sierra Leone': 'SL',
    'Somalia': 'SO',
    'South Africa': 'ZA',
    'South Sudan': 'SS',
    'Sudan': 'SD',
    'Tanzania': 'TZ',
    'Togo': 'TG',
    'Tunisia': 'TN',
    'Uganda': 'UG',
    'Zambia': 'ZM',
    'Zimbabwe': 'ZW',
  };
  
  return countryMap[countryName] || 'US';
}
