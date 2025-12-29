import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Clock, AlertCircle, DollarSign, TrendingUp, Users, CreditCard, RefreshCw, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { CheckmarkIcon } from '@/components/ui/checkmark-icon';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

interface AdminTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'credit' | 'debit';
  amount: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  method?: 'bank' | 'paypal' | 'crypto';
  description: string;
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
}

interface AdminPayoutAccount {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'bank' | 'paypal' | 'crypto';
  accountName: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
  verifiedAt?: string;
  details?: any;
}

interface AdminStats {
  totalTransactions: number;
  pendingPayouts: number;
  totalVolume: number;
  activeUsers: number;
  totalRevenue: number;
  platformCommission: number;
  totalWalletBalance?: number;
  totalPlatformRevenue?: number;
  walletsByRole?: {
    student: number;
    freelancer: number;
    teacher: number;
    admin: number;
    general: number;
    other: number;
  };
  userWallets?: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    availableBalance: number;
    totalEarnings: number;
    walletType?: string;
  }>;
  freelancerEarnings: number;
  teacherEarnings: number;
  topFreelancers: Array<{
    userId: string;
    name: string;
    email: string;
    totalEarnings: number;
    transactionCount: number;
  }>;
  recentTransactions: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    type: 'credit' | 'debit';
    amount: string;
    status: string;
    method?: string;
    description: string;
    createdAt: string;
  }>;
}

