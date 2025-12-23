import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Shield, Wallet, X } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { SiPaypal, SiStripe, SiApplepay, SiGooglepay } from 'react-icons/si';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Logo from '@/components/Logo';
import Lottie from 'lottie-react';
import smLoader from '@/assets/sm-loader.json';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import PayPalButton from '@/components/PayPalButton';
import { getStripePromise } from '@/lib/stripe';

interface PaymentFormProps {
  paymentData: {
    clientSecret: string;
    paymentIntentId: string;
    bannerId: string;
    amount: number;
    bannerTitle: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
  onNavigate?: (page: string) => void;
}

interface PaymentGateway {
  gatewayId: string;
  gatewayName: string;
  isPrimary: boolean;
  supportedCurrencies: string[] | null;
  features: string[] | null;
  testMode: boolean;
}

const PaymentForm = ({ paymentData, onSuccess, onCancel, onNavigate }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [stripeLoading, setStripeLoading] = useState(true);
  const [countries, setCountries] = useState<Array<{id: number, name: string, code: string}>>([]);
  const [redirecting, setRedirecting] = useState(false);
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
  
  const allGateways: PaymentGateway[] = Array.isArray(gatewaysData) ? gatewaysData : (gatewaysData as any)?.data || [];
  const enabledGateways = allGateways.filter(gateway => 
    gateway.gatewayId !== 'paystack' && 
    (!gateway.gatewayName.toLowerCase().includes('test') || gateway.gatewayName === 'Test Mode')
  );
  const primaryGateway = enabledGateways.find(g => g.isPrimary) || enabledGateways[0];

  // Set primary gateway as default payment method when gateways load
  useEffect(() => {
    if (primaryGateway && !paymentMethod) {
      setPaymentMethod(primaryGateway.gatewayId);
    }
  }, [primaryGateway, paymentMethod]);

  // Fetch countries for billing address
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/countries');
        const result = await response.json();
        if (result.success) {
          setCountries(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
    };
    fetchCountries();
  }, []);
  
