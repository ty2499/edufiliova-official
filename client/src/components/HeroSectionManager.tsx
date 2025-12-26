import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Image,
  Monitor,
  Tablet,
  Smartphone,
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
  ArrowLeft,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize
} from 'lucide-react';

// Import AJAX components
import { AjaxLoader, AjaxButton } from '@/components/ui/ajax-loader';

type AjaxOperation = 'idle' | 'adding' | 'updating' | 'deleting' | 'uploading' | 'success' | 'error';

interface HeroSection {
  id: string;
  userId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  placement: string;
  desktopImageUrl: string;
  tabletImageUrl: string;
  mobileImageUrl: string;
  linkUrl?: string;
  buttonText?: string;
  secondButtonText?: string;
  secondButtonUrl?: string;
  status: string;
  priority: number;
  startDate?: string;
  endDate?: string;
  textColor: string;
  backgroundColor: string;
  overlayOpacity: number;
  isFullHeight: boolean;
  customHeight?: string;
  contentAlignment: string;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
}

// Placement options for hero sections
const PLACEMENT_OPTIONS = [
  { value: 'home', label: 'Home Page' },
  { value: 'about', label: 'About Page' },
  { value: 'contact', label: 'Contact Page' },
  { value: 'shop', label: 'Shop Page' },
  { value: 'shop_auth', label: 'Shop Auth Page' },
  { value: 'courses', label: 'Courses Page' },
  { value: 'portfolio', label: 'Portfolio Page' },
  { value: 'community', label: 'Community Page' },
  { value: 'advertise', label: 'Advertise Page' },
  { value: 'talent', label: 'Talent Page' },
  { value: 'auth', label: 'Authentication Pages' },
  { value: 'freelancer', label: 'Freelancer Pages' },
  { value: 'blog', label: 'Blog Page' },
];

// Placement-specific responsive image dimensions
const PLACEMENT_DIMENSIONS = {
  home: {
    desktop: '1600 × 500px',
    tablet: '1024 × 300px',
    mobile: '375 × 200px'
  },
  about: {
    desktop: '1600 × 500px',
    tablet: '1024 × 300px',
    mobile: '375 × 200px'
  },
  contact: {
    desktop: '1600 × 500px',
    tablet: '1024 × 300px',
    mobile: '375 × 200px'
  },
  shop: {
    desktop: '1600 × 500px',
    tablet: '1024 × 300px',
    mobile: '375 × 200px'
  },
  shop_auth: {
    desktop: '960 × 1080px', // Half-width for split layout
    tablet: '512 × 768px',   // Half-width for split layout
    mobile: '375 × 667px'    // Full-width on mobile
  },
  courses: {
    desktop: '1600 × 500px',
    tablet: '1024 × 300px',
    mobile: '375 × 200px'
  },
  portfolio: {
    desktop: '1600 × 500px',
    tablet: '1024 × 300px',
    mobile: '375 × 200px'
  },
  community: {
    desktop: '1600 × 500px',
    tablet: '1024 × 300px',
    mobile: '375 × 200px'
  },
  advertise: {
    desktop: '1600 × 500px',
    tablet: '1024 × 300px',
    mobile: '375 × 200px'
  },
  talent: {
    desktop: '1600 × 500px',
    tablet: '1024 × 300px',
    mobile: '375 × 200px'
  },
  auth: {
    desktop: '960 × 1080px', // Half-width for split layout
    tablet: '512 × 768px',   // Half-width for split layout  
    mobile: '375 × 667px'    // Full-width on mobile
  },
  freelancer: {
    desktop: '960 × 1080px', // Half-width for split layout
    tablet: '512 × 768px',   // Half-width for split layout
    mobile: '375 × 667px'    // Full-width on mobile
  },
  blog: {
    desktop: '1600 × 500px',
    tablet: '1024 × 300px',
    mobile: '375 × 200px'
  }
} as const;

const CONTENT_ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
];

