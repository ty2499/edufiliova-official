import { MegaMenu } from "./MegaMenu";
import { Coins, GraduationCap, ShoppingCart, Briefcase } from "lucide-react";

interface PricingMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export const PricingMegaMenu = ({ isOpen, onNavigate, onClose }: PricingMegaMenuProps) => {
  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const pricingOptions = [
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Student Pricing",
      description: "Affordable plans for learners",
      page: "education-pricing",
      iconBg: "bg-[#a0fab2]",
      iconColor: "text-[#0C332C]",
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: "Customer Pricing",
      description: "Plans for buyers and customers",
      page: "customer-pricing",
      iconBg: "bg-[#a0fab2]",
      iconColor: "text-[#0C332C]",
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Freelancer Pricing",
      description: "Plans for creators and freelancers",
      page: "creator-pricing",
      iconBg: "bg-[#a0fab2]",
      iconColor: "text-[#0C332C]",
    },
  ];

  return (
    <MegaMenu isOpen={isOpen}>
      <div className="w-full">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Coins className="h-4 w-4 text-[#a0fab2]" />
          <h3 className="text-xs font-semibold text-[#a0fab2] dark:text-[#a0fab2] uppercase tracking-wide">
            Choose Your Plan
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingOptions.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigate(item.page)}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all duration-200 group text-left transition-all duration-300"
              data-testid={`megamenu-pricing-${index}`}
            >
              <div className={`flex-shrink-0 w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <div className={item.iconColor}>
                  {item.icon}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#a0fab2] dark:text-[#a0fab2] group-hover:text-[#a0fab2] transition-colors transition-all duration-300">
                  {item.title}
                </h4>
                <p className="text-xs text-white dark:text-white mt-0.5">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </MegaMenu>
  );
};
