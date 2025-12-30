import { useAuth } from "@/hooks/useAuth";
import { MegaMenu, MegaMenuCategory, MegaMenuGrid } from "./MegaMenu";
import { 
  Store, Tag, FolderOpen, PlusCircle, ShoppingBag, Gift, 
  ShoppingCart, Palette, Image, FileText, Wallet, CreditCard
} from "lucide-react";
import promoImage from "@/assets/generated_images/creative_designer_with_tablet.png";

interface ShopMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export const ShopMegaMenu = ({ isOpen, onNavigate, onClose }: ShopMegaMenuProps) => {
  const { user, profile } = useAuth();
  const isCreator = user && (profile?.role === 'creator' || profile?.role === 'freelancer');

  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const getDashboardPage = () => {
    if (profile?.role === 'admin') return "admin-dashboard";
    if (profile?.role === 'teacher') return "teacher-dashboard";
    if (profile?.role === 'freelancer') return "freelancer-dashboard";
    if (profile?.role === 'general') return "customer-dashboard";
    return "student-dashboard";
  };

  const exploreItems = [
    {
      icon: <Store className="h-5 w-5" />,
      title: "Design Marketplace",
      description: "Discover premium design resources and templates",
      page: "product-shop",
    },
    {
      icon: <Tag className="h-5 w-5" />,
      title: "Browse Designs",
      description: "Templates, graphics and creative assets",
      page: "product-shop",
    },
    {
      icon: <Palette className="h-5 w-5" />,
      title: "Categories",
      description: "Browse by design categories",
      page: "category-management",
    },
  ];

  const accountItems = [
    {
      icon: <FolderOpen className="h-5 w-5" />,
      title: "My Purchases",
      description: "Access your downloaded design assets",
      page: getDashboardPage(),
      requiresAuth: true,
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      title: "My Cart",
      description: "View items in your shopping cart",
      page: "cart",
    },
    {
      icon: <Gift className="h-5 w-5" />,
      title: "Gift Vouchers",
      description: "Buy gift vouchers for friends and family",
      page: "buy-voucher",
    },
  ];

  const sellItems = [
    {
      icon: <PlusCircle className="h-5 w-5" />,
      title: "Add Product",
      description: "List your digital products for sale",
      page: "freelancer-dashboard",
      requiresCreator: true,
    },
    {
      icon: <Image className="h-5 w-5" />,
      title: "My Products",
      description: "Manage your listed products",
      page: "freelancer-dashboard",
      requiresCreator: true,
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      title: "Sales & Earnings",
      description: "Track your sales and revenue",
      page: "creator-earnings",
      requiresCreator: true,
    },
  ];

  const pricingItems = [
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Customer Plans",
      description: "Membership plans for buyers",
      page: "customer-pricing",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Creator Plans",
      description: "Plans for sellers and creators",
      page: "creator-pricing",
    },
  ];

  const filteredAccount = accountItems.filter(item => !item.requiresAuth || user);
  const filteredSell = sellItems.filter(item => !item.requiresCreator || isCreator);

  return (
    <MegaMenu 
      isOpen={isOpen}
      title="Creative Space"
      subtitle="Discover premium design resources, templates, and creative assets from talented creators."
      promoImage={promoImage}
      promoTitle="Shop Digital Products"
      promoSubtitle="Premium designs, templates & creative assets"
      ctaText="Explore Now"
      ctaOnClick={() => handleNavigate("product-shop")}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Store className="h-4 w-4 text-[#0C332C]" /> Explore
          </h3>
          <MegaMenuGrid columns={3}>
            {exploreItems.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Browse"
                testId={`megamenu-shop-explore-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-[#0C332C]" /> My Account
          </h3>
          <MegaMenuGrid columns={3}>
            {filteredAccount.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Open"
                testId={`megamenu-shop-account-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        {filteredSell.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-[#0C332C]" /> Sell Your Work
            </h3>
            <MegaMenuGrid columns={3}>
              {filteredSell.map((item, index) => (
                <MegaMenuCategory
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  onClick={() => handleNavigate(item.page)}
                  linkText="Manage"
                  testId={`megamenu-shop-sell-${index}`}
                />
              ))}
            </MegaMenuGrid>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#0C332C]" /> Pricing
          </h3>
          <MegaMenuGrid columns={2}>
            {pricingItems.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="View Plans"
                testId={`megamenu-shop-pricing-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>
      </div>
    </MegaMenu>
  );
};
