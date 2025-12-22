import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Crown, Briefcase, BadgeCheck } from 'lucide-react';
import { CheckmarkIcon } from '@/components/ui/checkmark-icon';
import type { FreelancerPricingPlan } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';

interface FreelancerPricingPlansProps {
  onPlanSelect?: (planId: string, billingPeriod: 'monthly' | 'yearly' | 'lifetime') => void;
}

export default function FreelancerPricingPlans({ onPlanSelect }: FreelancerPricingPlansProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { profile } = useAuth();

  const { data: plans = [] } = useQuery<FreelancerPricingPlan[]>({
    queryKey: ['/api/freelancer-pricing-plans'],
  });

  // Get current plan info from user profile
  const currentPlanId = profile?.legacyPlan;
  const planExpiry = profile?.planExpiry;
  const hasActivePlan = Boolean(currentPlanId && planExpiry && new Date(planExpiry) > new Date());

  const getBadgeIcon = (badgeColor: string) => {
    switch (badgeColor) {
      case 'blue':
        return Briefcase;
      case 'green':
        return Sparkles;
      case 'orange':
        return Crown;
      default:
        return Briefcase;
    }
  };

  const getBadgeStyles = (badgeColor: string) => {
    switch (badgeColor) {
      case 'blue':
        return 'bg-blue-500';
      case 'green':
        return 'bg-green-500';
      case 'orange':
        return 'bg-primary';
      default:
        return 'bg-gray-500';
    }
  };

  const getCardStyles = (badgeColor: string, popular: boolean) => {
    if (popular) {
      return 'border-2 shadow-xl scale-105 relative' + ' ' + 'shadow-[#2d5ddd]/20' + ' ' + 'border-[#2d5ddd]';
    }
    switch (badgeColor) {
      case 'blue':
        return 'border border-blue-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10';
      case 'green':
        return 'border border-green-200 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10';
      case 'orange':
        return 'border border-orange-200 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10';
      default:
        return 'border border-gray-200 hover:border-gray-400 hover:shadow-lg';
    }
  };

  const formatPrice = (price: string | null | undefined) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(parseFloat(price));
  };

  const getDisplayPrice = (plan: FreelancerPricingPlan) => {
    if (plan.billingType === 'lifetime' && plan.lifetimePrice) {
      return {
        price: formatPrice(plan.lifetimePrice),
        period: 'lifetime',
        savings: null,
      };
    }

    if (billingPeriod === 'yearly' && plan.yearlyPrice) {
      const yearlyPrice = parseFloat(plan.yearlyPrice);
      const monthlyPrice = plan.monthlyPrice ? parseFloat(plan.monthlyPrice) : 0;
      const monthlyEquivalent = yearlyPrice / 12;
      const savings = monthlyPrice > 0 ? Math.round(((monthlyPrice - monthlyEquivalent) / monthlyPrice) * 100) : 40;

      return {
        price: formatPrice(plan.yearlyPrice),
        period: 'year',
        monthlyEquivalent: formatPrice(monthlyEquivalent.toString()),
        savings,
      };
    }

    return {
      price: formatPrice(plan.monthlyPrice),
      period: 'month',
      savings: null,
    };
  };

  const subscriptionPlans = plans.filter(p => p.billingType === 'subscription');
  const lifetimePlans = plans.filter(p => p.billingType === 'lifetime');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the perfect plan to grow your freelance business and connect with more clients
        </p>
      </div>
      
      {/* Current Plan Status Banner */}
      {hasActivePlan && planExpiry && (
        <div className="mb-8 max-w-3xl mx-auto">
          <Card className="border-[#2d5ddd] bg-[#2d5ddd]/5 dark:bg-[#2d5ddd]/10" data-testid="current-plan-banner">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-[#2d5ddd] text-white px-3 py-1 text-sm font-semibold whitespace-nowrap">
                  Active Plan: {plans.find(p => p.planId === currentPlanId)?.name || currentPlanId}
                </Badge>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Your plan is active until {new Date(planExpiry).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Billing Toggle - Only show if there are subscription plans */}
      {subscriptionPlans.length > 0 && (
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="button-billing-monthly"
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="button-billing-yearly"
            >
              Yearly
              <span className="ml-2 text-xs bg-[#151314] text-white px-2 py-0.5 rounded-full">
                Save 40%
              </span>
            </button>
          </div>
        </div>
      )}
      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {plans.map((plan) => {
          const Icon = getBadgeIcon(plan.badgeColor);
          const displayPrice = getDisplayPrice(plan);
          const isLifetime = plan.billingType === 'lifetime';
          const isCurrentPlan = plan.planId === currentPlanId && hasActivePlan;

          return (
            <Card
              key={plan.id}
              className={`transition-all duration-300 ${
                isCurrentPlan 
                  ? 'border-2 border-[#2d5ddd] shadow-lg shadow-[#2d5ddd]/20' 
                  : getCardStyles(plan.badgeColor, plan.popular || false)
              } ${plan.popular ? 'transform' : ''}`}
              data-testid={`card-plan-${plan.planId}`}
            >
              {isCurrentPlan ? (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#2d5ddd] text-white px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1 shadow-md whitespace-nowrap">
                    <BadgeCheck className="h-3 w-3" />
                    Active
                  </Badge>
                </div>
              ) : plan.popular ? (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="text-white px-3 py-0.5 text-xs font-medium" style={{ backgroundColor: '#151314' }}>
                    Most Popular
                  </Badge>
                </div>
              ) : null}
              <CardHeader className="text-center pb-4 pt-6">
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </CardTitle>
                <p className="text-xs text-gray-600 min-h-[40px]">{plan.description}</p>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-bold text-gray-900 text-2xl">
                      {displayPrice.price}
                    </span>
                    {!isLifetime && (
                      <span className="text-sm text-gray-600">/{displayPrice.period}</span>
                    )}
                  </div>
                  
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckmarkIcon size="sm" className="mt-0.5" />
                      <span className="text-xs text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className={`w-full py-4 text-sm font-medium ${
                    isCurrentPlan 
                      ? 'bg-[#2d5ddd] hover:bg-[#2d5ddd]/90' 
                      : 'bg-[#151314] hover:bg-[#2a2826]'
                  } text-white`}
                  onClick={() =>
                    onPlanSelect?.(plan.planId, isLifetime ? 'lifetime' : billingPeriod)
                  }
                  disabled={isCurrentPlan}
                  data-testid={`button-select-${plan.planId}`}
                >
                  {isCurrentPlan ? 'Active Plan' : isLifetime ? 'Get Lifetime Access' : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      </div>
  );
}
