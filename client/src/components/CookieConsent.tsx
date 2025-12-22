import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { useLocation } from "wouter";

const CookieConsent = () => {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    marketing: false,
    statistics: false,
    personalization: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === null) {
      setIsVisible(true);
    } else {
      try {
        const stored = JSON.parse(consent);
        if (stored.preferences) {
          setPreferences(stored.preferences);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const handleToggle = (key: keyof typeof preferences) => {
    if (key === 'essential') return; // Essential can't be toggled
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      status: 'accepted',
      preferences: {
        essential: true,
        marketing: true,
        statistics: true,
        personalization: true
      },
      timestamp: Date.now()
    }));
    setIsVisible(false);
  };

  const handleConfirmPreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      status: 'confirmed',
      preferences,
      timestamp: Date.now()
    }));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      status: 'declined',
      preferences: {
        essential: true,
        marketing: false,
        statistics: false,
        personalization: false
      },
      timestamp: Date.now()
    }));
    setIsVisible(false);
  };

  const handleClose = () => {
    // Save current preferences to localStorage so it doesn't show again
    localStorage.setItem('cookie-consent', JSON.stringify({
      status: 'dismissed',
      preferences,
      timestamp: Date.now()
    }));
    setIsVisible(false);
  };

  const handleNavigate = (page: string) => {
    setIsVisible(false);
    setLocation(`/?page=${page}`);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Desktop Version */}
      <div 
        className="hidden lg:block fixed bottom-6 right-6 z-50 w-96 max-h-[90vh] overflow-y-auto transform transition-all duration-300"
        role="region"
        aria-label="Privacy preference center"
        data-testid="cookie-consent-desktop"
      >
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl p-6">
          {/* Header with close button */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Privacy Preference Center</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              data-testid="button-close-cookies"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            When you visit our website, we may store or retrieve data in your browser. This storage is often necessary for the basic functionality of our website. The storage may be used for marketing, analytics, and personalization of our site, such as storing your preferences. Privacy is important to us, so you have the option of disabling certain types of storage that may not be necessary for the basic functioning of our website. Blocking categories may impact your experience on our website.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            For more information, please read our{" "}
            <button 
              onClick={() => handleNavigate('privacy-policy')} 
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit inline"
              data-testid="link-privacy-policy"
            >
              Privacy Policy
            </button>
            {" "}and{" "}
            <button 
              onClick={() => handleNavigate('cookies-policy')} 
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit inline"
              data-testid="link-cookies-policy"
            >
              Cookie Policy
            </button>
            .
          </p>

          {/* Category Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Manage Consent Preferences by Category</h3>
            
            {/* Essential */}
            <div className="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-gray-900 dark:text-gray-100 text-sm">Essential (Stay active)</label>
                <Switch
                  checked={preferences.essential}
                  onCheckedChange={() => handleToggle('essential')}
                  disabled
                  data-testid="toggle-essential"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                These items are required to enable basic website functionality.
              </p>
            </div>

            {/* Marketing */}
            <div className="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-gray-900 dark:text-gray-100 text-sm">Marketing</label>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={() => handleToggle('marketing')}
                  data-testid="toggle-marketing"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                These items are used to deliver advertising that is more relevant to you and your interests. They may also be used to limit the number of times you see an advertising and measure the effectiveness of advertising campaigns. Advertising networks usually place them with the website operator's permission.
              </p>
            </div>

            {/* Statistics */}
            <div className="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-gray-900 dark:text-gray-100 text-sm">Statistics</label>
                <Switch
                  checked={preferences.statistics}
                  onCheckedChange={() => handleToggle('statistics')}
                  data-testid="toggle-statistics"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                These items help the website operator understand how its website performs, how visitors interact with the site, and whether there may be technical issues. This storage type usually doesn't collect information that identifies a visitor.
              </p>
            </div>

            {/* Personalization */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-gray-900 dark:text-gray-100 text-sm">Personalization</label>
                <Switch
                  checked={preferences.personalization}
                  onCheckedChange={() => handleToggle('personalization')}
                  data-testid="toggle-personalization"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                These items allow the website to remember choices you make (such as your user name, language, or the region you are in) and provide enhanced, more personal features. For example, a website may provide you with local weather reports or traffic news by storing data about your current location.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleAcceptAll}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
              data-testid="button-accept-all"
            >
              Accept all
            </Button>
            <Button
              onClick={handleConfirmPreferences}
              variant="outline"
              className="w-full h-10 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              data-testid="button-confirm-preferences"
            >
              Confirm my preferences
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="outline"
              className="w-full h-10 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              data-testid="button-reject-all"
            >
              Reject all
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Version */}
      <div 
        className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex justify-center max-h-[90vh] overflow-y-auto"
        style={{ 
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))'
        }}
        role="region"
        aria-label="Privacy preference center"
        data-testid="cookie-consent-mobile"
      >
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl p-4 max-w-md w-full">
          {/* Header with close button */}
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Privacy Preferences</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              data-testid="button-close-cookies-mobile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
            When you visit our website, we may store or retrieve data in your browser. Privacy is important to us, so you have the option of disabling certain types of storage.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Read our{" "}
            <button 
              onClick={() => handleNavigate('privacy-policy')} 
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit inline"
              data-testid="link-privacy-policy-mobile"
            >
              Privacy Policy
            </button>
            {" "}and{" "}
            <button 
              onClick={() => handleNavigate('cookies-policy')} 
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit inline"
              data-testid="link-cookies-policy-mobile"
            >
              Cookie Policy
            </button>
            .
          </p>

          {/* Category Section */}
          <div className="mb-4 space-y-3">
            {/* Essential */}
            <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-gray-900 dark:text-gray-100 text-xs">Essential (Stay active)</label>
                <Switch
                  checked={preferences.essential}
                  onCheckedChange={() => handleToggle('essential')}
                  disabled
                  data-testid="toggle-essential-mobile"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Required for basic functionality.
              </p>
            </div>

            {/* Marketing */}
            <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-gray-900 dark:text-gray-100 text-xs">Marketing</label>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={() => handleToggle('marketing')}
                  data-testid="toggle-marketing-mobile"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Deliver relevant advertising and measure effectiveness.
              </p>
            </div>

            {/* Statistics */}
            <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-gray-900 dark:text-gray-100 text-xs">Statistics</label>
                <Switch
                  checked={preferences.statistics}
                  onCheckedChange={() => handleToggle('statistics')}
                  data-testid="toggle-statistics-mobile"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Understand website performance and visitor interactions.
              </p>
            </div>

            {/* Personalization */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-gray-900 dark:text-gray-100 text-xs">Personalization</label>
                <Switch
                  checked={preferences.personalization}
                  onCheckedChange={() => handleToggle('personalization')}
                  data-testid="toggle-personalization-mobile"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Remember your choices and provide personal features.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAcceptAll}
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
              data-testid="button-accept-all-mobile"
            >
              Accept all
            </Button>
            <Button
              onClick={handleConfirmPreferences}
              variant="outline"
              className="w-full h-9 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium"
              data-testid="button-confirm-preferences-mobile"
            >
              Confirm preferences
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="outline"
              className="w-full h-9 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium"
              data-testid="button-reject-all-mobile"
            >
              Reject all
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
