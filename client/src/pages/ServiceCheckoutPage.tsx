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
  const serviceId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();

  const searchParams = new URLSearchParams(window.location.search);
  const packageTier = searchParams.get('package') || 'basic';

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
  const platformFee = subtotal * 0.15;
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

  const getGatewayIcon = (gatewayId: string) => {
    switch (gatewayId) {
      case 'wallet':
        return <Wallet className="w-5 h-5 text-[#0c332c]" />;
      case 'stripe':
        return <CreditCard className="w-5 h-5 text-[#635bff]" />;
      case 'paypal':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#003087">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.804.804 0 0 1 .794-.679h6.405c2.166 0 3.739.537 4.681 1.597.893 1.003 1.137 2.467.724 4.354l-.006.032c-.553 2.886-2.093 4.896-4.584 5.979-1.168.507-2.447.754-3.81.754H7.67a.805.805 0 0 0-.794.68l-1.247 5.403a.805.805 0 0 1-.794.68H7.076z"/>
          </svg>
        );
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getGatewayDescription = (gateway: PaymentGateway) => {
    switch (gateway.id) {
      case 'wallet':
        return `$${walletBalance.toFixed(2)} available`;
      case 'stripe':
        return 'Pay with credit or debit card';
      case 'paypal':
        return 'Pay with your PayPal account';
      default:
        return gateway.displayName || gateway.name;
    }
  };

  if (isLoadingService || isLoadingGateways) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0c332c]" />
      </div>
    );
  }

  if (!service) {
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

  if (availableGateways.length === 0) {
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

            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  {availableGateways.map((gateway) => (
                    <div 
                      key={gateway.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        paymentMethod === gateway.id 
                          ? 'border-[#0c332c] bg-[#0c332c]/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value={gateway.id} id={gateway.id} />
                      <Label htmlFor={gateway.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              {gateway.logoUrl ? (
                                <img src={gateway.logoUrl} alt={gateway.name} className="w-6 h-6 object-contain" />
                              ) : (
                                getGatewayIcon(gateway.id)
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{gateway.displayName}</p>
                                {gateway.isPrimary && (
                                  <span className="text-xs bg-[#0c332c] text-white px-2 py-0.5 rounded">Primary</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{getGatewayDescription(gateway)}</p>
                            </div>
                          </div>
                          {gateway.id === 'wallet' && (
                            hasEnoughBalance ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-500" />
                            )
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {!hasEnoughBalance && paymentMethod === 'wallet' && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Insufficient wallet balance. Please select another payment method or add funds to your wallet.
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
                    <span className="text-gray-600">Platform Fee (15%)</span>
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
                <span className="text-gray-600">Platform Fee (15%)</span>
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
                  <p className="font-medium text-sm">{selectedGateway.displayName}</p>
                  <p className="text-xs text-gray-500">{getGatewayDescription(selectedGateway)}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Escrow Protection</p>
                <p className="text-green-700 text-xs">Your payment is held securely until you approve the delivered work.</p>
              </div>
            </div>
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
