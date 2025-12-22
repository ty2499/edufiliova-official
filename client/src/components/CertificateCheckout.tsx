import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CreditCard, Mail, Package, Wallet } from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { useCurrency } from '@/hooks/useCurrency';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useEnabledGateways } from '@/hooks/useEnabledGateways';
import { useQuery } from '@tanstack/react-query';
import { SiPaypal } from 'react-icons/si';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { getStripePromise } from '@/lib/stripe';

type PaymentMethod = 'card' | 'paypal' | 'wallet' | 'paystack' | 'saved_card' | 'system_wallet' | string;

interface CertificateCheckoutProps {
  courseId: string;
  courseTitle: string;
  certificateType: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const CERTIFICATE_PRICES = {
  soft_copy: 7.99,
  hard_copy: 25.99,
};

interface StripeCardSectionProps {
  clientSecret: string | null;
  certificateFormat: 'soft_copy' | 'hard_copy';
  shippingAddress: ShippingAddress;
  amount: number;
  courseId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

function StripeCardSection({
  clientSecret,
  certificateFormat,
  shippingAddress,
  amount,
  courseId,
  onSuccess,
  onError,
  isLoading,
  setIsLoading
}: StripeCardSectionProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleCardPayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      onError('Payment system not ready. Please try again.');
      return;
    }

    setIsLoading(true);
    onError('');

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
        console.error('Payment failed:', paymentError);
        onError(paymentError.message || 'Payment failed. Please try again.');
        setIsLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        const confirmResponse = await apiRequest('/api/certificates/confirm-payment', {
          method: 'POST',
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            shippingAddress: certificateFormat === 'hard_copy' ? shippingAddress : null,
          }),
        });

        if (confirmResponse.success) {
          onSuccess();
        } else {
          onError('Payment confirmation failed. Please contact support.');
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      onError(err.message || 'Payment failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4">
      {clientSecret ? (
        <>
          <div className="border rounded-lg p-4 mb-4">
            <CardElement options={{
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
            }} />
          </div>
          <Button
            onClick={handleCardPayment}
            disabled={isLoading}
            className="w-full"
            data-testid="button-pay-stripe"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckmarkIcon size="sm" variant="success" className="mr-2" />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </Button>
        </>
      ) : (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        </div>
      )}
    </div>
  );
}

