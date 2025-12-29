import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, Package, Clock, DollarSign, Send, Loader2, 
  CheckCircle, AlertCircle, FileText, Upload
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Order {
  id: string;
  serviceId: string;
  clientId: string;
  freelancerId: string;
  selectedPackage: string;
  packageDetails: any;
  amountSubtotal: string;
  platformFeeAmount: string;
  amountTotal: string;
  status: string;
  requirementsText: string;
  deliveryDueAt: string;
  deliveredAt: string;
  completedAt: string;
  createdAt: string;
  service?: { id: string; title: string; images: string[] };
  client?: { fullName: string; profilePicture: string };
}

export default function FreelancerOrdersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryMessage, setDeliveryMessage] = useState('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['/api/freelancer/orders/selling'],
    queryFn: () => apiRequest('/api/freelancer/orders/selling'),
  });

  const deliverMutation = useMutation({
    mutationFn: ({ orderId, message }: { orderId: string; message: string }) =>
      apiRequest(`/api/freelancer/orders/${orderId}/deliver`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/orders/selling'] });
      toast({ title: 'Order delivered successfully!' });
      setDeliverDialogOpen(false);
      setDeliveryMessage('');
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to deliver order', variant: 'destructive' });
    },
  });

  const orders: Order[] = ordersData?.orders || [];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      active: 'bg-blue-100 text-blue-800',
      delivered: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      disputed: 'bg-orange-100 text-orange-800',
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{status.replace('_', ' ')}</Badge>;
  };

  const activeOrders = orders.filter(o => o.status === 'active');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const allOrders = orders;

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {order.service?.images?.[0] ? (
              <img src={order.service.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 line-clamp-1">{order.service?.title || 'Service'}</h3>
                <p className="text-sm text-gray-500 capitalize">{order.selectedPackage} Package</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={order.client?.profilePicture} />
                <AvatarFallback>{order.client?.fullName?.[0] || 'C'}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">{order.client?.fullName || 'Client'}</span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                ${parseFloat(order.amountTotal).toFixed(2)}
              </span>
              {order.deliveryDueAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Due {formatDistanceToNow(new Date(order.deliveryDueAt), { addSuffix: true })}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
                View Details
              </Button>
              {order.status === 'active' && (
                <Button
                  size="sm"
                  className="bg-[#0c332c]"
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setDeliverDialogOpen(true);
                  }}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Deliver
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0c332c]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-500">Manage orders from your clients</p>
          </div>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Delivered ({deliveredOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({allOrders.length})
            </TabsTrigger>
          </TabsList>

          {[
            { key: 'active', orders: activeOrders },
            { key: 'delivered', orders: deliveredOrders },
            { key: 'completed', orders: completedOrders },
            { key: 'all', orders: allOrders },
          ].map(({ key, orders: tabOrders }) => (
            <TabsContent key={key} value={key} className="space-y-4">
              {tabOrders.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No orders in this category</p>
                  </CardContent>
                </Card>
              ) : (
                tabOrders.map(order => <OrderCard key={order.id} order={order} />)
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={deliverDialogOpen} onOpenChange={setDeliverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deliver Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Delivery Message</label>
              <Textarea
                value={deliveryMessage}
                onChange={(e) => setDeliveryMessage(e.target.value)}
                placeholder="Describe the deliverables and any notes for the client..."
                className="min-h-[120px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeliverDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#0c332c]"
                onClick={() => {
                  if (selectedOrderId) {
                    deliverMutation.mutate({ orderId: selectedOrderId, message: deliveryMessage });
                  }
                }}
                disabled={deliverMutation.isPending}
              >
                {deliverMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Deliver Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
