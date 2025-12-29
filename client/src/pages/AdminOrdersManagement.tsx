import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, 
  User, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Eye,
  Wallet,
  Flag
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface Order {
  id: string;
  serviceId: string;
  clientId: string;
  freelancerId: string;
  status: string;
  packageType: string;
  amountTotal: string;
  platformFee: string;
  escrowHeldAmount: string;
  currency: string;
  createdAt: string;
  deliveredAt?: string;
  autoReleaseAt?: string;
  service?: { title: string } | null;
  freelancer?: { fullName: string; profilePicture?: string } | null;
  client?: { fullName: string; profilePicture?: string } | null;
}

interface OrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-500",
  active: "bg-blue-500",
  awaiting_requirements: "bg-purple-500",
  in_progress: "bg-indigo-500",
  delivered: "bg-teal-500",
  revision_requested: "bg-orange-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-500",
  refunded: "bg-red-500",
  disputed: "bg-rose-600",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending Payment",
  active: "Active",
  awaiting_requirements: "Awaiting Requirements",
  in_progress: "In Progress",
  delivered: "Delivered",
  revision_requested: "Revision Requested",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  disputed: "Disputed",
};

interface AdminOrdersManagementProps {
  isEmbedded?: boolean;
}

export default function AdminOrdersManagement({ isEmbedded = false }: AdminOrdersManagementProps = {}) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"release" | "refund" | "cancel" | "dispute" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const itemsPerPage = 10;

  const { data: ordersData, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['/api/freelancer/admin/orders', selectedStatus, currentPage],
    queryFn: () => apiRequest(`/api/freelancer/admin/orders?status=${selectedStatus}&page=${currentPage}&limit=${itemsPerPage}`),
  });

  const releaseMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      apiRequest(`/api/freelancer/admin/orders/${orderId}/release`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/admin/orders'] });
      closeActionDialog();
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ orderId, reason, refundAmount }: { orderId: string; reason: string; refundAmount?: string }) =>
      apiRequest(`/api/freelancer/admin/orders/${orderId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason, refundAmount }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/admin/orders'] });
      closeActionDialog();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      apiRequest(`/api/freelancer/admin/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/admin/orders'] });
      closeActionDialog();
    },
  });

  const disputeMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      apiRequest(`/api/freelancer/admin/orders/${orderId}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/admin/orders'] });
      closeActionDialog();
    },
  });

  const openActionDialog = (order: Order, type: "release" | "refund" | "cancel" | "dispute") => {
    setSelectedOrder(order);
    setActionType(type);
    setActionReason("");
    setRefundAmount(order.amountTotal);
    setActionDialogOpen(true);
  };

  const closeActionDialog = () => {
    setActionDialogOpen(false);
    setSelectedOrder(null);
    setActionType(null);
    setActionReason("");
    setRefundAmount("");
  };

  const handleAction = () => {
    if (!selectedOrder || !actionType) return;

    switch (actionType) {
      case "release":
        releaseMutation.mutate({ orderId: selectedOrder.id, reason: actionReason });
        break;
      case "refund":
        refundMutation.mutate({ orderId: selectedOrder.id, reason: actionReason, refundAmount });
        break;
      case "cancel":
        cancelMutation.mutate({ orderId: selectedOrder.id, reason: actionReason });
        break;
      case "dispute":
        disputeMutation.mutate({ orderId: selectedOrder.id, reason: actionReason });
        break;
    }
  };

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const content = (
    <div className="space-y-6">
      <Tabs value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending_payment">Pending Payment</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="disputed">Disputed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="refunded">Refunded</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Freelancer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Escrow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {order.service?.title || "Unknown Service"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate max-w-[100px]">
                            {order.client?.fullName || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate max-w-[100px]">
                            {order.freelancer?.fullName || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {parseFloat(order.amountTotal).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-amber-600">
                          <Wallet className="w-3 h-3" />
                          {parseFloat(order.escrowHeldAmount || "0").toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[order.status] || "bg-gray-500"} text-white`}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {order.status !== "completed" && order.status !== "refunded" && order.status !== "cancelled" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:text-green-700"
                                onClick={() => openActionDialog(order, "release")}
                                title="Release Payment"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-amber-600 hover:text-amber-700"
                                onClick={() => openActionDialog(order, "refund")}
                                title="Issue Refund"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => openActionDialog(order, "cancel")}
                                title="Cancel Order"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              {order.status !== "disputed" && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-rose-600 hover:text-rose-700"
                                  onClick={() => openActionDialog(order, "dispute")}
                                  title="Flag Dispute"
                                >
                                  <Flag className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "release" && "Release Payment to Freelancer"}
              {actionType === "refund" && "Issue Refund to Buyer"}
              {actionType === "cancel" && "Cancel Order"}
              {actionType === "dispute" && "Flag Order as Disputed"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "release" && "This will immediately release the escrow amount to the freelancer."}
              {actionType === "refund" && "This will refund the specified amount to the buyer's wallet and mark the order as refunded."}
              {actionType === "cancel" && "This will cancel the order. Consider issuing a refund separately if needed."}
              {actionType === "dispute" && "This will mark the order as disputed and pause all actions until resolved."}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm"><strong>Order:</strong> #{selectedOrder.id.slice(0, 8)}</p>
                <p className="text-sm"><strong>Service:</strong> {selectedOrder.service?.title}</p>
                <p className="text-sm"><strong>Total Amount:</strong> ${parseFloat(selectedOrder.amountTotal).toFixed(2)}</p>
                <p className="text-sm"><strong>Escrow Amount:</strong> ${parseFloat(selectedOrder.escrowHeldAmount || "0").toFixed(2)}</p>
                {actionType === "release" && (
                  <p className="text-sm"><strong>Freelancer Receives:</strong> ${(parseFloat(selectedOrder.amountTotal) - parseFloat(selectedOrder.platformFee || "0")).toFixed(2)}</p>
                )}
              </div>

              {actionType === "refund" && (
                <div className="space-y-2">
                  <Label htmlFor="refundAmount">Refund Amount</Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Enter refund amount"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={releaseMutation.isPending || refundMutation.isPending || cancelMutation.isPending || disputeMutation.isPending}
              className={
                actionType === "release" ? "bg-green-600 hover:bg-green-700" :
                actionType === "refund" ? "bg-amber-600 hover:bg-amber-700" :
                actionType === "dispute" ? "bg-rose-600 hover:bg-rose-700" :
                "bg-red-600 hover:bg-red-700"
              }
            >
              {(releaseMutation.isPending || refundMutation.isPending || cancelMutation.isPending || disputeMutation.isPending) ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {actionType === "release" && "Release Payment"}
              {actionType === "refund" && "Issue Refund"}
              {actionType === "cancel" && "Cancel Order"}
              {actionType === "dispute" && "Flag Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Freelancer Order Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all freelancer service orders, release payments, issue refunds, and handle disputes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                </div>
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Delivery</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {orders.filter(o => o.status === "delivered").length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {orders.filter(o => o.status === "in_progress").length}
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs Attention</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {orders.filter(o => o.status === "revision_requested").length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {content}
      </div>
    </div>
  );
}