function CertificateCheckoutForm({ 
  courseId, 
  courseTitle,
  certificateType: certificateTypeName,
  onSuccess, 
  onCancel
}: CertificateCheckoutProps) {
  const { formatPrice } = useCurrency();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [certificateFormat, setCertificateFormat] = useState<'soft_copy' | 'hard_copy'>('soft_copy');
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const amount = CERTIFICATE_PRICES[certificateFormat];

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  const { data: enabledGateways = [], isLoading: gatewaysLoading } = useEnabledGateways();

  const primaryGateway = enabledGateways.find(g => g.isPrimary) || enabledGateways[0];
  
  const isStripeEnabled = enabledGateways.some(g => g.gatewayId === 'stripe');
  const isPayPalEnabled = enabledGateways.some(g => g.gatewayId === 'paypal');

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
  const hasSufficientBalance = walletBalance >= amount;

  useEffect(() => {
    if (!gatewaysLoading && primaryGateway && !selectedMethod) {
      if (primaryGateway.gatewayId === 'stripe') {
        setSelectedMethod('card');
      } else {
        setSelectedMethod(primaryGateway.gatewayId as PaymentMethod);
      }
    }
  }, [gatewaysLoading, primaryGateway, selectedMethod]);

  useEffect(() => {
    if (isStripeEnabled && selectedMethod === 'card') {
      const createPaymentIntent = async () => {
        try {
          setPaymentError(null);
          const response = await apiRequest('/api/certificates/create-payment-intent', {
            method: 'POST',
            body: JSON.stringify({
              courseId,
              certificateType: certificateFormat,
              amount,
            }),
          });
          setClientSecret(response.clientSecret);
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to create payment intent';
          setPaymentError(errorMessage);
        }
      };
      createPaymentIntent();
    }
  }, [selectedMethod, certificateFormat, isStripeEnabled, courseId, amount]);

  const validateShippingAddress = (): boolean => {
    if (certificateFormat === 'hard_copy') {
      const required = ['name', 'address', 'city', 'state', 'postalCode', 'country'];
      for (const field of required) {
        if (!shippingAddress[field as keyof ShippingAddress]?.trim()) {
          setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return false;
        }
      }
    }
    return true;
  };

  const handlePayPalPayment = async () => {
    if (!validateShippingAddress()) {
      return;
    }

    setProcessing(true);
    setPaymentError(null);
    
    try {
      const response = await fetch('/api/paypal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amount.toFixed(2), 
          currency: 'USD',
          intent: 'CAPTURE',
          returnUrl: `${window.location.origin}/?payment=success&type=certificate&courseId=${courseId}`,
          cancelUrl: `${window.location.origin}/?payment=cancelled`
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
    } catch (error: any) {
      setPaymentError(error.message || 'PayPal payment failed');
      setProcessing(false);
    }
  };

  const handleSystemWalletPayment = async () => {
    if (!validateShippingAddress()) {
      return;
    }

    if (!hasSufficientBalance) {
      setPaymentError(`Insufficient wallet balance. You have $${walletBalance.toFixed(2)}, but need $${amount.toFixed(2)}.`);
      return;
    }

    setProcessing(true);
    setPaymentError(null);
    
    try {
      const response = await apiRequest('/api/certificates/purchase-with-wallet', {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          certificateType: certificateFormat,
          amount,
          shippingAddress: certificateFormat === 'hard_copy' ? shippingAddress : null,
        })
      });

      if (response.success) {
        queryClient.invalidateQueries({ queryKey: [`/api/certificates/course/${courseId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
        
        setShowSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        throw new Error(response.error || 'Wallet payment failed');
      }
    } catch (error: any) {
      setPaymentError(error.message || 'Wallet payment failed. Please try another payment method.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateShippingAddress()) {
      return;
    }

    if (selectedMethod === 'paypal') {
      await handlePayPalPayment();
    } else if (selectedMethod === 'system_wallet') {
      await handleSystemWalletPayment();
    } else {
      setPaymentError('Please select a payment method');
    }
  };

  const handleStripeSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-32 h-32 mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <CheckmarkIcon size="2xl" variant="success" className="w-20 h-20" />
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
        <p className="text-gray-600">Generating your certificate...</p>
      </div>
    );
  }

  if (gatewaysLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (enabledGateways.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">No payment gateways are currently configured. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Claim Your {certificateTypeName}</h2>
        <p className="text-gray-600">{courseTitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Certificate Format</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={certificateFormat} 
            onValueChange={(value: string) => setCertificateFormat(value as 'soft_copy' | 'hard_copy')}
          >
            <div className="flex items-start space-x-3 p-4 border-2 rounded-lg mb-3 cursor-pointer hover:border-primary" data-testid="option-soft-copy">
              <RadioGroupItem value="soft_copy" id="soft_copy" />
              <div className="flex-1">
                <Label htmlFor="soft_copy" className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-5 w-5" />
                    <span className="font-semibold">Digital Certificate (Soft Copy)</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Receive your certificate via email as a PDF. Instant delivery.
                  </p>
                  <p className="text-lg font-bold text-foreground mt-2">{formatPrice(CERTIFICATE_PRICES.soft_copy)}</p>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary" data-testid="option-hard-copy">
              <RadioGroupItem value="hard_copy" id="hard_copy" />
              <div className="flex-1">
                <Label htmlFor="hard_copy" className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-5 w-5" />
                    <span className="font-semibold">Physical Certificate (Hard Copy)</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Receive a professionally printed certificate delivered to your address.
                  </p>
                  <p className="text-lg font-bold text-foreground mt-2">{formatPrice(CERTIFICATE_PRICES.hard_copy)}</p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {certificateFormat === 'hard_copy' && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={shippingAddress.name}
                onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                placeholder="John Doe"
                data-testid="input-shipping-name"
              />
            </div>
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={shippingAddress.address}
                onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                placeholder="123 Main Street"
                data-testid="input-shipping-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  placeholder="New York"
                  data-testid="input-shipping-city"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province *</Label>
                <Input
                  id="state"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  placeholder="NY"
                  data-testid="input-shipping-state"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                  placeholder="10001"
                  data-testid="input-shipping-postal"
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                  placeholder="United States"
                  data-testid="input-shipping-country"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm mb-4">
              {paymentError}
            </div>
          )}

          <div className="space-y-4 mb-6">
            {isStripeEnabled && (
              <button
                onClick={() => setSelectedMethod('card')}
                className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                  selectedMethod === 'card'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-card"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6" />
                  <div className="flex-1">
                    <div className="font-semibold">Credit/Debit Card</div>
                    <div className="text-xs text-muted-foreground">Pay securely with your card</div>
                  </div>
                </div>
              </button>
            )}

            {isPayPalEnabled && (
              <button
                onClick={() => setSelectedMethod('paypal')}
                className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                  selectedMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-paypal"
              >
                <div className="flex items-center gap-3">
                  <SiPaypal className="w-6 h-6 text-[#0070BA]" />
                  <div className="flex-1">
                    <div className="font-semibold">PayPal</div>
                    <div className="text-xs text-muted-foreground">Pay with your PayPal account</div>
                  </div>
                </div>
              </button>
            )}

            {hasWalletBalance && (
              <button
                onClick={() => setSelectedMethod('system_wallet')}
                className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                  selectedMethod === 'system_wallet'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-wallet"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6" />
                  <div className="flex-1">
                    <div className="font-semibold">System Wallet</div>
                    <div className="text-xs text-muted-foreground">
                      Balance: ${walletBalance.toFixed(2)}
                      {!hasSufficientBalance && <span className="text-red-500 ml-1">(Insufficient)</span>}
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>

          {selectedMethod === 'card' && isStripeEnabled && stripePromise && (
            <Elements stripe={stripePromise}>
              <StripeCardSection
                clientSecret={clientSecret}
                certificateFormat={certificateFormat}
                shippingAddress={shippingAddress}
                amount={amount}
                courseId={courseId}
                onSuccess={handleStripeSuccess}
                onError={setError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </Elements>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Certificate Type:</span>
              <span className="font-semibold">
                {certificateFormat === 'soft_copy' ? 'Digital (Soft Copy)' : 'Physical (Hard Copy)'}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-foreground">{formatPrice(amount)}</span>
            </div>
          </div>

          {selectedMethod !== 'card' && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading || processing}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!selectedMethod || isLoading || processing}
                className="flex-1"
                data-testid="button-pay"
              >
                {(isLoading || processing) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckmarkIcon size="sm" variant="success" className="mr-2" />
                    Pay {formatPrice(amount)}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CertificateCheckout(props: CertificateCheckoutProps) {
  return <CertificateCheckoutForm {...props} />;
}
