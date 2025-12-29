import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, Package, Clock, DollarSign, Send, Loader2, 
  CheckCircle, AlertCircle, FileText, Upload, FileQuestion, Play, RotateCcw,
  Plus, Trash2
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
  requirementsStatus?: string;
  revisionCount?: number;
  deliveryDueAt: string;
  deliveredAt: string;
  completedAt: string;
  createdAt: string;
  service?: { id: string; title: string; images: string[] };
  client?: { fullName: string; profilePicture: string };
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending Payment', className: 'bg-yellow-100 text-yellow-800' },
  awaiting_requirements: { label: 'Awaiting Requirements', className: 'bg-orange-100 text-orange-800' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  active: { label: 'Active', className: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Delivered', className: 'bg-purple-100 text-purple-800' },
  revision_requested: { label: 'Revision Requested', className: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  disputed: { label: 'Disputed', className: 'bg-red-100 text-red-800' },
};

export default function FreelancerOrdersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [requirementsDialogOpen, setRequirementsDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [questions, setQuestions] = useState<{ id: string; text: string; required: boolean }[]>([
    { id: '1', text: '', required: false }
  ]);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['/api/freelancer/orders/selling'],
    queryFn: () => apiRequest('/api/freelancer/orders/selling'),
    enabled: !!user,
  });

  const deliverMutation = useMutation({
    mutationFn: ({ orderId, message }: { orderId: string; message: string }) =>
      apiRequest(`/api/freelancer/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const requestRequirementsMutation = useMutation({
    mutationFn: ({ orderId, questions }: { orderId: string; questions: { id: string; text: string; required?: boolean }[] }) =>
      apiRequest(`/api/freelancer/orders/${orderId}/request-requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/orders/selling'] });
      toast({ title: 'Requirements requested from buyer!' });
      setRequirementsDialogOpen(false);
      setQuestions([{ id: '1', text: '', required: false }]);
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to request requirements', variant: 'destructive' });
    },
  });

  const startWorkMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest(`/api/freelancer/orders/${orderId}/start-work`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/orders/selling'] });
      toast({ title: 'Work started on the order!' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to start work', variant: 'destructive' });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0c332c]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Please sign in</h3>
          <p className="text-gray-500 mb-4">You need to be logged in to view your orders</p>
          <Button onClick={() => navigate('/login')} className="bg-[#0c332c]">Sign In</Button>
        </div>
      </div>
    );
  }

  const orders: Order[] = ordersData?.orders || [];

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const activeOrders = orders.filter(o => ['active', 'in_progress', 'awaiting_requirements'].includes(o.status));
  const revisionOrders = orders.filter(o => o.status === 'revision_requested');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const allOrders = orders;

  const addQuestion = () => {
    setQuestions(prev => [...prev, { id: String(prev.length + 1), text: '', required: false }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, text } : q));
  };

  const handleRequestRequirements = () => {
    if (!selectedOrderId) return;
    const validQuestions = questions.filter(q => q.text.trim());
    if (validQuestions.length === 0) {
      toast({ title: 'Please add at least one question', variant: 'destructive' });
      return;
    }
    requestRequirementsMutation.mutate({ orderId: selectedOrderId, questions: validQuestions });
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const canDeliver = ['active', 'in_progress', 'revision_requested'].includes(order.status);
    const canRequestRequirements = order.status === 'active' && order.requirementsStatus !== 'submitted';
    const canStartWork = order.status === 'active' || order.status === 'awaiting_requirements';
    const isWaitingForRequirements = order.status === 'awaiting_requirements';

    return (
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
                {order.revisionCount && order.revisionCount > 0 && (
                  <span className="flex items-center gap-1 text-orange-600">
                    <RotateCcw className="w-4 h-4" />
                    {order.revisionCount} revision(s)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
                  View Details
                </Button>
                {canRequestRequirements && !isWaitingForRequirements && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setRequirementsDialogOpen(true);
                    }}
                  >
                    <FileQuestion className="w-4 h-4 mr-1" />
                    Request Info
                  </Button>
                )}
                {canStartWork && !isWaitingForRequirements && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startWorkMutation.mutate(order.id)}
                    disabled={startWorkMutation.isPending}
                  >
                    {startWorkMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-1" />
                    )}
                    Start Work
                  </Button>
                )}
                {canDeliver && (
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
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/?page=freelancer-dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-500">Manage orders from your clients</p>
          </div>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="active">
              Active ({activeOrders.length})
            </TabsTrigger>
            {revisionOrders.length > 0 && (
              <TabsTrigger value="revisions" className="text-orange-600">
                Revisions ({revisionOrders.length})
              </TabsTrigger>
            )}
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

          <TabsContent value="active" className="space-y-4">
            {activeOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No active orders</p>
                </CardContent>
              </Card>
            ) : (
              activeOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          {revisionOrders.length > 0 && (
            <TabsContent value="revisions" className="space-y-4">
              {revisionOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </TabsContent>
          )}

          <TabsContent value="delivered" className="space-y-4">
            {deliveredOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No delivered orders</p>
                </CardContent>
              </Card>
            ) : (
              deliveredOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No completed orders</p>
                </CardContent>
              </Card>
            ) : (
              completedOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                </CardContent>
              </Card>
            ) : (
              allOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>
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

      <Dialog open={requirementsDialogOpen} onOpenChange={setRequirementsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Project Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Ask the buyer questions to better understand their project requirements.
            </p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {questions.map((q, idx) => (
                <div key={q.id} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Question ${idx + 1}...`}
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, e.target.value)}
                    />
                  </div>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(q.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={addQuestion} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRequirementsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#0c332c]"
                onClick={handleRequestRequirements}
                disabled={requestRequirementsMutation.isPending}
              >
                {requestRequirementsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send to Buyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
