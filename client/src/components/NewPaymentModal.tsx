import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  CheckCircle2,
  DollarSign,
  BookOpen,
  X,
  Wallet,
  Smartphone,
  Loader2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiPaypal } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";
import { usePaystackPayment } from 'react-paystack';
import { useIPLocation } from "@/hooks/useIPLocation";
import { WORLD_CURRENCIES } from '@shared/currency';
import { useQuery } from "@tanstack/react-query";
import { useEnabledGateways } from "@/hooks/useEnabledGateways";
import { DodoPayments } from "dodopayments-checkout";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
}

interface NewPaymentModalProps {
  courseId: string;
  course: Course;
  onClose: () => void;
  purchaseMutation: any;
  confirmPurchaseMutation: any;
}

type PaymentMethod = 'paypal' | 'paystack' | 'dodopay' | 'vodapay' | 'system_wallet' | 'ecocash' | string;

export default function NewPaymentModal({ 
  courseId, 
  course, 
  onClose, 
  purchaseMutation, 
  confirmPurchaseMutation 
}: NewPaymentModalProps) {
  const { profile } = useAuth();
  
  // IP-based location detection + account registration country fallback for South Africa and Zimbabwe
  const { isSouthAfrican, isZimbabwean, countryCode, loading: locationLoading } = useIPLocation({ 
    profileCountry: profile?.country 
  });
  
  // Get currency info for South Africa
  const userCurrency = isSouthAfrican && countryCode ? WORLD_CURRENCIES[countryCode] : null;
  const currencySymbol = userCurrency?.symbol || '$';
  const exchangeRate = userCurrency?.rate || 1.0;
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed'>('success');
  const [promoCode, setPromoCode] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  // EcoCash payment states (for Zimbabwean users)
  const [ecocashPhone, setEcocashPhone] = useState('');
  const [ecocashClientCorrelator, setEcocashClientCorrelator] = useState<string | null>(null);
  const [ecocashPolling, setEcocashPolling] = useState(false);
  const [ecocashStatus, setEcocashStatus] = useState<'pending' | 'processing' | 'checking'>('pending');

  // Fetch enabled payment gateways
  const { data: enabledGateways = [], isLoading: gatewaysLoading } = useEnabledGateways();

  // For debugging
  console.log("Enabled Gateways from API:", enabledGateways);

  // Get primary gateway (fallback to first enabled if no primary set)
  const primaryGateway = enabledGateways.find(g => g.isPrimary) || enabledGateways[0];
  
  // Check if PayPal is enabled (should always show if enabled)
  const isPayPalEnabled = enabledGateways.some(g => g.gatewayId === 'paypal');
  
  // Check if Dodo Payments is enabled (should always show if enabled)
  const isDodoEnabled = enabledGateways.some(g => g.gatewayId === 'dodopay' || g.gatewayId === 'dodo');
  
  // Check if EcoCash is enabled (for Zimbabwean users)
  const isEcocashEnabled = enabledGateways.some(g => g.gatewayId === 'ecocash');
  
  // System wallet is always considered enabled if it exists in the gateways list
  const isWalletEnabled = enabledGateways.some(g => g.gatewayId === 'system_wallet');

  // isZimbabwean now includes both IP detection AND account registration country check
  const isUserFromZimbabwe = isZimbabwean;

  // Check if EcoCash API is configured
  const { data: ecocashApiConfig } = useQuery({
    queryKey: ['/api/ecocash/is-api-configured'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/ecocash/is-api-configured');
      } catch (error) {
        return { isConfigured: false };
      }
    }
  });
  const isEcocashApiConfigured = ecocashApiConfig?.isConfigured || false;

  // Fetch EcoCash manual payment settings (for when API is not configured)
  const { data: ecocashManualSettings } = useQuery({
    queryKey: ['/api/ecocash/manual-payment-settings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/ecocash/manual-payment-settings');
        return response.data;
      } catch (error) {
        return { enabled: false, instructions: '', whatsappNumber: '', merchantNumber: '', merchantName: '' };
      }
    }
  });
  const showManualEcocash = !isEcocashApiConfigured && ecocashManualSettings?.enabled;

  // Fetch user's wallet balance
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

  const coursePrice = parseFloat(course.price?.toString() || '0');
  
  // Calculate discount and final price in USD
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const { discountType, discountValue, maxDiscount } = appliedCoupon.coupon;
    
    if (discountType === 'percentage') {
      const discount = (coursePrice * discountValue) / 100;
      return maxDiscount ? Math.min(discount, maxDiscount) : discount;
    } else {
      return Math.min(discountValue, coursePrice);
    }
  };
  
  const discountAmount = calculateDiscount();
  const finalPriceUSD = Math.max(coursePrice - discountAmount, 0);

  // Initialize Dodo Payments overlay checkout SDK
  const [dodoInitialized, setDodoInitialized] = useState(false);
  
  useEffect(() => {
    if (isDodoEnabled && !dodoInitialized) {
      try {
        DodoPayments.Initialize({
          mode: "live", // Using live mode since keys are live
          onEvent: (event: any) => {
            console.log("Dodo checkout event:", event);
            
            if (event.event_type === "checkout.redirect") {
              // Payment successful - close modal and refresh
              setPaymentDetails({
                transactionId: event.data?.payment_id || 'Completed',
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                paymentMethod: 'Card',
                total: finalPriceUSD,
                currency: '$',
                courseId: courseId,
              });
              setPaymentStatus('success');
              setShowSuccess(true);
              queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'purchase-status'] });
            } else if (event.event_type === "checkout.closed") {
              setProcessing(false);
            } else if (event.event_type === "checkout.error") {
              console.error("Dodo checkout error:", event.data);
              setProcessing(false);
            }
          }
        });
        setDodoInitialized(true);
        console.log("✅ Dodo Payments overlay SDK initialized");
      } catch (error) {
        console.warn("Failed to initialize Dodo overlay SDK:", error);
      }
    }
  }, [isDodoEnabled, dodoInitialized, finalPriceUSD, courseId]);
  
  // Handle Dodo Payment - Course purchases not yet supported via DodoPay
  const handleDodoPayment = async () => {
    setProcessing(true);
    setError('Course purchases via DodoPay are not yet available. Please use another payment method.');
    setProcessing(false);
  };
  const discountAmountLocal = isSouthAfrican ? discountAmount * exchangeRate : discountAmount;
  const finalPriceLocal = isSouthAfrican ? finalPriceUSD * exchangeRate : finalPriceUSD;

  // Wallet balance calculations (after finalPriceUSD is defined)
  const walletBalance = parseFloat(wallet?.balance || '0');
  const hasWalletBalance = walletBalance > 0;
  const hasSufficientBalance = walletBalance >= finalPriceUSD;


  // Handle PayPal Payment
  const handlePayPalPayment = async () => {
    setProcessing(true);
    try {
      // Initialize PayPal payment (always use USD)
      // Note: PayPal requires redirect for approval, so the success screen
      // will be handled by the return URL callback on the backend
      const response = await fetch('/api/paypal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: finalPriceUSD.toFixed(2), 
          currency: 'USD',
          intent: 'CAPTURE',
          returnUrl: `${window.location.origin}/course-player-${courseId}?payment=success`,
          cancelUrl: `${window.location.origin}/course-detail-${courseId}?payment=cancelled`
        }),
      });
      
      const orderData = await response.json();
      
      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create PayPal order');
      }
      
      // Redirect to PayPal for approval
      // User will return to the course page after payment
      if (orderData.links) {
        const approvalLink = orderData.links.find((link: any) => link.rel === 'approve');
        if (approvalLink) {
          window.location.href = approvalLink.href;
        } else {
          throw new Error('No approval link found in PayPal response');
        }
      } else {
        throw new Error('Invalid PayPal order response');
      }
    } catch (error: any) {
      setProcessing(false);
    }
  };

  // Handle System Wallet Payment
  const handleSystemWalletPayment = async () => {
    if (!hasSufficientBalance) {
      // Show failure receipt for insufficient balance
      setPaymentDetails({
        transactionId: 'N/A',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        paymentMethod: 'System Wallet',
        total: finalPriceUSD,
        currency: currencySymbol,
        courseId: courseId,
        errorMessage: `Insufficient wallet balance. You have $${walletBalance.toFixed(2)}, but need $${finalPriceUSD.toFixed(2)}.`
      });
      setPaymentStatus('failed');
      setShowSuccess(true);
      return;
    }

    setProcessing(true);
    try {
      // Process wallet payment
      const response = await apiRequest('/api/courses/purchase-with-wallet', {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          amount: finalPriceUSD,
          couponCode: appliedCoupon?.coupon?.code || ''
        })
      });

      if (response.success) {
        // Invalidate queries to refresh enrollment and purchase status
        queryClient.invalidateQueries({ queryKey: [`/api/course-creator/courses/${courseId}/enrollment`] });
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/purchase-status`] });
        queryClient.invalidateQueries({ queryKey: ['/api/course-creator/my-courses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
        
        // Show success receipt
        setPaymentDetails({
          transactionId: response.transactionId || `wallet-${Date.now()}`,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          paymentMethod: 'System Wallet',
          total: finalPriceUSD,
          currency: currencySymbol,
          courseId: courseId
        });
        
        setPaymentStatus('success');
        setShowSuccess(true);
      } else {
        throw new Error(response.error || 'Wallet payment failed');
      }
    } catch (error: any) {
      // Show failure receipt
      setPaymentDetails({
        transactionId: 'N/A',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        paymentMethod: 'System Wallet',
        total: finalPriceUSD,
        currency: currencySymbol,
        courseId: courseId,
        errorMessage: error?.message || 'Wallet payment failed. Please try another payment method.'
      });
      setPaymentStatus('failed');
      setShowSuccess(true);
    } finally {
      setProcessing(false);
    }
  };

  // EcoCash poll interval ref for cleanup
  const ecocashPollRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Clean up EcoCash polling on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (ecocashPollRef.current) {
        clearInterval(ecocashPollRef.current);
        ecocashPollRef.current = null;
      }
    };
  }, []);

  // Handle EcoCash Payment (for Zimbabwean users)
  const handleEcocashPayment = async () => {
    // Validate phone number (must be at least 9 digits for Zimbabwe)
    if (!ecocashPhone || ecocashPhone.length < 9) {
      setPaymentDetails({
        transactionId: 'N/A',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        paymentMethod: 'EcoCash',
        total: finalPriceUSD,
        currency: '$',
        courseId: courseId,
        errorMessage: 'Please enter a valid EcoCash phone number (at least 9 digits)'
      });
      setPaymentStatus('failed');
      setShowSuccess(true);
      return;
    }

    setProcessing(true);
    setEcocashStatus('processing');
    
    try {
      const response = await apiRequest('/api/ecocash/initiate', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: ecocashPhone,
          amount: finalPriceUSD,
          description: `Course: ${course.title}`,
          userId: profile?.id,
          itemType: 'course',
          itemId: courseId,
          metadata: { 
            courseTitle: course.title,
            couponCode: appliedCoupon?.coupon?.code || ''
          }
        })
      });

      if (response.success) {
        setEcocashClientCorrelator(response.clientCorrelator);
        setEcocashStatus('checking');
        setEcocashPolling(true);
        
        // Start polling for payment status
        let attempts = 0;
        const maxAttempts = 30; // Poll for 2.5 minutes max (5s intervals)
        
        // Helper function to stop polling and show failure
        const stopPollingWithError = (errorMessage: string, orderId: string) => {
          if (ecocashPollRef.current) {
            clearInterval(ecocashPollRef.current);
            ecocashPollRef.current = null;
          }
          
          if (!isMountedRef.current) return;
          
          setEcocashPolling(false);
          setProcessing(false);
          
          setPaymentDetails({
            transactionId: orderId || 'N/A',
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            paymentMethod: 'EcoCash',
            total: finalPriceUSD,
            currency: '$',
            courseId: courseId,
            errorMessage: errorMessage
          });
          setPaymentStatus('failed');
          setShowSuccess(true);
        };
        
        ecocashPollRef.current = setInterval(async () => {
          attempts++;
          
          try {
            const statusResponse = await apiRequest('/api/ecocash/check-status', {
              method: 'POST',
              body: JSON.stringify({
                phoneNumber: ecocashPhone,
                clientCorrelator: response.clientCorrelator,
                orderId: response.orderId
              })
            });

            if (statusResponse.success) {
              // Payment succeeded - clear the polling interval
              if (ecocashPollRef.current) {
                clearInterval(ecocashPollRef.current);
                ecocashPollRef.current = null;
              }
              
              // Check if component is still mounted before updating state
              if (!isMountedRef.current) return;
              
              setEcocashPolling(false);
              
              // Confirm the purchase on backend (enroll user in course)
              try {
                await confirmPurchaseMutation.mutateAsync({
                  paymentIntentId: statusResponse.transactionId || response.orderId,
                  amount: finalPriceUSD,
                  paymentMethod: 'ecocash'
                });
              } catch (confirmError) {
                console.log('EcoCash purchase confirmation handled by backend webhook');
              }
              
              if (!isMountedRef.current) return;
              
              setProcessing(false);
              
              // Invalidate queries to refresh enrollment and purchase status
              queryClient.invalidateQueries({ queryKey: [`/api/course-creator/courses/${courseId}/enrollment`] });
              queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/purchase-status`] });
              queryClient.invalidateQueries({ queryKey: ['/api/course-creator/my-courses'] });
              queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
              
              setPaymentDetails({
                transactionId: statusResponse.transactionId || response.orderId,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                paymentMethod: 'EcoCash',
                total: finalPriceUSD,
                currency: '$',
                courseId: courseId
              });
              
              setPaymentStatus('success');
              setShowSuccess(true);
            } else if (statusResponse.status === 'failed' || statusResponse.status === 'FAILED' || statusResponse.status === 'cancelled' || statusResponse.status === 'CANCELLED') {
              // Explicit failure from EcoCash - stop immediately
              stopPollingWithError(
                statusResponse.message || 'Payment was declined or cancelled. Please try again.',
                response.orderId
              );
            } else if (attempts >= maxAttempts) {
              // Timeout - stop polling
              stopPollingWithError(
                'Payment verification timed out. If you completed the payment, please contact support with your order ID: ' + response.orderId,
                response.orderId
              );
            }
            // else: payment is still pending, continue polling
          } catch (pollError: any) {
            console.log('EcoCash status poll error:', pollError);
            // Check if max attempts reached (including network errors)
            if (attempts >= maxAttempts) {
              stopPollingWithError(
                'Unable to verify payment status. If you completed the payment, please contact support with your order ID: ' + response.orderId,
                response.orderId
              );
            }
            // Continue polling on transient errors
          }
        }, 5000); // Poll every 5 seconds
        
      } else {
        throw new Error(response.error || 'Failed to initiate EcoCash payment');
      }
    } catch (error: any) {
      // Clean up polling on error
      if (ecocashPollRef.current) {
        clearInterval(ecocashPollRef.current);
        ecocashPollRef.current = null;
      }
      setProcessing(false);
      setEcocashPolling(false);
      setEcocashStatus('pending');
      
      setPaymentDetails({
        transactionId: 'N/A',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        paymentMethod: 'EcoCash',
        total: finalPriceUSD,
        currency: '$',
        courseId: courseId,
        errorMessage: error?.message || 'EcoCash payment failed. Please try again.'
      });
      setPaymentStatus('failed');
      setShowSuccess(true);
    }
  };

  // Paystack configuration (for South African users only)
  const paystackConfig = {
    reference: `course-${courseId}-${new Date().getTime()}`,
    email: profile?.email || 'user@example.com',
    amount: Math.round(finalPriceLocal * 100), // Paystack expects amount in kobo (100 kobo = 1 ZAR)
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    currency: 'ZAR',
    metadata: {
      custom_fields: [
        {
          display_name: "Course ID",
          variable_name: "course_id",
          value: courseId
        },
        {
          display_name: "Course Title",
          variable_name: "course_title",
          value: course.title
        },
        {
          display_name: "Amount USD",
          variable_name: "amount_usd",
          value: finalPriceUSD.toFixed(2)
        }
      ]
    },
  };

  // Paystack payment handlers
  const onPaystackSuccess = async (reference: any) => {
    try {
      setProcessing(true);
      
      // Verify payment and complete purchase on backend (use USD amount)
      await confirmPurchaseMutation.mutateAsync({ 
        paymentIntentId: reference.reference,
        amount: finalPriceUSD,
        paymentMethod: 'paystack'
      });
      
      // Store payment details for success screen
      setPaymentDetails({
        transactionId: reference.reference,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        paymentMethod: 'Card',
        total: finalPriceUSD,
        currency: currencySymbol,
        courseId: courseId
      });
      
      setPaymentStatus('success');
      setShowSuccess(true);
    } catch (error: any) {
      // Show failure receipt
      setPaymentDetails({
        transactionId: 'N/A',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        paymentMethod: 'Card',
        total: finalPriceUSD,
        currency: currencySymbol,
        courseId: courseId,
        errorMessage: error?.message || 'Payment verification failed. Please try again.'
      });
      setPaymentStatus('failed');
      setShowSuccess(true);
    } finally {
      setProcessing(false);
    }
  };

  const onPaystackClose = () => {
    // Silent close - AJAX only
  };

  const initializePaystackPayment = usePaystackPayment(paystackConfig);

  const hasNoMethods = !gatewaysLoading && !isPayPalEnabled && !isDodoEnabled && !isEcocashEnabled && (!wallet || parseFloat(wallet.balance) === 0);

  // Success/Failure state - Payment Receipt Screen
  if (showSuccess && paymentDetails) {
    const isSuccess = paymentStatus === 'success';
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto pt-16 md:pt-20 px-4 pb-4">
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
                {isSuccess ? 'Payment Successful' : 'Payment Failed'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isSuccess 
                  ? 'Payment Successful! Thanks for your order — it\'s now confirmed.'
                  : paymentDetails.errorMessage || 'Unfortunately, your payment could not be processed. Please try again.'}
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
                <span className="text-muted-foreground">Type of Transaction</span>
                <span className="font-medium dark:text-white">{paymentDetails.paymentMethod}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium dark:text-white">{paymentDetails.currency}{paymentDetails.total.toFixed(2)}</span>
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

            {/* Action Buttons for Failed Payments */}
            {!isSuccess && (
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    setShowSuccess(false);
                    setPaymentDetails(null);
                    setPaymentStatus('success');
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
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (gatewaysLoading) {
    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
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
  if (!gatewaysLoading && !isPayPalEnabled && !isDodoEnabled && !isEcocashEnabled && !isWalletEnabled && !primaryGateway) {
    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <Card className="w-full max-w-md mx-4 bg-white dark:bg-gray-900">
          <CardContent className="p-8 text-center">
            <X className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payment Methods Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No payment methods are currently configured. Please contact support or try again later.
            </p>
            <Button onClick={onClose} variant="outline" data-testid="button-close-no-payment">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[60] overflow-y-auto pt-16 md:pt-20 px-4 pb-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !processing) {
          onClose();
        }
      }}
    >
      <Card className="rounded-2xl text-[#1F1E30] transition-colors duration-300 border-gray-100 w-full md:max-w-5xl bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/20 md:shadow-2xl shadow-none border-0 md:border md:rounded-2xl">
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            disabled={processing}
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <CardContent className="p-4 md:p-8 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Side - Order Summary */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="font-semibold text-base md:text-lg dark:text-white">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{course.title}</div>
                    <div className="text-xs text-muted-foreground">One-time purchase • Lifetime access</div>
                  </div>
                </div>
              </div>

              {!showPromoInput && !appliedCoupon && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4" 
                  onClick={() => setShowPromoInput(true)}
                  data-testid="button-show-promo"
                >
                  Add Promo Code
                </Button>
              )}

              {showPromoInput && !appliedCoupon && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      className="flex-1"
                      data-testid="input-promo-code"
                    />
                    <Button 
                      size="sm" 
                      onClick={async () => {
                        if (!promoCode.trim()) {
                          setCouponError('Please enter a promo code');
                          return;
                        }
                        
                        setIsApplyingCoupon(true);
                        setCouponError('');
                        
                        try {
                          const response = await apiRequest('/api/cart/apply-coupon', {
                            method: 'POST',
                            body: JSON.stringify({ code: promoCode.trim().toUpperCase() }),
                          });
                          setAppliedCoupon(response);
                          setShowPromoInput(false);
                        } catch (error: any) {
                          setCouponError(error.message || 'Invalid promo code');
                        } finally {
                          setIsApplyingCoupon(false);
                        }
                      }}
                      disabled={isApplyingCoupon || !promoCode.trim()}
                      data-testid="button-apply-promo"
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply'}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-500">{couponError}</p>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs" 
                    onClick={() => {
                      setShowPromoInput(false);
                      setPromoCode('');
                      setCouponError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {appliedCoupon && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          {appliedCoupon.coupon.code}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          {appliedCoupon.coupon.description || 'Discount applied'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setPromoCode('');
                        setCouponError('');
                      }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{coursePriceLocal.toFixed(2)}</span>
                </div>
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedCoupon.coupon.code})</span>
                    <span>-{currencySymbol}{discountAmountLocal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total due today</span>
                  <span>{currencySymbol}{finalPriceLocal.toFixed(2)}</span>
                </div>
                {isSouthAfrican && (
                  <p className="text-xs text-muted-foreground text-right">
                    ≈ ${finalPriceUSD.toFixed(2)} USD
                  </p>
                )}
              </div>
            </div>

            {/* Right Side - Payment Form */}
            <div className="space-y-4 md:space-y-6">
              
              {/* Payment Method Selection */}
              <div>
                <h3 className="font-semibold mb-3 text-base md:text-lg dark:text-white">Payment method</h3>
                {gatewaysLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading payment methods...</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {/* Gateway payment option */}
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
                          className="h-8 mx-auto"
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

                    {primaryGateway?.gatewayId === 'paystack' && isSouthAfrican && (
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
                        <span className="text-xs mt-1 block truncate dark:text-white">Pay</span>
                      </button>
                    )}

                    {/* Dodo Payments - Always show when enabled (supports Google Pay, Apple Pay) */}
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

                    {/* EcoCash - Show for Zimbabwean users only */}
                    {(isEcocashEnabled || isUserFromZimbabwe) && (
                      <button
                        onClick={() => setSelectedMethod('ecocash')}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          selectedMethod === 'ecocash'
                            ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        data-testid="button-method-ecocash"
                      >
                        <Smartphone className="w-5 h-5 mx-auto text-green-600" />
                        <span className="text-xs mt-1 block dark:text-white">EcoCash</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="font-semibold mb-3 md:mb-4 text-base md:text-lg dark:text-white">Payment information</h3>
                
                {selectedMethod === 'paypal' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">You will be redirected to PayPal to complete your purchase</p>
                    <Button
                      onClick={handlePayPalPayment}
                      disabled={processing}
                      className="w-full bg-[#0070ba] hover:bg-[#003087] text-white h-12 text-base font-semibold rounded-xl"
                      data-testid="button-paypal-checkout"
                    >
                      {processing ? 'Redirecting...' : 'Continue with PayPal'}
                    </Button>
                  </div>
                )}

                {selectedMethod === 'paystack' && isSouthAfrican && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Pay securely (South African Rand)</p>
                    <div className="flex gap-2 mb-4">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                    </div>
                    <Button
                      onClick={() => {
                        setProcessing(true);
                        initializePaystackPayment({
                          onSuccess: onPaystackSuccess,
                          onClose: onPaystackClose
                        });
                      }}
                      disabled={processing || !profile?.email}
                      className="w-full bg-[#6366f1] hover:bg-[#5558e3] text-white h-12 text-base font-semibold rounded-xl"
                      data-testid="button-paystack-checkout"
                    >
                      {processing ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        <>Complete Purchase</>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Secure payment processing
                    </p>
                  </div>
                )}

                {selectedMethod === 'system_wallet' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Wallet Balance</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${walletBalance.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Course Price</span>
                        <span className="text-sm font-medium">${finalPriceUSD.toFixed(2)}</span>
                      </div>
                      {hasSufficientBalance && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                          <span className="text-sm font-medium">Remaining Balance</span>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            ${(walletBalance - finalPriceUSD).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    {!hasSufficientBalance && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          Insufficient balance. You need ${(finalPriceUSD - walletBalance).toFixed(2)} more to complete this purchase.
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={handleSystemWalletPayment}
                      disabled={processing || !hasSufficientBalance}
                      className="w-full bg-[#6366f1] hover:bg-[#5558e3] text-white h-12 text-base font-semibold rounded-xl"
                      data-testid="button-wallet-checkout"
                    >
                      {processing ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        <>Pay ${finalPriceUSD.toFixed(2)} from Wallet</>
                      )}
                    </Button>
                  </div>
                )}

                {selectedMethod === 'dodopay' && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-100">
                        DodoPay for course purchases coming soon. Please use another payment method.
                      </p>
                    </div>
                    <Button
                      onClick={handleDodoPayment}
                      disabled={true}
                      className="w-full bg-gray-400 text-white h-12 text-base font-semibold rounded-xl opacity-50 cursor-not-allowed"
                      data-testid="button-dodopay-checkout"
                    >
                      Not Available for Courses
                    </Button>
                  </div>
                )}

                {selectedMethod === 'vodapay' && (
                  <div className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                    </div>
                    <Button
                      onClick={async () => {
                        setProcessing(true);
                        try {
                          // Convert USD to ZAR (approximate rate: 1 USD = 18 ZAR)
                          const zarAmount = finalPriceUSD * (userCurrency?.rate || 18);
                          
                          const response = await apiRequest('/api/vodapay/initialize', {
                            method: 'POST',
                            body: JSON.stringify({
                              amount: zarAmount,
                              currency: 'ZAR',
                              courseId: courseId,
                              courseName: course.title,
                              userEmail: profile?.email,
                              returnUrl: `${window.location.origin}/course-player-${courseId}?payment=success`,
                              cancelUrl: `${window.location.origin}/course-detail-${courseId}?payment=cancelled`,
                            }),
                          });

                          if (response.success && response.checkoutUrl) {
                            window.location.href = response.checkoutUrl;
                          } else {
                            throw new Error(response.error || 'Payment service is temporarily unavailable. Please try another payment method.');
                          }
                        } catch (error: any) {
                          console.error('Payment error:', error);
                          setPaymentDetails({
                            transactionId: 'N/A',
                            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                            paymentMethod: 'Card',
                            total: finalPriceUSD,
                            currency: currencySymbol,
                            courseId: courseId,
                            errorMessage: error?.message || 'Payment service is temporarily unavailable. Please try another payment method.'
                          });
                          setPaymentStatus('failed');
                          setShowSuccess(true);
                        } finally {
                          setProcessing(false);
                        }
                      }}
                      disabled={processing}
                      className="w-full bg-[#6366f1] hover:bg-[#5558e3] text-white h-12 text-base font-semibold rounded-xl"
                      data-testid="button-vodapay-checkout"
                    >
                      {processing ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        <>Complete Purchase</>
                      )}
                    </Button>
                  </div>
                )}

                {/* EcoCash Payment Form - For Zimbabwean users */}
                {selectedMethod === 'ecocash' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900 dark:text-green-100">EcoCash Mobile Payment</span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {showManualEcocash ? 'Pay manually and confirm via WhatsApp' : 'Pay securely using your EcoCash mobile money account'}
                      </p>
                    </div>
                    
                    {/* Show API-based payment when configured */}
                    {isEcocashApiConfigured && (
                      <>
                        <div className="space-y-3">
                          <label className="block text-sm font-medium dark:text-white">
                            EcoCash Phone Number
                          </label>
                          <div className="flex gap-2">
                            <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-r-0 rounded-l-lg text-sm">
                              +263
                            </div>
                            <Input
                              type="tel"
                              placeholder="7X XXX XXXX"
                              value={ecocashPhone}
                              onChange={(e) => setEcocashPhone(e.target.value.replace(/\D/g, ''))}
                              className="rounded-l-none"
                              data-testid="input-ecocash-phone"
                              disabled={processing}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Enter your registered EcoCash number (e.g., 77 123 4567)
                          </p>
                        </div>

                        {ecocashPolling && (
                          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                              <div>
                                <p className="font-medium text-blue-900 dark:text-blue-100">
                                  Waiting for payment confirmation...
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  Please check your phone and enter your EcoCash PIN to complete the payment
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleEcocashPayment}
                          disabled={processing || !ecocashPhone || ecocashPhone.length < 9}
                          className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl"
                          data-testid="button-ecocash-checkout"
                        >
                          {processing ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {ecocashPolling ? 'Waiting for confirmation...' : 'Initiating payment...'}
                            </span>
                          ) : (
                            <>Pay ${finalPriceUSD.toFixed(2)} with EcoCash</>
                          )}
                        </Button>

                        <div className="text-center space-y-2">
                          <p className="text-xs text-muted-foreground">
                            A payment prompt will be sent to your phone
                          </p>
                          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" /> Instant confirmation
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-green-500" /> Secure payment
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Show Manual Payment when API is not configured */}
                    {showManualEcocash && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                            Manual Payment Instructions
                          </h4>
                          <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-line">
                            {ecocashManualSettings?.instructions || 'Send payment and share receipt via WhatsApp for verification.'}
                          </p>
                        </div>

                        {ecocashManualSettings?.merchantNumber && (
                          <div className="bg-white dark:bg-gray-900 border rounded-lg p-4">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Send payment to:</p>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {ecocashManualSettings.merchantNumber}
                              </p>
                              {ecocashManualSettings?.merchantName && (
                                <p className="text-sm font-medium mt-1">{ecocashManualSettings.merchantName}</p>
                              )}
                              <p className="text-lg font-semibold mt-2">Amount: ${finalPriceUSD.toFixed(2)}</p>
                            </div>
                          </div>
                        )}

                        {ecocashManualSettings?.whatsappNumber && (
                          <Button
                            onClick={() => {
                              const message = encodeURIComponent(
                                `Hello! I just made an EcoCash payment of $${finalPriceUSD.toFixed(2)} for course: ${course.title}. Please verify my payment. My email: ${profile?.email || 'N/A'}`
                              );
                              window.open(`https://wa.me/${ecocashManualSettings.whatsappNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl flex items-center justify-center gap-2"
                            data-testid="button-ecocash-whatsapp"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Chat on WhatsApp to Confirm Payment
                          </Button>
                        )}

                        <div className="text-center space-y-2">
                          <p className="text-xs text-muted-foreground">
                            After sending payment, contact us on WhatsApp with your receipt
                          </p>
                          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-green-500" /> Secure manual verification
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show message when neither API nor manual is available */}
                    {!isEcocashApiConfigured && !showManualEcocash && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          EcoCash payment is currently unavailable. Please try another payment method or contact support.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Generic fallback for any other unsupported gateway */}
                {selectedMethod && 
                 !['paypal', 'paystack', 'dodopay', 'vodapay', 'system_wallet', 'ecocash'].includes(selectedMethod) && (
                  <div className="space-y-4" data-testid="div-unsupported-gateway-container">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" data-testid="div-unsupported-gateway-warning">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2" data-testid="text-unsupported-gateway-name">
                        {enabledGateways.find(g => g.gatewayId === selectedMethod)?.gatewayName || selectedMethod} - Not Yet Implemented
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300" data-testid="text-unsupported-gateway-message">
                        This payment gateway is configured in your admin settings but payment processing is not yet implemented. Please use another payment method or contact your administrator.
                      </p>
                    </div>
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="w-full"
                      data-testid="button-unsupported-gateway-close"
                    >
                      Choose Another Payment Method
                    </Button>
                  </div>
                )}
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Secure 256-bit SSL encrypted payment</span>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By completing this purchase, you agree to our{' '}
                <a 
                  href="/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  Terms of Service
                </a>
                {' '}and{' '}
                <a 
                  href="/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
