import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Package, Receipt, Download } from 'lucide-react';
import type { ShopPurchase } from '@shared/schema';

// Order Slip Viewer Modal
function OrderSlipViewer({ 
  orderId, 
  isOpen, 
  onClose 
}: { 
  orderId: string; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { data: orderDetails, isLoading } = useQuery<{
    order: any;
    items: any[];
  }>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: isOpen && !!orderId,
  });

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" data-testid="dialog-order-slip">
        <DialogHeader className="sr-only">
          <DialogTitle>Invoice</DialogTitle>
          <DialogDescription>
            View detailed invoice for your order
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        ) : orderDetails ? (
          <div className="bg-white" data-testid="order-slip-details">
            {/* Invoice Header */}
            <div className="bg-white border-b-2 border-gray-200 px-8 py-6">
              <div className="flex justify-between items-start">
                <div className="max-w-md">
                  <img 
                    alt="EduFiliova" 
                    className="h-24 w-auto mb-2"
                  />
                  <p className="text-gray-600 text-sm">Edufiliova — Creativity, Learning, and Growth in One Place.</p>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-bold text-gray-900 mb-1">INVOICE</h1>
                  <p className="text-gray-600 text-sm">Order Receipt</p>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Invoice Details</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Invoice Number</p>
                      <p className="font-semibold text-gray-900" data-testid="text-order-id">
                        #{orderId.substring(0, 12).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date Issued</p>
                      <p className="font-medium text-gray-900" data-testid="text-order-date">
                        {formatDate(orderDetails.order.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge className={`${getStatusColor(orderDetails.order.status)} font-medium`} data-testid="badge-order-status">
                        {orderDetails.order.status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="font-medium text-gray-900 capitalize" data-testid="text-payment-method">
                        {orderDetails.order.paymentMethod || 'Stripe'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Currency</p>
                      <p className="font-medium text-gray-900">USD ($)</p>
                    </div>
                  </div>
                </div>
              </div>

              {orderDetails.order.shippingAddress && (
                <div className="mb-8 pb-6 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Shipping Address</h3>
                  <p className="text-sm text-gray-700" data-testid="text-shipping-address">
                    {orderDetails.order.shippingAddress}
                  </p>
                </div>
              )}

              {/* Line Items Table */}
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Order Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orderDetails.items.map((item: any, index: number) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors" transition-all duration-300 data-testid={`order-item-${index}`}>
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-900">{item.product?.name || 'Unknown Item'}</p>
                            {item.product?.description && (
                              <p className="text-xs text-gray-500 mt-1">{item.product.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right text-gray-700">
                            ${parseFloat(item.price).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-gray-900">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900 font-medium">
                        ${parseFloat(orderDetails.order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (0%)</span>
                      <span className="text-gray-900 font-medium">$0.00</span>
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-900 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600" data-testid="text-total-amount">
                        ${parseFloat(orderDetails.order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Invoice not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Purchases Page
export default function PurchasesPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showAllPurchases, setShowAllPurchases] = useState(false);
  
  const { data: purchases, isLoading } = useQuery<ShopPurchase[]>({
    queryKey: ['/api/shop/purchases'],
    refetchOnMount: true,
    staleTime: 0,
  });

  const availableMonths = purchases ? Array.from(
    new Set(
      purchases
        .filter(p => parseFloat(p.price) > 0)
        .map(p => {
          const date = new Date(p.createdAt);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        })
    )
  ).sort((a, b) => b.localeCompare(a)) : [];

  const filteredPurchases = purchases?.filter(purchase => {
    if (parseFloat(purchase.price) === 0) return false;
    
    if (selectedMonth === 'all') return true;
    const date = new Date(purchase.createdAt);
    const purchaseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return purchaseMonth === selectedMonth;
  }) || [];

  const handleDownloadSlip = async (orderId: string) => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      const headers: Record<string, string> = {};
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch(`/api/orders/${orderId}/slip`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to download slip');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-slip-${orderId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download order slip:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Purchases</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading purchases...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Purchases</h2>
          <p className="text-sm text-gray-600">View your purchase history</p>
        </div>
        
        {purchases && purchases.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="month-filter" className="text-sm text-gray-600 whitespace-nowrap">Filter by:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-filter" className="w-full sm:w-[200px]" data-testid="select-month-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {formatMonthDisplay(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!purchases || purchases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No purchases yet</p>
          </CardContent>
        </Card>
      ) : filteredPurchases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No purchases found for {formatMonthDisplay(selectedMonth)}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSelectedMonth('all')}
              data-testid="button-clear-filter"
            >
              View All Purchases
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {(showAllPurchases ? filteredPurchases : filteredPurchases.slice(0, 3)).map((purchase) => (
              <Card key={purchase.id} data-testid={`card-purchase-${purchase.id}`}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{purchase.itemName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Order #{purchase.orderId}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">${purchase.price}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedOrderId(purchase.orderId)}
                      className="bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-full px-4 py-1 h-8 text-xs border border-gray-200" transition-all duration-300
                      data-testid={`button-view-slip-${purchase.id}`}
                    >
                      <Receipt className="h-3 w-3 mr-1.5" />
                      View Receipt
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => purchase.orderId && handleDownloadSlip(purchase.orderId)}
                      className="bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-full px-4 py-1 h-8 text-xs border border-gray-200" transition-all duration-300
                      data-testid={`button-download-receipt-${purchase.id}`}
                    >
                      <Download className="h-3 w-3 mr-1.5" />
                      Download Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredPurchases.length > 3 && (
            <div className="mt-2">
              <Button
                variant="outline"
                onClick={() => setShowAllPurchases(!showAllPurchases)}
                className="w-full"
                data-testid="button-view-all-purchases"
              >
                {showAllPurchases ? 'Show Less' : `View All (${filteredPurchases.length})`}
              </Button>
            </div>
          )}
        </>
      )}

      <OrderSlipViewer
        orderId={selectedOrderId || ''}
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
