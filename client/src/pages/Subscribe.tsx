import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckmarkIcon } from '@/components/ui/checkmark-icon';
import { ArrowLeft, CreditCard, Shield, Star, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { GRADE_SUBSCRIPTION_PLANS, type SubscriptionTier, getSubscriptionTierFromGrade } from "@shared/schema";
import { getStripePromise } from '@/lib/stripe';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  description?: string;
  features?: string[];
  isActive: boolean;
  isPopular: boolean;
  maxStudents?: number;
  maxTeachers?: number;
  stripePriceId?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubscribeFormProps {
  plan: { tier: SubscriptionTier; plan: any } | PricingPlan;
  onSuccess: () => void;
  onCancel: () => void;
}

const SubscribeForm = ({ plan, onSuccess, onCancel }: SubscribeFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/subscription-success',
      },
      redirect: 'if_required'
    });

    setIsLoading(false);

    if (error) {
      setError(error.message || 'Subscription failed. Please try again.');
      setTimeout(() => setError(''), 5000);
    } else {
      setSuccess('Welcome to EduFiliova Premium! You now have access to all premium features.');
      setTimeout(() => setSuccess(''), 3000);
      onSuccess();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Subscribe to Premium
        </CardTitle>
        <CardDescription>
          Unlock all premium features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Details */}
        <div className="p-4 bg-white from-blue-50 to-purple-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{plan.name}</h3>
            {plan.isPopular && (
              <Badge className="bg-yellow-500 text-black">
                <Star className="h-3 w-3 mr-1" />
                Popular
              </Badge>
            )}
          </div>
          <div className="text-2xl font-bold">
            ${plan.price}
            <span className="text-sm text-gray-600 font-normal">/{plan.interval}</span>
          </div>
          <ul className="space-y-1 text-sm">
            {plan.features && plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckmarkIcon size="sm" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!stripe || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Subscribe
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <div className="flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" />
            <span>Secured by Stripe</span>
          </div>
          <p>Cancel anytime. Your payment information is encrypted and secure.</p>
        </div>
      </CardContent>
    </Card>
  );
};


interface SubscribeProps {
  onNavigate: (page: string) => void;
}

export default function Subscribe({ onNavigate }: SubscribeProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ tier: SubscriptionTier; plan: any } | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const { user, profile } = useAuth();

  // Check if user is a customer/general user (not a student)
  const isCustomer = profile?.role === 'general' || profile?.role === 'freelancer';

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  useEffect(() => {
    // Block customers from accessing student subscriptions
    if (isCustomer) {onNavigate("customer-dashboard");
      return;
    }

    
    // Get plan from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan');
    const secret = urlParams.get('client_secret');
    const billing = urlParams.get('billingCycle') as 'monthly' | 'yearly' | null;

    if (!planId || !user?.id) {onNavigate("premium");
      return;
    }

    // Set billing cycle if provided
    if (billing) {
      setBillingCycle(billing);
    }

    // Find the plan using grade-based system
    const planTier = planId as SubscriptionTier;
    const plan = GRADE_SUBSCRIPTION_PLANS[planTier];
    if (!plan) {onNavigate("premium");
      return;
    }

    setSelectedPlan({ tier: planTier, plan });

    if (secret) {
      setClientSecret(secret);
      setLoading(false);
    } else {
      // Create subscription for the selected plan
      const createSubscription = async () => {
        try {
          setLoading(true);
          const response = await fetch("/api/create-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              planType: planId,
              billingCycle: billingCycle
            }),
          });

          const data = await response.json();
          
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            setError(data.error || 'Failed to create subscription');
          }
        } catch (err) {
          setError('Network error. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      createSubscription();
    }
  }, [user?.id, onNavigate, toast, isCustomer, profile?.role]);

  const handleSuccess = () => {
    // Navigate to appropriate dashboard after successful payment based on role
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

  const handleCancel = () => {
    // Navigate back to appropriate dashboard based on role
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <p className="text-gray-600">Please log in to subscribe to premium.</p>
            <Button onClick={handleCancel} variant="outline" className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <p className="text-gray-600">No plan selected. Please choose a plan first.</p>
            <Button onClick={handleCancel} variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
            <span className="ml-3">Setting up subscription...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Subscription Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={handleCancel} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <p className="text-gray-600">Unable to initialize subscription. Please try again.</p>
            <Button onClick={handleCancel} variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <SubscribeForm 
          plan={selectedPlan}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Elements>
    </div>
  );
}
