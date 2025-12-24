import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import MyAds from '@/components/MyAds';
import BannerCreator from '@/pages/BannerCreator';

interface MyAdsPageProps {
  onNavigate?: (page: string) => void;
  userRole?: 'student' | 'teacher' | 'freelancer' | 'customer';
}

export default function MyAdsPage({ onNavigate, userRole = 'customer' }: MyAdsPageProps) {
  const [showCreator, setShowCreator] = useState(false);

  if (showCreator) {
    return (
      <div>
        <BannerCreator />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="hidden md:block">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Advertisements</h1>
          <p className="text-gray-600 mt-1">Manage your banner ad campaigns</p>
        </div>
        <Button
          onClick={() => setShowCreator(true)}
          className="bg-primary hover:bg-primary/80 hover:shadow-xl hover:scale-105 gap-2 text-white" transition-all duration-300
          data-testid="button-create-new-ad"
        >
          <Plus className="h-4 w-4" />
          Create Ad
        </Button>
      </div>

      <MyAds userRole={userRole} />
    </div>
  );
}
