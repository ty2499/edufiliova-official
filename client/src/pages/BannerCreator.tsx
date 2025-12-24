import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, DollarSign, MapPin, Calendar, ArrowLeft, CreditCard, XCircle, Shield, BookOpen, Check, X, Loader2, Image as ImageIcon, Target, Globe2, Users, ChevronDown, Wallet } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { CheckmarkIcon } from '@/components/ui/checkmark-icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Base schema without refine for extension
const baseBannerAdSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  targetDashboards: z.array(z.enum(['learner', 'teacher', 'freelancer', 'customer', 'advertise_page'])).min(1, 'Select at least one dashboard'),
  size: z.string().min(1, 'Size is required'),
  durationDays: z.coerce.number().min(1, 'Duration must be at least 1 day').max(90, 'Duration cannot exceed 90 days'),
  targetLocations: z.array(z.string()).optional().nullable(),
  targetGrades: z.array(z.number()).optional().nullable(),
  minAge: z.coerce.number().min(5, 'Minimum age must be at least 5').max(99, 'Age cannot exceed 99').optional().nullable(),
  maxAge: z.coerce.number().min(5, 'Maximum age must be at least 5').max(99, 'Age cannot exceed 99').optional().nullable(),
  guestEmail: z.string().email('Please enter a valid email').or(z.literal('')).optional(),
  guestName: z.string().min(1, 'Name is required for guest checkout').max(100).or(z.literal('')).optional(),
});

// Dynamic schema based on whether user is logged in
const createValidationSchema = (isLoggedIn: boolean) => {
  const baseSchema = isLoggedIn 
    ? baseBannerAdSchema
    : baseBannerAdSchema.extend({
        guestEmail: z.string().email('Please enter a valid email'),
        guestName: z.string().min(1, 'Name is required for guest checkout').max(100),
      });
  
  return baseSchema.refine((data) => {
    if (data.minAge != null && data.maxAge != null && data.minAge !== undefined && data.maxAge !== undefined) {
      return data.minAge <= data.maxAge;
    }
    return true;
  }, {
    message: 'Minimum age must be less than or equal to maximum age',
    path: ['maxAge'],
  });
};

type BannerAdFormData = z.infer<typeof baseBannerAdSchema>;

interface AdPricing {
  id: string;
  adType: string;
  placement: string;
  size: string;
  durationDays: number;
  basePrice: string;
  locationTargetingExtra: string;
}

// Standard banner sizes for dashboard placement
const DASHBOARD_AD_SIZES = [
  '728x90',
  '970x250',
  '300x250',
  '320x100',
];

interface BannerCreatorProps {
  onNavigate?: (page: string) => void;
}

// Quick region selection for admins
const QUICK_REGIONS = {
  'North America': ['US', 'CA', 'MX'],
  'Europe': ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK'],
  'Asia Pacific': ['CN', 'JP', 'KR', 'SG', 'AU', 'IN', 'TH', 'MY'],
  'Africa': ['ZA', 'NG', 'KE', 'GH', 'EG', 'MA'],
  'South America': ['BR', 'AR', 'CL', 'CO', 'PE'],
  'Middle East': ['AE', 'SA', 'QA', 'KW', 'BH', 'OM']
};

// Grade levels for targeting
const GRADES = [
  { value: 1, label: 'Grade 1', ageRange: '6-7 years' },
  { value: 2, label: 'Grade 2', ageRange: '7-8 years' },
  { value: 3, label: 'Grade 3', ageRange: '8-9 years' },
  { value: 4, label: 'Grade 4', ageRange: '9-10 years' },
  { value: 5, label: 'Grade 5', ageRange: '10-11 years' },
  { value: 6, label: 'Grade 6', ageRange: '11-12 years' },
  { value: 7, label: 'Grade 7', ageRange: '12-13 years' },
  { value: 8, label: 'Grade 8', ageRange: '13-14 years' },
  { value: 9, label: 'Grade 9', ageRange: '14-15 years' },
  { value: 10, label: 'Grade 10', ageRange: '15-16 years' },
  { value: 11, label: 'Grade 11', ageRange: '16-17 years' },
  { value: 12, label: 'Grade 12', ageRange: '17-18 years' },
  { value: 13, label: 'College/University', ageRange: '18+ years' },
];

