import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Settings, 
  AlertTriangle, 
  CheckCircle2,
  ArrowLeft,
  Zap,
  Star
} from 'lucide-react';

interface SubscriptionData {
  hasActiveSubscription: boolean;
  subscriptionStatus: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

interface PremiumManagementProps {
  onBack?: () => void;
  onSubscribe?: () => void;
}

export default function PremiumManagement({ onBack, onSubscribe }: PremiumManagementProps) {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription-status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {fetchSubscriptionStatus(); // Refresh status
      } else {}
    } catch (error) {} finally {
      setCancelling(false);
    }
  };

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe();
    } else {
      // Default navigation to subscribe page
      window.location.href = '/subscribe';
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Default navigation back to dashboard
      window.location.href = '/learner-dashboard';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'canceled':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'past_due':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
            <span className="ml-3">Loading subscription details...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="h-8 w-8 text-yellow-500" />
              Premium Management
            </h1>
            <p className="text-gray-600">Manage your EduFiliova Premium subscription</p>
          </div>
        </div>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionData?.hasActiveSubscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(subscriptionData.subscriptionStatus)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Next billing date:</span>
                  <span>{formatDate(subscriptionData.currentPeriodEnd)}</span>
                </div>

                {subscriptionData.cancelAtPeriodEnd && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Subscription will end on {formatDate(subscriptionData.currentPeriodEnd)}</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      You will lose access to premium features after this date.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!subscriptionData.cancelAtPeriodEnd && (
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelSubscription}
                      disabled={cancelling}
                    >
                      {cancelling ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                  )}
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Subscription</h3>
                  <p className="text-gray-600">
                    Upgrade to Premium to unlock all features and get unlimited access to our platform.
                  </p>
                </div>
                <Button onClick={handleSubscribe} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Subscribe to Premium
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Premium Features
            </CardTitle>
            <CardDescription>
              Everything included with your EduFiliova Premium subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Access to all premium courses',
                'Unlimited AI course generation',
                'Priority teacher support',
                'Advanced learning analytics',
                'Download course materials',
                'No advertisements',
                'Early access to new features',
                'Premium badge and recognition'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Billing history will appear here once you have an active subscription.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
