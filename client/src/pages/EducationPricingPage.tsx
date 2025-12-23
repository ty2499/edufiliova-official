import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, GraduationCap, BookOpen, Users, Star, Sparkles, Trophy } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

interface EducationPricingPageProps {
  onNavigate: (page: string) => void;
}

const EducationPricingPage = ({ onNavigate }: EducationPricingPageProps) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const pricingTiers = [
    {
      name: "Elementary",
      subtitle: "Grades 1-7",
      price: billingCycle === 'monthly' ? 5.99 : 57.50,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save $14.38' : null,
      description: "Perfect for elementary and middle school students",
      badge: null,
      features: [
        "Interactive learning games & activities",
        "Video lessons with expert teachers",
        "Practice quizzes & worksheets",
        "Progress tracking & reports",
        "Homework help & Q&A forums",
        "Downloadable study materials",
        "Email support"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      highlighted: false
    },
    {
      name: "High School",
      subtitle: "Grades 8-12",
      price: billingCycle === 'monthly' ? 9.99 : 95.90,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save $23.98' : null,
      description: "Comprehensive learning for high school students",
      badge: null,
      features: [
        "Everything in Elementary",
        "SAT/ACT test prep materials",
        "AP & Advanced courses",
        "Live tutoring sessions (2/month)",
        "Essay writing & research tools",
        "College application resources",
        "Study groups & peer forums",
        "Course completion certificates",
        "Priority support"
      ],
      buttonText: "Get Started",
      buttonVariant: "default" as const,
      highlighted: true
    },
    {
      name: "Advanced",
      subtitle: "College & University",
      price: billingCycle === 'monthly' ? 99 : 1168,
      period: billingCycle === 'monthly' ? '/mo' : '/year',
      savings: billingCycle === 'yearly' ? 'Save $20' : null,
      description: "Professional courses for higher education",
      badge: null,
      features: [
        "Unlimited live tutoring & mentorship",
        "1-on-1 career counseling sessions",
        "Industry-recognized certifications",
        "Internship & job placement assistance",
        "Resume & portfolio building tools",
        "Networking events & webinars",
        "Research paper writing support",
        "LinkedIn profile optimization",
        "Premium 24/7 support"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      highlighted: false
    }
  ];

  const features = [
    {
      category: "Course Content & Library",
      items: [
        { name: "Grade Levels Covered", elementary: "1-7", highschool: "8-12", advanced: "College+" },
        { name: "Total Courses Available", elementary: "500+", highschool: "1,000+", advanced: "2,000+" },
        { name: "Video Lessons", elementary: true, highschool: true, advanced: true },
        { name: "Interactive Quizzes", elementary: true, highschool: true, advanced: true },
        { name: "Practice Tests", elementary: "Basic", highschool: "Advanced", advanced: "Professional" },
        { name: "Downloadable Resources", elementary: true, highschool: true, advanced: true }
      ]
    },
    {
      category: "Learning Tools & Features",
      items: [
        { name: "Interactive Games", elementary: true, highschool: true, advanced: false },
        { name: "Progress Tracking", elementary: true, highschool: true, advanced: true },
        { name: "Study Planner", elementary: false, highschool: true, advanced: true },
        { name: "Note-Taking Tools", elementary: false, highschool: true, advanced: true },
        { name: "Homework Help", elementary: true, highschool: true, advanced: true },
        { name: "Essay Writing Tools", elementary: false, highschool: true, advanced: true }
      ]
    },
    {
      category: "Live Support & Tutoring",
      items: [
        { name: "Live Tutoring Sessions", elementary: false, highschool: "2/month", advanced: "Unlimited" },
        { name: "1-on-1 Mentorship", elementary: false, highschool: false, advanced: true },
        { name: "Career Counseling", elementary: false, highschool: false, advanced: true },
        { name: "Study Groups", elementary: false, highschool: true, advanced: true },
        { name: "Q&A Forums", elementary: true, highschool: true, advanced: true }
      ]
    },
    {
      category: "Test Prep & Certifications",
      items: [
        { name: "SAT/ACT Prep", elementary: false, highschool: true, advanced: true },
        { name: "AP Course Materials", elementary: false, highschool: true, advanced: true },
        { name: "Course Certificates", elementary: false, highschool: true, advanced: true },
        { name: "Industry Certifications", elementary: false, highschool: false, advanced: true },
        { name: "College Application Support", elementary: false, highschool: true, advanced: true }
      ]
    },
    {
      category: "Career & Professional Development",
      items: [
        { name: "Resume Building", elementary: false, highschool: false, advanced: true },
        { name: "Portfolio Creation", elementary: false, highschool: false, advanced: true },
        { name: "Job Placement Assistance", elementary: false, highschool: false, advanced: true },
        { name: "Internship Opportunities", elementary: false, highschool: false, advanced: true },
        { name: "LinkedIn Optimization", elementary: false, highschool: false, advanced: true },
        { name: "Networking Events", elementary: false, highschool: false, advanced: true }
      ]
    },
    {
      category: "Support",
      items: [
        { name: "Support Type", elementary: "Email", highschool: "Email + Chat", advanced: "24/7 Premium" },
        { name: "Response Time", elementary: "48hrs", highschool: "24hrs", advanced: "4hrs" },
        { name: "Dedicated Support Agent", elementary: false, highschool: false, advanced: true }
      ]
    }
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <CheckmarkIcon size="sm" className="mx-auto bg-[#A0FAB2]" />;
    } else if (value === false) {
      return <X className="h-5 w-5 text-gray-300 mx-auto" />;
    }
    return <span className="text-sm font-medium text-gray-700">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header onNavigate={onNavigate} currentPage="education-pricing" />
      
      {/* Hero Section - Dark Theme */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white">Affordable</span>{" "}
              <span className="text-gray-400">learning plans</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Choose from flexible plans designed for every grade level. Get access to thousands of courses, 
              live tutoring, and personalized learning paths to excel in your education.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative inline-flex h-7 w-14 items-center rounded-full bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
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
                      ? 'bg-white/10 border-2 border-purple-500 shadow-2xl md:transform md:scale-105'
                      : 'bg-white/5 border border-gray-700'
                  }`}
                  data-testid={`pricing-card-${tier.name.toLowerCase()}`}
                >
                  {tier.badge && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                      {tier.badge}
                    </Badge>
                  )}
                  <div className="text-left">
                    <h3 className="text-xl md:text-2xl font-bold mb-1">{tier.name}</h3>
                    <p className="text-xs md:text-sm text-purple-300 mb-2 md:mb-4">{tier.subtitle}</p>
                    <p className="text-xs text-gray-400 mb-4 md:mb-6">{tier.description}</p>
                    <div className="mb-4 md:mb-6">
                      <span className="text-3xl md:text-5xl font-bold">${tier.price}</span>
                      <span className="text-sm md:text-base text-gray-400">{tier.period}</span>
                      {tier.savings && (
                        <div className="mt-2 text-xs md:text-sm font-medium" style={{ color: '#A0FAB2' }}>{tier.savings}</div>
                      )}
                    </div>
                    <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm">
                          <CheckmarkIcon size="sm" className="mt-0.5 bg-[#A0FAB2]" />
                          <span className="text-gray-200">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => onNavigate('auth')}
                      variant={tier.buttonVariant}
                      className={`w-full ${
                        tier.highlighted
                          ? 'bg-purple-500 text-white hover:bg-primary'
                          : 'bg-white/10 text-white hover:bg-white/20 border-gray-600'
                      }`}
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
              Every plan is designed for specific grade levels with age-appropriate content and learning tools.
            </p>
          </div>

          {/* Feature Headers - Sticky on desktop */}
          <div className="hidden md:grid md:grid-cols-4 gap-4 px-6 py-4 bg-white rounded-t-2xl shadow-lg sticky top-20 z-10 border-b-2 border-gray-200">
            <div className="font-bold text-gray-900">Feature</div>
            <div className="font-bold text-gray-900 text-center">Elementary</div>
            <div className="font-bold text-gray-900 text-center">High School</div>
            <div className="font-bold text-gray-900 text-center">Advanced</div>
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
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors" transition-all duration-300
                    >
                      <div className="font-medium text-gray-900 flex items-center">
                        {item.name}
                      </div>
                      <div className="flex items-center justify-center md:justify-center">
                        {renderFeatureValue(item.elementary)}
                      </div>
                      <div className="flex items-center justify-center md:justify-center">
                        {renderFeatureValue(item.highschool)}
                      </div>
                      <div className="flex items-center justify-center md:justify-center">
                        {renderFeatureValue(item.advanced)}
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

export default EducationPricingPage;
