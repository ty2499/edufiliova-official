import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  BookMarked, 
  Lock, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Loader2,
  Info,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { CategoryManagement } from '../pages/CategoryManagement';
import { AjaxStatus } from '@/components/ui/ajax-loader';

interface CategoryAccessManagerProps {
  userRole: 'teacher' | 'freelancer';
}

interface AccessStatus {
  hasAccess: boolean;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  requestedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  canRequest?: boolean;
  isAdmin?: boolean;
}

export function CategoryAccessManager({ userRole }: CategoryAccessManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [requestMessage, setRequestMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch access status
  const { data: accessStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<AccessStatus>({
    queryKey: ['/api/category-access/status'],
    enabled: !!user?.id
  });

  // Request access mutation
  const requestAccessMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/category-access/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Access request submitted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/category-access/status'] });
      setTimeout(() => setStatusMessage(null), 5000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to submit access request';
      setStatusMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  });

  const handleRequestAccess = async () => {
    setIsSubmitting(true);
    try {
      await requestAccessMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Checking access status...</span>
        </div>
      </div>
    );
  }

  // If user has access (admin or approved), show the category management interface
  if (accessStatus?.hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold">Category Management</h2>
            {accessStatus.isAdmin && (
              <Badge variant="secondary" className="ml-2">Admin Access</Badge>
            )}
            {accessStatus.status === 'approved' && (
              <Badge variant="default" className="ml-2 bg-green-100 text-green-800">Approved Access</Badge>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetchStatus()}
            className="flex items-center gap-2"
            data-testid="button-refresh-status"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
        </div>

        {statusMessage && (
          <Alert className={statusMessage.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <AlertDescription className={statusMessage.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {statusMessage.text}
            </AlertDescription>
          </Alert>
        )}

        <CategoryManagement embedded={true} allowedRoles={[userRole]} />
      </div>
    );
  }

  // Show access request interface
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-gray-400" />
        <h2 className="text-lg sm:text-xl font-semibold">Category Management Access</h2>
      </div>

      {statusMessage && (
        <Alert className={statusMessage.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={statusMessage.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {statusMessage.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Access Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {accessStatus?.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
            {accessStatus?.status === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
            {accessStatus?.status === 'none' && <Info className="h-5 w-5 text-blue-500" />}
            Category Management Access Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {accessStatus?.status === 'none' && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  To manage shop categories, you need approval from an administrator. 
                  This ensures quality control and prevents conflicts between {userRole}s managing the same categories.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium">Why do you need category management access?</h4>
                <Textarea
                  placeholder={`Explain why you need to manage categories as a ${userRole}...`}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-request-reason"
                />
              </div>

              <Button 
                onClick={handleRequestAccess}
                disabled={isSubmitting || !requestMessage.trim()}
                className="w-full"
                data-testid="button-request-access"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <BookMarked className="mr-2 h-4 w-4" />
                    Request Category Management Access
                  </>
                )}
              </Button>
            </div>
          )}

          {accessStatus?.status === 'pending' && (
            <div className="space-y-4">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Your request for category management access is pending review. 
                  An administrator will review your request soon.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Pending Review
                  </Badge>
                </div>
                {accessStatus.requestedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Requested:</span>
                    <span>{new Date(accessStatus.requestedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => refetchStatus()}
                  className="flex items-center gap-2"
                  data-testid="button-check-status"
                >
                  <RefreshCw className="h-4 w-4" />
                  Check Status
                </Button>
              </div>
            </div>
          )}

          {accessStatus?.status === 'rejected' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Your request for category management access was rejected.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="destructive">Rejected</Badge>
                </div>
                {accessStatus.rejectedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rejected:</span>
                    <span>{new Date(accessStatus.rejectedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {accessStatus.rejectionReason && (
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Reason:</span>
                    <p className="text-sm bg-red-50 p-3 rounded border border-red-200 text-red-700">
                      {accessStatus.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  You can submit a new request if you believe this was in error.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Reset form and allow new request
                    setRequestMessage('');
                    queryClient.setQueryData(['/api/category-access/status'], {
                      ...accessStatus,
                      status: 'none'
                    });
                  }}
                  data-testid="button-new-request"
                >
                  Submit New Request
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            What You Can Do With Category Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Create and manage product categories
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Organize your products into logical groups
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Set category-specific filters and attributes
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Improve product discoverability for students
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
