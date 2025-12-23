import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Check, Share2 } from "lucide-react";
import { SiFacebook, SiX, SiPinterest, SiBehance, SiInstagram, SiWhatsapp, SiTelegram, SiDribbble, SiThreads } from "react-icons/si";

function SocialMediaManagement() {
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [dribbbleUrl, setDribbbleUrl] = useState("");
  const [threadsUrl, setThreadsUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [pinterestUrl, setPinterestUrl] = useState("");
  const [behanceUrl, setBehanceUrl] = useState("");

  const { data: socialMediaData, isLoading: loadingSocialMedia } = useQuery({
    queryKey: ['/api/social-media-links'],
  });

  useEffect(() => {
    if (socialMediaData && typeof socialMediaData === 'object') {
      const data = socialMediaData as any;
      setWhatsappUrl(data.whatsappUrl || "");
      setInstagramUrl(data.instagramUrl || "");
      setTelegramUrl(data.telegramUrl || "");
      setDribbbleUrl(data.dribbbleUrl || "");
      setThreadsUrl(data.threadsUrl || "");
      setFacebookUrl(data.facebookUrl || "");
      setXUrl(data.xUrl || "");
      setPinterestUrl(data.pinterestUrl || "");
      setBehanceUrl(data.behanceUrl || "");
    }
  }, [socialMediaData]);

  const updateSocialMediaMutation = useMutation({
    mutationFn: async (data: { 
      whatsappUrl: string;
      instagramUrl: string;
      telegramUrl: string;
      dribbbleUrl: string;
      threadsUrl: string;
      facebookUrl: string; 
      xUrl: string;
      pinterestUrl: string; 
      behanceUrl: string;
    }) => {
      console.log('🔵 Mutation data being sent:', data);
      const result = await apiRequest('/api/admin/social-media-links', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      console.log('🟢 Mutation result received:', result);
      return result;
    },
    onSuccess: () => {
      console.log('✅ Mutation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/social-media-links'] });
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    }
  });

  const handleSave = () => {
    updateSocialMediaMutation.mutate({
      whatsappUrl,
      instagramUrl,
      telegramUrl,
      dribbbleUrl,
      threadsUrl,
      facebookUrl,
      xUrl,
      pinterestUrl,
      behanceUrl
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Share2 className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Social Media Links</h2>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Manage your social media profile links. These icons will appear at the bottom of your website footer.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facebook */}
        <div className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiFacebook className="h-5 w-5 text-[#1778f2]" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Facebook</h3>
          </div>
          <Input
            type="url"
            placeholder="https://facebook.com/yourpage"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            data-testid="input-facebook-url"
          />
        </div>

        {/* X/Twitter */}
        <div className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiX className="h-5 w-5" />
            <h3 className="font-semibold text-gray-900 dark:text-white">X (Twitter)</h3>
          </div>
          <Input
            type="url"
            placeholder="https://x.com/yourhandle"
            value={xUrl}
            onChange={(e) => setXUrl(e.target.value)}
            data-testid="input-x-url"
          />
        </div>

        {/* Instagram */}
        <div className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiInstagram className="h-5 w-5 text-[#E4405F]" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Instagram</h3>
          </div>
          <Input
            type="url"
            placeholder="https://instagram.com/yourprofile"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            data-testid="input-instagram-url"
          />
        </div>

        {/* Pinterest */}
        <div className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiPinterest className="h-5 w-5 text-[#ff3635]" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Pinterest</h3>
          </div>
          <Input
            type="url"
            placeholder="https://pinterest.com/yourprofile"
            value={pinterestUrl}
            onChange={(e) => setPinterestUrl(e.target.value)}
            data-testid="input-pinterest-url"
          />
        </div>

        {/* Behance */}
        <div className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiBehance className="h-5 w-5 text-[#2a5afc]" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Behance</h3>
          </div>
          <Input
            type="url"
            placeholder="https://behance.net/yourprofile"
            value={behanceUrl}
            onChange={(e) => setBehanceUrl(e.target.value)}
            data-testid="input-behance-url"
          />
        </div>

        {/* Dribbble */}
        <div className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiDribbble className="h-5 w-5 text-[#ea4c89]" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Dribbble</h3>
          </div>
          <Input
            type="url"
            placeholder="https://dribbble.com/yourprofile"
            value={dribbbleUrl}
            onChange={(e) => setDribbbleUrl(e.target.value)}
            data-testid="input-dribbble-url"
          />
        </div>

        {/* Threads */}
        <div className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiThreads className="h-5 w-5" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Threads</h3>
          </div>
          <Input
            type="url"
            placeholder="https://threads.net/@yourhandle"
            value={threadsUrl}
            onChange={(e) => setThreadsUrl(e.target.value)}
            data-testid="input-threads-url"
          />
        </div>

        {/* WhatsApp */}
        <div className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiWhatsapp className="h-5 w-5 text-[#25D366]" />
            <h3 className="font-semibold text-gray-900 dark:text-white">WhatsApp</h3>
          </div>
          <Input
            type="url"
            placeholder="https://wa.me/your-number"
            value={whatsappUrl}
            onChange={(e) => setWhatsappUrl(e.target.value)}
            data-testid="input-whatsapp-url"
          />
        </div>

        {/* Telegram */}
        <div className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <SiTelegram className="h-5 w-5 text-[#0088cc]" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Telegram</h3>
          </div>
          <Input
            type="url"
            placeholder="https://t.me/yourhandle"
            value={telegramUrl}
            onChange={(e) => setTelegramUrl(e.target.value)}
            data-testid="input-telegram-url"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={handleSave}
          disabled={updateSocialMediaMutation.isPending || loadingSocialMedia}
          className="bg-primary hover:bg-primary text-white"
          data-testid="button-save-social-links"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSocialMediaMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        
        {updateSocialMediaMutation.isSuccess && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            <span>Saved successfully!</span>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
        <div className="flex flex-wrap gap-3">
          {facebookUrl && (
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#1778f2] rounded-lg hover:opacity-80 transition-opacity" data-testid="preview-facebook">
              <SiFacebook className="h-5 w-5 text-white" />
            </a>
          )}
          {xUrl && (
            <a href={xUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-black rounded-lg hover:opacity-80 transition-opacity" data-testid="preview-x">
              <SiX className="h-5 w-5 text-white" />
            </a>
          )}
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-lg hover:opacity-80 transition-opacity" data-testid="preview-instagram">
              <SiInstagram className="h-5 w-5 text-white" />
            </a>
          )}
          {pinterestUrl && (
            <a href={pinterestUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#ff3635] rounded-lg hover:opacity-80 transition-opacity" data-testid="preview-pinterest">
              <SiPinterest className="h-5 w-5 text-white" />
            </a>
          )}
          {behanceUrl && (
            <a href={behanceUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#2a5afc] rounded-lg hover:opacity-80 transition-opacity" data-testid="preview-behance">
              <SiBehance className="h-5 w-5 text-white" />
            </a>
          )}
          {dribbbleUrl && (
            <a href={dribbbleUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#ea4c89] rounded-lg hover:opacity-80 transition-opacity" data-testid="preview-dribbble">
              <SiDribbble className="h-5 w-5 text-white" />
            </a>
          )}
          {threadsUrl && (
            <a href={threadsUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-black rounded-lg hover:opacity-80 transition-opacity" data-testid="preview-threads">
              <SiThreads className="h-5 w-5 text-white" />
            </a>
          )}
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#25D366] rounded-lg hover:opacity-80 transition-opacity" data-testid="preview-whatsapp">
              <SiWhatsapp className="h-5 w-5 text-white" />
            </a>
          )}
          {telegramUrl && (
            <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#0088cc] rounded-lg hover:opacity-80 transition-opacity" data-testid="preview-telegram">
              <SiTelegram className="h-5 w-5 text-white" />
            </a>
          )}

          {!facebookUrl && !xUrl && !instagramUrl && !pinterestUrl && !behanceUrl && !dribbbleUrl && !threadsUrl && !whatsappUrl && !telegramUrl && (
            <p className="text-gray-500 text-sm">Add at least one social media URL to see the preview</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default SocialMediaManagement;
