import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Star,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import type { ShopMembershipPlan } from '@shared/schema';

const membershipPlanSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  monthlyPrice: z.coerce.number().min(0, 'Monthly price must be 0 or greater'),
  yearlyPrice: z.coerce.number().min(0, 'Yearly price must be 0 or greater'),
  downloadsLimit: z.string().optional(),
  features: z.string().min(1, 'At least one feature is required'),
  annualAdLimit: z.coerce.number().min(0, 'Ad limit must be 0 or greater').nullable().optional(),
  popular: z.boolean().optional(),
  active: z.boolean().optional(),
  displayOrder: z.coerce.number().optional(),
});

type MembershipPlanForm = z.infer<typeof membershipPlanSchema>;

export default function ShopMembershipManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ShopMembershipPlan | null>(null);
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery<ShopMembershipPlan[]>({
    queryKey: ['/api/admin/membership-plans'],
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: MembershipPlanForm) => {
      const features = data.features.split('\n').filter(f => f.trim());
      return apiRequest('/api/admin/membership-plans', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          features,
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/membership-plans'] });
      setIsCreateDialogOpen(false);},
    onError: (error: any) => {}
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MembershipPlanForm }) => {
      const features = data.features.split('\n').filter(f => f.trim());
      return apiRequest(`/api/admin/membership-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          features,
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/membership-plans'] });
      setIsEditDialogOpen(false);
      setSelectedPlan(null);},
    onError: (error: any) => {}
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/membership-plans/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/membership-plans'] });},
    onError: (error: any) => {}
  });

  const createForm = useForm<MembershipPlanForm>({
    resolver: zodResolver(membershipPlanSchema),
    defaultValues: {
      planId: '',
      name: '',
      description: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      downloadsLimit: '',
      features: '',
      annualAdLimit: null,
      popular: false,
      active: true,
      displayOrder: 0
    }
  });

  const editForm = useForm<MembershipPlanForm>({
    resolver: zodResolver(membershipPlanSchema),
    defaultValues: {
      planId: '',
      name: '',
      description: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      downloadsLimit: '',
      features: '',
      annualAdLimit: null,
      popular: false,
      active: true,
      displayOrder: 0
    }
  });

  const handleEditPlan = (plan: ShopMembershipPlan) => {
    setSelectedPlan(plan);
    editForm.reset({
      planId: plan.planId || '',
      name: plan.name || '',
      description: plan.description || '',
      monthlyPrice: typeof plan.monthlyPrice === 'string' ? parseFloat(plan.monthlyPrice) : (plan.monthlyPrice || 0),
      yearlyPrice: typeof plan.yearlyPrice === 'string' ? parseFloat(plan.yearlyPrice) : (plan.yearlyPrice || 0),
      downloadsLimit: plan.downloadsLimit || '',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      annualAdLimit: plan.annualAdLimit ?? null,
      popular: plan.popular || false,
      active: plan.active ?? true,
      displayOrder: plan.displayOrder || 0
    });
    setIsEditDialogOpen(true);
  };

  const onCreateSubmit = (data: MembershipPlanForm) => {
    createPlanMutation.mutate(data);
  };

  const onUpdateSubmit = (data: MembershipPlanForm) => {
    if (!selectedPlan) return;
    updatePlanMutation.mutate({ id: selectedPlan.id, data });
  };

  const handleDeletePlan = (id: string, planName: string) => {
    if (confirm(`Are you sure you want to delete the "${planName}" plan? This action cannot be undone.`)) {
      deletePlanMutation.mutate(id);
    }
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof price === 'string' ? parseFloat(price) : price);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading membership plans...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const PlanForm = ({ form, onSubmit, isEdit = false }: { form: any; onSubmit: (data: MembershipPlanForm) => void; isEdit?: boolean }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="planId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan ID *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., free, creator, pro" {...field} data-testid="input-plan-id" disabled={isEdit} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Creator Plan" {...field} data-testid="input-plan-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of the plan" 
                  {...field} 
                  data-testid="textarea-plan-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monthlyPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Price *</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="0.00" 
                    {...field}
                    data-testid="input-monthly-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearlyPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yearly Price *</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="0.00" 
                    {...field}
                    data-testid="input-yearly-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="downloadsLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Downloads Limit</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 30 downloads, Unlimited" {...field} data-testid="input-downloads-limit" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="annualAdLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Ad Limit</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Leave empty for unlimited" 
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    data-testid="input-ad-limit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features (one per line) *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3" 
                  rows={5}
                  {...field}
                  data-testid="textarea-features"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  data-testid="input-display-order"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="popular"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Mark as Popular</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    This plan will be highlighted
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-popular"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Show this plan to customers
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-active"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => isEdit ? setIsEditDialogOpen(false) : setIsCreateDialogOpen(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-primary text-white hover:bg-primary" transition-all duration-300
            disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
            data-testid="button-save"
          >
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update Plan' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Shop Membership Plans
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage subscription pricing plans for your shop
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary text-white hover:bg-primary" transition-all duration-300
              data-testid="button-create-plan"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Membership Plan</DialogTitle>
              <DialogDescription>
                Configure a new subscription plan with pricing and features.
              </DialogDescription>
            </DialogHeader>
            <PlanForm form={createForm} onSubmit={onCreateSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">No membership plans created yet</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first plan to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-purple-500 border-2' : ''}`} data-testid={`card-plan-${plan.planId}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-white text-xs px-3 py-1 rounded-bl-lg font-medium flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Popular
                  </div>
                </div>
              )}
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">ID: {plan.planId}</p>
                  </div>
                  <Badge variant={plan.active ? 'default' : 'secondary'}>
                    {plan.active ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    {plan.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-gray-500">Monthly:</span>
                    <span className="text-2xl font-bold">{formatPrice(plan.monthlyPrice)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-gray-500">Yearly:</span>
                    <span className="text-2xl font-bold">{formatPrice(plan.yearlyPrice)}</span>
                  </div>
                </div>
                
                {plan.downloadsLimit && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Downloads: {plan.downloadsLimit}</p>
                  </div>
                )}
                
                {plan.annualAdLimit !== null && plan.annualAdLimit !== undefined && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Annual Ads: {plan.annualAdLimit === 0 ? 'None' : plan.annualAdLimit}</p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold mb-2">Features:</p>
                  <ul className="space-y-1">
                    {(Array.isArray(plan.features) ? plan.features : []).slice(0, 3).map((feature: string, idx: number) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {(Array.isArray(plan.features) ? plan.features : []).length > 3 && (
                      <li className="text-xs text-gray-400">+{(Array.isArray(plan.features) ? plan.features : []).length - 3} more</li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1"
                    data-testid={`button-edit-${plan.planId}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePlan(plan.id, plan.name)}
                    className="flex-1"
                    data-testid={`button-delete-${plan.planId}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Membership Plan</DialogTitle>
            <DialogDescription>
              Update the subscription plan details.
            </DialogDescription>
          </DialogHeader>
          <PlanForm form={editForm} onSubmit={onUpdateSubmit} isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
