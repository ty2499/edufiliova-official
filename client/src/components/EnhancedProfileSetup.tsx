import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import PhoneNumberInput from '@/components/PhoneNumberInput';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Camera, 
  MapPin,
  Globe,
  Phone,
  Mail,
  Briefcase,
  Star,
  Award,
  LinkIcon,
  Plus,
  X,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Eye,
  ImageIcon,
  ExternalLink,
  Target,
  Users,
  Heart,
  MessageCircle,
  Settings,
  Save,
  RefreshCw
} from 'lucide-react';
import { 
  FaLinkedin, 
  FaTwitter, 
  FaInstagram, 
  FaBehance, 
  FaDribbble, 
  FaGithub,
  FaFacebook,
  FaYoutube
} from 'react-icons/fa';

// Enhanced Profile Data Interface
interface EnhancedProfile {
  // Basic Info
  name: string;
  displayName: string;
  professionalTitle?: string;
  tagline?: string;
  bio: string;
  professionalStatement?: string;
  
  // Contact Info
  email: string;
  contactEmail?: string;
  phoneNumber?: string;
  location?: string;
  country?: string;
  countryId?: number;
  websiteUrl?: string;
  
  // Professional Info
  skills?: string[];
  experience?: string;
  yearsOfExperience?: number;
  hourlyRate?: number;
  workAvailability?: 'available' | 'busy' | 'unavailable';
  responseTime?: string;
  languages?: string[];
  
  // Social Links
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    behance?: string;
    dribbble?: string;
    github?: string;
    facebook?: string;
    youtube?: string;
    other?: string;
  };
  
  // Portfolio
  portfolioLinks?: string[];
  featuredWorkIds?: string[];
  
  // Profile Meta
  avatarUrl?: string;
  coverImageUrl?: string;
  profileCompleteness?: number;
  verified?: boolean;
  verificationBadges?: string[];
}

// Social Media Icons Map
const SocialIcons = {
  linkedin: FaLinkedin,
  twitter: FaTwitter,
  instagram: FaInstagram,
  behance: FaBehance,
  dribbble: FaDribbble,
  github: FaGithub,
  facebook: FaFacebook,
  youtube: FaYoutube,
  other: Globe
};

// Profile Completeness Calculator
const calculateProfileCompleteness = (profile: EnhancedProfile): number => {
  const fields = [
    profile.name,
    profile.displayName,
    profile.professionalTitle,
    profile.bio,
    profile.professionalStatement,
    profile.location,
    profile.skills && profile.skills.length > 0,
    profile.experience,
    profile.avatarUrl,
    profile.contactEmail || profile.email,
    profile.websiteUrl || (profile.socialLinks && Object.keys(profile.socialLinks).length > 0),
    profile.hourlyRate,
    profile.languages && profile.languages.length > 0
  ];
  
  const completedFields = fields.filter(Boolean).length;
  return Math.round((completedFields / fields.length) * 100);
};

interface EnhancedProfileSetupProps {
  onProfileUpdate?: (profile: EnhancedProfile) => void;
  showPublicPreview?: boolean;
}

