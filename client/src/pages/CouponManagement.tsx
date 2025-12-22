import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Ticket,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderAmount: string | null;
  maxDiscount: string | null;
  startDate: string | null;
  endDate: string | null;
  totalUsageLimit: number | null;
  perUserLimit: number | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CouponFormData {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderAmount: string;
  maxDiscount: string;
  startDate: string;
  endDate: string;
  totalUsageLimit: string;
  perUserLimit: string;
  isActive: boolean;
}

const initialFormData: CouponFormData = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscount: '',
  startDate: '',
  endDate: '',
  totalUsageLimit: '',
  perUserLimit: '',
  isActive: true,
};

export function CouponManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(initialFormData);
  const queryClient = useQueryClient();

  // Fetch all coupons - apiRequest unwraps the response automatically
  const { data: couponsData, isLoading } = useQuery<{ coupons: Coupon[], stats: any }>({
    queryKey: ['/api/admin/coupons'],
  });

  // Create coupon mutation
  const createMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      return await apiRequest('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: data.code.toUpperCase(),
          description: data.description || null,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount ? data.minOrderAmount : null,
          maxDiscount: data.maxDiscount ? data.maxDiscount : null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          totalUsageLimit: data.totalUsageLimit ? parseInt(data.totalUsageLimit) : null,
          perUserLimit: data.perUserLimit ? parseInt(data.perUserLimit) : null,
          isActive: data.isActive,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);},
    onError: (error: any) => {},
  });

  // Update coupon mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CouponFormData> }) => {
      return await apiRequest(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          code: data.code?.toUpperCase(),
          description: data.description || null,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount ? data.minOrderAmount : null,
          maxDiscount: data.maxDiscount ? data.maxDiscount : null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          totalUsageLimit: data.totalUsageLimit ? parseInt(data.totalUsageLimit) : null,
          perUserLimit: data.perUserLimit ? parseInt(data.perUserLimit) : null,
          isActive: data.isActive,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      setIsEditDialogOpen(false);
      setEditingCoupon(null);
      setFormData(initialFormData);},
    onError: (error: any) => {},
  });

  // Delete coupon mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });},
    onError: (error: any) => {},
  });

  const handleCreateCoupon = () => {
    createMutation.mutate(formData);
  };

  const handleUpdateCoupon = () => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: formData });
    }
  };

  const handleEditClick = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || '',
      maxDiscount: coupon.maxDiscount || '',
      startDate: coupon.startDate ? format(new Date(coupon.startDate), 'yyyy-MM-dd') : '',
      endDate: coupon.endDate ? format(new Date(coupon.endDate), 'yyyy-MM-dd') : '',
      totalUsageLimit: coupon.totalUsageLimit?.toString() || '',
      perUserLimit: coupon.perUserLimit?.toString() || '',
      isActive: coupon.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);};

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%${coupon.maxDiscount ? ` (max $${coupon.maxDiscount})` : ''}`;
    }
    return `$${coupon.discountValue}`;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="h-8 w-8" />
            Coupon Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage discount coupons for your store</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-create-coupon">
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <CouponForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateCoupon}
              isSubmitting={createMutation.isPending}
              submitLabel="Create Coupon"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {couponsData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Coupons</p>
                  <p className="text-2xl font-bold">{couponsData.stats.totalCoupons}</p>
                </div>
                <Ticket className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{couponsData.stats.activeCoupons}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Uses</p>
                  <p className="text-2xl font-bold">{couponsData.stats.totalUsages}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Discounts</p>
                  <p className="text-2xl font-bold">${couponsData.stats.totalDiscounts || '0.00'}</p>
                </div>
                <DollarSign className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading coupons...</div>
          ) : !couponsData?.coupons?.length ? (
            <div className="text-center py-8 text-gray-500">
              <Ticket className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No coupons yet. Create your first coupon to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {couponsData.coupons.map((coupon: Coupon) => (
                <Card key={coupon.id} className="border-l-4" style={{ borderLeftColor: coupon.isActive ? '#10b981' : '#ef4444' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold font-mono" data-testid={`text-coupon-code-${coupon.id}`}>
                            {coupon.code}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCouponCode(coupon.code)}
                            className="h-6 w-6 p-0"
                            data-testid={`button-copy-${coupon.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {formatDiscount(coupon)}
                          </Badge>
                        </div>
                        {coupon.description && (
                          <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Usage</p>
                            <p className="font-medium">
                              {coupon.usageCount} {coupon.totalUsageLimit ? `/ ${coupon.totalUsageLimit}` : ''}
                            </p>
                          </div>
                          {coupon.minOrderAmount && (
                            <div>
                              <p className="text-gray-500">Min Order</p>
                              <p className="font-medium">${coupon.minOrderAmount}</p>
                            </div>
                          )}
                          {coupon.startDate && (
                            <div>
                              <p className="text-gray-500">Start Date</p>
                              <p className="font-medium">{format(new Date(coupon.startDate), 'MMM dd, yyyy')}</p>
                            </div>
                          )}
                          {coupon.endDate && (
                            <div>
                              <p className="text-gray-500">End Date</p>
                              <p className="font-medium">{format(new Date(coupon.endDate), 'MMM dd, yyyy')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(coupon)}
                          data-testid={`button-edit-${coupon.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
                              deleteMutation.mutate(coupon.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${coupon.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
          </DialogHeader>
          <CouponForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateCoupon}
            isSubmitting={updateMutation.isPending}
            submitLabel="Update Coupon"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Coupon Form Component
function CouponForm({
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  formData: CouponFormData;
  setFormData: (data: CouponFormData) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const updateField = (field: keyof CouponFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="code">Coupon Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
            placeholder="e.g., SAVE20"
            className="uppercase font-mono"
            data-testid="input-code"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Brief description of the coupon"
            data-testid="input-description"
          />
        </div>

        <div>
          <Label htmlFor="discountType">Discount Type *</Label>
          <Select value={formData.discountType} onValueChange={(value) => updateField('discountType', value)}>
            <SelectTrigger data-testid="select-discount-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="discountValue">
            {formData.discountType === 'percentage' ? 'Percentage *' : 'Amount *'}
          </Label>
          <Input
            id="discountValue"
            type="number"
            value={formData.discountValue}
            onChange={(e) => updateField('discountValue', e.target.value)}
            placeholder={formData.discountType === 'percentage' ? '20' : '10.00'}
            data-testid="input-discount-value"
          />
        </div>

        <div>
          <Label htmlFor="minOrderAmount">Minimum Order Amount</Label>
          <Input
            id="minOrderAmount"
            type="number"
            value={formData.minOrderAmount}
            onChange={(e) => updateField('minOrderAmount', e.target.value)}
            placeholder="50.00"
            data-testid="input-min-order"
          />
        </div>

        {formData.discountType === 'percentage' && (
          <div>
            <Label htmlFor="maxDiscount">Maximum Discount Amount</Label>
            <Input
              id="maxDiscount"
              type="number"
              value={formData.maxDiscount}
              onChange={(e) => updateField('maxDiscount', e.target.value)}
              placeholder="100.00"
              data-testid="input-max-discount"
            />
          </div>
        )}

        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
            data-testid="input-start-date"
          />
        </div>

        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
            data-testid="input-end-date"
          />
        </div>

        <div>
          <Label htmlFor="totalUsageLimit">Total Usage Limit</Label>
          <Input
            id="totalUsageLimit"
            type="number"
            value={formData.totalUsageLimit}
            onChange={(e) => updateField('totalUsageLimit', e.target.value)}
            placeholder="100"
            data-testid="input-total-limit"
          />
        </div>

        <div>
          <Label htmlFor="perUserLimit">Per User Limit</Label>
          <Input
            id="perUserLimit"
            type="number"
            value={formData.perUserLimit}
            onChange={(e) => updateField('perUserLimit', e.target.value)}
            placeholder="1"
            data-testid="input-user-limit"
          />
        </div>

        <div className="col-span-2 flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => updateField('isActive', checked)}
            data-testid="switch-is-active"
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <DialogFooter>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !formData.code || !formData.discountValue}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-submit-coupon"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default CouponManagement;
