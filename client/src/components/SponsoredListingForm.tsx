import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, MapPin, Calendar, BookOpen, Briefcase, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const sponsoredListingSchema = z.object({
  itemType: z.enum(['course', 'freelancer_project'], {
    required_error: 'Please select the type of content to promote',
  }),
  itemId: z.string().min(1, 'Please select an item to promote'),
  durationDays: z.number().min(1, 'Duration must be at least 1 day').max(90, 'Duration cannot exceed 90 days'),
  targetLocations: z.array(z.string()).optional().nullable(),
  targetGrades: z.array(z.number()).optional().nullable(),
  minAge: z.number().min(5, 'Minimum age must be at least 5').max(99, 'Age cannot exceed 99').optional().nullable(),
  maxAge: z.number().min(5, 'Maximum age must be at least 5').max(99, 'Age cannot exceed 99').optional().nullable(),
});

type SponsoredListingFormData = z.infer<typeof sponsoredListingSchema>;

interface AdPricing {
  id: string;
  adType: string;
  durationDays: number;
  basePrice: string;
  locationTargetingExtra: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
}

interface FreelancerProject {
  id: string;
  title: string;
  description?: string;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'ZA', name: 'South Africa' },
];

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

interface SponsoredListingFormProps {
  preSelectedItem?: {
    type: 'course' | 'freelancer_project';
    id: string;
    title: string;
  };
}