// Image Upload Section Component (moved outside to prevent re-creation on render)
const ImageUploadSection = ({ 
  type, 
  icon, 
  dimensions, 
  currentUrl, 
  onUrlChange,
  isRequired = true
}: {
  type: string;
  icon: React.ElementType;
  dimensions: string;
  currentUrl: string;
  onUrlChange: (url: string) => void;
  isRequired?: boolean;
}) => {
  const Icon = icon;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || '');

  // Sync imagePreview with currentUrl prop when it changes
  useEffect(() => {
    setImagePreview(currentUrl || null);
    setUrlInput(currentUrl || '');
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image immediately
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'hero');

    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(sessionId && {
            'Authorization': `Bearer ${sessionId}`,
            'x-session-id': sessionId
          })
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      if (result.success) {
        onUrlChange(result.url);
        setUrlInput(result.url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    if (url.trim()) {
      onUrlChange(url.trim());
      setImagePreview(url.trim());
    }
  };

  return (
    <div className={`border-2 border-dashed rounded-lg p-4 text-center ${!currentUrl && isRequired ? 'border-red-300 bg-primary/10/30' : 'border-gray-300'}`}>
      <Icon className={`mx-auto h-8 w-8 mb-2 ${!currentUrl && isRequired ? 'text-red-400' : 'text-gray-400'}`} />
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900">
          {type} Image {isRequired && <span className="text-primary">*</span>}
        </p>
        <p className="text-xs text-gray-500">{dimensions}</p>
        {!currentUrl && isRequired && (
          <p className="text-xs text-primary font-medium">Required for publication</p>
        )}
        <div className="space-y-3">
          {imagePreview && (
            <img
              src={imagePreview}
              alt={`${type} preview`}
              className="max-w-full max-h-24 mx-auto rounded border"
            />
          )}
          
          {/* URL Input */}
          <div className="text-left">
            <Label className="text-xs text-gray-600">Image URL (supports GIF)</Label>
            <Input
              type="url"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg or .gif"
              className="mt-1 text-xs"
              data-testid={`input-${type.toLowerCase()}-url`}
            />
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* File Upload */}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id={`${type.toLowerCase()}-image-upload`}
              data-testid={`input-${type.toLowerCase()}-image-file`}
            />
            <label
              htmlFor={`${type.toLowerCase()}-image-upload`}
              className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
            >
              {uploading ? (
                <>
                  <Upload className="h-3 w-3 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3 mr-1" />
                  Upload File
                </>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// HeroForm Component (moved outside to prevent re-creation on render)
const HeroForm = ({ 
  hero, 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  formErrors, 
  setFormErrors, 
  ajaxOperation, 
  createHeroMutation, 
  updateHeroMutation 
}: { 
  hero?: HeroSection; 
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (data: any) => void; 
  onCancel: () => void;
  formErrors: string[];
  setFormErrors: (errors: string[]) => void;
  ajaxOperation: AjaxOperation;
  createHeroMutation: any;
  updateHeroMutation: any;
}) => {
  const [hasInitialized, setHasInitialized] = useState<string | false>(false);
  
  // Initialize form data from hero when editing (only once per hero to prevent typing flicker)
  useEffect(() => {
    if (hero && (!hasInitialized || hasInitialized !== hero.id)) {
      setFormData({
        title: hero.title,
        subtitle: hero.subtitle || '',
        description: hero.description || '',
        placement: hero.placement,
        desktopImageUrl: hero.desktopImageUrl,
        tabletImageUrl: hero.tabletImageUrl,
        mobileImageUrl: hero.mobileImageUrl,
        linkUrl: hero.linkUrl || '',
        buttonText: hero.buttonText || '',
        secondButtonText: hero.secondButtonText || '',
        secondButtonUrl: hero.secondButtonUrl || '',
        priority: hero.priority,
        startDate: hero.startDate ? hero.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: hero.endDate ? hero.endDate.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        textColor: hero.textColor,
        backgroundColor: hero.backgroundColor,
        overlayOpacity: hero.overlayOpacity,
        isFullHeight: hero.isFullHeight,
        customHeight: hero.customHeight || '',
        contentAlignment: hero.contentAlignment,
      });
      setHasInitialized(hero.id);
    } else if (!hero) {
      setHasInitialized(false);
    }
  }, [hero, hasInitialized, setFormData]);

  const handleSubmit = () => {
    const errors = [];
    
    // Check for title
    if (!formData.title.trim()) {
      errors.push('Title is required');
    }
    
    // At least one image is required for a new hero section
    if (!hero && !formData.desktopImageUrl && !formData.tabletImageUrl && !formData.mobileImageUrl) {
      errors.push('At least one image (desktop, tablet, or mobile) is required');
    }
    
    // Check for placement
    if (!formData.placement) {
      errors.push('Placement page is required');
    }
    
    // Show all errors at once
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">
                Hero Title <span className="text-primary">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter compelling title"
                className={`mt-1 ${!formData.title.trim() ? 'border-red-300 focus:border-primary' : ''}`}
                data-testid="input-hero-title"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                Placement Page <span className="text-primary">*</span>
              </Label>
              <Select 
                value={formData.placement} 
                onValueChange={(value) => setFormData({...formData, placement: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Hero Subtitle (Optional)</Label>
            <Textarea
              value={formData.subtitle}
              onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
              placeholder="Enter descriptive subtitle"
              className="mt-1"
              rows={3}
              data-testid="input-hero-subtitle"
            />
          </div>

          <div>
            <Label>Hero Description (Optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter engaging description text that will appear in the hero section"
              className="mt-1"
              rows={4}
              data-testid="input-hero-description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Priority (Order)</Label>
              <Input
                type="number"
                min="1"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                className="mt-1"
                data-testid="input-hero-priority"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers show first</p>
            </div>
            <div>
              <Label>Content Alignment</Label>
              <Select 
                value={formData.contentAlignment} 
                onValueChange={(value) => setFormData({...formData, contentAlignment: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_ALIGNMENT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Responsive Images
          </CardTitle>
          <CardDescription>
            All images are optional and can be updated independently at any time. If a device-specific image is not provided, the system will use the closest available image as fallback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const dims = PLACEMENT_DIMENSIONS[formData.placement as keyof typeof PLACEMENT_DIMENSIONS] || PLACEMENT_DIMENSIONS.home;
              return (
                <>
                  <ImageUploadSection
                    type="Desktop"
                    icon={Monitor}
                    dimensions={dims.desktop}
                    currentUrl={formData.desktopImageUrl}
                    onUrlChange={(url) => setFormData({...formData, desktopImageUrl: url})}
                    isRequired={false}
                  />
                  <ImageUploadSection
                    type="Tablet"
                    icon={Tablet}
                    dimensions={dims.tablet}
                    currentUrl={formData.tabletImageUrl}
                    onUrlChange={(url) => setFormData({...formData, tabletImageUrl: url})}
                    isRequired={false}
                  />
                  <ImageUploadSection
                    type="Mobile"
                    icon={Smartphone}
                    dimensions={dims.mobile}
                    currentUrl={formData.mobileImageUrl}
                    onUrlChange={(url) => setFormData({...formData, mobileImageUrl: url})}
                    isRequired={false}
                  />
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Call-to-Action */}
      <Card>
        <CardHeader>
          <CardTitle>Call-to-Action (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Button Text</Label>
              <Input
                value={formData.buttonText}
                onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                placeholder="Learn More"
                className="mt-1"
                data-testid="input-hero-button-text"
              />
            </div>
            <div>
              <Label>First Button URL</Label>
              <Input
                type="url"
                value={formData.linkUrl}
                onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                placeholder="https://example.com"
                className="mt-1"
                data-testid="input-hero-link-url"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Second Button Text (Optional)</Label>
              <Input
                value={formData.secondButtonText}
                onChange={(e) => setFormData({...formData, secondButtonText: e.target.value})}
                placeholder="Contact Us"
                className="mt-1"
                data-testid="input-hero-second-button-text"
              />
            </div>
            <div>
              <Label>Second Button URL (Optional)</Label>
              <Input
                type="url"
                value={formData.secondButtonUrl}
                onChange={(e) => setFormData({...formData, secondButtonUrl: e.target.value})}
                placeholder="https://example.com/contact"
                className="mt-1"
                data-testid="input-hero-second-button-url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style & Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Style & Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Text Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  value={formData.textColor}
                  onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Overlay Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Overlay Opacity: {formData.overlayOpacity}%</Label>
            <Slider
              value={[formData.overlayOpacity]}
              onValueChange={(value) => setFormData({...formData, overlayOpacity: value[0]})}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="fullHeight"
                checked={formData.isFullHeight}
                onCheckedChange={(checked) => setFormData({...formData, isFullHeight: !!checked})}
              />
              <Label htmlFor="fullHeight" className="flex items-center gap-2">
                <Maximize className="h-4 w-4" />
                Full viewport height
              </Label>
            </div>
            
            {!formData.isFullHeight && (
              <div>
                <Label>Custom Height</Label>
                <Input
                  value={formData.customHeight}
                  onChange={(e) => setFormData({...formData, customHeight: e.target.value})}
                  placeholder="400px or 50vh"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Use CSS values like 400px, 50vh, etc.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

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
              ajaxOperation === 'adding' ? 'Creating hero section...' :
              ajaxOperation === 'updating' ? 'Updating hero section...' :
              ajaxOperation === 'deleting' ? 'Deleting hero section...' :
              ajaxOperation === 'success' ? (hero ? 'Hero section updated successfully!' : 'Hero section created successfully!') :
              ajaxOperation === 'error' ? 'Operation failed' :
              undefined
            }
          />
        </div>
      )}

      <Separator />

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <AjaxButton
          operation={ajaxOperation}
          onClick={handleSubmit}
          disabled={createHeroMutation.isPending || updateHeroMutation.isPending}
          className="w-full sm:w-auto"
          data-testid="button-save-hero"
          loadingText={
            ajaxOperation === 'adding' ? 'Creating hero section...' : 
            ajaxOperation === 'updating' ? 'Updating hero section...' :
            'Processing...'
          }
          successText={hero ? 'Hero Updated!' : 'Hero Created!'}
          errorText="Try Again"
        >
          {hero ? 'Update' : 'Create'} Hero Section
        </AjaxButton>
        <Button 
          variant="outline" 
          onClick={onCancel} 
          className="w-full sm:w-auto px-6 py-3"
          size="lg"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
};

interface HeroSectionManagerProps {
  onNavigate?: (page: string) => void;
}

export default function HeroSectionManager({ onNavigate }: HeroSectionManagerProps) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [ajaxOperation, setAjaxOperation] = useState<AjaxOperation>('idle');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'edit'>('dashboard');
  const [editingHero, setEditingHero] = useState<HeroSection | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [heroToDelete, setHeroToDelete] = useState<HeroSection | null>(null);
  const [newHero, setNewHero] = useState({
    title: '',
    subtitle: '',
    description: '',
    placement: 'home',
    desktopImageUrl: '',
    tabletImageUrl: '',
    mobileImageUrl: '',
    linkUrl: '',
    buttonText: '',
    secondButtonText: '',
    secondButtonUrl: '',
    priority: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    overlayOpacity: 30,
    isFullHeight: true,
    customHeight: '',
    contentAlignment: 'center',
  });

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  // Fetch hero sections data
  const { data: heroSections = [], isLoading, error } = useQuery<HeroSection[]>({
    queryKey: ['/api/hero-sections/manage'],
    queryFn: async () => {
      const response = await apiRequest('/api/hero-sections/manage');
      return Array.isArray(response) ? response : (response?.data || []);
    },
    enabled: !!profile && isAdmin, // Only fetch if profile is loaded and user is admin
  });

  // Calculate analytics
  const totalImpressions = heroSections.reduce((sum, hero) => sum + hero.impressions, 0);
  const totalClicks = heroSections.reduce((sum, hero) => sum + hero.clicks, 0);
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00';

  // Create hero mutation
  const createHeroMutation = useMutation({
    mutationFn: async (data: typeof newHero) => {
      setAjaxOperation('adding');
      setFormErrors([]);
      await apiRequest('/api/hero-sections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      setAjaxOperation('success');
      queryClient.invalidateQueries({ queryKey: ['/api/hero-sections/manage'] });
      setCurrentView('dashboard');
      resetNewHeroForm();
      setTimeout(() => setAjaxOperation('idle'), 2000);
    },
    onError: (error: any) => {
      setAjaxOperation('error');
      // Parse server-side validation errors if available
      let errorMessages = ['Failed to create hero section'];
      
      if (error?.details && Array.isArray(error.details)) {
        // Extract field-specific errors from Zod validation
        errorMessages = error.details
          .slice(0, 5) // Show up to 5 errors
          .map((err: any) => `${err.path?.join('.') || 'Field'}: ${err.message}`);
      } else if (error?.message) {
        errorMessages = [error.message];
      }
      
      setFormErrors(errorMessages);
      setTimeout(() => setAjaxOperation('idle'), 3000);
    },
  });

  // Update hero mutation
  const updateHeroMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof newHero> }) => {
      setAjaxOperation('updating');
      setFormErrors([]);
      await apiRequest(`/api/hero-sections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      setAjaxOperation('success');
      queryClient.invalidateQueries({ queryKey: ['/api/hero-sections/manage'] });
      setEditingHero(null);
      setCurrentView('dashboard');
      setTimeout(() => setAjaxOperation('idle'), 2000);
    },
    onError: (error: any) => {
      setAjaxOperation('error');
      // Parse server-side validation errors if available
      let errorMessages = ['Failed to update hero section'];
      
      if (error?.details && Array.isArray(error.details)) {
        // Extract field-specific errors from Zod validation
        errorMessages = error.details
          .slice(0, 5) // Show up to 5 errors
          .map((err: any) => `${err.path?.join('.') || 'Field'}: ${err.message}`);
      } else if (error?.message) {
        errorMessages = [error.message];
      }
      
      setFormErrors(errorMessages);
      setTimeout(() => setAjaxOperation('idle'), 3000);
    },
  });

  // Delete hero mutation
  const deleteHeroMutation = useMutation({
    mutationFn: async (id: string) => {
      setAjaxOperation('deleting');
      setFormErrors([]);
      await apiRequest(`/api/hero-sections/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      setAjaxOperation('success');
      queryClient.invalidateQueries({ queryKey: ['/api/hero-sections/manage'] });
      setDeleteDialogOpen(false);
      setHeroToDelete(null);
      setTimeout(() => setAjaxOperation('idle'), 2000);
    },
    onError: (error: any) => {
      setAjaxOperation('error');
      setFormErrors([error.message || 'Failed to delete hero section']);
      setTimeout(() => {
        setAjaxOperation('idle');
        setDeleteDialogOpen(false);
        setHeroToDelete(null);
      }, 3000);
    },
  });

  const handleDeleteClick = (hero: HeroSection) => {
    setHeroToDelete(hero);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (heroToDelete) {
      deleteHeroMutation.mutate(heroToDelete.id);
    }
  };

  // Activate/Deactivate hero mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      setAjaxOperation('updating');
      setFormErrors([]);
      await apiRequest(`/api/hero-sections/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      setAjaxOperation('success');
      queryClient.invalidateQueries({ queryKey: ['/api/hero-sections/manage'] });
      setTimeout(() => setAjaxOperation('idle'), 2000);
    },
    onError: (error: any) => {
      setAjaxOperation('error');
      setFormErrors([error.message || 'Failed to update status']);
      setTimeout(() => setAjaxOperation('idle'), 3000);
    },
  });

  const resetNewHeroForm = () => {
    setNewHero({
      title: '',
      subtitle: '',
      description: '',
      placement: 'home',
      desktopImageUrl: '',
      tabletImageUrl: '',
      mobileImageUrl: '',
      linkUrl: '',
      buttonText: '',
      secondButtonText: '',
      secondButtonUrl: '',
      priority: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      textColor: '#FFFFFF',
      backgroundColor: '#000000',
      overlayOpacity: 30,
      isFullHeight: true,
      customHeight: '',
      contentAlignment: 'center',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
      case 'scheduled':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Hero section management is only available to administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (currentView === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create Hero Section</h2>
        </div>
        <HeroForm 
          formData={newHero}
          setFormData={setNewHero}
          onSubmit={(data) => createHeroMutation.mutate(data)}
          onCancel={() => setCurrentView('dashboard')}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          ajaxOperation={ajaxOperation}
          createHeroMutation={createHeroMutation}
          updateHeroMutation={updateHeroMutation}
        />
      </div>
    );
  }

  if (currentView === 'edit' && editingHero) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Edit Hero Section</h2>
        </div>
        <HeroForm 
          hero={editingHero}
          formData={newHero}
          setFormData={setNewHero}
          onSubmit={(data) => updateHeroMutation.mutate({ id: editingHero.id, data })}
          onCancel={() => {
            setCurrentView('dashboard');
            setEditingHero(null);
          }}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          ajaxOperation={ajaxOperation}
          createHeroMutation={createHeroMutation}
          updateHeroMutation={updateHeroMutation}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Hero Section Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage responsive hero images across your website pages
          </p>
        </div>
        <Button
          onClick={() => setCurrentView('create')}
          className="flex items-center gap-2 px-6 py-3"
          size="lg"
          variant="orange"
          data-testid="button-create-hero"
        >
          <Plus className="h-5 w-5" />
          Create Hero Section
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Heroes</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{heroSections.length}</div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hero Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{heroToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={ajaxOperation === 'deleting'}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AjaxButton
              operation={ajaxOperation}
              onClick={handleDeleteConfirm}
              disabled={deleteHeroMutation.isPending}
              variant="destructive"
              data-testid="button-confirm-delete"
              loadingText="Deleting hero section..."
              successText="Deleted!"
              errorText="Failed to delete"
            >
              Delete Hero Section
            </AjaxButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hero Sections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Sections</CardTitle>
          <CardDescription>
            Manage all hero sections across your website pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : heroSections.length === 0 ? (
            <div className="text-center py-8">
              <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Hero Sections</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first hero section
              </p>
              <Button 
                onClick={() => setCurrentView('create')}
                variant="orange"
                size="lg"
                className="px-6 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Hero Section
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heroSections.map((hero) => (
                  <TableRow key={hero.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{hero.title}</div>
                        {hero.subtitle && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {hero.subtitle}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PLACEMENT_OPTIONS.find(p => p.value === hero.placement)?.label || hero.placement}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(hero.status)}</TableCell>
                    <TableCell>{hero.priority}</TableCell>
                    <TableCell>{hero.impressions.toLocaleString()}</TableCell>
                    <TableCell>{hero.clicks.toLocaleString()}</TableCell>
                    <TableCell>
                      {hero.impressions > 0 
                        ? ((hero.clicks / hero.impressions) * 100).toFixed(2) + '%'
                        : '0.00%'
                      }
                    </TableCell>
                    <TableCell>{formatDate(hero.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingHero(hero);
                            setCurrentView('edit');
                          }}
                          data-testid={`button-edit-hero-${hero.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({
                            id: hero.id,
                            status: hero.status === 'active' ? 'inactive' : 'active'
                          })}
                          data-testid={`button-toggle-hero-${hero.id}`}
                        >
                          {hero.status === 'active' ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(hero)}
                          data-testid={`button-delete-hero-${hero.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
