import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Check,
  Loader2,
  AlertCircle,
  XCircle,
  Crown,
  Calendar,
  DollarSign
} from 'lucide-react';
import { GRADE_SUBSCRIPTION_PLANS, getSubscriptionTierFromGrade } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getStripePromise } from '@/lib/stripe';

interface PaymentMethod {
  id: string;
  type: string;
  displayName: string;
  lastFour: string;
  expiryDate: string;
  cardholderName: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

function AddPaymentMethodForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        setError(error.message || 'Failed to verify card details');
        console.error('Payment method error:', error.message);
      } else {
        // Sync payment method to database
        const syncResponse = await apiRequest('/api/payment-methods/sync', { method: 'POST' });
        
        if (syncResponse.error) {
          setError(syncResponse.error);
        } else {
          onSuccess();
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || error.error || 'Failed to add payment method. Please try again.';
      setError(errorMessage);
      console.error('Failed to add payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-add-payment">
      {error && (
        <Alert variant="destructive" data-testid="alert-payment-error">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <PaymentElement />
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid="button-cancel-payment"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="bg-primary hover:bg-primary"
          data-testid="button-save-payment"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Save Payment Method
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function AddPaymentMethodDialog({ open, onOpenChange, stripePromise }: { open: boolean; onOpenChange: (open: boolean) => void; stripePromise: Promise<Stripe | null> | null }) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setClientSecret('');
      setLoading(true);
      setError(false);
      
      apiRequest('/api/payment-methods/setup-intent', { method: 'POST' })
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            setError(true);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to create setup intent:', err);
          setError(true);
          setLoading(false);
        });
    }
  }, [open]);

  const handleSuccess = () => {
    setClientSecret('');
    queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setClientSecret('');
    onOpenChange(false);
  };

  if (!stripePromise) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent data-testid="dialog-payment-disabled">
          <DialogHeader>
            <DialogTitle>Payment Methods Unavailable</DialogTitle>
            <DialogDescription>
              Payment processing not configured. Please contact support.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-add-payment">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a credit or debit card to use for future payments. Your card will be securely stored.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center" data-testid="loading-setup-intent">
            <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Preparing payment form...</p>
          </div>
        ) : error || !clientSecret ? (
          <div className="py-12 text-center" data-testid="error-setup-intent">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Failed to load payment form. Please try again.</p>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-error"
            >
              Close
            </Button>
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <AddPaymentMethodForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function BillingPage() {
  const { user, profile } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [operationError, setOperationError] = useState<string>('');
  const [cancelError, setCancelError] = useState<string>('');
  const [cancelSuccess, setCancelSuccess] = useState<string>('');
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  const { data: paymentMethods, isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    enabled: !!user,
  });
  
  const hasActiveSubscription = profile && ['elementary', 'high_school', 'college_university'].includes(profile?.subscriptionTier || '');
  
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      setCancelError('');
      setCancelSuccess('');
      return await apiRequest('/api/cancel-subscription', { method: 'POST' });
    },
    onSuccess: (data) => {
      if (data.success) {
        setCancelSuccess(data.message || 'Your subscription has been cancelled and will end at the end of the current billing period.');
        queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      } else {
        setCancelError(data.error || 'Failed to cancel subscription');
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error || 'Failed to cancel subscription';
      setCancelError(errorMessage);
      console.error('Failed to cancel subscription:', error);
    },
  });
  
  const handleCancelSubscription = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
    setShowCancelDialog(false);
  };

  const setDefaultMutation = useMutation({
    mutationFn: async (methodId: string) => {
      setOperationError('');
      return await apiRequest(`/api/payment-methods/${methodId}/set-default`, { method: 'PUT' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error || 'Failed to update default payment method';
      setOperationError(errorMessage);
      console.error('Failed to update default payment method:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (methodId: string) => {
      setOperationError('');
      return await apiRequest(`/api/payment-methods/${methodId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error || 'Failed to remove payment method';
      setOperationError(errorMessage);
      console.error('Failed to remove payment method:', error);
    },
  });

  const handleSetDefault = (methodId: string) => {
    setDefaultMutation.mutate(methodId);
  };

  const handleDelete = (methodId: string) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      deleteMutation.mutate(methodId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
        <p className="text-gray-600 mt-1">Manage your payment methods and billing information</p>
      </div>

      {operationError && (
        <Alert variant="destructive" data-testid="alert-operation-error">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{operationError}</AlertDescription>
        </Alert>
      )}

      {cancelSuccess && (
        <Alert data-testid="alert-cancel-success" className="border-green-600 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">{cancelSuccess}</AlertDescription>
        </Alert>
      )}

      {cancelError && (
        <Alert variant="destructive" data-testid="alert-cancel-error">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{cancelError}</AlertDescription>
        </Alert>
      )}

      {/* Subscription Management Card */}
      {hasActiveSubscription && (
        <Card data-testid="card-subscription-management" className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle>Manage Your Plan</CardTitle>
                  <CardDescription className="mt-1">
                    Your current subscription and billing details
                  </CardDescription>
                </div>
              </div>
              {cancelSuccess ? (
                <Badge className="bg-primary text-white" data-testid="badge-cancelled">
                  <XCircle className="w-3 h-3 mr-1" />
                  Cancelled
                </Badge>
              ) : (
                <Badge className="bg-primary text-white">
                  <Check className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile && profile.grade && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current Plan</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {GRADE_SUBSCRIPTION_PLANS[getSubscriptionTierFromGrade(profile.grade)]?.name || 'Premium Plan'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Billing</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {cancelSuccess 
                        ? (profile.planExpiry ? `Expires ${new Date(profile.planExpiry).toLocaleDateString()}` : 'Cancelled')
                        : (profile.planExpiry ? `Renews ${new Date(profile.planExpiry).toLocaleDateString()}` : 'Active')
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {!cancelSuccess && (
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscriptionMutation.isPending}
                  data-testid="button-cancel-subscription"
                >
                  {cancelSubscriptionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Plan
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Cancelling will stop your subscription at the end of the current billing period. You'll keep access until then.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-payment-methods">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription className="mt-2">
                Manage your saved payment methods. When you make a purchase, your default card will be used automatically.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center" data-testid="loading-payment-methods">
              <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading payment methods...</p>
            </div>
          ) : !paymentMethods || paymentMethods.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg" data-testid="empty-payment-methods">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Methods</h3>
              <p className="text-gray-600 mb-6">
                Add a payment method to enable additional resource usage.
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-primary hover:bg-primary text-[#ffffff]"
                data-testid="button-add-first-payment"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <Card key={method.id} className="border-2" data-testid={`payment-method-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900" data-testid={`text-card-name-${index}`}>
                              {method.displayName}
                            </h3>
                            {method.isDefault && (
                              <Badge className="bg-[hsl(var(--success))] text-black" data-testid={`badge-default-${index}`}>
                                <Check className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1" data-testid={`text-card-details-${index}`}>
                            •••• •••• •••• {method.lastFour} • Expires {method.expiryDate}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {method.cardholderName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                            disabled={setDefaultMutation.isPending}
                            data-testid={`button-set-default-${index}`}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(method.id)}
                          disabled={deleteMutation.isPending}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          data-testid={`button-delete-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {paymentMethods && paymentMethods.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>When you purchase something, your card will be charged automatically</li>
                    <li>Your default payment method is used for all transactions</li>
                    <li>You can change or remove payment methods at any time</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddPaymentMethodDialog open={showAddDialog} onOpenChange={setShowAddDialog} stripePromise={stripePromise} />

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent data-testid="dialog-cancel-subscription">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Cancel Subscription?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to cancel your subscription? This action will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Stop your subscription at the end of your current billing period</li>
                <li>You'll keep access to all features until {profile?.planExpiry ? new Date(profile.planExpiry).toLocaleDateString() : 'the end of your billing period'}</li>
                <li>After that, you'll lose access to premium features</li>
              </ul>
              <p className="text-sm font-medium text-gray-900 mt-3">
                You can reactivate your subscription anytime.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-no">
              Keep My Plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelSubscription}
              className="bg-primary hover:bg-red-700 text-white"
              data-testid="button-cancel-dialog-yes"
            >
              Yes, Cancel Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
