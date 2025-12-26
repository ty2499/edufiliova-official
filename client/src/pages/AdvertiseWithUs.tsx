import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HeroSectionDisplay } from '@/components/HeroSectionDisplay';
import { BannerAdDisplay } from '@/components/BannerAdDisplay';

interface AdvertiseWithUsProps {
  onNavigate?: (page: string) => void;
}

export default function AdvertiseWithUs({ onNavigate }: AdvertiseWithUsProps) {
  
  // Fetch system settings for button configuration
  const { data: buttonSettings } = useQuery({
    queryKey: ['/api/admin/system-settings/advertise-buttons'],
    enabled: true,
  });

  // Check if buttons are enabled
  const showContactButton = buttonSettings?.contactDesignTeamEnabled !== false; // default to true
  const showBannerButton = buttonSettings?.createBannerEnabled !== false; // default to true
  
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header onNavigate={onNavigate || (() => {})} currentPage="advertise-with-us" />
      
      {/* Hero Section Display */}
      <HeroSectionDisplay placement="advertise" />
      
      {/* Banner Advertisement */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <BannerAdDisplay placement="advertise_page" />
      </div>
      
      {/* Admin-configurable Action Buttons */}
      {(showContactButton || showBannerButton) && (
        <div className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {showContactButton && (
                <Button 
                  className="bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-colors transition-all duration-300"
                  onClick={() => onNavigate?.('design-team-contact')}
                  data-testid="button-contact-design-team"
                >
                  Contact Design Team
                </Button>
              )}
              {showBannerButton && (
                <Button 
                  variant="outline" 
                  className="border-2 border-gray-300 bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-50 transition-colors transition-all duration-300"
                  onClick={() => onNavigate?.('banner-creator')}
                  data-testid="button-create-banner"
                >
                  Create Banner Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <Footer onNavigate={onNavigate || (() => {})} />
    </div>
  );
}
