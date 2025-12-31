import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MegaMenu, MegaMenuCategory, MegaMenuGrid } from "./MegaMenu";
import { 
  UserPlus, IdCard, Upload, Users2, Briefcase, ShoppingBag, 
  Star, Wallet, Settings, BarChart3, FileText, CreditCard
} from "lucide-react";
const promoImage = "https://wnr.1d5.myftpupload.com/wp-content/uploads/2025/12/freelancer_working_at_home.png";

interface FreelanceMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export const FreelanceMegaMenu = ({ isOpen, onNavigate, onClose }: FreelanceMegaMenuProps) => {
  const { user, profile } = useAuth();
  const [, navigate] = useLocation();
  const isCreator = user && (profile?.role === 'creator' || profile?.role === 'freelancer');

  const { data: applicationData } = useQuery({
    queryKey: ['/api/freelancer/application-status'],
    enabled: !!user && !isCreator,
  });
  
  const application = applicationData as { status: string } | undefined;
  const hasPendingApplication = application?.status === 'pending' || 
                                 application?.status === 'under_review';

  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const handleRouteNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const getStartedItems = [
    {
      icon: <UserPlus className="h-5 w-5" />,
      title: "Become a Freelancer",
      description: "Start your freelancing journey and offer your services",
      page: "freelancer-signup-basic",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Freelancer Pricing",
      description: "View pricing plans and commission rates",
      page: "creator-pricing",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Application Status",
      description: "Check your freelancer application status",
      page: "freelancer-application-status",
      requiresAuth: true,
      requiresPendingApplication: true,
    },
  ];

  const portfolioItems = [
    {
      icon: <IdCard className="h-5 w-5" />,
      title: "My Profile",
      description: "View and manage your freelancer profile",
      page: "freelancer-profile",
      requiresCreator: true,
    },
    {
      icon: <Upload className="h-5 w-5" />,
      title: "Create Portfolio",
      description: "Build your professional portfolio showcase",
      page: "portfolio-create",
      requiresCreator: true,
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "My Services",
      description: "Manage services you offer to clients",
      page: "freelancer-services",
      requiresCreator: true,
    },
  ];

  const marketplaceItems = [
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      title: "Browse Services",
      description: "Find services from talented freelancers",
      route: "/marketplace/services",
    },
    {
      icon: <Users2 className="h-5 w-5" />,
      title: "Find Talent",
      description: "Browse skilled freelancers for your projects",
      page: "find-talent",
    },
    {
      icon: <IdCard className="h-5 w-5" />,
      title: "Browse Portfolios",
      description: "Explore freelancer portfolios and work samples",
      page: "portfolio-gallery",
    },
  ];

  const dashboardItems = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Dashboard",
      description: "View your freelancer analytics and stats",
      page: "freelancer-dashboard",
      requiresCreator: true,
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      title: "Earnings",
      description: "Track your revenue and payouts",
      page: "creator-earnings",
      requiresCreator: true,
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Settings",
      description: "Manage your freelancer preferences",
      page: "freelancer-dashboard",
      requiresCreator: true,
    },
  ];

  const filteredGetStarted = getStartedItems.filter(item => {
    if (item.requiresPendingApplication && !hasPendingApplication) return false;
    if (item.requiresAuth && !user) return false;
    return true;
  });
  const filteredPortfolio = portfolioItems.filter(item => !item.requiresCreator || isCreator);
  const filteredDashboard = dashboardItems.filter(item => !item.requiresCreator || isCreator);

  return (
    <MegaMenu 
      isOpen={isOpen}
      title="Freelance Marketplace"
      subtitle="Join our community of talented freelancers or find the perfect professional for your project."
      promoImage={promoImage}
      promoTitle="Hire a Freelancer"
      promoSubtitle="Find skilled professionals for any project"
      ctaText="Browse Talent"
      ctaOnClick={() => handleNavigate("freelancer-signup-basic")}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#0C332C]" /> Get Started
          </h3>
          <MegaMenuGrid columns={3}>
            {filteredGetStarted.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Learn More"
                testId={`megamenu-freelance-start-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#0C332C]" /> Marketplace
          </h3>
          <MegaMenuGrid columns={3}>
            {marketplaceItems.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => item.route ? handleRouteNavigate(item.route) : handleNavigate(item.page!)}
                linkText="Browse"
                testId={`megamenu-freelance-marketplace-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        {filteredPortfolio.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
              <IdCard className="h-4 w-4 text-[#0C332C]" /> Portfolio & Services
            </h3>
            <MegaMenuGrid columns={3}>
              {filteredPortfolio.map((item, index) => (
                <MegaMenuCategory
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  onClick={() => handleNavigate(item.page)}
                  linkText="Open"
                  testId={`megamenu-freelance-portfolio-${index}`}
                />
              ))}
            </MegaMenuGrid>
          </div>
        )}

        {filteredDashboard.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#0C332C]" /> Dashboard & Earnings
            </h3>
            <MegaMenuGrid columns={3}>
              {filteredDashboard.map((item, index) => (
                <MegaMenuCategory
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  onClick={() => handleNavigate(item.page)}
                  linkText="View"
                  testId={`megamenu-freelance-dashboard-${index}`}
                />
              ))}
            </MegaMenuGrid>
          </div>
        )}
      </div>
    </MegaMenu>
  );
};
