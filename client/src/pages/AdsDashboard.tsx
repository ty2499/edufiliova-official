import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { AjaxButton, AjaxLoader, type AjaxOperation } from '@/components/ui/ajax-loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  DollarSign, 
  Eye, 
  MousePointer, 
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  X,
  Upload,
  MapPin,
  ArrowLeft,
  BookOpen,
  Shield,
  CreditCard
} from 'lucide-react';
import BillingPage from '@/components/BillingPage';

interface AdBanner {
  id: string;
  userId?: string;
  title?: string;
  imageUrl: string;
  placement: string;
  size: string;
  status: string;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
  targetLocations?: string[] | null;
  targetGrades?: number[] | null;
  minAge?: number | null;
  maxAge?: number | null;
  userName?: string;
  userEmail?: string;
}

// Updated placement options to match requirements
const PLACEMENT_OPTIONS = [
  { value: 'student_dashboard', label: 'Student Dashboard' },
  { value: 'teacher_dashboard', label: 'Teacher Dashboard' },
  { value: 'freelancer_dashboard', label: 'Freelancer Dashboard' },
  { value: 'advertise_page', label: 'Advertise Page' },
];

const AD_SIZES = [
  { value: '728x90', label: 'Leaderboard (728x90)' },
  { value: '970x90', label: 'Large Leaderboard (970x90)' },
  { value: '970x250', label: 'Billboard (970x250)' },
  { value: '300x250', label: 'Medium Rectangle (300x250)' },
  { value: '336x280', label: 'Large Rectangle (336x280)' },
  { value: '300x600', label: 'Half Page Banner (300x600)' },
  { value: '160x600', label: 'Wide Skyscraper (160x600)' },
  { value: '250x250', label: 'Square Banner (250x250)' },
  { value: '320x100', label: 'Mobile Banner (320x100)' },
  { value: 'responsive', label: 'Responsive' },
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

interface AdsDashboardProps {
  onNavigate?: (page: string) => void;
}

const NON_ADMIN_USER_MESSAGE = {
  title: "Create Paid Advertisement",
  description: "Create and pay for your advertisement to reach our community",
  buttonText: "Create Paid Ad",
  ctaText: "Ready to advertise? Create your ad and complete payment to get started."
};

// Quick region selection for admins
const QUICK_REGIONS = {
  'North America': ['US', 'CA', 'MX'],
  'Europe': ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK'],
  'Asia Pacific': ['CN', 'JP', 'KR', 'SG', 'AU', 'IN', 'TH', 'MY'],
  'Africa': ['ZA', 'NG', 'KE', 'GH', 'EG', 'MA'],
  'South America': ['BR', 'AR', 'CL', 'CO', 'PE'],
  'Middle East': ['AE', 'SA', 'QA', 'KW', 'BH', 'OM']
};

// Country selector component for targeting
const CountrySelector = ({ selectedCountries, onCountryToggle, countries }: {
  selectedCountries: string[];
  onCountryToggle: (countryCode: string) => void;
  countries: {id: number, code: string, name: string}[];
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
      {/* Admin Quick Regions */}
      <div className="bg-orange-100 border border-white rounded-lg p-4">
        <div className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Admin Quick Regions
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(QUICK_REGIONS).map(([region, codes]) => (
            <Button
              key={region}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickRegionSelect(codes)}
              className="text-xs bg-white hover:bg-orange-50 border-white text-gray-900"
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
            className="text-xs bg-white hover:bg-red-100 border-white text-red-600"
          >
            Clear All ({selectedCountries.length})
          </Button>
          {selectedCountries.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedCountries.length} countries selected
            </Badge>
          )}
        </div>
      </div>

      {/* Individual Country Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-3">
        {countries && countries.length > 0 ? (
          countries.map((country) => (
            <div key={country.code} className="flex items-center space-x-2">
              <Checkbox
                id={country.code}
                checked={selectedCountries.includes(country.code)}
                onCheckedChange={() => onCountryToggle(country.code)}
              />
              <label
                htmlFor={country.code}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {country.name}
              </label>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-4">
            No countries available ({countries?.length || 0} countries loaded)
          </div>
        )}
      </div>
    </div>
  );
};

export default function AdsDashboard({ onNavigate }: AdsDashboardProps) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'billing'>('dashboard');
  const [ajaxOperation, setAjaxOperation] = useState<AjaxOperation>('idle');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  // Check if user is admin
  const isAdmin = profile?.role === 'admin';
  const [newAd, setNewAd] = useState({
    title: '',
    imageUrl: '',
    placement: 'student_dashboard',
    size: '728x90',
    price: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetLocations: [] as string[],
    targetGrades: [] as number[],
    minAge: null as number | null,
    maxAge: null as number | null,
    linkUrl: '',
  });

  // Fetch countries data
  const { data: countriesData = [] } = useQuery<{id: number, code: string, name: string}[]>({
    queryKey: ['/api/countries'],
    queryFn: async () => {
      const response = await apiRequest('/api/countries');
      const data = response?.data || response || [];
      return data;
    },
  });

  // Fetch ads data - use different endpoint based on user role
  const adsEndpoint = isAdmin ? '/api/ads/manage' : '/api/ads/my-ads';
  const { data: ads = [], isLoading, error } = useQuery<AdBanner[]>({
    queryKey: [adsEndpoint],
    queryFn: async () => {
      const response = await apiRequest(adsEndpoint);
      // The apiRequest returns the ads array directly
      return Array.isArray(response) ? response : (response?.data?.data || response?.data || []);
    },
  });

  // Calculate analytics
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00';

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

  // Create ad mutation - handle differently for admin vs non-admin users
  const createAdMutation = useMutation({
    mutationFn: async (data: typeof newAd & { file?: File }) => {
      setAjaxOperation('adding');
      
      // Upload image first if file is provided
      let imageUrl = data.imageUrl;
      if (data.file) {
        setAjaxOperation('uploading');
        try {
          const uploadResult = await uploadImageMutation.mutateAsync(data.file);
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Failed to upload image');
          }
          imageUrl = uploadResult.url;
          setAjaxOperation('adding');
        } catch (error) {
          throw error;
        }
      }

      // Calculate duration in days from start and end dates
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (isAdmin) {
        // Admin users can create ads directly (free)
        await apiRequest('/api/ads/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            imageUrl,
            durationDays
          })
        });
        return { success: true, usedCredits: false, isAdmin: true };
      } else {
        // Non-admin users - check credits or require payment
        // Map AdsDashboard placement values to BannerCreator targetDashboard values
        const placementToDashboardMapping: Record<string, string> = {
          'student_dashboard': 'learner',
          'teacher_dashboard': 'teacher',
          'freelancer_dashboard': 'freelancer',
          'customer_dashboard': 'customer',
          'advertise_page': 'advertise_page'
        };
        
        const targetDashboard = placementToDashboardMapping[data.placement] || 'learner';
        
        const bannerData = {
          title: data.title,
          imageUrl,
          targetDashboards: [targetDashboard],
          size: data.size,
          durationDays,
          targetLocations: data.targetLocations && data.targetLocations.length > 0 ? data.targetLocations : null,
          targetGrades: data.targetGrades && data.targetGrades.length > 0 ? data.targetGrades : null,
          minAge: data.minAge || null,
          maxAge: data.maxAge || null,
        };

        const result = await apiRequest('/api/ads/banner/create-with-payment', {
          method: 'POST',
          body: JSON.stringify(bannerData)
        });

        if (result.success && result.usedCredits) {
          // User has membership credits - ad created without payment
          return { success: true, usedCredits: true };
        } else if (result.success && result.clientSecret) {
          // User needs to pay - store payment details and navigate to payment page
          localStorage.setItem('pendingPaymentData', JSON.stringify({
            clientSecret: result.clientSecret,
            paymentIntentId: result.paymentIntentId,
            bannerId: result.bannerId,
            amount: result.amount,
            bannerTitle: data.title
          }));
          
          // Navigate to payment page
          onNavigate?.('banner-payment');
          return { success: true, needsPayment: true };
        } else {
          throw new Error(result.error || 'Failed to create banner ad');
        }
      }
    },
    onSuccess: (result) => {
      if (result.needsPayment) {
        // User needs payment - navigation already happened in mutationFn
        // Don't reset form or change view
        return;
      }
      
      // Admin or user with credits - show success and return to dashboard
      setAjaxOperation('success');
      queryClient.invalidateQueries({ queryKey: [adsEndpoint] });
      setTimeout(() => {
        setCurrentView('dashboard');
        setAjaxOperation('idle');
        setNewAd({
          title: '',
          imageUrl: '',
          placement: 'student_dashboard',
          size: '728x90',
          price: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          targetLocations: [],
          targetGrades: [],
          minAge: null,
          maxAge: null,
          linkUrl: '',
        });
      }, 1500);
    },
    onError: (error: any) => {
      setAjaxOperation('error');
      setFormErrors([error.message || 'Failed to create ad']);
      setTimeout(() => setAjaxOperation('idle'), 3000);
    },
  });


  // Delete ad mutation
  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      setAjaxOperation('deleting');
      await apiRequest(`/api/ads/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      setAjaxOperation('success');
      queryClient.invalidateQueries({ queryKey: [adsEndpoint] });
      setTimeout(() => setAjaxOperation('idle'), 1500);
    },
    onError: (error: any) => {
      setAjaxOperation('error');
      setFormErrors([error.message || 'Failed to delete ad']);
      setTimeout(() => setAjaxOperation('idle'), 3000);
    },
  });

  // Approve ad mutation
  const approveAdMutation = useMutation({
    mutationFn: async (id: string) => {
      setAjaxOperation('updating');
      await apiRequest(`/api/ads/approve/${id}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      setAjaxOperation('success');
      queryClient.invalidateQueries({ queryKey: ['/api/ads/manage'] });
      setTimeout(() => setAjaxOperation('idle'), 1500);
    },
    onError: (error: any) => {
      setAjaxOperation('error');
      setFormErrors([error.message || 'Failed to approve ad']);
      setTimeout(() => setAjaxOperation('idle'), 3000);
    },
  });

  // Reject ad mutation
  const rejectAdMutation = useMutation({
    mutationFn: async (id: string) => {
      setAjaxOperation('updating');
      await apiRequest(`/api/ads/reject/${id}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      setAjaxOperation('success');
      queryClient.invalidateQueries({ queryKey: ['/api/ads/manage'] });
      setTimeout(() => setAjaxOperation('idle'), 1500);
    },
    onError: (error: any) => {
      setAjaxOperation('error');
      setFormErrors([error.message || 'Failed to reject ad']);
      setTimeout(() => setAjaxOperation('idle'), 3000);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-blue-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const AdForm = ({ ad, onSubmit, onCancel }: { 
    ad?: AdBanner; 
    onSubmit: (data: typeof newAd) => void; 
    onCancel: () => void; 
  }) => {
    const [formData, setFormData] = useState(ad ? {
      title: ad.title || '',
      imageUrl: ad.imageUrl,
      placement: ad.placement,
      size: ad.size,
      price: 0,
      startDate: ad.startDate.split('T')[0],
      endDate: ad.endDate.split('T')[0],
      targetLocations: ad.targetLocations || [],
      targetGrades: ad.targetGrades || [],
      minAge: ad.minAge || null,
      maxAge: ad.maxAge || null,
      linkUrl: '',
    } : newAd);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(ad?.imageUrl || null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedCountries, setSelectedCountries] = useState<string[]>(ad?.targetLocations || []);
    const [selectedGrades, setSelectedGrades] = useState<number[]>(ad?.targetGrades || []);

    return (
      <div className="space-y-4">
        <div>
          <Label>Ad Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Enter a descriptive title for your ad"
            className="mt-1"
            data-testid="input-ad-title"
          />
        </div>

        <div>
          <Label>Banner Image</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 text-center mt-1">
            <Upload className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400 mb-2 md:mb-4" />
            <div className="space-y-2">
              <div className="text-xs md:text-sm text-gray-600">
                {selectedFile ? (
                  <p className="font-medium text-green-600 break-all">{selectedFile.name}</p>
                ) : imagePreview ? (
                  <p className="font-medium text-blue-600">Current image uploaded</p>
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
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setImagePreview(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                id="banner-image-upload"
                data-testid="input-banner-image"
              />
              <label
                htmlFor="banner-image-upload"
                className="cursor-pointer inline-flex items-center px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-md shadow-sm text-xs md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Choose File
              </label>
            </div>
            {imagePreview && (
              <div className="mt-2 md:mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-24 md:max-h-32 mx-auto rounded border"
                />
              </div>
            )}
          </div>
        </div>


        <div>
          <Label>Placement (Dashboard)</Label>
          <Select 
            value={formData.placement} 
            onValueChange={(value) => setFormData({...formData, placement: value})}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select placement" />
            </SelectTrigger>
            <SelectContent>
              {PLACEMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">Choose which dashboard this ad will appear in</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Size</Label>
            <Select 
              value={formData.size} 
              onValueChange={(value) => setFormData({...formData, size: value})}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AD_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Price ($) - Optional</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
              placeholder="0.00"
              className="mt-1"
              data-testid="input-ad-price"
            />
            <p className="text-xs text-gray-500 mt-1">Optional pricing field</p>
          </div>
        </div>

        <div>
          <Label>Click-through URL (Optional)</Label>
          <Input
            type="url"
            value={formData.linkUrl}
            onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
            placeholder="https://example.com"
            className="mt-1"
            data-testid="input-ad-link-url"
          />
          <p className="text-xs text-gray-500 mt-1">Where users will go when they click the ad</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="mt-1"
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="mt-1"
            />
          </div>
        </div>

        {/* Country Targeting Section */}
        <div>
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            Location Targeting
          </Label>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Select specific countries to target, or leave empty for worldwide reach.
          </p>
          <CountrySelector 
            selectedCountries={selectedCountries}
            onCountryToggle={(countryCode) => {
              const newSelected = selectedCountries.includes(countryCode) 
                ? selectedCountries.filter(code => code !== countryCode)
                : [...selectedCountries, countryCode];
              setSelectedCountries(newSelected);
              setFormData({...formData, targetLocations: newSelected});
            }}
            countries={countriesData}
          />
        </div>

        {/* Grade Targeting Section */}
        <div>
          <Label className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Grade Targeting (Optional)
          </Label>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Select specific grade levels to target, or leave empty to reach all grades.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {GRADES.map((grade) => (
              <div key={grade.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`grade-${grade.value}`}
                  checked={selectedGrades.includes(grade.value)}
                  onCheckedChange={() => {
                    const newSelected = selectedGrades.includes(grade.value)
                      ? selectedGrades.filter(g => g !== grade.value)
                      : [...selectedGrades, grade.value];
                    setSelectedGrades(newSelected);
                    setFormData({...formData, targetGrades: newSelected});
                  }}
                  data-testid={`checkbox-grade-${grade.value}`}
                />
                <label
                  htmlFor={`grade-${grade.value}`}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {grade.label}
                  <div className="text-xs text-gray-500">{grade.ageRange}</div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Age Restrictions Section */}
        <div>
          <Label className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            Age Restrictions (Optional)
          </Label>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Set age limits to ensure appropriate content targeting for child safety.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Minimum Age</Label>
              <Input
                type="number"
                min="5"
                max="99"
                value={formData.minAge || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  minAge: e.target.value ? parseInt(e.target.value) : null
                })}
                placeholder="e.g., 13"
                className="mt-1"
                data-testid="input-min-age"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum age to display this ad</p>
            </div>
            <div>
              <Label>Maximum Age</Label>
              <Input
                type="number"
                min="5"
                max="99"
                value={formData.maxAge || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  maxAge: e.target.value ? parseInt(e.target.value) : null
                })}
                placeholder="e.g., 18"
                className="mt-1"
                data-testid="input-max-age"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum age to display this ad</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Display Form Errors */}
        {formErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Please fix the following issues:</h3>
                <ul className="mt-1 list-disc list-inside text-sm text-red-700">
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
                ajaxOperation === 'adding' ? 'Creating advertisement...' :
                ajaxOperation === 'updating' ? 'Updating advertisement...' :
                ajaxOperation === 'uploading' ? 'Uploading image...' :
                ajaxOperation === 'success' ? (ad ? 'Ad updated successfully!' : 'Ad created successfully!') :
                ajaxOperation === 'error' ? 'Operation failed' :
                undefined
              }
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={async () => {
              // Clear previous errors
              setFormErrors([]);
              
              // Validate required fields
              const errors = [];
              if (!formData.title.trim()) {
                errors.push('Please enter a title for your ad');
              }
              
              if (!ad && !selectedFile && !formData.imageUrl) {
                errors.push('Please select an image file');
              }
              
              if (errors.length > 0) {
                setFormErrors(errors);
                return;
              }
              
              // Pass file to mutation for upload
              const submitData = {
                ...formData, 
                targetLocations: selectedCountries,
                targetGrades: selectedGrades,
                minAge: formData.minAge,
                maxAge: formData.maxAge,
                file: selectedFile || undefined
              };
              onSubmit(submitData);
            }}
            disabled={createAdMutation.isPending || uploadingImage || (!ad && !selectedFile && !formData.imageUrl)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg"
            data-testid="create-ad-button"
          >
            {uploadingImage ? 'Uploading...' : createAdMutation.isPending ? 'Processing...' : 'Create Ad'}
          </Button>
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  };

  // Render Create Ad Page
  if (currentView === 'create') {
    return (
      <div className="container mx-auto px-6 pt-6 pb-0 space-y-3">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCurrentView('dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Ad</h1>
            <p className="text-gray-600 dark:text-gray-400">Create a new ad with file upload and placement selection</p>
          </div>
        </div>
        
        {/* Create Form */}
        <AdForm
          onSubmit={(data) => createAdMutation.mutate(data)}
          onCancel={() => setCurrentView('dashboard')}
        />
      </div>
    );
  }


  // Render Billing View
  if (currentView === 'billing') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCurrentView('dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your payment methods for advertising</p>
          </div>
        </div>
        
        {/* Billing Page */}
        <BillingPage />
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isAdmin ? 'Ads Management' : 'My Advertisements'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isAdmin 
              ? 'Manage banner advertisements with full CRUD operations' 
              : 'View and manage your paid advertisements'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setCurrentView('billing')}
            variant="outline"
            className="text-gray-700"
            data-testid="button-billing"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </Button>
          <Button 
            onClick={() => setCurrentView('create')}
            className="text-white bg-[#f64e3c]"
            data-testid="button-create-ad"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Ad
          </Button>
        </div>
      </div>

      {/* AJAX Status Display */}
      {ajaxOperation !== 'idle' && (
        <div className="mb-4">
          <AjaxLoader 
            operation={ajaxOperation} 
            message={
              ajaxOperation === 'deleting' ? 'Deleting advertisement...' :
              ajaxOperation === 'updating' ? 'Processing request...' :
              ajaxOperation === 'success' ? 'Operation completed successfully!' :
              ajaxOperation === 'error' ? 'Operation failed' :
              undefined
            }
          />
        </div>
      )}

      {/* Display Form Errors */}
      {formErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error:</h3>
              <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Total Ads' : 'My Ads'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCTR}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Ads Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? 'All Advertisements' : 'My Advertisements'}</CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Manage ads with CRUD operations and placement-based display' 
              : 'Track your ad performance and manage your campaigns'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading ads...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Error loading ads</div>
          ) : ads.length === 0 ? (
            <div className="text-center py-8">No ads found. Create your first ad!</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Countries</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <img 
                          src={ad.imageUrl} 
                          alt="Ad" 
                          className="w-16 h-10 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ad.placement.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(ad.status)}</TableCell>
                      <TableCell className="text-xs">
                        <div>{formatDate(ad.startDate)}</div>
                        <div>{formatDate(ad.endDate)}</div>
                      </TableCell>
                      <TableCell>
                        {ad.targetLocations && ad.targetLocations.length > 0 
                          ? ad.targetLocations.join(', ') 
                          : 'Global'
                        }
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{ad.impressions} views</div>
                        <div>{ad.clicks} clicks</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteAdMutation.mutate(ad.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-ad-${ad.id}`}
                            title="Delete Ad"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {isAdmin && ad.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => approveAdMutation.mutate(ad.id)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                data-testid={`button-approve-ad-${ad.id}`}
                                title="Approve Ad"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => rejectAdMutation.mutate(ad.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`button-reject-ad-${ad.id}`}
                                title="Reject Ad"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
