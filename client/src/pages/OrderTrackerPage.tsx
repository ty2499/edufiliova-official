import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, Clock, RefreshCw, Package, Loader2, 
  CheckCircle, Circle, AlertCircle, MessageSquare, FileText, Download
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';

const ORDER_STEPS = [
  { key: 'pending_payment', label: 'Order Placed', description: 'Awaiting payment' },
  { key: 'active', label: 'In Progress', description: 'Freelancer is working' },
  { key: 'delivered', label: 'Delivered', description: 'Review the delivery' },
  { key: 'completed', label: 'Completed', description: 'Order finished' },
];

export default function OrderTrackerPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/orders/:id');
  const orderId = params?.id;
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/freelancer/orders', orderId],
    queryFn: () => apiRequest(`/api/freelancer/orders/${orderId}`),
    enabled: !!orderId,
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/freelancer/orders/${orderId}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/orders', orderId] });
      toast({ title: 'Order approved! Payment released to freelancer.' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to approve order', variant: 'destructive' });
    },
  });

  const order = data?.order;
  const service = data?.service;
  const freelancer = data?.freelancer;
  const client = data?.client;
  const deliverables = data?.deliverables || [];

  const isClient = user?.id === order?.clientId;
  const isFreelancer = user?.id === order?.freelancerId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0c332c]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex(s => s.key === order.status);
  const packageDetails = order.packageDetails || {};

  const getStepIcon = (stepIndex: number) => {
    if (order.status === 'cancelled' || order.status === 'disputed') {
      return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
    if (stepIndex < currentStepIndex || order.status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    if (stepIndex === currentStepIndex) {
      return <Circle className="w-6 h-6 text-[#0c332c] fill-[#0c332c]" />;
    }
    return <Circle className="w-6 h-6 text-gray-300" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-gray-500">
              Created {format(new Date(order.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <Badge 
            className={
              order.status === 'completed' ? 'bg-green-100 text-green-800' :
              order.status === 'active' ? 'bg-blue-100 text-blue-800' :
              order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }
          >
            {order.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {ORDER_STEPS.map((step, index) => (
                    <div key={step.key} className="flex items-start gap-4 pb-8 last:pb-0">
                      <div className="flex flex-col items-center">
                        {getStepIcon(index)}
                        {index < ORDER_STEPS.length - 1 && (
                          <div className={`w-0.5 h-12 mt-2 ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div>
                        <h4 className={`font-medium ${index <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </h4>
                        <p className={`text-sm ${index <= currentStepIndex ? 'text-gray-500' : 'text-gray-300'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {service?.images?.[0] ? (
                      <img src={service.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{service?.title || 'Service'}</h3>
                    <p className="text-sm text-gray-500 capitalize">{order.selectedPackage} Package</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {packageDetails.deliveryDays || 7} days
                      </span>
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-4 h-4" />
                        {packageDetails.revisions || 0} revisions
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.requirementsText && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{order.requirementsText}</p>
                </CardContent>
              </Card>
            )}

            {deliverables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deliverables</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deliverables.map((del: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          Delivered {formatDistanceToNow(new Date(del.createdAt), { addSuffix: true })}
                        </span>
                        {del.revision > 0 && (
                          <Badge variant="outline">Revision {del.revision}</Badge>
                        )}
                      </div>
                      <p className="text-gray-700">{del.message}</p>
                      {del.files && del.files.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {del.files.map((file: string, fIdx: number) => (
                            <Button key={fIdx} variant="outline" size="sm" asChild>
                              <a href={file} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-1" />
                                File {fIdx + 1}
                              </a>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {order.status === 'delivered' && isClient && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="py-6">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Order Delivered!</h3>
                    <p className="text-gray-600 mb-4">
                      Review the delivery and approve to release payment to the freelancer.
                    </p>
                    <Button
                      className="bg-[#0c332c] hover:bg-[#0c332c]/90"
                      onClick={() => approveMutation.mutate()}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Approve & Release Payment
                    </Button>
                    {order.autoReleaseAt && (
                      <p className="text-sm text-gray-500 mt-2">
                        Auto-releases {formatDistanceToNow(new Date(order.autoReleaseAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${parseFloat(order.amountSubtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee</span>
                  <span>${parseFloat(order.platformFeeAmount).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${parseFloat(order.amountTotal).toFixed(2)}</span>
                </div>
                {order.escrowHeldAmount && order.status !== 'completed' && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Payment Held</span>
                    <span>${parseFloat(order.escrowHeldAmount).toFixed(2)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isClient ? 'Freelancer' : 'Client'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={isClient ? freelancer?.profilePicture : client?.profilePicture} />
                    <AvatarFallback>
                      {(isClient ? freelancer?.fullName : client?.fullName)?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{isClient ? freelancer?.fullName : client?.fullName}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </CardContent>
            </Card>

            {order.deliveryDueAt && (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(order.deliveryDueAt), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(order.deliveryDueAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
