import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Check, Download } from "lucide-react";
import { SiApple, SiGoogleplay, SiHuawei } from "react-icons/si";

function AppDownloadsManagement() {
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [appStoreText, setAppStoreText] = useState("Download on the");
  const [googlePlayUrl, setGooglePlayUrl] = useState("");
  const [googlePlayText, setGooglePlayText] = useState("Get it on");
  const [huaweiGalleryUrl, setHuaweiGalleryUrl] = useState("");
  const [huaweiGalleryText, setHuaweiGalleryText] = useState("Explore it on");

  const { data: downloadLinksData, isLoading: loadingDownloadLinks } = useQuery({
    queryKey: ['/api/app-download-links'],
  });

  useEffect(() => {
    if (downloadLinksData && typeof downloadLinksData === 'object') {
      const data = downloadLinksData as { 
        appStoreUrl?: string; 
        appStoreText?: string;
        googlePlayUrl?: string; 
        googlePlayText?: string;
        huaweiGalleryUrl?: string;
        huaweiGalleryText?: string;
      };
      setAppStoreUrl(data.appStoreUrl || "");
      setAppStoreText(data.appStoreText || "Download on the");
      setGooglePlayUrl(data.googlePlayUrl || "");
      setGooglePlayText(data.googlePlayText || "Get it on");
      setHuaweiGalleryUrl(data.huaweiGalleryUrl || "");
      setHuaweiGalleryText(data.huaweiGalleryText || "Explore it on");
    }
  }, [downloadLinksData]);

  const updateAppLinksMutation = useMutation({
    mutationFn: async (data: { 
      appStoreUrl: string; 
      appStoreText: string;
      googlePlayUrl: string; 
      googlePlayText: string;
      huaweiGalleryUrl: string;
      huaweiGalleryText: string;
    }) => {
      console.log('🔵 Mutation data being sent:', data);
      const result = await apiRequest('/api/admin/app-download-links', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      console.log('🟢 Mutation result received:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Mutation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/app-download-links'] });
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    }
  });

  const handleSave = () => {
    updateAppLinksMutation.mutate({
      appStoreUrl,
      appStoreText,
      googlePlayUrl,
      googlePlayText,
      huaweiGalleryUrl,
      huaweiGalleryText
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Download className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mobile App Download Links</h2>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Manage the download links for your mobile apps. These links will appear in the footer of your website with real app store badges.
      </p>

      <div className="space-y-8">
        {/* App Store Section */}
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiApple className="h-5 w-5" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Apple App Store</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="appStoreUrl" className="text-gray-900 dark:text-white">
              App Store Download Link
            </Label>
            <Input
              id="appStoreUrl"
              type="url"
              placeholder="https://apps.apple.com/app/..."
              value={appStoreUrl}
              onChange={(e) => setAppStoreUrl(e.target.value)}
              className="max-w-2xl"
              data-testid="input-app-store-url"
            />
            <p className="text-sm text-gray-500">
              Enter the full URL to your app on the Apple App Store
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appStoreText" className="text-gray-900 dark:text-white">
              Custom Text (appears above "App Store")
            </Label>
            <Input
              id="appStoreText"
              type="text"
              placeholder="Download on the"
              value={appStoreText}
              onChange={(e) => setAppStoreText(e.target.value)}
              className="max-w-md"
              data-testid="input-app-store-text"
            />
            <p className="text-sm text-gray-500">
              Customize the text that appears above the "App Store" text
            </p>
          </div>
        </div>

        {/* Google Play Section */}
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiGoogleplay className="h-5 w-5" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Google Play Store</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="googlePlayUrl" className="text-gray-900 dark:text-white">
              Google Play Download Link
            </Label>
            <Input
              id="googlePlayUrl"
              type="url"
              placeholder="https://play.google.com/store/apps/..."
              value={googlePlayUrl}
              onChange={(e) => setGooglePlayUrl(e.target.value)}
              className="max-w-2xl"
              data-testid="input-google-play-url"
            />
            <p className="text-sm text-gray-500">
              Enter the full URL to your app on the Google Play Store
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="googlePlayText" className="text-gray-900 dark:text-white">
              Custom Text (appears above "Google Play")
            </Label>
            <Input
              id="googlePlayText"
              type="text"
              placeholder="Get it on"
              value={googlePlayText}
              onChange={(e) => setGooglePlayText(e.target.value)}
              className="max-w-md"
              data-testid="input-google-play-text"
            />
            <p className="text-sm text-gray-500">
              Customize the text that appears above the "Google Play" text
            </p>
          </div>
        </div>

        {/* Huawei AppGallery Section */}
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiHuawei className="h-5 w-5" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Huawei AppGallery</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="huaweiGalleryUrl" className="text-gray-900 dark:text-white">
              AppGallery Download Link
            </Label>
            <Input
              id="huaweiGalleryUrl"
              type="url"
              placeholder="https://appgallery.huawei.com/app/..."
              value={huaweiGalleryUrl}
              onChange={(e) => setHuaweiGalleryUrl(e.target.value)}
              className="max-w-2xl"
              data-testid="input-huawei-gallery-url"
            />
            <p className="text-sm text-gray-500">
              Enter the full URL to your app on Huawei AppGallery
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="huaweiGalleryText" className="text-gray-900 dark:text-white">
              Custom Text (appears above "AppGallery")
            </Label>
            <Input
              id="huaweiGalleryText"
              type="text"
              placeholder="Explore it on"
              value={huaweiGalleryText}
              onChange={(e) => setHuaweiGalleryText(e.target.value)}
              className="max-w-md"
              data-testid="input-huawei-gallery-text"
            />
            <p className="text-sm text-gray-500">
              Customize the text that appears above the "AppGallery" text
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={updateAppLinksMutation.isPending || loadingDownloadLinks}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-save-app-links"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateAppLinksMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          
          {updateAppLinksMutation.isSuccess && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>Saved successfully!</span>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Preview with Real Badges</h3>
          <div className="flex flex-wrap gap-4">
            {appStoreUrl && (
              <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img 
                  src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&amp;releaseDate=1576195200" 
                  alt={`${appStoreText} App Store`}
                  className="h-[50px] w-auto"
                  data-testid="badge-app-store"
                />
              </a>
            )}
            
            {googlePlayUrl && (
              <a href={googlePlayUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img 
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                  alt={`${googlePlayText} Google Play`}
                  className="h-[50px] w-auto"
                  data-testid="badge-google-play"
                />
              </a>
            )}

            {huaweiGalleryUrl && (
              <a href={huaweiGalleryUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img 
                  src="https://appgallery.huawei.com/badge/English.png" 
                  alt={`${huaweiGalleryText} AppGallery`}
                  className="h-[50px] w-auto"
                  data-testid="badge-huawei-gallery"
                />
              </a>
            )}

            {!appStoreUrl && !googlePlayUrl && !huaweiGalleryUrl && (
              <p className="text-gray-500 text-sm">Add at least one app store URL to see the preview badges</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default AppDownloadsManagement;
