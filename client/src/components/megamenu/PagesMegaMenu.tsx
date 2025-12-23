import { MegaMenu, MegaMenuItem, MegaMenuSection } from "./MegaMenu";
import { Info, Mail, Megaphone, HelpCircle, Shield, FileText, Users } from "lucide-react";

interface PagesMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export const PagesMegaMenu = ({ isOpen, onNavigate, onClose }: PagesMegaMenuProps) => {
  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const companyPages = [
    { icon: <Info className="h-5 w-5" />, title: "About Us", description: "Learn about our platform and mission", page: "about", bg: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10", bgIcon: "bg-[#a0fab2]", colorIcon: "#2f5a4e" },
    { icon: <Mail className="h-5 w-5" />, title: "Contact", description: "Get in touch with our team", page: "contact", bg: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10", bgIcon: "bg-[#a0fab2]", colorIcon: "#2f5a4e" },
    { icon: <Megaphone className="h-5 w-5" />, title: "Advertise With Us", description: "Explore advertising opportunities", page: "advertise-with-us", bg: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10", bgIcon: "bg-[#a0fab2]", colorIcon: "#2f5a4e" },
  ];

  const supportPages = [
    { icon: <HelpCircle className="h-5 w-5" />, title: "Help & Support", description: "Find answers and get support", page: "help", bg: "bg-primary/10" },
    { icon: <Shield className="h-5 w-5" />, title: "Privacy Policy", description: "How we protect your data", page: "privacy-policy", bg: "bg-primary/10" },
    { icon: <FileText className="h-5 w-5" />, title: "Terms of Service", description: "Our terms and conditions", page: "terms", bg: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10", bgIcon: "bg-[#a0fab2]", colorIcon: "#2f5a4e" },
    { icon: <Users className="h-5 w-5" />, title: "Community Guidelines", description: "Community standards and rules", page: "community-guidelines", bg: "bg-gradient-to-br from-[#2f5a4e]/10 to-[#a0fab2]/10", bgIcon: "bg-[#a0fab2]", colorIcon: "#2f5a4e" },
  ];

  return (
    <MegaMenu isOpen={isOpen}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <MegaMenuSection title="Company" icon={<Info className="h-4 w-4 text-[#a0fab2]" />}>
          {companyPages.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              iconBg={item.bgIcon}
              testId={`megamenu-pages-company-${index}`}
            />
          ))}
        </MegaMenuSection>

        <MegaMenuSection title="Support & Policies" icon={<Shield className="h-4 w-4 text-[#a0fab2]" />}>
          {supportPages.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              iconBg={item.bgIcon}
              testId={`megamenu-pages-support-${index}`}
            />
          ))}
        </MegaMenuSection>
      </div>
    </MegaMenu>
  );
};