export function SponsoredListingForm({ preSelectedItem }: SponsoredListingFormProps) {
  const queryClient = useQueryClient();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  const form = useForm<SponsoredListingFormData>({
    resolver: zodResolver(sponsoredListingSchema),
    defaultValues: {
      itemType: preSelectedItem?.type || undefined,
      itemId: preSelectedItem?.id || '',
      durationDays: 7,
      targetLocations: [],
      targetGrades: [],
      minAge: null,
      maxAge: null,
    },
  });

  // Fetch pricing data
  const { data: pricingData = [] } = useQuery<AdPricing[]>({
    queryKey: ['/api/ads/pricing'],
    queryFn: () => apiRequest('/api/ads/pricing').then(res => res.json()).then(data => data.data),
  });

  // Fetch user's courses
  const { data: coursesData = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses/my'],
    queryFn: () => apiRequest('/api/courses/my').then(res => res.json()).then(data => data.data),
    enabled: !preSelectedItem || preSelectedItem.type === 'course',
  });

  // Fetch user's freelancer projects (if that endpoint exists)
  const { data: projectsData = [] } = useQuery<FreelancerProject[]>({
    queryKey: ['/api/freelancer/projects/my'],
    queryFn: () => apiRequest('/api/freelancer/projects/my').then(res => res.json()).then(data => data.data),
    enabled: (!preSelectedItem || preSelectedItem.type === 'freelancer_project'),
  });

  // Watch form values for pricing calculation
  const watchedValues = form.watch(['durationDays']);

  useEffect(() => {
    const [durationDays] = watchedValues;
    if (durationDays) {
      const pricing = pricingData.find(p => 
        p.adType === 'sponsored' && 
        p.durationDays === durationDays
      );
      
      if (pricing) {
        const basePrice = parseFloat(pricing.basePrice);
        const locationExtra = selectedCountries.length > 0 ? parseFloat(pricing.locationTargetingExtra) : 0;
        setEstimatedCost(basePrice + locationExtra);
      }
    }
  }, [watchedValues, pricingData, selectedCountries]);

  const createSponsoredMutation = useMutation({
    mutationFn: async (data: SponsoredListingFormData) => {
      const response = await apiRequest('/api/ads/sponsored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          targetLocations: selectedCountries.length > 0 ? selectedCountries : null,
          targetGrades: selectedGrades.length > 0 ? selectedGrades : null,
          minAge: data.minAge,
          maxAge: data.maxAge,
        }),
      });
      return response.json();
    },
    onSuccess: (data) => {queryClient.invalidateQueries({ queryKey: ['/api/ads/sponsored/my'] });
      if (!preSelectedItem) {
        form.reset();
        setSelectedCountries([]);
        setSelectedGrades([]);
      }
    },
    onError: (error: any) => {},
  });

  const onSubmit = (data: SponsoredListingFormData) => {
    createSponsoredMutation.mutate(data);
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

  const itemType = form.watch('itemType');
  const availableItems = itemType === 'course' ? coursesData : projectsData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Promote Your Content</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Boost visibility with sponsored listings at the top of relevant feeds
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sponsored Listing Details
              </CardTitle>
              <CardDescription>
                Select content to promote and set your targeting preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {!preSelectedItem && (
                    <FormField
                      control={form.control}
                      name="itemType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-item-type">
                                <SelectValue placeholder="Select content type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="course">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">Course</div>
                                    <div className="text-xs text-gray-500">Educational courses and lessons</div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="freelancer_project">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">Freelancer Project</div>
                                    <div className="text-xs text-gray-500">Professional services and projects</div>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {preSelectedItem && (
                    <div className="space-y-2">
                      <FormLabel>Selected Content</FormLabel>
                      <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                          {preSelectedItem.type === 'course' ? (
                            <BookOpen className="h-5 w-5 text-green-600" />
                          ) : (
                            <Briefcase className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <div className="font-medium text-green-800 dark:text-green-200">
                              {preSelectedItem.title}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-300 capitalize">
                              {preSelectedItem.type.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {!preSelectedItem && itemType && (
                    <FormField
                      control={form.control}
                      name="itemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Select {itemType === 'course' ? 'Course' : 'Project'} to Promote
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-item">
                                <SelectValue placeholder={`Select your ${itemType}`} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableItems.map((item: any) => (
                                <SelectItem key={item.id} value={item.id}>
                                  <div>
                                    <div className="font-medium">{item.title}</div>
                                    {item.description && (
                                      <div className="text-xs text-gray-500 truncate max-w-xs">
                                        {item.description}
                                      </div>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose from your existing {itemType === 'course' ? 'courses' : 'freelancer projects'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="durationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promotion Duration</FormLabel>
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
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How long your content will appear as sponsored
                        </FormDescription>
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
                            id={`sponsored-grade-${grade.value}`}
                            checked={selectedGrades.includes(grade.value)}
                            onCheckedChange={() => handleGradeToggle(grade.value)}
                            data-testid={`checkbox-grade-${grade.value}`}
                          />
                          <label
                            htmlFor={`sponsored-grade-${grade.value}`}
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
                      {COUNTRIES.map((country) => (
                        <div key={country.code} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sponsored-${country.code}`}
                            checked={selectedCountries.includes(country.code)}
                            onCheckedChange={() => handleCountryToggle(country.code)}
                            data-testid={`checkbox-country-${country.code}`}
                          />
                          <label
                            htmlFor={`sponsored-${country.code}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {country.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={createSponsoredMutation.isPending}
                    className="w-full"
                    data-testid="button-submit"
                  >
                    {createSponsoredMutation.isPending ? 'Creating...' : 'Create Sponsored Listing'}
                  </Button>
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
              {estimatedCost > 0 && (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      ${estimatedCost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price</span>
                      <span>${(estimatedCost - (selectedCountries.length > 0 ? 12 : 0)).toFixed(2)}</span>
                    </div>
                    {selectedCountries.length > 0 && (
                      <div className="flex justify-between">
                        <span>Location Targeting</span>
                        <span>+${12.00}</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedCountries.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium mb-2">Target Countries:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedCountries.map(code => {
                            const country = COUNTRIES.find(c => c.code === code);
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
                  
                  {selectedGrades.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium mb-2">Target Grades:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedGrades.map(gradeValue => {
                            const grade = GRADES.find(g => g.value === gradeValue);
                            return (
                              <Badge key={gradeValue} variant="outline" className="text-xs">
                                {grade?.label}
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
                  <span>Sponsored Benefits</span>
                </div>
                <ul className="space-y-1">
                  <li>• Top placement in feeds</li>
                  <li>• "Sponsored" badge for credibility</li>
                  <li>• Enhanced visibility to target audience</li>
                  <li>• Detailed performance analytics</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
