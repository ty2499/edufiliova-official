import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckmarkIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "success" | "primary";
}

export function CheckmarkIcon({ className, size = "md", variant = "default" }: CheckmarkIconProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
    "2xl": "h-12 w-12"
  };

  const checkSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
    xl: "h-5 w-5",
    "2xl": "h-7 w-7"
  };

  const variantClasses = {
    default: {
      bg: "bg-white",
      check: "text-[#a0fab2]"
    },
    success: {
      bg: "bg-green-500",
      check: "text-[#a0fab2]"
    },
    primary: {
      bg: "bg-primary",
      check: "text-[#a0fab2]"
    }
  };

  const currentVariant = variantClasses[variant];

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0",
        currentVariant.bg,
        sizeClasses[size],
        className
      )}
    >
      <Check className={cn("stroke-[3]", currentVariant.check, checkSizes[size])} />
    </div>
  );
}