export default function AdminTransactionPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'transactions' | 'accounts' | 'plans'>('transactions');
  const [filter, setFilter] = useState({ status: 'all', method: 'all', userId: '' });
  const [accountFilter, setAccountFilter] = useState({ status: 'pending' });
  const [page, setPage] = useState(1);
  const [accountPage, setAccountPage] = useState(1);
  const [topEarnersPage, setTopEarnersPage] = useState(1);
  const [recentTransactionsPage, setRecentTransactionsPage] = useState(1);
  const [walletUsersPage, setWalletUsersPage] = useState(1);
  const [recentSubscriptionsPage, setRecentSubscriptionsPage] = useState(1);
  const [recentPaymentsPage, setRecentPaymentsPage] = useState(1);
  const [planRoleFilter, setPlanRoleFilter] = useState<'all' | 'student' | 'freelancer' | 'general'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<AdminTransaction | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AdminPayoutAccount | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showAccountApprovalDialog, setShowAccountApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'decline'>('approve');
  const [accountApprovalAction, setAccountApprovalAction] = useState<'approve' | 'decline'>('approve');

  // Fetch admin transaction statistics
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['admin-transaction-stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/financial-stats');
      return response.stats;
    },
  });

  // Fetch admin transactions
  const { data: transactionData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-transactions', filter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '5',
        ...(filter.status !== 'all' && { status: filter.status }),
        ...(filter.method !== 'all' && { method: filter.method }),
        ...(filter.userId && { userId: filter.userId }),
      });
      return apiRequest(`/api/admin/transactions-test?${params}`);
    },
    enabled: activeTab === 'transactions',
  });

  // Fetch admin payout accounts
  const { data: accountData, isLoading: accountsLoading } = useQuery({
    queryKey: ['admin-payout-accounts', accountFilter, accountPage],
    queryFn: () => {
      const params = new URLSearchParams({
        page: accountPage.toString(),
        limit: '10',
        status: accountFilter.status,
      });
      return apiRequest(`/api/admin/payout-accounts?${params}`);
    },
    enabled: activeTab === 'accounts',
  });

  // Fetch plan statistics
  const { data: planData, isLoading: plansLoading } = useQuery({
    queryKey: ['admin-plan-stats'],
    queryFn: () => apiRequest('/api/admin/plan-stats'),
    enabled: activeTab === 'plans',
  });

  // Reset Top Earners page when data changes
  useEffect(() => {
    if (stats?.topFreelancers) {
      const totalPages = Math.ceil(stats.topFreelancers.length / 5);
      if (topEarnersPage > totalPages && totalPages > 0) {
        setTopEarnersPage(totalPages);
      }
    }
  }, [stats?.topFreelancers?.length, topEarnersPage]);

  // Reset Recent Transactions page when data changes
  useEffect(() => {
    if (stats?.recentTransactions) {
      const totalPages = Math.ceil(stats.recentTransactions.length / 5);
      if (recentTransactionsPage > totalPages && totalPages > 0) {
        setRecentTransactionsPage(totalPages);
      }
    }
  }, [stats?.recentTransactions?.length, recentTransactionsPage]);

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: ({ transactionId, action, notes }: { 
      transactionId: string; 
      action: 'approve' | 'decline'; 
      notes: string;
    }) => 
      apiRequest(`/api/admin/transactions/${transactionId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          adminNotes: notes,
          adminId: user?.userId || user?.id || 'ADMIN00001',
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    onSuccess: () => {setShowApprovalDialog(false);
      setSelectedTransaction(null);
      setAdminNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transaction-stats'] });
    },
    onError: (error: any) => {},
  });

  // Process payout account mutation
  const processAccountMutation = useMutation({
    mutationFn: async ({ accountId, action }: { 
      accountId: string; 
      action: 'approve' | 'decline'; 
    }) => {
      console.log('🔵 Mutation function called with:', { accountId, action });
      const url = `/api/admin/payout-accounts/${accountId}/verify`;
      const payload = {
        method: 'PATCH',
        body: JSON.stringify({
          action,
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      console.log('🔵 Making API request to:', url);
      console.log('🔵 With payload:', payload);
      
      try {
        const response = await apiRequest(url, payload);
        console.log('🔵 API response received:', response);
        return response;
      } catch (error) {
        console.error('🔵 API request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🔵 Mutation succeeded:', data);setShowAccountApprovalDialog(false);
      setSelectedAccount(null);
      queryClient.invalidateQueries({ queryKey: ['admin-payout-accounts'] });
    },
    onError: (error: any) => {
      console.error('🔵 Mutation failed:', error);setShowAccountApprovalDialog(false);
    },
  });

  // Sync earnings from existing orders
  const syncEarningsMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/sync-earnings', { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
    },
    onError: (error: any) => {},
  });

  const handleProcessPayout = (transaction: AdminTransaction, action: 'approve' | 'decline') => {
    setSelectedTransaction(transaction);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const handleProcessAccount = (account: AdminPayoutAccount, action: 'approve' | 'decline') => {
    setSelectedAccount(account);
    setAccountApprovalAction(action);
    setShowAccountApprovalDialog(true);
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'paypal':
        return <div className="w-6 h-6 bg-primary rounded flex items-center justify-center"><span className="text-white text-xs font-bold">PP</span></div>;
      case 'crypto':
        return <div className="w-6 h-6 bg-primary rounded flex items-center justify-center"><span className="text-white text-xs font-bold">₿</span></div>;
      default:
        return <CreditCard className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'outline',
    } as const;

    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      completed: <CheckmarkIcon size="sm" className="mr-1" />,
      failed: <AlertCircle className="w-3 h-3 mr-1" />,
      cancelled: <AlertCircle className="w-3 h-3 mr-1" />,
    };

    if (status === 'completed') {
      return (
        <Badge className="bg-primary text-white">
          {icons[status as keyof typeof icons]}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  return (
    <div className="space-y-6" data-testid="admin-transaction-panel">
      {/* Sync Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Tracking System</CardTitle>
              <CardDescription>
                Automatic transaction recording with 65/35 commission split (creators 65%, platform 35%)
              </CardDescription>
            </div>
            <Button
              onClick={() => syncEarningsMutation.mutate()}
              disabled={syncEarningsMutation.isPending}
              data-testid="button-sync-earnings"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncEarningsMutation.isPending ? 'animate-spin' : ''}`} />
              {syncEarningsMutation.isPending ? 'Syncing...' : 'Sync Historical Orders'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-transactions">
              {stats?.totalTransactions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="pending-payouts">
              {stats?.pendingPayouts || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-volume">
              {stats ? formatCurrency(stats.totalVolume) : '$0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="active-users">
              {stats?.activeUsers || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-revenue">
              {stats ? formatCurrency(stats.totalRevenue) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From all completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Commission (35%)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="platform-commission">
              {stats ? formatCurrency(stats.platformCommission) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Commission from sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Wallet Balances</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="wallet-balances">
              {stats?.totalWalletBalance ? formatCurrency(stats.totalWalletBalance) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Money in user wallets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platform Money</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-platform-revenue">
              {stats?.totalPlatformRevenue ? formatCurrency(stats.totalPlatformRevenue) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Commission + Wallet balances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freelancer Earnings (65%)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="freelancer-earnings">
              {stats ? formatCurrency(stats.freelancerEarnings) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total paid to freelancers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teacher Earnings (65%)</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="teacher-earnings">
              {stats ? formatCurrency(stats.teacherEarnings) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total paid to teachers</p>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Balances by Role */}
      <Card>
        <CardHeader>
          <CardTitle>User Wallet Balances by Role</CardTitle>
          <CardDescription>Money held in user wallets (Platform's money)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats?.walletsByRole && (
              <>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs font-medium text-blue-900 mb-1">Students</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.walletsByRole.student)}</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <p className="text-xs font-medium text-purple-900 mb-1">Freelancers</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.walletsByRole.freelancer)}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-orange-200">
                  <p className="text-xs font-medium text-orange-900 mb-1">Teachers</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.walletsByRole.teacher)}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs font-medium text-blue-900 mb-1">General Users</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.walletsByRole.general)}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-medium text-gray-900 mb-1">Admins</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.walletsByRole.admin)}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-medium text-gray-900 mb-1">Other</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.walletsByRole.other)}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed User Wallet List */}
      <Card>
        <CardHeader>
          <CardTitle>Users with Wallet Balances</CardTitle>
          <CardDescription>All users who have money in their wallets (Top 100)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.userWallets && stats.userWallets.length > 0 ? (
              <>
                {stats.userWallets.slice((walletUsersPage - 1) * 5, walletUsersPage * 5).map((wallet) => (
                  <div key={wallet.userId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{wallet.userName}</p>
                        <Badge variant="outline" className="text-xs">
                          {wallet.userRole || 'user'}
                        </Badge>
                        <Badge 
                          variant={wallet.walletType === 'shop' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {wallet.walletType === 'shop' ? 'Shop Wallet' : 'Earnings Wallet'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{wallet.userEmail}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-sm">{formatCurrency(wallet.availableBalance)}</p>
                      {wallet.walletType === 'earnings' && (
                        <p className="text-xs text-muted-foreground">Lifetime: {formatCurrency(wallet.totalEarnings)}</p>
                      )}
                    </div>
                  </div>
                ))}
                {stats.userWallets.length > 5 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((walletUsersPage - 1) * 5) + 1} to {Math.min(walletUsersPage * 5, stats.userWallets.length)} of {stats.userWallets.length} users
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWalletUsersPage(p => Math.max(1, p - 1))}
                        disabled={walletUsersPage === 1}
                        data-testid="button-wallet-users-prev"
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWalletUsersPage(p => p + 1)}
                        disabled={walletUsersPage >= Math.ceil(stats.userWallets.length / 5)}
                        data-testid="button-wallet-users-next"
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">No users with wallet balances</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Earners & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Earners */}
        <Card>
          <CardHeader>
            <CardTitle>Top Earners</CardTitle>
            <CardDescription>Freelancers with highest earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topFreelancers && stats.topFreelancers.length > 0 ? (
                <>
                  {stats.topFreelancers.slice((topEarnersPage - 1) * 5, topEarnersPage * 5).map((freelancer, index) => (
                    <div key={freelancer.userId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm">
                          {(topEarnersPage - 1) * 5 + index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{freelancer.name}</p>
                          <p className="text-xs text-muted-foreground">{freelancer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(freelancer.totalEarnings)}</p>
                        <p className="text-xs text-muted-foreground">{freelancer.transactionCount} transactions</p>
                      </div>
                    </div>
                  ))}
                  {stats.topFreelancers.length > 5 && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {((topEarnersPage - 1) * 5) + 1} to {Math.min(topEarnersPage * 5, stats.topFreelancers.length)} of {stats.topFreelancers.length} earners
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTopEarnersPage(p => Math.max(1, p - 1))}
                          disabled={topEarnersPage === 1}
                          data-testid="button-top-earners-prev"
                          className="flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTopEarnersPage(p => p + 1)}
                          disabled={topEarnersPage >= Math.ceil(stats.topFreelancers.length / 5)}
                          data-testid="button-top-earners-next"
                          className="flex items-center gap-1"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">No earnings data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                <>
                  {stats.recentTransactions.slice((recentTransactionsPage - 1) * 5, recentTransactionsPage * 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-all duration-300">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{transaction.userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{transaction.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-sm">
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {stats.recentTransactions.length > 5 && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {((recentTransactionsPage - 1) * 5) + 1} to {Math.min(recentTransactionsPage * 5, stats.recentTransactions.length)} of {stats.recentTransactions.length} transactions
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRecentTransactionsPage(p => Math.max(1, p - 1))}
                          disabled={recentTransactionsPage === 1}
                          data-testid="button-recent-transactions-prev"
                          className="flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRecentTransactionsPage(p => p + 1)}
                          disabled={recentTransactionsPage >= Math.ceil(stats.recentTransactions.length / 5)}
                          data-testid="button-recent-transactions-next"
                          className="flex items-center gap-1"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === 'transactions' ? 'default' : 'outline'}
          onClick={() => setActiveTab('transactions')}
          className="flex items-center gap-2"
        >
          <DollarSign className="w-4 h-4" />
          Transactions
        </Button>
        <Button
          variant={activeTab === 'accounts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('accounts')}
          className="flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Payment Methods
        </Button>
        <Button
          variant={activeTab === 'plans' ? 'default' : 'outline'}
          onClick={() => setActiveTab('plans')}
          className="flex items-center gap-2"
          data-testid="button-plans-tab"
        >
          <TrendingUp className="w-4 h-4" />
          Plan Purchases
        </Button>
      </div>

      {/* Transactions Management */}
      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Management</CardTitle>
            <CardDescription>Review and process user payouts and transactions</CardDescription>
          </CardHeader>
          <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.method} onValueChange={(value) => setFilter(prev => ({ ...prev, method: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search by User ID"
              value={filter.userId}
              onChange={(e) => setFilter(prev => ({ ...prev, userId: e.target.value }))}
              className="w-60"
              data-testid="input-user-search"
            />
          </div>

          {/* Transactions Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : transactionData?.transactions?.length > 0 ? (
                transactionData.transactions.map((transaction: AdminTransaction) => (
                  <TableRow key={transaction.id} data-testid={`admin-transaction-${transaction.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.userName}</p>
                        <p className="text-sm text-muted-foreground">{transaction.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                        {transaction.type === 'credit' ? '+' : '-'} {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {transaction.method ? (
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(transaction.method)}
                          <div>
                            <p className="font-medium capitalize">{transaction.method}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.method === 'bank' ? 'Bank Transfer' : 
                               transaction.method === 'paypal' ? 'PayPal' : 
                               transaction.method === 'crypto' ? 'Cryptocurrency' : 'Payment'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No method</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <div>
                        <p>{new Date(transaction.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.status === 'pending' && transaction.type === 'debit' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleProcessPayout(transaction, 'approve')}
                            className="bg-primary hover:bg-primary transition-all duration-300"
                            data-testid={`button-approve-${transaction.id}`}
                          >
                            <CheckmarkIcon size="sm" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleProcessPayout(transaction, 'decline')}
                            data-testid={`button-decline-${transaction.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No transactions found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {transactionData?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((transactionData.pagination.page - 1) * transactionData.pagination.limit) + 1} to{' '}
                {Math.min(transactionData.pagination.page * transactionData.pagination.limit, transactionData.pagination.total)} of{' '}
                {transactionData.pagination.total} transactions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1"
                  data-testid="button-transactions-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= transactionData.pagination.totalPages}
                  className="flex items-center gap-1"
                  data-testid="button-transactions-next"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Payment Methods Management */}
      {activeTab === 'accounts' && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods Management</CardTitle>
            <CardDescription>Review and verify user payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Account Filters */}
            <div className="flex gap-4 mb-6">
              <Select value={accountFilter.status} onValueChange={(value) => setAccountFilter({ status: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Methods Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : accountData?.accounts?.length > 0 ? (
                  accountData.accounts.map((account: AdminPayoutAccount) => (
                    <TableRow key={account.id} data-testid={`admin-account-${account.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{account.userName}</p>
                          <p className="text-sm text-muted-foreground">{account.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getPaymentMethodIcon(account.type)}
                          <div>
                            <p className="font-medium capitalize">{account.type}</p>
                            {account.details && (
                              <p className="text-sm text-muted-foreground">
                                {account.type === 'bank' ? 'Bank Account' : 
                                 account.type === 'paypal' ? 'PayPal Email' : 
                                 account.type === 'crypto' ? `${account.details.cryptoType?.toUpperCase() || 'Crypto'} Wallet` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{account.accountName}</p>
                      </TableCell>
                      <TableCell>
                        {account.isVerified ? (
                          <Badge className="bg-primary text-white">
                            <CheckmarkIcon size="sm" className="mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-primary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{new Date(account.createdAt).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(account.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!account.isVerified && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleProcessAccount(account, 'approve')}
                              className="bg-primary hover:bg-primary transition-all duration-300"
                              data-testid={`button-approve-account-${account.id}`}
                            >
                              <CheckmarkIcon size="sm" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleProcessAccount(account, 'decline')}
                              data-testid={`button-decline-account-${account.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No payment methods found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Account Pagination */}
            {accountData?.pagination && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((accountData.pagination.page - 1) * accountData.pagination.limit) + 1} to{' '}
                  {Math.min(accountData.pagination.page * accountData.pagination.limit, accountData.pagination.total)} of{' '}
                  {accountData.pagination.total} payment methods
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAccountPage(p => Math.max(1, p - 1))}
                    disabled={accountPage === 1}
                    className="flex items-center gap-1"
                    data-testid="button-accounts-prev"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAccountPage(p => p + 1)}
                    disabled={accountPage >= accountData.pagination.totalPages}
                    className="flex items-center gap-1"
                    data-testid="button-accounts-next"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plans Management */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Plan Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="total-subscriptions">
                  {planData?.stats?.totalSubscriptions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="active-subscriptions">
                  {planData?.stats?.activeSubscriptions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue from Plans</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="plan-revenue">
                  {planData?.stats ? formatCurrency(planData.stats.totalRevenue) : '$0.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by User Type */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Revenue by User Type</CardTitle>
              <CardDescription>Money earned from subscription plans by user category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs font-medium text-blue-900 mb-1">Students</p>
                  <p className="text-xl font-bold">{planData?.stats?.revenueByRole ? formatCurrency(planData.stats.revenueByRole.student) : '$0.00'}</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <p className="text-xs font-medium text-purple-900 mb-1">Freelancers</p>
                  <p className="text-xl font-bold">{planData?.stats?.revenueByRole ? formatCurrency(planData.stats.revenueByRole.freelancer) : '$0.00'}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-orange-200">
                  <p className="text-xs font-medium text-orange-900 mb-1">Teachers</p>
                  <p className="text-xl font-bold">{planData?.stats?.revenueByRole ? formatCurrency(planData.stats.revenueByRole.teacher) : '$0.00'}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs font-medium text-green-900 mb-1">General Users</p>
                  <p className="text-xl font-bold">{planData?.stats?.revenueByRole ? formatCurrency(planData.stats.revenueByRole.general) : '$0.00'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Breakdown</CardTitle>
              <CardDescription>Subscription distribution by plan tier and user type</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter Tabs */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={planRoleFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setPlanRoleFilter('all')}
                  size="sm"
                  data-testid="button-plan-filter-all"
                >
                  All Plans
                </Button>
                <Button
                  variant={planRoleFilter === 'student' ? 'default' : 'outline'}
                  onClick={() => setPlanRoleFilter('student')}
                  size="sm"
                  data-testid="button-plan-filter-students"
                >
                  Students
                </Button>
                <Button
                  variant={planRoleFilter === 'freelancer' ? 'default' : 'outline'}
                  onClick={() => setPlanRoleFilter('freelancer')}
                  size="sm"
                  data-testid="button-plan-filter-freelancers"
                >
                  Freelancers
                </Button>
                <Button
                  variant={planRoleFilter === 'general' ? 'default' : 'outline'}
                  onClick={() => setPlanRoleFilter('general')}
                  size="sm"
                  data-testid="button-plan-filter-customers"
                >
                  Customers
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {planData?.stats?.planStats && planData.stats.planStats.length > 0 ? (
                  planData.stats.planStats.map((plan: any) => (
                    <div key={plan.planName} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-xs font-medium text-gray-900 mb-1">{plan.planName}</p>
                      {plan.gradeTier && (
                        <p className="text-xs text-muted-foreground mb-2 capitalize">{plan.gradeTier.replace('_', ' ')}</p>
                      )}
                      <p className="text-xl font-bold">{plan.count} total</p>
                      <p className="text-sm text-blue-600">{plan.activeCount} active</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground col-span-3">No plan data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Subscriptions</CardTitle>
              <CardDescription>Latest subscription purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Purchased</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plansLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : planData?.stats?.recentSubscriptions && planData.stats.recentSubscriptions.length > 0 ? (
                    <>
                      {planData.stats.recentSubscriptions
                        .filter((sub: any) => planRoleFilter === 'all' || sub.userRole === planRoleFilter)
                        .slice((recentSubscriptionsPage - 1) * 5, recentSubscriptionsPage * 5)
                        .map((sub: any) => (
                        <TableRow key={sub.id} data-testid={`subscription-${sub.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.userName}</p>
                              <p className="text-sm text-muted-foreground">{sub.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.planName}</p>
                              {sub.gradeTier && (
                                <p className="text-xs text-muted-foreground capitalize">{sub.gradeTier.replace('_', ' ')}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={sub.status === 'approved' ? 'bg-primary text-white' : ''}>
                              {sub.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{new Date(sub.createdAt).toLocaleDateString()}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(sub.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No subscriptions found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {planData?.stats?.recentSubscriptions && planData.stats.recentSubscriptions.filter((sub: any) => planRoleFilter === 'all' || sub.userRole === planRoleFilter).length > 5 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((recentSubscriptionsPage - 1) * 5) + 1} to {Math.min(recentSubscriptionsPage * 5, planData.stats.recentSubscriptions.filter((sub: any) => planRoleFilter === 'all' || sub.userRole === planRoleFilter).length)} of {planData.stats.recentSubscriptions.filter((sub: any) => planRoleFilter === 'all' || sub.userRole === planRoleFilter).length} subscriptions
                    {planRoleFilter !== 'all' && ` (${planRoleFilter}s)`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecentSubscriptionsPage(p => Math.max(1, p - 1))}
                      disabled={recentSubscriptionsPage === 1}
                      data-testid="button-recent-subscriptions-prev"
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecentSubscriptionsPage(p => p + 1)}
                      disabled={recentSubscriptionsPage >= Math.ceil(planData.stats.recentSubscriptions.filter((sub: any) => planRoleFilter === 'all' || sub.userRole === planRoleFilter).length / 5)}
                      data-testid="button-recent-subscriptions-next"
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest subscription payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan Type</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plansLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : planData?.stats?.recentPayments && planData.stats.recentPayments.length > 0 ? (
                    <>
                      {planData.stats.recentPayments
                        .slice((recentPaymentsPage - 1) * 5, recentPaymentsPage * 5)
                        .map((payment: any) => (
                        <TableRow key={payment.id} data-testid={`payment-${payment.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.userName}</p>
                              <p className="text-sm text-muted-foreground">{payment.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={payment.status === 'succeeded' ? 'bg-primary text-white' : ''}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.planType || '-'}</TableCell>
                          <TableCell>
                            <div>
                              <p>{new Date(payment.createdAt).toLocaleDateString()}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(payment.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No payments found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {planData?.stats?.recentPayments && planData.stats.recentPayments.length > 5 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((recentPaymentsPage - 1) * 5) + 1} to {Math.min(recentPaymentsPage * 5, planData.stats.recentPayments.length)} of {planData.stats.recentPayments.length} payments
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecentPaymentsPage(p => Math.max(1, p - 1))}
                      disabled={recentPaymentsPage === 1}
                      data-testid="button-recent-payments-prev"
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecentPaymentsPage(p => p + 1)}
                      disabled={recentPaymentsPage >= Math.ceil(planData.stats.recentPayments.length / 5)}
                      data-testid="button-recent-payments-next"
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account Approval Dialog */}
      <Dialog open={showAccountApprovalDialog} onOpenChange={setShowAccountApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {accountApprovalAction === 'approve' ? 'Approve Payment Method' : 'Decline Payment Method'}
            </DialogTitle>
            <DialogDescription>
              {accountApprovalAction === 'approve' 
                ? 'This will verify the payment method for payouts.'
                : 'This will decline and remove the payment method.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Payment Method Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>User:</strong> {selectedAccount.userName} ({selectedAccount.userEmail})</p>
                  <p><strong>Account Name:</strong> {selectedAccount.accountName}</p>
                  <p><strong>Type:</strong> {selectedAccount.type.charAt(0).toUpperCase() + selectedAccount.type.slice(1)}</p>
                  {selectedAccount.details && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="font-medium mb-2">Account Information:</p>
                      {selectedAccount.type === 'bank' && (
                        <div className="space-y-1 text-xs">
                          <p><strong>Account Holder:</strong> {selectedAccount.details.accountHolderName}</p>
                          <p><strong>Bank:</strong> {selectedAccount.details.bankName}</p>
                          <p><strong>Account Number:</strong> ****{selectedAccount.details.accountNumber?.slice(-4)}</p>
                          <p><strong>Routing:</strong> {selectedAccount.details.routingNumber}</p>
                          {selectedAccount.details.swiftCode && (
                            <p><strong>SWIFT:</strong> {selectedAccount.details.swiftCode}</p>
                          )}
                        </div>
                      )}
                      {selectedAccount.type === 'paypal' && (
                        <p className="text-xs"><strong>Email:</strong> {selectedAccount.details.paypalEmail}</p>
                      )}
                      {selectedAccount.type === 'crypto' && (
                        <div className="space-y-1 text-xs">
                          <p><strong>Type:</strong> {selectedAccount.details.cryptoType?.toUpperCase()}</p>
                          <p><strong>Address:</strong> {selectedAccount.details.walletAddress}</p>
                          {selectedAccount.details.walletLabel && (
                            <p><strong>Label:</strong> {selectedAccount.details.walletLabel}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAccountApprovalDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log('🔴 Button clicked - Action:', accountApprovalAction);
                    console.log('🔴 Selected Account:', selectedAccount);
                    console.log('🔴 Mutation pending:', processAccountMutation.isPending);
                    if (selectedAccount) {
                      console.log('🔴 About to call mutate with:', {
                        accountId: selectedAccount.id,
                        action: accountApprovalAction,
                      });
                      try {
                        processAccountMutation.mutate({
                          accountId: selectedAccount.id,
                          action: accountApprovalAction,
                        });
                        console.log('🔴 Mutate called successfully');
                      } catch (error) {
                        console.error('🔴 Error calling mutate:', error);
                      }
                    } else {
                      console.log('🔴 No selected account');
                    }
                  }}
                  disabled={processAccountMutation.isPending}
                  className={accountApprovalAction === 'approve' ? 'bg-primary hover:bg-primary' : ''}
                  data-testid="button-confirm-account-action"
                >
                  {processAccountMutation.isPending ? 'Processing...' : 
                   accountApprovalAction === 'approve' ? 'Approve Payment Method' : 'Decline Payment Method'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Payout' : 'Decline Payout'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' 
                ? 'This will process the payout and send money to the user\'s account.'
                : 'This will decline the payout request and return funds to available balance.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Transaction Details</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>User:</strong> {selectedTransaction.userName} ({selectedTransaction.userEmail})</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedTransaction.amount)}</p>
                  <p><strong>Method:</strong> {selectedTransaction.method}</p>
                  <p><strong>Description:</strong> {selectedTransaction.description}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this decision..."
                  rows={3}
                  data-testid="textarea-admin-notes"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedTransaction) {
                      processPayoutMutation.mutate({
                        transactionId: selectedTransaction.id,
                        action: approvalAction,
                        notes: adminNotes,
                      });
                    }
                  }}
                  disabled={processPayoutMutation.isPending}
                  className={approvalAction === 'approve' ? 'bg-primary hover:bg-primary' : ''}
                  data-testid="button-confirm-action"
                >
                  {processPayoutMutation.isPending ? 'Processing...' : 
                   approvalAction === 'approve' ? 'Approve Payout' : 'Decline Payout'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
