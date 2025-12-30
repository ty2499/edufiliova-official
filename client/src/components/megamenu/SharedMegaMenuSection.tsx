import { ReactNode } from "react";

interface SharedMegaMenuSectionProps {
  title: string;
  items: {
    icon: ReactNode;
    title: string;
    description?: string;
    onClick: () => void;
    iconBg?: string;
    iconColor?: string;
  }[];
  onNavigate: (page: string) => void;
  onClose: () => void;
  icon?: ReactNode;
}

export const SharedMegaMenuSection = ({ title, items, onNavigate, onClose, icon }: SharedMegaMenuSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2 border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">
        {icon && <div className="text-[#a0fab2]">{icon}</div>}
        <h3 className="text-xs font-bold text-[#a0fab2] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group flex items-start gap-3"
          >
            <div className={`flex-shrink-0 w-10 h-10 ${item.iconBg || 'bg-[#a0fab2]'} rounded-lg flex items-center justify-center`}>
              <div style={{ color: item.iconColor || '#2f5a4e' }}>
                {item.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                {item.title}
              </div>
              {item.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {item.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
