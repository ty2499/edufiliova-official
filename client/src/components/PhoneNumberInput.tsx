import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone } from "lucide-react";
import { countryCodes, type CountryCode, formatPhoneNumber, validatePhoneNumber } from "../../../shared/countryCodes";

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const PhoneNumberInput = ({ 
  value, 
  onChange, 
  error, 
  disabled = false, 
  placeholder = "Enter phone number",
  label = "Phone Number",
  required = false 
}: PhoneNumberInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    countryCodes.find(c => c.code === "US") || countryCodes[0] // Temporary default
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);

  // Auto-detect user's country based on IP address
  useEffect(() => {
    const detectUserCountry = async () => {
      try {
        setIsDetectingCountry(true);
        
        // Use ipapi.co for free IP geolocation (no API key required)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code) {
          const detectedCountry = countryCodes.find(
            country => country.code === data.country_code.toUpperCase()
          );
          
          if (detectedCountry && !value) {
            setSelectedCountry(detectedCountry);
            console.log(`🌍 Auto-detected country: ${detectedCountry.name} (${detectedCountry.dialCode})`);
          }
        }
      } catch (error) {
        console.warn('Could not detect country from IP:', error);
        // Fallback to US if detection fails
        const fallbackCountry = countryCodes.find(c => c.code === "US");
        if (fallbackCountry && !value) {
          setSelectedCountry(fallbackCountry);
        }
      } finally {
        setIsDetectingCountry(false);
      }
    };

    detectUserCountry();
  }, []);

  useEffect(() => {
    // Parse existing value to extract country code and number
    if (value && value.startsWith("+")) {
      const matchedCountry = countryCodes.find(country => 
        value.startsWith(country.dialCode)
      );
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setPhoneNumber(value.substring(matchedCountry.dialCode.length));
      }
    }
  }, [value]);

  const handleCountryChange = (countryCode: string) => {
    const country = countryCodes.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      const fullNumber = formatPhoneNumber(phoneNumber, country.code);
      const isValid = validatePhoneNumber(fullNumber, country.code);
      onChange(fullNumber, isValid);
    }
  };

  const handlePhoneChange = (newPhoneNumber: string) => {
    // Only allow digits, spaces, hyphens, and parentheses
    const cleanedNumber = newPhoneNumber.replace(/[^\d\s\-\(\)]/g, '');
    setPhoneNumber(cleanedNumber);
    
    const fullNumber = formatPhoneNumber(cleanedNumber, selectedCountry.code);
    const isValid = validatePhoneNumber(fullNumber, selectedCountry.code);
    onChange(fullNumber, isValid);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <Select
          value={selectedCountry.code}
          onValueChange={handleCountryChange}
          disabled={disabled || isDetectingCountry}
        >
          <SelectTrigger className="w-32">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-mono">{selectedCountry.dialCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {countryCodes.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-sm">{country.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {country.dialCode}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="phone-input"
            type="tel"
            placeholder={placeholder}
            value={phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={`pl-10 ${error ? "border-primary" : ""}`}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Display formatted full number */}
      {phoneNumber && (
        <p className="text-xs text-muted-foreground">
          Full number: {formatPhoneNumber(phoneNumber, selectedCountry.code)}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-primary">{error}</p>
      )}
    </div>
  );
};

export default PhoneNumberInput;
