import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { Stripe } from "@stripe/stripe-js";
import { AjaxStatus, type AjaxOperation } from "@/components/ui/ajax-loader";
import { useAjaxState } from "@/hooks/useAjaxState";
import { X, CreditCard, Shield, DollarSign, Wallet, Smartphone, Loader2, CheckCircle2 } from "lucide-react";
import { SiPaypal } from "react-icons/si";
import { getStripePromise } from "@/lib/stripe";
import { usePaymentGateways, type PaymentGateway, getGatewayDisplayName, isCardGateway } from "@/hooks/usePaymentGateways";
import { DodoPayments } from "dodopayments-checkout";

interface WalletPageProps {
  userRole?: 'student' | 'teacher' | 'freelancer' | 'customer';
}

interface ShopWallet {
  balance: string;
}

interface ShopTransaction {
  id: string;
  amount: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

// Wallet Payment Modal Component  
function WalletPaymentModal({ 
  amount, 
  clientSecret, 
  onSuccess, 
  onClose,
  enabledGateways = []
}: { 
  amount: string; 
  clientSecret: string;
  onSuccess: () => void; 
  onClose: () => void;
  enabledGateways?: PaymentGateway[];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (enabledGateways.length > 0 && !selectedGateway) {
      const primary = enabledGateways.find(g => g.isPrimary);
      setSelectedGateway(primary?.gatewayId || enabledGateways[0].gatewayId);
    }
  }, [enabledGateways, selectedGateway]);

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();

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

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        await apiRequest('/api/shop/wallet/confirm-payment', {
          method: 'POST',
          body: JSON.stringify({ paymentIntentId: paymentIntent.id })
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
        queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet/transactions'] });
        onSuccess();
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    setProcessing(true);
    setError('');
    
    try {
      const response = await fetch('/api/paypal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(amount).toFixed(2), 
          currency: 'USD',
          intent: 'CAPTURE',
          returnUrl: `${window.location.origin}/wallet?payment=success`,
          cancelUrl: `${window.location.origin}/wallet?payment=cancelled`
        }),
      });
      
