import { useState, useEffect } from 'react';

interface IPLocationData {
  country: string;
  countryCode: string;
  currency: string;
  loading: boolean;
  error: string | null;
}

interface UseIPLocationOptions {
  profileCountry?: string | null;
}

export function useIPLocation(options: UseIPLocationOptions = {}) {
  const { profileCountry } = options;
  
  const [locationData, setLocationData] = useState<IPLocationData>({
    country: '',
    countryCode: '',
    currency: 'USD',
    loading: true,
    error: null,
  });

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Use ipapi.co for IP-based geolocation (free tier available)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.error) {
          throw new Error(data.reason || 'Failed to detect location');
        }

        setLocationData({
          country: data.country_name || '',
          countryCode: data.country_code || '',
          currency: data.currency || 'USD',
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('IP location detection error:', error);
        setLocationData({
          country: '',
          countryCode: '',
          currency: 'USD',
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to detect location',
        });
      }
    };

    detectLocation();
  }, []);

  // Check IP detection first
  const ipIsSouthAfrican = locationData.countryCode === 'ZA';
  const ipIsZimbabwean = locationData.countryCode === 'ZW';
  
  // Check profile registration country as fallback
  const profileIsZimbabwean = profileCountry === 'Zimbabwe' || profileCountry === 'ZW';
  const profileIsSouthAfrican = profileCountry === 'South Africa' || profileCountry === 'ZA';
  
  // Combine: user is from country if either IP OR profile registration country matches
  const isSouthAfrican = ipIsSouthAfrican || profileIsSouthAfrican;
  const isZimbabwean = ipIsZimbabwean || profileIsZimbabwean;

  return {
    ...locationData,
    isSouthAfrican,
    isZimbabwean,
    // Also expose individual detection sources for debugging
    ipIsSouthAfrican,
    ipIsZimbabwean,
    profileIsSouthAfrican,
    profileIsZimbabwean,
  };
}
