import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Star, 
  Eye, 
  EyeOff,
  DollarSign,
  CheckCircle2,
  XCircle,
  Megaphone,
  Save,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';

// Pricing plan schema for form validation
const pricingPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().min(1, 'Description is required'),
  priceMonthly: z.number().min(0, 'Monthly price must be 0 or greater'),
  priceYearly: z.number().min(0, 'Yearly price must be 0 or greater'),
  currency: z.string().min(3, 'Currency code required (e.g., USD)'),
  billingPeriod: z.enum(['monthly', 'yearly', 'one_time']),
  features: z.string().optional(),
  maxSubjects: z.number().optional(),
  maxMessagesPerDay: z.number().optional(),
  maxCommunityPostsPerDay: z.number().optional(),
  isActive: z.boolean(),
  isPopular: z.boolean(),
  sortOrder: z.number().optional()
});

type PricingPlanForm = z.infer<typeof pricingPlanSchema>;

// Freelancer pricing plan schema for form validation
const freelancerPricingPlanSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().min(1, 'Description is required'),
  badgeColor: z.enum(['blue', 'green', 'orange', 'gray']),
  monthlyPrice: z.number().min(0, 'Monthly price must be 0 or greater').optional(),
  yearlyPrice: z.number().min(0, 'Yearly price must be 0 or greater').optional(),
  lifetimePrice: z.number().min(0, 'Lifetime price must be 0 or greater').optional(),
  billingType: z.enum(['subscription', 'lifetime']),
  features: z.string().optional(),
  popular: z.boolean(),
  active: z.boolean(),
  displayOrder: z.number().optional()
});

