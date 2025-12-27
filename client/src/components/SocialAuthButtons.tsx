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

  return null;
}
