import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface MembershipPlan {
  id: string;
  planId: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  downloadsLimit: string | null;
  features: string[];
  annualAdLimit: number | null;
  popular: boolean;
  active: boolean;
  displayOrder: number;
}

export default function MembershipPlansManagement() {
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MembershipPlan>>({});

  const { data: plans, isLoading } = useQuery<MembershipPlan[]>({
    queryKey: ['/api/admin/membership-plans'],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<MembershipPlan>) =>
      apiRequest('/api/admin/membership-plans', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/membership-plans'] });setIsDialogOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MembershipPlan> }) =>
      apiRequest(`/api/admin/membership-plans/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/membership-plans'] });setEditingPlan(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/membership-plans/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/membership-plans'] });},
  });

  const handleEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({...plan});
  };

  const handleSave = () => {
    // Properly handle annualAdLimit: null = unlimited, number = limit
    let annualAdLimitValue: number | null = null;
    if (formData.annualAdLimit === '' || 
        formData.annualAdLimit === null || 
        formData.annualAdLimit === undefined) {
      annualAdLimitValue = null; // unlimited
    } else {
      annualAdLimitValue = parseInt(formData.annualAdLimit.toString());
    }

    // Validate and coerce numeric fields
    const sanitizedData = {
      ...formData,
      monthlyPrice: parseFloat(formData.monthlyPrice || '0').toFixed(2),
      yearlyPrice: parseFloat(formData.yearlyPrice || '0').toFixed(2),
      displayOrder: parseInt(formData.displayOrder?.toString() || '0'),
      annualAdLimit: annualAdLimitValue
    };

    // Validate annualAdLimit is non-negative (if not unlimited)
    if (sanitizedData.annualAdLimit !== null && sanitizedData.annualAdLimit < 0) {return;
    }

    // Ensure features is an array
    if (!Array.isArray(sanitizedData.features)) {
      sanitizedData.features = [];
    }

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: sanitizedData });
    } else {
      createMutation.mutate(sanitizedData);
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setFormData({});
    setIsDialogOpen(false);
  };

  const handleCreateNew = () => {
    setEditingPlan(null);
    setFormData({
      planId: '',
      name: '',
      description: '',
      monthlyPrice: '0.00',
      yearlyPrice: '0.00',
      downloadsLimit: '',
      features: [],
      annualAdLimit: 0,
      popular: false,
      active: true,
      displayOrder: (plans?.length || 0)
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Loading membership plans...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Membership Plans Management</h2>
          <p className="text-gray-600">Manage customer membership plans and pricing</p>
        </div>
        <Button onClick={handleCreateNew} data-testid="button-create-plan">
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <Card key={plan.id} data-testid={`card-plan-${plan.planId}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {plan.name}
                    {plan.popular && (
                      <Badge variant="default" className="bg-primary">Popular</Badge>
                    )}
                    {!plan.active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">{plan.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monthly:</span>
                  <span className="font-semibold">${parseFloat(plan.monthlyPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Yearly:</span>
                  <span className="font-semibold">${parseFloat(plan.yearlyPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Annual Ad Limit:</span>
                  <span className="font-semibold">
                    {plan.annualAdLimit === null ? 'Unlimited' : plan.annualAdLimit}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">Features:</p>
                <ul className="space-y-1">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="text-xs text-gray-600">• {feature}</li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-gray-500">+{plan.features.length - 3} more</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    handleEdit(plan);
                    setIsDialogOpen(true);
                  }}
                  data-testid={`button-edit-${plan.planId}`}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete plan "${plan.name}"?`)) {
                      deleteMutation.mutate(plan.id);
                    }
                  }}
                  data-testid={`button-delete-${plan.planId}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update membership plan details' : 'Add a new membership plan'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan ID</Label>
                <Input
                  value={formData.planId || ''}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  placeholder="e.g., pro, business"
                  disabled={!!editingPlan}
                  data-testid="input-plan-id"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Pro Plan"
                  data-testid="input-name"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plan description"
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.monthlyPrice || ''}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                  data-testid="input-monthly-price"
                />
              </div>
              <div>
                <Label>Yearly Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.yearlyPrice || ''}
                  onChange={(e) => setFormData({ ...formData, yearlyPrice: e.target.value })}
                  data-testid="input-yearly-price"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Downloads Limit</Label>
                <Input
                  value={formData.downloadsLimit || ''}
                  onChange={(e) => setFormData({ ...formData, downloadsLimit: e.target.value })}
                  placeholder="Unlimited downloads"
                  data-testid="input-downloads-limit"
                />
              </div>
              <div>
                <Label>Annual Ad Limit</Label>
                <Input
                  type="number"
                  value={formData.annualAdLimit === null ? '' : formData.annualAdLimit?.toString() || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    annualAdLimit: e.target.value === '' ? null : parseInt(e.target.value) 
                  })}
                  placeholder="Leave empty for unlimited"
                  data-testid="input-annual-ad-limit"
                />
                <p className="text-xs text-gray-500 mt-1">0 = none, empty = unlimited</p>
              </div>
            </div>

            <div>
              <Label>Features (one per line)</Label>
              <Textarea
                value={(formData.features || []).join('\n')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  features: e.target.value.split('\n').filter(f => f.trim()) 
                })}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                rows={5}
                data-testid="input-features"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.popular || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, popular: checked })}
                  data-testid="switch-popular"
                />
                <Label>Popular</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.active ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  data-testid="switch-active"
                />
                <Label>Active</Label>
              </div>
            </div>

            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.displayOrder?.toString() || '0'}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                data-testid="input-display-order"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
