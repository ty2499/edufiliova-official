import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  CheckCircle2,
  X,
  Zap,
  DollarSign,
  Wallet,
  BookOpen
} from "lucide-react";
import { CardElement, useStripe, useElements, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { GRADE_SUBSCRIPTION_PLANS, type SubscriptionTier } from "@shared/schema";
import { useEnabledGateways } from "@/hooks/useEnabledGateways";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { usePaystackPayment } from 'react-paystack';
import { DodoPayments } from "dodopayments-checkout";

interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  description: string;
  features: string[];
}

interface SubscriptionPaymentModalProps {
  plan: SubscriptionPlan;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'card' | 'paypal' | 'wallet' | 'paystack' | 'saved_card' | 'dodopay' | 'vodapay' | 'wallet_balance' | string;

interface SavedPaymentMethod {
  id: string;
  displayName: string;
  lastFour?: string;
  expiryDate?: string;
  cardholderName?: string;
  type: string;
  isDefault: boolean;
  stripePaymentMethodId?: string;
}

export default function SubscriptionPaymentModal({ 
  plan, 
  onClose,
  onSuccess
}: SubscriptionPaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { profile: rawProfile, user } = useAuth();
  
  // Cast profile to include walletBalance for wallet balance payment option
  const profile = rawProfile as (typeof rawProfile & { walletBalance?: string | number }) | null;
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed'>('success');
  const [error, setError] = useState<string>('');
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);

  // Fetch enabled payment gateways
  const { data: enabledGateways = [], isLoading: gatewaysLoading } = useEnabledGateways();

  // Get primary gateway (fallback to first enabled if no primary set)
  const primaryGateway = enabledGateways.find(g => g.isPrimary) || enabledGateways[0];
  
  // Check if Stripe is enabled (for wallet and saved cards)
  const isStripeEnabled = enabledGateways.some(g => g.gatewayId === 'stripe');
  
  // Check if PayPal is enabled (should always show if enabled)
  const isPayPalEnabled = enabledGateways.some(g => g.gatewayId === 'paypal');
  
  // Check if DodoPayments is enabled (should always show if enabled)
  const dodoGateway = enabledGateways.find(g => g.gatewayId === 'dodopay' || g.gatewayId === 'dodo');
  const isDodoEnabled = !!dodoGateway;
  const isDodoTestMode = dodoGateway?.testMode === true;
  
  // Initialize DodoPayments overlay checkout SDK
  const [dodoInitialized, setDodoInitialized] = useState(false);
  