type FreelancerPricingPlanForm = z.infer<typeof freelancerPricingPlanSchema>;

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  billingPeriod: string;
  features?: string[];
  limitations?: any;
  maxSubjects?: number;
  maxMessagesPerDay?: number;
  maxCommunityPostsPerDay?: number;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BannerPricingConfig {
  id: string;
  targetingType: 'local' | 'global';
  durationDays: number;
  price: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PricingManagement: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isEditFreelancerDialogOpen, setIsEditFreelancerDialogOpen] = useState(false);
  const [selectedFreelancerPlan, setSelectedFreelancerPlan] = useState<any | null>(null);
  const [editingBannerPrice, setEditingBannerPrice] = useState<string | null>(null);
  const [bannerPriceValue, setBannerPriceValue] = useState('');
  const queryClient = useQueryClient();

  // Fetch pricing plans
  const { data: pricingPlans = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/pricing-plans'],
    queryFn: async () => {
      try {
        const sessionId = localStorage.getItem('sessionId');
        const response = await fetch('/api/admin/pricing-plans', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('🎯 Pricing plans API response:', result);
        
        if (result.success && result.data) {
          console.log('🎯 Found pricing plans:', result.data.length);
          return result.data;
        } else {
          console.log('🎯 No data in response:', result);
          return [];
        }
      } catch (error) {
        console.error('🚨 Error fetching pricing plans:', error);
        throw error;
      }
    }
  });

  // Fetch customer membership plans
  const { data: membershipPlans = [], isLoading: membershipLoading } = useQuery({
    queryKey: ['/api/admin/membership-plans'],
    queryFn: async () => {
      try {
        const sessionId = localStorage.getItem('sessionId');
        const response = await fetch('/api/admin/membership-plans', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('🎯 Membership plans API response:', result);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('🚨 Error fetching membership plans:', error);
        return [];
      }
    }
  });

  // Fetch freelancer pricing plans
  const { data: freelancerPlans = [], isLoading: freelancerLoading } = useQuery({
    queryKey: ['/api/admin/freelancer-pricing-plans'],
    queryFn: async () => {
      try {
        const sessionId = localStorage.getItem('sessionId');
        const response = await fetch('/api/admin/freelancer-pricing-plans', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('🎯 Freelancer pricing plans API response:', result);
        
        if (result.success && result.data) {
          return result.data;
        } else {
          return [];
        }
      } catch (error) {
        console.error('🚨 Error fetching freelancer pricing plans:', error);
        throw error;
      }
    }
  });

  // Fetch banner pricing configurations
  const { data: bannerPricing = [], isLoading: bannerLoading } = useQuery({
    queryKey: ['/api/ads/pricing-config'],
    queryFn: async () => {
      try {
        const sessionId = localStorage.getItem('sessionId');
        const response = await fetch('/api/ads/pricing-config', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('🎯 Banner pricing API response:', result);
        
        if (result.success && result.data) {
          return result.data;
        } else {
          return [];
        }
      } catch (error) {
        console.error('🚨 Error fetching banner pricing:', error);
        throw error;
      }
    }
  });

  // Create pricing plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: PricingPlanForm) => {
      const features = data.features ? data.features.split('\n').filter(f => f.trim()) : [];
      const response = await apiRequest('/api/admin/pricing-plans', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          features
        })
      });
      if (!response.ok) throw new Error('Failed to create pricing plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-plans'] });
      setIsCreateDialogOpen(false);},
    onError: (error: any) => {}
  });

  // Update pricing plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PricingPlanForm }) => {
      const features = data.features ? data.features.split('\n').filter(f => f.trim()) : [];
      const response = await apiRequest(`/api/admin/pricing-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          features
        })
      });
      if (!response.ok) throw new Error('Failed to update pricing plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-plans'] });
      setIsEditDialogOpen(false);
      setSelectedPlan(null);},
    onError: (error: any) => {}
  });

  // Delete pricing plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/pricing-plans/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete pricing plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-plans'] });},
    onError: (error: any) => {}
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/pricing-plans/${id}/toggle`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to toggle plan status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-plans'] });},
    onError: (error: any) => {}
  });

  // Toggle popular status mutation
  const togglePopularMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/pricing-plans/${id}/popular`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to toggle popular status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-plans'] });},
    onError: (error: any) => {}
  });

  // Update banner pricing mutation
  const updateBannerPricingMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/ads/pricing-config/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify({ price })
      });
      if (!response.ok) throw new Error('Failed to update banner pricing');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ads/pricing-config'] });
      setEditingBannerPrice(null);
      setBannerPriceValue('');},
    onError: (error: any) => {}
  });

  // Delete banner pricing mutation
  const deleteBannerPricingMutation = useMutation({
    mutationFn: async (id: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/ads/pricing-config/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete banner pricing');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ads/pricing-config'] });},
    onError: (error: any) => {}
  });

  // Freelancer pricing plan mutations
  const createFreelancerPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/admin/freelancer-pricing-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create freelancer pricing plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/freelancer-pricing-plans'] });},
    onError: (error: any) => {}
  });

  const updateFreelancerPlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/admin/freelancer-pricing-plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update freelancer pricing plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/freelancer-pricing-plans'] });
      setIsEditFreelancerDialogOpen(false);
      setSelectedFreelancerPlan(null);
    },
    onError: (error: any) => {}
  });

  const deleteFreelancerPlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/admin/freelancer-pricing-plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete freelancer pricing plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/freelancer-pricing-plans'] });},
    onError: (error: any) => {}
  });

  // Form setup
  const createForm = useForm<PricingPlanForm>({
    resolver: zodResolver(pricingPlanSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'USD',
      billingPeriod: 'monthly',
      features: '',
      isActive: true,
      isPopular: false,
      sortOrder: 0
    }
  });

  const editForm = useForm<PricingPlanForm>({
    resolver: zodResolver(pricingPlanSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'USD',
      billingPeriod: 'monthly',
      features: '',
      isActive: true,
      isPopular: false,
      sortOrder: 0
    }
  });

  const editFreelancerForm = useForm<FreelancerPricingPlanForm>({
    resolver: zodResolver(freelancerPricingPlanSchema),
    defaultValues: {
      planId: '',
      name: '',
      description: '',
      badgeColor: 'blue',
      monthlyPrice: 0,
      yearlyPrice: 0,
      lifetimePrice: 0,
      billingType: 'subscription',
      features: '',
      popular: false,
      active: true,
      displayOrder: 0
    }
  });

  const handleEditPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    editForm.reset({
      name: plan.name || '',
      displayName: plan.displayName || '',
      description: plan.description || '',
      priceMonthly: plan.priceMonthly || 0,
      priceYearly: plan.priceYearly || 0,
      currency: plan.currency || 'USD',
      billingPeriod: plan.billingPeriod as 'monthly' | 'yearly' | 'one_time',
      features: plan.features?.join('\n') || '',
      maxSubjects: plan.maxSubjects || undefined,
      maxMessagesPerDay: plan.maxMessagesPerDay || undefined,
      maxCommunityPostsPerDay: plan.maxCommunityPostsPerDay || undefined,
      isActive: plan.isActive || false,
      isPopular: plan.isPopular || false,
      sortOrder: plan.sortOrder || 0
    });
    setIsEditDialogOpen(true);
  };

  const onCreateSubmit = (data: PricingPlanForm) => {
    createPlanMutation.mutate(data);
  };

  const onUpdateSubmit = (data: PricingPlanForm) => {
    if (!selectedPlan) return;
    updatePlanMutation.mutate({ id: selectedPlan.id, data });
  };

  const handleEditFreelancerPlan = (plan: any) => {
    setSelectedFreelancerPlan(plan);
    editFreelancerForm.reset({
      planId: plan.planId || '',
      name: plan.name || '',
      description: plan.description || '',
      badgeColor: plan.badgeColor || 'blue',
      monthlyPrice: plan.monthlyPrice ? parseFloat(plan.monthlyPrice) : 0,
      yearlyPrice: plan.yearlyPrice ? parseFloat(plan.yearlyPrice) : 0,
      lifetimePrice: plan.lifetimePrice ? parseFloat(plan.lifetimePrice) : 0,
      billingType: plan.billingType || 'subscription',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      popular: plan.popular || false,
      active: plan.active || false,
      displayOrder: plan.displayOrder || 0
    });
    setIsEditFreelancerDialogOpen(true);
  };

  const onUpdateFreelancerSubmit = (data: FreelancerPricingPlanForm) => {
    if (!selectedFreelancerPlan) return;
    const features = data.features ? data.features.split('\n').filter(f => f.trim()) : [];
    const updateData = {
      planId: data.planId,
      name: data.name,
      description: data.description,
      badgeColor: data.badgeColor,
      monthlyPrice: data.monthlyPrice || null,
      yearlyPrice: data.yearlyPrice || null,
      lifetimePrice: data.lifetimePrice || null,
      billingType: data.billingType,
      features,
      popular: data.popular,
      active: data.active,
      displayOrder: data.displayOrder || 0
    };
    updateFreelancerPlanMutation.mutate({ id: selectedFreelancerPlan.id, data: updateData });
  };

  const handleDeletePlan = (id: string) => {
    if (confirm('Are you sure you want to delete this pricing plan? This action cannot be undone.')) {
      deletePlanMutation.mutate(id);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatBannerPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(price));
  };

  const handleBannerPriceEdit = (config: BannerPricingConfig) => {
    setEditingBannerPrice(config.id);
    setBannerPriceValue(config.price);
  };

  const handleBannerPriceSave = (configId: string) => {
    const price = parseFloat(bannerPriceValue);
    if (isNaN(price) || price <= 0) {return;
    }
    updateBannerPricingMutation.mutate({ id: configId, price });
  };

  const handleBannerPriceKeyDown = (e: React.KeyboardEvent, configId: string) => {
    if (e.key === 'Enter') {
      handleBannerPriceSave(configId);
    } else if (e.key === 'Escape') {
      handleBannerPriceCancel();
    }
  };

  const handleBannerPriceCancel = () => {
    setEditingBannerPrice(null);
    setBannerPriceValue('');
  };

  const handleBannerPriceDelete = (configId: string, targetingType: string, durationDays: number) => {
    if (window.confirm(`Are you sure you want to delete the ${targetingType} targeting pricing for ${durationDays} days? This action cannot be undone.`)) {
      deleteBannerPricingMutation.mutate(configId);
    }
  };

  if (isLoading || membershipLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading plans...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total plans count
  const totalPlans = pricingPlans.length + membershipPlans.length;

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Pricing Plans Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage all pricing plans - customer memberships and subscriptions ({totalPlans} total)
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="hover:bg-[#3ae66c] bg-[#f64e3c] text-[#ffffff] w-full sm:w-auto"
              data-testid="create-pricing-plan-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Add Pricing Plan</span>
              <span className="xs:hidden">Add Plan</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Pricing Plan</DialogTitle>
              <DialogDescription>
                Configure a new subscription plan with pricing, features, and limits.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name (Internal)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., basic_plan" {...field} data-testid="input-plan-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Basic Plan" {...field} data-testid="input-display-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="priceMonthly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-monthly-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="priceYearly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yearly Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                    control={createForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input placeholder="USD" {...field} data-testid="input-plan-currency" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="billingPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Period</FormLabel>
                        <FormControl>
                          <select 
                            {...field} 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            data-testid="select-billing-period"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="one_time">One-time</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
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
                <FormField
                  control={createForm.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features (one per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={`Access to basic lessons\nEmail support\nMobile app access`}
                          rows={5}
                          {...field} 
                          data-testid="textarea-plan-features"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="maxSubjects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Subjects (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Unlimited" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-max-subjects"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="maxMessagesPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Messages/Day (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Unlimited" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-max-messages"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="maxCommunityPostsPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Posts/Day (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Unlimited" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-max-posts"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                          data-testid="input-sort-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center space-x-4">
                  <FormField
                    control={createForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-plan-active"
                          />
                        </FormControl>
                        <FormLabel>Active Plan</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="isPopular"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-plan-popular"
                          />
                        </FormControl>
                        <FormLabel>Popular Plan</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary text-white"
                    disabled={createPlanMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* All Plans Grid - Customer Membership Plans & Subscription Plans */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Customer Membership Plans */}
        {membershipPlans.map((plan: any) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Customer Membership
                </Badge>
              </div>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div className="flex-1">
                  <CardTitle className="text-base sm:text-lg">{plan.name}</CardTitle>
                  <div className="text-xs sm:text-sm text-muted-foreground">{plan.planId}</div>
                  <div className="flex flex-col mt-2">
                    <div className="flex items-baseline">
                      <span className="text-base sm:text-lg font-bold">${parseFloat(plan.monthlyPrice).toFixed(2)}</span>
                      <span className="text-muted-foreground ml-1 text-xs sm:text-sm">/month</span>
                    </div>
                    {plan.yearlyPrice && parseFloat(plan.yearlyPrice) > 0 && (
                      <div className="flex items-baseline">
                        <span className="text-base sm:text-lg font-bold">${parseFloat(plan.yearlyPrice).toFixed(2)}</span>
                        <span className="text-muted-foreground ml-1 text-xs sm:text-sm">/year</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 self-start">
                  <Badge variant={plan.active ? 'default' : 'secondary'} className="text-xs">
                    {plan.active ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {plan.features && plan.features.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle2 className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(plan.downloadsLimit || plan.annualAdLimit !== null) && (
                <div className="mb-4 text-sm">
                  <h4 className="font-medium mb-1">Limits:</h4>
                  <div className="text-muted-foreground space-y-1">
                    {plan.downloadsLimit && (
                      <div>Downloads: {plan.downloadsLimit}</div>
                    )}
                    {plan.annualAdLimit !== null && plan.annualAdLimit !== undefined && (
                      <div>Annual Ads: {plan.annualAdLimit === 0 ? 'None' : plan.annualAdLimit || 'Unlimited'}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground mb-4">
                Display Order: {plan.displayOrder || 0}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Subscription Pricing Plans */}
        {pricingPlans.map((plan: PricingPlan) => (
          <Card key={plan.id} className={`relative ${plan.isPopular ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-purple-50 text-primary border-purple-200">
                  Subscription Plan
                </Badge>
              </div>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div className="flex-1">
                  <CardTitle className="text-base sm:text-lg">{plan.displayName}</CardTitle>
                  <div className="text-xs sm:text-sm text-muted-foreground">{plan.name}</div>
                  <div className="flex flex-col mt-2">
                    <div className="flex items-baseline">
                      <span className="text-base sm:text-lg font-bold">{formatPrice(plan.priceMonthly, plan.currency)}</span>
                      <span className="text-muted-foreground ml-1 text-xs sm:text-sm">/month</span>
                    </div>
                    {plan.priceYearly > 0 && (
                      <div className="flex items-baseline">
                        <span className="text-base sm:text-lg font-bold">{formatPrice(plan.priceYearly, plan.currency)}</span>
                        <span className="text-muted-foreground ml-1 text-xs sm:text-sm">/year</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 self-start">
                  <Badge variant={plan.isActive ? 'default' : 'secondary'} className="text-xs">
                    {plan.isActive ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {plan.features && plan.features.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle2 className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(plan.maxSubjects || plan.maxMessagesPerDay || plan.maxCommunityPostsPerDay) && (
                <div className="mb-4 text-sm">
                  <h4 className="font-medium mb-1">Limits:</h4>
                  <div className="text-muted-foreground space-y-1">
                    {plan.maxSubjects && (
                      <div>Max Subjects: {plan.maxSubjects}</div>
                    )}
                    {plan.maxMessagesPerDay && (
                      <div>Max Messages/Day: {plan.maxMessagesPerDay}</div>
                    )}
                    {plan.maxCommunityPostsPerDay && (
                      <div>Max Posts/Day: {plan.maxCommunityPostsPerDay}</div>
                    )}
                  </div>
                </div>
              )}

              <Separator className="my-4" />
              
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActiveMutation.mutate(plan.id)}
                    disabled={toggleActiveMutation.isPending}
                    data-testid={`button-toggle-active-${plan.id}`}
                  >
                    {plan.isActive ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        <span className="hidden xs:inline">Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="hidden xs:inline">Show</span>
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePopularMutation.mutate(plan.id)}
                    disabled={togglePopularMutation.isPending}
                    data-testid={`button-toggle-popular-${plan.id}`}
                  >
                    <Star className={`h-3 w-3 mr-1 ${plan.isPopular ? 'fill-current' : ''}`} />
                    <span className="hidden xs:inline">{plan.isPopular ? 'Unmark' : 'Mark'} Popular</span>
                  </Button>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditPlan(plan)}
                    data-testid={`button-edit-${plan.id}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeletePlan(plan.id)}
                    disabled={deletePlanMutation.isPending}
                    className="text-primary hover:text-primary"
                    data-testid={`button-delete-${plan.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPlans === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No plans found</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating customer membership plans or subscription pricing plans
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="hover:bg-[#3ae66c] bg-[#f64e3c] text-[#ffffff] w-full sm:w-auto"
              data-testid="button-create-first-plan"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Banner Pricing Management */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Banner Advertisement Pricing
            </h2>
            <p className="text-muted-foreground">
              Configure pricing for banner advertisements based on targeting and duration
            </p>
          </div>
        </div>

        {bannerLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading banner pricing...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bannerPricing.map((config: BannerPricingConfig) => (
              <Card key={config.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {config.targetingType} Targeting
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {config.durationDays} days duration
                      </div>
                      <div className="flex items-baseline mt-2">
                        {editingBannerPrice === config.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={bannerPriceValue}
                              onChange={(e) => setBannerPriceValue(e.target.value)}
                              onKeyDown={(e) => handleBannerPriceKeyDown(e, config.id)}
                              className="w-24 h-8"
                              placeholder="0.00"
                              autoFocus
                              data-testid={`input-banner-price-${config.id}`}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleBannerPriceSave(config.id)}
                              disabled={updateBannerPricingMutation.isPending}
                              data-testid={`button-save-banner-price-${config.id}`}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleBannerPriceCancel}
                              disabled={updateBannerPricingMutation.isPending}
                              data-testid={`button-cancel-banner-price-${config.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">
                              {formatBannerPrice(config.price)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBannerPriceEdit(config)}
                              data-testid={`button-edit-banner-price-${config.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBannerPriceDelete(config.id, config.targetingType, config.durationDays)}
                              disabled={deleteBannerPricingMutation.isPending}
                              data-testid={`button-delete-banner-price-${config.id}`}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={config.isActive ? 'default' : 'secondary'}>
                      {config.isActive ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm text-muted-foreground">
                    <div>Updated: {new Date(config.updatedAt).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {bannerPricing.length === 0 && !bannerLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No banner pricing configurations found</h3>
              <p className="text-muted-foreground">
                Banner pricing configurations need to be set up in the database
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Freelancer Pricing Plans Management */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Freelancer Pricing Plans
            </h2>
            <p className="text-muted-foreground">
              Configure pricing plans for freelancers with different tiers and features
            </p>
          </div>
        </div>

        {freelancerLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading freelancer pricing plans...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {freelancerPlans.map((plan: any) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="outline" 
                      className={`${
                        plan.badgeColor === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        plan.badgeColor === 'green' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        plan.badgeColor === 'orange' ? 'bg-primary/10 text-orange-700 border-orange-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {plan.billingType === 'lifetime' ? 'Lifetime Plan' : 'Subscription'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">{plan.planId}</div>
                  <div className="flex flex-col mt-2">
                    {plan.billingType === 'lifetime' && plan.lifetimePrice && (
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold">${plan.lifetimePrice}</span>
                        <span className="text-muted-foreground ml-1 text-sm">one-time</span>
                      </div>
                    )}
                    {plan.billingType === 'subscription' && (
                      <>
                        {plan.monthlyPrice && (
                          <div className="flex items-baseline">
                            <span className="text-lg font-bold">${plan.monthlyPrice}</span>
                            <span className="text-muted-foreground ml-1 text-sm">/month</span>
                          </div>
                        )}
                        {plan.yearlyPrice && (
                          <div className="flex items-baseline">
                            <span className="text-lg font-bold">${plan.yearlyPrice}</span>
                            <span className="text-muted-foreground ml-1 text-sm">/year</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  {plan.features && plan.features.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Features:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {plan.features.slice(0, 3).map((feature: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle2 className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-xs text-muted-foreground">+ {plan.features.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <Separator className="my-4" />
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.active ? 'default' : 'secondary'} className="text-xs">
                      {plan.active ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditFreelancerPlan(plan)}
                        data-testid={`button-edit-freelancer-plan-${plan.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this freelancer pricing plan?')) {
                            deleteFreelancerPlanMutation.mutate(plan.id);
                          }
                        }}
                        disabled={deleteFreelancerPlanMutation.isPending}
                        className="text-primary hover:text-primary"
                        data-testid={`button-delete-freelancer-plan-${plan.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {freelancerPlans.length === 0 && !freelancerLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No freelancer pricing plans found</h3>
              <p className="text-muted-foreground">
                Freelancer pricing plans will appear here once created
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pricing Plan</DialogTitle>
            <DialogDescription>
              Modify the pricing plan details, features, and settings.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Basic Plan" {...field} value={field.value || ''} data-testid="input-edit-plan-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Basic Plan" {...field} value={field.value || ''} data-testid="input-edit-display-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="priceMonthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) || 0 : 0)}
                          data-testid="input-edit-monthly-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="priceYearly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yearly Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) || 0 : 0)}
                          data-testid="input-edit-yearly-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="USD" {...field} value={field.value || ''} data-testid="input-edit-plan-currency" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="billingPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Period</FormLabel>
                      <FormControl>
                        <select 
                          {...field} 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          data-testid="select-edit-billing-period"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                          <option value="one_time">One Time</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the plan" 
                        {...field}
                        value={field.value || ''}
                        data-testid="textarea-edit-plan-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features (one per line)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={`Access to basic lessons\nEmail support\nMobile app access`}
                        rows={5}
                        {...field}
                        value={field.value || ''}
                        data-testid="textarea-edit-plan-features"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="maxSubjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Subjects (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Unlimited" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) || undefined : undefined)}
                          data-testid="input-edit-max-subjects"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="maxMessagesPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Messages/Day (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Unlimited" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) || undefined : undefined)}
                          data-testid="input-edit-max-messages"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="maxCommunityPostsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Posts/Day (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Unlimited" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) || undefined : undefined)}
                          data-testid="input-edit-max-posts"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Plan</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Plan is available for new subscriptions
                        </div>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value ? "default" : "secondary"}
                          size="sm"
                          onClick={() => field.onChange(!field.value)}
                          className={field.value ? "bg-primary hover:bg-primary text-white" : ""}
                        >
                          {field.value ? "Active" : "Inactive"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Popular Plan</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Mark as popular/recommended plan
                        </div>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value ? "default" : "secondary"}
                          size="sm"
                          onClick={() => field.onChange(!field.value)}
                          className={field.value ? "bg-primary hover:bg-primary text-white" : ""}
                        >
                          {field.value ? "Popular" : "Normal"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-edit-sort-order"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedPlan(null);
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary text-white"
                  disabled={updatePlanMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updatePlanMutation.isPending ? 'Updating...' : 'Update Plan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Freelancer Pricing Plan Dialog */}
      <Dialog open={isEditFreelancerDialogOpen} onOpenChange={setIsEditFreelancerDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Freelancer Pricing Plan</DialogTitle>
            <DialogDescription>
              Modify the freelancer pricing plan details, features, and settings.
            </DialogDescription>
          </DialogHeader>
          <Form {...editFreelancerForm}>
            <form onSubmit={editFreelancerForm.handleSubmit(onUpdateFreelancerSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editFreelancerForm.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., starter" {...field} value={field.value || ''} data-testid="input-edit-freelancer-plan-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editFreelancerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Starter" {...field} value={field.value || ''} data-testid="input-edit-freelancer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editFreelancerForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the plan" 
                        {...field}
                        value={field.value || ''}
                        data-testid="textarea-edit-freelancer-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editFreelancerForm.control}
                  name="badgeColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Badge Color</FormLabel>
                      <FormControl>
                        <select 
                          {...field} 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          data-testid="select-edit-freelancer-badge-color"
                        >
                          <option value="blue">Blue</option>
                          <option value="green">Green</option>
                          <option value="orange">Orange</option>
                          <option value="gray">Gray</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editFreelancerForm.control}
                  name="billingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Type</FormLabel>
                      <FormControl>
                        <select 
                          {...field} 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          data-testid="select-edit-freelancer-billing-type"
                        >
                          <option value="subscription">Subscription</option>
                          <option value="lifetime">Lifetime</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editFreelancerForm.control}
                  name="monthlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) || 0 : 0)}
                          data-testid="input-edit-freelancer-monthly-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editFreelancerForm.control}
                  name="yearlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yearly Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) || 0 : 0)}
                          data-testid="input-edit-freelancer-yearly-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editFreelancerForm.control}
                  name="lifetimePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lifetime Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) || 0 : 0)}
                          data-testid="input-edit-freelancer-lifetime-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editFreelancerForm.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features (one per line)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={`Verified Blue Badge on your profile\nAppear in top search results\nAccess to freelance projects`}
                        rows={5}
                        {...field}
                        value={field.value || ''}
                        data-testid="textarea-edit-freelancer-features"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editFreelancerForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) || 0 : 0)}
                          data-testid="input-edit-freelancer-display-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editFreelancerForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Plan is visible
                        </div>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value ? "default" : "secondary"}
                          size="sm"
                          onClick={() => field.onChange(!field.value)}
                          className={field.value ? "bg-primary hover:bg-primary text-white" : ""}
                          data-testid="button-edit-freelancer-active"
                        >
                          {field.value ? "Active" : "Inactive"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editFreelancerForm.control}
                  name="popular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Popular</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Recommended
                        </div>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value ? "default" : "secondary"}
                          size="sm"
                          onClick={() => field.onChange(!field.value)}
                          className={field.value ? "bg-primary hover:bg-primary text-white" : ""}
                          data-testid="button-edit-freelancer-popular"
                        >
                          {field.value ? "Popular" : "Normal"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditFreelancerDialogOpen(false);
                    setSelectedFreelancerPlan(null);
                  }}
                  data-testid="button-cancel-edit-freelancer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary text-white"
                  disabled={updateFreelancerPlanMutation.isPending}
                  data-testid="button-submit-edit-freelancer"
                >
                  {updateFreelancerPlanMutation.isPending ? 'Updating...' : 'Update Plan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManagement;
