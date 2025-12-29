import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ArrowLeft, Clock, RefreshCw, Wallet, Loader2, 
  Package, AlertCircle, CheckCircle, CreditCard, Shield
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PaymentGateway {
  id: string;
  name: string;
  displayName: string;
  isPrimary: boolean;
  logoUrl: string | null;
}

export default function ServiceCheckoutPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/checkout/service/:id');
  const { toast } = useToast();
  const { user } = useAuth();

  const searchParams = new URLSearchParams(window.location.search);
  const packageTier = searchParams.get('package') || 'basic';
  
  // Extract just the UUID from the id param (handles both ? and encoded %3F)
  const rawId = params?.id || '';
  const decodedId = decodeURIComponent(rawId);
  const serviceId = decodedId.split('?')[0];

  const [requirements, setRequirements] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: serviceData, isLoading: isLoadingService } = useQuery({
    queryKey: ['/api/marketplace/services', serviceId],
    queryFn: () => apiRequest(`/api/marketplace/services/${serviceId}`),
    enabled: !!serviceId,
  });

  const { data: walletData } = useQuery({
    queryKey: ['/api/freelancer/orders/wallet/balance'],
    queryFn: () => apiRequest('/api/freelancer/orders/wallet/balance'),
  });

  const { data: gatewaysData, isLoading: isLoadingGateways } = useQuery({
    queryKey: ['/api/freelancer/orders/payment-gateways'],
    queryFn: () => apiRequest('/api/freelancer/orders/payment-gateways'),
  });

  const availableGateways: PaymentGateway[] = useMemo(() => {
    if (!gatewaysData?.gateways) return [];
    return gatewaysData.gateways;
  }, [gatewaysData]);

  const primaryGateway = useMemo(() => {
    return availableGateways.find(g => g.isPrimary) || availableGateways.find(g => g.id !== 'wallet');
  }, [availableGateways]);

  React.useEffect(() => {
    if (availableGateways.length > 0 && !paymentMethod) {
      const primary = availableGateways.find(g => g.isPrimary);
      if (primary) {
        setPaymentMethod(primary.id);
      } else if (availableGateways.length > 0) {
        setPaymentMethod(availableGateways[0].id);
      }
    }
  }, [availableGateways, paymentMethod]);

  const service = serviceData?.service;
  const freelancer = serviceData?.freelancer;
  const packages = service?.packages || {};
  const selectedPackage = packages[packageTier] || {};
  const walletBalance = parseFloat(walletData?.balance || '0');

  const subtotal = parseFloat(selectedPackage.price) || 0;
  const platformFee = subtotal * 0.06;
  const total = subtotal + platformFee;
  const hasEnoughBalance = walletBalance >= total;

  const checkoutMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/freelancer/orders/checkout/${serviceId}`, {
        method: 'POST',
        body: JSON.stringify({
          selectedPackage: packageTier,
          requirementsText: requirements,
        }),
      }),
    onSuccess: async (data) => {
      if (paymentMethod === 'wallet') {
        payMutation.mutate(data.order.id);
      } else if (paymentMethod === 'stripe') {
        await handleStripePayment(data.order.id);
      } else if (paymentMethod === 'paypal') {
        await handlePayPalPayment(data.order.id);
      } else {
        await handleGatewayPayment(data.order.id, paymentMethod);
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({ title: error.message || 'Failed to create order', variant: 'destructive' });
    },
  });

  const payMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest(`/api/freelancer/orders/${orderId}/pay`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      setIsProcessing(false);
      setShowPaymentModal(false);
      toast({ title: 'Payment successful!' });
      navigate(`/orders/${data.order.id}`);
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({ title: error.message || 'Payment failed', variant: 'destructive' });
    },
  });

  const handleStripePayment = async (orderId: string) => {
    try {
      const response = await apiRequest('/api/freelancer/orders/stripe/create-session', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          successUrl: `${window.location.origin}/orders/${orderId}?payment=success`,
          cancelUrl: `${window.location.origin}/checkout/service/${serviceId}?package=${packageTier}&payment=cancelled`,
        }),
      });

      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      setIsProcessing(false);
      toast({ title: error.message || 'Failed to initiate Stripe payment', variant: 'destructive' });
    }
  };

  const handlePayPalPayment = async (orderId: string) => {
    try {
      const response = await apiRequest('/api/freelancer/orders/paypal/create-order', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          returnUrl: `${window.location.origin}/orders/${orderId}?payment=success`,
          cancelUrl: `${window.location.origin}/checkout/service/${serviceId}?package=${packageTier}&payment=cancelled`,
        }),
      });

      if (response.approvalUrl) {
        window.location.href = response.approvalUrl;
      }
    } catch (error: any) {
      setIsProcessing(false);
      toast({ title: error.message || 'Failed to initiate PayPal payment', variant: 'destructive' });
    }
  };

  const handleGatewayPayment = async (orderId: string, gatewayId: string) => {
    try {
      const response = await apiRequest(`/api/freelancer/orders/${gatewayId}/create-session`, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          successUrl: `${window.location.origin}/orders/${orderId}?payment=success`,
          cancelUrl: `${window.location.origin}/checkout/service/${serviceId}?package=${packageTier}&payment=cancelled`,
        }),
      });

      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      setIsProcessing(false);
      toast({ title: error.message || `Failed to initiate ${gatewayId} payment`, variant: 'destructive' });
    }
  };

  const handleProceedToPayment = () => {
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    checkoutMutation.mutate();
  };

  const isCardGateway = (gatewayId: string) => {
    return ['stripe', 'dodopay', 'dodo', 'dodopayments', 'flutterwave', 'vodapay', 'paynow'].includes(gatewayId.toLowerCase());
  };

  const getGatewayIcon = (gatewayId: string) => {
    if (gatewayId === 'wallet') {
      return <Wallet className="w-6 h-6 text-[#0c332c]" />;
    }
    if (gatewayId === 'paypal') {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#003087">
          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.804.804 0 0 1 .794-.679h6.405c2.166 0 3.739.537 4.681 1.597.893 1.003 1.137 2.467.724 4.354l-.006.032c-.553 2.886-2.093 4.896-4.584 5.979-1.168.507-2.447.754-3.81.754H7.67a.805.805 0 0 0-.794.68l-1.247 5.403a.805.805 0 0 1-.794.68H7.076z"/>
        </svg>
      );
    }
    return <CreditCard className="w-6 h-6 text-[#0c332c]" />;
  };

  const getGatewayDisplayName = (gateway: PaymentGateway) => {
    if (gateway.id === 'wallet') return 'Wallet Balance';
    if (gateway.id === 'paypal') return 'PayPal';
    if (isCardGateway(gateway.id)) return 'Card';
    return gateway.displayName || gateway.name;
  };

  const getGatewayDescription = (gateway: PaymentGateway) => {
    if (gateway.id === 'wallet') {
      return `$${walletBalance.toFixed(2)} available`;
    }
    if (gateway.id === 'paypal') {
      return 'Pay with your PayPal account';
    }
    if (isCardGateway(gateway.id)) {
      return 'Pay with credit or debit card';
    }
    return 'Secure payment';
  };

  if (!service && !isLoadingService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Service not found</h2>
          <Button onClick={() => navigate('/marketplace/services')}>Browse Services</Button>
        </div>
      </div>
    );
  }

  if (isLoadingService || isLoadingGateways || !service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Order</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="flex gap-4">
                  <div className="w-24 h-16 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 h-64">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded mt-6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (availableGateways.length === 0 && !isLoadingGateways) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Payment Not Available</h2>
          <p className="text-gray-600 mb-4">No payment gateways are currently configured. Please contact support.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const canProceed = paymentMethod === 'wallet' ? hasEnoughBalance : !!paymentMethod;
  const selectedGateway = availableGateways.find(g => g.id === paymentMethod);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Order</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {service.images?.[0] ? (
                      <img src={service.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-2">{service.title}</h3>
                    <p className="text-sm text-gray-500 capitalize">{packageTier} Package</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center gap-2 mb-4">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={freelancer?.profilePicture} />
                    <AvatarFallback>{freelancer?.name?.[0] || 'F'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">{freelancer?.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedPackage.deliveryDays || 7} day delivery
                  </span>
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" />
                    {selectedPackage.revisions || 0} revisions
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Describe your project requirements, goals, and any specific details the freelancer should know..."
                  className="min-h-[150px]"
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  {availableGateways.map((gateway) => (
                    <label
                      key={gateway.id}
                      htmlFor={gateway.id}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentMethod === gateway.id 
                          ? 'border-[#0c332c] bg-[#0c332c]/5 shadow-sm' 
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <RadioGroupItem value={gateway.id} id={gateway.id} className="sr-only" />
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        paymentMethod === gateway.id ? 'bg-[#0c332c]/10' : 'bg-gray-100'
                      }`}>
                        {getGatewayIcon(gateway.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{getGatewayDisplayName(gateway)}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{getGatewayDescription(gateway)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {gateway.id === 'wallet' && !hasEnoughBalance && (
                          <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Low balance</span>
                        )}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          paymentMethod === gateway.id 
                            ? 'border-[#0c332c] bg-[#0c332c]' 
                            : 'border-gray-300'
                        }`}>
                          {paymentMethod === gateway.id && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>

                {!hasEnoughBalance && paymentMethod === 'wallet' && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                    <p className="text-sm text-yellow-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Insufficient wallet balance. Please add funds or select another payment method.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee (6%)</span>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full bg-[#0c332c] hover:bg-[#0c332c]/90 h-12 text-white"
                  onClick={handleProceedToPayment}
                  disabled={!canProceed}
                >
                  Continue to Pay
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure payment protected by escrow</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Review your order before completing the payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-16 h-12 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                {service.images?.[0] ? (
                  <img src={service.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{service.title}</p>
                <p className="text-xs text-gray-500 capitalize">{packageTier} Package</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (6%)</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {selectedGateway && (
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                {selectedGateway.logoUrl ? (
                  <img src={selectedGateway.logoUrl} alt={selectedGateway.name} className="w-8 h-8 object-contain" />
                ) : (
                  getGatewayIcon(selectedGateway.id)
                )}
                <div>
                  <p className="font-medium text-sm">{getGatewayDisplayName(selectedGateway)}</p>
                  <p className="text-xs text-gray-500">{getGatewayDescription(selectedGateway)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="flex-1 bg-[#0c332c] hover:bg-[#0c332c]/90 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${total.toFixed(2)}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
