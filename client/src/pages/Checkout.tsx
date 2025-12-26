import { useStripe, Elements, CardElement, useElements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Shield, Wallet, X } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { SiPaypal, SiStripe, SiApplepay, SiGooglepay } from 'react-icons/si';
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getFriendlyErrorMessage, logError } from '@/lib/error-handler';
import Logo from '@/components/Logo';
import Lottie from 'lottie-react';
import paymentSuccessAnimation from '@/assets/payment-success.json';
import PayPalButton from '@/components/PayPalButton';
import { getStripePromise } from '@/lib/stripe';
import { isCardGateway, isAlwaysVisibleGateway, getGatewayDisplayName } from '@/utils/paymentGateways';

interface PaymentGateway {
  gatewayId: string;
  gatewayName: string;
  isPrimary: boolean;
  supportedCurrencies: string[] | null;
  features: string[] | null;
  testMode: boolean;
}

interface CheckoutFormProps {
  amount: number;
  planName: string;
  billingCycle: string;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  orderData?: any;
  membershipUpgrade?: boolean;
}

export const CheckoutForm = ({ amount, planName, billingCycle, clientSecret, onSuccess, onCancel, orderData, membershipUpgrade = false }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { formatPrice } = useCurrency();
  const { user, refreshAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [stripeLoading, setStripeLoading] = useState(true);
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  // Fetch enabled payment gateways
  const { data: gatewaysData } = useQuery<{ success: boolean; data: PaymentGateway[] }>({
    queryKey: ['/api/payment-gateways/enabled'],
  });

  // Fetch user wallet balance if logged in
  const { data: walletData } = useQuery<{ balance: string }>({
    queryKey: ['/api/shop/wallet'],
    enabled: !!user,
  });

  const walletBalance = walletData?.balance ? parseFloat(walletData.balance) : 0;
  
  // The query client automatically unwraps the response, so gatewaysData might be the array directly or wrapped
  const allGateways: PaymentGateway[] = Array.isArray(gatewaysData) ? gatewaysData : (gatewaysData as any)?.data || [];
  
  // Filter out Paystack and test gateways
  const enabledGateways = allGateways.filter(gateway => 
    gateway.gatewayId !== 'paystack' && 
    (!gateway.gatewayName.toLowerCase().includes('test') || gateway.gatewayName === 'Test Mode')
  );
  
  // Filter gateways to show only primary card gateway + always-visible gateways
  const displayGateways = useMemo(() => {
    // Find the primary card gateway (Stripe, VodaPay, Dodo)
    const primaryCardGateway = enabledGateways.find(g => 
      isCardGateway(g.gatewayId) && g.isPrimary
    );
    
    // Fallback: if no primary card gateway, use the first card gateway
    const selectedCardGateway = primaryCardGateway || 
      enabledGateways.find(g => isCardGateway(g.gatewayId));
    
    // Always-visible gateways (PayPal, Google Pay, Apple Pay)
    const alwaysVisibleGateways = enabledGateways.filter(g => 
      isAlwaysVisibleGateway(g.gatewayId)
    );
    
    // Combine: selected card gateway + always-visible gateways
    return [
      ...(selectedCardGateway ? [selectedCardGateway] : []),
      ...alwaysVisibleGateways
    ];
  }, [enabledGateways]);
  
  const primaryGateway = displayGateways.find(g => g.isPrimary) || displayGateways[0];

  // Set primary gateway as default payment method when gateways load
  useEffect(() => {
    if (primaryGateway && !paymentMethod) {
      setPaymentMethod(primaryGateway.gatewayId);
    }
  }, [primaryGateway, paymentMethod]);

  // Fast Stripe loading - no unnecessary timeout
  useEffect(() => {
    if (stripe && elements) {
      setStripeLoading(false);
    }
  }, [stripe, elements]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const safetyTimeout = setTimeout(() => {
        setIsLoading(false);
        setError(getFriendlyErrorMessage('Payment processing timeout'));
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(safetyTimeout);
    }
  }, [isLoading]);

  // Helper function to handle successful payment
  const handlePaymentSuccess = async (paymentIntent: any, gateway: string = '') => {
    try {
      // Check if this is an order payment, membership upgrade, freelancer plan, or subscription payment
      const isOrderPayment = orderData && (orderData.order || orderData.data?.order);
      const actualOrderData = orderData?.data || orderData;
      const isFreelancerPlan = (paymentIntent as any).metadata?.planType === 'freelancer';
      
      const endpoint = isOrderPayment 
        ? '/api/confirm-order-payment' 
        : membershipUpgrade 
        ? '/api/shop/membership/confirm-upgrade' 
        : isFreelancerPlan
        ? '/api/confirm-freelancer-subscription'
        : '/api/confirm-payment';
      
      // Prepare headers and request body based on user authentication
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let requestBody: any = { paymentIntentId: paymentIntent.id, gateway };
      
      if (isOrderPayment) {
        // Order payment - require authentication
        if (!user) {
          throw new Error('Authentication required for order payment confirmation. Please sign in to continue.');
        }
        
        // Add authentication header
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          headers['Authorization'] = `Bearer ${sessionId}`;
        }
        
        // For authenticated users, don't send userId in body (comes from auth)
        requestBody.orderId = actualOrderData.order?.id || actualOrderData.id;
      } else {
        // Subscription payment (regular or freelancer)
        requestBody.userId = user?.id || 'guest';
        requestBody.guestEmail = !user ? guestEmail : undefined;
      }

      const confirmResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      const confirmResult = await confirmResponse.json();
      if (confirmResult.success) {
        // Invalidate profile cache for freelancer subscriptions to show badge immediately
        if (isFreelancerPlan && user) {
          queryClient.invalidateQueries({ queryKey: ['/api/me/profile'] });
          queryClient.invalidateQueries({ queryKey: ['/api/freelancers/profile', user.id] });
          queryClient.invalidateQueries({ queryKey: ['/api/freelancer/subscription'] });
        }
        
        // Invalidate profile cache for membership upgrades to show new tier immediately
        if (membershipUpgrade && user) {
          queryClient.invalidateQueries({ queryKey: ['/api/me/profile'] });
          await refreshAuth();
        }
        
        // Calculate order items for display
        const cartItems = actualOrderData?.cartItems || orderData?.cartItems || [];
        const orderItems = isOrderPayment ? (cartItems.length > 0 ? cartItems : actualOrderData?.order?.items || actualOrderData?.items || []) : [];
        
        // Transform order items to include necessary fields for PaymentSuccess page
        let transformedOrderItems = null;
        if (isOrderPayment && orderItems.length > 0) {
          transformedOrderItems = orderItems.map((item: any) => ({
            productName: item.productName || item.product?.name || 'Product',
            quantity: item.quantity || 1,
            priceAtAdd: item.priceAtAdd || item.unitPrice || item.price || '0',
            productType: item.productType || item.product?.type || 'digital'
          }));
        }
        
        // Store payment data in sessionStorage for smooth transition
        const paymentData = {
          session_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          payment_method: gateway,
          paymentType: isOrderPayment ? 'order' : isFreelancerPlan ? 'freelancer' : 'membership',
          orderData: isOrderPayment ? actualOrderData : null,
          orderItems: transformedOrderItems
        };
        
        sessionStorage.setItem('paymentSuccessData', JSON.stringify(paymentData));
        
        // Show success animation and navigate immediately
        setIsLoading(false);
        setShowSuccess(true);
        
        // Navigate instantly after showing checkmark
        setTimeout(() => {
          onSuccess();
        }, 600);
      } else {
        throw new Error(confirmResult.error || 'Payment confirmation failed');
      }
    } catch (confirmError) {
      const friendlyError = getFriendlyErrorMessage(confirmError);
      logError(confirmError, 'Checkout.handlePaymentSuccess');
      setError(friendlyError);
      setIsLoading(false);
    }
  };

  // Wallet payment mutation
  const walletPaymentMutation = useMutation({
    mutationFn: async () => {
      const isOrderPayment = orderData && (orderData.order || orderData.data?.order);
      const actualOrderData = orderData?.data || orderData;
      
      return await apiRequest('/api/process-wallet-payment', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          orderId: isOrderPayment ? (actualOrderData.order?.id || actualOrderData.id) : null,
          planName: isOrderPayment ? null : (planName || 'Premium Plan'),
          billingCycle: isOrderPayment ? null : (billingCycle || 'monthly'),
        }),
      });
    },
    onSuccess: (data) => {
      setIsLoading(false);
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
        
        // Store payment data in sessionStorage for PaymentSuccess page
        const isOrderPayment = orderData && (orderData.order || orderData.data?.order);
        const actualOrderData = orderData?.data || orderData;
        
        let transformedOrderItems = null;
        if (isOrderPayment && orderItems.length > 0) {
          transformedOrderItems = orderItems.map((item: any) => ({
            productName: item.productName || item.product?.name || 'Product',
            quantity: item.quantity || 1,
            priceAtAdd: String(item.priceAtAdd || item.unitPrice || item.price || '0'),
            productType: item.productType || item.product?.type || 'digital'
          }));
        }
        
        const paymentData = {
          session_id: data.paymentId || `wallet_${Date.now()}`,
          amount: Math.round(Number(amount) * 100), // Convert to cents as integer
          currency: 'USD',
          payment_method: 'wallet',
          paymentType: isOrderPayment ? 'order' : 'membership',
          orderData: isOrderPayment ? actualOrderData : null,
          orderItems: transformedOrderItems
        };
        
        sessionStorage.setItem('paymentSuccessData', JSON.stringify(paymentData));
        
        setShowSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 600);
      } else {
        setError(data.error || 'Wallet payment failed');
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      const friendlyError = getFriendlyErrorMessage(error);
      logError(error, 'Checkout.walletPayment');
      setError(friendlyError);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Handle wallet payment
    if (paymentMethod === 'wallet') {
      setIsLoading(true);
      setError('');
      walletPaymentMutation.mutate();
      return;
    }

    // Handle VodaPay payment - redirect to VodaPay checkout
    if (paymentMethod === 'vodapay') {
      setIsLoading(true);
      setError('');
      
      try {
        const isOrderPayment = orderData && (orderData.order || orderData.data?.order);
        const actualOrderData = orderData?.data || orderData;
        
        const response = await fetch('/api/vodapay/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount,
            currency: 'USD',
            courseId: isOrderPayment ? actualOrderData.order?.id || actualOrderData.id : 'subscription',
            courseName: isOrderPayment ? 'Order Payment' : (planName || 'Premium Subscription'),
            userEmail: user?.email || guestEmail,
            returnUrl: `${window.location.origin}/payment-success?gateway=vodapay`,
            cancelUrl: `${window.location.origin}/payment-cancelled`,
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
        setIsLoading(false);
      }
      return;
    }

    // Handle DodoPay payment - redirect to DodoPay checkout
    if (paymentMethod === 'dodo' || paymentMethod === 'dodopay') {
      setIsLoading(true);
      setError('');
      
      try {
        const isOrderPayment = orderData && (orderData.order || orderData.data?.order);
        const actualOrderData = orderData?.data || orderData;
        
        const response = await fetch('/api/dodopay/checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount,
            currency: 'USD',
            courseId: isOrderPayment ? actualOrderData.order?.id || actualOrderData.id : 'subscription',
            courseName: isOrderPayment ? 'Order Payment' : (planName || 'Premium Subscription'),
            userEmail: user?.email || guestEmail,
            userName: guestEmail || user?.email || '',
            returnUrl: `${window.location.origin}/?page=customer-dashboard&paymentComplete=true`,
          }),
        });

        const data = await response.json();
        
        if (data.success && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error(data.error || 'Failed to initialize DodoPay payment');
        }
      } catch (err: any) {
        console.error('DodoPay payment error:', err);
        setError(err.message || 'DodoPay payment failed. Please try again.');
        setIsLoading(false);
      }
      return;
    }

    // Handle card payment
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (paymentError) {
        console.error('Payment failed:', paymentError);
        setError(paymentError.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded, confirm it on the backend
        await handlePaymentSuccess(paymentIntent, 'stripe');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate order details
  const isOrderPayment = orderData && (orderData.order || orderData.data?.order);
  const actualOrderData = orderData?.data || orderData; // Handle both direct order and API response format
  // Use cart items if available (for authenticated users), otherwise use order items (for guest users)
  const cartItems = actualOrderData?.cartItems || orderData?.cartItems || [];
  const orderItems = isOrderPayment ? (cartItems.length > 0 ? cartItems : actualOrderData?.order?.items || actualOrderData?.items || []) : [];
  const totalItems = isOrderPayment ? orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) : 1;
  
  // Calculate actual order total from items for display
  const displayAmount = isOrderPayment && orderItems.length > 0
    ? orderItems.reduce((sum: number, item: any) => {
        const price = parseFloat(item.priceAtAdd || item.price || item.product?.price || '0');
        const qty = item.product?.type === 'digital' ? 1 : (item.quantity || 1);
        return sum + (price * qty);
      }, 0)
    : amount;
  
  // Check if order contains any physical products (for shipping)
  const hasPhysicalProducts = isOrderPayment && orderItems.some((item: any) => 
    (item.productType || item.product?.type) !== 'digital'
  );

  return (
    <div className="fixed inset-0 md:bg-black/60 md:backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto md:py-8 md:px-4">
      {/* Processing Payment Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-white z-[9999] flex flex-col items-center justify-center overflow-hidden">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Processing payment...</p>
        </div>
      )}
      
      {/* Payment Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-white z-[9999] flex flex-col items-center justify-center overflow-hidden">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-green-500 flex items-center justify-center animate-bounce-in shadow-2xl">
              <svg className="w-20 h-20 text-white animate-check-draw" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="mt-8 text-3xl font-bold text-gray-900 animate-fade-in">Payment Successful!</h2>
          <p className="mt-2 text-gray-600 animate-fade-in-delay">Redirecting...</p>
          <style>{`
            @keyframes bounce-in {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes check-draw {
              0% { stroke-dasharray: 0, 100; }
              100% { stroke-dasharray: 100, 100; }
            }
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-bounce-in {
              animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            .animate-check-draw {
              stroke-dasharray: 100;
              animation: check-draw 0.5s ease-out 0.3s forwards;
            }
            .animate-fade-in {
              animation: fade-in 0.5s ease-out 0.5s forwards;
              opacity: 0;
            }
            .animate-fade-in-delay {
              animation: fade-in 0.5s ease-out 0.7s forwards;
              opacity: 0;
            }
          `}</style>
        </div>
      )}
      
      <Card className="rounded-2xl text-[#1F1E30] border-gray-100 w-full md:max-w-5xl bg-gradient-to-br from-white via-white to-blue-50/30 md:shadow-2xl shadow-none border-0 md:border min-h-screen md:min-h-0">
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors transition-all duration-300"
            disabled={isLoading}
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <CardContent className="p-4 md:p-8 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Side - Order Summary */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="font-semibold text-base md:text-lg">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    {isOrderPayment ? <CreditCard className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {isOrderPayment ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'}` : planName || 'Premium Plan'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isOrderPayment ? 'Digital and physical products' : 'One-time purchase • Instant access'}
                    </div>
                  </div>
                </div>
                
                {isOrderPayment && orderItems.length > 0 && (
                  <div className="space-y-2 pl-9">
                    {orderItems.slice(0, 3).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {item.productName || item.product?.name || 'Product'} × {item.quantity || 1}
                        </span>
                        <span className="font-medium">
                          ${(parseFloat(item.priceAtAdd || item.unitPrice || item.price || '0') * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {orderItems.length > 3 && (
                      <div className="text-xs text-gray-500 italic">
                        +{orderItems.length - 3} more items
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(displayAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total due today</span>
                  <span>{formatPrice(amount)}</span>
                </div>
              </div>
            </div>

            {/* Right Side - Payment Method */}
            <div className="space-y-4 md:space-y-6">
              {/* Email Field */}
              {!user && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    data-testid="input-email"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send your receipt to this email address
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-base mb-3">Payment method</h3>
                
                {/* Payment Method Selection */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {user && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`flex-1 p-3 border rounded-lg transition-all ${
                        paymentMethod === 'wallet' 
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      data-testid="button-payment-wallet"
                    >
                      <Wallet className="w-5 h-5 mx-auto" />
                      <span className="text-xs mt-1 block">Wallet</span>
                      <span className="text-xs text-blue-600 font-medium">${walletBalance.toFixed(2)}</span>
                    </button>
                  )}
                  
                  {displayGateways.map((gateway) => (
                    <button
                      key={gateway.gatewayId}
                      type="button"
                      onClick={() => setPaymentMethod(gateway.gatewayId)}
                      className={`flex-1 p-3 border rounded-lg transition-all ${
                        paymentMethod === gateway.gatewayId 
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      data-testid={`button-payment-${gateway.gatewayId}`}
                    >
                      {gateway.gatewayId === 'stripe' ? (
                        <>
                          <CreditCard className="w-5 h-5 mx-auto" />
                          <span className="text-xs mt-1 block">Card</span>
                        </>
                      ) : gateway.gatewayId === 'vodapay' ? (
                        <>
                          <CreditCard className="w-5 h-5 mx-auto" />
                          <span className="text-xs mt-1 block">VodaPay</span>
                        </>
                      ) : (gateway.gatewayId === 'dodo' || gateway.gatewayId === 'dodopay') ? (
                        <>
                          <CreditCard className="w-5 h-5 mx-auto" />
                          <span className="text-xs mt-1 block">Card</span>
                        </>
                      ) : gateway.gatewayId === 'paypal' ? (
                        <>
                          <img 
                            src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" 
                            alt="PayPal" 
                            className="h-8 mx-auto"
                          />
                          <span className="text-xs mt-1 block">PayPal</span>
                        </>
                      ) : gateway.gatewayId === 'google-pay' ? (
                        <>
                          <SiGooglepay className="w-8 h-8 mx-auto" />
                          <span className="text-xs mt-1 block">Google Pay</span>
                        </>
                      ) : gateway.gatewayId === 'apple-pay' ? (
                        <>
                          <SiApplepay className="w-8 h-8 mx-auto" />
                          <span className="text-xs mt-1 block">Apple Pay</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mx-auto" />
                          <span className="text-xs mt-1 block">{gateway.gatewayName}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <div className="p-3 bg-primary/10 border border-red-200 rounded text-sm text-primary-700">
                  {error}
                </div>
              )}

              {/* Card Payment Form */}
              {paymentMethod === 'stripe' && (
                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <Button
                    type="submit"
                    disabled={!stripe || isLoading || stripeLoading}
                    className="w-full bg-primary hover:bg-primary text-white py-6 text-base font-semibold transition-all duration-300"
                    data-testid="button-complete-purchase"
                  >
                    {isLoading ? 'Processing...' : `Complete Purchase`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure 256-bit SSL encrypted payment</span>
                  </div>
                </form>
              )}

              {/* VodaPay Payment Form */}
              {paymentMethod === 'vodapay' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-3">VodaPay Payment</h3>
                    <div className="flex gap-2 mb-3">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-3">
                      You will be redirected to VodaPay's secure checkout to complete your payment.
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary text-white py-6 text-base font-semibold transition-all duration-300"
                    data-testid="button-complete-vodapay-purchase"
                  >
                    {isLoading ? 'Redirecting to VodaPay...' : `Continue with VodaPay`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure VodaPay payment processing</span>
                  </div>
                </div>
              )}

              {/* Card Payment Form (DodoPay) */}
              {(paymentMethod === 'dodo' || paymentMethod === 'dodopay') && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-3">Card Payment</h3>
                    <div className="flex gap-2 mb-3">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-3">
                      Secure checkout will open to complete your payment.
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary text-white py-6 text-base font-semibold transition-all duration-300"
                    data-testid="button-complete-dodo-purchase"
                  >
                    {isLoading ? 'Processing...' : `Pay with Card`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure payment processing</span>
                  </div>
                </div>
              )}

              {/* PayPal Payment */}
              {paymentMethod === 'paypal' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    You will be redirected to PayPal to complete your payment securely.
                  </div>

                  <PayPalButton
                    amount={amount.toFixed(2)}
                    currency="USD"
                    intent="CAPTURE"
                    onSuccess={async (data) => {
                      setShowSuccess(true);
                      setTimeout(() => {
                        onSuccess();
                      }, 600);
                    }}
                    onError={(error) => {
                      setError('PayPal payment failed. Please try again.');
                    }}
                    onCancel={() => {
                      console.log('PayPal payment cancelled');
                    }}
                  />

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure payment via PayPal</span>
                  </div>
                </div>
              )}

              {/* Wallet Payment */}
              {paymentMethod === 'wallet' && (
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b">
                        <span className="font-medium">Wallet Balance</span>
                        <span className="font-semibold text-blue-600">${walletBalance.toFixed(2)}</span>
                      </div>
                      
                      {walletBalance >= amount ? (
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                          ✓ Sufficient balance available
                        </div>
                      ) : (
                        <div className="bg-amber-50 p-3 rounded text-sm text-amber-800">
                          ⚠ Insufficient balance. Need ${(amount - walletBalance).toFixed(2)} more.
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={walletBalance < amount || isLoading}
                    className="w-full bg-primary hover:bg-primary text-white py-6 text-base font-semibold transition-all duration-300"
                    data-testid="button-wallet-payment"
                  >
                    {isLoading ? 'Processing...' : `Pay ${formatPrice(amount)}`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure wallet payment</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface CheckoutProps {
  amount: number;
  courseName: string;
  courseId: string;
  onSuccess: () => void;
  onCancel: () => void;
  clientSecret?: string;
  planName?: string;
  billingCycle?: string;
  orderData?: any; // Order data passed from cart checkout
  membershipUpgrade?: boolean;
}

export default function Checkout({ amount, courseName, courseId, onSuccess, onCancel, clientSecret: propClientSecret, planName, billingCycle, orderData, membershipUpgrade = false }: CheckoutProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<string>('USD');
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const { user } = useAuth();

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
      setStripeLoading(false);
    });
  }, []);

  useEffect(() => {
    // If clientSecret is already provided (from PremiumPage), use it directly
    if (propClientSecret) {
      setClientSecret(propClientSecret);
      setLoading(false);
      return;
    }

    // Otherwise, create PaymentIntent
    const createPaymentIntent = async () => {
      try {
        // Check if this is an order payment vs subscription payment
        const isOrderPayment = orderData && (orderData.order || orderData.data?.order);
        const actualOrderData = orderData?.data || orderData;
        
        let endpoint, requestBody;
        
        if (isOrderPayment) {
          // Order payment - now supports both authenticated and guest users
          
          endpoint = "/api/create-order-payment-intent";
          requestBody = {
            orderId: actualOrderData.order?.id || actualOrderData.id,
            currency: actualOrderData.order?.currency || actualOrderData.currency || 'USD',
            userId: user?.id || 'guest', // Support both authenticated and guest users
            ...((!user && actualOrderData) && { guestOrderData: actualOrderData }) // Include guest order data for guest users
          };
        } else {
          // Subscription payment
          endpoint = "/api/create-payment-intent";
          requestBody = {
            amount: amount,
            planName: planName || courseName || 'Premium Plan',
            billingCycle: billingCycle || 'monthly',
            userId: user?.id || 'guest'
          };
        }
        
        // Get auth token for logged-in users
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (user) {
          // Add authentication header for authenticated users
          const sessionId = localStorage.getItem('sessionId');
          if (sessionId) {
            headers['Authorization'] = `Bearer ${sessionId}`;
          }
        }
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        
        if (data.success) {
          setClientSecret(data.clientSecret);
          if (data.currency) {
            setPaymentCurrency(data.currency);
          }
          if (data.convertedAmount) {
            setConvertedAmount(data.convertedAmount);
          }
        } else {
          setError(data.error || 'Failed to create payment intent');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, courseId, courseName, propClientSecret, planName, billingCycle, orderData, user?.id]);

  // Show checkout immediately, stripe will handle its own loading
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {stripeLoading ? (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
          <div className="animate-pulse">Loading payment system...</div>
        </div>
      ) : !stripePromise ? (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto border-destructive/20">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Payment System Unavailable</CardTitle>
              <CardDescription>
                The payment system is currently unavailable. Please contact support or try again later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onCancel} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm 
            amount={convertedAmount}
            planName={planName || courseName}
            billingCycle={billingCycle || 'monthly'}
            clientSecret={clientSecret}
            onSuccess={onSuccess}
            onCancel={onCancel}
            orderData={orderData}
            membershipUpgrade={membershipUpgrade}
          />
        </Elements>
      ) : (
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="bg-gray-50 p-8 border-r">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-3 pt-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
