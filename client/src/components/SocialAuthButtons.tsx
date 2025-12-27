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
  return null;
}
