import { ReactNode } from "react";

interface MegaMenuProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}

export const MegaMenu = ({ isOpen, children, className = "" }: MegaMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className={`w-screen mt-0 pointer-events-auto ${className}`}>
      <div className="container mx-auto px-6 md:px-10 lg:px-14 max-w-7xl">
        <div className="bg-[#2f5a4e] dark:bg-[#2f5a4e] backdrop-blur-xl rounded-2xl shadow-2xl border border-[#2f5a4e]/50 dark:border-[#2f5a4e]/50 p-6 animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
};

interface MegaMenuItemProps {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  badge?: string;
  testId?: string;
  image?: string;
  bgColor?: string;
  iconBg?: string;
  iconColor?: string;
}

export const MegaMenuItem = ({ icon, title, description, onClick, badge, testId, image, bgColor, iconBg, iconColor }: MegaMenuItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${bgColor || 'hover:bg-white/10 dark:hover:bg-white/10'}`}
      data-testid={testId}
    >
      <div className="flex items-start gap-3">
        {image ? (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className={`flex-shrink-0 w-12 h-12 ${iconBg || 'bg-[#a0fab2]'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`} style={{backgroundColor: iconBg ? undefined : '#a0fab2'}}>
            <div style={{color: iconColor || '#2f5a4e'}} className="text-lg">
              {icon}
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-[#2f5a4e] dark:text-[#2f5a4e] group-hover:text-[#2f5a4e] transition-colors whitespace-nowrap" transition-all duration-300>
            {title}
          </h4>
          {description && (
            <p className="text-xs text-[#2f5a4e]/70 dark:text-[#2f5a4e]/70 mt-1 line-clamp-1">
              {description}
            </p>
          )}
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full inline-block mt-1">
              {badge}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

interface MegaMenuSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export const MegaMenuSection = ({ title, children, className = "", icon }: MegaMenuSectionProps) => {
  // Check if children is empty
  const hasChildren = children && (Array.isArray(children) ? children.length > 0 : true);
  
  if (!hasChildren) {
    return null;
  }
  
  return (
    <div className={className}>
      {title && (
        <div className="flex items-center gap-2 mb-4 px-2">
          {icon && <div style={{color: '#a0fab2'}} className="text-base">{icon}</div>}
          <h3 className="text-xs font-semibold text-[#a0fab2] dark:text-[#a0fab2] uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

interface MegaMenuHighlightProps {
  image?: string;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  stats?: { label: string; value: string }[];
}

export const MegaMenuHighlight = ({ image, title, description, buttonText, onClick, stats }: MegaMenuHighlightProps) => {
  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 dark:from-white/10 dark:to-white/5 rounded-2xl p-6 h-full flex flex-col">
      {image && (
        <div className="mb-4 rounded-xl overflow-hidden h-32">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <h3 className="text-lg font-bold text-white dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-white/80 dark:text-white/80 mb-4 flex-1">{description}</p>
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-2 bg-white/10 dark:bg-white/10 rounded-lg">
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/70 dark:text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onClick}
        className="w-full bg-[#a0fab2] hover:bg-[#a0fab2]/90 hover:shadow-xl hover:scale-105 text-[#2f5a4e] font-semibold py-2.5 px-4 rounded-lg transition-all duration-200" transition-all duration-300
        data-testid="megamenu-highlight-action"
      >
        {buttonText}
      </button>
    </div>
  );
};
