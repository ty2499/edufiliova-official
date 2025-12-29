import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Clock, RefreshCw, Package, Loader2, 
  CheckCircle, Circle, AlertCircle, MessageSquare, FileText, Download, Star,
  FileQuestion, Send, RotateCcw, CalendarClock
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';

const ORDER_STEPS = [
  { key: 'pending_payment', label: 'Order Placed', description: 'Awaiting payment' },
  { key: 'awaiting_requirements', label: 'Awaiting Requirements', description: 'Submit project details' },
  { key: 'in_progress', label: 'In Progress', description: 'Freelancer is working' },
  { key: 'delivered', label: 'Delivered', description: 'Review the delivery' },
  { key: 'completed', label: 'Completed', description: 'Order finished' },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending Payment', className: 'bg-yellow-100 text-yellow-800' },
  awaiting_requirements: { label: 'Awaiting Requirements', className: 'bg-orange-100 text-orange-800' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  active: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Delivered', className: 'bg-purple-100 text-purple-800' },
  revision_requested: { label: 'Revision Requested', className: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  disputed: { label: 'Disputed', className: 'bg-red-100 text-red-800' },
};

export default function OrderTrackerPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/orders/:id');
  const orderId = params?.id;
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [requirementAnswers, setRequirementAnswers] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/freelancer/orders', orderId],
    queryFn: () => apiRequest(`/api/freelancer/orders/${orderId}`),
    enabled: !!orderId,
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/freelancer/orders/${orderId}/approve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/orders', orderId] });
      toast({ title: 'Order approved! Payment released to freelancer.' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to approve order', variant: 'destructive' });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/freelancer/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment || undefined }),
      }),
    onSuccess: () => {
      setHasReviewed(true);
      toast({ title: 'Review submitted! Thank you for your feedback.' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to submit review', variant: 'destructive' });
    },
  });

  const submitRequirementsMutation = useMutation({
    mutationFn: (answers: { questionId: string; text: string }[]) =>
      apiRequest(`/api/freelancer/orders/${orderId}/submit-requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/orders', orderId, 'requirements'] });
      toast({ title: 'Requirements submitted! Freelancer can now start working.' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to submit requirements', variant: 'destructive' });
    },
  });

  const requestRevisionMutation = useMutation({
    mutationFn: (reason: string) =>
      apiRequest(`/api/freelancer/orders/${orderId}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/orders', orderId] });
      setRevisionReason('');
      toast({ 
        title: 'Revision requested!', 
        description: `${data.revisionsRemaining} revision(s) remaining.`
      });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to request revision', variant: 'destructive' });
    },
  });

  const order = data?.order;
  const service = data?.service;
  const freelancer = data?.freelancer;
  const client = data?.client;
  const requirements = data?.requirements;
  const events = data?.events || [];
  const deliverables = data?.deliverables || [];

  const isClient = user?.id === order?.clientId;
  const isFreelancer = user?.id === order?.freelancerId;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to track orders</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your order details.</p>
          <Button onClick={() => window.location.href = '?page=auth'} className="bg-[#0c332c] hover:bg-[#0c332c]/90">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

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

  const effectiveStatus = order.status === 'active' ? 'in_progress' : order.status;
  const currentStepIndex = ORDER_STEPS.findIndex(s => s.key === effectiveStatus);
  const packageDetails = order.packageDetails || {};
  const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, className: 'bg-gray-100 text-gray-800' };

  const getStepIcon = (stepIndex: number) => {
    if (order.status === 'cancelled' || order.status === 'disputed') {
      return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
    if (order.status === 'revision_requested' && stepIndex === 2) {
      return <RotateCcw className="w-6 h-6 text-orange-500" />;
    }
    if (stepIndex < currentStepIndex || order.status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    if (stepIndex === currentStepIndex) {
      return <Circle className="w-6 h-6 text-[#0c332c] fill-[#0c332c]" />;
    }
    return <Circle className="w-6 h-6 text-gray-300" />;
  };

  const handleSubmitRequirements = () => {
    const questions = (requirements?.questions || []) as { id: string; text: string }[];
    const answers = questions.map(q => ({
      questionId: q.id,
      text: requirementAnswers[q.id] || '',
    }));
    submitRequirementsMutation.mutate(answers);
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
          <Badge className={statusConfig.className}>
            {statusConfig.label}
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

            {(order.status === 'awaiting_requirements') && isClient && requirements && requirements.status === 'pending' && (
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileQuestion className="w-5 h-5 text-orange-600" />
                    Submit Project Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    The freelancer needs more information to start working on your order. Please answer the questions below.
                  </p>
                  {((requirements.questions || []) as { id: string; text: string; required?: boolean }[]).map((q, idx) => (
                    <div key={q.id} className="space-y-2">
                      <label className="block text-sm font-medium">
                        {idx + 1}. {q.text}
                        {q.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Textarea
                        placeholder="Your answer..."
                        value={requirementAnswers[q.id] || ''}
                        onChange={(e) => setRequirementAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  ))}
                  <Button
                    className="w-full bg-[#0c332c] hover:bg-[#0c332c]/90"
                    onClick={handleSubmitRequirements}
                    disabled={submitRequirementsMutation.isPending}
                  >
                    {submitRequirementsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Send className="w-4 h-4 mr-2" />
                    Submit Requirements
                  </Button>
                  {order.requirementsDueAt && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <CalendarClock className="w-4 h-4" />
                      Due {formatDistanceToNow(new Date(order.requirementsDueAt), { addSuffix: true })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {requirements && requirements.status === 'submitted' && (
              <Card>
                <CardHeader>
                  <CardTitle>Submitted Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {((requirements.questions || []) as { id: string; text: string }[]).map((q, idx) => {
                    const answer = ((requirements.answers || []) as { questionId: string; text: string }[])
                      .find(a => a.questionId === q.id);
                    return (
                      <div key={q.id} className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">{idx + 1}. {q.text}</p>
                        <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{answer?.text || 'No answer provided'}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {order.requirementsText && !requirements && (
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
                        {del.isRevision && (
                          <Badge variant="outline">Revision</Badge>
                        )}
                      </div>
                      <p className="text-gray-700">{del.message}</p>
                      {del.files && del.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {del.files.map((file: any, fIdx: number) => (
                            <Button key={fIdx} variant="outline" size="sm" asChild>
                              <a href={file.url || file} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-1" />
                                {file.name || `File ${fIdx + 1}`}
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
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        className="bg-[#0c332c] hover:bg-[#0c332c]/90"
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Release Payment
                      </Button>
                    </div>
                    {order.autoReleaseAt && (
                      <p className="text-sm text-gray-500 mt-3">
                        Auto-releases {formatDistanceToNow(new Date(order.autoReleaseAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {order.status === 'delivered' && isClient && (
              <Card className="border border-orange-200">
                <CardHeader>
                  <CardTitle className="text-orange-700 flex items-center gap-2">
                    <RotateCcw className="w-5 h-5" />
                    Request Revision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Not satisfied? You have {(packageDetails.revisions || 2) - (order.revisionCount || 0)} revision(s) remaining.
                  </p>
                  <Textarea
                    placeholder="Explain what changes you need (minimum 10 characters)..."
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    rows={3}
                  />
                  <Button
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => requestRevisionMutation.mutate(revisionReason)}
                    disabled={requestRevisionMutation.isPending || revisionReason.length < 10}
                  >
                    {requestRevisionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Request Revision
                  </Button>
                </CardContent>
              </Card>
            )}

            {order.status === 'completed' && isClient && !hasReviewed && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle>Leave a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-8 h-8 transition-colors ${
                                star <= reviewRating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 hover:text-yellow-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                      <Textarea
                        placeholder="Share your experience with this freelancer..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button
                      className="w-full bg-[#0c332c] hover:bg-[#0c332c]/90"
                      onClick={() => reviewMutation.mutate()}
                      disabled={reviewMutation.isPending}
                    >
                      {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submit Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {order.status === 'completed' && isClient && hasReviewed && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="py-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Thank you for your review!</h3>
                  <p className="text-gray-600">Your feedback helps other buyers make informed decisions.</p>
                </CardContent>
              </Card>
            )}

            {events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.map((event: any) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-[#0c332c] flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{event.title}</p>
                          {event.description && (
                            <p className="text-sm text-gray-600">{event.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
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
                {order.revisionCount > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Revisions Used</span>
                    <span>{order.revisionCount} / {packageDetails.revisions || 2}</span>
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
