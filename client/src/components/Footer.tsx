import { useState } from "react";
import { SiFacebook, SiX, SiInstagram, SiLinkedin, SiWhatsapp, SiTelegram, SiTiktok, SiPinterest, SiThreads, SiDribbble, SiBehance } from "react-icons/si";
import { Mail, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import Logo from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FooterProps {
  onNavigate: (page: string) => void;
}

interface SocialMediaLinks {
  whatsappUrl: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  threadsUrl: string | null;
  tiktokUrl: string | null;
  dribbbleUrl: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  pinterestUrl: string | null;
  behanceUrl: string | null;
  telegramUrl: string | null;
}

interface AppDownloadLinksResponse {
  appStoreUrl?: string;
  appStoreText?: string;
  googlePlayUrl?: string;
  googlePlayText?: string;
  huaweiGalleryUrl?: string;
  huaweiGalleryText?: string;
}

const Footer = ({ onNavigate }: FooterProps) => {
  const [showMorePolicies, setShowMorePolicies] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const { data: socialLinks } = useQuery<SocialMediaLinks>({
    queryKey: ['/api/social-media-links'],
    staleTime: 60 * 60 * 1000,
  });

  const { data: appDownloadLinks } = useQuery<AppDownloadLinksResponse>({
    queryKey: ['/api/app-download-links'],
    staleTime: 60 * 60 * 1000,
  });

  const hasSocialLinks = socialLinks && Object.values(socialLinks).some(url => url !== null && url !== '');
  const hasAppDownloadLinks = appDownloadLinks && (appDownloadLinks.appStoreUrl || appDownloadLinks.googlePlayUrl || appDownloadLinks.huaweiGalleryUrl);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const FooterColumn = ({ 
    title, 
    children, 
    collapsible = false 
  }: { 
    title: string; 
    children: React.ReactNode; 
    collapsible?: boolean;
  }) => {
    const isOpen = openSections.includes(title);

    if (collapsible) {
      return (
        <div className="md:hidden border-b border-gray-200">
          <Collapsible open={isOpen} onOpenChange={() => toggleSection(title)}>
            <CollapsibleTrigger className="w-full py-4 flex justify-between items-center" data-testid={`toggle-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">{title}</h3>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-4">
              <div className="space-y-3">
                {children}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    return (
      <div className="space-y-4 hidden md:block">
        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">{title}</h3>
        <div className="space-y-3">
          {children}
        </div>
      </div>
    );
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      {/* Main Footer Content */}
      <div className="container mx-auto py-12 px-6 md:px-12 lg:px-16">
        {/* Company Info - Always visible */}
        <div className="mb-8 md:mb-12">
          <div className="space-y-4">
            <Logo size="sm" variant="default" type="footer" logoSize="wide" />
            <p className="text-sm text-gray-600 leading-relaxed max-w-md">
              Empowering education globally with personalized learning experiences for students and teachers across 197+ countries.
            </p>
          </div>
        </div>

        {/* Mobile Accordions */}
        <div className="md:hidden space-y-0">
          {/* Product - Mobile */}
          <div className="border-b border-gray-200">
            <Collapsible open={openSections.includes('Product')} onOpenChange={() => toggleSection('Product')}>
              <CollapsibleTrigger className="w-full py-4 flex justify-between items-center" data-testid="toggle-product">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Product</h3>
                {openSections.includes('Product') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-4">
                <div className="space-y-3">
                  <button
                    onClick={() => onNavigate("home")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-home"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => onNavigate("learn-more")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-learn-more"
                  >
                    Learn More
                  </button>
                  <button
                    onClick={() => onNavigate("student-dashboard")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-for-students"
                  >
                    For Students
                  </button>
                  <button
                    onClick={() => onNavigate("teacher-application")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-for-teachers"
                  >
                    For Teachers
                  </button>
                  <button
                    onClick={() => onNavigate("freelancer-signup")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-for-freelancers"
                  >
                    For Freelancers
                  </button>
                  <button
                    onClick={() => onNavigate("product-shop")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-shop-product"
                  >
                    Shop
                  </button>
                  <button
                    onClick={() => onNavigate("education-pricing")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-pricing"
                  >
                    Pricing
                  </button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Learn & Tools - Mobile */}
          <div className="border-b border-gray-200">
            <Collapsible open={openSections.includes('Learn & Tools')} onOpenChange={() => toggleSection('Learn & Tools')}>
              <CollapsibleTrigger className="w-full py-4 flex justify-between items-center" data-testid="toggle-learn-tools">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Learn & Tools</h3>
                {openSections.includes('Learn & Tools') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-4">
                <div className="space-y-3">
                  <button
                    onClick={() => onNavigate("course-browse")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-browse-courses"
                  >
                    Browse Courses
                  </button>
                  <button
                    onClick={() => onNavigate("my-certificates")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-my-certificates"
                  >
                    My Certificates
                  </button>
                  <button
                    onClick={() => onNavigate("verify-certificate")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-verify-certificate"
                  >
                    Verify Certificate
                  </button>
                  <button
                    onClick={() => onNavigate("claim-certificate")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-claim-certificate"
                  >
                    Claim Certificate
                  </button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Creators & Business - Mobile */}
          <div className="border-b border-gray-200">
            <Collapsible open={openSections.includes('Creators & Business')} onOpenChange={() => toggleSection('Creators & Business')}>
              <CollapsibleTrigger className="w-full py-4 flex justify-between items-center" data-testid="toggle-creators-business">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Creators & Business</h3>
                {openSections.includes('Creators & Business') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-4">
                <div className="space-y-3">
                  <button
                    onClick={() => onNavigate("teacher-application")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-become-teacher-creators"
                  >
                    Become a Teacher
                  </button>
                  <button
                    onClick={() => onNavigate("freelancer-signup")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-become-freelancer"
                  >
                    Become a Freelancer
                  </button>
                  <button
                    onClick={() => onNavigate("product-creation")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-sell-products"
                  >
                    Sell Products
                  </button>
                  <button
                    onClick={() => onNavigate("networking")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-find-talent"
                  >
                    Find Talent
                  </button>
                  <button
                    onClick={() => onNavigate("advertise-with-us")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-advertise-creators"
                  >
                    Advertise With Us
                  </button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Company - Mobile */}
          <div className="border-b border-gray-200">
            <Collapsible open={openSections.includes('Company')} onOpenChange={() => toggleSection('Company')}>
              <CollapsibleTrigger className="w-full py-4 flex justify-between items-center" data-testid="toggle-company">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Company</h3>
                {openSections.includes('Company') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-4">
                <div className="space-y-3">
                  <button
                    onClick={() => onNavigate("about")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-about-company"
                  >
                    About
                  </button>
                  <button
                    onClick={() => onNavigate("contact")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-contact-company"
                  >
                    Contact
                  </button>
                  <button
                    onClick={() => onNavigate("help")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-help-company"
                  >
                    Help Center
                  </button>
                  <button
                    onClick={() => onNavigate("blog")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-blog-company"
                  >
                    Blog
                  </button>
                  <button
                    onClick={() => onNavigate("design-team-contact")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-design-team"
                  >
                    Design Team Contact
                  </button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Legal & Policies - Mobile */}
          <div className="border-b border-gray-200">
            <Collapsible open={openSections.includes('Legal & Policies')} onOpenChange={() => toggleSection('Legal & Policies')}>
              <CollapsibleTrigger className="w-full py-4 flex justify-between items-center" data-testid="toggle-legal-policies">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Legal & Policies</h3>
                {openSections.includes('Legal & Policies') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-4">
                <div className="space-y-3">
                  <button
                    onClick={() => onNavigate("terms")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-terms-legal"
                  >
                    Terms & Conditions
                  </button>
                  <button
                    onClick={() => onNavigate("privacy")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-privacy-legal"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => onNavigate("cookies-policy")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-cookies-legal"
                  >
                    Cookies Policy
                  </button>
                  <button
                    onClick={() => onNavigate("refund-policy")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-refund-legal"
                  >
                    Refund Policy
                  </button>
                  <button
                    onClick={() => onNavigate("community-guidelines")}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                    data-testid="link-community-guidelines"
                  >
                    Community Guidelines
                  </button>
                  
                  {/* Show More Policies Button */}
                  <button
                    onClick={() => setShowMorePolicies(!showMorePolicies)}
                    className="block text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium transition-all duration-300"
                    data-testid="button-show-more-policies-mobile"
                  >
                    {showMorePolicies ? 'Show less policies' : 'Show more policies'}
                  </button>

                  {showMorePolicies && (
                    <>
                      <button
                        onClick={() => onNavigate("payment-billing")}
                        className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                        data-testid="link-payment-billing"
                      >
                        Payment & Billing Policy
                      </button>
                      <button
                        onClick={() => onNavigate("payout-policy")}
                        className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                        data-testid="link-payout-policy"
                      >
                        Payout Policy
                      </button>
                      <button
                        onClick={() => onNavigate("data-retention")}
                        className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                        data-testid="link-data-retention"
                      >
                        Data Retention Policy
                      </button>
                      <button
                        onClick={() => onNavigate("copyright-dmca")}
                        className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                        data-testid="link-copyright-dmca"
                      >
                        Copyright & DMCA
                      </button>
                      <button
                        onClick={() => onNavigate("whatsapp-policy")}
                        className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                        data-testid="link-whatsapp-policy"
                      >
                        WhatsApp Policy
                      </button>
                      <button
                        onClick={() => onNavigate("student-terms")}
                        className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                        data-testid="link-student-terms"
                      >
                        Student Terms
                      </button>
                      <button
                        onClick={() => onNavigate("teacher-terms")}
                        className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                        data-testid="link-teacher-terms"
                      >
                        Teacher Terms
                      </button>
                      <button
                        onClick={() => onNavigate("school-terms")}
                        className="block text-sm text-gray-600 hover:text-gray-900 transition-colors transition-all duration-300"
                        data-testid="link-school-terms"
                      >
                        School / Institution Terms
                      </button>
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Desktop Grid - 5 Columns */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Product */}
          <FooterColumn title="Product">
            <button
              onClick={() => onNavigate("home")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-home-desktop"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate("learn-more")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-learn-more-desktop"
            >
              Learn More
            </button>
            <button
              onClick={() => onNavigate("student-dashboard")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-for-students-desktop"
            >
              For Students
            </button>
            <button
              onClick={() => onNavigate("teacher-application")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-for-teachers-desktop"
            >
              For Teachers
            </button>
            <button
              onClick={() => onNavigate("freelancer-signup")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-for-freelancers-desktop"
            >
              For Freelancers
            </button>
            <button
              onClick={() => onNavigate("product-shop")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-shop-desktop"
            >
              Shop
            </button>
            <button
              onClick={() => onNavigate("education-pricing")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-pricing-desktop"
            >
              Pricing
            </button>
          </FooterColumn>

          {/* Learn & Tools */}
          <FooterColumn title="Learn & Tools">
            <button
              onClick={() => onNavigate("course-browse")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-browse-courses-desktop"
            >
              Browse Courses
            </button>
            <button
              onClick={() => onNavigate("my-certificates")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-my-certificates-desktop"
            >
              My Certificates
            </button>
            <button
              onClick={() => onNavigate("verify-certificate")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-verify-certificate-desktop"
            >
              Verify Certificate
            </button>
            <button
              onClick={() => onNavigate("claim-certificate")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-claim-certificate-desktop"
            >
              Claim Certificate
            </button>
          </FooterColumn>

          {/* Creators & Business */}
          <FooterColumn title="Creators & Business">
            <button
              onClick={() => onNavigate("teacher-application")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-become-teacher-desktop"
            >
              Become a Teacher
            </button>
            <button
              onClick={() => onNavigate("freelancer-signup")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-become-freelancer-desktop"
            >
              Become a Freelancer
            </button>
            <button
              onClick={() => onNavigate("product-creation")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-sell-products-desktop"
            >
              Sell Products
            </button>
            <button
              onClick={() => onNavigate("networking")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-find-talent-desktop"
            >
              Find Talent
            </button>
            <button
              onClick={() => onNavigate("advertise-with-us")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-advertise-desktop"
            >
              Advertise With Us
            </button>
          </FooterColumn>

          {/* Company */}
          <FooterColumn title="Company">
            <button
              onClick={() => onNavigate("about")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-about-desktop"
            >
              About
            </button>
            <button
              onClick={() => onNavigate("contact")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-contact-desktop"
            >
              Contact
            </button>
            <button
              onClick={() => onNavigate("help")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-help-desktop"
            >
              Help Center
            </button>
            <button
              onClick={() => onNavigate("blog")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-blog-desktop"
            >
              Blog
            </button>
            <button
              onClick={() => onNavigate("design-team-contact")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-design-team-desktop"
            >
              Design Team Contact
            </button>
          </FooterColumn>

          {/* Legal & Policies */}
          <FooterColumn title="Legal & Policies">
            <button
              onClick={() => onNavigate("terms")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-terms-desktop"
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => onNavigate("privacy")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-privacy-desktop"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate("cookies-policy")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-cookies-desktop"
            >
              Cookies Policy
            </button>
            <button
              onClick={() => onNavigate("refund-policy")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-refund-desktop"
            >
              Refund Policy
            </button>
            <button
              onClick={() => onNavigate("community-guidelines")}
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
              data-testid="link-community-guidelines-desktop"
            >
              Community Guidelines
            </button>

            {/* Show More Policies Button */}
            <button
              onClick={() => setShowMorePolicies(!showMorePolicies)}
              className="block text-sm text-[#2f5a4e] hover:text-[#1a3a32] transition-colors font-medium text-left transition-all duration-300"
              data-testid="button-show-more-policies"
            >
              {showMorePolicies ? 'Show less' : 'Show more policies'}
            </button>

            {showMorePolicies && (
              <>
                <button
                  onClick={() => onNavigate("payment-billing")}
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
                  data-testid="link-payment-billing-desktop"
                >
                  Payment & Billing
                </button>
                <button
                  onClick={() => onNavigate("payout-policy")}
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
                  data-testid="link-payout-policy-desktop"
                >
                  Payout Policy
                </button>
                <button
                  onClick={() => onNavigate("data-retention")}
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
                  data-testid="link-data-retention-desktop"
                >
                  Data Retention
                </button>
                <button
                  onClick={() => onNavigate("copyright-dmca")}
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
                  data-testid="link-copyright-dmca-desktop"
                >
                  Copyright & DMCA
                </button>
                <button
                  onClick={() => onNavigate("whatsapp-policy")}
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
                  data-testid="link-whatsapp-policy-desktop"
                >
                  WhatsApp Policy
                </button>
                <button
                  onClick={() => onNavigate("student-terms")}
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
                  data-testid="link-student-terms-desktop"
                >
                  Student Terms
                </button>
                <button
                  onClick={() => onNavigate("teacher-terms")}
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
                  data-testid="link-teacher-terms-desktop"
                >
                  Teacher Terms
                </button>
                <button
                  onClick={() => onNavigate("school-terms")}
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left transition-all duration-300"
                  data-testid="link-school-terms-desktop"
                >
                  School / Institution
                </button>
              </>
            )}
          </FooterColumn>
        </div>

        {/* App Download Links Section */}
        {hasAppDownloadLinks && (
          <div className="border-t border-gray-200 py-6">
            <div className="flex flex-wrap items-center gap-3 justify-center">
              {appDownloadLinks.appStoreUrl && (
                <a
                  href={appDownloadLinks.appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors transition-all duration-300"
                  data-testid="link-app-store-section"
                  aria-label="Download on App Store"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] leading-none">{appDownloadLinks.appStoreText || "Download on the"}</span>
                    <span className="text-sm font-semibold leading-tight">App Store</span>
                  </div>
                </a>
              )}
              {appDownloadLinks.googlePlayUrl && (
                <a
                  href={appDownloadLinks.googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors transition-all duration-300"
                  data-testid="link-google-play-section"
                  aria-label="Get it on Google Play"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] leading-none">{appDownloadLinks.googlePlayText || "Get it on"}</span>
                    <span className="text-sm font-semibold leading-tight">Google Play</span>
                  </div>
                </a>
              )}
              {appDownloadLinks.huaweiGalleryUrl && (
                <a
                  href={appDownloadLinks.huaweiGalleryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors transition-all duration-300"
                  data-testid="link-huawei-gallery-section"
                  aria-label="Explore it on Huawei AppGallery"
                >
                  <svg className="h-6 w-6" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#e53935" d="M15,6h18c4.971,0,9,4.029,9,9v18c0,4.971-4.029,9-9,9H15c-4.971,0-9-4.029-9-9V15 C6,10.029,10.029,6,15,6z"></path>
                    <path fill="#fff" d="M21.775,20.935c-1.506,0-2.669,1.312-2.669,3.716c0,1.571,2.378,5.599,4.486,9.127 C23.592,24.644,23.368,23.655,21.775,20.935z"></path>
                    <path fill="#fff" d="M26.225,20.935c-1.624,2.674-1.817,3.711-1.817,12.846c2.108-3.528,4.486-7.558,4.486-9.13 C28.894,22.245,27.731,20.935,26.225,20.935z"></path>
                    <path fill="#fff" d="M16.581,23.904c-2.21,1.543-1.484,5.192-0.369,6.386c0.735,0.771,3.596,2.159,6.305,4 L16.581,23.904z"></path>
                    <path fill="#fff" d="M31.419,23.904l-5.936,10.385c2.709-1.84,5.57-3.229,6.305-4 C32.903,29.096,33.629,25.447,31.419,23.904z"></path>
                    <path fill="#fff" d="M13.612,29.84c0.036,4.111,2.545,5.191,4.241,5.191h4.241L13.612,29.84z"></path>
                    <path fill="#fff" d="M34.388,29.84l-8.483,5.191h4.241C31.843,35.031,34.352,33.951,34.388,29.84z"></path>
                    <path fill="#fff" d="M15.926,35.775C16.163,37.002,16.698,38,18.239,38c1.542,0,3.035-0.889,3.855-2.225H15.926z"></path>
                    <path fill="#fff" d="M25.905,35.775C26.726,37.111,28.219,38,29.761,38s2.076-0.998,2.314-2.225H25.905z"></path>
                    <circle cx="14.5" cy="10.5" r="1.5" fill="#b71c1c"></circle>
                    <circle cx="33.5" cy="10.5" r="1.5" fill="#b71c1c"></circle>
                    <path fill="none" stroke="#fff" strokeLinecap="round" strokeMiterlimit="10" d="M33.5,10.5c0,0-2,5-9.5,5s-9.5-5-9.5-5"></path>
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] leading-none">{appDownloadLinks.huaweiGalleryText || "Explore it on"}</span>
                    <span className="text-sm font-semibold leading-tight">AppGallery</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto py-6 px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} EduFiliova. All rights reserved.
            </p>

            {/* Social Media Links */}
            {hasSocialLinks && (
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
                {socialLinks?.facebookUrl && (
                  <a 
                    href={socialLinks.facebookUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="Facebook"
                    data-testid="link-facebook-footer"
                  >
                    <SiFacebook className="w-5 h-5 text-gray-700" />
                  </a>
                )}
                {socialLinks?.xUrl && (
                  <a 
                    href={socialLinks.xUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="X (Twitter)"
                    data-testid="link-x-footer"
                  >
                    <SiX className="w-5 h-5 text-gray-700" />
                  </a>
                )}
                {socialLinks?.instagramUrl && (
                  <a 
                    href={socialLinks.instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="Instagram"
                    data-testid="link-instagram-footer"
                  >
                    <SiInstagram className="w-5 h-5 text-gray-700" />
                  </a>
                )}
                {socialLinks?.linkedinUrl && (
                  <a 
                    href={socialLinks.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="LinkedIn"
                    data-testid="link-linkedin-footer"
                  >
                    <SiLinkedin className="w-5 h-5 text-gray-700" />
                  </a>
                )}
                {socialLinks?.whatsappUrl && (
                  <a 
                    href={socialLinks.whatsappUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="WhatsApp"
                    data-testid="link-whatsapp-footer"
                  >
                    <SiWhatsapp className="w-5 h-5 text-gray-700" />
                  </a>
                )}
                {socialLinks?.telegramUrl && (
                  <a 
                    href={socialLinks.telegramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="Telegram"
                    data-testid="link-telegram-footer"
                  >
                    <SiTelegram className="w-5 h-5 text-gray-700" />
                  </a>
                )}
                {socialLinks?.tiktokUrl && (
                  <a 
                    href={socialLinks.tiktokUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="TikTok"
                    data-testid="link-tiktok-footer"
                  >
                    <SiTiktok className="w-5 h-5 text-gray-700" />
                  </a>
                )}
                {socialLinks?.pinterestUrl && (
                  <a 
                    href={socialLinks.pinterestUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="Pinterest"
                    data-testid="link-pinterest-footer"
                  >
                    <SiPinterest className="w-5 h-5 text-gray-700" />
                  </a>
                )}
                {socialLinks?.threadsUrl && (
                  <a 
                    href={socialLinks.threadsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="Threads"
                    data-testid="link-threads-footer"
                  >
                    <SiThreads className="w-5 h-5 text-gray-700" />
                  </a>
                )}
                {socialLinks?.dribbbleUrl && (
                  <a 
                    href={socialLinks.dribbbleUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="Dribbble"
                    data-testid="link-dribbble-footer"
                  >
                    <SiDribbble className="w-5 h-5 text-gray-700" />
                  </a>
                )}
                {socialLinks?.behanceUrl && (
                  <a 
                    href={socialLinks.behanceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors transition-all duration-300"
                    title="Behance"
                    data-testid="link-behance-footer"
                  >
                    <SiBehance className="w-5 h-5 text-gray-700" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
