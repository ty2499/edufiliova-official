import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  max?: number;
}

export const NotificationBadge = ({ count, className, max = 99 }: NotificationBadgeProps) => {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge 
      className={cn(
        "absolute -top-1 -right-1 min-w-[18px] h-[18px] p-0 text-[10px] font-bold flex items-center justify-center rounded-full bg-red-500 text-white border-2 border-background",
        className
      )}
      data-testid="notification-badge"
    >
      {displayCount}
    </Badge>
  );
};
