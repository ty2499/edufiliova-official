import { Button } from "@/components/ui/button";
import { useSocialAuth } from "@/hooks/useSocialAuth";
import { SiGoogle, SiX } from "react-icons/si";
import { Loader2 } from "lucide-react";

interface SocialAuthButtonsProps {
  onSuccess?: () => void;
  isCheckout?: boolean;
  redirectTo?: string;
  disabled?: boolean;
}

export function SocialAuthButtons({ onSuccess, isCheckout = false, redirectTo, disabled }: SocialAuthButtonsProps) {
  const { signInWithProvider, loading } = useSocialAuth();

  const handleSocialSignIn = async (provider: 'google' | 'twitter') => {
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
          onClick={() => handleSocialSignIn('google')}
          disabled={disabled || loading}
          className="w-full"
          data-testid="button-google-signin"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SiGoogle className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>

        <Button
          variant="outline"
          onClick={() => handleSocialSignIn('twitter')}
          disabled={disabled || loading}
          className="w-full"
          data-testid="button-twitter-signin"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SiX className="mr-2 h-4 w-4" />
          )}
          Continue with X
        </Button>

      </div>
    </div>
  );
}
