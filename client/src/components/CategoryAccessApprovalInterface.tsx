import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  XCircle,
  User,
  Calendar,
  Users
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CategoryAccessRequest {
  id: string;
  userId: string;
  userRole: 'teacher' | 'freelancer';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function CategoryAccessApprovalInterface() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Fetch category access requests
  const { data: requests = [], isLoading, error } = useQuery<CategoryAccessRequest[]>({
    queryKey: ['/api/admin/category-access/requests'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/admin/category-access/requests', {
        headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : {}
      });
      return response.data;
    },
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes (reduced egress)
  });

  // Calculate stats
  const stats: ApprovalStats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    total: requests.length
  };

  // Filter requests based on active filter
  const filteredRequests = requests.filter(request => {
    if (activeFilter === 'all') return true;
    return request.status === activeFilter;
  });

  // Approve request mutation
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/admin/category-access/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'approve' }),
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { Authorization: `Bearer ${sessionId}` })
        }
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-access/requests'] });},
    onError: (error: any) => {},
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/admin/category-access/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'reject' }),
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { Authorization: `Bearer ${sessionId}` })
        }
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-access/requests'] });},
    onError: (error: any) => {},
  });

  const handleApprove = (requestId: string) => {
    approveRequestMutation.mutate(requestId);
  };

  const handleReject = (requestId: string) => {
    rejectRequestMutation.mutate(requestId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-primary/15 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'freelancer':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-primary">
            <XCircle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to Load Requests</h3>
            <p className="text-sm">There was an error loading the category access requests.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Granted access</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Denied access</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Category Access Requests</CardTitle>
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                data-testid={`filter-${filter}`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter !== 'all' && (
                  <Badge className="ml-2" variant="secondary">
                    {filter === 'pending' ? stats.pending : 
                     filter === 'approved' ? stats.approved : 
                     stats.rejected}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeFilter === 'all' ? '' : activeFilter} requests found
              </h3>
              <p className="text-gray-500">
                {activeFilter === 'pending' 
                  ? 'All requests have been reviewed.'
                  : `No ${activeFilter} requests to display.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.userAvatarUrl} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-lg">
                              {request.userName || 'Unknown User'}
                            </h4>
                            <Badge className={getRoleBadgeColor(request.userRole)}>
                              {request.userRole.charAt(0).toUpperCase() + request.userRole.slice(1)}
                            </Badge>
                            <Badge className={getStatusColor(request.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(request.status)}
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{request.userEmail}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </div>
                            {request.reviewedAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={approveRequestMutation.isPending}
                            data-testid={`approve-${request.id}`}
                            className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request.id)}
                            disabled={rejectRequestMutation.isPending}
                            data-testid={`reject-${request.id}`}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="text-sm text-gray-700">
                      <p>
                        <strong>{request.userRole === 'teacher' ? 'Teacher' : 'Freelancer'}</strong> is requesting access to manage product categories. 
                        {request.status === 'pending' && ' Please review and take action.'}
                        {request.status === 'approved' && ' Access has been granted - they can now manage categories.'}
                        {request.status === 'rejected' && ' Access was denied - they cannot manage categories.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
