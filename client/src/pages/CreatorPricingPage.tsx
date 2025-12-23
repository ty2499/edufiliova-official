import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, Briefcase, TrendingUp, Users, Star, Zap, Crown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

interface CreatorPricingPageProps {
  onNavigate: (page: string) => void;
}

const CreatorPricingPage = ({ onNavigate }: CreatorPricingPageProps) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const pricingTiers = [
    {
      name: "Starter",
      price: billingCycle === 'monthly' ? 14.99 : 143.90,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save $35.98' : null,
      description: "Perfect for freelancers just getting started",
      badge: null,
      features: [
        "Verified Blue Badge on your profile",
        "Appear in top search results for your category",
        "Access to freelance projects & client requests",
        "Basic profile analytics (views & clicks)",
        "Priority chat support"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      highlighted: false
    },
    {
      name: "Pro",
      price: billingCycle === 'monthly' ? 119 : 1142.40,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save $285.60' : null,
      description: "Best for established creators and consultants",
      badge: null,
      features: [
        "Everything in Starter",
        "Free Ad Spots on the homepage or featured section",
        "Client referrals from our internal matching system",
        "Unlimited project bids",
        "Advanced profile analytics & performance insights",
        "Priority listing on search pages"
      ],
      buttonText: "Get Started",
      buttonVariant: "default" as const,
      highlighted: true
    },
    {
      name: "Elite",
      price: "Custom",
      period: '',
      savings: null,
      description: "Premium lifetime access for serious professionals",
      badge: null,
      features: [
        "Everything in Pro",
        "Lifetime Blue Badge verification",
        "Permanent free advertising on the platform",
        "Personalized client-matching support",
        "Early access to new tools and features",
        "Premium badge displayed on profile"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      highlighted: false
    }
  ];

  const features = [
    {
      category: "Verification & Trust",
      items: [
        { name: "Blue Verification Badge", starter: true, pro: true, elite: "Lifetime" },
        { name: "Profile Verification", starter: true, pro: true, elite: true },
        { name: "Premium Badge Display", starter: false, pro: false, elite: true }
      ]
    },
    {
      category: "Visibility & Marketing",
      items: [
        { name: "Top Search Results Placement", starter: true, pro: "Priority", elite: "Featured" },
        { name: "Free Ad Spots", starter: false, pro: "Homepage/Featured", elite: "Permanent" },
        { name: "Profile Visibility", starter: "Standard", pro: "Enhanced", elite: "Maximum" }
      ]
    },
    {
      category: "Client Access & Projects",
      items: [
        { name: "Freelance Project Access", starter: true, pro: true, elite: true },
        { name: "Client Requests", starter: true, pro: true, elite: true },
        { name: "Project Bids", starter: "Limited", pro: "Unlimited", elite: "Unlimited" },
        { name: "Internal Client Matching", starter: false, pro: true, elite: "Personalized" }
      ]
    },
    {
      category: "Analytics & Insights",
      items: [
        { name: "Profile Analytics", starter: "Basic", pro: "Advanced", elite: "Advanced" },
        { name: "Views & Clicks Tracking", starter: true, pro: true, elite: true },
        { name: "Performance Insights", starter: false, pro: true, elite: true }
      ]
    },
    {
      category: "Support & Features",
      items: [
        { name: "Chat Support", starter: "Priority", pro: "Priority", elite: "VIP" },
        { name: "Early Access to Features", starter: false, pro: false, elite: true },
        { name: "Personalized Support", starter: false, pro: false, elite: true }
      ]
    }
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-5 w-5 mx-auto text-gray-900" />;
    } else if (value === false) {
      return <X className="h-5 w-5 text-gray-300 mx-auto" />;
    }
    return <span className="text-sm font-medium text-gray-700">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header onNavigate={onNavigate} currentPage="creator-pricing" />
      
      {/* Hero Section - Dark Theme */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white">Professional</span>{" "}
              <span className="text-gray-400">plans for creators</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Grow your freelance business with comprehensive plans designed for creators, consultants, and course instructors. 
              Access powerful tools to manage clients and scale your income.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative inline-flex h-7 w-14 items-center rounded-full bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"
                style={{ '--tw-ring-color': '#A0FAB2' } as any}
                data-testid="billing-toggle"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
                Yearly
                <span className="ml-2 text-xs" style={{ color: '#A0FAB2' }}>(Save up to 20%)</span>
              </span>
            </div>
            
            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {pricingTiers.map((tier, index) => (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl p-4 md:p-8 transition-all ${
                    tier.highlighted
                      ? 'bg-white/10 border-2 shadow-2xl md:transform md:scale-105'
                      : 'bg-white/5 border border-gray-700'
                  }`}
                  style={tier.highlighted ? { borderColor: '#A0FAB2' } : {}}
                  data-testid={`pricing-card-${tier.name.toLowerCase()}`}
                >
                  {tier.badge && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-black" style={{ backgroundColor: '#A0FAB2' }}>
                      {tier.badge}
                    </Badge>
                  )}
                  <div className="text-left">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-6">{tier.description}</p>
                    <div className="mb-4 md:mb-6">
                      {typeof tier.price === 'number' ? (
                        <>
                          <span className="text-3xl md:text-5xl font-bold">${tier.price}</span>
                          <span className="text-sm md:text-base text-gray-400">{tier.period}</span>
                        </>
                      ) : (
                        <span className="text-3xl md:text-5xl font-bold">{tier.price}</span>
                      )}
                      {tier.savings && (
                        <div className="mt-2 text-xs md:text-sm font-medium" style={{ color: '#A0FAB2' }}>{tier.savings}</div>
                      )}
                    </div>
                    <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm">
                          <Check className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 mt-0.5" style={{ color: '#A0FAB2' }} />
                          <span className="text-gray-200">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => tier.name === 'Elite' ? onNavigate('contact') : onNavigate('auth')}
                      variant={tier.buttonVariant}
                      className={`w-full ${
                        tier.highlighted
                          ? 'text-black hover:opacity-90'
                          : 'bg-white/10 text-white hover:bg-white/20 border-gray-600'
                      }`}
                      style={tier.highlighted ? { backgroundColor: '#A0FAB2' } : {}}
                      data-testid={`button-get-started-${tier.name.toLowerCase()}`}
                    >
                      {tier.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table - Hidden on mobile, visible on desktop */}
      <section className="hidden md:block py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Compare Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that matches your growth stage. All plans include core features with increasing capabilities.
            </p>
          </div>

          {/* Feature Headers - Sticky on desktop */}
          <div className="hidden md:grid md:grid-cols-4 gap-4 px-6 py-4 bg-white rounded-t-2xl shadow-lg sticky top-20 z-10 border-b-2 border-gray-200">
            <div className="font-bold text-gray-900">Feature</div>
            <div className="font-bold text-gray-900 text-center">Starter</div>
            <div className="font-bold text-gray-900 text-center">Pro</div>
            <div className="font-bold text-gray-900 text-center">Elite</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-2">
            {features.map((section, sectionIndex) => (
              <div key={section.category} className={sectionIndex > 0 ? 'border-t border-gray-200' : ''}>
                <div className="bg-gray-50 px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900">{section.category}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={item.name}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900 flex items-center">
                        {item.name}
                      </div>
                      <div className="flex items-center justify-center md:justify-center">
                        {renderFeatureValue(item.starter)}
                      </div>
                      <div className="flex items-center justify-center md:justify-center">
                        {renderFeatureValue(item.pro)}
                      </div>
                      <div className="flex items-center justify-center md:justify-center">
                        {renderFeatureValue(item.elite)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CreatorPricingPage;
