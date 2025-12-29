import { ReactNode } from "react";

interface MegaMenuProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  promoImage?: string;
  promoTitle?: string;
  promoSubtitle?: string;
  ctaText?: string;
  ctaOnClick?: () => void;
}

export const MegaMenu = ({ 
  isOpen, 
  children, 
  className = "",
  title,
  subtitle,
  promoImage,
  promoTitle,
  promoSubtitle,
  ctaText,
  ctaOnClick
}: MegaMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className={`w-screen mt-0 pointer-events-auto ${className}`}>
      <div className="container mx-auto px-3 sm:px-6 md:px-10 lg:px-14 max-w-7xl">
        <div className="bg-white dark:bg-gray-900 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 animate-fade-in outline-none focus:outline-none max-h-[85vh] overflow-y-auto">
          {(title || subtitle) && (
            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              {title && (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-8">
            <div className="flex-1">
              {children}
            </div>
            
            {promoImage && (
              <div className="hidden lg:block w-72 flex-shrink-0">
                <div className="relative h-full min-h-[320px] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600">
                  <img 
                    src={promoImage} 
                    alt={promoTitle || "Promotion"} 
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-emerald-700/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    {promoTitle && (
                      <h3 className="text-2xl font-bold mb-1 leading-tight">
                        {promoTitle}
                      </h3>
                    )}
                    {promoSubtitle && (
                      <p className="text-sm text-emerald-100 mb-3 opacity-90">
                        {promoSubtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {ctaText && ctaOnClick && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={ctaOnClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-full hover:from-rose-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {ctaText}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MegaMenuCategoryProps {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  linkText?: string;
  comingSoon?: boolean;
  testId?: string;
}

export const MegaMenuCategory = ({ 
  icon, 
  title, 
  description, 
  onClick, 
  linkText = "Explore",
  comingSoon = false,
  testId
}: MegaMenuCategoryProps) => {
  return (
    <div 
      className="group cursor-pointer p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
      onClick={!comingSoon ? onClick : undefined}
      data-testid={testId}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5 flex items-center gap-2">
            {title}
            {comingSoon && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                Soon
              </span>
            )}
          </h4>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              {description}
            </p>
          )}
          {!comingSoon ? (
            <span className="text-xs font-semibold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              {linkText}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-600">
              Coming Soon
            </span>
          )}
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
      className={`w-full text-left p-3 sm:p-4 rounded-lg transition-all duration-200 group active:scale-95 hover:bg-gray-50 dark:hover:bg-gray-800/50`}
      data-testid={testId}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {image ? (
          <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 rounded-lg overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className={`flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 ${iconBg || 'bg-emerald-50 dark:bg-emerald-900/30'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <div className={`text-base sm:text-lg ${iconColor || 'text-emerald-600 dark:text-emerald-400'}`}>
              {icon}
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 line-clamp-1">
              {description}
            </p>
          )}
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500 text-white rounded-full inline-block mt-1">
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
  const hasChildren = children && (Array.isArray(children) ? children.length > 0 : true);
  
  if (!hasChildren) {
    return null;
  }
  
  return (
    <div className={className}>
      {title && (
        <div className="flex items-center gap-2 mb-3 px-1 sm:px-2">
          {icon && <div className="text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">{icon}</div>}
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
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
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 h-full flex flex-col border border-emerald-100 dark:border-emerald-800/50">
      {image && (
        <div className="mb-4 rounded-xl overflow-hidden h-32">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">{description}</p>
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onClick}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]"
        data-testid="megamenu-highlight-action"
      >
        {buttonText}
      </button>
    </div>
  );
};

interface MegaMenuGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export const MegaMenuGrid = ({ children, columns = 3 }: MegaMenuGridProps) => {
  const colsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };
  
  return (
    <div className={`grid ${colsClass[columns]} gap-2`}>
      {children}
    </div>
  );
};
