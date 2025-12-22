import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MobileMegaMenuSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  isDefaultOpen?: boolean;
}

export const MobileMegaMenuSection = ({ title, children, icon, isDefaultOpen = false }: MobileMegaMenuSectionProps) => {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        data-testid={`mobile-menu-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-3">
          {icon && <div style={{color: '#ff5833'}}>{icon}</div>}
          <span className="font-semibold text-sm text-gray-900 dark:text-white">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="pb-2 px-2 space-y-1 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

interface MobileMegaMenuItemProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  badge?: string;
}

export const MobileMegaMenuItem = ({ icon, title, description, onClick, badge }: MobileMegaMenuItemProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
      data-testid={`mobile-megamenu-item-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white">
              {title}
            </h4>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-foreground rounded-full">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};
