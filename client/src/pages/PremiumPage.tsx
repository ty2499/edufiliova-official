import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { 
  Star, 
  X,
  BookOpen,
  GraduationCap,
  University,
  Zap,
  Shield,
  ArrowLeft,
  ArrowUp,
  Clock
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { GRADE_SUBSCRIPTION_PLANS } from "@shared/schema";
import Footer from "@/components/Footer";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PremiumPageProps {
  onNavigate: (page: string, customTransition?: string, checkoutData?: any) => void;
}

interface UpgradeCostData {
  currentTier: string;
  targetTier: string;
  daysRemaining: number;
  credit: number;
  targetPlanPrice: number;
  upgradeCost: number;
  billingCycle: 'monthly' | 'yearly';
  expiryDate: string;
}

const PremiumPage = ({ onNavigate }: PremiumPageProps) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [upgradeCosts, setUpgradeCosts] = useState<{[key: string]: UpgradeCostData | null}>({});
  const { formatPrice } = useCurrency();
  const { user, profile, refreshAuth } = useAuth();
  
  // Check if user is a customer/general user (not a student)
  const isCustomer = profile?.role === 'general' || profile?.role === 'freelancer';
  
  const hasActiveSubscription = profile?.subscriptionTier && profile.subscriptionTier !== null;
  const currentTier = profile?.subscriptionTier || null;
  const planExpiry = profile?.planExpiry ? new Date(profile.planExpiry) : null;
  const hasVerifiedBadge = profile?.verificationBadge === 'blue' || profile?.verificationBadge === 'green';

  const navigateToDashboard = () => {
    if (profile?.role === 'admin') {
      onNavigate("admin-dashboard");
    } else if (profile?.role === 'teacher') {
      onNavigate("teacher-dashboard");
    } else if (profile?.role === 'freelancer') {
      onNavigate("freelancer-dashboard");
    } else if (profile?.role === 'general') {
      onNavigate("customer-dashboard");
    } else {
      onNavigate("student-dashboard");
    }
  };

  useEffect(() => {
    setPageLoading(false);
  }, [profile, user]);

  // Fetch upgrade costs for all tiers
  useEffect(() => {
    if (hasActiveSubscription && user) {
      const tiers: Array<keyof typeof GRADE_SUBSCRIPTION_PLANS> = ['elementary', 'high_school', 'college_university'];
      tiers.forEach(async (tier) => {
        if (tier !== currentTier) {
          try {
            const response = await apiRequest(`/api/calculate-upgrade-cost`, {
              method: 'POST',
              body: JSON.stringify({
                targetTier: tier,
                billingCycle
              })
            });
            
            const result = await response.json();
            if (result.success) {
              setUpgradeCosts(prev => ({
                ...prev,
                [tier]: result.data
              }));
            }
          } catch (error) {
            console.error(`Error fetching upgrade cost for ${tier}:`, error);
          }
        }
      });
    }
  }, [hasActiveSubscription, currentTier, billingCycle, user]);

  const handlePlanSelect = async (tier: keyof typeof GRADE_SUBSCRIPTION_PLANS, isUpgrade: boolean = false) => {
    if (!user?.id) return;
    
    const loadingKey = tier;
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const plan = GRADE_SUBSCRIPTION_PLANS[tier];
      const planPrice = isUpgrade && upgradeCosts[tier] 
        ? upgradeCosts[tier]!.upgradeCost 
        : plan.pricing[billingCycle];
      
      // Create payment intent
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: planPrice,
          planName: plan.name,
          billingCycle: billingCycle,
          subscriptionTier: tier,
          userId: user.id,
          isUpgrade: isUpgrade
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create payment intent");
      }

      // Navigate to checkout page
      const checkoutData = {
        clientSecret: result.clientSecret,
        amount: planPrice,
        planName: plan.name,
        billingCycle: billingCycle,
        subscriptionTier: tier,
        isUpgrade: isUpgrade,
        upgradeCostData: isUpgrade ? upgradeCosts[tier] : null
      };

      onNavigate("checkout", 'slide-right', checkoutData);
    } catch (error: any) {
      console.error('Payment error:', error);} finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const getPlanIcon = (tier: keyof typeof GRADE_SUBSCRIPTION_PLANS) => {
    switch (tier) {
      case 'elementary':
        return BookOpen;
      case 'high_school':
        return GraduationCap;
      case 'college_university':
        return University;
      default:
        return BookOpen;
    }
  };

  const getPlanColor = (tier: keyof typeof GRADE_SUBSCRIPTION_PLANS) => {
    switch (tier) {
      case 'elementary':
        return 'from-green-500 to-emerald-600';
      case 'high_school':
        return 'from-blue-500 to-purple-600';
      case 'college_university':
        return 'from-purple-500 to-pink-600';
    }
  };

  const getButtonConfig = (tier: keyof typeof GRADE_SUBSCRIPTION_PLANS) => {
    if (currentTier === tier) {
      return {
        text: "Current Plan",
        variant: "outline" as const,
        disabled: true,
        isUpgrade: false
      };
    } else if (hasActiveSubscription && shouldShowUpgrade(tier)) {
      return {
        text: "Upgrade Now",
        variant: "default" as const,
        disabled: false,
        isUpgrade: true
      };
    } else {
      return {
        text: "Subscribe Now",
        variant: "default" as const,
        disabled: false,
        isUpgrade: false
      };
    }
  };

  const shouldShowUpgrade = (tier: keyof typeof GRADE_SUBSCRIPTION_PLANS) => {
    if (!currentTier) return false;
    const tierOrder = ['elementary', 'high_school', 'college_university'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(tier);
    return targetIndex > currentIndex;
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pricing information...</p>
        </div>
      </div>
    );
  }

  // Block customers from accessing student pricing
  if (isCustomer) {
    return (
      <div className="min-h-screen bg-background">
        <button
          onClick={() => onNavigate("customer-dashboard")}
          className="fixed top-4 right-4 z-50 rounded-lg px-3 py-2 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-600 hover:text-gray-800 transition-all duration-300" />
        </button>

        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Student Subscription Required
              </CardTitle>
              <CardDescription className="mt-4 text-base">
                This page is for student subscriptions only. As a {profile?.role === 'freelancer' ? 'freelancer' : 'customer'}, 
                you have access to different features through your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
                <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Want to access student features and lessons?
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create a separate student account to access educational content, 
                  lessons, and student subscription plans.
                </p>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => onNavigate("customer-dashboard")}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-back-dashboard"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button 
                  onClick={() => onNavigate("home")}
                  className="flex-1"
                  data-testid="button-go-home"
                >
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <button
        onClick={navigateToDashboard}
        className="fixed top-4 right-4 z-50 rounded-lg px-3 py-2 transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-600 hover:text-gray-800 transition-all duration-300" />
      </button>

      {/* Current Plan Status Banner - Show if user has active subscription */}
      {hasActiveSubscription && currentTier && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200">
          <div className="container mx-auto max-w-6xl px-6 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckmarkIcon size="lg" variant="success" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    You're on the {GRADE_SUBSCRIPTION_PLANS[currentTier as keyof typeof GRADE_SUBSCRIPTION_PLANS]?.name}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    {planExpiry && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Valid until {planExpiry.toLocaleDateString()}
                      </span>
                    )}
                    {hasVerifiedBadge && (
                      <Badge className="bg-primary text-white flex items-center gap-1">
                        <CheckmarkIcon size="sm" className="bg-white" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="bg-white hover:bg-gray-50 transition-all duration-300"
                onClick={navigateToDashboard}
                data-testid="button-view-dashboard"
              >
                View Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <Star className="h-16 w-16 mx-auto mb-6 text-white/90" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Learning Plan
          </h1>
          <p className="text-lg text-white/90 mb-2">
            Grade-based subscriptions designed for your education level
          </p>
          <p className="text-white/80 max-w-2xl mx-auto">
            {hasActiveSubscription ? 'Upgrade your plan to unlock more features' : 'Get started with unlimited access to premium educational content'}
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-white rounded-full p-1 shadow-sm border">
              <div className="flex items-center">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    billingCycle === 'monthly' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  data-testid="billing-monthly"
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    billingCycle === 'yearly' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  data-testid="billing-yearly"
                >
                  Yearly
                  {billingCycle === 'yearly' && (
                    <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Save 25%</Badge>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(GRADE_SUBSCRIPTION_PLANS) as Array<keyof typeof GRADE_SUBSCRIPTION_PLANS>).map((tierKey) => {
              const plan = GRADE_SUBSCRIPTION_PLANS[tierKey];
              const PlanIcon = getPlanIcon(tierKey);
              const buttonConfig = getButtonConfig(tierKey);
              const upgradeCost = upgradeCosts[tierKey];
              const isCurrentPlan = currentTier === tierKey;
              const isUpgrade = buttonConfig.isUpgrade;
              
              return (
                <Card 
                  key={tierKey} 
                  className={`relative bg-white shadow-lg hover:shadow-xl transition-all duration-300 ${
                    isCurrentPlan ? 'border-2 border-blue-500' : 'border'
                  }`}
                  data-testid={`card-plan-${tierKey}`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-white flex items-center gap-1">
                        <span>Current Plan</span>
                        {hasVerifiedBadge && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" className="h-4 w-4">
                            <g clipPath="url(#clip0_pricing_badge)">
                              <path fill="#ffffff" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                              <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                            </g>
                            <defs>
                              <clipPath id="clip0_pricing_badge">
                                <rect width="24" height="24" fill="#fff" />
                              </clipPath>
                            </defs>
                          </svg>
                        )}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-6">
                    <div className={`flex justify-center mb-4 p-3 rounded-full bg-gradient-to-r ${getPlanColor(tierKey)} w-16 h-16 mx-auto items-center justify-center`}>
                      <PlanIcon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </CardTitle>
                    <p className="text-blue-600 font-medium">{plan.gradeRange}</p>
                    
                    <div className="mt-6">
                      {isUpgrade && upgradeCost ? (
                        <>
                          <div className="flex items-baseline justify-center">
                            <span className="text-4xl font-bold text-gray-900">
                              {formatPrice(upgradeCost.upgradeCost)}
                            </span>
                            <span className="text-gray-500 ml-2 text-sm">
                              upgrade fee
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{upgradeCost.daysRemaining} days credit: {formatPrice(upgradeCost.credit)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Then {formatPrice(plan.pricing[billingCycle])}/{billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline justify-center">
                            <span className="text-4xl font-bold text-gray-900">
                              {formatPrice(plan.pricing[billingCycle])}
                            </span>
                            <span className="text-gray-500 ml-2 text-lg">
                              /{billingCycle === 'monthly' ? 'month' : 'year'}
                            </span>
                          </div>
                          {billingCycle === 'yearly' && (
                            <p className="text-sm text-green-600 mt-2">
                              Save 25% with yearly billing
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    
                    <CardDescription className="text-gray-600 mt-4">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <CheckmarkIcon size="md" className="mr-3 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full py-3 text-lg font-semibold"
                      variant={buttonConfig.variant}
                      onClick={() => handlePlanSelect(tierKey, isUpgrade)}
                      disabled={loading[tierKey] || buttonConfig.disabled}
                      data-testid={`button-subscribe-${tierKey}`}
                    >
                      {loading[tierKey] ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          {isUpgrade ? <ArrowUp className="h-4 w-4 mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                          {buttonConfig.text}
                        </>
                      )}
                    </Button>

                    {!buttonConfig.disabled && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">
                          🔒 Secure payment powered by Stripe
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PremiumPage;
