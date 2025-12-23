import { useAuth } from "@/hooks/useAuth";
import { MegaMenu, MegaMenuItem, MegaMenuSection } from "./MegaMenu";
import { UserPlus, IdCard, Upload, Users2, Briefcase } from "lucide-react";

interface FreelanceMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export const FreelanceMegaMenu = ({ isOpen, onNavigate, onClose }: FreelanceMegaMenuProps) => {
  const { user, profile } = useAuth();
  const isCreator = user && (profile?.role === 'creator' || profile?.role === 'freelancer');

  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const startFreelancing = [
    {
      icon: <UserPlus className="h-5 w-5 " />,
      title: "Become a Freelancer",
      description: "Start your freelancing journey",
      page: "freelancer-signup-basic",
    },
  ];

  const portfolio = [
    {
      icon: <IdCard className="h-5 w-5" />,
      title: "My Portfolio",
      description: "View and manage your portfolio",
      page: "freelancer-profile",
    },
    {
      icon: <Upload className="h-5 w-5" />,
      title: "Create Portfolio",
      description: "Build your professional showcase",
      page: "portfolio-create",
    },
  ];

  const marketplace = [
    {
      icon: <Users2 className="h-5 w-5" />,
      title: "Find Talent",
      description: "Browse skilled freelancers",
      page: "portfolio-gallery",
    },
    {
      icon: <IdCard className="h-5 w-5" />,
      title: "Browse Portfolio",
      description: "Explore freelancer portfolios",
      page: "portfolio-gallery",
    },
  ];

  return (
    <MegaMenu 
      isOpen={isOpen}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <MegaMenuSection 
          title="Start Freelancing" 
          icon={<Briefcase className="h-4 w-4 text-[#0C332C]" />}
        >
          {startFreelancing.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              testId={`megamenu-freelance-start-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>

        {isCreator && (
          <MegaMenuSection 
            title="Portfolio" 
            icon={<IdCard className="h-4 w-4 text-[#0C332C]" />}
          >
            {portfolio.map((item, index) => (
              <MegaMenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                testId={`megamenu-freelance-portfolio-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))}
          </MegaMenuSection>
        )}

        <MegaMenuSection 
          title="Marketplace" 
          icon={<Users2 className="h-4 w-4 text-[#0C332C]" />}
        >
          {marketplace.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              testId={`megamenu-freelance-marketplace-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>
      </div>
    </MegaMenu>
  );
};
