export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate?: number; // Exchange rate to USD
}

export const WORLD_CURRENCIES: Record<string, Currency> = {
  // Africa
  'DZ': { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar', rate: 134.5 },
  'AO': { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza', rate: 825.0 },
  'BJ': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 618.0 },
  'BW': { code: 'BWP', symbol: 'P', name: 'Botswanan Pula', rate: 13.5 },
  'BF': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 618.0 },
  'BI': { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc', rate: 2850.0 },
  'CV': { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo', rate: 104.0 },
  'CM': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', rate: 618.0 },
  'CF': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', rate: 618.0 },
  'TD': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', rate: 618.0 },
  'KM': { code: 'KMF', symbol: 'CF', name: 'Comorian Franc', rate: 463.0 },
  'CD': { code: 'CDF', symbol: 'FC', name: 'Congolese Franc', rate: 2700.0 },
  'CG': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', rate: 618.0 },
  'CI': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 618.0 },
  'DJ': { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc', rate: 177.7 },
  'EG': { code: 'EGP', symbol: '£', name: 'Egyptian Pound', rate: 30.9 },
  'GQ': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', rate: 618.0 },
  'ER': { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa', rate: 15.0 },
  'SZ': { code: 'SZL', symbol: 'L', name: 'Swazi Lilangeni', rate: 18.5 },
  'ET': { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', rate: 115.0 },
  'GA': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', rate: 618.0 },
  'GM': { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi', rate: 67.0 },
  'GH': { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', rate: 12.0 },
  'GN': { code: 'GNF', symbol: 'FG', name: 'Guinean Franc', rate: 8600.0 },
  'GW': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 618.0 },
  'KE': { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 129.0 },
  'LS': { code: 'LSL', symbol: 'L', name: 'Lesotho Loti', rate: 18.5 },
  'LR': { code: 'LRD', symbol: '$', name: 'Liberian Dollar', rate: 190.0 },
  'LY': { code: 'LYD', symbol: 'ل.د', name: 'Libyan Dinar', rate: 4.8 },
  'MG': { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary', rate: 4500.0 },
  'MW': { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha', rate: 1730.0 },
  'ML': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 618.0 },
  'MR': { code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya', rate: 36.5 },
  'MU': { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee', rate: 46.0 },
  'MA': { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', rate: 10.1 },
  'MZ': { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical', rate: 63.8 },
  'NA': { code: 'NAD', symbol: '$', name: 'Namibian Dollar', rate: 18.5 },
  'NE': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 618.0 },
  'NG': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1570.0 },
  'RW': { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', rate: 1320.0 },
  'ST': { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobra', rate: 23.0 },
  'SN': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 618.0 },
  'SC': { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee', rate: 13.5 },
  'SL': { code: 'SLE', symbol: 'Le', name: 'Sierra Leonean Leone', rate: 22500.0 },
  'SO': { code: 'SOS', symbol: 'S', name: 'Somali Shilling', rate: 570.0 },
  'ZA': { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.5 },
  'SS': { code: 'SSP', symbol: '£', name: 'South Sudanese Pound', rate: 130.0 },
  'SD': { code: 'SDG', symbol: 'ج.س.', name: 'Sudanese Pound', rate: 600.0 },
  'TZ': { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', rate: 2500.0 },
  'TG': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', rate: 618.0 },
  'TN': { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', rate: 3.1 },
  'UG': { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', rate: 3750.0 },
  'ZM': { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', rate: 27.0 },
  'ZW': { code: 'ZWL', symbol: '$', name: 'Zimbabwean Dollar', rate: 322.0 },

  // Americas
  'US': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
  'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.35 },
  'MX': { code: 'MXN', symbol: '$', name: 'Mexican Peso', rate: 17.2 },
  'BR': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 5.0 },
  'AR': { code: 'ARS', symbol: '$', name: 'Argentine Peso', rate: 890.0 },
  'CL': { code: 'CLP', symbol: '$', name: 'Chilean Peso', rate: 920.0 },
  'CO': { code: 'COP', symbol: '$', name: 'Colombian Peso', rate: 4200.0 },
  'PE': { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', rate: 3.7 },
  'VE': { code: 'VES', symbol: 'Bs.', name: 'Venezuelan Bolívar', rate: 36.5 },
  'UY': { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso', rate: 39.0 },
  'PY': { code: 'PYG', symbol: '₲', name: 'Paraguayan Guaraní', rate: 7300.0 },
  'BO': { code: 'BOB', symbol: 'Bs', name: 'Bolivian Boliviano', rate: 6.9 },
  'EC': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
  'GY': { code: 'GYD', symbol: '$', name: 'Guyanese Dollar', rate: 209.0 },
  'SR': { code: 'SRD', symbol: '$', name: 'Surinamese Dollar', rate: 36.5 },

  // Europe
  'GB': { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  'DE': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'FR': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'ES': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'IT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'NL': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'BE': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'AT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'PT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'IE': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'GR': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'FI': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'LU': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'MT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'CY': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'EE': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'LV': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'LT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'SK': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'SI': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'CH': { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', rate: 0.88 },
  'NO': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', rate: 10.8 },
  'SE': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rate: 10.4 },
  'DK': { code: 'DKK', symbol: 'kr', name: 'Danish Krone', rate: 6.9 },
  'IS': { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna', rate: 137.0 },
  'PL': { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', rate: 4.0 },
  'CZ': { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', rate: 22.5 },
  'HU': { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', rate: 360.0 },
  'RO': { code: 'RON', symbol: 'lei', name: 'Romanian Leu', rate: 4.6 },
  'BG': { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', rate: 1.8 },
  'HR': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'RS': { code: 'RSD', symbol: 'дин', name: 'Serbian Dinar', rate: 108.0 },
  'BA': { code: 'BAM', symbol: 'KM', name: 'Bosnia and Herzegovina Convertible Mark', rate: 1.8 },
  'MK': { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar', rate: 56.5 },
  'AL': { code: 'ALL', symbol: 'L', name: 'Albanian Lek', rate: 94.0 },
  'ME': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'XK': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  'MD': { code: 'MDL', symbol: 'L', name: 'Moldovan Leu', rate: 17.8 },
  'UA': { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', rate: 37.0 },
  'BY': { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble', rate: 3.3 },
  'RU': { code: 'RUB', symbol: '₽', name: 'Russian Ruble', rate: 90.0 },

  // Asia
  'CN': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.2 },
  'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.0 },
  'KR': { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1320.0 },
  'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.0 },
  'ID': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 15600.0 },
  'MY': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 4.7 },
  'TH': { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 35.5 },
  'SG': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.35 },
  'PH': { code: 'PHP', symbol: '₱', name: 'Philippine Peso', rate: 56.0 },
  'VN': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: 24500.0 },
  'BD': { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 110.0 },
  'PK': { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', rate: 286.0 },
  'LK': { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee', rate: 325.0 },
  'MM': { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat', rate: 2100.0 },
  'KH': { code: 'KHR', symbol: '៛', name: 'Cambodian Riel', rate: 4100.0 },
  'LA': { code: 'LAK', symbol: '₭', name: 'Lao Kip', rate: 20500.0 },
  'BN': { code: 'BND', symbol: 'B$', name: 'Brunei Dollar', rate: 1.35 },
  'MN': { code: 'MNT', symbol: '₮', name: 'Mongolian Tögrög', rate: 3450.0 },
  'NP': { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee', rate: 133.0 },
  'AF': { code: 'AFN', symbol: '؋', name: 'Afghan Afghani', rate: 75.0 },
  'IR': { code: 'IRR', symbol: '﷼', name: 'Iranian Rial', rate: 42000.0 },
  'IQ': { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar', rate: 1310.0 },
  'SA': { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rate: 3.75 },
  'AE': { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67 },
  'QA': { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', rate: 3.64 },
  'KW': { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', rate: 0.31 },
  'BH': { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', rate: 0.38 },
  'OM': { code: 'OMR', symbol: '﷼', name: 'Omani Rial', rate: 0.38 },
  'JO': { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', rate: 0.71 },
  'LB': { code: 'LBP', symbol: '£', name: 'Lebanese Pound', rate: 15000.0 },
  'SY': { code: 'SYP', symbol: '£', name: 'Syrian Pound', rate: 2512.0 },
  'YE': { code: 'YER', symbol: '﷼', name: 'Yemeni Rial', rate: 250.0 },
  'TR': { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rate: 29.0 },
  'IL': { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', rate: 3.7 },
  'AM': { code: 'AMD', symbol: '֏', name: 'Armenian Dram', rate: 386.0 },
  'AZ': { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat', rate: 1.7 },
  'GE': { code: 'GEL', symbol: '₾', name: 'Georgian Lari', rate: 2.65 },
  'KZ': { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', rate: 450.0 },
  'KG': { code: 'KGS', symbol: 'с', name: 'Kyrgyzstani Som', rate: 89.0 },
  'TJ': { code: 'TJS', symbol: 'ЅМ', name: 'Tajikistani Somoni', rate: 11.0 },
  'TM': { code: 'TMT', symbol: 'T', name: 'Turkmenistani Manat', rate: 3.5 },
  'UZ': { code: 'UZS', symbol: 'сўм', name: 'Uzbekistani Som', rate: 12250.0 },

  // Oceania
  'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.54 },
  'NZ': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rate: 1.63 },
  'FJ': { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar', rate: 2.25 },
  'PG': { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina', rate: 3.7 },
  'SB': { code: 'SBD', symbol: 'SI$', name: 'Solomon Islands Dollar', rate: 8.5 },
  'VU': { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu', rate: 119.0 },
  'WS': { code: 'WST', symbol: 'WS$', name: 'Samoan Tālā', rate: 2.7 },
  'TO': { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga', rate: 2.35 },
  'PW': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
  'FM': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
  'MH': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
  'KI': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.54 },
  'NR': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.54 },
  'TV': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.54 },
};

export function getCurrencyByCountryCode(countryCode: string): Currency {
  return WORLD_CURRENCIES[countryCode] || { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 };
}

export function formatCurrency(amount: number, countryCode: string): string {
  const currency = getCurrencyByCountryCode(countryCode);
  const convertedAmount = amount * (currency.rate || 1.0);
  
  // Format based on currency
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${currency.symbol}${formatter.format(convertedAmount)}`;
}

export function convertCurrency(amountUSD: number, fromCountryCode: string = 'US', toCountryCode: string): number {
  const fromCurrency = getCurrencyByCountryCode(fromCountryCode);
  const toCurrency = getCurrencyByCountryCode(toCountryCode);
  
  // Convert to USD first if not already in USD
  const usdAmount = fromCurrency.code === 'USD' ? amountUSD : amountUSD / (fromCurrency.rate || 1.0);
  
  // Convert from USD to target currency
  return usdAmount * (toCurrency.rate || 1.0);
}