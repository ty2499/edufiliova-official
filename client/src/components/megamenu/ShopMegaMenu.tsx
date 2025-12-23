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
      bgColor: "bg-gradient-to-br from-orange-50 to-red-50",
      iconBg: "bg-primary/15",
    },
    {
      icon: <Tag className="h-5 w-5 text-rose-600" />,
      title: "Browse Designs",
      description: "Templates, graphics & creative assets",
      page: "product-shop",
      bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
      iconBg: "bg-rose-100",
    },
  ];

  const myAccount = [
    {
      icon: <FolderOpen className="h-5 w-5" />,
      title: "My Purchases",
      description: "Access your downloaded design assets",
      page: "customer-dashboard",
      bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
      iconBg: "bg-cyan-100",
    },
    {
      icon: <Gift className="h-5 w-5 text-primary" />,
      title: "Gift Vouchers",
      description: "Buy gift vouchers for friends",
      page: "buy-voucher",
      bgColor: "bg-gradient-to-br from-purple-50 to-indigo-50",
      iconBg: "bg-purple-100",
    },
  ];

  const sell = [
    {
      icon: <PlusCircle className="h-5 w-5" />,
      title: "Add Product",
      description: "List your products for sale",
      page: "product-creation",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
      iconBg: "bg-green-100",
    },
  ];

  return (
    <MegaMenu 
      isOpen={isOpen}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <MegaMenuSection title="Explore" icon={<ShoppingBag className="h-4 w-4 text-[#0C332C]" />}>
          {explore.map((item: any, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              bgColor={item.bgColor}
              iconBg={item.iconBg}
              testId={`megamenu-shop-explore-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>

        <MegaMenuSection title="My Account" icon={<FolderOpen className="h-4 w-4 text-[#0C332C]" />}>
          {myAccount.map((item: any, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              bgColor={item.bgColor}
              iconBg={item.iconBg}
              testId={`megamenu-shop-account-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>

        {isCreator && (
          <MegaMenuSection title="Sell" icon={<PlusCircle className="h-4 w-4 text-[#0C332C]" />}>
            {sell.map((item: any, index) => (
              <MegaMenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                bgColor={item.bgColor}
                iconBg={item.iconBg}
                testId={`megamenu-shop-sell-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))}
          </MegaMenuSection>
        )}
      </div>
    </MegaMenu>
  );
};
