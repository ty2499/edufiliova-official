import { MegaMenu, MegaMenuCategory, MegaMenuGrid } from "./MegaMenu";
import { 
  Info, Mail, Megaphone, HelpCircle, Shield, FileText, Users, BookOpen, 
  GraduationCap, Briefcase, Store, CreditCard, Award, FileCheck, Settings,
  Wallet, ShoppingCart, Receipt, Building2, MessageSquare, Cookie,
  RefreshCcw, Phone, Scale, AlertCircle, BookMarked, LayoutGrid
} from "lucide-react";
import promoImage from "@assets/generated_images/professional_woman_at_laptop.png";

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
    { icon: <Info className="h-5 w-5" />, title: "About Us", description: "Learn about our platform mission and team", page: "about" },
    { icon: <Mail className="h-5 w-5" />, title: "Contact Us", description: "Get in touch with our support team", page: "contact" },
    { icon: <Megaphone className="h-5 w-5" />, title: "Advertise With Us", description: "Explore advertising opportunities on our platform", page: "advertise-with-us" },
    { icon: <BookMarked className="h-5 w-5" />, title: "Blog", description: "Read our latest articles and updates", page: "blog" },
  ];

  const educationPages = [
    { icon: <BookOpen className="h-5 w-5" />, title: "Browse Courses", description: "Explore our complete course catalog", page: "course-browse" },
    { icon: <GraduationCap className="h-5 w-5" />, title: "Become a Teacher", description: "Join our teaching community", page: "teacher-application" },
    { icon: <Award className="h-5 w-5" />, title: "Certificates", description: "View and claim your earned certificates", page: "my-certificates" },
    { icon: <FileCheck className="h-5 w-5" />, title: "Verify Certificate", description: "Verify authenticity of certificates", page: "verify-certificate" },
  ];

  const marketplacePages = [
    { icon: <Store className="h-5 w-5" />, title: "Creative Shop", description: "Browse digital products and artwork", page: "product-shop" },
    { icon: <Briefcase className="h-5 w-5" />, title: "Freelance Marketplace", description: "Find talented freelancers and services", page: "portfolio-gallery" },
    { icon: <LayoutGrid className="h-5 w-5" />, title: "Find Talent", description: "Discover skilled professionals", page: "find-talent" },
    { icon: <Users className="h-5 w-5" />, title: "Community", description: "Connect with creators and learners", page: "community" },
  ];

  const accountPages = [
    { icon: <Settings className="h-5 w-5" />, title: "Study Settings", description: "Customize your learning experience", page: "study-settings" },
    { icon: <Wallet className="h-5 w-5" />, title: "Wallet", description: "Manage your account balance", page: "wallet" },
    { icon: <ShoppingCart className="h-5 w-5" />, title: "Cart", description: "View items in your shopping cart", page: "cart" },
    { icon: <Receipt className="h-5 w-5" />, title: "Order Tracker", description: "Track your orders and purchases", page: "order-tracker" },
  ];

  const pricingPages = [
    { icon: <CreditCard className="h-5 w-5" />, title: "Customer Pricing", description: "Plans for buyers and shoppers", page: "customer-pricing" },
    { icon: <Briefcase className="h-5 w-5" />, title: "Creator Pricing", description: "Plans for sellers and creators", page: "creator-pricing" },
    { icon: <GraduationCap className="h-5 w-5" />, title: "Education Pricing", description: "Student subscription plans", page: "education-pricing" },
    { icon: <Building2 className="h-5 w-5" />, title: "Teacher Pricing", description: "Plans for educators", page: "teacher-pricing" },
  ];

  const legalPages = [
    { icon: <Shield className="h-5 w-5" />, title: "Privacy Policy", description: "How we protect your personal data", page: "privacy-policy" },
    { icon: <FileText className="h-5 w-5" />, title: "Terms of Service", description: "Our terms and conditions", page: "terms" },
    { icon: <Users className="h-5 w-5" />, title: "Community Guidelines", description: "Rules and standards for our community", page: "community-guidelines" },
    { icon: <Scale className="h-5 w-5" />, title: "Copyright & DMCA", description: "Intellectual property policies", page: "copyright-dmca" },
    { icon: <Cookie className="h-5 w-5" />, title: "Cookies Policy", description: "How we use cookies", page: "cookies-policy" },
    { icon: <RefreshCcw className="h-5 w-5" />, title: "Refund Policy", description: "Our refund and return policy", page: "refund-policy" },
  ];

  const supportPages = [
    { icon: <HelpCircle className="h-5 w-5" />, title: "Help Center", description: "Find answers and get support", page: "help" },
    { icon: <MessageSquare className="h-5 w-5" />, title: "Chat Terms", description: "Messaging guidelines and policies", page: "chat-terms" },
    { icon: <Phone className="h-5 w-5" />, title: "WhatsApp Policy", description: "WhatsApp communication guidelines", page: "whatsapp-policy" },
    { icon: <AlertCircle className="h-5 w-5" />, title: "Data Retention", description: "How we handle your data", page: "data-retention" },
  ];

  return (
    <MegaMenu 
      isOpen={isOpen}
      title="Explore All Pages"
      subtitle="Discover all the features and resources available on our platform. Find exactly what you're looking for."
      promoImage={promoImage}
      promoTitle="Filiova"
      promoSubtitle="Your all-in-one platform for learning, creating, and growing"
      ctaText="Get Started Today"
      ctaOnClick={() => handleNavigate("get-started")}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" /> Company
          </h3>
          <MegaMenuGrid columns={4}>
            {companyPages.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Visit"
                testId={`megamenu-pages-company-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Education
          </h3>
          <MegaMenuGrid columns={4}>
            {educationPages.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Explore"
                testId={`megamenu-pages-education-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Store className="h-4 w-4" /> Marketplace
          </h3>
          <MegaMenuGrid columns={4}>
            {marketplacePages.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Browse"
                testId={`megamenu-pages-marketplace-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Pricing Plans
          </h3>
          <MegaMenuGrid columns={4}>
            {pricingPages.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="View Plans"
                testId={`megamenu-pages-pricing-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4" /> Account & Orders
          </h3>
          <MegaMenuGrid columns={4}>
            {accountPages.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Manage"
                testId={`megamenu-pages-account-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> Help & Support
          </h3>
          <MegaMenuGrid columns={4}>
            {supportPages.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Learn More"
                testId={`megamenu-pages-support-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Legal & Policies
          </h3>
          <MegaMenuGrid columns={3}>
            {legalPages.map((item, index) => (
              <MegaMenuCategory
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => handleNavigate(item.page)}
                linkText="Read"
                testId={`megamenu-pages-legal-${index}`}
              />
            ))}
          </MegaMenuGrid>
        </div>
      </div>
    </MegaMenu>
  );
};