  useEffect(() => {
    if (isDodoEnabled && !dodoInitialized) {
      try {
        const dodoMode = isDodoTestMode ? "test" : "live";
        DodoPayments.Initialize({
          mode: dodoMode,
          onEvent: async (event: any) => {
            console.log("Card checkout event:", event);
            
            if (event.event_type === "checkout.redirect") {
              // Payment successful - confirm subscription in backend
              try {
                const confirmResponse = await fetch('/api/subscriptions/confirm', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    paymentIntentId: event.data?.payment_id || `dodo_${Date.now()}`,
                    planType: plan.tier,
                    amount: plan.price,
                    gateway: 'dodopay',
                    billingCycle: plan.interval,
                  }),
                });
                
                const confirmData = await confirmResponse.json();
                console.log('Card subscription confirmed:', confirmData);
              } catch (err) {
                console.error('Failed to confirm Card subscription:', err);
              }
              
              // Show success screen in modal
              setPaymentDetails({
                transactionId: event.data?.payment_id || 'Completed',
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                paymentMethod: 'Card',
                total: plan.price,
                currency: '$',
                planName: plan.name,
              });
              setPaymentStatus('success');
              setShowSuccess(true);
              setProcessing(false);
              
              // Call onSuccess after showing success screen
              setTimeout(() => onSuccess(), 2000);
            } else if (event.event_type === "checkout.closed") {
              setProcessing(false);
            } else if (event.event_type === "checkout.error") {
              console.error("Card checkout error:", event.data);
              setError(event.data?.message || "Payment failed");
              setProcessing(false);
            }
          }
        });
        setDodoInitialized(true);
        console.log(`✅ DodoPayments overlay SDK initialized (subscription) - mode: ${dodoMode}`);
      } catch (error) {
        console.warn("Failed to initialize Dodo overlay SDK:", error);
      }
    }
  }, [isDodoEnabled, isDodoTestMode, dodoInitialized, onSuccess]);

  // Fetch user's wallet balance from shop wallet
  const { data: wallet } = useQuery({
    queryKey: ['/api/shop/wallet'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/shop/wallet');
      } catch (error) {
        return { balance: '0.00' };
      }
    }
  });

  // Wallet balance calculations - use profile walletBalance OR shop wallet balance (whichever is higher)
  const shopWalletBalance = parseFloat(wallet?.balance || '0');
  const profileWalletBalance = parseFloat(profile?.walletBalance?.toString() || '0');
  const walletBalance = Math.max(shopWalletBalance, profileWalletBalance);
  const hasWalletBalance = walletBalance > 0;
  const hasSufficientBalance = walletBalance >= plan.price;

  // Fetch saved payment methods
  const { data: savedPaymentMethods = [] } = useQuery<SavedPaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/payment-methods');
      } catch (error) {
        return [];
      }
    }
  });

  // Set initial payment method based on available options
  useEffect(() => {
    if (!gatewaysLoading && primaryGateway && !selectedMethod) {
      // Prioritize saved cards if Stripe is enabled
      if (savedPaymentMethods.length > 0 && isStripeEnabled) {
        setSelectedMethod('saved_card');
        setSelectedSavedCard(savedPaymentMethods.find(m => m.isDefault)?.id || savedPaymentMethods[0]?.id);
      } else if (primaryGateway.gatewayId === 'stripe') {
        setSelectedMethod('card');
      } else {
        // For other gateways, set to that gateway
        setSelectedMethod(primaryGateway.gatewayId as PaymentMethod);
      }
    }
  }, [gatewaysLoading, primaryGateway, selectedMethod, savedPaymentMethods.length, isStripeEnabled]);

  // Initialize Payment Request (for Apple Pay & Google Pay)
  useEffect(() => {
    if (!isStripeEnabled || !stripe || !plan.price) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: plan.name,
        amount: Math.round(plan.price * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if Payment Request is available
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    // Handle payment method received
    pr.on('paymentmethod', async (ev) => {
      try {
        // Create subscription payment intent using new endpoint
        const data = await apiRequest('/api/subscriptions/create', {
          method: "POST",
          body: JSON.stringify({ 
            planType: plan.tier,
            billingCycle: plan.interval,
            gateway: primaryGateway?.gatewayId || 'stripe'
          }),
        });
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to create subscription');
        }
        
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          return;
        }

        if (paymentIntent?.status === 'succeeded') {
          // Confirm subscription on backend using new endpoint
          await apiRequest('/api/subscriptions/confirm', {
            method: 'POST',
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              planType: plan.tier,
              amount: plan.price,
              gateway: primaryGateway?.gatewayId || 'stripe'
            })
          });
          
          // Store payment details for success screen
          setPaymentDetails({
            transactionId: paymentIntent.id,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            paymentMethod: 'Digital Wallet',
            total: plan.price,
            planName: plan.name
          });
          
          ev.complete('success');
          setPaymentStatus('success');
          setShowSuccess(true);
          
          // Call onSuccess after a brief delay to show success screen
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } catch (error: any) {
        ev.complete('fail');
        setPaymentDetails({
          transactionId: 'N/A',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          paymentMethod: 'Digital Wallet',
          total: plan.price,
          planName: plan.name
        });
        setPaymentStatus('failed');
        setShowSuccess(true);
      }
    });
  }, [isStripeEnabled, stripe, plan.price, plan.tier, plan.interval, plan.name]);

  // Create subscription payment intent
  useEffect(() => {
    if (selectedMethod === 'card' && !clientSecret) {
      const createSubscription = async () => {
        try {
          const data = await apiRequest('/api/subscriptions/create', {
            method: "POST",
            body: JSON.stringify({ 
              planType: plan.tier,
              billingCycle: plan.interval,
              gateway: primaryGateway?.gatewayId || 'stripe'
            }),
          });
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to create subscription');
          }
          
          setClientSecret(data.clientSecret);
        } catch (error: any) {
          setError(error.message || 'Failed to initialize payment');
        }
      };
      createSubscription();
    }
  }, [selectedMethod, plan.tier, plan.interval, clientSecret]);

  // Handle Card Payment
  const handleCardPayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm subscription on backend using new endpoint
        const confirmData = await apiRequest('/api/subscriptions/confirm', {
          method: 'POST',
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            planType: plan.tier,
            amount: plan.price,
            gateway: primaryGateway?.gatewayId || 'stripe'
          })
        });
        
        if (!confirmData.success) {
          throw new Error(confirmData.error || 'Failed to confirm subscription');
        }
        
        // Store payment details for success screen
        setPaymentDetails({
          transactionId: paymentIntent.id,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          paymentMethod: 'Card',
          total: plan.price,
          planName: plan.name
        });
        
        setPaymentStatus('success');
        setShowSuccess(true);
        
        // Call onSuccess after a brief delay to show success screen
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error: any) {
      setError(error.message || 'Payment failed. Please try again.');
      
      // Show failure receipt
      setPaymentDetails({
        transactionId: 'N/A',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        paymentMethod: 'Card',
        total: plan.price,
        planName: plan.name
      });
      setPaymentStatus('failed');
      setShowSuccess(true);
    } finally {
      setProcessing(false);
    }
  };

  // Handle PayPal Payment
  const handlePayPalPayment = async () => {
    setProcessing(true);
    try {
      const orderData = await apiRequest('/api/paypal/subscription', {
        method: 'POST',
        body: JSON.stringify({ 
          planType: plan.tier,
          billingCycle: plan.interval,
          amount: plan.price.toFixed(2), 
          currency: 'USD',
          returnUrl: `${window.location.origin}/student-dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/student-dashboard?payment=cancelled`
        }),
      });
      
      // Redirect to PayPal for approval
      if (orderData.links) {
        const approvalLink = orderData.links.find((link: any) => link.rel === 'approve');
        if (approvalLink) {
          window.location.href = approvalLink.href;
        } else {
          throw new Error('PayPal approval link not found');
        }
      } else {
        throw new Error('PayPal links not received');
      }
    } catch (error: any) {
      setError(error.message || 'PayPal payment failed');
      setProcessing(false);
    }
  };

  // Handle Paystack Payment
  const paystackConfig = {
    reference: `sub_${new Date().getTime()}`,
    email: user?.email || '',
    amount: Math.round(plan.price * 100), // Convert to cents
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    onSuccess: async (reference: any) => {
      try {
        await apiRequest('/api/paystack/verify-subscription', {
          method: 'POST',
          body: JSON.stringify({ 
            reference: reference.reference,
            planType: plan.tier,
            amount: plan.price
          })
        });
        
        setPaymentDetails({
          transactionId: reference.reference,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          paymentMethod: 'Card',
          total: plan.price,
          planName: plan.name
        });
        
        setPaymentStatus('success');
        setShowSuccess(true);
        setTimeout(() => onSuccess(), 2000);
      } catch (error) {
        setError('Payment verification failed');
      }
    },
    onClose: () => {
      setProcessing(false);
    },
  };

  const initializePaystack = usePaystackPayment(paystackConfig);

  // Handle Card Payment - Dynamic product creation
  const handleDodoCardPayment = async () => {
    setProcessing(true);
    setError('');
    try {
      // Create dynamic checkout session via API
      const response = await fetch('/api/dodopay/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          currency: 'USD',
          courseId: `subscription_${plan.tier}_${plan.interval}`,
          productName: `${plan.name} - ${plan.interval === 'yearly' ? 'Annual' : 'Monthly'}`,
          productDescription: plan.description,
          productType: 'subscription',
          billingInterval: plan.interval,
          userEmail: user?.email || '',
          userName: profile?.name || user?.email || '',
          overlayMode: true, // Prevents redirect to success page - overlay handles success
        }),
      });

      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
        // Use embedded overlay checkout if initialized, otherwise redirect
        if (dodoInitialized && DodoPayments.Checkout) {
          DodoPayments.Checkout.open({
            checkoutUrl: data.checkoutUrl
          });
        } else {
          window.location.href = data.checkoutUrl;
        }
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error("Card payment error:", error);
      setError(error.message || 'Failed to initialize Card payment');
      setProcessing(false);
    }
  };

  // Handle Saved Card Payment
  const handleSavedCardPayment = async () => {
    if (!selectedSavedCard || !stripe) return;
    
    setProcessing(true);
    try {
      const data = await apiRequest('/api/subscriptions/create', {
        method: "POST",
        body: JSON.stringify({ 
          planType: plan.tier,
          billingCycle: plan.interval,
          gateway: primaryGateway?.gatewayId || 'stripe'
        }),
      });
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create subscription');
      }
      
      const savedCard = savedPaymentMethods.find(m => m.id === selectedSavedCard);
      if (!savedCard?.stripePaymentMethodId) {
        throw new Error('Payment method not found');
      }
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: savedCard.stripePaymentMethodId
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        await apiRequest('/api/subscriptions/confirm', {
          method: 'POST',
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            planType: plan.tier,
            amount: plan.price,
            gateway: primaryGateway?.gatewayId || 'stripe'
          })
        });
        
        setPaymentDetails({
          transactionId: paymentIntent.id,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          paymentMethod: 'Saved Card',
          total: plan.price,
          planName: plan.name
        });
        
        setPaymentStatus('success');
        setShowSuccess(true);
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (error: any) {
      setError(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  // Success/Failure state - Payment Receipt Screen
  if (showSuccess && paymentDetails) {
    const isSuccess = paymentStatus === 'success';
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-white dark:bg-gray-900">
          <div className="flex justify-end p-4 pb-0">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              data-testid="button-close-receipt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <CardContent className="p-8 pt-2">
            {/* Success/Failure Icon and Header */}
            <div className="text-center mb-6">
              <div className="mx-auto w-24 h-24 mb-4 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="35" y="15" width="40" height="30" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
                  <rect x="25" y="25" width="50" height="50" fill="white" stroke="currentColor" strokeWidth="2" rx="4" className="text-gray-800 dark:text-gray-200" />
                  <line x1="30" y1="35" x2="70" y2="35" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" />
                  <line x1="30" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" />
                  <line x1="30" y1="55" x2="60" y2="55" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" />
                  {isSuccess ? (
                    <>
                      <circle cx="80" cy="30" r="15" fill="#10b981" />
                      <path d="M 73 30 L 78 35 L 87 25" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  ) : (
                    <>
                      <circle cx="80" cy="30" r="15" fill="#ef4444" />
                      <path d="M 75 25 L 85 35 M 85 25 L 75 35" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </>
                  )}
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 dark:text-white">
                {isSuccess ? 'Subscription Activated!' : 'Payment Failed'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isSuccess 
                  ? 'Welcome to Premium! Your subscription is now active.'
                  : 'Unfortunately, your payment could not be processed. Please try again.'}
              </p>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
              <h3 className="font-semibold text-sm mb-3 dark:text-white">Payment Details</h3>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-medium dark:text-white">
                  {paymentDetails.transactionId === 'N/A' 
                    ? paymentDetails.transactionId 
                    : paymentDetails.transactionId.slice(-12)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium dark:text-white">{paymentDetails.date}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium dark:text-white">{paymentDetails.planName}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type of Transaction</span>
                <span className="font-medium dark:text-white">{paymentDetails.paymentMethod}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium dark:text-white">${paymentDetails.total.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                {isSuccess ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Success
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <X className="w-4 h-4" />
                    Failed
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {isSuccess ? (
                <Button 
                  onClick={onClose}
                  className="w-full"
                  data-testid="button-close-success"
                >
                  Start Learning
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={() => {
                      setShowSuccess(false);
                      setPaymentDetails(null);
                      setError('');
                    }}
                    className="w-full"
                    data-testid="button-try-again"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={onClose}
                    variant="outline"
                    className="w-full"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (gatewaysLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4 bg-white dark:bg-gray-900">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded mb-4 w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded mb-2 w-1/2 mx-auto"></div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Loading payment options...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - no payment methods available
  if (!selectedMethod && !gatewaysLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4 bg-white dark:bg-gray-900">
          <CardContent className="p-8 text-center">
            <X className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payment Methods Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No payment methods are currently configured. Please contact support or try again later.
            </p>
            <Button onClick={onClose} variant="outline">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Payment Form - Two Column Layout (matching WalletPaymentModal)
  return (
    <div className="fixed inset-0 md:bg-black/60 md:backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto md:py-8 md:px-4">
      <Card className="rounded-2xl text-[#1F1E30] border-gray-100 w-full md:max-w-5xl bg-gradient-to-br from-white via-white to-blue-50/30 md:shadow-2xl shadow-none border-0 md:border min-h-screen md:min-h-0">
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={processing}
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <CardContent className="p-4 md:p-8 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Side - Plan Summary */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <Badge className="bg-blue-600 text-white">
                  Premium
                </Badge>
              </div>

              <div>
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>

              <p className="text-muted-foreground text-sm">
                {plan.description}
              </p>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b82f6] mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Payment Method */}
            <div className="space-y-4 md:space-y-6">
              {/* Saved Cards Selection */}
              {savedPaymentMethods.length > 0 && isStripeEnabled && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Saved Payment Methods</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {savedPaymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          setSelectedSavedCard(method.id);
                          setSelectedMethod('saved_card');
                        }}
                        className={`p-3 border rounded-lg transition-all text-left ${
                          selectedSavedCard === method.id && selectedMethod === 'saved_card'
                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">•••• {method.lastFour}</div>
                            <div className="text-xs text-muted-foreground">
                              {method.cardholderName} • Expires {method.expiryDate}
                            </div>
                          </div>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-base mb-3">{savedPaymentMethods.length > 0 ? 'Other payment methods' : 'Payment method'}</h3>
                
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
                  {/* Primary Gateway - VodaPay as Card when it's primary */}
                  {primaryGateway?.gatewayId === 'vodapay' && (
                    <button
                      onClick={() => setSelectedMethod('vodapay')}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        selectedMethod === 'vodapay'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      data-testid="button-method-vodapay"
                    >
                      <CreditCard className="w-5 h-5 mx-auto dark:text-white" />
                      <span className="text-xs mt-1 block dark:text-white">Card</span>
                    </button>
                  )}

                  {/* Primary Gateway - Stripe Card when it's primary */}
                  {isStripeEnabled && primaryGateway?.gatewayId === 'stripe' && (
                    <button
                      onClick={() => setSelectedMethod('card')}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        selectedMethod === 'card'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      data-testid="button-method-card"
                    >
                      <CreditCard className="w-5 h-5 mx-auto dark:text-white" />
                      <span className="text-xs mt-1 block dark:text-white">Card</span>
                    </button>
                  )}

                  {/* Card Payment - Always show when enabled (supports Google Pay, Apple Pay) */}
                  {isDodoEnabled && (
                    <button
                      onClick={() => setSelectedMethod('dodopay')}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        selectedMethod === 'dodopay'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      data-testid="button-method-dodopay"
                    >
                      <CreditCard className="w-5 h-5 mx-auto dark:text-white" />
                      <span className="text-xs mt-1 block dark:text-white">Card</span>
                    </button>
                  )}

                  {/* Primary Gateway - Paystack when it's primary */}
                  {primaryGateway?.gatewayId === 'paystack' && (
                    <button
                      onClick={() => setSelectedMethod('paystack')}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        selectedMethod === 'paystack'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      data-testid="button-method-paystack"
                    >
                      <CreditCard className="w-5 h-5 mx-auto dark:text-white" />
                      <span className="text-xs mt-1 block dark:text-white">Card</span>
                    </button>
                  )}

                  {/* Apple Pay - Always show if Stripe is enabled and paymentRequest available */}
                  {isStripeEnabled && paymentRequest && (
                    <>
                      <button
                        onClick={() => setSelectedMethod('wallet')}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          selectedMethod === 'wallet'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        data-testid="button-method-applepay"
                      >
                        <svg className="w-5 h-5 mx-auto dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        <span className="text-xs mt-1 block dark:text-white">Pay</span>
                      </button>

                      <button
                        onClick={() => setSelectedMethod('wallet')}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          selectedMethod === 'wallet'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        data-testid="button-method-googlepay"
                      >
                        <svg className="w-5 h-5 mx-auto" viewBox="0 0 48 48">
                          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                        </svg>
                        <span className="text-xs mt-1 block dark:text-white">G Pay</span>
                      </button>
                    </>
                  )}
                  
                  {/* PayPal - Always show if enabled */}
                  {isPayPalEnabled && (
                    <button
                      onClick={() => setSelectedMethod('paypal')}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        selectedMethod === 'paypal'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      data-testid="button-method-paypal"
                    >
                      <img 
                        src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" 
                        alt="PayPal" 
                        className="h-6 mx-auto"
                      />
                      <span className="text-xs mt-1 block dark:text-white">PayPal</span>
                    </button>
                  )}

                  {/* System Wallet - Always show wallet option */}
                  <button
                    onClick={() => setSelectedMethod('system_wallet')}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      selectedMethod === 'system_wallet'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                        : hasSufficientBalance 
                          ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          : 'border-gray-200 dark:border-gray-700 opacity-50'
                    }`}
                    data-testid="button-method-system-wallet"
                  >
                    <Wallet className="w-5 h-5 mx-auto dark:text-white" />
                    <span className="text-xs mt-1 block dark:text-white">Wallet</span>
                    <span className="text-[10px] block dark:text-white">${walletBalance.toFixed(2)}</span>
                  </button>
                </div>
              </div>

              {/* PayPal Payment */}
              {selectedMethod === 'paypal' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    You will be redirected to PayPal to complete your payment securely.
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handlePayPalPayment}
                    disabled={processing}
                    className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-6 text-base font-semibold"
                    data-testid="button-paypal-checkout"
                  >
                    {processing ? 'Redirecting...' : 'Continue with PayPal'}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure payment via PayPal</span>
                  </div>
                </div>
              )}

              {/* Wallet Payment */}
              {selectedMethod === 'wallet' && paymentRequest && (
                <div className="space-y-4">
                  <PaymentRequestButtonElement options={{ paymentRequest }} />
                  <p className="text-sm text-muted-foreground text-center">
                    Or choose another payment method above
                  </p>
                </div>
              )}

              {/* Card Payment - Show if primary gateway is card-based */}
              {selectedMethod === 'card' && isStripeEnabled && primaryGateway?.gatewayId === 'stripe' && (
                <form onSubmit={handleCardPayment} className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-3">Payment information</h3>
                    <div className="flex gap-2 mb-3">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                      <img src="https://www.americanexpress.com/content/dam/amex/us/merchant/supplies-uplift/product/images/4_Card_color_horizontal.png" alt="American Express" className="h-6" />
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-white">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': {
                                color: '#aab7c4',
                              },
                            },
                            invalid: {
                              color: '#9e2146',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!stripe || !clientSecret || processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
                    data-testid="button-submit-payment"
                  >
                    {processing ? 'Processing...' : `Complete Purchase`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure 256-bit SSL encrypted payment</span>
                  </div>
                </form>
              )}

              {/* Saved Card Payment */}
              {selectedMethod === 'saved_card' && selectedSavedCard && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    You will be charged ${plan.price}/{plan.interval} using your saved card ending in {savedPaymentMethods.find(m => m.id === selectedSavedCard)?.lastFour}
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleSavedCardPayment}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
                    data-testid="button-saved-card-checkout"
                  >
                    {processing ? "Processing..." : "Complete Purchase"}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure 256-bit SSL encrypted payment</span>
                  </div>
                </div>
              )}

              {/* System Wallet Payment */}
              {selectedMethod === 'system_wallet' && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-100">
                      Pay with your wallet balance
                    </p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300 mt-1">
                      Available: ${walletBalance.toFixed(2)}
                    </p>
                    {!hasSufficientBalance && (
                      <p className="text-sm text-red-600 mt-2">
                        Insufficient balance. You need ${(plan.price - walletBalance).toFixed(2)} more.
                      </p>
                    )}
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    onClick={async () => {
                      if (!hasSufficientBalance) {
                        setError(`Insufficient wallet balance. You have $${walletBalance.toFixed(2)}, but need $${plan.price.toFixed(2)}.`);
                        return;
                      }
                      
                      setProcessing(true);
                      setError('');
                      try {
                        const response = await apiRequest('/api/subscriptions/create', {
                          method: 'POST',
                          body: JSON.stringify({
                            planType: plan.tier,
                            billingCycle: plan.interval,
                            gateway: 'wallet'
                          })
                        });

                        if (response.success) {
                          // Invalidate queries to refresh subscription and wallet status
                          queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/user/subscription'] });
                          
                          setPaymentDetails({
                            transactionId: `WAL-${Date.now()}`,
                            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                            paymentMethod: 'System Wallet',
                            total: plan.price,
                            planName: plan.name
                          });
                          
                          setPaymentStatus('success');
                          setShowSuccess(true);
                          setTimeout(() => onSuccess(), 2000);
                        } else {
                          throw new Error(response.error || 'Wallet payment failed');
                        }
                      } catch (err: any) {
                        setError(err.message || 'Wallet payment failed. Please try another payment method.');
                      } finally {
                        setProcessing(false);
                      }
                    }}
                    disabled={processing || !hasSufficientBalance}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
                    data-testid="button-wallet-checkout"
                  >
                    {processing ? 'Processing...' : `Pay $${plan.price.toFixed(2)} from Wallet`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure payment from your wallet</span>
                  </div>
                </div>
              )}

              {/* Paystack Payment */}
              {selectedMethod === 'paystack' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    Complete your payment securely with Paystack.
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    onClick={() => {
                      setProcessing(true);
                      initializePaystack({
                        onSuccess: paystackConfig.onSuccess,
                        onClose: paystackConfig.onClose
                      });
                    }}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
                    data-testid="button-paystack-checkout"
                  >
                    {processing ? 'Processing...' : 'Complete Purchase'}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure payment via Paystack</span>
                  </div>
                </div>
              )}

              {/* Card Payment - Embedded Overlay */}
              {selectedMethod === 'dodopay' && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-2 items-center">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-5" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
                    <span className="text-xs text-muted-foreground ml-1">+ Google Pay, Apple Pay</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                    Secure checkout will open to complete your payment.
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    onClick={handleDodoCardPayment}
                    disabled={processing}
                    className="w-full bg-[#6366f1] hover:bg-[#5558e3] text-white py-6 text-base font-semibold rounded-xl"
                    data-testid="button-dodopay-checkout"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2 justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </span>
                    ) : (
                      'Pay with Card'
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure payment processing</span>
                  </div>
                </div>
              )}

              {/* VodaPay Payment */}
              {selectedMethod === 'vodapay' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    You will be redirected to VodaPay to complete your payment securely.
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    onClick={async () => {
                      setProcessing(true);
                      setError('');
                      try {
                        const response = await fetch('/api/vodapay/initialize', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            amount: plan.price,
                            currency: 'USD',
                            courseId: `subscription_${plan.tier}`,
                            courseName: `${plan.name} Subscription`,
                            userEmail: user?.email || '',
                            returnUrl: `${window.location.origin}/student-dashboard?payment=success&plan=${plan.tier}`,
                            cancelUrl: `${window.location.origin}/student-dashboard?payment=cancelled`,
                          }),
                        });

                        const data = await response.json();
                        
                        if (data.success && data.checkoutUrl) {
                          window.location.href = data.checkoutUrl;
                        } else {
                          throw new Error(data.error || 'Failed to initialize VodaPay payment');
                        }
                      } catch (err: any) {
                        console.error('VodaPay payment error:', err);
                        setError(err.message || 'VodaPay payment failed. Please try again.');
                        setProcessing(false);
                      }
                    }}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
                    data-testid="button-vodapay-checkout"
                  >
                    {processing ? 'Redirecting...' : 'Continue with VodaPay'}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure payment via VodaPay</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
