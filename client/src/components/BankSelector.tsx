import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building2, MapPin, AlertCircle } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { apiRequest } from '@/lib/queryClient';

interface Bank {
  id: string;
  bankName: string;
  bankCode: string;
  swiftCode: string;
}

interface Country {
  countryCode: string;
  countryName: string;
  bankCount: number;
}

interface BankSelectorProps {
  onBankSelect?: (bank: Bank) => void;
  selectedCountry?: string;
  className?: string;
}

export default function BankSelector({ onBankSelect, selectedCountry, className }: BankSelectorProps) {
  const [loading, setLoading] = useState({
    location: false,
    countries: false,
    banks: false
  });
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(selectedCountry || 'US');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ country: string; countryName: string } | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Auto-detect user location and load countries on mount
  useEffect(() => {
    detectUserLocation();
    fetchCountriesWithBanks();
  }, []);

  // Load banks when country changes
  useEffect(() => {
    if (selectedCountryCode) {
      fetchBanksForCountry(selectedCountryCode);
    }
  }, [selectedCountryCode]);

  const detectUserLocation = async () => {
    setLoading(prev => ({ ...prev, location: true }));
    setError('');
    
    try {
      const response = await apiRequest('/api/user/location');
      const data = await response.json();
      
      if (data.success) {
        setUserLocation({
          country: data.country,
          countryName: data.countryName
        });
        
        if (!selectedCountry) {
          setSelectedCountryCode(data.country);
        }
        
        setSuccess('Location detected successfully');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (error) {
      setError('Could not detect location. Using default.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(prev => ({ ...prev, location: false }));
    }
  };

  const fetchCountriesWithBanks = async () => {
    setLoading(prev => ({ ...prev, countries: true }));
    
    try {
      const response = await apiRequest('/api/countries/with-banks');
      const data = await response.json();
      
      if (data.success) {
        setCountries(data.countries);
      }
    } catch (error) {
      setError('Failed to load countries');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(prev => ({ ...prev, countries: false }));
    }
  };

  const fetchBanksForCountry = async (countryCode: string) => {
    setLoading(prev => ({ ...prev, banks: true }));
    setBanks([]);
    setSelectedBank('');
    
    try {
      const response = await apiRequest(`/api/banks/${countryCode}`);
      const data = await response.json();
      
      if (data.success) {
        setBanks(data.banks);
        if (data.banks.length > 0) {
          setSuccess(`Loaded ${data.banks.length} banks for selected country`);
          setTimeout(() => setSuccess(''), 2000);
        }
      }
    } catch (error) {
      setError('Failed to load banks for selected country');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(prev => ({ ...prev, banks: false }));
    }
  };

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
  };

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    const selectedBankData = banks.find(bank => bank.id === bankId);
    if (selectedBankData && onBankSelect) {
      onBankSelect(selectedBankData);
    }
  };

  return (
    <div className={`space-y-4 ${className}`} data-testid="bank-selector">
      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Location Detection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4" />
            Location Detection
            {loading.location && <Loader2 className="w-3 h-3 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userLocation ? (
            <Badge variant="secondary" data-testid="detected-location">
              {userLocation.countryName} ({userLocation.country})
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              {loading.location ? 'Detecting...' : 'Location detection failed'}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Country Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Country</label>
        {loading.countries ? (
          <div className="flex items-center gap-2 p-3 border rounded-md">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading countries...</span>
          </div>
        ) : (
          <Select value={selectedCountryCode} onValueChange={handleCountrySelect} data-testid="country-select">
            <SelectTrigger>
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem 
                  key={country.countryCode} 
                  value={country.countryCode}
                  data-testid={`country-option-${country.countryCode}`}
                >
                  {country.countryName} ({country.bankCount} banks)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Bank Selection */}
      {selectedCountryCode && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Select Bank
            {loading.banks && <Loader2 className="w-3 h-3 animate-spin" />}
          </label>
          
          {loading.banks ? (
            <div className="flex items-center gap-2 p-3 border rounded-md">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading banks...</span>
            </div>
          ) : banks.length > 0 ? (
            <Select value={selectedBank} onValueChange={handleBankSelect} data-testid="bank-select">
              <SelectTrigger>
                <SelectValue placeholder="Select a bank" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem 
                    key={bank.id} 
                    value={bank.id}
                    data-testid={`bank-option-${bank.id}`}
                  >
                    <div>
                      <div className="font-medium">{bank.bankName}</div>
                      <div className="text-sm text-muted-foreground">
                        Code: {bank.bankCode} • SWIFT: {bank.swiftCode}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-3 border rounded-md text-sm text-muted-foreground">
              No banks available for selected country
            </div>
          )}
        </div>
      )}

      {/* Selected Bank Info */}
      {selectedBank && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Selected Bank</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const selectedBankData = banks.find(bank => bank.id === selectedBank);
              return selectedBankData ? (
                <div className="space-y-2">
                  <div><span className="font-medium">Bank:</span> {selectedBankData.bankName}</div>
                  <div><span className="font-medium">Bank Code:</span> {selectedBankData.bankCode}</div>
                  <div><span className="font-medium">SWIFT Code:</span> {selectedBankData.swiftCode}</div>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