      const orderData = await response.json();
      
      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create PayPal order');
      }
      
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
    } catch (err: any) {
      setError(err.message || 'PayPal payment failed');
      setProcessing(false);
    }
  };

  const handleMobileMoneyPayment = async (gatewayId: string) => {
    setProcessing(true);
    setError('');
    
    try {
      const response = await fetch(`/api/${gatewayId}/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          amount: parseFloat(amount).toFixed(2), 
          currency: 'USD',
          type: 'wallet_topup',
          returnUrl: `${window.location.origin}/wallet?payment=success&gateway=${gatewayId}`,
          cancelUrl: `${window.location.origin}/wallet?payment=cancelled`
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to initiate ${gatewayId} payment`);
      }
      
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(`No redirect URL returned from ${gatewayId}`);
      }
    } catch (err: any) {
      setError(err.message || `${gatewayId} payment failed`);
      setProcessing(false);
    }
  };

  // Initialize DodoPay SDK
  const [dodoInitialized, setDodoInitialized] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const dodoGateway = enabledGateways.find(g => g.gatewayId === 'dodopay' || g.gatewayId === 'dodo');
  const isDodoEnabled = !!dodoGateway;
  const isDodoTestMode = dodoGateway?.testMode === true;

  useEffect(() => {
    if (isDodoEnabled && !dodoInitialized) {
      try {
        const dodoMode = isDodoTestMode ? "test" : "live";
        DodoPayments.Initialize({
          mode: dodoMode,
          onEvent: (event: any) => {
            console.log("Card checkout event (wallet):", event);
            
            if (event.event_type === "checkout.redirect") {
              // Confirm the wallet payment on the backend
              fetch('/api/shop/wallet/confirm-dodopay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  amount: parseFloat(amount),
                  paymentId: event.data?.payment_id,
                  sessionId: event.data?.session_id
                })
              }).then(res => {
                if (!res.ok) {
                  throw new Error('Server returned error');
                }
                return res.json();
              }).then(data => {
                console.log("Wallet top-up confirmed:", data);
                if (data.success) {
                  setShowSuccess(true);
                  setProcessing(false);
                  queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet/transactions'] });
                  setTimeout(() => {
                    onSuccess();
                  }, 2000);
                } else {
                  throw new Error(data.error || 'Payment confirmation failed');
                }
              }).catch(err => {
                console.error("Failed to confirm wallet top-up:", err);
                setError('Payment confirmation failed. Please contact support.');
                setProcessing(false);
              });
            } else if (event.event_type === "checkout.closed") {
              setProcessing(false);
            } else if (event.event_type === "checkout.error") {
              console.error("Dodo checkout error:", event.data);
              setProcessing(false);
            }
          }
        });
        setDodoInitialized(true);
        console.log(`✅ Card Payments SDK initialized (wallet) - mode: ${dodoMode}`);
      } catch (error) {
        console.warn("Failed to initialize Dodo overlay SDK:", error);
      }
    }
  }, [isDodoEnabled, isDodoTestMode, dodoInitialized, onSuccess]);

  const handleDodoPayment = async () => {
    setProcessing(true);
    setError('');
    
    try {
      const response = await fetch('/api/dodopay/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'USD',
          productName: 'Wallet Top-Up',
          productDescription: `Add $${amount} to your wallet`,
          productType: 'wallet_topup',
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
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (err: any) {
      console.error("Card wallet payment error:", err);
      setError(err.message || 'Failed to initialize payment');
      setProcessing(false);
    }
  };

  // Show success screen
  if (showSuccess) {
    return (
      <div className="fixed inset-0 md:bg-black/60 md:backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="rounded-2xl text-center p-8 bg-white max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">${parseFloat(amount).toFixed(2)} has been added to your wallet.</p>
        </Card>
      </div>
    );
  }

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
            {/* Left Side - Order Summary */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="font-semibold text-base md:text-lg">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Wallet Top-Up</div>
                    <div className="text-xs text-muted-foreground">One-time purchase • Instant access</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total due today</span>
                  <span>${parseFloat(amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right Side - Payment Method */}
            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="font-semibold text-base mb-3">Payment method</h3>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {enabledGateways.map((gateway) => (
                    <button
                      key={gateway.gatewayId}
                      type="button"
                      onClick={() => setSelectedGateway(gateway.gatewayId)}
                      className={`flex-1 min-w-[80px] p-3 border rounded-lg transition-all ${
                        selectedGateway === gateway.gatewayId 
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      data-testid={`button-payment-${gateway.gatewayId}`}
                    >
                      {gateway.gatewayId === 'stripe' && <CreditCard className="w-5 h-5 mx-auto" />}
                      {(gateway.gatewayId === 'dodopay' || gateway.gatewayId === 'dodo') && <CreditCard className="w-5 h-5 mx-auto" />}
                      {gateway.gatewayId === 'paypal' && (
                        <img 
                          src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" 
                          alt="PayPal" 
                          className="h-6 mx-auto"
                        />
                      )}
                      {!['stripe', 'paypal', 'dodopay', 'dodo'].includes(gateway.gatewayId) && (
                        <Smartphone className="w-5 h-5 mx-auto" />
                      )}
                      <span className="text-xs mt-1 block">{getGatewayDisplayName(gateway)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedGateway === 'stripe' && (
                <form onSubmit={handleCardPayment} className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-3">Payment information</h3>
                    <div className="flex gap-2 mb-3">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                      <img src="https://www.americanexpress.com/content/dam/amex/us/merchant/supplies-uplift/product/images/4_Card_color_horizontal.png" alt="American Express Accepted Here" className="h-6" />
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
                    disabled={!stripe || processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
                    data-testid="button-complete-purchase"
                  >
                    {processing ? 'Processing...' : `Complete Purchase`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure 256-bit SSL encrypted payment</span>
                  </div>
                </form>
              )}

              {selectedGateway === 'paypal' && (
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

              {(selectedGateway === 'dodopay' || selectedGateway === 'dodo') && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    Secure checkout will open to complete your payment.
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleDodoPayment}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
                    data-testid="button-dodopay-checkout"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
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

              {selectedGateway && !['stripe', 'paypal', 'dodopay', 'dodo'].includes(selectedGateway) && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800">
                    You will be redirected to {getGatewayDisplayName(enabledGateways.find(g => g.gatewayId === selectedGateway) || { gatewayId: selectedGateway, gatewayName: selectedGateway } as PaymentGateway)} to complete your payment.
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={() => handleMobileMoneyPayment(selectedGateway)}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base font-semibold"
                    data-testid={`button-${selectedGateway}-checkout`}
                  >
                    {processing ? 'Processing...' : `Pay with ${getGatewayDisplayName(enabledGateways.find(g => g.gatewayId === selectedGateway) || { gatewayId: selectedGateway, gatewayName: selectedGateway } as PaymentGateway)}`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure mobile payment</span>
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

export function WalletPage({ userRole = 'customer' }: WalletPageProps) {
  const { profile } = useAuth();
  const [addAmount, setAddAmount] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [voucherCode, setVoucherCode] = useState('');
  const voucherAjax = useAjaxState({ operation: 'idle' });
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Fetch enabled payment gateways from admin config
  const { data: adminGateways = [] } = usePaymentGateways();
  
  // For wallet top-up: PayPal and DodoPay always available (can't pay with wallet to top up wallet)
  // Only add them if not already in admin gateways
  const alwaysAvailableGateways: PaymentGateway[] = [
    // Add DodoPay (Card) if not already configured
    ...(!adminGateways.some(g => g.gatewayId === 'dodopay' || g.gatewayId === 'dodo')
      ? [{ gatewayId: 'dodopay', gatewayName: 'Card', isPrimary: true, supportedCurrencies: ['USD'], features: [], testMode: true }]
      : []),
    // Add PayPal if not already configured
    ...(!adminGateways.some(g => g.gatewayId === 'paypal')
      ? [{ gatewayId: 'paypal', gatewayName: 'PayPal', isPrimary: false, supportedCurrencies: ['USD'], features: [], testMode: false }]
      : [])
  ];
  
  // Merge: Start with admin-configured gateways (sorted by primary first), then add fallback gateways
  // Exclude system_wallet as you can't top up wallet using wallet
  const mergedGateways = [
    ...adminGateways.filter(g => g.gatewayId !== 'system_wallet').sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)),
    ...alwaysAvailableGateways.filter(g => !adminGateways.some(ag => ag.gatewayId === g.gatewayId))
  ];
  
  // Filter regional gateways based on user's country
  const filteredGateways = mergedGateways.filter(gateway => {
    // Always show PayPal
    if (gateway.gatewayId === 'paypal') {
      return true;
    }
    // DodoPay/Dodo - always show if enabled (card payments)
    if (gateway.gatewayId === 'dodopay' || gateway.gatewayId === 'dodo') {
      return true;
    }
    // Stripe - only show if enabled in admin
    if (gateway.gatewayId === 'stripe') {
      return adminGateways.some(g => g.gatewayId === 'stripe' && g.isEnabled);
    }
    // EcoCash, PayNow - only for Zimbabwe
    if (['ecocash', 'paynow'].includes(gateway.gatewayId)) {
      return profile?.country?.toLowerCase() === 'zimbabwe';
    }
    // VodaPay - only for South Africa
    if (gateway.gatewayId === 'vodapay') {
      return profile?.country?.toLowerCase() === 'south africa';
    }
    // InnBucks - only for Zimbabwe
    if (gateway.gatewayId === 'innbucks') {
      return profile?.country?.toLowerCase() === 'zimbabwe';
    }
    // Other gateways - show if enabled in admin
    return true;
  });

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  const { data: wallet } = useQuery<ShopWallet>({
    queryKey: ['/api/shop/wallet'],
  });

  const { data: transactions } = useQuery<ShopTransaction[]>({
    queryKey: ['/api/shop/wallet/transactions'],
  });

  // Generate available months from transactions
  const availableMonths = transactions ? Array.from(
    new Set(
      transactions.map(tx => {
        const date = new Date(tx.createdAt);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort((a, b) => b.localeCompare(a)) : [];

  // Filter transactions by selected month
  const filteredTransactions = transactions?.filter(tx => {
    if (selectedMonth === 'all') return true;
    const date = new Date(tx.createdAt);
    const txMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return txMonth === selectedMonth;
  }) || [];

  // Format month for display
  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest('/api/shop/wallet/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
      return response;
    },
    onSuccess: (data: any) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPaymentDialog(true);
      } else if (data.error) {
        console.error('Payment intent error:', data.error);
        alert(`Error: ${data.error}`);
      }
    },
    onError: (error: any) => {
      console.error('Failed to create payment intent:', error);
      alert(`Failed to create payment intent: ${error.message || 'Unknown error'}`);
    },
  });

  const redeemVoucherMutation = useMutation({
    mutationFn: async (code: string) => {
      voucherAjax.setLoading('Redeeming voucher...');
      const response = await apiRequest('/api/shop/vouchers/redeem', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      return response;
    },
    onSuccess: (data: any) => {
      voucherAjax.setSuccess(`Successfully redeemed! $${data.amount} has been added to your wallet.`);
      setVoucherCode('');
      queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet/transactions'] });
      setTimeout(() => {
        voucherAjax.setIdle();
      }, 5000);
    },
    onError: (error: any) => {
      let description = error.message || "Unable to redeem voucher. Please check the code and try again.";
      
      // Add warning message if provided
      if (error.warningMessage) {
        description = `${description} ${error.warningMessage}`;
      }
      
      // Add remaining attempts info if provided
      if (typeof error.remainingAttempts === 'number') {
        if (error.remainingAttempts === 0) {
          description = error.message || "You've been temporarily blocked due to too many failed attempts. Please try again later.";
        }
      }
      
      voucherAjax.setError(description);
      setTimeout(() => {
        voucherAjax.setIdle();
      }, 8000);
    },
  });

  const handleAddFunds = () => {
    if (addAmount && parseFloat(addAmount) > 0) {
      createPaymentIntentMutation.mutate(addAmount);
    }
  };

  const handleRedeemVoucher = () => {
    if (voucherCode.trim()) {
      redeemVoucherMutation.mutate(voucherCode.trim().toUpperCase());
    } else {
      voucherAjax.setError('Please enter a voucher code.');
      setTimeout(() => {
        voucherAjax.setIdle();
      }, 3000);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setClientSecret(null);
    setAddAmount('');
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
    setClientSecret(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Wallet</h2>
      </div>
      <Card data-testid="card-wallet-balance">
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-[#4f4e4e] text-[27px]">
            ${wallet?.balance || '0.00'}
          </div>
          <div className="flex gap-2 mt-4">
            <Input
              type="number"
              placeholder="Amount"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              data-testid="input-add-funds"
            />
            <Button
              onClick={handleAddFunds}
              disabled={!addAmount || createPaymentIntentMutation.isPending}
              data-testid="button-add-funds"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Add Funds
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voucher Redemption Card */}
      <Card data-testid="card-voucher-redemption">
        <CardHeader>
          <CardTitle>Redeem Voucher</CardTitle>
          <CardDescription>Enter a voucher code to add funds to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter voucher code"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRedeemVoucher();
                }
              }}
              data-testid="input-voucher-code"
              className="font-mono"
            />
            <Button
              onClick={handleRedeemVoucher}
              disabled={!voucherCode.trim() || redeemVoucherMutation.isPending}
              data-testid="button-redeem-voucher"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {redeemVoucherMutation.isPending ? 'Redeeming...' : 'Redeem'}
            </Button>
          </div>
          {voucherAjax.operation !== 'idle' && (
            <div className="mt-3">
              <AjaxStatus operation={voucherAjax.operation} message={voucherAjax.message} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Transaction History</CardTitle>
            
            {/* Month Filter */}
            {transactions && transactions.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="wallet-month-filter" className="text-sm text-gray-600 whitespace-nowrap">Filter by:</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="wallet-month-filter" className="w-full sm:w-[200px]" data-testid="select-wallet-month-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month}>
                        {formatMonthDisplay(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No transactions found for {formatMonthDisplay(selectedMonth)}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMonth('all')}
                data-testid="button-clear-wallet-filter"
              >
                View All Transactions
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {(showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 3)).map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: '#2d5ddd' }}>
                        {tx.type === 'add_funds' ? '+' : '-'}${tx.amount}
                      </p>
                      <Badge variant="secondary">{tx.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              {filteredTransactions.length > 3 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                    className="w-full"
                    data-testid="button-view-all-transactions"
                  >
                    {showAllTransactions ? 'Show Less' : `View All (${filteredTransactions.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Wallet Payment Modal */}
      {showPaymentDialog && clientSecret && stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <WalletPaymentModal 
            amount={addAmount} 
            clientSecret={clientSecret}
            onSuccess={handlePaymentSuccess}
            onClose={handlePaymentCancel}
            enabledGateways={filteredGateways}
          />
        </Elements>
      )}
    </div>
  );
}
