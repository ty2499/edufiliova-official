import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign, TrendingUp, Clock, Download, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

const payoutRequestSchema = z.object({
  amount: z.number().min(50, "Minimum payout amount is $50"),
  payoutMethod: z.enum(["bank", "paypal", "crypto"]),
  payoutAccountId: z.string().uuid("Invalid payout account"),
  notes: z.string().optional(),
});

type PayoutRequestForm = z.infer<typeof payoutRequestSchema>;

export default function CreatorEarningsDashboard() {
  const { user, profile } = useAuth();
  const [ajaxStatus, setAjaxStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['/api/creator-payouts/balance'],
    enabled: !!user?.id,
  });

  const { data: payoutRequestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/creator-payouts/requests'],
    enabled: !!user?.id,
  });

  const { data: payoutAccountsData } = useQuery({
    queryKey: [`/api/payout-accounts/${user?.id}`],
    enabled: !!user?.id,
  });

  const createPayoutMutation = useMutation({
    mutationFn: (data: PayoutRequestForm) => {
      setAjaxStatus({ type: 'loading', message: 'Submitting payout request...' });
      return apiRequest('/api/creator-payouts/request', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setAjaxStatus({ type: 'success', message: 'Payout request submitted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-payouts/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-payouts/requests'] });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
    onError: (error: any) => {
      setAjaxStatus({ type: 'error', message: error.message || 'Failed to submit payout request' });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
  });

  const form = useForm<PayoutRequestForm>({
    resolver: zodResolver(payoutRequestSchema),
    defaultValues: {
      amount: 50,
      payoutMethod: "paypal",
      payoutAccountId: "",
      notes: "",
    },
  });

  const onSubmit = (data: PayoutRequestForm) => {
    createPayoutMutation.mutate(data);
  };

  if (balanceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center" data-testid="loading-state">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const balance = (balanceData as any)?.data?.balance;
  const recentEarnings = (balanceData as any)?.data?.recentEarnings || [];
  const pendingPayouts = (balanceData as any)?.data?.pendingPayouts || [];
  const canWithdraw = (balanceData as any)?.data?.canWithdraw || false;
  const payoutRequests = (payoutRequestsData as any)?.data || [];
  const payoutAccounts = Array.isArray(payoutAccountsData) ? payoutAccountsData : [];

  const availableBalance = parseFloat(balance?.availableBalance || '0');
  const pendingBalance = parseFloat(balance?.pendingBalance || '0');
  const lifetimeEarnings = parseFloat(balance?.lifetimeEarnings || '0');
  const totalWithdrawn = parseFloat(balance?.totalWithdrawn || '0');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" data-testid="creator-earnings-dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {ajaxStatus.type !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            ajaxStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
            ajaxStatus.type === 'success' ? 'bg-green-50 text-green-700' :
            'bg-primary/10 text-primary-700'
          }`} data-testid="ajax-status-inline">
            {ajaxStatus.type === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
            {ajaxStatus.type === 'success' && <CheckmarkIcon size="sm" variant="success" />}
            {ajaxStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
            <span className="text-sm font-medium">{ajaxStatus.message}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
              Earnings Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description">
              Track your earnings and manage payouts
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                disabled={!canWithdraw || payoutAccounts.length === 0}
                data-testid="button-request-payout"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-payout-request">
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
                <DialogDescription>
                  Minimum payout amount is $50. Payouts are processed on the 5th of each month.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-payout-amount"
                          />
                        </FormControl>
                        <FormDescription>
                          Available balance: ${availableBalance.toFixed(2)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payoutMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payout Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payout-method">
                              <SelectValue placeholder="Select payout method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                            <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payoutAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payout Account</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payout-account">
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {payoutAccounts.map((account: any) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.accountName} ({account.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any notes for your payout request..."
                            {...field}
                            data-testid="input-payout-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createPayoutMutation.isPending}
                    data-testid="button-submit-payout"
                  >
                    {createPayoutMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-available-balance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-available-balance">
                ${availableBalance.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ready to withdraw
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-balance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-balance">
                ${pendingBalance.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Available on 5th of next month
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-lifetime-earnings">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-lifetime-earnings">
                ${lifetimeEarnings.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total earned
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-withdrawn">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
              <Download className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-withdrawn">
                ${totalWithdrawn.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Successfully paid out
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-recent-earnings">
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
              <CardDescription>Your latest earning transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEarnings.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-earnings">
                  No earnings yet
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEarnings.map((earning: any) => (
                    <div
                      key={earning.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      data-testid={`earning-${earning.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {earning.eventType === 'product_sale' && 'Product Sale'}
                          {earning.eventType === 'course_sale' && 'Course Sale'}
                          {earning.eventType === 'free_download_milestone' && 'Free Download Milestone'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(earning.eventDate), 'MMM dd, yyyy')}
                        </div>
                        {earning.metadata?.productName && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {earning.metadata.productName}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          +${parseFloat(earning.creatorAmount).toFixed(2)}
                        </div>
                        <Badge variant={earning.status === 'available' ? 'default' : 'secondary'}>
                          {earning.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-payout-requests">
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
              <CardDescription>Track your withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              {payoutRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-requests">
                  No payout requests yet
                </div>
              ) : (
                <div className="space-y-4">
                  {payoutRequests.map((request: any) => (
                    <div
                      key={request.request.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      data-testid={`request-${request.request.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          ${parseFloat(request.request.amountRequested).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(request.request.requestedAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          via {request.request.payoutMethod}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            request.request.status === 'completed'
                              ? 'default'
                              : request.request.status === 'rejected' || request.request.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="mb-1"
                        >
                          {(request.request.status === 'awaiting_admin' || request.request.status === 'approved') && <Clock className="w-3 h-3 mr-1" />}
                          {(request.request.status === 'completed' || request.request.status === 'payment_processing') && <CheckmarkIcon size="sm" variant="success" className="mr-1" />}
                          {(request.request.status === 'rejected' || request.request.status === 'failed') && <XCircle className="w-3 h-3 mr-1" />}
                          {request.request.status === 'awaiting_admin' && 'Awaiting Admin'}
                          {request.request.status === 'approved' && 'Approved'}
                          {request.request.status === 'payment_processing' && 'Payment Processing'}
                          {request.request.status === 'completed' && 'Completed'}
                          {request.request.status === 'rejected' && 'Rejected'}
                          {request.request.status === 'failed' && 'Failed'}
                        </Badge>
                        {request.request.status === 'payment_processing' && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Will finalize on the 5th
                          </div>
                        )}
                        {request.request.rejectionReason && (
                          <div className="text-xs text-primary-600 mt-1">
                            {request.request.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {!canWithdraw && availableBalance > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800" data-testid="card-minimum-warning">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Minimum Payout Amount
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  You need at least $50.00 in your available balance to request a payout.
                  Current balance: ${availableBalance.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {payoutAccounts.length === 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800" data-testid="card-account-warning">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Set up payout account
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You need to add a payout account before you can request withdrawals.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
