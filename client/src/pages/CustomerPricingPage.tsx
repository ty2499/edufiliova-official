import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, ShoppingBag, Download, TrendingUp, Users, Zap, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

interface CustomerPricingPageProps {
  onNavigate: (page: string) => void;
}

const CustomerPricingPage = ({ onNavigate }: CustomerPricingPageProps) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const pricingTiers = [
    {
      name: "Creator",
      price: billingCycle === 'monthly' ? 14.99 : 161.88,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save $17.99' : null,
      description: "Perfect for individual creators",
      badge: null,
      features: [
        "Unlimited free product downloads",
        "Paid products: 5/day, 25/month",
        "Priority support",
        "1 ad (7-day) - Annual only"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      highlighted: false
    },
    {
      name: "Pro",
      price: billingCycle === 'monthly' ? 24.99 : 188.88,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save $110.99' : null,
      description: "For professionals and small teams",
      badge: "Most Popular",
      features: [
        "Unlimited free product downloads",
        "Paid products: 10/day, 50/month",
        "Advanced analytics",
        "Custom branding",
        "3 ads (1× 7-day, 2× 14-day) - Annual only"
      ],
      buttonText: "Get Started",
      buttonVariant: "default" as const,
      highlighted: true
    },
    {
      name: "Business",
      price: billingCycle === 'monthly' ? 89.99 : 604.68,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save $475.19' : null,
      description: "For growing businesses and agencies",
      badge: null,
      features: [
        "Unlimited downloads (free & paid)",
        "Team collaboration",
        "API access",
        "12 ads (any duration) - Annual only",
        "Dedicated account manager"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      highlighted: false
    }
  ];

  const features = [
    {
      category: "Downloads & Access",
      items: [
        { name: "Free Product Downloads", creator: "Unlimited", pro: "Unlimited", business: "Unlimited" },
        { name: "Paid Product Downloads (Daily)", creator: "5/day", pro: "10/day", business: "Unlimited" },
        { name: "Paid Product Downloads (Monthly)", creator: "25/month", pro: "50/month", business: "Unlimited" }
      ]
    },
    {
      category: "Advertising & Promotion",
      items: [
        { name: "Annual Ad Limit", creator: "1 ad", pro: "3 ads", business: "12 ads" },
        { name: "Ad Durations (Annual Only)", creator: "7-day", pro: "7-day, 14-day", business: "7, 14, 30-day" }
      ]
    },
    {
      category: "Analytics & Tools",
      items: [
        { name: "Analytics", creator: false, pro: "Advanced", business: "Advanced" },
        { name: "Custom Branding", creator: false, pro: true, business: true },
        { name: "API Access", creator: false, pro: false, business: true },
        { name: "Team Collaboration", creator: false, pro: false, business: true }
      ]
    },
    {
      category: "Support",
      items: [
        { name: "Support Level", creator: "Priority", pro: "Priority", business: "Priority" },
        { name: "Dedicated Account Manager", creator: false, pro: false, business: true }
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
      <Header onNavigate={onNavigate} currentPage="customer-pricing" />
      
      {/* Hero Section - Dark Theme */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white">Flexible</span>{" "}
              <span className="text-gray-400">membership plans</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Access our digital marketplace with flexible download limits, advertising credits, and exclusive content. 
              Perfect for creators and businesses of all sizes.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative inline-flex h-7 w-14 items-center rounded-full bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#A0FAB2] focus:ring-offset-2 focus:ring-offset-gray-900"
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
                  className={`relative rounded-2xl p-8 transition-all ${
                    tier.highlighted
                      ? 'bg-white/10 shadow-2xl transform scale-105'
                      : 'bg-white/5 border border-gray-700'
                  }`}
                  style={tier.highlighted ? { borderWidth: '2px', borderColor: '#A0FAB2' } : {}}
                  data-testid={`pricing-card-${tier.name.toLowerCase()}`}
                >
                  {tier.badge && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2" style={{ backgroundColor: '#A0FAB2', color: '#1a1a1a' }}>
                      {tier.badge}
                    </Badge>
                  )}
                  <div className="text-left">
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-sm text-gray-400 mb-6">{tier.description}</p>
                    <div className="mb-6">
                      <span className="text-5xl font-bold">${tier.price}</span>
                      <span className="text-gray-400">{tier.period}</span>
                      {tier.savings && (
                        <div className="mt-2 text-sm font-medium" style={{ color: '#A0FAB2' }}>{tier.savings}</div>
                      )}
                    </div>
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#A0FAB2' }} />
                          <span className="text-gray-200">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => onNavigate('auth')}
                      variant={tier.buttonVariant}
                      className={`w-full ${
                        tier.highlighted
                          ? 'hover:opacity-80 hover:shadow-lg hover:scale-105'
                          : 'bg-white/10 text-white hover:bg-white/20 border-gray-600'
                      }`}
                      style={tier.highlighted ? { backgroundColor: '#A0FAB2', color: '#1a1a1a' } : {}}
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
              Choose the plan that best fits your needs. All plans include our core features with varying limits and capabilities.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {features.map((section, sectionIndex) => (
              <div key={section.category} className={sectionIndex > 0 ? 'border-t border-gray-200' : ''}>
                <div className="bg-gray-50 px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900">{section.category}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {section.items.map((item, itemIndex) => (
                    <div key={item.name}>
                      {/* Mobile Layout */}
                      <div className="md:hidden px-6 py-4 hover:bg-gray-50 transition-colors" transition-all duration-300>
                        <div className="font-medium text-gray-900 mb-3">
                          {item.name}
                        </div>
                        <div className="space-y-2 pl-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Creator:</span>
                            <div className="flex items-center">
                              {renderFeatureValue(item.creator)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Pro:</span>
                            <div className="flex items-center">
                              {renderFeatureValue(item.pro)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Business:</span>
                            <div className="flex items-center">
                              {renderFeatureValue(item.business)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:grid md:grid-cols-4 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors" transition-all duration-300>
                        <div className="font-medium text-gray-900 flex items-center">
                          {item.name}
                        </div>
                        <div className="flex items-center justify-center">
                          {renderFeatureValue(item.creator)}
                        </div>
                        <div className="flex items-center justify-center">
                          {renderFeatureValue(item.pro)}
                        </div>
                        <div className="flex items-center justify-center">
                          {renderFeatureValue(item.business)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Feature Headers - Sticky on desktop */}
          <div className="hidden md:grid md:grid-cols-4 gap-4 px-6 py-4 bg-white rounded-t-2xl shadow-lg -mb-2 sticky top-20 z-10 border-b-2 border-gray-200">
            <div className="font-bold text-gray-900">Feature</div>
            <div className="font-bold text-gray-900 text-center">Creator</div>
            <div className="font-bold text-gray-900 text-center">Pro</div>
            <div className="font-bold text-gray-900 text-center">Business</div>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CustomerPricingPage;
