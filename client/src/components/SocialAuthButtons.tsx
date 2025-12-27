import { Button } from "@/components/ui/button";
import { useSocialAuth } from "@/hooks/useSocialAuth";
import { SiGoogle, SiX, SiFacebook } from "react-icons/si";
import { Loader2 } from "lucide-react";

interface SocialAuthButtonsProps {
  onSuccess?: () => void;
  isCheckout?: boolean;
  redirectTo?: string;
  disabled?: boolean;
}

export function SocialAuthButtons({ onSuccess, isCheckout = false, redirectTo, disabled }: SocialAuthButtonsProps) {
  const { signInWithProvider, loading } = useSocialAuth();

  const handleSocialSignIn = async (provider: 'google' | 'twitter' | 'facebook') => {
    try {
      await signInWithProvider(provider, {
        redirectTo: redirectTo || '/auth/callback',
        isCheckout
      });
      onSuccess?.();
    } catch (error) {
      console.error('Social auth error:', error);
    }
  };

  return (
    <div className="space-y-3" data-testid="social-auth-container">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn('facebook')}
          disabled={disabled || loading}
          className="w-full h-12 text-base rounded-lg border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all duration-300 font-semibold"
          data-testid="button-facebook-signin"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SiFacebook className="mr-2 h-5 w-5 text-[#1877F2]" />
          )}
          Continue with Facebook
        </Button>
      </div>
    </div>
  );
}
