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
import { Upload, DollarSign, MapPin, Calendar, Shield, XCircle, BookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

const bannerAdSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  placement: z.enum(['student_dashboard', 'teacher_dashboard', 'freelancer_dashboard', 'customer_dashboard', 'advertise_page'], {
    required_error: 'Please select an ad placement',
  }),
  size: z.string().min(1, 'Size is required'),
  durationDays: z.number().min(1, 'Duration must be at least 1 day').max(90, 'Duration cannot exceed 90 days'),
  targetLocations: z.array(z.string()).optional().nullable(),
  targetGrades: z.array(z.number()).optional().nullable(),
  minAge: z.number().min(5, 'Minimum age must be at least 5').max(99, 'Age cannot exceed 99').optional().nullable(),
  maxAge: z.number().min(5, 'Maximum age must be at least 5').max(99, 'Age cannot exceed 99').optional().nullable(),
});

type BannerAdFormData = z.infer<typeof bannerAdSchema>;

interface PriceCalculation {
  price: number;
  targetingType: 'local' | 'global';
  durationDays: number;
}

const AD_PLACEMENTS = [
  { value: 'student_dashboard', label: 'Student Dashboard', description: 'Appears on student dashboards' },
  { value: 'teacher_dashboard', label: 'Teacher Dashboard', description: 'Appears on teacher dashboards' },
  { value: 'freelancer_dashboard', label: 'Freelancer Dashboard', description: 'Appears on freelancer dashboards' },
  { value: 'customer_dashboard', label: 'Customer Dashboard', description: 'Appears on customer dashboards' },
  { value: 'advertise_page', label: 'Advertise Page', description: 'Appears on the advertise with us page' },
];

const AD_SIZES = {
  'student_dashboard': [
    { value: '728x90', label: 'Leaderboard (728x90)' },
    { value: '300x250', label: 'Medium Rectangle (300x250)' },
    { value: '336x280', label: 'Large Rectangle (336x280)' },
    { value: 'responsive', label: 'Responsive' }
  ],
  'teacher_dashboard': [
    { value: '728x90', label: 'Leaderboard (728x90)' },
    { value: '300x250', label: 'Medium Rectangle (300x250)' },
    { value: '336x280', label: 'Large Rectangle (336x280)' },
    { value: 'responsive', label: 'Responsive' }
  ],
  'freelancer_dashboard': [
    { value: '728x90', label: 'Leaderboard (728x90)' },
    { value: '300x250', label: 'Medium Rectangle (300x250)' },
    { value: '336x280', label: 'Large Rectangle (336x280)' },
    { value: 'responsive', label: 'Responsive' }
  ],
  'customer_dashboard': [
    { value: '728x90', label: 'Leaderboard (728x90)' },
    { value: '300x250', label: 'Medium Rectangle (300x250)' },
    { value: '336x280', label: 'Large Rectangle (336x280)' },
    { value: 'responsive', label: 'Responsive' }
  ],
  'advertise_page': [
    { value: '728x90', label: 'Leaderboard (728x90)' },
    { value: '300x250', label: 'Medium Rectangle (300x250)' },
    { value: '336x280', label: 'Large Rectangle (336x280)' },
    { value: 'responsive', label: 'Responsive' }
  ],
};

// Remove hardcoded countries - will fetch from API

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

// Import AJAX components
import { AjaxLoader, AjaxButton } from '@/components/ui/ajax-loader';

type AjaxOperation = 'idle' | 'adding' | 'uploading' | 'success' | 'error';

