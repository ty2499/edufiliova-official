import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Save, Loader2, Plus, Trash2, Upload, Image as ImageIcon
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const serviceSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const packageSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number().min(5, 'Minimum price is $5'),
  deliveryDays: z.number().min(1),
  revisions: z.number().min(0),
  features: z.array(z.string()),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const CATEGORIES = [
  'Graphics & Design',
  'Digital Marketing',
  'Writing & Translation',
  'Video & Animation',
  'Programming & Tech',
  'Business',
  'Music & Audio',
  'Education & Tutoring',
];

export default function FreelancerServiceFormPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/dashboard/freelancer/services/:id/edit');
  const { toast } = useToast();
  const isEditing = !!params?.id;
  const serviceId = params?.id;

  const [images, setImages] = useState<string[]>([]);
  const [packages, setPackages] = useState({
    basic: { name: 'Basic', description: '', price: 25, deliveryDays: 7, revisions: 1, features: [''] },
    standard: { name: 'Standard', description: '', price: 50, deliveryDays: 5, revisions: 2, features: [''] },
    premium: { name: 'Premium', description: '', price: 100, deliveryDays: 3, revisions: 3, features: [''] },
  });
  const [addOns, setAddOns] = useState<Array<{ title: string; description: string; price: number }>>([]);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      subcategory: '',
      tags: [],
    },
  });

  const { data: serviceData, isLoading: isLoadingService } = useQuery({
    queryKey: ['/api/freelancer/services', serviceId],
    queryFn: () => apiRequest(`/api/freelancer/services/${serviceId}`),
    enabled: isEditing,
  });

  useEffect(() => {
    if (serviceData?.service) {
      const s = serviceData.service;
      form.reset({
        title: s.title,
        description: s.description,
        category: s.category,
        subcategory: s.subcategory || '',
        tags: s.tags || [],
      });
      setImages(s.images || []);
      if (s.packages) setPackages(s.packages);
      if (s.addOns) setAddOns(s.addOns);
    }
  }, [serviceData]);

  const saveMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const payload = {
        ...data,
        images,
        packages,
        addOns,
      };
      if (isEditing) {
        return apiRequest(`/api/freelancer/services/${serviceId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      return apiRequest('/api/freelancer/services', {
        method: 'POST',
        body: JSON.stringify({ ...payload, status: 'draft' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/services/my'] });
      toast({ title: isEditing ? 'Service updated!' : 'Service created!' });
      navigate('/dashboard/freelancer/services');
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to save service', variant: 'destructive' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const payload = {
        ...data,
        images,
        packages,
        addOns,
        status: 'published',
      };
      if (isEditing) {
        return apiRequest(`/api/freelancer/services/${serviceId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      return apiRequest('/api/freelancer/services', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/services/my'] });
      toast({ title: 'Service published!' });
      navigate('/dashboard/freelancer/services');
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Failed to publish', variant: 'destructive' });
    },
  });

  const updatePackage = (tier: string, field: string, value: any) => {
    setPackages(prev => ({
      ...prev,
      [tier]: { ...prev[tier as keyof typeof prev], [field]: value }
    }));
  };

  const updatePackageFeature = (tier: string, index: number, value: string) => {
    setPackages(prev => {
      const pkg = prev[tier as keyof typeof prev];
      const features = [...pkg.features];
      features[index] = value;
      return { ...prev, [tier]: { ...pkg, features } };
    });
  };

  const addPackageFeature = (tier: string) => {
    setPackages(prev => {
      const pkg = prev[tier as keyof typeof prev];
      return { ...prev, [tier]: { ...pkg, features: [...pkg.features, ''] } };
    });
  };

  if (isLoadingService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0c332c]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/freelancer/services')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Service' : 'Create New Service'}
            </h1>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Title</FormLabel>
                      <FormControl>
                        <Input placeholder="I will design a professional logo for your business" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Logo Design" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your service in detail..."
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6"
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <label className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Add Image</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setImages(prev => [...prev, reader.result as string]);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="standard">Standard</TabsTrigger>
                    <TabsTrigger value="premium">Premium</TabsTrigger>
                  </TabsList>
                  {(['basic', 'standard', 'premium'] as const).map(tier => (
                    <TabsContent key={tier} value={tier} className="space-y-4 mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">Price ($)</label>
                          <Input
                            type="number"
                            min={5}
                            value={packages[tier].price}
                            onChange={(e) => updatePackage(tier, 'price', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Delivery (days)</label>
                          <Input
                            type="number"
                            min={1}
                            value={packages[tier].deliveryDays}
                            onChange={(e) => updatePackage(tier, 'deliveryDays', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Revisions</label>
                          <Input
                            type="number"
                            min={0}
                            value={packages[tier].revisions}
                            onChange={(e) => updatePackage(tier, 'revisions', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Package Description</label>
                        <Textarea
                          value={packages[tier].description}
                          onChange={(e) => updatePackage(tier, 'description', e.target.value)}
                          placeholder="What's included in this package..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Features</label>
                        {packages[tier].features.map((feature, idx) => (
                          <div key={idx} className="flex gap-2 mb-2">
                            <Input
                              value={feature}
                              onChange={(e) => updatePackageFeature(tier, idx, e.target.value)}
                              placeholder="Feature included..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPackages(prev => {
                                  const pkg = prev[tier];
                                  return { ...prev, [tier]: { ...pkg, features: pkg.features.filter((_, i) => i !== idx) } };
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addPackageFeature(tier)}>
                          <Plus className="w-4 h-4 mr-1" /> Add Feature
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={form.handleSubmit((data) => saveMutation.mutate(data))}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save as Draft
              </Button>
              <Button
                type="button"
                className="bg-[#0c332c] hover:bg-[#0c332c]/90"
                onClick={form.handleSubmit((data) => publishMutation.mutate(data))}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Publish Service
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
