import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Building2, Wallet, Smartphone, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { apiRequest } from '@/lib/queryClient';

interface Country {
  countryCode: string;
  countryName: string;
  bankCount: number;
}

interface Bank {
  id: string;
  bankName: string;
  bankCode: string;
  swiftCode: string;
}

interface PaymentMethods {
  country: string;
  currency: string;
  symbol: string;
  methods: string[];
  popular: string[];
  cardNetworks: string[];
  localMethods: string[];
  banks: Bank[];
  bankCount: number;
}

interface PaymentMethodSelectorProps {
  onPaymentMethodSelect?: (method: any) => void;
  selectedCountry?: string;
}

export default function PaymentMethodSelector({ onPaymentMethodSelect, selectedCountry }: PaymentMethodSelectorProps) {
  const [loading, setLoading] = useState({
    location: false,
    countries: false,
    paymentMethods: false,
    banks: false
  });
  
  const [userLocation, setUserLocation] = useState<{ country: string; countryName: string } | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(selectedCountry || '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Auto-detect user location on mount
  useEffect(() => {
    detectUserLocation();
    fetchCountriesWithBanks();
  }, []);

  // Load payment methods when country changes
  useEffect(() => {
    if (selectedCountryCode) {
      detectPaymentMethods(selectedCountryCode);
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
        
        if (!selectedCountryCode) {
          setSelectedCountryCode(data.country);
        }
        
        setSuccess('Location detected successfully');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (error) {
      setError('Could not detect your location. Using default country.');
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
      setError('Failed to load available countries');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(prev => ({ ...prev, countries: false }));
    }
  };

  const detectPaymentMethods = async (countryCode: string) => {
    setLoading(prev => ({ ...prev, paymentMethods: true, banks: true }));
    setPaymentMethods(null);
    
    try {
      const response = await apiRequest(`/api/payment-methods/detect/${countryCode}`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data);
        setSuccess(`Payment methods loaded for ${data.country}`);
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (error) {
      setError('Failed to load payment methods for selected country');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(prev => ({ ...prev, paymentMethods: false, banks: false }));
    }
  };

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setSelectedPaymentMethod('');
    setSelectedBank('');
  };

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    if (onPaymentMethodSelect) {
      onPaymentMethodSelect({
        method,
        country: selectedCountryCode,
        paymentInfo: paymentMethods
      });
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer':
        return <Building2 className="w-4 h-4" />;
      case 'paypal':
      case 'apple_pay':
      case 'google_pay':
        return <Wallet className="w-4 h-4" />;
      case 'upi':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const formatMethodName = (method: string) => {
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6" data-testid="payment-method-selector">
      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Location Detection */}
      <Card data-testid="location-detection">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Detection
            {loading.location && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            We automatically detect your location to show relevant payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userLocation ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" data-testid="detected-location">
                {userLocation.countryName} ({userLocation.country})
              </Badge>
              <span className="text-sm text-muted-foreground">Detected location</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {loading.location ? 'Detecting your location...' : 'Location detection failed'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Country Selection */}
      <Card data-testid="country-selection">
        <CardHeader>
          <CardTitle>Select Country</CardTitle>
          <CardDescription>
            Choose your country to see available payment methods and banks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading.countries ? (
            <div className="flex items-center gap-2">
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
        </CardContent>
      </Card>

      {/* Payment Methods */}
      {selectedCountryCode && (
        <Card data-testid="payment-methods">
          <CardHeader>
            <CardTitle>
              Payment Methods
              {loading.paymentMethods && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            </CardTitle>
            <CardDescription>
              {paymentMethods ? (
                <>Available payment options in {paymentMethods.country} ({paymentMethods.currency})</>
              ) : (
                'Loading payment methods...'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods && (
              <>
                {/* Popular Methods */}
                <div>
                  <h4 className="font-medium mb-3">Popular Methods</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {paymentMethods.popular.map((method) => (
                      <Button
                        key={method}
                        variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                        className="justify-start h-auto p-4"
                        onClick={() => handlePaymentMethodSelect(method)}
                        data-testid={`payment-method-${method}`}
                      >
                        <div className="flex items-center gap-3">
                          {getPaymentMethodIcon(method)}
                          <div className="text-left">
                            <div className="font-medium">{formatMethodName(method)}</div>
                            <Badge variant="secondary" className="text-xs mt-1">Popular</Badge>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* All Methods */}
                <div>
                  <h4 className="font-medium mb-3">All Available Methods</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {paymentMethods.methods.map((method) => (
                      <Button
                        key={method}
                        variant={selectedPaymentMethod === method ? 'default' : 'ghost'}
                        size="sm"
                        className="justify-start"
                        onClick={() => handlePaymentMethodSelect(method)}
                        data-testid={`all-method-${method}`}
                      >
                        {getPaymentMethodIcon(method)}
                        <span className="ml-2">{formatMethodName(method)}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Local Methods */}
                {paymentMethods.localMethods.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Local Payment Methods</h4>
                      <div className="flex flex-wrap gap-2">
                        {paymentMethods.localMethods.map((method) => (
                          <Badge key={method} variant="outline" className="uppercase">
                            {method.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Banks */}
      {paymentMethods && paymentMethods.banks.length > 0 && (
        <Card data-testid="available-banks">
          <CardHeader>
            <CardTitle>
              Available Banks
              {loading.banks && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            </CardTitle>
            <CardDescription>
              {paymentMethods.bankCount} banks available in {paymentMethods.country}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedBank} onValueChange={setSelectedBank} data-testid="bank-select">
              <SelectTrigger>
                <SelectValue placeholder="Select a bank (optional)" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.banks.map((bank) => (
                  <SelectItem 
                    key={bank.id} 
                    value={bank.id}
                    data-testid={`bank-option-${bank.id}`}
                  >
                    <div>
                      <div className="font-medium">{bank.bankName}</div>
                      <div className="text-sm text-muted-foreground">
                        {bank.bankCode} • {bank.swiftCode}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Selected Configuration */}
      {selectedPaymentMethod && (
        <Card data-testid="selected-configuration">
          <CardHeader>
            <CardTitle>Selected Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Country:</span>
                <Badge variant="secondary">
                  {paymentMethods?.country} ({selectedCountryCode})
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Payment Method:</span>
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(selectedPaymentMethod)}
                  <span>{formatMethodName(selectedPaymentMethod)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Currency:</span>
                <Badge variant="outline">
                  {paymentMethods?.currency} ({paymentMethods?.symbol})
                </Badge>
              </div>
              {selectedBank && paymentMethods && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Selected Bank:</span>
                  <span>
                    {paymentMethods.banks.find(b => b.id === selectedBank)?.bankName}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
