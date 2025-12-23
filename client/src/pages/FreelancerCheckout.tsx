import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { CheckoutForm } from './Checkout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Shield, Wallet } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { queryClient } from '@/lib/queryClient';
import Logo from '@/components/Logo';
import { getStripePromise } from '@/lib/stripe';
import { DodoPayments } from "dodopayments-checkout";
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

interface FreelancerCheckoutProps {
  onNavigate?: (page: string, transition?: string, data?: any) => void;
}

export default function FreelancerCheckout({ onNavigate }: FreelancerCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'stripe'>('card');
  const [processing, setProcessing] = useState(false);
  const [dodoInitialized, setDodoInitialized] = useState(false);
  const { user, profile } = useAuth();
  
  // Get checkout data from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const clientSecret = urlParams.get('clientSecret') || '';
  const amount = parseFloat(urlParams.get('amount') || '0');
  const planName = urlParams.get('planName') || 'Premium Plan';
  const billingCycle = urlParams.get('billingCycle') || 'monthly';
  const planId = urlParams.get('planId') || '';

  // Fetch enabled payment gateways
  const { data: enabledGateways = [] } = useQuery<any[]>({
    queryKey: ['/api/payment-gateways/enabled'],
    staleTime: 5 * 60 * 1000,
  });

  // Check if Dodo Payments is enabled
  const dodoGateway = enabledGateways.find((g: any) => g.gatewayId === 'dodopay' || g.gatewayId === 'dodo');
  const isDodoEnabled = !!dodoGateway;
  const isDodoTestMode = dodoGateway?.testMode === true;

  // Initialize DodoPayments overlay checkout SDK
  useEffect(() => {
    if (isDodoEnabled && !dodoInitialized) {
      try {
        const dodoMode = isDodoTestMode ? "test" : "live";
        DodoPayments.Initialize({
          mode: dodoMode,
          onEvent: async (event: any) => {
            console.log("Card checkout event (freelancer):", event);
            
            if (event.event_type === "checkout.redirect") {
              // Confirm the freelancer plan upgrade with the backend
              try {
                const confirmResponse = await fetch('/api/freelancer/subscription/confirm', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    paymentId: event.data?.payment_id || `dodo_${Date.now()}`,
                    planId: planId || 'premium',
                    planName: planName,
                    amount: amount,
                    billingCycle: billingCycle,
                    gateway: 'dodopay',
                  }),
                });
                
                const confirmData = await confirmResponse.json();
                console.log('Card freelancer plan confirmed:', confirmData);
              } catch (err) {
                console.error('Failed to confirm Card freelancer plan:', err);
              }
              
              queryClient.invalidateQueries({ queryKey: ['/api/me/profile'] });
              queryClient.invalidateQueries({ queryKey: ['/api/freelancer/subscription'] });
              setProcessing(false);
              setTimeout(() => handleSuccess(), 1500);
            } else if (event.event_type === "checkout.closed") {
              setProcessing(false);
            } else if (event.event_type === "checkout.error") {
              console.error("Card checkout error:", event.data);
              setProcessing(false);
            }
          }
        });
        setDodoInitialized(true);
        console.log(`✅ Dodo Payments overlay SDK initialized (freelancer checkout) - mode: ${dodoMode}`);
      } catch (error) {
        console.warn("Failed to initialize Dodo overlay SDK:", error);
      }
    }
  }, [isDodoEnabled, isDodoTestMode, dodoInitialized, planId, planName, amount, billingCycle]);

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  // Handle Card payment for freelancer plans
  const handleCardPayment = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/dodopay/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: 'USD',
          courseId: `freelancer_plan_${planId || 'premium'}_${billingCycle}`,
          productName: planName,
          productDescription: `Freelancer ${planName} - ${billingCycle === 'yearly' ? 'Annual' : billingCycle === 'lifetime' ? 'Lifetime' : 'Monthly'} subscription`,
          productType: 'subscription',
          billingInterval: billingCycle === 'lifetime' ? 'one_time' : billingCycle,
          userEmail: user?.email || '',
          userName: profile?.name || user?.email || '',
          overlayMode: true,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
        if (dodoInitialized && DodoPayments.Checkout) {
          DodoPayments.Checkout.open({
            checkoutUrl: data.checkoutUrl
          });
        } else {
          window.location.href = data.checkoutUrl;
        }
      } else {
        console.error('Card checkout error:', data.error);
        setProcessing(false);
      }
    } catch (error) {
      console.error('Card payment error:', error);
      setProcessing(false);
    }
  };

  // Redirect back if no checkout data (amount is required, clientSecret only for Stripe)
  useEffect(() => {
    if (!amount) {
      setTimeout(() => {
        handleBack();
      }, 1500);
    }
  }, [amount]);

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

  if (!amount) {
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

          {/* Payment Method Selection */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-[#6366f1] bg-[#6366f1]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="payment-method-card"
              >
                <CreditCard className={`h-6 w-6 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-[#6366f1]' : 'text-gray-600'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-[#6366f1]' : 'text-gray-700'}`}>
                  Pay with Card
                </span>
              </button>
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-[#6366f1] bg-[#6366f1]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="payment-method-stripe"
              >
                <Wallet className={`h-6 w-6 mx-auto mb-2 ${paymentMethod === 'stripe' ? 'text-[#6366f1]' : 'text-gray-600'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'stripe' ? 'text-[#6366f1]' : 'text-gray-700'}`}>
                  Other Methods
                </span>
              </button>
            </div>
          </div>

          {/* Payment Form - Full Width */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h3>
            
            {paymentMethod === 'card' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Complete your payment securely using your credit or debit card.
                </p>
                <Button
                  onClick={handleCardPayment}
                  disabled={processing}
                  className="w-full bg-[#6366f1] hover:bg-[#5558e3] text-white py-6 text-base font-semibold rounded-xl" transition-all duration-300
                  data-testid="button-dodopay-checkout"
                >
                  {processing ? (
                    <span className="flex items-center gap-2 justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    `Pay $${amount} with Card`
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Secure payment processing</span>
                </div>
              </div>
            ) : clientSecret && stripePromise ? (
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
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600 text-sm">Loading payment form...</p>
              </div>
            )}
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
