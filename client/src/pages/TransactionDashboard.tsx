import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, TrendingUp, CreditCard, Download, Plus, Check, Clock, AlertCircle, MapPin, Building2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import BankSelector from '@/components/BankSelector';


const payoutAccountSchema = z.object({
  type: z.enum(['bank', 'paypal']),
  accountName: z.string().min(1, "Account name is required"),
  email: z.string().email().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

type PayoutAccountForm = z.infer<typeof payoutAccountSchema>;

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  method?: 'bank' | 'paypal';
  description: string;
  createdAt: string;
  processedAt?: string;
}

interface UserBalance {
  availableBalance: string;
  totalEarnings: string;
  totalWithdrawn: string;
  pendingPayouts: string;
}

interface PayoutAccount {
  id: string;
  type: 'bank' | 'paypal';
  accountName: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
}

export default function TransactionDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });
  const [page, setPage] = useState(1);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [userCountry, setUserCountry] = useState<string>('US');
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [countryBanks, setCountryBanks] = useState<any[]>([]);


  const accountForm = useForm<PayoutAccountForm>({
    resolver: zodResolver(payoutAccountSchema),
  });

  // Fetch user balance
  const { data: balance } = useQuery<UserBalance>({
    queryKey: ['balance', user?.id],
    queryFn: () => apiRequest(`/api/transactions/balance/${user?.id}`).then(res => res.balance),
    enabled: !!user?.id,
  });

  // Fetch transactions
  const { data: transactionData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', user?.id, filter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filter.type !== 'all' && { type: filter.type }),
        ...(filter.status !== 'all' && { status: filter.status }),
      });
      return apiRequest(`/api/transactions/${user?.id}?${params}`);
    },
    enabled: !!user?.id,
  });

  // Fetch payout accounts
  const { data: payoutAccounts } = useQuery<PayoutAccount[]>({
    queryKey: ['payoutAccounts', user?.id],
    queryFn: () => apiRequest(`/api/payout-accounts/${user?.id}`).then(res => res.accounts),
    enabled: !!user?.id,
  });


  // Add payout account mutation
  const addAccountMutation = useMutation({
    mutationFn: (data: PayoutAccountForm) => {
      const details = data.type === 'paypal' 
        ? { email: data.email }
        : { 
            bankName: data.bankName, 
            accountNumber: data.accountNumber, 
            routingNumber: data.routingNumber 
          };
      
      return apiRequest('/api/payout-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          type: data.type,
          accountName: data.accountName,
          details,
          isDefault: data.isDefault,
        }),
      });
    },
    onSuccess: () => {
      setSuccess("Payout account added successfully. Pending admin verification.");
      setIsAccountModalOpen(false);
      accountForm.reset();
      queryClient.invalidateQueries({ queryKey: ['payoutAccounts'] });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to add payout account");
      setTimeout(() => setError(''), 5000);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'outline',
    } as const;

    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      completed: <Check className="w-3 h-3 mr-1" />,
      failed: <AlertCircle className="w-3 h-3 mr-1" />,
      cancelled: <AlertCircle className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="transaction-dashboard">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="available-balance">
              {balance ? formatCurrency(balance.availableBalance) : formatCurrency('0')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-earnings">
              {balance ? formatCurrency(balance.totalEarnings) : formatCurrency('0')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-withdrawn">
              {balance ? formatCurrency(balance.totalWithdrawn) : formatCurrency('0')}
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
              {balance ? formatCurrency(balance.pendingPayouts) : formatCurrency('0')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="accounts">Payout Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>View your earnings and payout history</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <Select value={filter.type} onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credits</SelectItem>
                    <SelectItem value="debit">Debits</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transactions Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : transactionData?.transactions?.length > 0 ? (
                    transactionData.transactions.map((transaction: Transaction) => (
                      <TableRow key={transaction.id} data-testid={`transaction-row-${transaction.id}`}>
                        <TableCell>
                          <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                            {transaction.type === 'credit' ? '+' : '-'} {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={transaction.type === 'credit' ? 'text-green-600' : 'text-primary-600'}>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                        <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No transactions found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Payout Accounts</CardTitle>
                  <CardDescription>Manage your bank and PayPal accounts</CardDescription>
                </div>
                <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-account">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Payout Account</DialogTitle>
                      <DialogDescription>
                        Add a new bank or PayPal account for payouts
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...accountForm}>
                      <form onSubmit={accountForm.handleSubmit((data: PayoutAccountForm) => addAccountMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={accountForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select account type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="paypal">PayPal</SelectItem>
                                  <SelectItem value="bank">Bank Account</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={accountForm.control}
                          name="accountName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Name</FormLabel>
                              <FormControl>
                                <Input placeholder="My PayPal Account" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {accountForm.watch('type') === 'paypal' && (
                          <FormField
                            control={accountForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PayPal Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="your@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {accountForm.watch('type') === 'bank' && (
                          <div className="space-y-4">
                            <BankSelector 
                              onBankSelect={(bank) => {
                                accountForm.setValue('bankName', bank.bankName);
                                accountForm.setValue('routingNumber', bank.swiftCode);
                              }}
                              selectedCountry={userCountry}
                              className="border-2 border-dashed border-primary/20 p-4 rounded-lg"
                            />
                            <FormField
                              control={accountForm.control}
                              name="bankName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bank Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Bank of America" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={accountForm.control}
                              name="accountNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="****1234" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={accountForm.control}
                              name="routingNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Routing Number / SWIFT Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="021000021" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={addAccountMutation.isPending}
                          data-testid="submit-add-account"
                        >
                          {addAccountMutation.isPending ? 'Adding Account...' : 'Add Account'}
                        </Button>
                        
                        {/* Status Messages */}
                        {error && (
                          <div className="p-3 bg-primary/10 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-primary-700 dark:text-primary-400 text-sm" data-testid="error-message">
                            {error}
                          </div>
                        )}
                        
                        {success && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm" data-testid="success-message">
                            {success}
                          </div>
                        )}
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {payoutAccounts && payoutAccounts.length > 0 ? (
                  payoutAccounts.map((account) => (
                    <Card key={account.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{account.accountName}</p>
                            <p className="text-sm text-muted-foreground">
                              {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                              {account.isDefault && ' • Default'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.isVerified ? (
                            <Badge className="bg-green-100 text-green-800">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Pending Verification</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No payout accounts configured. Add one to start receiving payouts.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