export function EnhancedProfileSetup({ onProfileUpdate, showPublicPreview = true }: EnhancedProfileSetupProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  // State Management
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  
  // Error State Management
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState<EnhancedProfile>({
    name: profile?.name || '',
    displayName: profile?.displayName || profile?.name || '',
    professionalTitle: profile?.professionalTitle || '',
    tagline: profile?.tagline || '',
    bio: profile?.bio || '',
    professionalStatement: profile?.professionalStatement || '',
    email: profile?.email || user?.email || '',
    contactEmail: profile?.contactEmail || '',
    phoneNumber: profile?.phoneNumber || '',
    location: profile?.location || '',
    websiteUrl: profile?.websiteUrl || '',
    skills: profile?.skills || [],
    experience: profile?.experience || '',
    yearsOfExperience: profile?.yearsOfExperience || 0,
    hourlyRate: profile?.hourlyRate ? Number(profile.hourlyRate) : 0,
    workAvailability: (profile?.workAvailability as 'available' | 'busy' | 'unavailable') || 'available',
    responseTime: profile?.responseTime || 'within 24 hours',
    languages: profile?.languages || [],
    socialLinks: profile?.socialLinks || {},
    portfolioLinks: profile?.portfolioLinks || [],
    featuredWorkIds: profile?.featuredWorkIds || [],
    avatarUrl: profile?.avatarUrl || '',
    coverImageUrl: profile?.coverImageUrl || '',
    profileCompleteness: 0,
    verified: profile?.verified || false,
    verificationBadges: profile?.verificationBadges || []
  });
  
  // Skills Management
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newPortfolioLink, setNewPortfolioLink] = useState('');
  
  // Social Links State
  const [newSocialPlatform, setNewSocialPlatform] = useState<keyof typeof SocialIcons>('linkedin');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  
  // Edit mode states for individual sections
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  
  // Location State
  const [countries, setCountries] = useState<{id: number, code: string, name: string}[]>([]);
  const [cities, setCities] = useState<{id: number, name: string, countryCode: string}[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [userSignupCountry, setUserSignupCountry] = useState<string>('');
  
  // Fetch countries on mount
  const { data: countriesData } = useQuery({
    queryKey: ['/api/countries'],
    queryFn: async () => {
      const response = await fetch('/api/countries');
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      throw new Error('Failed to fetch countries');
    }
  });
  
  useEffect(() => {
    if (countriesData) {
      setCountries(countriesData);
      
      // After countries load, set selected country from profile if available
      if (profile?.country && profile.country !== 'Unknown') {
        // Handle both country name and country code
        const byName = countriesData.find((c: any) => c.name === profile.country);
        const byCode = countriesData.find((c: any) => c.code === profile.country);
        const country = byName || byCode;
        if (country) {
          setSelectedCountry(country.code);
        }
      }
    }
  }, [countriesData, profile?.country]);
  
  // Fetch cities using React Query when country is selected
  const { data: citiesData, isLoading: loadingCities } = useQuery({
    queryKey: ['/api/cities', selectedCountry],
    enabled: !!selectedCountry,
    queryFn: async () => {
      const response = await fetch(`/api/cities/${selectedCountry}`);
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      throw new Error('Failed to fetch cities');
    }
  });
  
  useEffect(() => {
    setCities(citiesData || []);
  }, [citiesData]);

  // Update form state when profile data changes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        displayName: profile.displayName || profile.name || '',
        professionalTitle: profile.professionalTitle || '',
        tagline: profile.tagline || '',
        bio: profile.bio || '',
        professionalStatement: profile.professionalStatement || '',
        email: profile.email || user?.email || '',
        contactEmail: profile.contactEmail || '',
        phoneNumber: profile.phoneNumber || '',
        location: profile.location || '',
        websiteUrl: profile.websiteUrl || '',
        skills: profile.skills || [],
        experience: profile.experience || '',
        yearsOfExperience: profile.yearsOfExperience || 0,
        hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : 0,
        workAvailability: (profile.workAvailability as 'available' | 'busy' | 'unavailable') || 'available',
        responseTime: profile.responseTime || 'within 24 hours',
        languages: profile.languages || [],
        socialLinks: profile.socialLinks || {},
        portfolioLinks: profile.portfolioLinks || [],
        featuredWorkIds: profile.featuredWorkIds || [],
        avatarUrl: profile.avatarUrl || '',
        coverImageUrl: profile.coverImageUrl || '',
        profileCompleteness: 0,
        verified: profile.verified || false,
        verificationBadges: profile.verificationBadges || []
      });
      
      // Set location data from profile
      if (profile.country) {
        setUserSignupCountry(profile.country);
        
        // Map country name or code to country code for API calls
        if (profile.country !== 'Unknown' && countries.length > 0) {
          const byName = countries.find((c: any) => c.name === profile.country);
          const byCode = countries.find((c: any) => c.code === profile.country);
          const country = byName || byCode;
          if (country) {
            setSelectedCountry(country.code);
          }
        }
      }
      
      // Parse location to get city if it exists
      if (profile.location && profile.location.includes(',')) {
        const [city] = profile.location.split(',');
        setSelectedCity(city.trim());
      }
    }
  }, [profile, user?.email]);

  // Calculate profile completeness whenever any relevant field changes
  useEffect(() => {
    const completeness = calculateProfileCompleteness(profileForm);
    setProfileForm(prev => ({ ...prev, profileCompleteness: completeness }));
  }, [
    profileForm.name,
    profileForm.displayName,
    profileForm.professionalTitle,
    profileForm.bio,
    profileForm.professionalStatement,
    profileForm.location,
    profileForm.skills,
    profileForm.experience,
    profileForm.avatarUrl,
    profileForm.contactEmail,
    profileForm.email,
    profileForm.websiteUrl,
    profileForm.socialLinks,
    profileForm.hourlyRate,
    profileForm.languages
  ]);
  
  // Auto-save functionality with timeout management
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);
  
  const debouncedAutoSave = useCallback(async (formData: Partial<EnhancedProfile>) => {
    // Clear any existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for auto-save
    const newTimeout = setTimeout(async () => {
      // Use ref to check the latest unsaved changes state
      if (!hasUnsavedChangesRef.current) return;
      
      setAutoSaving(true);
      try {
        await handleSaveProfile(formData, false);
        setHasUnsavedChanges(false);
        hasUnsavedChangesRef.current = false;
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setAutoSaving(false);
      }
    }, 2000);
    
    setAutoSaveTimeout(newTimeout);
  }, [autoSaveTimeout]);
  
  // Form change handler
  const handleFormChange = (field: keyof EnhancedProfile, value: any) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    
    // Trigger debounced auto-save
    debouncedAutoSave({ [field]: value });
  };
  
  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<EnhancedProfile>) => {
      return apiRequest('/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
      onProfileUpdate?.(profileForm);
      setHasUnsavedChanges(false);
      setSaveError(null);
    },
    onError: (error: any) => {
      setSaveError(error.message || "Failed to update profile");
    }
  });
  
  // Save profile handler
  const handleSaveProfile = async (data?: Partial<EnhancedProfile>, showToast = true) => {
    const saveData = data || profileForm;
    
    try {
      await saveProfileMutation.mutateAsync(saveData);
      // Silent save - no toast notification
    } catch (error) {
      throw error;
    }
  };

  // Individual section save handlers
  const handleSaveTagline = async () => {
    try {
      await saveProfileMutation.mutateAsync({ tagline: profileForm.tagline });
      setIsEditingTagline(false);
    } catch (error) {
      console.error('Failed to save tagline:', error);
    }
  };

  const handleSaveBio = async () => {
    try {
      await saveProfileMutation.mutateAsync({ bio: profileForm.bio });
      setIsEditingBio(false);
    } catch (error) {
      console.error('Failed to save bio:', error);
    }
  };

  const handleSaveStatement = async () => {
    try {
      await saveProfileMutation.mutateAsync({ professionalStatement: profileForm.professionalStatement });
      setIsEditingStatement(false);
    } catch (error) {
      console.error('Failed to save statement:', error);
    }
  };
  
  // Add skill handler
  const handleAddSkill = () => {
    if (newSkill.trim() && !profileForm.skills?.includes(newSkill.trim())) {
      const updatedSkills = [...(profileForm.skills || []), newSkill.trim()];
      handleFormChange('skills', updatedSkills);
      setNewSkill('');
    }
  };
  
  // Remove skill handler
  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = profileForm.skills?.filter(skill => skill !== skillToRemove) || [];
    handleFormChange('skills', updatedSkills);
  };
  
  // Add language handler
  const handleAddLanguage = () => {
    if (newLanguage.trim() && !profileForm.languages?.includes(newLanguage.trim())) {
      const updatedLanguages = [...(profileForm.languages || []), newLanguage.trim()];
      handleFormChange('languages', updatedLanguages);
      setNewLanguage('');
    }
  };
  
  // Remove language handler
  const handleRemoveLanguage = (languageToRemove: string) => {
    const updatedLanguages = profileForm.languages?.filter(lang => lang !== languageToRemove) || [];
    handleFormChange('languages', updatedLanguages);
  };
  
  // Add social link handler
  const handleAddSocialLink = () => {
    if (newSocialUrl.trim()) {
      const updatedSocialLinks = {
        ...profileForm.socialLinks,
        [newSocialPlatform]: newSocialUrl.trim()
      };
      handleFormChange('socialLinks', updatedSocialLinks);
      setNewSocialUrl('');
    }
  };
  
  // Remove social link handler
  const handleRemoveSocialLink = (platform: string) => {
    const updatedSocialLinks = { ...profileForm.socialLinks };
    delete updatedSocialLinks[platform as keyof typeof SocialIcons];
    handleFormChange('socialLinks', updatedSocialLinks);
  };
  
  // Add portfolio link handler
  const handleAddPortfolioLink = () => {
    if (newPortfolioLink.trim() && !profileForm.portfolioLinks?.includes(newPortfolioLink.trim())) {
      const updatedLinks = [...(profileForm.portfolioLinks || []), newPortfolioLink.trim()];
      handleFormChange('portfolioLinks', updatedLinks);
      setNewPortfolioLink('');
    }
  };
  
  // Remove portfolio link handler
  const handleRemovePortfolioLink = (linkToRemove: string) => {
    const updatedLinks = profileForm.portfolioLinks?.filter(link => link !== linkToRemove) || [];
    handleFormChange('portfolioLinks', updatedLinks);
  };
  
  // Avatar upload handler
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file
    setAvatarError(null);
    if (!file.type.startsWith('image/')) {
      setAvatarError("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Please select an image smaller than 5MB");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/settings/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      handleFormChange('avatarUrl', result.avatarUrl);
      setAvatarError(null);
    } catch (error: any) {
      setAvatarError(error.message || "Failed to upload avatar");
    } finally {
      setIsLoading(false);
    }
  };

  // Cover image upload handler
  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file
    setCoverError(null);
    if (!file.type.startsWith('image/')) {
      setCoverError("Please select an image file");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setCoverError("Please select an image smaller than 10MB");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'cover');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      handleFormChange('coverImageUrl', result.url);
      setCoverError(null);
    } catch (error: any) {
      setCoverError(error.message || "Failed to upload cover image");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6" data-testid="enhanced-profile-setup">
      {/* Profile Completeness Header - Only show if profile is not 100% complete */}
      {(profileForm.profileCompleteness || 0) < 100 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Professional Profile Setup
                </CardTitle>
                <CardDescription>
                  Build your professional profile to attract clients
                </CardDescription>
              </div>
              {autoSaving && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Auto-saving...
                </div>
              )}
            </div>
            
            {/* Profile Completeness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Profile Completeness</span>
                <span className="text-blue-600 font-semibold">{profileForm.profileCompleteness}%</span>
              </div>
              <Progress value={profileForm.profileCompleteness} className="h-2" />
              <p className="text-xs text-gray-500">
                Complete your profile to increase visibility and attract more clients
              </p>
            </div>
          </CardHeader>
        </Card>
      )}
      
      {/* Profile Setup Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
          <TabsTrigger value="basic" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Basic Info</span>
            <span className="sm:hidden">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Professional</span>
            <span className="sm:hidden">Pro</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Portfolio</span>
            <span className="sm:hidden">Work</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <LinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Contact & Social</span>
            <span className="sm:hidden">Social</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your basic profile information that will be displayed to clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileForm.avatarUrl} />
                    <AvatarFallback className="text-xl font-medium bg-blue-100 text-blue-700">
                      {profileForm.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'FL'}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary transition-colors transition-all duration-300">
                    <Camera className="h-4 w-4 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      data-testid="input-avatar-upload"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Profile Picture</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Upload a professional photo that represents you well
                  </p>
                  <p className="text-xs text-gray-500">
                    Recommended: Square image, at least 200x200px, under 5MB
                  </p>
                  {avatarError && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <AlertCircle className="h-4 w-4" />
                      {avatarError}
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Cover Image Upload */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative w-full">
                    {/* Cover Image Preview */}
                    {profileForm.coverImageUrl ? (
                      <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg overflow-hidden">
                        <img 
                          src={profileForm.coverImageUrl} 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                        />
                        <label 
                          htmlFor="cover-upload" 
                          className="absolute top-2 right-2 p-2 bg-black/50 rounded-full cursor-pointer hover:bg-black/70 transition-colors transition-all duration-300"
                        >
                          <Camera className="h-4 w-4 text-white" />
                        </label>
                      </div>
                    ) : (
                      <label 
                        htmlFor="cover-upload" 
                        className="flex items-center justify-center h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg cursor-pointer hover:from-gray-200 hover:to-gray-300 transition-colors border-2 border-dashed transition-all duration-300"
                      >
                        <div className="text-center">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">Add Cover Image</p>
                          <p className="text-xs text-gray-500">Click to upload</p>
                        </div>
                      </label>
                    )}
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                      data-testid="input-cover-upload"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Cover Image</h3>
                  <p className="text-sm text-gray-600">
                    Upload a professional cover image that showcases your work or brand
                  </p>
                  <p className="text-xs text-gray-500">
                    Recommended: Wide format (16:9 aspect ratio), at least 1200x600px, under 10MB
                  </p>
                  {coverError && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <AlertCircle className="h-4 w-4" />
                      {coverError}
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name *</Label>
                  <Input
                    id="full-name"
                    value={profileForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    data-testid="input-full-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name *</Label>
                  <Input
                    id="display-name"
                    value={profileForm.displayName}
                    onChange={(e) => handleFormChange('displayName', e.target.value)}
                    placeholder="How you'd like to be called"
                    data-testid="input-display-name"
                  />
                </div>
              </div>
              
              {/* Professional Title & Tagline */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="professional-title">Professional Title</Label>
                  <Input
                    id="professional-title"
                    value={profileForm.professionalTitle || ''}
                    onChange={(e) => handleFormChange('professionalTitle', e.target.value)}
                    placeholder="e.g., UI/UX Designer, Full-Stack Developer"
                    data-testid="input-professional-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Professional Tagline</Label>
                  {!isEditingTagline ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="text-gray-900" data-testid="text-tagline">
                        {profileForm.tagline || 'Add your professional tagline'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingTagline(true)}
                        data-testid="button-edit-tagline"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        id="tagline"
                        value={profileForm.tagline || ''}
                        onChange={(e) => handleFormChange('tagline', e.target.value)}
                        placeholder="e.g., Creating beautiful digital experiences"
                        data-testid="input-tagline"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveTagline}
                          disabled={saveProfileMutation.isPending}
                          data-testid="button-save-tagline"
                          className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105 transition-all duration-300" style={{backgroundColor: '#0C332C'}}
                        >
                          {saveProfileMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingTagline(false)}
                          disabled={saveProfileMutation.isPending}
                          data-testid="button-cancel-tagline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio *</Label>
                {!isEditingBio ? (
                  <div className="flex items-start justify-between p-3 rounded-lg bg-gray-50 min-h-[100px]">
                    <div className="flex-1">
                      <p className="text-gray-900 whitespace-pre-wrap" data-testid="text-bio">
                        {profileForm.bio || 'Add your short bio'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingBio(true)}
                      data-testid="button-edit-bio"
                      className="flex-shrink-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      id="bio"
                      value={profileForm.bio}
                      onChange={(e) => handleFormChange('bio', e.target.value)}
                      placeholder="Write a brief introduction about yourself..."
                      className="min-h-[100px]"
                      data-testid="textarea-bio"
                    />
                    <p className="text-xs text-gray-500">
                      {profileForm.bio.length}/200 characters
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveBio}
                        disabled={saveProfileMutation.isPending}
                        data-testid="button-save-bio"
                        className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105 transition-all duration-300" style={{backgroundColor: '#0C332C'}}
                      >
                        {saveProfileMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingBio(false)}
                        disabled={saveProfileMutation.isPending}
                        data-testid="button-cancel-bio"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Professional Statement */}
              <div className="space-y-2">
                <Label htmlFor="professional-statement">Professional Statement</Label>
                {!isEditingStatement ? (
                  <div className="flex items-start justify-between p-3 rounded-lg bg-gray-50 min-h-[120px]">
                    <div className="flex-1">
                      <p className="text-gray-900 whitespace-pre-wrap" data-testid="text-professional-statement">
                        {profileForm.professionalStatement || 'Add your professional statement'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingStatement(true)}
                      data-testid="button-edit-professional-statement"
                      className="flex-shrink-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      id="professional-statement"
                      value={profileForm.professionalStatement || ''}
                      onChange={(e) => handleFormChange('professionalStatement', e.target.value)}
                      placeholder="Describe your professional background, expertise, and what makes you unique..."
                      className="min-h-[120px]"
                      data-testid="textarea-professional-statement"
                    />
                    <p className="text-xs text-gray-500">
                      Detailed description of your professional background and expertise
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveStatement}
                        disabled={saveProfileMutation.isPending}
                        data-testid="button-save-professional-statement"
                        className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105 transition-all duration-300" style={{backgroundColor: '#0C332C'}}
                      >
                        {saveProfileMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingStatement(false)}
                        disabled={saveProfileMutation.isPending}
                        data-testid="button-cancel-professional-statement"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Professional Information Tab */}
        <TabsContent value="professional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
              <CardDescription>
                Information about your skills, experience, and availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Skills Management */}
              <div className="space-y-4">
                <Label>Skills & Expertise</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g., React, Figma, Photography)"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    data-testid="input-new-skill"
                  />
                  <Button onClick={handleAddSkill} size="sm" data-testid="button-add-skill">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileForm.skills?.map((skill, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-primary transition-all duration-300" 
                        onClick={() => handleRemoveSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Experience and Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="years-experience">Years of Experience</Label>
                  <Input
                    id="years-experience"
                    type="number"
                    value={profileForm.yearsOfExperience || ''}
                    onChange={(e) => handleFormChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="50"
                    data-testid="input-years-experience"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourly-rate">Hourly Rate (USD)</Label>
                  <Input
                    id="hourly-rate"
                    type="number"
                    value={profileForm.hourlyRate || ''}
                    onChange={(e) => handleFormChange('hourlyRate', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    data-testid="input-hourly-rate"
                  />
                </div>
              </div>
              
              {/* Work Availability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work-availability">Work Availability</Label>
                  <select
                    id="work-availability"
                    value={profileForm.workAvailability || 'available'}
                    onChange={(e) => handleFormChange('workAvailability', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    data-testid="select-work-availability"
                  >
                    <option value="available">Available for work</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="response-time">Response Time</Label>
                  <select
                    id="response-time"
                    value={profileForm.responseTime || 'within 24 hours'}
                    onChange={(e) => handleFormChange('responseTime', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    data-testid="select-response-time"
                  >
                    <option value="within 1 hour">Within 1 hour</option>
                    <option value="within 4 hours">Within 4 hours</option>
                    <option value="within 24 hours">Within 24 hours</option>
                    <option value="within 48 hours">Within 48 hours</option>
                    <option value="within 1 week">Within 1 week</option>
                  </select>
                </div>
              </div>
              
              {/* Languages */}
              <div className="space-y-4">
                <Label>Languages Spoken</Label>
                <div className="flex gap-2">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add a language (e.g., English, Spanish)"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                    data-testid="input-new-language"
                  />
                  <Button onClick={handleAddLanguage} size="sm" data-testid="button-add-language">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileForm.languages?.map((language, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {language}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-primary transition-all duration-300" 
                        onClick={() => handleRemoveLanguage(language)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Experience Description */}
              <div className="space-y-2">
                <Label htmlFor="experience-description">Experience Description</Label>
                <Textarea
                  id="experience-description"
                  value={profileForm.experience || ''}
                  onChange={(e) => handleFormChange('experience', e.target.value)}
                  placeholder="Describe your professional experience, notable projects, achievements..."
                  className="min-h-[120px]"
                  data-testid="textarea-experience"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio & Work</CardTitle>
              <CardDescription>
                Showcase your best work and portfolio pieces
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Portfolio Links */}
              <div className="space-y-4">
                <Label>Portfolio Links</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPortfolioLink}
                    onChange={(e) => setNewPortfolioLink(e.target.value)}
                    placeholder="https://your-portfolio.com"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPortfolioLink()}
                    data-testid="input-new-portfolio-link"
                  />
                  <Button onClick={handleAddPortfolioLink} size="sm" data-testid="button-add-portfolio-link">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {profileForm.portfolioLinks?.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-blue-600 hover:underline truncate transition-all duration-300"
                      >
                        {link}
                      </a>
                      <X 
                        className="h-4 w-4 cursor-pointer hover:text-primary transition-all duration-300" 
                        onClick={() => handleRemovePortfolioLink(link)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Contact & Social Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How clients can reach you and your social presence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={profileForm.contactEmail || ''}
                    onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                    placeholder="professional@email.com"
                    data-testid="input-contact-email"
                  />
                </div>
                <div className="space-y-2">
                  <PhoneNumberInput
                    value={profileForm.phoneNumber || ''}
                    onChange={(value, isValid) => handleFormChange('phoneNumber', value)}
                    label="Phone Number"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={selectedCountry}
                    onValueChange={(value) => {
                      setSelectedCountry(value);
                      setSelectedCity('');
                      const country = countries.find(c => c.code === value);
                      const countryName = country?.name || '';
                      // Update both country and location fields
                      handleFormChange('country', countryName);
                      handleFormChange('location', countryName);
                      // Also update the countryId if available
                      if (country?.id) {
                        handleFormChange('countryId', country.id);
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent data-testid="select-country-options">
                      {countries.map(country => (
                        <SelectItem key={country.code} value={country.code} data-testid={`option-country-${country.code}`}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  {loadingCities ? (
                    <div className="p-3 border rounded-md text-sm text-gray-500" data-testid="cities-loading">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                      Loading cities...
                    </div>
                  ) : selectedCountry ? (
                    <Select
                      value={selectedCity}
                      onValueChange={(value) => {
                        setSelectedCity(value);
                        const currentCountryCode = selectedCountry;
                        const countryName = countries.find((c: any) => c.code === currentCountryCode)?.name || '';
                        const location = value ? `${value}, ${countryName}` : countryName;
                        handleFormChange('location', location);
                      }}
                    >
                      <SelectTrigger data-testid="select-city">
                        <SelectValue placeholder={cities.length > 0 ? "Select city" : "No cities available - type to add"} />
                      </SelectTrigger>
                      <SelectContent data-testid="select-city-options">
                        {cities.length > 0 ? (
                          cities.map(city => (
                            <SelectItem key={city.id} value={city.name} data-testid={`option-city-${city.name.replace(/\s+/g, '-').toLowerCase()}`}>
                              {city.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no_cities" disabled>
                            No cities available for this country
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 border rounded-md text-sm text-gray-500" data-testid="select-country-first">
                      Select a country first
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Personal Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profileForm.websiteUrl || ''}
                    onChange={(e) => handleFormChange('websiteUrl', e.target.value)}
                    placeholder="https://your-website.com"
                    data-testid="input-website"
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Social Links */}
              <div className="space-y-4">
                <Label>Social Media Links</Label>
                <div className="flex gap-2">
                  <select
                    value={newSocialPlatform}
                    onChange={(e) => setNewSocialPlatform(e.target.value as keyof typeof SocialIcons)}
                    className="p-2 border border-gray-300 rounded-md"
                    data-testid="select-social-platform"
                  >
                    {Object.keys(SocialIcons).map(platform => (
                      <option key={platform} value={platform}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    placeholder="https://platform.com/username"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSocialLink()}
                    data-testid="input-social-url"
                  />
                  <Button onClick={handleAddSocialLink} size="sm" data-testid="button-add-social-link">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(profileForm.socialLinks || {}).map(([platform, url]) => {
                    const IconComponent = SocialIcons[platform as keyof typeof SocialIcons];
                    return (
                      <div key={platform} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{platform}:</span>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-blue-600 hover:underline truncate transition-all duration-300"
                        >
                          {url}
                        </a>
                        <X 
                          className="h-4 w-4 cursor-pointer hover:text-primary transition-all duration-300" 
                          onClick={() => handleRemoveSocialLink(platform)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Save Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <AlertCircle className="h-4 w-4" />
                  You have unsaved changes
                </div>
              )}
              {!hasUnsavedChanges && !saveError && (
                <div className="flex items-center gap-2 text-sm" style={{ color: '#0C332C' }}>
                  <CheckCircle2 className="h-4 w-4" />
                  All changes saved
                </div>
              )}
              {saveError && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <AlertCircle className="h-4 w-4" />
                  {saveError}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleSaveProfile()}
                disabled={saveProfileMutation.isPending}
                data-testid="button-save-profile"
                className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105 transition-all duration-300" style={{backgroundColor: '#0C332C'}}
              >
                {saveProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedProfileSetup;
