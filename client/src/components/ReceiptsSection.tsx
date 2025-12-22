import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Receipt, 
  Download, 
  Mail, 
  FileText, 
  Package, 
  CreditCard, 
  Megaphone,
  GraduationCap,
  Award,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

interface ReceiptData {
  id: string;
  userId: string | null;
  payerEmail: string;
  payerName: string | null;
  receiptType: 'order' | 'subscription' | 'freelancer_plan' | 'banner_payment' | 'certificate';
  sourceId: string;
  receiptNumber: string;
  amount: string;
  currency: string;
  paymentMethod: string | null;
  items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }>;
  metadata: Record<string, any>;
  issuedAt: string;
  deliveryStatus: 'pending' | 'sent' | 'downloaded' | 'failed';
  emailSentAt: string | null;
  downloadCount: number;
  lastDownloadedAt: string | null;
}

const receiptTypeConfig = {
  order: {
    label: 'Product Purchase',
    icon: Package,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  subscription: {
    label: 'Subscription',
    icon: GraduationCap,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  },
  freelancer_plan: {
    label: 'Freelancer Plan',
    icon: CreditCard,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  banner_payment: {
    label: 'Advertisement',
    icon: Megaphone,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  },
  certificate: {
    label: 'Certificate',
    icon: Award,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
  }
};

const deliveryStatusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600' },
  sent: { label: 'Emailed', icon: CheckCircle2, color: 'text-green-600' },
  downloaded: { label: 'Downloaded', icon: Download, color: 'text-blue-600' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-600' }
};

function ReceiptDetailModal({ 
  receipt, 
  isOpen, 
  onClose,
  onDownload,
  onResend,
  isDownloading,
  isResending
}: { 
  receipt: ReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onResend: () => void;
  isDownloading: boolean;
  isResending: boolean;
}) {
  if (!receipt) return null;

  const typeConfig = receiptTypeConfig[receipt.receiptType];
  const TypeIcon = typeConfig.icon;

  const formatCurrency = (amount: string | number, currency: string = 'USD') => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZAR: 'R' };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${parseFloat(amount.toString()).toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-receipt-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5 text-primary" />
            {typeConfig.label} Receipt
          </DialogTitle>
          <DialogDescription>
            Receipt #{receipt.receiptNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Receipt Number</span>
              <span className="font-mono text-sm font-medium">{receipt.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm">{new Date(receipt.issuedAt).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
              })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <span className="text-sm capitalize">{receipt.paymentMethod || 'Card'}</span>
            </div>
          </div>

          <div className="border rounded-lg divide-y">
            <div className="p-3 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-medium">Items</span>
            </div>
            {receipt.items?.map((item, index) => (
              <div key={index} className="p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <span className="font-medium">{formatCurrency(item.totalPrice, receipt.currency)}</span>
              </div>
            ))}
            <div className="p-3 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(receipt.amount, receipt.currency)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={onDownload} 
              disabled={isDownloading}
              className="flex-1"
              data-testid="button-download-receipt-pdf"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
            <Button 
              onClick={onResend} 
              disabled={isResending}
              variant="outline"
              className="flex-1"
              data-testid="button-resend-receipt-email"
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Resend Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ReceiptsSectionProps {
  showTitle?: boolean;
  maxItems?: number;
  compact?: boolean;
}

export default function ReceiptsSection({ showTitle = true, maxItems, compact = false }: ReceiptsSectionProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();

  const { data: receiptsResponse, isLoading } = useQuery<{ success: boolean; data: ReceiptData[] }>({
    queryKey: ['/api/receipts'],
    refetchOnMount: true,
  });

  const receipts = receiptsResponse?.data || [];

  const filteredReceipts = receipts.filter(receipt => {
    if (filterType === 'all') return true;
    return receipt.receiptType === filterType;
  });

  const displayedReceipts = maxItems && !showAll 
    ? filteredReceipts.slice(0, maxItems) 
    : filteredReceipts;

  const handleDownload = async (receiptId: string) => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      const headers: Record<string, string> = {};
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch(`/api/receipts/${receiptId}/download`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const receipt = receipts.find(r => r.id === receiptId);
      a.download = `EduFiliova-Receipt-${receipt?.receiptNumber || receiptId}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Receipt Downloaded",
        description: "Your PDF receipt has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resendMutation = useMutation({
    mutationFn: async (receiptId: string) => {
      return apiRequest(`/api/receipts/${receiptId}/resend`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Receipt Sent",
        description: "The receipt has been resent to your email.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Failed to resend receipt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string | number, currency: string = 'USD') => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZAR: 'R' };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${parseFloat(amount.toString()).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        )}
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">My Receipts</h2>
          </div>
        )}
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No receipts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Receipts will appear here after you make a purchase
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-xl font-bold">My Receipts</h2>
            <p className="text-sm text-muted-foreground">View and download your purchase receipts</p>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-receipt-filter">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Receipts</SelectItem>
              <SelectItem value="order">Product Purchases</SelectItem>
              <SelectItem value="subscription">Subscriptions</SelectItem>
              <SelectItem value="freelancer_plan">Freelancer Plans</SelectItem>
              <SelectItem value="banner_payment">Advertisements</SelectItem>
              <SelectItem value="certificate">Certificates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        {displayedReceipts.map((receipt) => {
          const typeConfig = receiptTypeConfig[receipt.receiptType];
          const TypeIcon = typeConfig.icon;
          const statusConfig = deliveryStatusConfig[receipt.deliveryStatus];
          const StatusIcon = statusConfig.icon;

          return (
            <Card 
              key={receipt.id} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${compact ? '' : ''}`}
              onClick={() => setSelectedReceipt(receipt)}
              data-testid={`card-receipt-${receipt.id}`}
            >
              <CardContent className={compact ? "p-3" : "p-4"}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${typeConfig.color.split(' ')[0]}`}>
                      <TypeIcon className={`h-4 w-4 ${typeConfig.color.split(' ').slice(1).join(' ')}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm truncate">{typeConfig.label}</h3>
                        <Badge variant="outline" className="text-xs font-mono">
                          {receipt.receiptNumber}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(receipt.issuedAt).toLocaleDateString()}</span>
                        <span className="mx-1">•</span>
                        <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                        <span className={statusConfig.color}>{statusConfig.label}</span>
                      </div>
                      {!compact && receipt.items?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {receipt.items.map(i => i.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-primary">{formatCurrency(receipt.amount, receipt.currency)}</p>
                    {!compact && (
                      <div className="flex gap-1 mt-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(receipt.id);
                          }}
                          data-testid={`button-download-${receipt.id}`}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            resendMutation.mutate(receipt.id);
                          }}
                          disabled={resendMutation.isPending}
                          data-testid={`button-resend-${receipt.id}`}
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {maxItems && filteredReceipts.length > maxItems && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => setShowAll(!showAll)}
          data-testid="button-toggle-all-receipts"
        >
          {showAll ? 'Show Less' : `View All (${filteredReceipts.length})`}
        </Button>
      )}

      <ReceiptDetailModal
        receipt={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        onDownload={() => selectedReceipt && handleDownload(selectedReceipt.id)}
        onResend={() => selectedReceipt && resendMutation.mutate(selectedReceipt.id)}
        isDownloading={false}
        isResending={resendMutation.isPending}
      />
    </div>
  );
}
