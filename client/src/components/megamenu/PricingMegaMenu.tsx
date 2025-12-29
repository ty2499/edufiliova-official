import { MegaMenu, MegaMenuCategory, MegaMenuGrid } from "./MegaMenu";
import { Coins, GraduationCap, ShoppingCart, Briefcase, Building2 } from "lucide-react";
import promoImage from "@assets/generated_images/modern_ui_dashboard_design.png";

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
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Student Pricing",
      description: "Affordable subscription plans for learners and students",
      page: "education-pricing",
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      title: "Customer Pricing",
      description: "Membership plans for buyers and customers",
      page: "customer-pricing",
    },
    {
      icon: <Briefcase className="h-5 w-5" />,
      title: "Freelancer Pricing",
      description: "Plans for creators and freelancers selling services",
      page: "creator-pricing",
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      title: "Teacher Pricing",
      description: "Commission rates and plans for educators",
      page: "teacher-pricing",
    },
  ];

  return (
    <MegaMenu 
      isOpen={isOpen}
      title="Choose Your Plan"
      subtitle="Find the perfect pricing plan for your needs. Whether you're learning, shopping, or selling, we have options for everyone."
      promoImage={promoImage}
      promoTitle="Flexible Plans"
      promoSubtitle="Start free, upgrade anytime"
      ctaText="Compare All Plans"
      ctaOnClick={() => handleNavigate("education-pricing")}
    >
      <div>
        <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Coins className="h-4 w-4 text-[#0C332C]" /> Pricing Plans
        </h3>
        <MegaMenuGrid columns={2}>
          {pricingOptions.map((item, index) => (
            <MegaMenuCategory
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              linkText="View Plans"
              testId={`megamenu-pricing-${index}`}
            />
          ))}
        </MegaMenuGrid>
      </div>
    </MegaMenu>
  );
};