  // Add a timeout for Stripe loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!stripe || !elements) {
        console.error('Stripe failed to load within timeout');
        setError('Payment system failed to load. Please try again or contact support.');
      }
      setStripeLoading(false);
    }, 10000); // 10 second timeout
    
    if (stripe && elements) {
      setStripeLoading(false);
      clearTimeout(timer);
    }
    
    return () => clearTimeout(timer);
  }, [stripe, elements]);

  // Safety timeout to prevent infinite loading during payment processing
  useEffect(() => {
    if (isLoading && !redirecting) {
      const safetyTimeout = setTimeout(() => {
        setIsLoading(false);
        setError('Payment processing timeout. Please check your ads dashboard to verify payment status, or try again.');
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(safetyTimeout);
    }
  }, [isLoading, redirecting]);
  
  console.log('PaymentForm - Stripe ready:', !!stripe, 'Elements ready:', !!elements);

  // Wallet payment mutation
  const walletPaymentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/process-wallet-payment', {
        method: 'POST',
        body: JSON.stringify({
          amount: paymentData.amount,
          bannerId: paymentData.bannerId,
          type: 'banner_ad'
        })
      });
    },
    onSuccess: () => {
      localStorage.removeItem('pendingPaymentData');
      sessionStorage.setItem('paymentSuccessData', JSON.stringify({
        session_id: `wallet_${paymentData.bannerId}`,
        banner_id: paymentData.bannerId,
        banner_amount: paymentData.amount,
        banner_title: paymentData.bannerTitle,
        paymentType: 'banner',
        payment_method: 'wallet'
      }));
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 600);
    },
    onError: (error: any) => {
      setIsLoading(false);
      setError(error.message || 'Wallet payment failed. Please try again.');
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

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (paymentError) {
        console.error('Payment failed:', paymentError);
        
        if (paymentError.code === 'payment_intent_unexpected_state') {
          setError('This payment has already been processed. Please check your ads dashboard.');
        } else {
          setError(paymentError.message || 'Payment failed. Please try again.');
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        try {
          const confirmResponse = await apiRequest('/api/ads/banner/confirm-payment', {
            method: 'POST',
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              bannerId: paymentData.bannerId
            })
          });

          if (confirmResponse.success) {
            // Clear stored payment data
            localStorage.removeItem('pendingPaymentData');
            
            // Store payment success data for the success page
            sessionStorage.setItem('paymentSuccessData', JSON.stringify({
              session_id: paymentIntent.id,
              banner_id: paymentData.bannerId
            }));
            
            // Show success animation
            setIsLoading(false);
            setShowSuccess(true);
            
            // Navigate instantly after showing checkmark
            setTimeout(() => {
              onSuccess();
            }, 600);
          } else {
            throw new Error(confirmResponse.error || 'Payment confirmation failed');
          }
        } catch (confirmError) {
          console.error('Error confirming payment:', confirmError);
          setError('Payment processed but confirmation failed. Please contact support.');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{paymentData.bannerTitle}</div>
                    <div className="text-xs text-muted-foreground">Banner ad • 7 days duration</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">${paymentData.amount}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total due today</span>
                  <span>${paymentData.amount}</span>
                </div>
              </div>
            </div>

            {/* Right Side - Payment Method */}
            <div className="space-y-4 md:space-y-6">
              {/* Error Display */}
              {error && (
                <div className="p-3 bg-primary/10 border border-red-200 rounded text-sm text-primary-700">
                  {error}
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
                  
                  {enabledGateways.map((gateway) => (
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
                      ) : gateway.gatewayId === 'paypal' ? (
                        <>
                          <img 
                            src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" 
                            alt="PayPal" 
                            className="h-8 mx-auto"
                          />
                          <span className="text-xs mt-1 block">PayPal</span>
                        </>
                      ) : (
                        <span className="text-xs">{gateway.gatewayName}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

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
                    className="w-full bg-primary hover:bg-primary text-white py-6 text-base font-semibold"
                    data-testid="button-complete-purchase"
                  >
                    {isLoading ? 'Processing...' : `Pay $${paymentData.amount}`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure 256-bit SSL encrypted payment</span>
                  </div>
                </form>
              )}

              {/* PayPal Payment */}
              {paymentMethod === 'paypal' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    You will be redirected to PayPal to complete your payment securely.
                  </div>

                  <PayPalButton
                    amount={paymentData.amount.toFixed(2)}
                    currency="USD"
                    intent="CAPTURE"
                    onSuccess={async (data) => {
                      setIsLoading(true);
                      try {
                        const confirmResponse = await apiRequest('/api/ads/banner/confirm-paypal-payment', {
                          method: 'POST',
                          body: JSON.stringify({
                            paypalOrderId: data.orderID,
                            bannerId: paymentData.bannerId
                          })
                        });

                        if (confirmResponse.success) {
                          localStorage.removeItem('pendingPaymentData');
                          sessionStorage.setItem('paymentSuccessData', JSON.stringify({
                            session_id: data.orderID,
                            banner_id: paymentData.bannerId
                          }));
                          setIsLoading(false);
                          setShowSuccess(true);
                          setTimeout(() => onSuccess(), 600);
                        } else {
                          throw new Error(confirmResponse.error || 'Payment confirmation failed');
                        }
                      } catch (confirmError: any) {
                        setIsLoading(false);
                        setError(confirmError.message || 'Payment processed but confirmation failed. Please contact support.');
                      }
                    }}
                    onError={(error) => {
                      setError('PayPal payment failed. Please try again.');
                    }}
                    onCancel={() => {
                      setError('Payment was cancelled.');
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
                      
                      {walletBalance >= paymentData.amount ? (
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                          ✓ Sufficient balance available
                        </div>
                      ) : (
                        <div className="bg-amber-50 p-3 rounded text-sm text-amber-800">
                          ⚠ Insufficient balance. Need ${(paymentData.amount - walletBalance).toFixed(2)} more.
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={walletBalance < paymentData.amount || isLoading}
                    className="w-full bg-primary hover:bg-primary text-white py-6 text-base font-semibold"
                    data-testid="button-wallet-payment"
                  >
                    {isLoading ? 'Processing...' : `Pay $${paymentData.amount}`}
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

interface BannerPaymentProps {
  onNavigate?: (page: string) => void;
}

export default function BannerPayment({ onNavigate }: BannerPaymentProps) {
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  useEffect(() => {
    // Load payment data from localStorage
    const storedData = localStorage.getItem('pendingPaymentData');
    console.log('Stored payment data:', storedData);
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        console.log('Parsed payment data:', data);
        console.log('Client secret:', data.clientSecret ? 'EXISTS' : 'MISSING');
        setPaymentData(data);
      } catch (error) {
        console.error('Error parsing payment data:', error);
        onNavigate?.('banner-creator');
      }
    } else {
      console.log('No payment data found in localStorage');
      onNavigate?.('banner-creator');
    }
    setLoading(false);
  }, []);

  const handleSuccess = () => {
    onNavigate?.('payment-success');
  };

  const handleCancel = () => {
    onNavigate?.('banner-creator');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            <span className="ml-3">Loading payment form...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentData || !paymentData.clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-primary-600">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Unable to load payment information.</p>
            <Button onClick={() => onNavigate?.('banner-creator')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Banner Creator
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const options = {
    clientSecret: paymentData.clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };
  
  console.log('Stripe Elements options:', options);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm 
          paymentData={paymentData}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onNavigate={onNavigate}
        />
      </Elements>
    </div>
  );
}
