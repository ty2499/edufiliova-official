import { useAuth } from "@/hooks/useAuth";
import { MegaMenu, MegaMenuItem, MegaMenuSection } from "./MegaMenu";
import { Store, Tag, FolderOpen, PlusCircle, ShoppingBag, Gift } from "lucide-react";

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

  const explore = [
    {
      icon: <Store className="h-5 w-5" />,
      title: "Design Marketplace",
      description: "Discover premium design resources",
      page: "product-shop",
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
    {
      icon: <Tag className="h-5 w-5" />,
      title: "Browse Designs",
      description: "Templates, graphics & creative assets",
      page: "product-shop",
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
  ];

  const getDashboardPage = () => {
    if (profile?.role === 'admin') return "admin-dashboard";
    if (profile?.role === 'teacher') return "teacher-dashboard";
    if (profile?.role === 'freelancer') return "freelancer-dashboard";
    if (profile?.role === 'general') return "customer-dashboard";
    return "student-dashboard";
  };

  const myAccount = [
    {
      icon: <FolderOpen className="h-5 w-5" />,
      title: "My Purchases",
      description: "Access your downloaded design assets",
      page: getDashboardPage(),
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
    {
      icon: <Gift className="h-5 w-5" />,
      title: "Gift Vouchers",
      description: "Buy gift vouchers for friends",
      page: "buy-voucher",
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
  ];

  const sell = [
    {
      icon: <PlusCircle className="h-5 w-5" />,
      title: "Add Product",
      description: "List your products for sale",
      page: "product-creation",
      bgColor: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10",
      iconBg: "bg-[#a0fab2]",
      iconColor: "#2f5a4e",
    },
  ];

  return (
    <MegaMenu 
      isOpen={isOpen}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <MegaMenuSection title="Explore" icon={<ShoppingBag className="h-4 w-4 text-[#a0fab2]" />}>
          {explore.map((item: any, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              bgColor={item.bgColor}
              iconBg={item.iconBg}
              iconColor={item.iconColor}
              testId={`megamenu-shop-explore-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>

        {user && (
          <MegaMenuSection title="My Account" icon={<FolderOpen className="h-4 w-4 text-[#a0fab2]" />}>
            {myAccount.map((item: any, index) => (
              <MegaMenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                bgColor={item.bgColor}
                iconBg={item.iconBg}
                iconColor={item.iconColor}
                testId={`megamenu-shop-account-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))}
          </MegaMenuSection>
        )}

        {isCreator && (
          <MegaMenuSection title="Sell" icon={<PlusCircle className="h-4 w-4 text-[#a0fab2]" />}>
            {sell.map((item: any, index) => (
              <MegaMenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                bgColor={item.bgColor}
                iconBg={item.iconBg}
                iconColor={item.iconColor}
                testId={`megamenu-shop-sell-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))}
          </MegaMenuSection>
        )}
      </div>
    </MegaMenu>
  );
};
