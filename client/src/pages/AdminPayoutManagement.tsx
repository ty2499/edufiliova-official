import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { XCircle, Clock, DollarSign, User, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { format } from "date-fns";
import { AjaxStatus } from "@/components/ui/ajax-loader";

const approvePayoutSchema = z.object({
  amountApproved: z.number().positive("Amount must be positive"),
  paymentReference: z.string().optional(),
  adminNotes: z.string().optional(),
});

const rejectPayoutSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
  adminNotes: z.string().optional(),
});

type ApprovePayoutForm = z.infer<typeof approvePayoutSchema>;
type RejectPayoutForm = z.infer<typeof rejectPayoutSchema>;

interface AdminPayoutManagementProps {
  isEmbedded?: boolean;
}

export default function AdminPayoutManagement({ isEmbedded = false }: AdminPayoutManagementProps = {}) {
  const [selectedStatus, setSelectedStatus] = useState<string>("awaiting_admin");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: payoutRequestsData, isLoading } = useQuery({
    queryKey: ['/api/creator-payouts/admin/requests', selectedStatus],
    queryFn: () => apiRequest(`/api/creator-payouts/admin/requests?status=${selectedStatus}`),
  });

  const approveForm = useForm<ApprovePayoutForm>({
    resolver: zodResolver(approvePayoutSchema),
    defaultValues: {
      amountApproved: 0,
      paymentReference: "",
      adminNotes: "",
    },
  });

  const rejectForm = useForm<RejectPayoutForm>({
    resolver: zodResolver(rejectPayoutSchema),
    defaultValues: {
      rejectionReason: "",
      adminNotes: "",
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: ApprovePayoutForm }) =>
      apiRequest(`/api/creator-payouts/${requestId}/approve`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creator-payouts/admin/requests'] });
      setTimeout(() => {
        setApproveDialogOpen(false);
        setSelectedRequest(null);
        approveForm.reset();
      }, 1500);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: RejectPayoutForm }) =>
      apiRequest(`/api/creator-payouts/${requestId}/reject`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creator-payouts/admin/requests'] });
      setTimeout(() => {
        setRejectDialogOpen(false);
        setSelectedRequest(null);
        rejectForm.reset();
      }, 1500);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ requestId, paymentRef }: { requestId: string; paymentRef: string }) =>
      apiRequest(`/api/creator-payouts/${requestId}/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ paymentReference: paymentRef }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creator-payouts/admin/requests'] });
      setTimeout(() => {
        setMarkPaidDialogOpen(false);
        setSelectedRequest(null);
        setPaymentReference("");
      }, 1500);
    },
  });

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    approveForm.setValue('amountApproved', parseFloat(request.request.amountRequested));
    setApproveDialogOpen(true);
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const handleMarkPaid = (request: any) => {
    setSelectedRequest(request);
    setMarkPaidDialogOpen(true);
  };

  const onMarkPaidSubmit = () => {
    if (!selectedRequest) return;
    markPaidMutation.mutate({
      requestId: selectedRequest.request.id,
      paymentRef: paymentReference,
    });
  };

  const onApproveSubmit = (data: ApprovePayoutForm) => {
    if (!selectedRequest) return;
    approveMutation.mutate({
      requestId: selectedRequest.request.id,
      data,
    });
  };

  const onRejectSubmit = (data: RejectPayoutForm) => {
    if (!selectedRequest) return;
    rejectMutation.mutate({
      requestId: selectedRequest.request.id,
      data,
    });
  };

  if (isLoading) {
    return (
      <div className={isEmbedded ? "flex items-center justify-center py-12" : "min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center"} data-testid="loading-state">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const payoutRequests = payoutRequestsData || [];
  const awaitingCount = payoutRequests.filter((r: any) => r.request.status === 'awaiting_admin').length;
  const totalRequested = payoutRequests.reduce(
    (sum: number, r: any) => sum + parseFloat(r.request.amountRequested || '0'),
    0
  );

  const totalPages = Math.ceil(payoutRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = payoutRequests.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setCurrentPage(1);
  };

  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-gray-50 dark:bg-gray-900 p-6"} data-testid="admin-payout-management">
      <div className={isEmbedded ? "space-y-6" : "max-w-7xl mx-auto space-y-6"}>
        {!isEmbedded && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
              Payout Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description">
              Manage creator payout requests and approvals
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-awaiting-requests">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Admin</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-awaiting-count">
                {awaitingCount}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-requested">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requested</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-requested">
                ${totalRequested.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Current filter
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-requests">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <User className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-requests">
                {payoutRequests.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                In this view
              </p>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-payout-requests">
          <CardHeader>
            <CardTitle>Payout Requests</CardTitle>
            <CardDescription>Review and manage creator payout requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedStatus} onValueChange={handleStatusChange}>
              <div className="mb-4 -mx-6 px-6 overflow-x-auto md:mx-0 md:px-0">
                <TabsList className="inline-flex md:grid md:grid-cols-5 md:w-full" data-testid="tabs-status-filter">
                  <TabsTrigger value="awaiting_admin" data-testid="tab-awaiting" className="whitespace-nowrap">
                    Awaiting
                  </TabsTrigger>
                  <TabsTrigger value="approved" data-testid="tab-approved" className="whitespace-nowrap">
                    Approved
                  </TabsTrigger>
                  <TabsTrigger value="payment_processing" data-testid="tab-processing" className="whitespace-nowrap">
                    Processing
                  </TabsTrigger>
                  <TabsTrigger value="completed" data-testid="tab-completed" className="whitespace-nowrap">
                    Completed
                  </TabsTrigger>
                  <TabsTrigger value="rejected" data-testid="tab-rejected" className="whitespace-nowrap">
                    Rejected
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={selectedStatus}>
                {payoutRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400" data-testid="text-no-requests">
                    No {selectedStatus} payout requests
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {currentRequests.map((request: any) => (
                      <div
                        key={request.request.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                        data-testid={`request-${request.request.id}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                {request.creator?.name || 'Unknown Creator'}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {request.creator?.role || 'creator'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {request.creator?.email}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              ${parseFloat(request.request.amountRequested).toFixed(2)}
                            </div>
                            <Badge
                              variant={
                                request.request.status === 'approved'
                                  ? 'default'
                                  : request.request.status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {request.request.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Payout Method
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.request.payoutMethod}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Account
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.payoutAccount?.accountName || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Requested At
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {format(new Date(request.request.requestedAt), 'MMM dd, yyyy')}
                            </div>
                          </div>
                          {request.request.payoutDate && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Payout Date
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {format(new Date(request.request.payoutDate), 'MMM dd, yyyy')}
                              </div>
                            </div>
                          )}
                        </div>

                        {request.payoutAccount?.details && (
                          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-3 uppercase tracking-wide">
                              Payout Account Details
                            </div>
                            <div className="space-y-2">
                              {request.request.payoutMethod === 'paypal' && request.payoutAccount.details.email && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-blue-600 dark:text-blue-400">PayPal Email:</span>
                                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100 font-mono">
                                    {request.payoutAccount.details.email}
                                  </span>
                                </div>
                              )}
                              {request.request.payoutMethod === 'bank' && (
                                <>
                                  {request.payoutAccount.details.accountNumber && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-blue-600 dark:text-blue-400">Account Number:</span>
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100 font-mono">
                                        {request.payoutAccount.details.accountNumber}
                                      </span>
                                    </div>
                                  )}
                                  {request.payoutAccount.details.accountName && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-blue-600 dark:text-blue-400">Account Name:</span>
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        {request.payoutAccount.details.accountName}
                                      </span>
                                    </div>
                                  )}
                                  {request.payoutAccount.details.bankName && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-blue-600 dark:text-blue-400">Bank Name:</span>
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        {request.payoutAccount.details.bankName}
                                      </span>
                                    </div>
                                  )}
                                  {request.payoutAccount.details.routingNumber && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-blue-600 dark:text-blue-400">Routing Number:</span>
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100 font-mono">
                                        {request.payoutAccount.details.routingNumber}
                                      </span>
                                    </div>
                                  )}
                                  {request.payoutAccount.details.swiftCode && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-blue-600 dark:text-blue-400">SWIFT Code:</span>
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100 font-mono">
                                        {request.payoutAccount.details.swiftCode}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                              {request.request.payoutMethod === 'mobile_money' && (
                                <>
                                  {request.payoutAccount.mobileMoneyNumber && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-blue-600 dark:text-blue-400">Mobile Number:</span>
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100 font-mono">
                                        {request.payoutAccount.mobileMoneyNumber}
                                      </span>
                                    </div>
                                  )}
                                  {request.payoutAccount.mobileMoneyProvider && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-blue-600 dark:text-blue-400">Provider:</span>
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        {request.payoutAccount.mobileMoneyProvider}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                              {request.request.payoutMethod === 'crypto' && request.payoutAccount.details.walletAddress && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-blue-600 dark:text-blue-400">Wallet Address:</span>
                                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100 font-mono break-all">
                                    {request.payoutAccount.details.walletAddress}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {request.request.adminNotes && (
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Admin Notes
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {request.request.adminNotes}
                            </div>
                          </div>
                        )}

                        {request.request.rejectionReason && (
                          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                            <div className="text-xs text-red-600 dark:text-red-400 mb-1">
                              Rejection Reason
                            </div>
                            <div className="text-sm text-red-700 dark:text-red-300">
                              {request.request.rejectionReason}
                            </div>
                          </div>
                        )}

                        {request.request.paymentReference && (
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                              Payment Reference
                            </div>
                            <div className="text-sm text-blue-700 dark:text-blue-300 font-mono">
                              {request.request.paymentReference}
                            </div>
                          </div>
                        )}

                        {request.request.status === 'awaiting_admin' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(request)}
                              className="flex-1"
                              data-testid={`button-approve-${request.request.id}`}
                            >
                              <CheckmarkIcon size="sm" variant="success" className="mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleReject(request)}
                              variant="destructive"
                              className="flex-1"
                              data-testid={`button-reject-${request.request.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {request.request.status === 'approved' && (
                          <Button
                            onClick={() => handleMarkPaid(request)}
                            className="w-full"
                            data-testid={`button-mark-paid-${request.request.id}`}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Mark as Paid
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {startIndex + 1}-{Math.min(endIndex, payoutRequests.length)} of {payoutRequests.length} requests
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                          data-testid="button-prev-page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm text-gray-600 dark:text-gray-400 px-2">
                          Page {currentPage} of {totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          data-testid="button-next-page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent data-testid="dialog-approve-payout">
          <DialogHeader>
            <DialogTitle>Approve Payout Request</DialogTitle>
            <DialogDescription>
              Approve this payout request and provide payment details
            </DialogDescription>
          </DialogHeader>
          <Form {...approveForm}>
            <form onSubmit={approveForm.handleSubmit(onApproveSubmit)} className="space-y-4">
              <FormField
                control={approveForm.control}
                name="amountApproved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Approve</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-amount-approved"
                      />
                    </FormControl>
                    <FormDescription>
                      Requested: ${selectedRequest ? parseFloat(selectedRequest.request.amountRequested).toFixed(2) : '0.00'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={approveForm.control}
                name="paymentReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Transaction ID or reference number"
                        {...field}
                        data-testid="input-payment-reference"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={approveForm.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any internal notes..."
                        {...field}
                        data-testid="input-admin-notes-approve"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={approveMutation.isPending}
                data-testid="button-submit-approve"
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve Payout'}
              </Button>
              <AjaxStatus
                isLoading={approveMutation.isPending}
                isSuccess={approveMutation.isSuccess}
                isError={approveMutation.isError}
                loadingMessage="Approving payout..."
                successMessage="Payout approved successfully!"
                errorMessage={approveMutation.error?.message || "Failed to approve payout"}
              />
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject-payout">
          <DialogHeader>
            <DialogTitle>Reject Payout Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payout request
            </DialogDescription>
          </DialogHeader>
          <Form {...rejectForm}>
            <form onSubmit={rejectForm.handleSubmit(onRejectSubmit)} className="space-y-4">
              <FormField
                control={rejectForm.control}
                name="rejectionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this request is being rejected..."
                        {...field}
                        data-testid="input-rejection-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rejectForm.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any internal notes..."
                        {...field}
                        data-testid="input-admin-notes-reject"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={rejectMutation.isPending}
                data-testid="button-submit-reject"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Payout'}
              </Button>
              <AjaxStatus
                isLoading={rejectMutation.isPending}
                isSuccess={rejectMutation.isSuccess}
                isError={rejectMutation.isError}
                loadingMessage="Rejecting payout..."
                successMessage="Payout rejected successfully!"
                errorMessage={rejectMutation.error?.message || "Failed to reject payout"}
              />
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent data-testid="dialog-mark-paid">
          <DialogHeader>
            <DialogTitle>Mark Payout as Paid</DialogTitle>
            <DialogDescription>
              Confirm that you have sent the payment to the creator. The payout will be automatically finalized on the 5th of the month.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <div className="text-2xl font-bold text-green-600">
                ${selectedRequest ? parseFloat(selectedRequest.request.amountApproved || selectedRequest.request.amountRequested).toFixed(2) : '0.00'}
              </div>
            </div>
            <div>
              <label htmlFor="payment-ref" className="text-sm font-medium">
                Payment Reference (Optional)
              </label>
              <Input
                id="payment-ref"
                placeholder="Transaction ID or reference number"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                data-testid="input-payment-ref-mark-paid"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the bank transfer ID, PayPal transaction ID, or mobile money reference
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setMarkPaidDialogOpen(false)}
                variant="outline"
                className="flex-1"
                data-testid="button-cancel-mark-paid"
              >
                Cancel
              </Button>
              <Button
                onClick={onMarkPaidSubmit}
                className="flex-1"
                disabled={markPaidMutation.isPending}
                data-testid="button-confirm-mark-paid"
              >
                {markPaidMutation.isPending ? 'Processing...' : 'Confirm Payment Sent'}
              </Button>
            </div>
            <AjaxStatus
              isLoading={markPaidMutation.isPending}
              isSuccess={markPaidMutation.isSuccess}
              isError={markPaidMutation.isError}
              loadingMessage="Marking as paid..."
              successMessage="Payout marked as paid! Will be finalized on the 5th of the month."
              errorMessage={markPaidMutation.error?.message || "Failed to mark payout as paid"}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
