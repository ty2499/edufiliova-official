import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { CheckoutForm } from './Checkout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { queryClient } from '@/lib/queryClient';
import Logo from '@/components/Logo';
import { getStripePromise } from '@/lib/stripe';

interface FreelancerCheckoutProps {
  onNavigate?: (page: string, transition?: string, data?: any) => void;
}

export default function FreelancerCheckout({ onNavigate }: FreelancerCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  
  // Get checkout data from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const clientSecret = urlParams.get('clientSecret') || '';
  const amount = parseFloat(urlParams.get('amount') || '0');
  const planName = urlParams.get('planName') || 'Premium Plan';
  const billingCycle = urlParams.get('billingCycle') || 'monthly';

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  // Redirect back if no checkout data
  useEffect(() => {
    if (!clientSecret || !amount) {
      setTimeout(() => {
        handleBack();
      }, 1500);
    }
  }, [clientSecret, amount]);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('freelancer-dashboard', 'instant', { tab: 'pricing-plans' });
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/me/profile'] });
    queryClient.invalidateQueries({ queryKey: ['/api/freelancer/subscription'] });
    
    if (onNavigate) {
      onNavigate('freelancer-dashboard', 'instant', { tab: 'overview' });
    }
  };

  if (!clientSecret || !amount || !stripePromise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Logo size="sm" variant="default" type="home" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900">Secure Checkout</h1>
                <p className="text-xs text-gray-500">Complete your subscription</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-14 py-8 sm:py-12">
        <div className="space-y-6">
          {/* Plan Details Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{planName}</h2>
                <p className="text-sm text-gray-600">
                  {billingCycle === 'monthly' ? 'Monthly Subscription' : 
                   billingCycle === 'yearly' ? 'Annual Subscription' : 
                   'Lifetime Access'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">${amount}</div>
                <p className="text-sm text-gray-500">
                  {billingCycle === 'monthly' ? '/month' : 
                   billingCycle === 'yearly' ? '/year' : 
                   'one-time'}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center gap-3">
                <CheckmarkIcon size="md" variant="success" className="flex-shrink-0" />
                <p className="text-sm text-gray-700">Access to all premium features</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckmarkIcon size="md" variant="success" className="flex-shrink-0" />
                <p className="text-sm text-gray-700">Priority support</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckmarkIcon size="md" variant="success" className="flex-shrink-0" />
                <p className="text-sm text-gray-700">Cancel anytime</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckmarkIcon size="md" variant="success" className="flex-shrink-0" />
                <p className="text-sm text-gray-700">Instant activation</p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure Payment</h3>
                <p className="text-sm text-gray-700">
                  Your payment information is encrypted and secure. We never store your card details.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods Badge */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Accepted Payment Methods</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700">
                Credit Card
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700">
                Debit Card
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700">
                Wallet
              </div>
            </div>
          </div>

          {/* Payment Form - Full Width */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h3>
            
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                amount={amount}
                planName={planName}
                billingCycle={billingCycle}
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onCancel={handleBack}
              />
            </Elements>
          </div>
        </div>

        {/* Footer Trust Badge */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Protected by industry-standard SSL encryption
          </p>
        </div>
      </main>
    </div>
  );
}
