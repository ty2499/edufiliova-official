import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Clock, RefreshCw, Wallet, Loader2, 
  Package, AlertCircle, CheckCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function ServiceCheckoutPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/checkout/service/:id');
  const serviceId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();

  const searchParams = new URLSearchParams(window.location.search);
  const packageTier = searchParams.get('package') || 'basic';

  const [requirements, setRequirements] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');

  const { data: serviceData, isLoading: isLoadingService } = useQuery({
    queryKey: ['/api/marketplace/services', serviceId],
    queryFn: () => apiRequest(`/api/marketplace/services/${serviceId}`),
    enabled: !!serviceId,
  });

  const { data: walletData } = useQuery({
    queryKey: ['/api/wallet/balance'],
    queryFn: () => apiRequest('/api/wallet/balance'),
  });

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
    onSuccess: (data) => {
      payMutation.mutate(data.order.id);
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to create order', variant: 'destructive' });
    },
  });

  const payMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest(`/api/freelancer/orders/${orderId}/pay`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      toast({ title: 'Payment successful!' });
      navigate(`/orders/${data.order.id}`);
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Payment failed', variant: 'destructive' });
    },
  });

  if (isLoadingService) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/marketplace/services')} className="mb-6">
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
                    <AvatarFallback>{freelancer?.fullName?.[0] || 'F'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">{freelancer?.fullName}</span>
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
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border ${paymentMethod === 'wallet' ? 'border-[#0c332c] bg-[#0c332c]/5' : 'border-gray-200'}`}>
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-[#0c332c]" />
                          <div>
                            <p className="font-medium">Wallet Balance</p>
                            <p className="text-sm text-gray-500">${walletBalance.toFixed(2)} available</p>
                          </div>
                        </div>
                        {hasEnoughBalance ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {!hasEnoughBalance && paymentMethod === 'wallet' && (
                  <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Insufficient balance. Please add funds to your wallet.
                  </p>
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
                  className="w-full bg-[#0c332c] hover:bg-[#0c332c]/90 h-12"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending || payMutation.isPending || (paymentMethod === 'wallet' && !hasEnoughBalance)}
                >
                  {(checkoutMutation.isPending || payMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Pay ${total.toFixed(2)}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  By placing this order, you agree to our Terms of Service
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
