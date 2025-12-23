import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Gift,
  CreditCard,
  Shield,
  CheckCircle2,
  ArrowLeft,
  Mail,
  User,
  MessageSquare,
  Heart,
  Wallet,
  DollarSign
} from "lucide-react";
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { Stripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { getStripePromise } from "@/lib/stripe";
import { useEnabledGateways } from "@/hooks/useEnabledGateways";
import { useQuery } from "@tanstack/react-query";
import { SiPaypal } from "react-icons/si";
import { useLocation } from "wouter";
import { DodoPayments } from "dodopayments-checkout";

const PRESET_AMOUNTS = [10, 25, 50, 100];

type PaymentMethod = 'card' | 'paypal' | 'paystack' | 'system_wallet' | 'dodopay' | string;

interface BuyVoucherSectionProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

// Inner form component that uses Stripe hooks - only used when wrapped in Elements
function VoucherPurchaseFormWithStripe({ onBack, onSuccess }: BuyVoucherSectionProps) {
  const stripe = useStripe();
  const elements = useElements();
  return <VoucherPurchaseFormInner stripe={stripe} elements={elements} onBack={onBack} onSuccess={onSuccess} />;
}

interface VoucherPurchaseFormInnerProps extends BuyVoucherSectionProps {
  stripe?: ReturnType<typeof useStripe> | null;
  elements?: ReturnType<typeof useElements> | null;
}

function VoucherPurchaseFormInner({ onBack, onSuccess, stripe = null, elements = null }: VoucherPurchaseFormInnerProps) {
  const { user, profile } = useAuth();
  const [location, setLocation] = useLocation();

  const userEmail = user?.email || "";

  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sendToSelf, setSendToSelf] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState(userEmail);
  const [buyerName, setBuyerName] = useState(profile?.name || "");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [voucherData, setVoucherData] = useState<any>(null);

  useEffect(() => {
    if (sendToSelf && user) {
      setBuyerEmail(user.email || "");
      setBuyerName(profile?.name || "");
    }
  }, [sendToSelf, user, profile]);
  
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<number | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<any>(null);

  const { data: enabledGateways = [], isLoading: gatewaysLoading } = useEnabledGateways();

  const primaryGateway = enabledGateways.find(g => g.isPrimary) || enabledGateways[0];
  const isStripeEnabled = enabledGateways.some(g => g.gatewayId === 'stripe');
  const isPayPalEnabled = enabledGateways.some(g => g.gatewayId === 'paypal');
  const isPaystackEnabled = enabledGateways.some(g => g.gatewayId === 'paystack');
  
  // Check if DodoPayments is enabled
  const dodoGateway = enabledGateways.find(g => g.gatewayId === 'dodopay' || g.gatewayId === 'dodo');
  const isDodoEnabled = !!dodoGateway;
  const isDodoTestMode = dodoGateway?.testMode === true;
  
  // Initialize DodoPayments overlay checkout SDK
  const [dodoInitialized, setDodoInitialized] = useState(false);
  const [pendingDodoPurchaseId, setPendingDodoPurchaseId] = useState<string | null>(null);
  
  // Confirm DodoPay voucher purchase on backend
  const confirmDodoVoucherPurchase = async (purchaseIdVal: string, paymentId: string) => {
    try {
      const response = await fetch('/api/gift-vouchers/confirm-dodopay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          purchaseId: purchaseIdVal,
          paymentId,
          paymentMethod: 'dodopay'
        })
      });
      
      const data = await response.json();
      console.log("DodoPay voucher confirmation:", data);
      
      if (data.success) {
        setPurchaseResult({
          success: true,
          amount: data.amount,
          voucherCode: data.voucherCode,
          recipientEmail: data.recipientEmail,
          expiresAt: data.expiresAt,
          paymentMethod: 'Card',
        });
        setStep('success');
        onSuccess?.();
      } else {
        setError(data.error || 'Failed to confirm voucher purchase');
      }
    } catch (err: any) {
      console.error("DodoPay voucher confirmation error:", err);
      setError('Failed to confirm voucher purchase. Please contact support.');
    } finally {
      setProcessing(false);
      setPendingDodoPurchaseId(null);
    }
  };
  
  useEffect(() => {
    if (isDodoEnabled && !dodoInitialized) {
      try {
        const dodoMode = isDodoTestMode ? "test" : "live";
        DodoPayments.Initialize({
          mode: dodoMode,
          onEvent: async (event: any) => {
            console.log("Card checkout event (voucher):", event);
            
            if (event.event_type === "checkout.redirect") {
              // Close the overlay to prevent page redirect
              if (DodoPayments.Checkout?.close) {
                DodoPayments.Checkout.close();
              }
              
              // Payment successful - confirm on backend to create and send voucher
              const paymentId = event.data?.payment_id;
              const storedPurchaseId = sessionStorage.getItem('pendingVoucherPurchaseId');
              
              console.log("🎟️ Voucher payment success - confirming...", { paymentId, storedPurchaseId });
              
              if (storedPurchaseId && paymentId) {
                await confirmDodoVoucherPurchase(storedPurchaseId, paymentId);
                sessionStorage.removeItem('pendingVoucherPurchaseId');
              } else if (storedPurchaseId) {
                // Payment ID might not be in the event data, try to confirm anyway
                await confirmDodoVoucherPurchase(storedPurchaseId, 'dodopay_checkout');
                sessionStorage.removeItem('pendingVoucherPurchaseId');
              } else {
                console.error("Missing purchaseId for voucher confirmation");
                setError('Payment succeeded but voucher confirmation failed. Please contact support.');
                setProcessing(false);
              }
            } else if (event.event_type === "checkout.closed") {
              // Only stop processing if we're not in the middle of confirming
              const storedPurchaseId = sessionStorage.getItem('pendingVoucherPurchaseId');
              if (!storedPurchaseId) {
                setProcessing(false);
              }
            } else if (event.event_type === "checkout.error") {
              console.error("Card checkout error:", event.data);
              setError(event.data?.message || "Payment failed");
              setProcessing(false);
              sessionStorage.removeItem('pendingVoucherPurchaseId');
            }
          }
        });
        setDodoInitialized(true);
        console.log(`✅ DodoPayments overlay SDK initialized (voucher) - mode: ${dodoMode}`);
      } catch (error) {
        console.warn("Failed to initialize Dodo overlay SDK:", error);
      }
    }
  }, [isDodoEnabled, isDodoTestMode, dodoInitialized]);

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

  const walletBalance = parseFloat(wallet?.balance || '0');
  const hasWalletBalance = walletBalance > 0;
  const effectiveAmount = customAmount ? parseFloat(customAmount) : amount;
  const hasSufficientBalance = walletBalance >= (effectiveAmount || 0);

  useEffect(() => {
    if (!gatewaysLoading && enabledGateways.length > 0 && !selectedPaymentMethod) {
      if (primaryGateway?.gatewayId) {
        setSelectedPaymentMethod('card');
      } else if (primaryGateway?.gatewayId === 'paypal') {
        setSelectedPaymentMethod('paypal');
      } else if (primaryGateway?.gatewayId === 'paystack') {
        setSelectedPaymentMethod('paystack');
      } else if (hasWalletBalance && hasSufficientBalance) {
        setSelectedPaymentMethod('system_wallet');
      }
    }
  }, [gatewaysLoading, enabledGateways, primaryGateway, hasWalletBalance, hasSufficientBalance, selectedPaymentMethod]);

  const confirmPayPalVoucher = async (purchaseIdVal: number, orderId: string) => {
    setProcessing(true);
    setError(null);
    try {
      const captureResponse = await fetch('/api/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const captureData = await captureResponse.json();

      if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
        throw new Error(captureData.error || 'PayPal payment capture failed');
      }

      const response = await apiRequest('/api/gift-vouchers/confirm-purchase', {
        method: 'POST',
        body: JSON.stringify({
          purchaseId: purchaseIdVal,
          paymentMethod: 'paypal',
          paymentIntentId: orderId
        })
      });

      if (response.success) {
        setPurchaseResult(response);
        setStep('success');
        onSuccess?.();
        setLocation('/');
      } else {
        setError(response.error || 'Failed to confirm purchase');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm PayPal purchase');
    } finally {
      setProcessing(false);
    }
  };

  const confirmPaystackVoucher = async (purchaseIdVal: number, reference: string) => {
    setProcessing(true);
    setError(null);
    try {
      const verifyResponse = await apiRequest('/api/paystack/verify', {
        method: 'POST',
        body: JSON.stringify({ reference })
      });

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.error || 'Paystack verification failed');
      }

      const response = await apiRequest('/api/gift-vouchers/confirm-purchase', {
        method: 'POST',
        body: JSON.stringify({
          purchaseId: purchaseIdVal,
          paymentMethod: 'paystack',
          paymentIntentId: reference
        })
      });

      if (response.success) {
        setPurchaseResult(response);
        setStep('success');
        onSuccess?.();
        setLocation('/');
      } else {
        setError(response.error || 'Failed to confirm purchase');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm Paystack purchase');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const payment = searchParams.get('payment');
    const storedVoucherData = sessionStorage.getItem('pendingVoucherData');
    
    if (payment === 'paypal_voucher_success' && storedVoucherData) {
      const data = JSON.parse(storedVoucherData);
      const token = searchParams.get('token');
      sessionStorage.removeItem('pendingVoucherData');
      
      if (token) {
        confirmPayPalVoucher(data.purchaseId, token);
      } else {
        setError('PayPal payment confirmation failed - missing order token');
      }
    } else if (payment === 'paystack_voucher_callback' && storedVoucherData) {
      const reference = searchParams.get('reference');
      if (reference) {
        const data = JSON.parse(storedVoucherData);
        sessionStorage.removeItem('pendingVoucherData');
        confirmPaystackVoucher(data.purchaseId, reference);
      }
    } else if (payment === 'cancelled') {
      sessionStorage.removeItem('pendingVoucherData');
      setError('Payment was cancelled. Please try again.');
    }
  }, [location]);

  const handleAmountSelect = (amt: number) => {
    setAmount(amt);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value);
    }
  };

  const validateDetails = () => {
    if (!effectiveAmount || effectiveAmount < 5) {
      setError("Minimum voucher amount is $5");
      return false;
    }
    if (effectiveAmount > 500) {
      setError("Maximum voucher amount is $500");
      return false;
    }
    if (!sendToSelf && !recipientEmail) {
      setError("Please enter recipient's email");
      return false;
    }
    if (sendToSelf && !user && !buyerEmail) {
      setError("Please enter your email");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailToValidate = sendToSelf ? (buyerEmail || user?.email || "") : recipientEmail;
    if (!emailRegex.test(emailToValidate)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleProceedToPayment = async () => {
    setError(null);
    if (!validateDetails()) return;

    setProcessing(true);
    try {
      const voucherPayload = {
        amount: effectiveAmount,
        recipientEmail: sendToSelf ? (buyerEmail || user?.email || "") : recipientEmail,
        recipientName: sendToSelf ? buyerName : recipientName,
        personalMessage: personalMessage || null,
        sendToSelf,
        buyerEmail: buyerEmail || user?.email || "",
        buyerName
      };

      if (selectedPaymentMethod === 'card' && isStripeEnabled) {
        const response = await apiRequest('/api/gift-vouchers/create-payment-intent', {
          method: 'POST',
          body: JSON.stringify(voucherPayload)
        });
        setClientSecret(response.clientSecret);
        setPurchaseId(response.purchaseId);
      } else {
        const response = await apiRequest('/api/gift-vouchers/create-purchase', {
          method: 'POST',
          body: JSON.stringify(voucherPayload)
        });
        setPurchaseId(response.purchaseId);
      }

      setVoucherData(voucherPayload);
      setStep('payment');
    } catch (err: any) {
      setError(err.message || "Failed to initialize payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    if (!stripe || !elements || !clientSecret) return;

    setError(null);
    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: buyerName || undefined,
              email: buyerEmail || undefined
            }
          }
        }
      );

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        const confirmResponse = await apiRequest('/api/gift-vouchers/confirm-purchase', {
          method: 'POST',
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            purchaseId
          })
        });

        setPurchaseResult(confirmResponse);
        setStep('success');
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!purchaseId) {
      setError("Please wait for payment to initialize");
      return;
    }

    setError(null);
    setProcessing(true);
    try {
      sessionStorage.setItem('pendingVoucherData', JSON.stringify({
        ...voucherData,
        purchaseId
      }));

      const response = await fetch('/api/paypal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: effectiveAmount.toFixed(2), 
          currency: 'USD',
          intent: 'CAPTURE',
          returnUrl: `${window.location.origin}/?payment=paypal_voucher_success`,
          cancelUrl: `${window.location.origin}/?payment=cancelled`
        }),
      });
      
      const orderData = await response.json();
      
      if (!response.ok) {
        sessionStorage.removeItem('pendingVoucherData');
        throw new Error(orderData.error || 'Failed to create PayPal order');
      }
      
      if (orderData.links) {
        const approvalLink = orderData.links.find((link: any) => link.rel === 'approve');
        if (approvalLink) {
          window.location.href = approvalLink.href;
        } else {
          sessionStorage.removeItem('pendingVoucherData');
          throw new Error('No approval link found in PayPal response');
        }
      } else {
        sessionStorage.removeItem('pendingVoucherData');
        throw new Error('Invalid PayPal order response');
      }
    } catch (err: any) {
      setError(err.message || "PayPal payment failed");
      setProcessing(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!purchaseId) {
      setError("Please wait for payment to initialize");
      return;
    }

    setError(null);
    setProcessing(true);
    try {
      sessionStorage.setItem('pendingVoucherData', JSON.stringify({
        ...voucherData,
        purchaseId
      }));

      const response = await apiRequest('/api/paystack/initialize', {
        method: 'POST',
        body: JSON.stringify({
          amount: effectiveAmount * 100,
          email: buyerEmail || user?.email,
          callback_url: `${window.location.origin}/?payment=paystack_voucher_callback`
        })
      });
      
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      } else {
        sessionStorage.removeItem('pendingVoucherData');
        throw new Error('Failed to initialize Paystack payment');
      }
    } catch (err: any) {
      sessionStorage.removeItem('pendingVoucherData');
      setError(err.message || "Paystack payment failed");
      setProcessing(false);
    }
  };

  const handleSystemWalletPayment = async () => {
    if (!hasSufficientBalance) {
      setError(`Insufficient wallet balance. You have $${walletBalance.toFixed(2)}, but need $${effectiveAmount.toFixed(2)}.`);
      return;
    }

    setError(null);
    setProcessing(true);
    try {
      const response = await apiRequest('/api/gift-vouchers/purchase-with-wallet', {
        method: 'POST',
        body: JSON.stringify({
          amount: effectiveAmount,
          recipientEmail: sendToSelf ? (buyerEmail || user?.email) : recipientEmail,
          recipientName: sendToSelf ? buyerName : recipientName,
          personalMessage: personalMessage || null,
          sendToSelf,
          buyerEmail: buyerEmail || user?.email || "",
          buyerName
        })
      });

      if (response.success) {
        setPurchaseResult(response);
        setStep('success');
        onSuccess?.();
      } else {
        throw new Error(response.error || 'Wallet payment failed');
      }
    } catch (err: any) {
      setError(err.message || "Wallet payment failed");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Card Payment - Dynamic product creation for vouchers
  const handleDodoCardPayment = async () => {
    setProcessing(true);
    setError(null);
    try {
      // Step 1: Create purchase record first
      const purchaseResponse = await fetch('/api/gift-vouchers/create-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: effectiveAmount,
          recipientEmail: sendToSelf ? (buyerEmail || user?.email) : recipientEmail,
          recipientName: sendToSelf ? buyerName : recipientName,
          personalMessage: personalMessage || null,
          sendToSelf,
          buyerEmail: buyerEmail || user?.email || "",
          buyerName
        })
      });
      
      const purchaseData = await purchaseResponse.json();
      if (!purchaseData.success || !purchaseData.purchaseId) {
        throw new Error(purchaseData.error || 'Failed to create purchase record');
      }
      
      // Store purchaseId in sessionStorage for the callback to use
      sessionStorage.setItem('pendingVoucherPurchaseId', purchaseData.purchaseId.toString());
      setPendingDodoPurchaseId(purchaseData.purchaseId);
      
      // Step 2: Create DodoPay checkout session
      const response = await fetch('/api/dodopay/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: effectiveAmount,
          currency: 'USD',
          productName: `$${effectiveAmount} Gift Voucher`,
          productDescription: `Gift voucher purchase - $${effectiveAmount}`,
          productType: 'voucher',
          userEmail: buyerEmail || user?.email || '',
          userName: buyerName || profile?.name || '',
          overlayMode: true,
          metadata: {
            purchaseId: purchaseData.purchaseId,
            recipientEmail: sendToSelf ? (buyerEmail || user?.email) : recipientEmail,
            recipientName: sendToSelf ? buyerName : recipientName,
            personalMessage: personalMessage || null,
            sendToSelf,
            buyerEmail: buyerEmail || user?.email || "",
            buyerName
          }
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
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (err: any) {
      console.error("Card voucher payment error:", err);
      setError(err.message || 'Failed to initialize Card payment');
      setProcessing(false);
      sessionStorage.removeItem('pendingVoucherPurchaseId');
    }
  };

  const handlePayment = () => {
    switch (selectedPaymentMethod) {
      case 'card':
        handleCardPayment();
        break;
      case 'paypal':
        handlePayPalPayment();
        break;
      case 'paystack':
        handlePaystackPayment();
        break;
      case 'system_wallet':
        handleSystemWalletPayment();
        break;
      case 'dodopay':
        handleDodoCardPayment();
        break;
      default:
        setError("Please select a payment method");
    }
  };

  const resetForm = () => {
    setStep('details');
    setAmount(25);
    setCustomAmount("");
    setRecipientEmail("");
    setRecipientName("");
    setPersonalMessage("");
    setSendToSelf(false);
    setPurchaseResult(null);
    setSelectedPaymentMethod(null);
  };

  if (step === 'success' && purchaseResult) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 overflow-hidden shadow-none">
          <div className="p-8 text-center text-white" style={{ background: 'linear-gradient(to right, #2d5dd8, #2d5dd8)' }}>
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold">Gift Voucher Purchased!</h1>
            <p className="text-green-100 mt-2">Your gift is on its way</p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Voucher Code</p>
              <p className="text-2xl font-mono font-bold text-foreground tracking-wider">
                {purchaseResult.voucherCode}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
                ${parseFloat(purchaseResult.amount).toFixed(2)}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Sent to</span>
                <span className="font-medium">{purchaseResult.recipientEmail}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Valid until</span>
                <span className="font-medium">
                  {purchaseResult.expiresAt 
                    ? new Date(purchaseResult.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  }
                </span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                An email with the voucher code has been sent to the recipient.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetForm}
                data-testid="button-buy-another-voucher"
              >
                Buy Another
              </Button>
              {user ? (
                onBack && (
                  <Button
                    className="flex-1 bg-primary text-[#ffffff]"
                    onClick={onBack}
                    data-testid="button-back-to-dashboard"
                  >
                    Back to Dashboard
                  </Button>
                )
              ) : (
                <Button
                  className="flex-1 bg-primary text-[#ffffff]"
                  onClick={() => setLocation('/auth')}
                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        {onBack && step === 'details' && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
            data-testid="button-back-from-voucher"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        {step === 'payment' && (
          <Button
            variant="ghost"
            onClick={() => setStep('details')}
            className="mb-4"
            data-testid="button-back-to-details"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Details
          </Button>
        )}

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary rounded-xl flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Buy Gift Voucher
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Give the gift of learning
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className={`flex-1 h-2 rounded-full ${step === 'details' || step === 'payment' ? 'bg-primary' : 'bg-gray-200'}`} />
        <div className={`flex-1 h-2 rounded-full ${step === 'payment' ? 'bg-primary' : 'bg-gray-200'}`} />
      </div>

      {step === 'details' && (
        <Card className="border-0">
          <CardHeader className="pb-4">
            <CardTitle>
              Voucher Details
            </CardTitle>
            <CardDescription>
              Choose an amount and customize your gift
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Amount</Label>
              <div className="grid grid-cols-4 gap-3">
                {PRESET_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant={amount === amt && !customAmount ? "default" : "outline"}
                    className="h-14 text-lg font-bold"
                    style={amount === amt && !customAmount ? { backgroundColor: '#2f5a4e', color: 'white' } : {}}
                    onClick={() => handleAmountSelect(amt)}
                    data-testid={`button-voucher-amount-${amt}`}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <Input
                  type="text"
                  placeholder="Custom amount (5-500)"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="pl-8 h-12 text-lg"
                  data-testid="input-voucher-custom-amount"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <Label htmlFor="send-to-self" className="cursor-pointer">
                  Send to myself
                </Label>
              </div>
              <Switch
                id="send-to-self"
                checked={sendToSelf}
                onCheckedChange={setSendToSelf}
                data-testid="switch-voucher-send-to-self"
              />
            </div>

            {!sendToSelf && (
              <div className="space-y-4 p-4 rounded-lg border" style={{ backgroundColor: '#a0fab2', borderColor: '#2f5a4e' }}>
                <h3 className="font-medium flex items-center gap-2" style={{ color: '#2f5a4e' }}>
                  <User className="w-4 h-4" style={{ color: '#2f5a4e' }} />
                  Recipient Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="recipient-email">Email Address *</Label>
                    <Input
                      id="recipient-email"
                      type="email"
                      placeholder="friend@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="mt-1"
                      data-testid="input-voucher-recipient-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipient-name">Name (optional)</Label>
                    <Input
                      id="recipient-name"
                      type="text"
                      placeholder="Their name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="mt-1"
                      data-testid="input-voucher-recipient-name"
                    />
                  </div>
                </div>
              </div>
            )}

            {sendToSelf && !user && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Your Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="buyer-email">Your Email *</Label>
                    <Input
                      id="buyer-email"
                      type="email"
                      placeholder="your@email.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="mt-1"
                      data-testid="input-voucher-buyer-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyer-name">Your Name</Label>
                    <Input
                      id="buyer-name"
                      type="text"
                      placeholder="Your name"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="mt-1"
                      data-testid="input-voucher-buyer-name"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="personal-message" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Personal Message (optional)
              </Label>
              <Textarea
                id="personal-message"
                placeholder="Add a heartfelt message to make your gift special..."
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                rows={3}
                maxLength={500}
                data-testid="textarea-voucher-personal-message"
              />
              <p className="text-xs text-gray-500 text-right">
                {personalMessage.length}/500
              </p>
            </div>

            {error && (
              <div className="p-3 bg-primary/10 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-primary dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 dark:text-gray-400">Voucher Amount</span>
                <span className="text-2xl font-bold">${effectiveAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <Button
                className="w-full h-12 text-lg text-white"
                style={{ backgroundColor: '#a0fab2', color: '#2f5a4e' }}
                onClick={handleProceedToPayment}
                disabled={processing || !effectiveAmount || gatewaysLoading}
                data-testid="button-voucher-proceed-payment"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'payment' && (
        <Card className="border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-foreground" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Choose your payment method
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Gift Voucher</p>
                  <p className="text-sm text-gray-500">
                    For: {sendToSelf ? (buyerEmail || user?.email) : recipientEmail}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  ${effectiveAmount?.toFixed(2)}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Method</Label>
              <div className="grid gap-3">
                {hasWalletBalance && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('system_wallet')}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                      selectedPaymentMethod === 'system_wallet' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    data-testid="button-payment-wallet"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#a0fab2' }}>
                      <Wallet className="w-5 h-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Wallet Balance</p>
                      <p className="text-sm text-gray-500">${walletBalance.toFixed(2)} available</p>
                    </div>
                    {selectedPaymentMethod === 'system_wallet' && (
                      <CheckCircle2 className="w-5 h-5 text-foreground" />
                    )}
                  </button>
                )}

                {isStripeEnabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                      selectedPaymentMethod === 'card' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    data-testid="button-payment-card"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#a0fab2' }}>
                      <CreditCard className="w-5 h-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-sm text-gray-500">Visa, Mastercard, etc.</p>
                    </div>
                    {selectedPaymentMethod === 'card' && (
                      <CheckCircle2 className="w-5 h-5 text-foreground" />
                    )}
                  </button>
                )}

                {isPayPalEnabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('paypal')}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                      selectedPaymentMethod === 'paypal' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    data-testid="button-payment-paypal"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#a0fab2' }}>
                      <SiPaypal className="w-5 h-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">PayPal</p>
                      <p className="text-sm text-gray-500">Pay with PayPal account</p>
                    </div>
                    {selectedPaymentMethod === 'paypal' && (
                      <CheckCircle2 className="w-5 h-5 text-foreground" />
                    )}
                  </button>
                )}

                {isPaystackEnabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('paystack')}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                      selectedPaymentMethod === 'paystack' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    data-testid="button-payment-paystack"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#a0fab2' }}>
                      <DollarSign className="w-5 h-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Paystack</p>
                      <p className="text-sm text-gray-500">Pay with Paystack</p>
                    </div>
                    {selectedPaymentMethod === 'paystack' && (
                      <CheckCircle2 className="w-5 h-5 text-foreground" />
                    )}
                  </button>
                )}

                {isDodoEnabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('dodopay')}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                      selectedPaymentMethod === 'dodopay' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    data-testid="button-payment-dodopay"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#a0fab2' }}>
                      <CreditCard className="w-5 h-5" style={{ color: '#2f5a4e' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Card Payment</p>
                      <p className="text-sm text-gray-500">Visa, Mastercard, Apple Pay</p>
                    </div>
                    {selectedPaymentMethod === 'dodopay' && (
                      <CheckCircle2 className="w-5 h-5 text-foreground" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {selectedPaymentMethod === 'card' && isStripeEnabled && (
              <div className="space-y-3">
                <Label>Card Details</Label>
                <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#1a1a1a',
                          '::placeholder': {
                            color: '#a0a0a0',
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Your payment is secured with SSL encryption</span>
            </div>

            {error && (
              <div className="p-3 bg-primary/10 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-primary dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              className="w-full h-12 text-lg text-white"
              style={{ backgroundColor: '#a0fab2', color: '#2f5a4e' }}
              onClick={handlePayment}
              disabled={processing || !selectedPaymentMethod || (selectedPaymentMethod === 'card' && !stripe)}
              data-testid="button-voucher-complete-payment"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Payment...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Pay ${effectiveAmount?.toFixed(2)}
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function BuyVoucherSection({ onBack, onSuccess }: BuyVoucherSectionProps) {
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const { data: enabledGateways = [], isLoading: gatewaysLoading } = useEnabledGateways();
  const isStripeEnabled = enabledGateways.some(g => g.gatewayId === 'stripe');
  const hasAnyGateway = enabledGateways.length > 0;

  useEffect(() => {
    async function initStripe() {
      try {
        const stripe = await getStripePromise();
        setStripeInstance(stripe);
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
      } finally {
        setStripeLoading(false);
      }
    }
    initStripe();
  }, []);

  if (gatewaysLoading || stripeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment options...</p>
        </div>
      </div>
    );
  }

  if (!hasAnyGateway) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Not Available
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Gift voucher purchases are temporarily unavailable. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only wrap in Elements if Stripe is enabled, otherwise render form directly
  if (isStripeEnabled && stripeInstance) {
    return (
      <Elements stripe={stripeInstance}>
        <VoucherPurchaseFormWithStripe onBack={onBack} onSuccess={onSuccess} />
      </Elements>
    );
  }

  // For non-Stripe gateways (PayPal, Paystack, etc.), render form without Stripe hooks
  return <VoucherPurchaseFormInner onBack={onBack} onSuccess={onSuccess} />;
}
