import { useState } from "react";
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { 
  Search, Library, Award, BookOpen, Video, ClipboardCheck, Users, GraduationCap,
  UserPlus, FilePlus, Layers, Calendar, BarChart3, Wallet, Settings, CreditCard,
  IdCard, Upload, Star, ShoppingBag, Users2, Briefcase,
  Store, Tag, FolderOpen, PlusCircle, Gift, ShoppingCart, Palette, Image,
  Coins, Building2, Gauge, MessageSquare,
  Info, Mail, Megaphone, HelpCircle, Shield, FileText, Receipt, Cookie, RefreshCcw, Phone, Scale, AlertCircle, BookMarked, LayoutGrid
} from "lucide-react";

interface MobileNavLink {
  icon: React.ReactNode;
  title: string;
  page: string;
}

interface MobileNavSection {
  title: string;
  icon: React.ReactNode;
  links: MobileNavLink[];
}

interface MobileNavMenuProps {
  onNavigate: (page: string) => void;
  onClose: () => void;
  isAuthenticated?: boolean;
  userRole?: string;
}

export const MobileNavMenu = ({ onNavigate, onClose, isAuthenticated = false, userRole }: MobileNavMenuProps) => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openSubSection, setOpenSubSection] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
    setOpenSubSection(null);
  };

  const toggleSubSection = (subSection: string) => {
    setOpenSubSection(openSubSection === subSection ? null : subSection);
  };

  const learnSections: MobileNavSection[] = [
    {
      title: "EXPLORE",
      icon: <Search className="h-4 w-4" />,
      links: [
        { icon: <Search className="h-4 w-4" />, title: "Browse Courses", page: "course-browse" },
        { icon: <BookOpen className="h-4 w-4" />, title: "Study Materials", page: "study-settings" },
        { icon: <Video className="h-4 w-4" />, title: "Live Classes", page: "student-meetings" },
      ]
    },
    {
      title: "MY LEARNING",
      icon: <Library className="h-4 w-4" />,
      links: [
        { icon: <Library className="h-4 w-4" />, title: "My Subjects", page: "student-dashboard" },
        { icon: <ClipboardCheck className="h-4 w-4" />, title: "Assignments", page: "student-dashboard" },
        { icon: <Users className="h-4 w-4" />, title: "Student Network", page: "student-networking" },
      ]
    },
    {
      title: "CERTIFICATES",
      icon: <Award className="h-4 w-4" />,
      links: [
        { icon: <Award className="h-4 w-4" />, title: "My Certificates", page: "my-certificates" },
        { icon: <GraduationCap className="h-4 w-4" />, title: "Verify Certificate", page: "verify-certificate" },
      ]
    },
  ];

  const teacherSections: MobileNavSection[] = [
    {
      title: "GET STARTED",
      icon: <UserPlus className="h-4 w-4" />,
      links: [
        { icon: <UserPlus className="h-4 w-4" />, title: "Become a Teacher", page: "teacher-application" },
        { icon: <CreditCard className="h-4 w-4" />, title: "Teacher Pricing", page: "teacher-pricing" },
        { icon: <ClipboardCheck className="h-4 w-4" />, title: "Application Status", page: "teacher-status" },
      ]
    },
    {
      title: "TEACHING TOOLS",
      icon: <BookOpen className="h-4 w-4" />,
      links: [
        { icon: <FilePlus className="h-4 w-4" />, title: "Create Course", page: "course-creator" },
        { icon: <Layers className="h-4 w-4" />, title: "Subject Creator", page: "subject-creator" },
        { icon: <BookOpen className="h-4 w-4" />, title: "Assignments", page: "teacher-dashboard" },
      ]
    },
    {
      title: "MANAGE",
      icon: <Users className="h-4 w-4" />,
      links: [
        { icon: <Users className="h-4 w-4" />, title: "My Students", page: "teacher-dashboard" },
        { icon: <Video className="h-4 w-4" />, title: "Live Sessions", page: "teacher-meetings" },
        { icon: <Calendar className="h-4 w-4" />, title: "Schedule", page: "meeting-scheduler" },
      ]
    },
  ];

  const freelanceSections: MobileNavSection[] = [
    {
      title: "GET STARTED",
      icon: <UserPlus className="h-4 w-4" />,
      links: [
        { icon: <UserPlus className="h-4 w-4" />, title: "Become a Freelancer", page: "freelancer-signup-basic" },
        { icon: <CreditCard className="h-4 w-4" />, title: "Freelancer Pricing", page: "creator-pricing" },
        { icon: <FileText className="h-4 w-4" />, title: "Application Status", page: "freelancer-application-status" },
      ]
    },
    {
      title: "MARKETPLACE",
      icon: <ShoppingBag className="h-4 w-4" />,
      links: [
        { icon: <ShoppingBag className="h-4 w-4" />, title: "Browse Services", page: "marketplace-services" },
        { icon: <Users2 className="h-4 w-4" />, title: "Find Talent", page: "find-talent" },
        { icon: <IdCard className="h-4 w-4" />, title: "Browse Portfolios", page: "portfolio-gallery" },
      ]
    },
    {
      title: "MY PORTFOLIO",
      icon: <IdCard className="h-4 w-4" />,
      links: [
        { icon: <IdCard className="h-4 w-4" />, title: "My Profile", page: "freelancer-profile" },
        { icon: <Upload className="h-4 w-4" />, title: "Create Portfolio", page: "portfolio-create" },
        { icon: <Star className="h-4 w-4" />, title: "My Services", page: "freelancer-services" },
      ]
    },
  ];

  const shopSections: MobileNavSection[] = [
    {
      title: "EXPLORE",
      icon: <Store className="h-4 w-4" />,
      links: [
        { icon: <Store className="h-4 w-4" />, title: "Design Marketplace", page: "product-shop" },
        { icon: <Tag className="h-4 w-4" />, title: "Browse Designs", page: "product-shop" },
        { icon: <Palette className="h-4 w-4" />, title: "Categories", page: "category-management" },
      ]
    },
    {
      title: "MY ACCOUNT",
      icon: <FolderOpen className="h-4 w-4" />,
      links: [
        { icon: <FolderOpen className="h-4 w-4" />, title: "My Purchases", page: "customer-dashboard" },
        { icon: <ShoppingCart className="h-4 w-4" />, title: "My Cart", page: "cart" },
        { icon: <Gift className="h-4 w-4" />, title: "Gift Vouchers", page: "buy-voucher" },
      ]
    },
    {
      title: "SELL YOUR WORK",
      icon: <PlusCircle className="h-4 w-4" />,
      links: [
        { icon: <PlusCircle className="h-4 w-4" />, title: "Add Product", page: "freelancer-dashboard" },
        { icon: <Image className="h-4 w-4" />, title: "My Products", page: "freelancer-dashboard" },
        { icon: <Wallet className="h-4 w-4" />, title: "Sales & Earnings", page: "creator-earnings" },
      ]
    },
  ];

  const pricingSections: MobileNavSection[] = [
    {
      title: "PRICING PLANS",
      icon: <Coins className="h-4 w-4" />,
      links: [
        { icon: <GraduationCap className="h-4 w-4" />, title: "Student Pricing", page: "education-pricing" },
        { icon: <ShoppingCart className="h-4 w-4" />, title: "Customer Pricing", page: "customer-pricing" },
        { icon: <Briefcase className="h-4 w-4" />, title: "Freelancer Pricing", page: "creator-pricing" },
        { icon: <Building2 className="h-4 w-4" />, title: "Teacher Pricing", page: "teacher-pricing" },
      ]
    },
  ];

  const pagesSections: MobileNavSection[] = [
    {
      title: "COMPANY",
      icon: <Info className="h-4 w-4" />,
      links: [
        { icon: <Info className="h-4 w-4" />, title: "About Us", page: "about" },
        { icon: <Mail className="h-4 w-4" />, title: "Contact Us", page: "contact" },
        { icon: <Megaphone className="h-4 w-4" />, title: "Advertise With Us", page: "advertise-with-us" },
        { icon: <BookMarked className="h-4 w-4" />, title: "Blog", page: "blog" },
      ]
    },
    {
      title: "SUPPORT",
      icon: <HelpCircle className="h-4 w-4" />,
      links: [
        { icon: <HelpCircle className="h-4 w-4" />, title: "Help Center", page: "help" },
        { icon: <MessageSquare className="h-4 w-4" />, title: "Chat Terms", page: "chat-terms" },
        { icon: <Phone className="h-4 w-4" />, title: "WhatsApp Policy", page: "whatsapp-policy" },
      ]
    },
    {
      title: "LEGAL",
      icon: <Shield className="h-4 w-4" />,
      links: [
        { icon: <Shield className="h-4 w-4" />, title: "Privacy Policy", page: "privacy-policy" },
        { icon: <FileText className="h-4 w-4" />, title: "Terms of Service", page: "terms" },
        { icon: <Users className="h-4 w-4" />, title: "Community Guidelines", page: "community-guidelines" },
        { icon: <Cookie className="h-4 w-4" />, title: "Cookies Policy", page: "cookies-policy" },
        { icon: <RefreshCcw className="h-4 w-4" />, title: "Refund Policy", page: "refund-policy" },
      ]
    },
  ];

  const renderSection = (section: MobileNavSection) => (
    <div key={section.title} className="mb-4">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-[#0C332C]">{section.icon}</span>
        <span className="text-xs font-semibold text-[#0C332C]/60 uppercase tracking-wide">{section.title}</span>
      </div>
      <div className="space-y-0">
        {section.links.map((link, idx) => (
          <button
            key={idx}
            onClick={() => handleNavigate(link.page)}
            className="w-full text-left px-6 py-2.5 text-sm text-[#0C332C] hover:bg-gray-50 flex items-center gap-3"
          >
            {link.title}
          </button>
        ))}
      </div>
    </div>
  );

  const renderNavItem = (title: string, sections: MobileNavSection[], ctaText?: string, ctaPage?: string) => {
    const isOpen = openSection === title;
    return (
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection(title)}
          className="w-full text-left px-4 py-3.5 text-base font-medium text-[#0C332C] hover:bg-gray-50 flex items-center justify-between"
        >
          {title}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="bg-white border-t border-gray-100">
            {sections.map(renderSection)}
            {ctaText && ctaPage && (
              <button
                onClick={() => handleNavigate(ctaPage)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[#0C332C] border-t border-gray-100 hover:bg-gray-50"
              >
                {ctaText}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSimpleNavItem = (title: string, page: string) => (
    <div className="border-b border-gray-100">
      <button
        onClick={() => handleNavigate(page)}
        className="w-full text-left px-4 py-3.5 text-base font-medium text-[#0C332C] hover:bg-gray-50"
      >
        {title}
      </button>
    </div>
  );

  return (
    <div className="bg-white">
      {renderNavItem("Learn", learnSections, "Browse All Courses", "course-browse")}
      {(!isAuthenticated || userRole === 'teacher' || userRole === 'admin') && 
        renderNavItem("Teachers", teacherSections, "Start Teaching", "teacher-application")}
      {renderNavItem("Freelancers", freelanceSections, "Start Freelancing", "freelancer-signup-basic")}
      {renderNavItem("Creative Space", shopSections, "Browse Marketplace", "product-shop")}
      {renderNavItem("Pricing", pricingSections)}
      {renderSimpleNavItem("Blog", "blog")}
      {renderSimpleNavItem("About Us", "about")}
      {renderNavItem("Pages", pagesSections)}

      {/* Sign In / Account Button */}
      <div className="p-4 border-t border-gray-100">
        {isAuthenticated ? (
          <button
            onClick={() => handleNavigate("customer-dashboard")}
            className="w-full bg-[#0C332C] text-white font-medium py-3 rounded-lg hover:bg-[#0C332C]/90 transition-colors"
          >
            My Account
          </button>
        ) : (
          <button
            onClick={() => handleNavigate("auth")}
            className="w-full bg-[#0C332C] text-white font-medium py-3 rounded-lg hover:bg-[#0C332C]/90 transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};