export function BannerAdForm() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [ajaxOperation, setAjaxOperation] = useState<AjaxOperation>('idle');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const isAdmin = profile?.role === 'admin';

  const form = useForm<BannerAdFormData>({
    resolver: zodResolver(bannerAdSchema),
    defaultValues: {
      title: '',
      placement: undefined,
      size: '',
      durationDays: 7,
      targetLocations: [],
      targetGrades: [],
      minAge: null,
      maxAge: null,
    },
  });

  // Calculate price using new API
  const calculatePrice = async (durationDays: number, targetLocations: string[] | null) => {
    try {
      const response = await apiRequest('/api/ads/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationDays, targetLocations })
      });
      const data = await response.json();
      if (data.success) {
        setPriceCalculation(data.data);
      }
    } catch (error) {
      console.error('Price calculation failed:', error);
    }
  };

  // Fetch countries data
  const { data: countriesData = [] } = useQuery<{id: number, code: string, name: string}[]>({
    queryKey: ['/api/countries'],
    queryFn: () => apiRequest('/api/countries').then(res => res.json()).then(data => data.data),
  });

  // Watch form values for pricing calculation
  const durationDays = form.watch('durationDays');

  useEffect(() => {
    if (durationDays && [7, 14, 30, 90].includes(durationDays)) {
      const targetLocations = selectedCountries.length > 0 ? selectedCountries : null;
      calculatePrice(durationDays, targetLocations);
    }
  }, [durationDays, selectedCountries]);

  // File upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const sessionId = localStorage.getItem('sessionId');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'banner');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    },
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: BannerAdFormData) => {
      setAjaxOperation('adding');
      setFormErrors([]);
      
      // Upload image first if file is selected
      let imageUrl = '';
      if (selectedFile) {
        setAjaxOperation('uploading');
        const uploadResult = await uploadImageMutation.mutateAsync(selectedFile);
        if (!uploadResult.success) {
          throw new Error('Failed to upload image');
        }
        imageUrl = uploadResult.url;
        setAjaxOperation('adding');
      }
      
      const endpoint = '/api/ads/create';
      const currentDate = new Date();
      const response = await apiRequest(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          imageUrl,
          placement: data.placement,
          size: data.size,
          durationDays: data.durationDays,
          startDate: currentDate.toISOString(),
          targetLocations: selectedCountries.length > 0 ? selectedCountries : null,
          targetGrades: selectedGrades.length > 0 ? selectedGrades : null,
          minAge: data.minAge,
          maxAge: data.maxAge,
          linkUrl: null
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAjaxOperation('success');
      queryClient.invalidateQueries({ queryKey: ['/api/ads/manage'] });
      form.reset();
      setSelectedCountries([]);
      setSelectedGrades([]);
      setPriceCalculation(null);
      setTimeout(() => setAjaxOperation('idle'), 2000);
    },
    onError: (error: any) => {
      setAjaxOperation('error');
      setFormErrors([error.message || 'Failed to create banner ad']);
      setTimeout(() => setAjaxOperation('idle'), 3000);
    },
  });

  const onSubmit = (data: BannerAdFormData) => {
    // Clear previous errors
    setFormErrors([]);
    
    // Validate required fields
    const errors = [];
    if (!data.title.trim()) {
      errors.push('Please enter a title for your banner ad');
    }
    if (!selectedFile) {
      errors.push('Please select an image file');
    }
    if (!data.placement) {
      errors.push('Please select an ad placement');
    }
    if (!data.size) {
      errors.push('Please select an ad size');
    }
    if (!isAdmin && !priceCalculation) {
      errors.push('Unable to calculate pricing. Please try again.');
    }
    
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    
    createAdMutation.mutate(data);
  };

  const handleCountryToggle = (countryCode: string) => {
    setSelectedCountries(prev => 
      prev.includes(countryCode) 
        ? prev.filter(code => code !== countryCode)
        : [...prev, countryCode]
    );
  };

  const handleGradeToggle = (gradeValue: number) => {
    setSelectedGrades(prev => 
      prev.includes(gradeValue) 
        ? prev.filter(grade => grade !== gradeValue)
        : [...prev, gradeValue]
    );
  };

  const placement = form.watch('placement');
  const availableSizes = placement ? AD_SIZES[placement as keyof typeof AD_SIZES] : [];

  // Update size when placement changes
  useEffect(() => {
    if (placement && availableSizes.length > 0) {
      form.setValue('size', availableSizes[0].value);
    }
  }, [placement, availableSizes, form]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Banner Advertisement</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Promote your business with targeted banner ads across our platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Ad Details
              </CardTitle>
              <CardDescription>
                Enter your banner ad information and targeting preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a descriptive title for your ad"
                            {...field} 
                            data-testid="input-ad-title"
                          />
                        </FormControl>
                        <FormDescription>
                          This title is for your reference only (max 100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* File Upload Field */}
                  <div>
                    <FormLabel>Banner Image</FormLabel>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          {selectedFile ? (
                            <p className="font-medium text-green-600">{selectedFile.name}</p>
                          ) : (
                            <p>Click to upload or drag and drop</p>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                            }
                          }}
                          className="hidden"
                          id="banner-image-upload"
                          data-testid="input-banner-image"
                        />
                        <label
                          htmlFor="banner-image-upload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" transition-all duration-300
                        >
                          Choose File
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Upload your banner image (max 5MB). Ensure it matches the selected size.
                    </p>
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="placement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Placement</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-placement">
                                <SelectValue placeholder="Select placement" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {AD_PLACEMENTS.map((placement) => (
                                <SelectItem key={placement.value} value={placement.value}>
                                  <div>
                                    <div className="font-medium">{placement.label}</div>
                                    <div className="text-xs text-gray-500">{placement.description}</div>
                                  </div>
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
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Size</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!placement}>
                            <FormControl>
                              <SelectTrigger data-testid="select-size">
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableSizes.map((size) => (
                                <SelectItem key={size.value} value={size.value}>
                                  {size.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="durationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Duration</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-duration">
                              <SelectValue />
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

                  {/* Age Restrictions Section */}
                  <div className="space-y-4">
                    <div>
                      <FormLabel className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Age Restrictions (Optional)
                      </FormLabel>
                      <FormDescription className="mb-3">
                        Set age limits to ensure appropriate content targeting for child safety
                      </FormDescription>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Age</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 13"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                data-testid="input-min-age"
                              />
                            </FormControl>
                            <FormDescription>
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
                            <FormLabel>Maximum Age</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 18"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                data-testid="input-max-age"
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum age to display this ad
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Grade Targeting Section */}
                  <div>
                    <FormLabel className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Grade Targeting (Optional)
                    </FormLabel>
                    <FormDescription className="mb-3">
                      Select specific grade levels to target, or leave empty to reach all grades
                    </FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {GRADES.map((grade) => (
                        <div key={grade.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`banner-grade-${grade.value}`}
                            checked={selectedGrades.includes(grade.value)}
                            onCheckedChange={() => handleGradeToggle(grade.value)}
                            data-testid={`checkbox-grade-${grade.value}`}
                          />
                          <label
                            htmlFor={`banner-grade-${grade.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {grade.label}
                            <div className="text-xs text-gray-500">{grade.ageRange}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location Targeting (Optional)
                    </FormLabel>
                    <FormDescription className="mb-3">
                      Select specific countries to target, or leave empty for global reach
                    </FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {countriesData.map((country) => (
                        <div key={country.code} className="flex items-center space-x-2">
                          <Checkbox
                            id={country.code}
                            checked={selectedCountries.includes(country.code)}
                            onCheckedChange={() => handleCountryToggle(country.code)}
                            data-testid={`checkbox-country-${country.code}`}
                          />
                          <label
                            htmlFor={country.code}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {country.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Display Form Errors */}
                  {formErrors.length > 0 && (
                    <div className="bg-primary/10 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <XCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-red-800">Please fix the following issues:</h3>
                          <ul className="mt-1 list-disc list-inside text-sm text-primary">
                            {formErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AJAX Status Display */}
                  {ajaxOperation !== 'idle' && (
                    <div className="mb-4">
                      <AjaxLoader 
                        operation={ajaxOperation} 
                        message={
                          ajaxOperation === 'uploading' ? 'Uploading banner image...' :
                          ajaxOperation === 'adding' ? 'Creating banner advertisement...' :
                          ajaxOperation === 'success' ? (isAdmin ? 'Admin banner created successfully!' : 'Banner created successfully!') :
                          ajaxOperation === 'error' ? 'Operation failed' :
                          undefined
                        }
                      />
                    </div>
                  )}

                  <AjaxButton
                    operation={ajaxOperation}
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={createAdMutation.isPending || uploadImageMutation.isPending || !selectedFile || (!isAdmin && !priceCalculation)}
                    className="w-full"
                    data-testid="button-submit"
                    loadingText={
                      ajaxOperation === 'uploading' ? 'Uploading image...' : 
                      ajaxOperation === 'adding' ? 'Creating banner...' :
                      'Processing...'
                    }
                    successText={isAdmin ? 'Admin Banner Created!' : 'Banner Created!'}
                    errorText="Try Again"
                  >
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Create Admin Banner
                      </div>
                    ) : priceCalculation ? `Create Banner - $${priceCalculation.price.toFixed(2)}` : 'Create Banner'}
                  </AjaxButton>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {priceCalculation && (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      ${priceCalculation.price.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {priceCalculation.durationDays} Days Campaign
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Targeting Type</span>
                      <span className="capitalize">{priceCalculation.targetingType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration</span>
                      <span>{priceCalculation.durationDays} days</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Price</span>
                      <span>${priceCalculation.price.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {selectedCountries.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium mb-2">Target Countries:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedCountries.map(code => {
                            const country = countriesData.find(c => c.code === code);
                            return (
                              <Badge key={code} variant="secondary" className="text-xs">
                                {country?.name}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
              
              <div className="text-xs text-gray-500 border-t pt-4">
                <div className="flex items-center gap-1 mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>Ad Review Process</span>
                </div>
                <p>
                  Your ad will be reviewed by our team within 24 hours. 
                  You'll receive an email notification once approved.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
