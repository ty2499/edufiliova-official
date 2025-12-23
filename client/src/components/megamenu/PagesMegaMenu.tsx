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
    { icon: <Info className="h-5 w-5" />, title: "About Us", description: "Learn about our platform and mission", page: "about", bg: "bg-blue-50" },
    { icon: <Mail className="h-5 w-5" />, title: "Contact", description: "Get in touch with our team", page: "contact", bg: "bg-green-50" },
    { icon: <Megaphone className="h-5 w-5" />, title: "Advertise With Us", description: "Explore advertising opportunities", page: "advertise-with-us", bg: "bg-purple-50" },
  ];

  const supportPages = [
    { icon: <HelpCircle className="h-5 w-5" />, title: "Help & Support", description: "Find answers and get support", page: "help", bg: "bg-primary/10" },
    { icon: <Shield className="h-5 w-5" />, title: "Privacy Policy", description: "How we protect your data", page: "privacy-policy", bg: "bg-primary/10" },
    { icon: <FileText className="h-5 w-5" />, title: "Terms of Service", description: "Our terms and conditions", page: "terms", bg: "bg-indigo-50" },
    { icon: <Users className="h-5 w-5" />, title: "Community Guidelines", description: "Community standards and rules", page: "community-guidelines", bg: "bg-pink-50" },
  ];

  return (
    <MegaMenu isOpen={isOpen}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <MegaMenuSection title="Company">
          {companyPages.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              iconBg={item.bg}
              testId={`megamenu-pages-company-${index}`}
            />
          ))}
        </MegaMenuSection>

        <MegaMenuSection title="Support & Policies">
          {supportPages.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              iconBg={item.bg}
              testId={`megamenu-pages-support-${index}`}
            />
          ))}
        </MegaMenuSection>
      </div>
    </MegaMenu>
  );
};