// Country selector component for targeting
const CountrySelector = ({ selectedCountries, onCountryToggle, countries, isAdmin }: {
  selectedCountries: string[];
  onCountryToggle: (countryCode: string) => void;
  countries: {id: number, code: string, name: string}[];
  isAdmin?: boolean;
}) => {
  const handleQuickRegionSelect = (regionCountries: string[]) => {
    regionCountries.forEach(code => {
      if (!selectedCountries.includes(code)) {
        onCountryToggle(code);
      }
    });
  };

  const clearSelection = () => {
    selectedCountries.forEach(code => onCountryToggle(code));
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-foreground" />
            Quick Region Selection
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(QUICK_REGIONS).map(([region, codes]) => (
              <Button
                key={region}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickRegionSelect(codes)}
                className="text-xs hover:bg-primary hover:text-white hover:border-primary transition-all" transition-all duration-300
              >
                {region} ({codes.length})
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="text-xs hover:bg-destructive hover:text-white hover:border-destructive transition-all" transition-all duration-300
            >
              Clear All ({selectedCountries.length})
            </Button>
            {selectedCountries.length > 0 && (
              <Badge className="bg-primary/10 text-foreground border-primary/20">
                {selectedCountries.length} selected
              </Badge>
            )}
          </div>
        </div>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-12 justify-between border-gray-200 hover:bg-gray-50" transition-all duration-300
          >
            <span className="text-sm">
              {selectedCountries.length > 0
                ? `${selectedCountries.length} countr${selectedCountries.length > 1 ? 'ies' : 'y'} selected`
                : 'Select countries (optional)'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="max-h-80 overflow-y-auto p-2 space-y-1" data-testid="countries-selector">
            {countries.map((country) => {
              const isSelected = selectedCountries.includes(country.code);
              return (
                <div
                  key={country.code}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 hover:bg-primary/15'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onCountryToggle(country.code)}
                >
                  <Checkbox
                    id={`dropdown-country-${country.code}`}
                    checked={isSelected}
                    onCheckedChange={() => onCountryToggle(country.code)}
                    data-testid={`country-checkbox-${country.code}`}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3 w-3 md:h-4 md:w-4"
                  />
                  <span className="text-sm flex-1">{country.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-foreground" />}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-muted-foreground text-center pt-2">
        {isAdmin 
          ? 'Select countries to target your ad, or use quick regions above for faster selection.'
          : 'Select countries to target your ad, or leave empty for global reach.'}
      </p>
    </div>
  );
};

// Import AJAX components  
import { AjaxLoader } from '@/components/ui/ajax-loader';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { getStripePromise } from '@/lib/stripe';

type AjaxOperation = 'idle' | 'adding' | 'updating' | 'uploading' | 'success' | 'error';

export default function BannerCreator({ onNavigate }: BannerCreatorProps) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [ajaxOperation, setAjaxOperation] = useState<AjaxOperation>('idle');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [usedCredits, setUsedCredits] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  const form = useForm<BannerAdFormData>({
    resolver: zodResolver(createValidationSchema(!!user)),
    defaultValues: {
      title: '',
      targetDashboards: ['learner'],
      size: '970x250',
      durationDays: 7,
      targetLocations: [],
      targetGrades: [],
      minAge: null,
      maxAge: null,
      guestEmail: '',
      guestName: '',
    },
  });

  // Fetch logo
  const { data: logoData } = useQuery({
    queryKey: ['/api/admin/settings/logo/home/square'],
    queryFn: async () => {
      return await apiRequest('/api/admin/settings/logo/home/square') as { logoUrl: string | null };
    },
  });

  // Fetch countries data
  const { data: countriesData = [], isLoading: countriesLoading, error: countriesError } = useQuery<{id: number, code: string, name: string}[]>({
    queryKey: ['/api/countries'],
    queryFn: async () => {
      const data = await apiRequest('/api/countries');
      console.log('Countries loaded:', data?.length || 0, 'countries');
      return data;
    },
  });

  console.log('Countries state:', { 
    loading: countriesLoading, 
    error: countriesError, 
    count: countriesData?.length || 0,
    estimatedCost,
    selectedCountries: selectedCountries.length 
  });

  // Calculate estimated cost when form values change
  const calculatePricing = async () => {
    const formValues = form.getValues();
    console.log('calculatePricing called with:', { formValues, selectedCountries, profileRole: profile?.role });
    
    if (formValues.size && formValues.durationDays) {
      if (profile?.role === 'admin') {
        console.log('Admin user - setting cost to 0');
        setEstimatedCost(0);
        return;
      }

      try {
        const targetLocations = selectedCountries.length > 0 ? selectedCountries : null;
        const targetDashboards = formValues.targetDashboards || ['learner'];
        const dashboardCount = targetDashboards.length;
        
        console.log('Making pricing API call with:', { 
          targetLocations, 
          durationDays: formValues.durationDays,
          dashboardCount
        });
        
        const data = await apiRequest('/api/ads/calculate-price', {
          method: 'POST',
          body: JSON.stringify({
            targetLocations,
            durationDays: formValues.durationDays,
            dashboardCount
          })
        });

        console.log('Pricing API response:', data);
        console.log('Setting estimated cost to:', data.price || 0);
        setEstimatedCost(data.price || 0);
      } catch (error) {
        console.error('Error calculating price:', error);
        setEstimatedCost(0);
      }
    } else {
      console.log('Missing required form values for pricing calculation');
    }
  };

  useEffect(() => {
    if (profile !== undefined) {
      calculatePricing();
    }
  }, [profile?.role, selectedCountries]);

  useEffect(() => {
    const subscription = form.watch(() => {
      calculatePricing();
    });
    
    return () => subscription.unsubscribe();
  }, [form, selectedCountries, profile?.role]);

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'banner');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return response.json();
    },
  });

  // Banner creation
  const createBannerMutation = useMutation({
    mutationFn: async (data: BannerAdFormData) => {
      setAjaxOperation('adding');
      setFormErrors([]);
      
      let imageUrl = '';
      if (selectedFile) {
        setUploadProgress(true);
        setAjaxOperation('uploading');
        try {
          const uploadResult = await uploadImageMutation.mutateAsync(selectedFile);
          setUploadProgress(false);
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Failed to upload image');
          }
          
          imageUrl = uploadResult.url;
          setAjaxOperation('adding');
        } catch (error) {
          setUploadProgress(false);
          throw error;
        }
      } else {
        throw new Error('Please select an image file');
      }

      const placementMapping: Record<string, string> = {
        'learner': 'student_dashboard',
        'teacher': 'teacher_dashboard',
        'freelancer': 'freelancer_dashboard',
        'advertise_page': 'advertise_page'
      };

      const bannerData = {
        title: data.title,
        imageUrl,
        targetDashboards: data.targetDashboards,
        size: data.size,
        durationDays: data.durationDays,
        targetLocations: selectedCountries.length > 0 ? selectedCountries : null,
        targetGrades: data.targetGrades && data.targetGrades.length > 0 ? data.targetGrades : null,
        minAge: data.minAge || null,
        maxAge: data.maxAge || null,
        guestEmail: user ? undefined : data.guestEmail,
        guestName: user ? undefined : data.guestName,
      };

      if (profile?.role === 'admin') {
        const response = await fetch('/api/admin/ads/banner/create', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
          },
          body: JSON.stringify(bannerData)
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create admin banner');
        }
        
        return result;
      } else {
        const result = await apiRequest('/api/ads/banner/create-with-payment', {
          method: 'POST',
          body: JSON.stringify(bannerData)
        });
        
        if (result.success && result.usedCredits) {
          console.log('Ad created using membership credits, no payment required');
          setUsedCredits(true);
          return result;
        } else if (result.success && result.clientSecret) {
          console.log('Payment Intent created, opening embedded payment modal');
          return result;
        } else {
          console.error('Payment creation failed:', result);
          throw new Error(result.error || 'Failed to create payment session');
        }
      }
    },
    onSuccess: (result) => {
      setAjaxOperation('success');
      if (profile?.role === 'admin' || result.usedCredits) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/ads/banner'] });
        queryClient.invalidateQueries({ queryKey: ['/api/ads/my-ads'] });
        setTimeout(() => {
          setAjaxOperation('idle');
          setShowSuccess(true);
        }, 1500);
      } else if (result.clientSecret) {
        setAjaxOperation('idle');
        setPaymentData({
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId,
          bannerId: result.bannerId,
          amount: result.amount,
          bannerTitle: form.getValues('title')
        });
        setShowPaymentModal(true);
      }
    },
    onError: (error: any) => {
      setAjaxOperation('error');
      setFormErrors([error.message || 'Failed to create banner ad']);
      setTimeout(() => setAjaxOperation('idle'), 3000);
    },
  });

  const isButtonDisabled = createBannerMutation.isPending || uploadProgress || (!selectedFile) || (profile?.role !== 'admin' && estimatedCost <= 0);
  console.log('Button disabled state:', {
    isPending: createBannerMutation.isPending,
    uploadProgress,
    noSelectedFile: !selectedFile,
    isNonAdminWithZeroCost: profile?.role !== 'admin' && estimatedCost <= 0,
    overallDisabled: isButtonDisabled,
    estimatedCost,
    profileRole: profile?.role
  });

  const onSubmit = (data: BannerAdFormData) => {
    console.log('Form submission triggered:', data);
    console.log('Selected file:', selectedFile);
    console.log('Estimated cost:', estimatedCost);
    console.log('Profile role:', profile?.role);
    console.log('Form validation errors:', form.formState.errors);
    
    setFormErrors([]);
    
    const errors = [];
    if (!data.title.trim()) {
      errors.push('Please enter a title for your banner ad');
    }
    if (!selectedFile) {
      errors.push('Please select an image file');
    }
    if (!data.targetDashboards || data.targetDashboards.length === 0) {
      errors.push('Please select at least one target dashboard');
    }
    if (profile?.role !== 'admin' && estimatedCost <= 0) {
      errors.push('Unable to calculate pricing. Please try again.');
    }
    
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    
    createBannerMutation.mutate(data);
  };

  const availableSizes = DASHBOARD_AD_SIZES;

  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(form.getValues('size'))) {
      form.setValue('size', availableSizes[0]);
    }
  }, [availableSizes, form]);

  // Determine if we're in landing page context (onNavigate provided)
  const isLandingPage = !!onNavigate;

  return (
    <>
      {isLandingPage && <Header onNavigate={onNavigate} currentPage="banner-creator" />}
      <div className={`bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen ${isLandingPage ? 'pt-20' : ''}`}>
        <div className="grid lg:grid-cols-12 gap-8 px-6 sm:px-10 lg:px-14 py-12">
          {/* Main Form - Premium Design */}
          <div className="lg:col-span-8">
            <div className="bg-white shadow-sm border border-gray-200/50 overflow-hidden">
              {/* Form Content */}
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0 px-8">
                    {/* Campaign Details Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-foreground">Campaign Details</h2>
                          <p className="text-sm text-muted-foreground">Set up your banner advertisement</p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Campaign Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter a compelling title for your banner" 
                                {...field}
                                className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-3">
                        <FormLabel className="text-sm font-semibold">Banner Creative</FormLabel>
                        <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                          selectedFile ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
                        }`}>
                          <Upload className={`mx-auto h-12 w-12 mb-4 ${selectedFile ? 'text-foreground' : 'text-gray-400'}`} />
                          <div className="space-y-2">
                            <div className="text-sm">
                              {selectedFile ? (
                                <p className="font-semibold text-foreground">{selectedFile.name}</p>
                              ) : (
                                <p className="text-muted-foreground">Upload your banner image</p>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                console.log('File input changed:', e.target.files);
                                const file = e.target.files?.[0];
                                console.log('Selected file:', file);
                                if (file) {
                                  setSelectedFile(file);
                                  console.log('File set in state:', file.name);
                                } else {
                                  console.log('No file selected');
                                }
                              }}
                              className="hidden"
                              id="banner-image-upload"
                            />
                            <label
                              htmlFor="banner-image-upload"
                              className="cursor-pointer inline-flex items-center px-6 py-2.5 border border-primary/20 rounded-lg shadow-sm text-sm font-semibold text-foreground bg-primary/5 hover:bg-primary hover:text-white transition-all" transition-all duration-300
                            >
                              {selectedFile ? 'Change File' : 'Choose File'}
                            </label>
                          </div>
                          {uploadProgress && (
                            <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
                              <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-foreground mx-auto mb-2" />
                                <p className="text-sm font-medium text-foreground">Uploading...</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Maximum file size: 5MB. Accepted formats: JPG, PNG, GIF. Ensure dimensions match your selected size.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Banner Size</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 border-gray-200">
                                    <SelectValue placeholder="Select size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableSizes.map((size) => (
                                    <SelectItem key={size} value={size}>
                                      {size} pixels
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
                          name="durationDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Campaign Duration</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="h-12 border-gray-200">
                                    <SelectValue placeholder="Select duration" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="7">7 days</SelectItem>
                                  <SelectItem value="14">14 days</SelectItem>
                                  <SelectItem value="30">30 days</SelectItem>
                                  <SelectItem value="90">90 days</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Targeting Section */}
                    <div className="space-y-6">
                      <div>
                        <FormLabel className="text-sm font-semibold mb-3 block">Target Dashboards</FormLabel>
                        <FormDescription className="mb-4 text-sm">
                          Select where your banner will appear. Each dashboard reaches a unique audience.
                        </FormDescription>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-12 justify-between border-gray-200 hover:bg-gray-50" transition-all duration-300
                            >
                              <span className="text-sm">
                                {form.watch('targetDashboards')?.length > 0
                                  ? `${form.watch('targetDashboards').length} dashboard${form.watch('targetDashboards').length > 1 ? 's' : ''} selected`
                                  : 'Select dashboards'}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <div className="p-2 space-y-1">
                              {[
                                { value: 'learner', label: 'Learner Dashboard', icon: BookOpen },
                                { value: 'teacher', label: 'Teacher Dashboard', icon: Users },
                                { value: 'freelancer', label: 'Freelancer Dashboard', icon: Users },
                                { value: 'customer', label: 'Customer Dashboard', icon: Users },
                                { value: 'advertise_page', label: 'Advertise Page', icon: Globe2 }
                              ].map((dashboard) => {
                                const Icon = dashboard.icon;
                                const isSelected = form.watch('targetDashboards')?.includes(dashboard.value as any);
                                return (
                                  <div
                                    key={dashboard.value}
                                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-primary/10 hover:bg-primary/15'
                                        : 'hover:bg-gray-100'
                                    }`}
                                    onClick={() => {
                                      const currentDashboards = form.watch('targetDashboards') || [];
                                      const newDashboards = isSelected
                                        ? currentDashboards.filter((d) => d !== dashboard.value)
                                        : [...currentDashboards, dashboard.value as any];
                                      form.setValue('targetDashboards', newDashboards);
                                    }}
                                  >
                                    <Checkbox
                                      id={`dropdown-${dashboard.value}`}
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        const currentDashboards = form.watch('targetDashboards') || [];
                                        const newDashboards = checked
                                          ? [...currentDashboards, dashboard.value as any]
                                          : currentDashboards.filter((d) => d !== dashboard.value);
                                        form.setValue('targetDashboards', newDashboards);
                                      }}
                                      data-testid={`dashboard-checkbox-${dashboard.value}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-3 w-3 md:h-4 md:w-4"
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                      <Icon className="h-4 w-4 text-foreground" />
                                      <span className="text-sm font-medium">{dashboard.label}</span>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-foreground" />}
                                  </div>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <FormLabel className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-foreground" />
                          <span className="text-sm font-semibold">Geographic Targeting {profile?.role === 'admin' ? '' : '(Optional)'}</span>
                        </FormLabel>
                        <FormDescription className="mb-4 text-sm">
                          {profile?.role === 'admin' 
                            ? 'Select specific countries to target, or leave empty for worldwide reach.'
                            : 'Select specific countries for localized pricing, or leave empty for global reach.'}
                        </FormDescription>
                        <CountrySelector 
                          selectedCountries={selectedCountries}
                          onCountryToggle={(countryCode) => {
                            const newCountries = selectedCountries.includes(countryCode) 
                              ? selectedCountries.filter(code => code !== countryCode)
                              : [...selectedCountries, countryCode];
                            setSelectedCountries(newCountries);
                            form.setValue('targetLocations', newCountries);
                          }}
                          countries={countriesData}
                          isAdmin={profile?.role === 'admin'}
                        />
                      </div>

                      <div>
                        <FormLabel className="flex items-center gap-2 mb-3">
                          <BookOpen className="h-4 w-4 text-foreground" />
                          <span className="text-sm font-semibold">Grade Level Targeting (Optional)</span>
                        </FormLabel>
                        <FormDescription className="mb-4 text-sm">
                          Target specific educational levels, or leave empty to reach all grades.
                        </FormDescription>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-12 justify-between border-gray-200 hover:bg-gray-50" transition-all duration-300
                            >
                              <span className="text-sm">
                                {selectedGrades.length > 0
                                  ? `${selectedGrades.length} grade${selectedGrades.length > 1 ? 's' : ''} selected`
                                  : 'Select grades (optional)'}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <div className="max-h-80 overflow-y-auto p-2 space-y-1" data-testid="grades-selector">
                              {GRADES.map((grade) => {
                                const isSelected = selectedGrades.includes(grade.value);
                                return (
                                  <div
                                    key={grade.value}
                                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-primary/10 hover:bg-primary/15'
                                        : 'hover:bg-gray-100'
                                    }`}
                                    onClick={() => {
                                      const newGrades = selectedGrades.includes(grade.value) 
                                        ? selectedGrades.filter(g => g !== grade.value)
                                        : [...selectedGrades, grade.value];
                                      setSelectedGrades(newGrades);
                                      form.setValue('targetGrades', newGrades);
                                    }}
                                  >
                                    <Checkbox
                                      id={`dropdown-grade-${grade.value}`}
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        const newGrades = selectedGrades.includes(grade.value) 
                                          ? selectedGrades.filter(g => g !== grade.value)
                                          : [...selectedGrades, grade.value];
                                        setSelectedGrades(newGrades);
                                        form.setValue('targetGrades', newGrades);
                                      }}
                                      data-testid={`grade-checkbox-${grade.value}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-3 w-3 md:h-4 md:w-4"
                                    />
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">{grade.label}</div>
                                      <div className="text-xs text-muted-foreground">{grade.ageRange}</div>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-foreground" />}
                                  </div>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <FormLabel className="flex items-center gap-2 mb-3">
                            <Shield className="h-4 w-4 text-foreground" />
                            <span className="text-sm font-semibold">Age Restrictions (Optional)</span>
                          </FormLabel>
                          <FormDescription className="mb-4 text-sm">
                            Set age limits to ensure appropriate content targeting for child safety.
                          </FormDescription>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="minAge"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Minimum Age</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 13"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                    data-testid="input-min-age"
                                    className="h-12 border-gray-200"
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Minimum age to display this ad
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="maxAge"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Maximum Age</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 18"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                    data-testid="input-max-age"
                                    className="h-12 border-gray-200"
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Maximum age to display this ad
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Guest Checkout Fields */}
                    {!user && (
                      <>
                        <Separator />
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 pb-4 border-b">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-foreground" />
                            </div>
                            <div>
                              <h2 className="text-xl font-semibold text-foreground">Contact Information</h2>
                              <p className="text-sm text-muted-foreground">Required to process your order and send updates</p>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="guestName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-semibold">Full Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your full name" 
                                      {...field}
                                      className="h-12 border-gray-200"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="guestEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-semibold">Email Address</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="email" 
                                      placeholder="your@email.com" 
                                      {...field}
                                      className="h-12 border-gray-200"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs">
                                    We'll send payment confirmations and campaign updates here
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Error Display */}
                    {formErrors.length > 0 && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                        <div className="flex items-start">
                          <XCircle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-destructive mb-2">Please fix the following:</h3>
                            <ul className="space-y-1">
                              {formErrors.map((error, index) => (
                                <li key={index} className="text-sm text-destructive/90">{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        type="submit"
                        disabled={isButtonDisabled}
                        className="flex-1 h-12 bg-primary text-white hover:bg-primary/80 hover:shadow-xl hover:scale-105 font-semibold shadow-lg shadow-primary/20" transition-all duration-300
                        size="lg"
                        data-testid="checkout-button"
                        onClick={() => {
                          console.log('Create Ad button clicked');
                          console.log('Form errors:', form.formState.errors);
                          console.log('Form values:', form.getValues());
                        }}
                      >
                        {ajaxOperation === 'uploading' || ajaxOperation === 'adding' ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : ajaxOperation === 'success' ? (
                          <CheckmarkIcon size="md" variant="success" className="mr-2" />
                        ) : (
                          <CreditCard className="w-5 h-5 mr-2" />
                        )}
                        {ajaxOperation === 'uploading' ? 'Creating...' :
                         ajaxOperation === 'adding' ? 'Creating...' :
                         ajaxOperation === 'success' ? 'Created!' :
                         profile?.role === 'admin' ? 'Create Campaign' : 'Proceed to Payment'}
                      </Button>
                    </div>
                  </form>
              </Form>
            </div>
          </div>

          {/* Pricing Sidebar - Premium Design */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b border-gray-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Investment Summary</h3>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-4xl font-bold text-foreground mb-2">
                      {profile?.role === 'admin' ? 'FREE' : <CurrencyDisplay amount={estimatedCost} />}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {profile?.role === 'admin' ? 'Admin Privilege' : 'Total Campaign Cost'}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-4">Campaign Overview</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Placements</span>
                        <span className="text-sm font-semibold">{form.watch('targetDashboards')?.length || 0} Selected</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Banner Size</span>
                        <span className="text-sm font-semibold">{form.watch('size')} px</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <span className="text-sm font-semibold">{form.watch('durationDays')} days</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Geographic Reach</span>
                        <span className="text-sm font-semibold">
                          {selectedCountries.length === 0 ? 'Worldwide' : 
                           selectedCountries.length > 10 ? `${selectedCountries.length} Markets` :
                           `${selectedCountries.length} Countries`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <h4 className="text-base font-semibold text-foreground mb-3">Pricing Structure</h4>
                    <div className="space-y-3 text-base text-muted-foreground">
                      <div className="flex items-start gap-2.5">
                        <CheckmarkIcon size="sm" className="bg-primary/20 mt-0.5" />
                        <span>Targeted (1-10 countries): Premium local rates</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckmarkIcon size="sm" className="bg-primary/20 mt-0.5" />
                        <span>Global (11+ countries): Standard worldwide rates</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-base font-semibold text-foreground mb-4">Campaign Process</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckmarkIcon size="sm" className="bg-primary/20" />
                        <span className="text-base text-muted-foreground">Submit for professional review</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckmarkIcon size="sm" className="bg-primary/20" />
                        <span className="text-base text-muted-foreground">Approval within 24 business hours</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckmarkIcon size="sm" className="bg-primary/20" />
                        <span className="text-base text-muted-foreground">Secure payment processing</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckmarkIcon size="sm" className="bg-primary/20" />
                        <span className="text-base text-muted-foreground">Campaign activation & tracking</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal - Receipt Style */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-scale-in">
            <CardHeader className="text-center pb-4">
              {logoData?.logoUrl ? (
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <img src={logoData.logoUrl} alt="Edufiliova" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckmarkIcon size="2xl" variant="primary" />
                </div>
              )}
              <CardTitle className="text-2xl font-bold text-gray-900">Campaign Created Successfully!</CardTitle>
              <CardDescription className="text-base mt-2">
                {profile?.role === 'admin' 
                  ? 'Your banner campaign is now active and ready to display.' 
                  : 'Your banner campaign has been submitted and is pending approval.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Campaign Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Title:</span>
                    <span className="font-medium text-gray-900">{form.getValues('title')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">{form.getValues('durationDays')} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Banner Size:</span>
                    <span className="font-medium text-gray-900">{form.getValues('size')} px</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                      {profile?.role === 'admin' ? 'Active' : 'Pending Approval'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {profile?.role === 'admin' ? (
                    <>
                      <li className="flex items-start gap-2">
                        <CheckmarkIcon size="sm" variant="success" className="mt-0.5 flex-shrink-0" />
                        <span>Your campaign is now live and visible to users</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckmarkIcon size="sm" variant="success" className="mt-0.5 flex-shrink-0" />
                        <span>Track performance in the My Ads section</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <CheckmarkIcon size="sm" variant="primary" className="mt-0.5 flex-shrink-0" />
                        <span>Admin review within 24 business hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckmarkIcon size="sm" variant="primary" className="mt-0.5 flex-shrink-0" />
                        <span>Email notification upon approval</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckmarkIcon size="sm" variant="primary" className="mt-0.5 flex-shrink-0" />
                        <span>Track status in the My Ads section</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => {
                    setShowSuccess(false);
                    form.reset();
                    setSelectedFile(null);
                    setSelectedCountries([]);
                    setSelectedGrades([]);
                  }}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-create-another"
                >
                  Create Another Ad
                </Button>
                <Button 
                  onClick={() => {
                    setShowSuccess(false);
                    if (onNavigate) {
                      onNavigate('customer-dashboard');
                    }
                  }}
                  className="flex-1 bg-primary hover:bg-primary text-white" transition-all duration-300
                  data-testid="button-view-my-ads"
                >
                  View My Ads
                </Button>
              </div>
            </CardContent>
          </Card>
          <style>{`
            @keyframes scale-in {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .animate-scale-in {
              animation: scale-in 0.3s ease-out;
            }
          `}</style>
        </div>
      )}

      {/* Embedded Payment Modal */}
      {showPaymentModal && paymentData && (
        <Elements stripe={stripePromise}>
          <PaymentModalContent 
            paymentData={paymentData}
            onSuccess={() => {
              setShowPaymentModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/ads/my-ads'] });
              setShowSuccess(true);
            }}
            onCancel={() => setShowPaymentModal(false)}
          />
        </Elements>
      )}
      {isLandingPage && <Footer onNavigate={onNavigate} />}
    </>
  );
}

// Embedded Payment Modal Component
interface PaymentModalContentProps {
  paymentData: {
    clientSecret: string;
    paymentIntentId: string;
    bannerId: string;
    amount: number;
    bannerTitle: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentModalContent({ paymentData, onSuccess, onCancel }: PaymentModalContentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');

  const { data: walletData } = useQuery<{ balance: string }>({
    queryKey: ['/api/shop/wallet'],
    enabled: !!user,
  });

  const walletBalance = walletData?.balance ? parseFloat(walletData.balance) : 0;

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.clientSecret,
        { payment_method: { card: cardElement } }
      );

      if (paymentError) {
        setError(paymentError.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        await apiRequest('/api/ads/banner/confirm-payment', {
          method: 'POST',
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            bannerId: paymentData.bannerId
          })
        });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletPayment = async () => {
    setIsProcessing(true);
    setError('');
    try {
      await apiRequest('/api/process-wallet-payment', {
        method: 'POST',
        body: JSON.stringify({
          amount: paymentData.amount,
          bannerId: paymentData.bannerId,
          type: 'banner_ad'
        })
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Wallet payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 md:bg-black/60 md:backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto md:py-8 md:px-4">
      <Card className="rounded-2xl text-[#1F1E30] border-gray-100 w-full md:max-w-5xl bg-gradient-to-br from-white via-white to-blue-50/30 md:shadow-2xl shadow-none border-0 md:border min-h-screen md:min-h-0">
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors" transition-all duration-300
            disabled={isProcessing}
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <CardContent className="p-4 md:p-8 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Side - Order Summary */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="font-semibold text-base md:text-lg">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{paymentData.bannerTitle}</div>
                    <div className="text-xs text-muted-foreground">Banner Advertisement Campaign</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Campaign Cost</span>
                  <span className="font-medium">${paymentData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total due today</span>
                  <span>${paymentData.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right Side - Payment Method */}
            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="font-semibold text-base mb-3">Payment method</h3>
                
                <div className="flex gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 p-3 border rounded-lg transition-all ${
                      paymentMethod === 'card' 
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    data-testid="button-payment-card"
                  >
                    <CreditCard className="w-5 h-5 mx-auto" />
                    <span className="text-xs mt-1 block">Card</span>
                  </button>
                  
                  {user && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`flex-1 p-3 border rounded-lg transition-all ${
                        paymentMethod === 'wallet' 
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      data-testid="button-payment-wallet"
                    >
                      <Wallet className="w-5 h-5 mx-auto" />
                      <span className="text-xs mt-1 block">Wallet</span>
                      <span className="text-xs text-blue-600 font-medium">${walletBalance.toFixed(2)}</span>
                    </button>
                  )}
                </div>
              </div>

              {paymentMethod === 'card' && (
                <form onSubmit={handleCardPayment} className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-3">Payment information</h3>
                    <div className="flex gap-2 mb-3">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                      <img src="https://www.americanexpress.com/content/dam/amex/us/merchant/supplies-uplift/product/images/4_Card_color_horizontal.png" alt="American Express" className="h-6" />
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-white">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': { color: '#aab7c4' },
                            },
                            invalid: { color: '#9e2146' },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-primary/10 border border-red-200 rounded text-sm text-primary-700">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="w-full bg-primary hover:bg-primary text-white py-6 text-base font-semibold" transition-all duration-300
                    data-testid="button-complete-purchase"
                  >
                    {isProcessing ? 'Processing...' : 'Complete Purchase'}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure 256-bit SSL encrypted payment</span>
                  </div>
                </form>
              )}

              {paymentMethod === 'wallet' && (
                <div className="space-y-4">
                  {walletBalance < paymentData.amount ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                      Insufficient balance. Need ${(paymentData.amount - walletBalance).toFixed(2)} more.
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                      You will pay using your wallet balance: ${walletBalance.toFixed(2)}
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-primary/10 border border-red-200 rounded text-sm text-primary-700">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleWalletPayment}
                    disabled={isProcessing || walletBalance < paymentData.amount}
                    className="w-full bg-primary hover:bg-primary text-white py-6 text-base font-semibold" transition-all duration-300
                    data-testid="button-wallet-pay"
                  >
                    {isProcessing ? 'Processing...' : `Pay $${paymentData.amount.toFixed(2)} from Wallet`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure payment from your wallet</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
