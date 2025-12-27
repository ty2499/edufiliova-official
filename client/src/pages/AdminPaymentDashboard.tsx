import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openExternalUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HexColorPicker } from 'react-colorful';
import { SystemErrorsPanel } from '@/components/admin/SystemErrorsPanel';
import { 
  Search, 
  MessageSquare, 
  Users, 
  Shield,
  Flag,
  Trash2,
  Eye,
  Filter,
  AlertTriangle,
  UserCheck,
  MessageCircle,
  Calendar,
  ChevronDown,
  MoreHorizontal,
  Ban,
  Clock,
  DollarSign,
  TrendingUp,
  CreditCard,
  Home,
  Settings,
  Upload,
  RotateCcw,
  User,
  Save,
  Camera,
  Edit,
  Megaphone,
  X,
  LogOut,
  BookOpen,
  Plus,
  FileText,
  Menu,
  ArrowLeft,
  Package,
  Download,
  ShoppingCart,
  Star,
  XCircle,
  Image,
  Key,
  Globe,
  Loader2,
  Mail,
  Ticket,
  RefreshCw,
  Share2,
  Palette,
  ImageIcon,
  Check,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useHelpChat } from '@/contexts/HelpChatContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useConfirm } from '@/hooks/useConfirm';
import { MessagingInterface } from '@/components/MessagingInterface';
import { CommunityChat } from '@/components/CommunityChat';
import { NotificationBadge } from '@/components/NotificationBadge';
import AdminTransactionPanel from '@/components/AdminTransactionPanel';
import AdsDashboard from '@/pages/AdsDashboard';
import { AjaxLoader, AjaxButton, AjaxCard, AjaxStatus, type AjaxOperation } from '@/components/ui/ajax-loader';
import { useAjaxState, useMultipleAjaxStates } from '@/hooks/useAjaxState';
import PricingManagement from '@/components/PricingManagement';
import ShopMembershipManagement from '@/components/ShopMembershipManagement';
import AdminHelpChatManager from '@/components/AdminHelpChatManager';
import SupportProfilesManagement from '@/components/SupportProfilesManagement';
import AssignmentModeSettings from '@/components/AssignmentModeSettings';
import QuickResponsesManagement from '@/components/QuickResponsesManagement';
import EducationLevelSelector from '@/components/EducationLevelSelector';
import { CategoryManagement } from '@/pages/CategoryManagement';
import HeroSectionManager from '@/components/HeroSectionManager';
import CategoryAccessApprovalInterface from '@/components/CategoryAccessApprovalInterface';
import { ProductManager, ProductForm } from '@/components/ProductManager';
import { MultiLogoManagement } from '@/components/MultiLogoManagement';
import CouponManagement from '@/pages/CouponManagement';
import ManualPlanAssignmentDialog from '@/components/ManualPlanAssignmentDialog';
import AppDownloadsManagement from '@/components/AppDownloadsManagement';
import SocialMediaManagement from '@/components/SocialMediaManagement';
import { VoucherCard } from '@/components/VoucherCard';
import { ApiKeysSection } from '@/components/admin-settings/ApiKeysSection';
import { PaymentGatewaysSection } from '@/components/admin-settings/PaymentGatewaysSection';
import { ThemeBrandingSection } from '@/components/admin-settings/ThemeBrandingSection';
import { SocialMediaSection } from '@/components/admin-settings/SocialMediaSection';
import { DefaultCoverSection } from '@/components/admin-settings/DefaultCoverSection';
import { ProfileBoostManager } from '@/components/ProfileBoostManager';
import { WorkBoostManager } from '@/components/WorkBoostManager';
import { WorkCommentBoostManager } from '@/components/WorkCommentBoostManager';
import AdminPayoutManagement from '@/pages/AdminPayoutManagement';

interface AdminSetting {
  id: string;
  settingKey: string;
  settingValue: string | null;
  category: string;
  description: string | null;
  isEncrypted: boolean;
  isActive: boolean;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentGateway {
  id: string;
  gatewayId: string;
  gatewayName: string;
  isEnabled: boolean;
  isPrimary: boolean;
  publishableKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  testMode: boolean;
  supportedCurrencies: string[] | null;
  features: string[] | null;
  additionalConfig: Record<string, any> | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  userId: string;
  name?: string;
  role: string;
  email: string;
  pronouns?: string;
  avatarUrl?: string;
  country?: string;
  grade?: number;
  age?: number;
  status?: string;
  verificationBadge?: string;
  isFeatured?: boolean;
  createdAt: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  senderName: string;
  senderRole: string;
  receiverName: string;
  receiverRole: string;
}

interface ModerationLog {
  id: string;
  moderatorId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: any;
  originalContent: string;
  createdAt: string;
  moderatorName: string;
}

interface TeacherStudent {
  teacherId: string;
  studentId: string;
  teacherName: string;
  studentName: string;
  subjectName: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminProduct {
  id: string;
  name: string;
  description: string;
  type: 'digital' | 'physical';
  price: string;
  currency: string;
  images: string[];
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  rejectionReason?: string;
  featured?: boolean;
  featuredAt?: string;
  seller: {
    id: string;
    name: string;
    displayName: string;
    email: string;
    role: string;
  };
}

// Logo Management Component
const LogoManagement = () => {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const logoUploadState = useAjaxState();

  // Get current logo
  const { data: logoData, isLoading: logoLoading } = useQuery({
    queryKey: ['system-settings', 'logo'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/admin/settings/logo');
        return response.logoUrl || null;
      } catch (error) {
        return null;
      }
    }
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/admin/settings/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        },
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'logo'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    }
  });

  // Reset logo mutation
  const resetLogoMutation = useMutation({
    mutationFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/admin/settings/logo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'logo'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      logoUploadState.setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      logoUploadState.setError('File size must be less than 5MB');
      return;
    }

    logoUploadState.setUploading('Uploading logo...');
    uploadLogoMutation.mutate(file, {
      onSuccess: () => logoUploadState.setSuccess('Logo uploaded successfully!'),
      onError: (error) => logoUploadState.setError(`Upload failed: ${error.message}`),
      onSettled: () => setTimeout(() => logoUploadState.setIdle(), 2000)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Logo Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a custom logo for your platform. Image will be automatically resized to 500x500 pixels.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Current Logo Preview */}
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-3">Current Logo</h3>
            <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
              {logoLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : logoData ? (
                <img 
                  src={logoData} 
                  alt="Custom Logo" 
                  className="max-w-full max-h-32 object-contain"
                />
              ) : (
                <Logo size="xl" variant="default" type="home" />
              )}
            </div>
          </div>

          {/* Logo Controls */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Upload New Logo</h3>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading || uploadLogoMutation.isPending}
                  className="cursor-pointer"
                  data-testid="logo-file-input"
                />
                <p className="text-xs text-muted-foreground">
                  • Recommended size: 500x500 pixels
                  • Supported formats: PNG, JPG, JPEG, GIF
                  • Maximum file size: 5MB
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => resetLogoMutation.mutate()}
                variant="outline"
                disabled={!logoData || resetLogoMutation.isPending}
                className="w-full"
                data-testid="reset-logo-button"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {resetLogoMutation.isPending ? 'Resetting...' : 'Reset to Default'}
              </Button>
            </div>

            <AjaxStatus 
              operation={logoUploadState.operation}
              message={logoUploadState.message}
              autoHide={3000}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Admin Profile Settings Component
const AdminProfileSettings = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const avatarUploadState = useAjaxState();
  
  // Form state
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  
  // Get current admin profile
  const { data: adminProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/profile', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return response.profile;
    },
    enabled: !!user
  });

  // Initialize form with current data
  useEffect(() => {
    if (adminProfile) {
      setName(adminProfile.name || '');
      setPronouns(adminProfile.pronouns || '');
    }
  }, [adminProfile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; pronouns?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      setIsEditing(false);
    }
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/settings/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        },
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    }
  });

  const handleSave = () => {
    const updateData: { name?: string; pronouns?: string } = {};
    
    if (name !== adminProfile?.name) updateData.name = name;
    if (pronouns !== adminProfile?.pronouns) updateData.pronouns = pronouns;
    
    if (Object.keys(updateData).length > 0) {
      updateProfileMutation.mutate(updateData);
    } else {
      setIsEditing(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      avatarUploadState.setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      avatarUploadState.setError('File size must be less than 5MB');
      return;
    }

    avatarUploadState.setUploading('Uploading avatar...');
    uploadAvatarMutation.mutate(file, {
      onSuccess: () => avatarUploadState.setSuccess('Avatar uploaded successfully!'),
      onError: (error) => avatarUploadState.setError(`Upload failed: ${error.message}`),
      onSettled: () => setTimeout(() => avatarUploadState.setIdle(), 2000)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Admin Profile Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customize your admin profile information and avatar
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={adminProfile?.avatarUrl} />
              <AvatarFallback className="text-lg bg-green-100 text-green-600">
                {adminProfile?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 shadow-sm">
              <Camera className="h-3 w-3 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-medium">Profile Picture</h3>
            <p className="text-sm text-muted-foreground">
              Click on the avatar to upload a new image
            </p>
            {isUploading && (
              <p className="text-sm text-green-600">Uploading...</p>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Name</label>
              {isEditing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  data-testid="admin-name-input"
                />
              ) : (
                <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                  <span>{adminProfile?.name || 'Not set'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    data-testid="edit-profile-button"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Pronouns Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pronouns</label>
              {isEditing ? (
                <Select value={pronouns} onValueChange={setPronouns}>
                  <SelectTrigger data-testid="pronouns-select">
                    <SelectValue placeholder="Select pronouns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="he_him">He/Him</SelectItem>
                    <SelectItem value="she_her">She/Her</SelectItem>
                    <SelectItem value="they_them">They/Them</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 border rounded-md bg-gray-50">
                  <span className="capitalize">
                    {adminProfile?.pronouns?.replace(/_/g, '/') || 'Not set'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User ID and Role (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <div className="p-2 border rounded-md bg-gray-50">
                <span className="font-mono text-sm">{user?.userId}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="p-2 border rounded-md bg-gray-50">
                <Badge variant="default" className="bg-green-500">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrator
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              data-testid="save-profile-button"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setName(adminProfile?.name || '');
                setPronouns(adminProfile?.pronouns || '');
              }}
              data-testid="cancel-edit-button"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {uploadAvatarMutation.error && (
          <div className="p-3 bg-primary/10 border border-red-200 rounded-lg">
            <p className="text-sm text-primary-600">
              Avatar upload error: {uploadAvatarMutation.error.message}
            </p>
          </div>
        )}

        {updateProfileMutation.error && (
          <div className="p-3 bg-primary/10 border border-red-200 rounded-lg">
            <p className="text-sm text-primary-600">
              Profile update error: {updateProfileMutation.error.message}
            </p>
          </div>
        )}

        {(uploadAvatarMutation.isSuccess || updateProfileMutation.isSuccess) && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">
              Profile updated successfully!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Wallet Management Component
const WalletManagement = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const ajaxState = useAjaxState();

  // Fetch all users for selection
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-wallet', searchQuery],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/admin/users?search=${encodeURIComponent(searchQuery)}&limit=100`, {
        headers: { 'Authorization': `Bearer ${sessionId}` }
      });
      // apiRequest already extracts the 'data' field, so response is the array directly
      return Array.isArray(response) ? response : [];
    },
    enabled: true,
    staleTime: 2 * 60 * 1000 // Cache for 2 minutes (optimized from 0)
  });

  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: string; reason: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/admin/users/${userId}/add-funds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({ amount, reason })
      });
    },
    onSuccess: (data) => {
      ajaxState.setSuccess(`Successfully added $${amount} to user's wallet. New balance: $${data.newBalance}`);
      setSelectedUserId('');
      setAmount('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-users-wallet'] });
      setTimeout(() => ajaxState.setIdle(), 4000);
    },
    onError: (error: any) => {
      ajaxState.setError(error.message || "Failed to add funds to wallet");
      setTimeout(() => ajaxState.setIdle(), 4000);
    }
  });

  const handleAddFunds = () => {
    if (!selectedUserId) {
      ajaxState.setError("Please select a user");
      setTimeout(() => ajaxState.setIdle(), 3000);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      ajaxState.setError("Please enter a valid amount");
      setTimeout(() => ajaxState.setIdle(), 3000);
      return;
    }

    // Format amount to exactly 2 decimal places to prevent floating point issues
    const formattedAmount = parseFloat(amount).toFixed(2);
    ajaxState.setLoading('Adding funds to wallet...');
    addFundsMutation.mutate({ userId: selectedUserId, amount: formattedAmount, reason });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="user-search">Search User</Label>
          <Input
            id="user-search"
            placeholder="Search by name, email, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-user-search"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-select">Select User</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-select" data-testid="select-user">
              <SelectValue placeholder="Select a user to add funds" />
            </SelectTrigger>
            <SelectContent>
              {usersLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading users...</div>
              ) : usersData && usersData.length > 0 ? (
                usersData.map((user: any) => (
                  <SelectItem key={user.userId} value={user.userId}>
                    {user.name} ({user.email}) - ID: {user.userId}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter amount (e.g., 50.00)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            data-testid="input-amount"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason (Optional)</Label>
          <Textarea
            id="reason"
            placeholder="Cash payment, bank transfer, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            data-testid="textarea-reason"
          />
        </div>

        <Button
          onClick={handleAddFunds}
          disabled={addFundsMutation.isPending}
          className="w-full"
          data-testid="button-add-funds"
        >
          {addFundsMutation.isPending ? 'Adding Funds...' : 'Add Funds to Wallet'}
        </Button>

        <AjaxStatus 
          operation={ajaxState.operation}
          message={ajaxState.message}
        />
      </div>

      {selectedUserId && usersData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Selected User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {usersData
                .filter((u: any) => u.userId === selectedUserId)
                .map((user: any) => (
                  <div key={user.userId}>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>User ID:</strong> {user.userId}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Group Approval Component
const GroupApproval = () => {
  const [pendingGroups, setPendingGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Fetch pending groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['admin-pending-groups'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/admin/groups/pending', {
        headers: { 'Authorization': `Bearer ${sessionId}` }
      });
      return response.data || [];
    },
    refetchInterval: 3 * 60 * 1000, // Refresh every 3 minutes (reduced egress)
    staleTime: 2 * 60 * 1000 // Cache for 2 minutes
  });

  // Approve/Reject group mutation
  const approveGroupMutation = useMutation({
    mutationFn: async ({ groupId, action, rejectionReason }: { groupId: string; action: 'approve' | 'reject'; rejectionReason?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/admin/groups/${groupId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({ action, rejectionReason })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-groups'] });
    }
  });

  return (
    <div className="space-y-4">
      {groupsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading pending groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pending groups</h3>
          <p className="text-muted-foreground">All groups have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group: any) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{group.name}</h3>
                  {group.description && (
                    <p className="text-muted-foreground mt-1">{group.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>Created by: {group.creatorName}</span>
                    <span>•</span>
                    <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <Badge variant={group.isPrivate ? 'secondary' : 'outline'}>
                      {group.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                    <span>•</span>
                    <span>Max: {group.maxMembers} members</span>
                  </div>
                  {group.tags && group.tags.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {group.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => approveGroupMutation.mutate({ groupId: group.id, action: 'approve' })}
                    disabled={approveGroupMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white" transition-all duration-300
                  >
                    {approveGroupMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt('Reason for rejection (optional):');
                      if (reason !== null) {
                        approveGroupMutation.mutate({ groupId: group.id, action: 'reject', rejectionReason: reason });
                      }
                    }}
                    disabled={approveGroupMutation.isPending}
                  >
                    {approveGroupMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Ban className="h-4 w-4" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// UserCard Component
const UserCard = ({ 
  user, 
  onEdit, 
  onDelete, 
  onBan,
  onLoginAsUser,
  onToggleFeatured,
  isTogglingFeatured 
}: { 
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onBan: (user: User) => void;
  onLoginAsUser?: (user: User) => void;
  onToggleFeatured?: (userId: string) => void;
  isTogglingFeatured?: boolean;
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="destructive" className="text-xs">Admin</Badge>;
      case 'teacher': return <Badge variant="default" className="text-xs">Teacher</Badge>;
      case 'student': return <Badge variant="secondary" className="text-xs">Student</Badge>;
      case 'moderator': return <Badge variant="outline" className="text-xs text-primary border-purple-300">Moderator</Badge>;
      case 'freelancer': return <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Freelancer</Badge>;
      case 'accountant': return <Badge variant="outline" className="text-xs text-green-600 border-green-300">Accountant</Badge>;
      case 'customer_service': return <Badge variant="outline" className="text-xs text-primary border-orange-300">Customer Service</Badge>;
      default: return <Badge variant="secondary" className="text-xs">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string = 'active') => {
    switch (status) {
      case 'banned': return <Badge variant="destructive" className="text-xs">Banned</Badge>;
      case 'suspended': return <Badge variant="outline" className="text-xs text-primary border-orange-300">Suspended</Badge>;
      case 'active': return <Badge className="text-xs text-black" style={{ backgroundColor: '#A0FAB2' }}>Active</Badge>;
      default: return <Badge className="text-xs text-black" style={{ backgroundColor: '#A0FAB2' }}>Active</Badge>;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 md:p-4 rounded-lg border hover:bg-muted/50" transition-all duration-300 data-testid={`user-row-${user.userId}`}>
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback>
            {user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-medium text-sm sm:text-base truncate">{user.name || 'Unnamed User'}</h4>
            {getRoleBadge(user.role)}
            {getStatusBadge(user.status)}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
          {user.pronouns && (
            <p className="text-xs text-muted-foreground">{user.pronouns}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
        {onLoginAsUser && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLoginAsUser(user)}
            data-testid={`login-as-user-${user.userId}`}
            className="h-8 px-2.5 sm:px-3 text-xs bg-blue-50 hover:bg-blue-100 flex-1 sm:flex-initial min-w-[70px]" transition-all duration-300
            style={{ borderColor: '#0C332C', color: '#0C332C' }}
          >
            <User className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden xs:inline sm:inline">Login</span>
          </Button>
        )}
        {onToggleFeatured && (user.role === 'freelancer' || user.role === 'teacher') && (
          <Button
            variant={user.isFeatured ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleFeatured(user.userId)}
            disabled={isTogglingFeatured}
            data-testid={`toggle-featured-${user.userId}`}
            className={`h-8 px-2.5 sm:px-3 text-xs flex-1 sm:flex-initial min-w-[70px] ${user.isFeatured ? 'text-white' : ''}`}
            style={user.isFeatured ? { backgroundColor: '#0C332C' } : { borderColor: '#0C332C', color: '#0C332C' }}
          >
            {isTogglingFeatured ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent sm:mr-1.5" />
                <span className="hidden xs:inline sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <Star className={`h-3.5 w-3.5 sm:mr-1.5 ${user.isFeatured ? 'fill-white' : ''}`} />
                <span className="hidden xs:inline sm:inline">{user.isFeatured ? 'Featured' : 'Feature'}</span>
              </>
            )}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(user)}
          data-testid={`edit-user-${user.userId}`}
          className="h-8 px-2.5 sm:px-3 text-xs flex-1 sm:flex-initial min-w-[70px]"
          style={{ borderColor: '#0C332C', color: '#0C332C' }}
        >
          <Edit className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden xs:inline sm:inline">Edit</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBan(user)}
          data-testid={`ban-user-${user.userId}`}
          className="h-8 px-2.5 sm:px-3 text-xs flex-1 sm:flex-initial min-w-[70px]"
          style={{ borderColor: '#0C332C', color: '#0C332C' }}
        >
          <Ban className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden xs:inline sm:inline">Status</span>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(user)}
          data-testid={`delete-user-${user.userId}`}
          className="h-8 px-2.5 sm:px-3 text-xs flex-1 sm:flex-initial min-w-[70px]"
        >
          <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden xs:inline sm:inline">Delete</span>
        </Button>
      </div>
    </div>
  );
};

// ProductApprovalCard Component
const ProductApprovalCard = ({ 
  product, 
  onApprove, 
  onReject, 
  loading 
}: { 
  product: AdminProduct;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  loading: boolean;
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={product.type === 'digital' ? 'default' : 'secondary'}>
                {product.type}
              </Badge>
              <span>•</span>
              <span>{product.category}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">${product.price} {product.currency}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(product.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{product.description}</p>
        
        {/* Seller Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {product.seller.displayName?.split(' ').map(n => n[0]).join('') || 'S'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{product.seller.displayName}</div>
              <div className="text-xs text-muted-foreground">
                {product.seller.email} • {product.seller.role}
              </div>
            </div>
          </div>
        </div>

        {/* Product Images */}
        {product.images && product.images.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Product Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {product.images.slice(0, 3).map((image, index) => (
                <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <img 
                    src={image} 
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => onApprove(product.id)}
            disabled={loading}
            className="flex-1 border-0 hover:scale-100 hover:opacity-100"
            style={{ backgroundColor: '#0c332c', color: 'white' }}
            data-testid={`approve-product-${product.id}`}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {loading ? 'Processing...' : 'Approve'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
            disabled={loading}
            className="flex-1 border-0"
            style={{ backgroundColor: '#0c332c', color: 'white' }}
            data-testid={`reject-product-${product.id}`}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </CardContent>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{product.name}". This will be sent to the seller.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this product is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
                data-testid="rejection-reason-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onReject(product.id, rejectionReason);
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={!rejectionReason.trim() || loading}
              className="border-0"
              style={{ backgroundColor: '#0c332c', color: 'white' }}
              data-testid="confirm-reject-product"
            >
              Reject Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// ProductsList Component with Admin Controls
const ProductsList = ({ 
  products, 
  status 
}: { 
  products: AdminProduct[];
  status: 'approved' | 'rejected' | 'all';
}) => {
  const queryClient = useQueryClient();
  const ajaxState = useAjaxState();
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);

  const getStatusColor = (productStatus: string) => {
    switch (productStatus) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-primary-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (productStatus: string) => {
    switch (productStatus) {
      case 'approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  // Admin product status change mutation
  const changeProductStatusMutation = useMutation({
    mutationFn: async ({ productId, newStatus }: { productId: string; newStatus: 'approved' | 'pending' | 'rejected' }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/products/${productId}/admin-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      ajaxState.setSuccess("Product status has been updated successfully.");
      setTimeout(() => ajaxState.setIdle(), 3000);
    },
    onError: (error: any) => {
      ajaxState.setError(error.message || "Failed to update product status.");
      setTimeout(() => ajaxState.setIdle(), 3000);
    },
  });

  // Admin product update mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: string; productData: any }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify(productData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin/all'] });
      setShowEditDialog(false);
      setEditingProduct(null);
      ajaxState.setSuccess("The product has been updated successfully.");
      setTimeout(() => ajaxState.setIdle(), 3000);
    },
    onError: (error: any) => {
      console.error('Error updating product:', error);
      ajaxState.setError("Failed to update the product. Please try again.");
      setTimeout(() => ajaxState.setIdle(), 3000);
    },
  });

  // Admin product delete mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/products/${productId}/admin-delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setShowDeleteDialog(false);
      setProductToDelete(null);
      ajaxState.setSuccess("Product has been permanently deleted.");
      setTimeout(() => ajaxState.setIdle(), 3000);
    },
    onError: (error: any) => {
      ajaxState.setError(error.message || "Failed to delete product.");
      setTimeout(() => ajaxState.setIdle(), 3000);
    },
  });

  // Track which product is being toggled for featured status
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  // Toggle product featured status mutation
  const toggleProductFeaturedMutation = useMutation({
    mutationFn: async ({ productId, isFeatured }: { productId: string; isFeatured: boolean }) => {
      setTogglingProductId(productId);
      const sessionId = localStorage.getItem('sessionId');
      return await apiRequest(`/api/products/${productId}/toggle-featured`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({ isFeatured })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin/all'] });
      ajaxState.setSuccess("Product featured status updated successfully.");
      setTimeout(() => ajaxState.setIdle(), 3000);
      setTogglingProductId(null);
    },
    onError: (error: any) => {
      ajaxState.setError(error.message || "Failed to update product featured status.");
      setTimeout(() => ajaxState.setIdle(), 3000);
      setTogglingProductId(null);
    }
  });

  const handleStatusChange = (productId: string, newStatus: 'approved' | 'pending' | 'rejected') => {
    changeProductStatusMutation.mutate({ productId, newStatus });
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setShowEditDialog(true);
  };

  const handleDelete = (product: AdminProduct) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <AjaxStatus 
        operation={ajaxState.operation}
        message={ajaxState.message}
      />
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{status} Products</CardTitle>
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? 's' : ''} • Admin controls enabled
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-4">
              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No products found</h3>
                  <p>No products match the current filter.</p>
                </div>
              ) : (
                products.map((product) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{product.name}</h3>
                          <Badge variant={product.type === 'digital' ? 'default' : 'secondary'}>
                            {product.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>By {product.seller.displayName}</span>
                          <span>•</span>
                          <span>{product.category}</span>
                          <span>•</span>
                          <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                        </div>
                        {product.rejectionReason && (
                          <div className="mt-2 p-2 bg-primary/10 border border-red-200 rounded">
                            <p className="text-sm text-primary-700">
                              <strong>Rejection Reason:</strong> {product.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            data-testid={`edit-product-${product.id}`}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          
                          {product.status === 'approved' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(product.id, 'pending')}
                              disabled={changeProductStatusMutation.isPending}
                              data-testid={`unpublish-product-${product.id}`}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Unpublish
                            </Button>
                          ) : product.status === 'pending' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(product.id, 'approved')}
                              disabled={changeProductStatusMutation.isPending}
                              className="border-0 hover:scale-100 hover:opacity-100"
                              style={{ backgroundColor: '#0c332c', color: 'white' }}
                              data-testid={`publish-product-${product.id}`}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Publish
                            </Button>
                          ) : product.status === 'rejected' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(product.id, 'approved')}
                              disabled={changeProductStatusMutation.isPending}
                              className="border-0 hover:scale-100 hover:opacity-100"
                              style={{ backgroundColor: '#0c332c', color: 'white' }}
                              data-testid={`approve-product-${product.id}`}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          ) : null}

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            data-testid={`delete-product-${product.id}`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                          
                          <Button
                            variant={product.featured ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleProductFeaturedMutation.mutate({ 
                              productId: product.id, 
                              isFeatured: !product.featured 
                            })}
                            disabled={togglingProductId === product.id}
                            data-testid={`toggle-featured-product-${product.id}`}
                            className={product.featured ? "bg-amber-500 hover:bg-amber-600" : ""}
                          >
                            {togglingProductId === product.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Star className={`h-3 w-3 mr-1 ${product.featured ? 'fill-current' : ''}`} />
                            )}
                            {product.featured ? 'Featured' : 'Feature'}
                          </Button>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-lg font-bold">${product.price} {product.currency}</div>
                        <div className={`flex items-center gap-1 ${getStatusColor(product.status)}`}>
                          {getStatusIcon(product.status)}
                          <span className="text-sm capitalize">{product.status}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "{productToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => productToDelete && deleteProductMutation.mutate(productToDelete.id)}
              disabled={deleteProductMutation.isPending}
              data-testid="confirm-delete-product"
            >
              {deleteProductMutation.isPending ? 'Deleting...' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information, images, and files.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {editingProduct && (
              <ProductForm
                product={{
                  id: editingProduct.id,
                  name: editingProduct.name,
                  description: editingProduct.description,
                  type: editingProduct.type,
                  price: editingProduct.price,
                  currency: editingProduct.currency,
                  images: editingProduct.images || [],
                  previewImages: [],
                  downloadableFiles: [],
                  stock: undefined,
                  category: editingProduct.category,
                  tags: [],
                  status: editingProduct.status,
                  salesCount: 0,
                  rating: 0,
                  reviewCount: 0,
                  createdAt: editingProduct.createdAt,
                  rejectionReason: editingProduct.rejectionReason
                }}
                onSubmit={(data) => updateProductMutation.mutate({ 
                  id: editingProduct.id, 
                  productData: data 
                })}
                isLoading={updateProductMutation.isPending}
              />
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setEditingProduct(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface AdminPaymentDashboardProps {
  onNavigate?: (page: string, transition?: string) => void;
}

export default function AdminPaymentDashboard({ onNavigate }: AdminPaymentDashboardProps = {}) {
  const { user, logout, refreshAuth } = useAuth();
  const queryClient = useQueryClient();
  const { isChatOpen } = useHelpChat();
  const isMobile = useIsMobile();
  const confirm = useConfirm();
  
  // Get current admin profile for support ticket replies
  const { data: adminProfile } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/profile', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return response.profile;
    },
    enabled: !!user
  });
  
  // Real-time unread messages count for admin notifications
  const { data: unreadMessagesData } = useQuery({
    queryKey: ['/api/messages', user?.id, 'unread-count'],
    queryFn: async () => {
      if (!user?.id) return { success: false, unreadCount: 0 };
      try {
        const response = await fetch(`/api/messages/${user.id}/unread-count`);
        if (!response.ok) return { success: false, unreadCount: 0 };
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Admin: Failed to fetch messages count:', error);
        return { success: false, unreadCount: 0 };
      }
    },
    enabled: !!user?.id,
    refetchInterval: 3 * 60 * 1000, // Refresh every 3 minutes (reduced egress)
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Refresh when admin returns to dashboard
    retry: false
  });
  
  const unreadMessagesCount = unreadMessagesData?.success ? unreadMessagesData.unreadCount : 0;
  
  // Fetch contact messages stats
  const { data: contactStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/admin/stats');
      } catch (error) {
        return null;
      }
    },
    enabled: !!user,
    refetchInterval: 3 * 60 * 1000, // Refresh every 3 minutes (reduced egress)
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    retry: false
  });
  
  const newContactMessagesCount = contactStats?.unread || 0;
  
  // Fetch support tickets count (new/open tickets)
  const { data: supportTicketsData } = useQuery({
    queryKey: ['/api/support-tickets/stats'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/support-tickets/stats');
        return response;
      } catch (error) {
        return { openTickets: 0 };
      }
    },
    enabled: !!user,
    refetchInterval: 3 * 60 * 1000, // Refresh every 3 minutes (reduced egress)
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    retry: false
  });
  
  const newSupportTicketsCount = supportTicketsData?.openTickets || 0;
  
  // Track which user is being toggled
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async (userId: string) => {
      setTogglingUserId(userId);
      return await apiRequest(`/api/admin/users/${userId}/toggle-featured`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setTogglingUserId(null);
    },
    onError: () => {
      setTogglingUserId(null);
    }
  });
  
  // Role-based tab access configuration
  const userRole = adminProfile?.role || 'admin';
  
  const roleTabAccess: Record<string, string[]> = {
    admin: ['dashboard', 'users', 'communication', 'payments', 'products', 'courses', 'settings'],
    accountant: ['payments', 'settings'],
    customer_service: ['communication', 'payments', 'settings']
  };
  
  const getDefaultTab = (role: string) => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      return tabFromUrl;
    }
    
    if (role === 'accountant') return 'payments';
    if (role === 'customer_service') return 'help-chat';
    return 'dashboard';
  };
  
  const isTabVisible = (tab: string) => {
    const allowedTabs = roleTabAccess[userRole] || ['dashboard'];
    return allowedTabs.includes(tab);
  };
  
  // State declarations
  const [selectedTab, setSelectedTab] = useState(getDefaultTab(userRole));
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [flagReason, setFlagReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  
  // Announcements state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [targetGrade, setTargetGrade] = useState<number | null>(null);
  const [priority, setPriority] = useState('normal');
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  
  // User management dialogs state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    age: '',
    grade: '',
    country: '',
    role: '',
    verificationBadge: 'none'
  });
  
  // Mobile navigation state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Voucher state
  const [voucherCodeMode, setVoucherCodeMode] = useState<'auto' | 'manual'>('auto');
  const [voucherCreationMode, setVoucherCreationMode] = useState<'single' | 'bulk'>('single');
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    amount: "",
    description: "",
    maxRedemptions: "1",
    expiresAt: ""
  });
  
  // Bulk voucher state
  const [bulkVoucher, setBulkVoucher] = useState({
    count: "1",
    amount: "",
    description: "",
    maxRedemptions: "1",
    expiresAt: "",
    sendEmail: true,
    emailDistributionMode: 'single' as 'single' | 'individual'
  });
  const [singleRecipient, setSingleRecipient] = useState({ name: "", email: "" });
  const [recipients, setRecipients] = useState<Array<{ name: string; email: string }>>([{ name: "", email: "" }]);
  const [showVoucherPreview, setShowVoucherPreview] = useState(false);

  // Function to generate 14-character alphanumeric voucher code
  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 14; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Auto-generate code when switching to auto mode or on initial load
  useEffect(() => {
    if (voucherCodeMode === 'auto' && !newVoucher.code) {
      setNewVoucher(prev => ({ ...prev, code: generateVoucherCode() }));
    }
  }, [voucherCodeMode]);
  
  // Manual Plan Assignment Dialog state
  const [showManualPlanDialog, setShowManualPlanDialog] = useState(false);
  
  // Logout loading state
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Admin product creation navigation - removed dialog state
  
  // Course creation state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSubject, setCourseSubject] = useState('');
  const [courseGrade, setCourseGrade] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  
  // AJAX Loading States
  const logoUploadState = useAjaxState();
  const avatarUploadState = useAjaxState();
  const courseState = useAjaxState();
  const fileUploadState = useAjaxState();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setTimeout(async () => {
      await logout();
      onNavigate?.('shop-auth');
    }, 3000);
  };

  // Set default tab based on role when profile loads
  useEffect(() => {
    if (adminProfile?.role) {
      const defaultTab = getDefaultTab(adminProfile.role);
      setSelectedTab(defaultTab);
    }
  }, [adminProfile?.role]);

  // Auto-navigate to sub-tabs based on primary selection
  useEffect(() => {
    if (selectedTab === 'communication') {
      // Don't auto-redirect, let users see secondary navigation
      return;
    }
    if (selectedTab === 'users') {
      // Don't auto-redirect, let users see secondary navigation  
      return;
    }
  }, [selectedTab]);

  // Auto-open messaging tab when coming from "Hire Me" button
  useEffect(() => {
    const autoSelect = localStorage.getItem('autoSelectMessagingTab');
    if (autoSelect === 'true') {
      setSelectedTab('messaging');
      localStorage.removeItem('autoSelectMessagingTab');
    }
  }, []);

  // Helper function to handle back navigation - always go to last page
  const handleBackNavigation = () => {
    // Always go to the last page in browser history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to home if no history
      window.location.href = '/';
    }
  };

  // Get back button text - simple and consistent
  const getBackButtonText = () => {
    return 'Back';
  };

  // Get aria-label for back button
  const getBackButtonAriaLabel = () => {
    return 'Navigate back to previous page';
  };

  // AJAX state for voucher operations
  const [voucherAjaxOperation, setVoucherAjaxOperation] = useState<AjaxOperation>('idle');
  const [voucherAjaxMessage, setVoucherAjaxMessage] = useState('');

  // WebSocket connection for real-time notifications
  useQuery({
    queryKey: ['websocket-admin'],
    queryFn: () => {
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          // Authenticate as admin
          ws.send(JSON.stringify({
            type: 'auth',
            userId: user?.userId,
            role: 'admin'
          }));
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_message') {
              // Refresh unread count when new message arrives
              queryClient.invalidateQueries({ queryKey: ['/api/messages', user?.id, 'unread-count'] });
            }
          } catch (error) {
            console.error('Admin WebSocket message error:', error);
          }
        };
        
        return true;
      }
      return false;
    },
    enabled: !!user?.userId && !!user,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity
  });

  // Get all users for admin oversight
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', userSearchQuery, selectedRole],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams();
      if (userSearchQuery) params.append('search', userSearchQuery);
      if (selectedRole) params.append('role', selectedRole);
      
      return apiRequest(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    enabled: !!user && userRole === 'admin' && (selectedTab === 'users' || selectedTab === 'dashboard')
  });

  // Search messages - now shows recent messages by default
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['admin', 'messages', 'search', messageSearchQuery, selectedUserId],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams();
      if (messageSearchQuery) params.append('query', messageSearchQuery);
      if (selectedUserId) params.append('userId', selectedUserId);
      
      return apiRequest(`/api/admin/messages/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    enabled: !!user && userRole === 'admin' && (selectedTab === 'moderation' || selectedTab === 'communication' || selectedTab === 'dashboard')
  });

  // Get moderation logs
  const { data: moderationLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['admin', 'moderation-logs'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/admin/moderation-logs', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    enabled: !!user && userRole === 'admin' && (selectedTab === 'moderation' || selectedTab === 'communication' || selectedTab === 'dashboard')
  });

  // Get teacher-student assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['admin', 'teacher-assignments'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/admin/teacher-assignments', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    enabled: !!user && userRole === 'admin' && (selectedTab === 'relationships' || selectedTab === 'dashboard')
  });

  // Get all announcements
  const { data: announcements = [], isLoading: announcementsLoading, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/admin/announcements', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    enabled: !!user && userRole === 'admin' && (selectedTab === 'announcements' || selectedTab === 'communication')
  });

  // Get all products for admin management
  const { data: allProducts = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/products/admin/all', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user && selectedTab === 'products',
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes (optimized from 0)
  });

  // Get pending products
  const { data: pendingProducts = [], isLoading: pendingProductsLoading } = useQuery({
    queryKey: ['admin', 'products', 'pending'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/products/admin/pending', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user && selectedTab === 'products',
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (optimized from 0)
  });

  // Get all support tickets for admin
  const { data: supportTicketsResponse, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['admin', 'support-tickets'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest('/api/shop/support/tickets/all', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return Array.isArray(response) ? response : (response?.data || []);
    },
    enabled: !!user && selectedTab === 'support-tickets'
  });
  
  const supportTickets = supportTicketsResponse || [];

  // Voucher queries and mutations
  const { data: vouchersData, isLoading: loadingVouchers } = useQuery({
    queryKey: ["/api/admin/vouchers"],
    enabled: selectedTab === "vouchers"
  });

  const createVoucherMutation = useMutation({
    mutationFn: async (voucher: any) => {
      return await apiRequest(`/api/admin/vouchers`, {
        method: "POST",
        body: JSON.stringify(voucher)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vouchers"] });
      const newCode = voucherCodeMode === 'auto' ? generateVoucherCode() : "";
      setNewVoucher({ code: newCode, amount: "", description: "", maxRedemptions: "1", expiresAt: "" });
    }
  });

  const createBulkVouchersMutation = useMutation({
    mutationFn: async (data: any) => {
      setVoucherAjaxOperation('loading');
      setVoucherAjaxMessage('Creating vouchers...');
      return await apiRequest(`/api/admin/vouchers/bulk`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vouchers"] });
      setBulkVoucher({ count: "1", amount: "", description: "", maxRedemptions: "1", expiresAt: "", sendEmail: true, emailDistributionMode: 'single' });
      setRecipients([{ name: "", email: "" }]);
      setSingleRecipient({ name: "", email: "" });
      
      const successCount = response.vouchers?.length || 0;
      const emailCount = response.emailResults?.filter((r: any) => r.success).length || 0;
      const failedCount = response.emailResults?.filter((r: any) => !r.success).length || 0;
      
      if (emailCount > 0 && failedCount > 0) {
        setVoucherAjaxOperation('success');
        setVoucherAjaxMessage(`Created ${successCount} voucher(s). Sent ${emailCount} email(s) successfully, but ${failedCount} email(s) failed to send.`);
      } else if (emailCount > 0) {
        setVoucherAjaxOperation('success');
        setVoucherAjaxMessage(`Successfully created ${successCount} voucher(s) and sent ${emailCount} email(s)`);
      } else {
        setVoucherAjaxOperation('success');
        setVoucherAjaxMessage(`Successfully created ${successCount} voucher(s)`);
      }
      
      setTimeout(() => {
        setVoucherAjaxOperation('idle');
        setVoucherAjaxMessage('');
      }, 5000);
    },
    onError: (error: any) => {
      setVoucherAjaxOperation('error');
      setVoucherAjaxMessage(`Failed to create vouchers: ${error.message || 'Unknown error'}`);
      setTimeout(() => {
        setVoucherAjaxOperation('idle');
        setVoucherAjaxMessage('');
      }, 8000);
    }
  });

  const deleteVoucherMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/vouchers/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vouchers"] });
    }
  });

  const deleteAllVouchersMutation = useMutation({
    mutationFn: async () => {
      setVoucherAjaxOperation('loading');
      setVoucherAjaxMessage('Deleting all vouchers...');
      return await apiRequest(`/api/admin/vouchers`, { method: "DELETE" });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vouchers"] });
      const count = response.count || 0;
      setVoucherAjaxOperation('success');
      setVoucherAjaxMessage(`Successfully deleted ${count} voucher(s)`);
      setTimeout(() => {
        setVoucherAjaxOperation('idle');
        setVoucherAjaxMessage('');
      }, 5000);
    },
    onError: (error: any) => {
      setVoucherAjaxOperation('error');
      setVoucherAjaxMessage(`Failed to delete vouchers: ${error.message || 'Unknown error'}`);
      setTimeout(() => {
        setVoucherAjaxOperation('idle');
        setVoucherAjaxMessage('');
      }, 8000);
    }
  });

  // Support ticket filter state
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  
  // AJAX state for ticket operations
  const [ticketAjaxOperation, setTicketAjaxOperation] = useState<AjaxOperation>('idle');
  const [ticketAjaxMessage, setTicketAjaxMessage] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  
  // Confirmation dialog states
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToResolve, setTicketToResolve] = useState<any>(null);
  const [ticketToDelete, setTicketToDelete] = useState<any>(null);
  
  // Reply form validation error
  const [replyFormError, setReplyFormError] = useState('');

  // Filter support tickets based on search query
  const filteredTickets = supportTickets.filter((ticket: any) => {
    if (!ticketSearchQuery) return true;
    const searchLower = ticketSearchQuery.toLowerCase();
    return (
      ticket.subject?.toLowerCase().includes(searchLower) ||
      ticket.message?.toLowerCase().includes(searchLower) ||
      ticket.customerName?.toLowerCase().includes(searchLower) ||
      ticket.customerEmail?.toLowerCase().includes(searchLower) ||
      ticket.id?.toLowerCase().includes(searchLower)
    );
  });

  // Admin reply to support ticket mutation
  const replyToTicketMutation = useMutation({
    mutationFn: async ({ ticketId, reply, adminName, adminEmail }: { ticketId: string; reply: string; adminName: string; adminEmail: string }) => {
      setTicketAjaxOperation('updating');
      setActiveTicketId(ticketId);
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/shop/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({ reply, adminName, adminEmail })
      });
    },
    onSuccess: () => {
      setTicketAjaxOperation('success');
      setTicketAjaxMessage('Reply sent successfully!');
      refetchTickets();
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] });
      setTimeout(() => {
        setTicketAjaxOperation('idle');
        setActiveTicketId(null);
      }, 2000);
    },
    onError: (error) => {
      console.error('Reply error:', error);
      setTicketAjaxOperation('error');
      setTicketAjaxMessage('Failed to send reply');
      setTimeout(() => {
        setTicketAjaxOperation('idle');
        setActiveTicketId(null);
      }, 3000);
    }
  });

  // Close/Resolve support ticket mutation
  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      setTicketAjaxOperation('updating');
      setActiveTicketId(ticketId);
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/shop/support/tickets/${ticketId}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      setTicketAjaxOperation('success');
      setTicketAjaxMessage('Ticket marked as resolved!');
      refetchTickets();
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] });
      setResolveDialogOpen(false);
      setTicketToResolve(null);
      setTimeout(() => {
        setTicketAjaxOperation('idle');
        setActiveTicketId(null);
      }, 2000);
    },
    onError: (error) => {
      console.error('Close ticket error:', error);
      setTicketAjaxOperation('error');
      setTicketAjaxMessage('Failed to close ticket');
      setTimeout(() => {
        setTicketAjaxOperation('idle');
        setActiveTicketId(null);
      }, 3000);
    }
  });

  // Delete support ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      setTicketAjaxOperation('deleting');
      setActiveTicketId(ticketId);
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/shop/support/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
    },
    onSuccess: () => {
      setTicketAjaxOperation('success');
      setTicketAjaxMessage('Ticket deleted successfully!');
      refetchTickets();
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] });
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
      setTimeout(() => {
        setTicketAjaxOperation('idle');
        setActiveTicketId(null);
      }, 2000);
    },
    onError: (error) => {
      console.error('Delete ticket error:', error);
      setTicketAjaxOperation('error');
      setTicketAjaxMessage('Failed to delete ticket');
      setTimeout(() => {
        setTicketAjaxOperation('idle');
        setActiveTicketId(null);
      }, 3000);
    }
  });

  // Product status mutation (approve/reject)
  const updateProductStatusMutation = useMutation({
    mutationFn: ({ productId, status, rejectionReason }: { productId: string; status: 'approved' | 'rejected'; rejectionReason?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({ status, rejectionReason })
      });
    },
    onSuccess: () => {
      refetchProducts();
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', 'pending'] });
    }
  });

  // Flag message mutation
  const flagMessageMutation = useMutation({
    mutationFn: (data: { messageId: string; reason: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/admin/messages/${data.messageId}/flag`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify({ reason: data.reason })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation-logs'] });
      setFlagReason('');
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (data: { messageId: string; reason: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/admin/messages/${data.messageId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify({ reason: data.reason })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation-logs'] });
      setDeleteReason('');
    }
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: (data: {
      title: string;
      content: string;
      targetAudience: string;
      targetGrade?: number;
      priority: string;
    }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify({ 
          ...data, 
          teacherId: user?.id,
          targetStudentIds: []
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setTargetAudience('all');
      setTargetGrade(null);
      setPriority('normal');
      setShowAnnouncementDialog(false);
    }
  });

  // Update announcement mutation
  const updateAnnouncementMutation = useMutation({
    mutationFn: (data: {
      id: string;
      title: string;
      content: string;
      targetAudience: string;
      targetGrade?: number;
      priority: string;
    }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/admin/announcements/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      setEditingAnnouncement(null);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setTargetAudience('all');
      setTargetGrade(null);
      setPriority('normal');
      setShowAnnouncementDialog(false);
    }
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcementId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/admin/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
    }
  });

  // User management mutations
  const editUserMutation = useMutation({
    mutationFn: (data: { userId: string; name: string; email: string; age: number; grade: number; country: string; role: string; verificationBadge: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/admin/users/${data.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowEditDialog(false);
      setSelectedUser(null);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  });

  const banUserMutation = useMutation({
    mutationFn: (data: { userId: string; status: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/admin/users/${data.userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`
        },
        body: JSON.stringify({ status: data.status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowBanDialog(false);
      setSelectedUser(null);
    }
  });

  // User action handlers
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      age: user.age?.toString() || '',
      grade: user.grade?.toString() || '',
      country: user.country || '',
      role: user.role || 'student',
      verificationBadge: user.verificationBadge || 'none'
    });
    setShowEditDialog(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleBanUser = (user: User) => {
    setSelectedUser(user);
    setShowBanDialog(true);
  };

  const handleLoginAsUser = async (targetUser: User) => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({ targetUserId: targetUser.userId })
      });

      const result = await response.json();

      if (result.success) {
        // Store the new session and impersonation state
        localStorage.setItem('sessionId', result.sessionId);
        localStorage.setItem('isImpersonating', 'true');
        localStorage.setItem('adminSessionId', sessionId || '');
        
        // Use refreshAuth to update the auth state instantly without page reload
        await refreshAuth();
        
        // Navigate directly to the user's dashboard based on role using onNavigate
        const dashboardMap: Record<string, string> = {
          'student': 'student-dashboard',
          'teacher': 'teacher-dashboard',
          'admin': 'admin-dashboard',
          'freelancer': 'freelancer-profile'
        };
        
        onNavigate?.(dashboardMap[result.role] || 'student-dashboard');
      } else {
        console.error('Failed to login as user:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error logging in as user:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="destructive" className="text-xs">Admin</Badge>;
      case 'teacher': return <Badge variant="default" className="text-xs">Teacher</Badge>;
      case 'student': return <Badge variant="secondary" className="text-xs">Student</Badge>;
      case 'moderator': return <Badge variant="outline" className="text-xs text-primary border-purple-300">Moderator</Badge>;
      case 'freelancer': return <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Freelancer</Badge>;
      case 'accountant': return <Badge variant="outline" className="text-xs text-green-600 border-green-300">Accountant</Badge>;
      case 'customer_service': return <Badge variant="outline" className="text-xs text-primary border-orange-300">Customer Service</Badge>;
      default: return <Badge variant="secondary" className="text-xs">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string = 'active') => {
    switch (status) {
      case 'banned': return <Badge variant="destructive" className="text-xs">Banned</Badge>;
      case 'suspended': return <Badge variant="outline" className="text-xs text-primary border-orange-300">Suspended</Badge>;
      case 'active': return <Badge className="text-xs text-black" style={{ backgroundColor: '#A0FAB2' }}>Active</Badge>;
      default: return <Badge className="text-xs text-black" style={{ backgroundColor: '#A0FAB2' }}>Active</Badge>;
    }
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'message_delete': return <Badge variant="destructive" className="text-xs">Deleted</Badge>;
      case 'message_flag': return <Badge variant="secondary" className="text-xs">Flagged</Badge>;
      case 'user_warn': return <Badge variant="outline" className="text-xs">Warning</Badge>;
      case 'user_suspend': return <Badge variant="destructive" className="text-xs">Suspended</Badge>;
      default: return <Badge className="text-xs">{actionType}</Badge>;
    }
  };


  return (
    <div className="min-h-screen bg-background flex flex-col md:block" data-testid="admin-payment-dashboard">
      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0C332C] flex items-center justify-between px-4 z-50 border-b border-white/10 pt-safe">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20" transition-all duration-300
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          data-testid="mobile-menu-button"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-white font-bold text-lg">Admin Dashboard</h1>
        <div className="w-10" />
      </div>

      {/* Left Sidebar - Slide-in on mobile, fixed on desktop */}
      <div className={`${
        (isMobile && isChatOpen) ? "hidden" : ""
      } w-64 fixed left-0 top-0 h-full border-r border-sidebar-border bg-[#0C332C] z-50 overflow-y-auto transition-transform duration-300 ${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${
        isChatOpen ? "hidden" : "block"
      }`}>
        <div className="flex flex-col py-4 px-3 bg-[#0C332C] min-h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6" data-testid="sidebar-header">
            <h2 className="text-white font-bold text-xl">Admin</h2>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/20" transition-all duration-300
              onClick={() => setShowMobileMenu(false)}
              data-testid="close-mobile-menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Navigation */}
          <div className="flex flex-col flex-1">
            <nav className="flex flex-col space-y-2">
            {isTabVisible('dashboard') && (
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "dashboard" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "dashboard" ? "#c4ee3d" : undefined,
                color: selectedTab === "dashboard" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("dashboard"); setShowMobileMenu(false); }}
              data-testid="nav-dashboard"
            >
              <Home className="w-5 h-5 mr-3" />
              <span>Dashboard</span>
            </Button>
            )}
            
            {isTabVisible('users') && (
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "users" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "users" ? "#c4ee3d" : undefined,
                color: selectedTab === "users" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("users"); setShowMobileMenu(false); }}
              data-testid="nav-users"
            >
              <Users className="w-5 h-5 mr-3" />
              <span>Users</span>
            </Button>
            )}
            
            {isTabVisible('courses') && (
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "courses" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "courses" ? "#c4ee3d" : undefined,
                color: selectedTab === "courses" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("courses"); setShowMobileMenu(false); }}
              data-testid="nav-courses"
            >
              <BookOpen className="w-5 h-5 mr-3" />
              <span>Courses</span>
            </Button>
            )}
            
            {isTabVisible('payments') && userRole !== 'customer_service' && (
            <>
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "transactions" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "transactions" ? "#c4ee3d" : undefined,
                color: selectedTab === "transactions" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("transactions"); setShowMobileMenu(false); }}
              data-testid="nav-transactions"
            >
              <DollarSign className="w-5 h-5 mr-3" />
              <span>Transactions</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "pricing" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "pricing" ? "#c4ee3d" : undefined,
                color: selectedTab === "pricing" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("pricing"); setShowMobileMenu(false); }}
              data-testid="nav-pricing"
            >
              <CreditCard className="w-5 h-5 mr-3" />
              <span>Pricing Plans</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "wallet-management" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "wallet-management" ? "#c4ee3d" : undefined,
                color: selectedTab === "wallet-management" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("wallet-management"); setShowMobileMenu(false); }}
              data-testid="nav-wallet-management"
            >
              <DollarSign className="w-5 h-5 mr-3" />
              <span>Wallet Management</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "vouchers" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "vouchers" ? "#c4ee3d" : undefined,
                color: selectedTab === "vouchers" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("vouchers"); setShowMobileMenu(false); }}
              data-testid="nav-vouchers"
            >
              <Ticket className="w-5 h-5 mr-3" />
              <span>Vouchers</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "payouts" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "payouts" ? "#c4ee3d" : undefined,
                color: selectedTab === "payouts" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("payouts"); setShowMobileMenu(false); }}
              data-testid="nav-payouts"
            >
              <TrendingUp className="w-5 h-5 mr-3" />
              <span>Payout Management</span>
            </Button>
            </>
            )}
            
            {/* Manual Plan Assignment - Admin only */}
            {isTabVisible('payments') && userRole === 'admin' && (
            <Button
              variant="ghost"
              className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
              onClick={() => { setShowManualPlanDialog(true); setShowMobileMenu(false); }}
              data-testid="nav-manual-plan"
            >
              <FileText className="w-5 h-5 mr-3" />
              <span>Manual Plan Assign</span>
            </Button>
            )}
            
            {/* Communication Section - Expanded for Customer Service */}
            {isTabVisible('communication') && (
              <>
                {userRole === 'admin' && (
                  <>
                    <Button
                      variant="ghost"
                      className={`w-full h-11 rounded-lg transition-colors justify-start relative ${
                        selectedTab === "communication" 
                          ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                          : "text-white hover:bg-[#c4ee3d] hover:text-black"
                      }`}
                      style={{
                        backgroundColor: selectedTab === "communication" ? "#c4ee3d" : undefined,
                        color: selectedTab === "communication" ? "black" : undefined
                      }}
                      onClick={() => { setSelectedTab("communication"); setShowMobileMenu(false); }}
                      data-testid="nav-communication"
                    >
                      <MessageSquare className="w-5 h-5 mr-3" />
                      <span>Communication</span>
                      {unreadMessagesCount > 0 && (
                        <div className="ml-auto w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</span>
                        </div>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                      onClick={() => { onNavigate?.('admin-email-inbox'); setShowMobileMenu(false); }}
                      data-testid="nav-email-inbox-admin"
                    >
                      <Mail className="w-5 h-5 mr-3" />
                      <span>Email Inbox</span>
                      {unreadMessagesCount > 0 && (
                        <Badge className="ml-auto bg-primary text-white hover:bg-primary" transition-all duration-300>
                          {unreadMessagesCount}
                        </Badge>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                      onClick={() => { onNavigate?.('admin-contact-messages'); setShowMobileMenu(false); }}
                      data-testid="nav-contact-messages-admin"
                    >
                      <FileText className="w-5 h-5 mr-3" />
                      <span>Contact Messages</span>
                      {newContactMessagesCount > 0 && (
                        <Badge className="ml-auto bg-primary text-white hover:bg-primary" transition-all duration-300>
                          {newContactMessagesCount}
                        </Badge>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                      onClick={() => { onNavigate?.('admin-applications-management'); setShowMobileMenu(false); }}
                      data-testid="nav-applications-admin"
                    >
                      <UserCheck className="w-5 h-5 mr-3" />
                      <span>Applications</span>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                      onClick={() => { onNavigate?.('admin-subject-approval'); setShowMobileMenu(false); }}
                      data-testid="nav-subject-approval"
                    >
                      <GraduationCap className="w-5 h-5 mr-3" />
                      <span>Subject Approvals</span>
                    </Button>
                  </>
                )}
                
                {/* Customer Service - Direct Nav Items */}
                {userRole === 'customer_service' && (
                  <>
                    <Button
                      variant="ghost"
                      className={`w-full h-11 rounded-lg transition-colors justify-start ${
                        selectedTab === "messaging" 
                          ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                          : "text-white hover:bg-[#c4ee3d] hover:text-black"
                      }`}
                      style={{
                        backgroundColor: selectedTab === "messaging" ? "#c4ee3d" : undefined,
                        color: selectedTab === "messaging" ? "black" : undefined
                      }}
                      onClick={() => { setSelectedTab("messaging"); setShowMobileMenu(false); }}
                      data-testid="nav-messaging"
                    >
                      <MessageSquare className="w-5 h-5 mr-3" />
                      <span>Direct Messages</span>
                    </Button>

                    <Button
                      variant="ghost"
                      className={`w-full h-11 rounded-lg transition-colors justify-start ${
                        selectedTab === "announcements" 
                          ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                          : "text-white hover:bg-[#c4ee3d] hover:text-black"
                      }`}
                      style={{
                        backgroundColor: selectedTab === "announcements" ? "#c4ee3d" : undefined,
                        color: selectedTab === "announcements" ? "black" : undefined
                      }}
                      onClick={() => { setSelectedTab("announcements"); setShowMobileMenu(false); }}
                      data-testid="nav-announcements"
                    >
                      <Megaphone className="w-5 h-5 mr-3" />
                      <span>Announcements</span>
                    </Button>

                    <Button
                      variant="ghost"
                      className={`w-full h-11 rounded-lg transition-colors justify-start ${
                        selectedTab === "community" 
                          ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                          : "text-white hover:bg-[#c4ee3d] hover:text-black"
                      }`}
                      style={{
                        backgroundColor: selectedTab === "community" ? "#c4ee3d" : undefined,
                        color: selectedTab === "community" ? "black" : undefined
                      }}
                      onClick={() => { setSelectedTab("community"); setShowMobileMenu(false); }}
                      data-testid="nav-community"
                    >
                      <Users className="w-5 h-5 mr-3" />
                      <span>Community</span>
                    </Button>

                    <Button
                      variant="ghost"
                      className={`w-full h-11 rounded-lg transition-colors justify-start ${
                        selectedTab === "groups" 
                          ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                          : "text-white hover:bg-[#c4ee3d] hover:text-black"
                      }`}
                      style={{
                        backgroundColor: selectedTab === "groups" ? "#c4ee3d" : undefined,
                        color: selectedTab === "groups" ? "black" : undefined
                      }}
                      onClick={() => { setSelectedTab("groups"); setShowMobileMenu(false); }}
                      data-testid="nav-groups"
                    >
                      <Users className="w-5 h-5 mr-3" />
                      <span>Groups</span>
                    </Button>

                    <Button
                      variant="ghost"
                      className={`w-full h-11 rounded-lg transition-colors justify-start ${
                        selectedTab === "help-chat" 
                          ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                          : "text-white hover:bg-[#c4ee3d] hover:text-black"
                      }`}
                      style={{
                        backgroundColor: selectedTab === "help-chat" ? "#c4ee3d" : undefined,
                        color: selectedTab === "help-chat" ? "black" : undefined
                      }}
                      onClick={() => { setSelectedTab("help-chat"); setShowMobileMenu(false); }}
                      data-testid="nav-help-chat"
                    >
                      <MessageCircle className="w-5 h-5 mr-3" />
                      <span>Help Chat</span>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                      onClick={() => { onNavigate?.('admin-email-inbox'); setShowMobileMenu(false); }}
                      data-testid="nav-email-inbox"
                    >
                      <Mail className="w-5 h-5 mr-3" />
                      <span>Email Inbox</span>
                      {unreadMessagesCount > 0 && (
                        <Badge className="ml-auto bg-primary text-white hover:bg-primary" transition-all duration-300>
                          {unreadMessagesCount}
                        </Badge>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full h-11 rounded-lg transition-colors justify-start text-white hover:bg-[#c4ee3d] hover:text-black" transition-all duration-300
                      onClick={() => { onNavigate?.('admin-contact-messages'); setShowMobileMenu(false); }}
                      data-testid="nav-contact-messages"
                    >
                      <FileText className="w-5 h-5 mr-3" />
                      <span>Contact Messages</span>
                      {newContactMessagesCount > 0 && (
                        <Badge className="ml-auto bg-primary text-white hover:bg-primary" transition-all duration-300>
                          {newContactMessagesCount}
                        </Badge>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      className={`w-full h-11 rounded-lg transition-colors justify-start ${
                        selectedTab === "quick-responses" 
                          ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                          : "text-white hover:bg-[#c4ee3d] hover:text-black"
                      }`}
                      style={{
                        backgroundColor: selectedTab === "quick-responses" ? "#c4ee3d" : undefined,
                        color: selectedTab === "quick-responses" ? "black" : undefined
                      }}
                      onClick={() => { setSelectedTab("quick-responses"); setShowMobileMenu(false); }}
                      data-testid="nav-quick-responses"
                    >
                      <MessageSquare className="w-5 h-5 mr-3" />
                      <span>Quick Responses</span>
                    </Button>
                  </>
                )}
              </>
            )}
            
            {/* Customer Service - Transactions Only */}
            {isTabVisible('payments') && userRole === 'customer_service' && (
              <Button
                variant="ghost"
                className={`w-full h-11 rounded-lg transition-colors justify-start ${
                  selectedTab === "transactions" 
                    ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                    : "text-white hover:bg-[#c4ee3d] hover:text-black"
                }`}
                style={{
                  backgroundColor: selectedTab === "transactions" ? "#c4ee3d" : undefined,
                  color: selectedTab === "transactions" ? "black" : undefined
                }}
                onClick={() => { setSelectedTab("transactions"); setShowMobileMenu(false); }}
                data-testid="nav-transactions"
              >
                <DollarSign className="w-5 h-5 mr-3" />
                <span>Transactions</span>
              </Button>
            )}
            
            {userRole === 'admin' && (
            <>
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "ads" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "ads" ? "#c4ee3d" : undefined,
                color: selectedTab === "ads" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("ads"); setShowMobileMenu(false); }}
              data-testid="nav-ads"
            >
              <TrendingUp className="w-5 h-5 mr-3" />
              <span>Advertisements</span>
            </Button>

            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "hero-sections" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "hero-sections" ? "#c4ee3d" : undefined,
                color: selectedTab === "hero-sections" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("hero-sections"); setShowMobileMenu(false); }}
              data-testid="nav-hero-sections"
            >
              <Image className="w-5 h-5 mr-3" />
              <span>Hero Sections</span>
            </Button>
            </>
            )}
            
            {isTabVisible('products') && (
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "products" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "products" ? "#c4ee3d" : undefined,
                color: selectedTab === "products" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("products"); setShowMobileMenu(false); }}
              data-testid="nav-products"
            >
              <Package className="w-5 h-5 mr-3" />
              <span>Products</span>
            </Button>
            )}
            
            {userRole === 'admin' && (
            <>
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "support-tickets" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "support-tickets" ? "#c4ee3d" : undefined,
                color: selectedTab === "support-tickets" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("support-tickets"); setShowMobileMenu(false); }}
              data-testid="nav-support-tickets"
            >
              <FileText className="w-5 h-5 mr-3" />
              <span>Support Tickets</span>
              {newSupportTicketsCount > 0 && (
                <Badge className="ml-auto bg-primary text-white hover:bg-primary" transition-all duration-300>
                  {newSupportTicketsCount}
                </Badge>
              )}
            </Button>
            </>
            )}
            
            {isTabVisible('settings') && (
            <Button
              variant="ghost"
              className={`w-full h-11 rounded-lg transition-colors justify-start ${
                selectedTab === "settings" 
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black" 
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "settings" ? "#c4ee3d" : undefined,
                color: selectedTab === "settings" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("settings"); setShowMobileMenu(false); }}
              data-testid="nav-settings"
            >
              <Settings className="w-5 h-5 mr-3" />
              <span>Settings</span>
            </Button>
            )}
            
            {userRole === "admin" && (
            <Button
              key="system-errors"
              className={`w-full justify-start text-left mb-4 transition-colors ${
                selectedTab === "system-errors"
                  ? "text-black hover:bg-[#c4ee3d] hover:text-black"
                  : "text-white hover:bg-[#c4ee3d] hover:text-black"
              }`}
              style={{
                backgroundColor: selectedTab === "system-errors" ? "#c4ee3d" : undefined,
                color: selectedTab === "system-errors" ? "black" : undefined
              }}
              onClick={() => { setSelectedTab("system-errors"); setShowMobileMenu(false); }}
              data-testid="nav-system-errors"
            >
              <AlertTriangle className="w-5 h-5 mr-3" />
              <span>System Errors</span>
            </Button>
            )}
            
            </nav>
          </div>
          
          {/* Logout Button */}
          <div className="flex-shrink-0 mt-4 space-y-2">
            <Button
              size="sm"
              className="w-full bg-[#0C332C] hover:bg-[#e64d2e] text-white" transition-all duration-300
              onClick={handleLogout}
              disabled={isLoggingOut}
              data-testid="button-logout"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      {/* Main content - with left margin on desktop to account for fixed sidebar, top padding for mobile navbar */}
      <div className={`flex flex-col min-h-screen pt-16 md:pt-0 md:ml-64 bg-white ${selectedTab === "messaging" ? "h-full" : ""}`}>
        
        {/* Desktop Header - doesn't scroll */}
        {selectedTab !== "messaging" && !(isMobile && isChatOpen) && (
          <div className="hidden md:block flex-shrink-0 border-b bg-background p-4 md:p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h1 className="md:text-xl font-bold text-[16px]">Admin Dashboard</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm md:text-base">
              Comprehensive platform management, messaging oversight, and payment analytics
            </p>
          </div>
        )}
        
        {/* Scrollable Content Area */}
        <div className={`flex-1 overflow-y-auto pb-mobile-safe md:pb-0 ${selectedTab === "messaging" ? "h-full" : "p-2 md:p-6"}`}>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className={selectedTab === "messaging" ? "h-full" : "space-y-4 md:space-y-6"}>
            {selectedTab !== "messaging" && (
            <div className="flex flex-col gap-2 md:gap-4 mb-4 md:mb-6">
            
            {/* Secondary Navigation - Context Specific (Admin Only) */}
            {selectedTab === 'communication' && userRole === 'admin' && (
              <div className="w-full">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {/* Messages */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#0C332C] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#0C332C]" transition-all duration-300 
                    data-testid="card-messages"
                    onClick={() => setSelectedTab("messaging")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#0C332C]/10 dark:bg-[#0C332C]/20 rounded-lg">
                        <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Direct messaging</p>
                      </div>
                    </div>
                  </Card>

                  {/* News */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#c4ee3d] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#c4ee3d]" transition-all duration-300 
                    data-testid="card-news"
                    onClick={() => setSelectedTab("announcements")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#c4ee3d]/20 dark:bg-[#c4ee3d]/30 rounded-lg">
                        <Megaphone className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">News</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Announcements</p>
                      </div>
                    </div>
                  </Card>

                  {/* Mod */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#0C332C] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#0C332C]" transition-all duration-300 
                    data-testid="card-mod"
                    onClick={() => setSelectedTab("moderation")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#0C332C]/10 dark:bg-[#0C332C]/20 rounded-lg">
                        <Shield className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Mod</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Moderation tools</p>
                      </div>
                    </div>
                  </Card>

                  {/* Community */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#A0FAB2] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#A0FAB2]" transition-all duration-300 
                    data-testid="card-community"
                    onClick={() => setSelectedTab("community")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#A0FAB2]/20 dark:bg-[#A0FAB2]/30 rounded-lg">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Community</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Community chat</p>
                      </div>
                    </div>
                  </Card>

                  {/* Groups */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#0C332C] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#0C332C]" transition-all duration-300 
                    data-testid="card-groups"
                    onClick={() => setSelectedTab("groups")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#0C332C]/10 dark:bg-[#0C332C]/20 rounded-lg">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Groups</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Manage groups</p>
                      </div>
                    </div>
                  </Card>

                  {/* Support */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#0C332C] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#0C332C]" transition-all duration-300 
                    data-testid="card-support"
                    onClick={() => setSelectedTab("help-chat")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#0C332C]/10 dark:bg-[#0C332C]/20 rounded-lg">
                        <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Support</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Help desk</p>
                      </div>
                    </div>
                  </Card>

                  {/* Profiles */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#c4ee3d] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#c4ee3d]" transition-all duration-300 
                    data-testid="card-profiles"
                    onClick={() => setSelectedTab("support-profiles")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#c4ee3d]/20 dark:bg-[#c4ee3d]/30 rounded-lg">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Profiles</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Support profiles</p>
                      </div>
                    </div>
                  </Card>

                  {/* Mode */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#A0FAB2] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#A0FAB2]" transition-all duration-300 
                    data-testid="card-mode"
                    onClick={() => setSelectedTab("assignment-mode")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#A0FAB2]/20 dark:bg-[#A0FAB2]/30 rounded-lg">
                        <Settings className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Mode</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Assignment mode</p>
                      </div>
                    </div>
                  </Card>

                  {/* Quick */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#c4ee3d] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#c4ee3d]" transition-all duration-300 
                    data-testid="card-quick"
                    onClick={() => setSelectedTab("quick-responses")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#c4ee3d]/20 dark:bg-[#c4ee3d]/30 rounded-lg">
                        <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Quick</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Quick responses</p>
                      </div>
                    </div>
                  </Card>

                  {/* Blog */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#A0FAB2] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#A0FAB2]" transition-all duration-300 
                    data-testid="card-blog"
                    onClick={() => onNavigate?.('admin-blog-management')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#A0FAB2]/20 dark:bg-[#A0FAB2]/30 rounded-lg">
                        <FileText className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Blog</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Manage blog posts</p>
                      </div>
                    </div>
                  </Card>

                  {/* Courses */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#3b82f6] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#3b82f6]" transition-all duration-300 
                    data-testid="card-courses"
                    onClick={() => onNavigate?.('admin-course-management')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#3b82f6]/20 dark:bg-[#3b82f6]/30 rounded-lg">
                        <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Courses</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Approve freelancer courses</p>
                      </div>
                    </div>
                  </Card>

                  {/* Applications */}
                  <Card 
                    className="p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#f59e0b] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#f59e0b]" transition-all duration-300 
                    data-testid="card-applications"
                    onClick={() => onNavigate?.('admin-applications-management')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-[#f59e0b]/20 dark:bg-[#f59e0b]/30 rounded-lg">
                        <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">Applications</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Review teacher & freelancer applications</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
            
            {selectedTab === 'users' && (
              <div className="flex items-center justify-center">
                <ScrollArea className="w-full max-w-full">
                  <TabsList className="flex w-max min-w-full justify-start gap-1 h-auto p-1">
                    <TabsTrigger value="users" data-testid="tab-users-management" className="px-2 md:px-4 py-2 text-xs flex-shrink-0">
                      <Users className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">User Management</span>
                      <span className="md:hidden">Manage</span>
                    </TabsTrigger>
                    <TabsTrigger value="relationships" data-testid="tab-relationships" className="px-2 md:px-4 py-2 text-xs flex-shrink-0">
                      <UserCheck className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">Relationships</span>
                      <span className="md:hidden">Relations</span>
                    </TabsTrigger>
                  </TabsList>
                </ScrollArea>
              </div>
            )}
          </div>
          )}

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-gray-900 dark:text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">Active platform users</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
                  <MessageCircle className="h-4 w-4 text-gray-900 dark:text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {searchResults.filter((m: Message) => 
                      new Date(m.createdAt).toDateString() === new Date().toDateString()
                    ).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Messages sent today</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Moderation Actions</CardTitle>
                  <Flag className="h-4 w-4 text-gray-900 dark:text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{moderationLogs.length}</div>
                  <p className="text-xs text-muted-foreground">Total mod actions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Active Relationships</CardTitle>
                  <UserCheck className="h-4 w-4 text-gray-900 dark:text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignments.filter((a: any) => a.isActive).length}</div>
                  <p className="text-xs text-muted-foreground">Teacher-student pairs</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {moderationLogs.slice(0, 10).map((log: ModerationLog) => (
                        <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getActionBadge(log.actionType)}
                              <span className="text-sm font-medium">{log.moderatorName}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{log.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['student', 'teacher', 'admin'].map(role => {
                      const count = users.filter((u: User) => u.role === role).length;
                      const percentage = users.length > 0 ? (count / users.length) * 100 : 0;
                      
                      return (
                        <div key={role} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{role}s</span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Manage multiple email accounts and respond to customer inquiries
                  </p>
                  <div className="space-y-2">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => onNavigate?.('admin-email-management')}
                      data-testid="button-nav-email-management"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Email Accounts
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => onNavigate?.('admin-email-inbox')}
                      data-testid="button-nav-email-inbox"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Email Inbox
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => onNavigate?.('admin-email-campaigns')}
                      data-testid="button-nav-email-campaigns"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Campaigns
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-4 md:space-y-6">
            <div className="flex gap-2 sm:gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, or ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-9 text-sm h-9 sm:h-10"
                  data-testid="search-users"
                />
              </div>
            </div>

            <div>
              <Tabs defaultValue="all" className="w-full">
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                  <TabsList className="inline-flex w-max h-auto p-1 gap-0.5 sm:gap-1">
                    <TabsTrigger value="all" data-testid="tab-all-users" className="px-2.5 sm:px-3 md:px-4 py-1.5 text-[11px] sm:text-xs whitespace-nowrap">
                      <span className="hidden sm:inline">All ({users.length})</span>
                      <span className="sm:hidden">All ({users.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="student" data-testid="tab-students" className="px-2.5 sm:px-3 md:px-4 py-1.5 text-[11px] sm:text-xs whitespace-nowrap">
                      <span>Students ({users.filter((u: User) => u.role === 'student').length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="teacher" data-testid="tab-teachers" className="px-2.5 sm:px-3 md:px-4 py-1.5 text-[11px] sm:text-xs whitespace-nowrap">
                      <span>Teachers ({users.filter((u: User) => u.role === 'teacher').length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="freelancer" data-testid="tab-freelancers" className="px-2.5 sm:px-3 md:px-4 py-1.5 text-[11px] sm:text-xs whitespace-nowrap">
                      <span>Freelancers ({users.filter((u: User) => u.role === 'freelancer').length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="customer" data-testid="tab-customers" className="px-2.5 sm:px-3 md:px-4 py-1.5 text-[11px] sm:text-xs whitespace-nowrap">
                      <span>Customers ({users.filter((u: User) => u.role === 'general').length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="admin" data-testid="tab-admins" className="px-2.5 sm:px-3 md:px-4 py-1.5 text-[11px] sm:text-xs whitespace-nowrap">
                      <span>Admins ({users.filter((u: User) => u.role === 'admin').length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="accountant" data-testid="tab-accountants" className="px-2.5 sm:px-3 md:px-4 py-1.5 text-[11px] sm:text-xs whitespace-nowrap">
                      <span>Accountants ({users.filter((u: User) => u.role === 'accountant').length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="customer_service" data-testid="tab-customer-service" className="px-2.5 sm:px-3 md:px-4 py-1.5 text-[11px] sm:text-xs whitespace-nowrap">
                      <span>Customer Service ({users.filter((u: User) => u.role === 'customer_service').length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="banned" data-testid="tab-banned-users" className="px-2.5 sm:px-3 md:px-4 py-1.5 text-[11px] sm:text-xs text-primary-600 whitespace-nowrap">
                      <span>Banned ({users.filter((u: User) => u.status === 'banned').length})</span>
                    </TabsTrigger>
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

              {/* All Users Tab */}
              <TabsContent value="all">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] md:h-[600px]">
                      <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                        {usersLoading ? (
                          <div className="text-center py-8">Loading users...</div>
                        ) : users.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No users found</div>
                        ) : (
                          users.map((user: User) => (
                            <UserCard 
                              key={user.userId} 
                              user={user} 
                              onEdit={handleEditUser}
                              onDelete={handleDeleteUser}
                              onBan={handleBanUser}
                              onLoginAsUser={handleLoginAsUser}
                              onToggleFeatured={(userId) => toggleFeaturedMutation.mutate(userId)}
                              isTogglingFeatured={togglingUserId === user.userId}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="student">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] md:h-[600px]">
                      <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                        {usersLoading ? (
                          <div className="text-center py-8">Loading users...</div>
                        ) : users.filter((u: User) => u.role === 'student').length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No students found</div>
                        ) : (
                          users.filter((u: User) => u.role === 'student').map((user: User) => (
                            <UserCard 
                              key={user.userId} 
                              user={user} 
                              onEdit={handleEditUser}
                              onDelete={handleDeleteUser}
                              onBan={handleBanUser}
                              onLoginAsUser={handleLoginAsUser}
                              onToggleFeatured={(userId) => toggleFeaturedMutation.mutate(userId)}
                              isTogglingFeatured={togglingUserId === user.userId}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Teachers Tab */}
              <TabsContent value="teacher">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] md:h-[600px]">
                      <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                        {usersLoading ? (
                          <div className="text-center py-8">Loading users...</div>
                        ) : users.filter((u: User) => u.role === 'teacher').length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No teachers found</div>
                        ) : (
                          users.filter((u: User) => u.role === 'teacher').map((user: User) => (
                            <UserCard 
                              key={user.userId} 
                              user={user} 
                              onEdit={handleEditUser}
                              onDelete={handleDeleteUser}
                              onBan={handleBanUser}
                              onLoginAsUser={handleLoginAsUser}
                              onToggleFeatured={(userId) => toggleFeaturedMutation.mutate(userId)}
                              isTogglingFeatured={togglingUserId === user.userId}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Freelancers Tab */}
              <TabsContent value="freelancer">
                <div className="space-y-4">
                  {/* Profile Boost Manager */}
                  <ProfileBoostManager />
                  
                  {/* Work Boost Manager */}
                  <WorkBoostManager />
                  
                  {/* Work Comment Boost Manager */}
                  <WorkCommentBoostManager />
                  
                  {/* Freelancer User List */}
                  <Card>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px] md:h-[600px]">
                        <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                          {usersLoading ? (
                            <div className="text-center py-8">Loading users...</div>
                          ) : users.filter((u: User) => u.role === 'freelancer').length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No freelancers found</div>
                          ) : (
                            users.filter((u: User) => u.role === 'freelancer').map((user: User) => (
                              <UserCard 
                                key={user.userId} 
                                user={user} 
                                onEdit={handleEditUser}
                                onDelete={handleDeleteUser}
                                onBan={handleBanUser}
                                onLoginAsUser={handleLoginAsUser}
                                onToggleFeatured={(userId) => toggleFeaturedMutation.mutate(userId)}
                                isTogglingFeatured={togglingUserId === user.userId}
                              />
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Customers Tab */}
              <TabsContent value="customer">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] md:h-[600px]">
                      <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                        {usersLoading ? (
                          <div className="text-center py-8">Loading users...</div>
                        ) : users.filter((u: User) => u.role === 'general').length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No customers found</div>
                        ) : (
                          users.filter((u: User) => u.role === 'general').map((user: User) => (
                            <UserCard 
                              key={user.userId} 
                              user={user} 
                              onEdit={handleEditUser}
                              onDelete={handleDeleteUser}
                              onBan={handleBanUser}
                              onLoginAsUser={handleLoginAsUser}
                              onToggleFeatured={(userId) => toggleFeaturedMutation.mutate(userId)}
                              isTogglingFeatured={togglingUserId === user.userId}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Admins Tab */}
              <TabsContent value="admin">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] md:h-[600px]">
                      <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                        {usersLoading ? (
                          <div className="text-center py-8">Loading users...</div>
                        ) : users.filter((u: User) => u.role === 'admin').length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No admins found</div>
                        ) : (
                          users.filter((u: User) => u.role === 'admin').map((user: User) => (
                            <UserCard 
                              key={user.userId} 
                              user={user} 
                              onEdit={handleEditUser}
                              onDelete={handleDeleteUser}
                              onBan={handleBanUser}
                              onLoginAsUser={handleLoginAsUser}
                              onToggleFeatured={(userId) => toggleFeaturedMutation.mutate(userId)}
                              isTogglingFeatured={togglingUserId === user.userId}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accountants Tab */}
              <TabsContent value="accountant">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] md:h-[600px]">
                      <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                        {usersLoading ? (
                          <div className="text-center py-8">Loading users...</div>
                        ) : users.filter((u: User) => u.role === 'accountant').length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No accountants found</div>
                        ) : (
                          users.filter((u: User) => u.role === 'accountant').map((user: User) => (
                            <UserCard 
                              key={user.userId} 
                              user={user} 
                              onEdit={handleEditUser}
                              onDelete={handleDeleteUser}
                              onBan={handleBanUser}
                              onLoginAsUser={handleLoginAsUser}
                              onToggleFeatured={(userId) => toggleFeaturedMutation.mutate(userId)}
                              isTogglingFeatured={togglingUserId === user.userId}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Customer Service Tab */}
              <TabsContent value="customer_service">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] md:h-[600px]">
                      <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                        {usersLoading ? (
                          <div className="text-center py-8">Loading users...</div>
                        ) : users.filter((u: User) => u.role === 'customer_service').length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No customer service users found</div>
                        ) : (
                          users.filter((u: User) => u.role === 'customer_service').map((user: User) => (
                            <UserCard 
                              key={user.userId} 
                              user={user} 
                              onEdit={handleEditUser}
                              onDelete={handleDeleteUser}
                              onBan={handleBanUser}
                              onLoginAsUser={handleLoginAsUser}
                              onToggleFeatured={(userId) => toggleFeaturedMutation.mutate(userId)}
                              isTogglingFeatured={togglingUserId === user.userId}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Banned Users Tab */}
              <TabsContent value="banned">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary-600">
                      <Ban className="h-5 w-5" />
                      Banned Users
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Users who have been banned from the platform. You can unban them by changing their status.
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] md:h-[600px]">
                      <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                        {usersLoading ? (
                          <div className="text-center py-8">Loading users...</div>
                        ) : users.filter((u: User) => u.status === 'banned').length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <h3 className="text-lg font-medium">No banned users</h3>
                            <p>All users currently have active accounts.</p>
                          </div>
                        ) : (
                          users.filter((u: User) => u.status === 'banned').map((user: User) => (
                            <UserCard 
                              key={user.userId} 
                              user={user} 
                              onEdit={handleEditUser}
                              onDelete={handleDeleteUser}
                              onBan={handleBanUser}
                              onLoginAsUser={handleLoginAsUser}
                              onToggleFeatured={(userId) => toggleFeaturedMutation.mutate(userId)}
                              isTogglingFeatured={togglingUserId === user.userId}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
                      <TabsContent value="system-errors" className="space-y-6">
            <SystemErrorsPanel />
          </TabsContent>
        </Tabs>
            </div>
          </TabsContent>

          {/* Message Moderation */}
          <TabsContent value="moderation" className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search message content..."
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="search-messages"
                />
              </div>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((user: User) => (
                    <SelectItem key={user.userId} value={user.userId}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Message Search Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Messages & Search Results</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {messageSearchQuery || selectedUserId ? 'Filtered results' : 'Showing recent messages from all users'}
                  </p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {searchLoading ? (
                        <div className="text-center py-8">Searching messages...</div>
                      ) : searchResults.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {messageSearchQuery || selectedUserId ? 'No messages found matching your criteria' : 'No messages found'}
                        </div>
                      ) : (
                        searchResults.map((message: Message) => (
                          <div key={message.id} className="p-4 rounded-lg border bg-card" data-testid={`message-${message.id}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{message.senderName}</span>
                                {getRoleBadge(message.senderRole)}
                                <span className="text-xs text-muted-foreground">→</span>
                                <span className="text-sm font-medium">{message.receiverName}</span>
                                {getRoleBadge(message.receiverRole)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost">
                                      <Flag className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Flag Message</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <Textarea
                                        placeholder="Reason for flagging..."
                                        value={flagReason}
                                        onChange={(e) => setFlagReason(e.target.value)}
                                      />
                                      <Button
                                        onClick={() => flagMessageMutation.mutate({ messageId: message.id, reason: flagReason })}
                                        disabled={flagMessageMutation.isPending}
                                      >
                                        Flag Message
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Delete Message</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <p className="text-sm text-muted-foreground">
                                        This action cannot be undone. The message will be permanently deleted.
                                      </p>
                                      <Textarea
                                        placeholder="Reason for deletion..."
                                        value={deleteReason}
                                        onChange={(e) => setDeleteReason(e.target.value)}
                                      />
                                      <Button
                                        onClick={() => deleteMessageMutation.mutate({ messageId: message.id, reason: deleteReason })}
                                        disabled={deleteMessageMutation.isPending}
                                        variant="destructive"
                                      >
                                        Delete Message
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                            
                            <p className="text-sm mb-2">{message.content}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(message.createdAt).toLocaleString()}
                              <Badge variant={message.isRead ? "default" : "secondary"} className="text-xs">
                                {message.isRead ? "Read" : "Unread"}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Moderation Logs */}
              <Card>
                <CardHeader>
                  <CardTitle>Moderation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {logsLoading ? (
                        <div className="text-center py-8">Loading logs...</div>
                      ) : moderationLogs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No moderation actions</div>
                      ) : (
                        moderationLogs.map((log: ModerationLog) => (
                          <div key={log.id} className="p-4 rounded-lg border bg-card">
                            <div className="flex items-center gap-2 mb-2">
                              {getActionBadge(log.actionType)}
                              <span className="text-sm font-medium">{log.moderatorName}</span>
                            </div>
                            <p className="text-sm mb-2">{log.reason}</p>
                            {log.originalContent && (
                              <div className="p-2 bg-muted rounded text-xs">
                                <strong>Original:</strong> {log.originalContent}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teacher-Student Relationships */}
          <TabsContent value="relationships" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teacher-Student Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {assignmentsLoading ? (
                      <div className="text-center py-8">Loading assignments...</div>
                    ) : assignments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No assignments found</div>
                    ) : (
                      assignments.map((assignment: TeacherStudent, index: number) => (
                        <div key={`${assignment.teacherId}-${assignment.studentId}-${index}`} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50" transition-all duration-300>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{assignment.teacherName}</span>
                              <Badge variant="default" className="text-xs">Teacher</Badge>
                              <span className="text-xs text-muted-foreground">→</span>
                              <span className="font-medium">{assignment.studentName}</span>
                              <Badge variant="secondary" className="text-xs">Student</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Subject: {assignment.subjectName || 'General'}</span>
                              <Separator orientation="vertical" className="h-3" />
                              <span>Since: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                              <Separator orientation="vertical" className="h-3" />
                              <Badge variant={assignment.isActive ? "default" : "secondary"} className="text-xs">
                                {assignment.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Educational Content Management */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Educational Content Management
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create and manage courses for college/university students or subjects for primary/secondary education (Grades 1-12).
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <EducationLevelSelector 
                  onNavigate={(page: string) => onNavigate?.(page)}
                  userRole={userRole}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Settings */}
          {/* Transactions Management */}
          <TabsContent value="transactions" className="space-y-6">
            <AdminTransactionPanel />
          </TabsContent>

          {/* Pricing Plans Management */}
          <TabsContent value="pricing" className="space-y-6">
            <ShopMembershipManagement />
            <div className="pt-8">
              <PricingManagement />
            </div>
          </TabsContent>

          {/* Wallet Management */}
          <TabsContent value="wallet-management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Wallet Management
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manually add funds to user wallets for cash payments or other offline transactions
                </p>
              </CardHeader>
              <CardContent>
                <WalletManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payout Management */}
          <TabsContent value="payouts" className="space-y-6">
            <AdminPayoutManagement isEmbedded={true} />
          </TabsContent>

          {/* Vouchers Management */}
          <TabsContent value="vouchers" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Voucher</h2>
                <div className="flex gap-2">
                  <Button
                    variant={voucherCreationMode === 'single' ? 'default' : 'outline'}
                    onClick={() => setVoucherCreationMode('single')}
                    data-testid="button-single-mode"
                  >
                    Single
                  </Button>
                  <Button
                    variant={voucherCreationMode === 'bulk' ? 'default' : 'outline'}
                    onClick={() => setVoucherCreationMode('bulk')}
                    data-testid="button-bulk-mode"
                  >
                    Bulk Generation
                  </Button>
                </div>
              </div>

              {voucherCreationMode === 'single' ? (
                <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-gray-900 dark:text-gray-100">
                      Voucher Code Generation
                    </Label>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${voucherCodeMode === 'manual' ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>Manual</span>
                      <button
                        type="button"
                        onClick={() => {
                          setVoucherCodeMode(prev => {
                            const newMode = prev === 'auto' ? 'manual' : 'auto';
                            if (newMode === 'auto') {
                              setNewVoucher(v => ({ ...v, code: generateVoucherCode() }));
                            }
                            return newMode;
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          voucherCodeMode === 'auto' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        data-testid="toggle-voucher-mode"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            voucherCodeMode === 'auto' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-sm ${voucherCodeMode === 'auto' ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>Auto</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="voucher-code" className="text-gray-900 dark:text-gray-100 mb-2 block">
                        Voucher Code <span className="text-primary-500">*</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(14 characters)</span>
                      </Label>
                      <Input
                        id="voucher-code"
                        placeholder="e.g., 898KD908928AASW"
                        value={newVoucher.code}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().slice(0, 14);
                          setNewVoucher({ ...newVoucher, code: value });
                        }}
                        readOnly={voucherCodeMode === 'auto'}
                        maxLength={14}
                        className={`font-mono ${voucherCodeMode === 'auto' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                        data-testid="input-voucher-code"
                      />
                    </div>
                    {voucherCodeMode === 'auto' && (
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewVoucher({ ...newVoucher, code: generateVoucherCode() })}
                          className="whitespace-nowrap"
                          data-testid="button-regenerate-code"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Generate New
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="voucher-amount" className="text-gray-900 dark:text-gray-100">
                    Amount ($) <span className="text-primary-500">*</span>
                  </Label>
                  <Input
                    id="voucher-amount"
                    type="number"
                    placeholder="e.g., 50"
                    value={newVoucher.amount}
                    onChange={(e) => setNewVoucher({ ...newVoucher, amount: e.target.value })}
                    data-testid="input-voucher-amount"
                  />
                </div>
                <div>
                  <Label htmlFor="voucher-description" className="text-gray-900 dark:text-gray-100">
                    Description
                  </Label>
                  <Input
                    id="voucher-description"
                    placeholder="e.g., Welcome bonus"
                    value={newVoucher.description}
                    onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                    data-testid="input-voucher-description"
                  />
                </div>
                <div>
                  <Label htmlFor="voucher-max-redemptions" className="text-gray-900 dark:text-gray-100">
                    Max Redemptions (default: 1)
                  </Label>
                  <Input
                    id="voucher-max-redemptions"
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    value={newVoucher.maxRedemptions}
                    onChange={(e) => setNewVoucher({ ...newVoucher, maxRedemptions: e.target.value })}
                    data-testid="input-voucher-max-redemptions"
                  />
                </div>
                <div>
                  <Label htmlFor="voucher-expires-at" className="text-gray-900 dark:text-gray-100">
                    Expiry Date (leave empty for no expiry)
                  </Label>
                  <Input
                    id="voucher-expires-at"
                    type="datetime-local"
                    value={newVoucher.expiresAt}
                    onChange={(e) => setNewVoucher({ ...newVoucher, expiresAt: e.target.value })}
                    data-testid="input-voucher-expires-at"
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  if (!newVoucher.code || !newVoucher.amount) {
                    alert("Please fill in code and amount");
                    return;
                  }
                  if (newVoucher.code.length !== 14) {
                    alert("Voucher code must be exactly 14 characters");
                    return;
                  }
                  createVoucherMutation.mutate({
                    code: newVoucher.code,
                    amount: parseFloat(newVoucher.amount),
                    description: newVoucher.description || null,
                    maxRedemptions: newVoucher.maxRedemptions ? parseInt(newVoucher.maxRedemptions) : null,
                    expiresAt: newVoucher.expiresAt || null
                  });
                }}
                disabled={createVoucherMutation.isPending}
                className="w-full md:w-auto"
                data-testid="button-create-voucher"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createVoucherMutation.isPending ? "Creating..." : "Create Voucher"}
              </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bulk-count" className="text-gray-900 dark:text-gray-100">
                        Number of Vouchers <span className="text-primary-500">*</span>
                      </Label>
                      <Input
                        id="bulk-count"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g., 10"
                        value={bulkVoucher.count}
                        onChange={(e) => {
                          const count = parseInt(e.target.value) || 1;
                          setBulkVoucher({ ...bulkVoucher, count: e.target.value });
                          if (count > recipients.length) {
                            const newRecipients = [...recipients];
                            for (let i = recipients.length; i < count; i++) {
                              newRecipients.push({ name: "", email: "" });
                            }
                            setRecipients(newRecipients);
                          }
                        }}
                        data-testid="input-bulk-count"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-amount" className="text-gray-900 dark:text-gray-100">
                        Amount per Voucher ($) <span className="text-primary-500">*</span>
                      </Label>
                      <Input
                        id="bulk-amount"
                        type="number"
                        placeholder="e.g., 50"
                        value={bulkVoucher.amount}
                        onChange={(e) => setBulkVoucher({ ...bulkVoucher, amount: e.target.value })}
                        data-testid="input-bulk-amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-description" className="text-gray-900 dark:text-gray-100">
                        Description
                      </Label>
                      <Input
                        id="bulk-description"
                        placeholder="e.g., Retailer Credit Voucher"
                        value={bulkVoucher.description}
                        onChange={(e) => setBulkVoucher({ ...bulkVoucher, description: e.target.value })}
                        data-testid="input-bulk-description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-expires-at" className="text-gray-900 dark:text-gray-100">
                        Expiry Date (optional)
                      </Label>
                      <Input
                        id="bulk-expires-at"
                        type="datetime-local"
                        value={bulkVoucher.expiresAt}
                        onChange={(e) => setBulkVoucher({ ...bulkVoucher, expiresAt: e.target.value })}
                        data-testid="input-bulk-expires-at"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recipient Emails
                      </h3>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="send-email"
                          checked={bulkVoucher.sendEmail}
                          onChange={(e) => setBulkVoucher({ ...bulkVoucher, sendEmail: e.target.checked })}
                          className="rounded"
                          data-testid="checkbox-send-email"
                        />
                        <Label htmlFor="send-email" className="text-gray-900 dark:text-gray-100">
                          Send emails automatically
                        </Label>
                      </div>
                    </div>

                    {bulkVoucher.sendEmail && (
                      <div className="mb-4">
                        <Label className="text-gray-900 dark:text-gray-100 mb-2 block">
                          Email Distribution Mode
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={bulkVoucher.emailDistributionMode === 'single' ? 'default' : 'outline'}
                            onClick={() => setBulkVoucher({ ...bulkVoucher, emailDistributionMode: 'single' })}
                            className="flex-1"
                            data-testid="button-single-email-mode"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Single Email (Wholesale)
                          </Button>
                          <Button
                            type="button"
                            variant={bulkVoucher.emailDistributionMode === 'individual' ? 'default' : 'outline'}
                            onClick={() => setBulkVoucher({ ...bulkVoucher, emailDistributionMode: 'individual' })}
                            className="flex-1"
                            data-testid="button-individual-email-mode"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Individual Emails
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {bulkVoucher.emailDistributionMode === 'single' 
                            ? 'All vouchers will be sent to one email address (e.g., for wholesale purchases)'
                            : 'Each voucher will be sent to a different email address'}
                        </p>
                      </div>
                    )}

                    {bulkVoucher.sendEmail && bulkVoucher.emailDistributionMode === 'single' ? (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="single-recipient-name" className="text-sm text-gray-700 dark:text-gray-300">
                              Recipient Name
                            </Label>
                            <Input
                              id="single-recipient-name"
                              placeholder="e.g., ABC Wholesale Store"
                              value={singleRecipient.name}
                              onChange={(e) => setSingleRecipient({ ...singleRecipient, name: e.target.value })}
                              data-testid="input-single-recipient-name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="single-recipient-email" className="text-sm text-gray-700 dark:text-gray-300">
                              Email <span className="text-primary-500">*</span>
                            </Label>
                            <Input
                              id="single-recipient-email"
                              type="email"
                              placeholder="e.g., wholesale@store.com"
                              value={singleRecipient.email}
                              onChange={(e) => setSingleRecipient({ ...singleRecipient, email: e.target.value })}
                              data-testid="input-single-recipient-email"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                          All {bulkVoucher.count} voucher(s) will be sent to this email address
                        </p>
                      </div>
                    ) : bulkVoucher.sendEmail ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {recipients.slice(0, parseInt(bulkVoucher.count) || 1).map((recipient, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <Label htmlFor={`recipient-name-${index}`} className="text-sm text-gray-700 dark:text-gray-300">
                                Recipient #{index + 1} Name
                              </Label>
                              <Input
                                id={`recipient-name-${index}`}
                                placeholder="e.g., John's Store"
                                value={recipient.name}
                                onChange={(e) => {
                                  const newRecipients = [...recipients];
                                  newRecipients[index].name = e.target.value;
                                  setRecipients(newRecipients);
                                }}
                                data-testid={`input-recipient-name-${index}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`recipient-email-${index}`} className="text-sm text-gray-700 dark:text-gray-300">
                                Email <span className="text-primary-500">*</span>
                              </Label>
                              <Input
                                id={`recipient-email-${index}`}
                                type="email"
                                placeholder="e.g., john@store.com"
                                value={recipient.email}
                                onChange={(e) => {
                                  const newRecipients = [...recipients];
                                  newRecipients[index].email = e.target.value;
                                  setRecipients(newRecipients);
                                }}
                                data-testid={`input-recipient-email-${index}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowVoucherPreview(true)}
                        disabled={!bulkVoucher.amount}
                        data-testid="button-preview-voucher"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Voucher
                      </Button>
                      <Button
                        onClick={() => {
                          const count = parseInt(bulkVoucher.count);
                          if (!count || count < 1) {
                            alert("Please enter a valid number of vouchers");
                            return;
                          }
                          if (!bulkVoucher.amount) {
                            alert("Please enter an amount");
                            return;
                          }
                          if (count > 100) {
                            alert("Maximum 100 vouchers can be generated at once");
                            return;
                          }
                          if (bulkVoucher.sendEmail) {
                            if (bulkVoucher.emailDistributionMode === 'single') {
                              if (!singleRecipient.email) {
                                alert("Please provide an email address");
                                return;
                              }
                            } else {
                              const validRecipients = recipients.slice(0, count).filter(r => r.email);
                              if (validRecipients.length !== count) {
                                alert(`Please provide emails for all ${count} recipients`);
                                return;
                              }
                            }
                          }
                          
                          createBulkVouchersMutation.mutate({
                            count,
                            amount: parseFloat(bulkVoucher.amount),
                            description: bulkVoucher.description || "Gift Voucher",
                            maxRedemptions: bulkVoucher.maxRedemptions ? parseInt(bulkVoucher.maxRedemptions) : null,
                            expiresAt: bulkVoucher.expiresAt || null,
                            recipients: bulkVoucher.sendEmail 
                              ? (bulkVoucher.emailDistributionMode === 'single' 
                                  ? [singleRecipient]
                                  : recipients.slice(0, count))
                              : [],
                            sendEmail: bulkVoucher.sendEmail,
                            emailDistributionMode: bulkVoucher.emailDistributionMode
                          });
                        }}
                        disabled={createBulkVouchersMutation.isPending}
                        className="flex-1"
                        data-testid="button-generate-bulk"
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        {createBulkVouchersMutation.isPending ? "Generating..." : `Generate ${bulkVoucher.count} Voucher(s)`}
                      </Button>
                    </div>
                    
                    {voucherAjaxOperation !== 'idle' && (
                      <AjaxStatus 
                        operation={voucherAjaxOperation} 
                        message={voucherAjaxMessage}
                        data-testid="ajax-status-voucher"
                      />
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Voucher Preview Dialog */}
            <Dialog open={showVoucherPreview} onOpenChange={setShowVoucherPreview}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Voucher Preview</DialogTitle>
                  <DialogDescription>
                    This is how your vouchers will look when generated and sent via email
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <VoucherCard
                      code="SAMPLE14CHARS"
                      amount={parseFloat(bulkVoucher.amount || voucherCreationMode === 'single' ? newVoucher.amount : "50")}
                      description={bulkVoucher.description || newVoucher.description || "Gift Voucher"}
                      recipientName="Sample Recipient"
                      expiresAt={bulkVoucher.expiresAt || newVoucher.expiresAt}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Each voucher will have a unique 14-character code and will be automatically sent to recipients if email is enabled.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Existing Vouchers</h2>
                {vouchersData && Array.isArray(vouchersData) && vouchersData.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: 'Delete All Vouchers',
                        description: `Are you sure you want to delete all ${vouchersData.length} voucher(s)? This action cannot be undone.`,
                        confirmText: 'OK',
                        cancelText: 'Cancel'
                      });
                      if (confirmed) {
                        deleteAllVouchersMutation.mutate();
                      }
                    }}
                    disabled={deleteAllVouchersMutation.isPending}
                    data-testid="button-delete-all-vouchers"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </Button>
                )}
              </div>
              {loadingVouchers ? (
                <div className="text-center py-8 text-gray-500">Loading vouchers...</div>
              ) : !vouchersData || !Array.isArray(vouchersData) || vouchersData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No vouchers created yet</div>
              ) : (
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="active" data-testid="tab-active-vouchers">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Active ({vouchersData.filter((v: any) => {
                        const isExpired = v.expiresAt && new Date(v.expiresAt) < new Date();
                        const isFullyUsed = v.maxRedemptions && v.currentRedemptions >= v.maxRedemptions;
                        return v.isActive && !isExpired && !isFullyUsed;
                      }).length})
                    </TabsTrigger>
                    <TabsTrigger value="expired" data-testid="tab-expired-vouchers">
                      <Clock className="h-4 w-4 mr-2" />
                      Expired ({vouchersData.filter((v: any) => v.expiresAt && new Date(v.expiresAt) < new Date()).length})
                    </TabsTrigger>
                    <TabsTrigger value="used" data-testid="tab-used-vouchers">
                      <Ticket className="h-4 w-4 mr-2" />
                      Used ({vouchersData.filter((v: any) => v.maxRedemptions && v.currentRedemptions >= v.maxRedemptions).length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    <div className="space-y-3">
                      {vouchersData.filter((v: any) => {
                        const isExpired = v.expiresAt && new Date(v.expiresAt) < new Date();
                        const isFullyUsed = v.maxRedemptions && v.currentRedemptions >= v.maxRedemptions;
                        return v.isActive && !isExpired && !isFullyUsed;
                      }).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No active vouchers</div>
                      ) : (
                        vouchersData.filter((v: any) => {
                          const isExpired = v.expiresAt && new Date(v.expiresAt) < new Date();
                          const isFullyUsed = v.maxRedemptions && v.currentRedemptions >= v.maxRedemptions;
                          return v.isActive && !isExpired && !isFullyUsed;
                        }).map((voucher: any) => (
                          <div
                            key={voucher.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-primary text-white font-mono text-lg">
                                    {voucher.code}
                                  </Badge>
                                  <Badge variant="default">Active</Badge>
                                </div>
                                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                                  ${parseFloat(voucher.amount).toFixed(2)}
                                </div>
                                {voucher.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {voucher.description}
                                  </p>
                                )}
                                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                  <div>
                                    Redemptions: {voucher.currentRedemptions}
                                    {voucher.maxRedemptions ? ` / ${voucher.maxRedemptions}` : " / Unlimited"}
                                  </div>
                                  {voucher.expiresAt && (
                                    <div>
                                      Expires: {new Date(voucher.expiresAt).toLocaleDateString()}
                                    </div>
                                  )}
                                  <div>
                                    Created: {new Date(voucher.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const confirmed = await confirm({
                                    title: 'Delete Voucher',
                                    description: `Are you sure you want to delete voucher ${voucher.code}?`,
                                    confirmText: 'OK',
                                    cancelText: 'Cancel'
                                  });
                                  if (confirmed) {
                                    deleteVoucherMutation.mutate(voucher.id);
                                  }
                                }}
                                disabled={deleteVoucherMutation.isPending}
                                data-testid={`button-delete-voucher-${voucher.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-primary-600" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="expired">
                    <div className="space-y-3">
                      {vouchersData.filter((v: any) => v.expiresAt && new Date(v.expiresAt) < new Date()).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No expired vouchers</div>
                      ) : (
                        vouchersData.filter((v: any) => v.expiresAt && new Date(v.expiresAt) < new Date()).map((voucher: any) => (
                          <div
                            key={voucher.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 opacity-75"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-primary text-white font-mono text-lg">
                                    {voucher.code}
                                  </Badge>
                                  <Badge variant="destructive">Expired</Badge>
                                </div>
                                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                                  ${parseFloat(voucher.amount).toFixed(2)}
                                </div>
                                {voucher.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {voucher.description}
                                  </p>
                                )}
                                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                  <div>
                                    Redemptions: {voucher.currentRedemptions}
                                    {voucher.maxRedemptions ? ` / ${voucher.maxRedemptions}` : " / Unlimited"}
                                  </div>
                                  <div>
                                    Expired: {new Date(voucher.expiresAt).toLocaleDateString()}
                                  </div>
                                  <div>
                                    Created: {new Date(voucher.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const confirmed = await confirm({
                                    title: 'Delete Voucher',
                                    description: `Are you sure you want to delete voucher ${voucher.code}?`,
                                    confirmText: 'OK',
                                    cancelText: 'Cancel'
                                  });
                                  if (confirmed) {
                                    deleteVoucherMutation.mutate(voucher.id);
                                  }
                                }}
                                disabled={deleteVoucherMutation.isPending}
                                data-testid={`button-delete-voucher-${voucher.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-primary-600" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="used">
                    <div className="space-y-3">
                      {vouchersData.filter((v: any) => v.maxRedemptions && v.currentRedemptions >= v.maxRedemptions).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No fully used vouchers</div>
                      ) : (
                        vouchersData.filter((v: any) => v.maxRedemptions && v.currentRedemptions >= v.maxRedemptions).map((voucher: any) => (
                          <div
                            key={voucher.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 opacity-75"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-primary text-white font-mono text-lg">
                                    {voucher.code}
                                  </Badge>
                                  <Badge variant="secondary">Fully Used</Badge>
                                </div>
                                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                                  ${parseFloat(voucher.amount).toFixed(2)}
                                </div>
                                {voucher.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {voucher.description}
                                  </p>
                                )}
                                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                  <div>
                                    Redemptions: {voucher.currentRedemptions} / {voucher.maxRedemptions}
                                  </div>
                                  {voucher.expiresAt && (
                                    <div>
                                      Expires: {new Date(voucher.expiresAt).toLocaleDateString()}
                                    </div>
                                  )}
                                  <div>
                                    Created: {new Date(voucher.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const confirmed = await confirm({
                                    title: 'Delete Voucher',
                                    description: `Are you sure you want to delete voucher ${voucher.code}?`,
                                    confirmText: 'OK',
                                    cancelText: 'Cancel'
                                  });
                                  if (confirmed) {
                                    deleteVoucherMutation.mutate(voucher.id);
                                  }
                                }}
                                disabled={deleteVoucherMutation.isPending}
                                data-testid={`button-delete-voucher-${voucher.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-primary-600" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                          <TabsContent value="system-errors" className="space-y-6">
            <SystemErrorsPanel />
          </TabsContent>
        </Tabs>
              )}
            </Card>
          </TabsContent>

          {/* Advertisement Management */}
          <TabsContent value="ads" className="space-y-6">
            <AdsDashboard />
          </TabsContent>

          {/* Hero Section Management */}
          <TabsContent value="hero-sections" className="space-y-6">
            <HeroSectionManager />
          </TabsContent>


          <TabsContent value="settings" className="space-y-6">
            <Accordion type="multiple" className="space-y-4">
              {/* Admin Profile Settings Section */}
              <AccordionItem value="profile-settings" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline py-4" transition-all duration-300>
                  <div className="flex items-center gap-3 text-left">
                    <User className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-base">Admin Profile Settings</div>
                      <p className="text-sm text-muted-foreground font-normal">
                        Customize your admin profile information and avatar
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <AdminProfileSettings />
                </AccordionContent>
              </AccordionItem>

              {/* Management Sections - Only visible to admin */}
              {userRole === 'admin' && (
                <>
                  {/* API Keys Section */}
                  <AccordionItem value="api-keys" className="border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4" transition-all duration-300>
                      <div className="flex items-center gap-3 text-left">
                        <Key className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-base">API Keys</div>
                          <p className="text-sm text-muted-foreground font-normal">
                            Manage API keys and system configurations
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <ApiKeysSection />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Payment Gateway Configuration Section */}
                  <AccordionItem value="payment-gateways" className="border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4" transition-all duration-300>
                      <div className="flex items-center gap-3 text-left">
                        <CreditCard className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-base">Payment Gateway Configuration</div>
                          <p className="text-sm text-muted-foreground font-normal">
                            Configure payment gateways and processing
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <PaymentGatewaysSection />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Theme & Branding Section */}
                  <AccordionItem value="theme-branding" className="border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4" transition-all duration-300>
                      <div className="flex items-center gap-3 text-left">
                        <Palette className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-base">Theme & Branding</div>
                          <p className="text-sm text-muted-foreground font-normal">
                            Customize colors, fonts, and visual appearance
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <ThemeBrandingSection />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Social Media Section */}
                  <AccordionItem value="social-media" className="border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4" transition-all duration-300>
                      <div className="flex items-center gap-3 text-left">
                        <Share2 className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-base">Social Media</div>
                          <p className="text-sm text-muted-foreground font-normal">
                            Configure social media links and integrations
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <SocialMediaSection />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Default Freelancer Cover Section */}
                  <AccordionItem value="default-cover" className="border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4" transition-all duration-300>
                      <div className="flex items-center gap-3 text-left">
                        <ImageIcon className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-base">Default Freelancer Cover</div>
                          <p className="text-sm text-muted-foreground font-normal">
                            Upload default cover image for freelancer profiles
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <DefaultCoverSection />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Logo Management Section */}
                  <AccordionItem value="logo-management" className="border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4" transition-all duration-300>
                      <div className="flex items-center gap-3 text-left">
                        <Settings className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-base">Logo Management</div>
                          <p className="text-sm text-muted-foreground font-normal">
                            Upload and manage custom logos for home, student, and teacher sections
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <MultiLogoManagement />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Coupon Management Section */}
                  <AccordionItem value="coupon-management" className="border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4" transition-all duration-300>
                      <div className="flex items-center gap-3 text-left">
                        <Star className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-base">Coupon Management</div>
                          <p className="text-sm text-muted-foreground font-normal">
                            Create and manage discount coupons for your shop
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <CouponManagement />
                    </AccordionContent>
                  </AccordionItem>

                  {/* App Downloads Section */}
                  <AccordionItem value="app-downloads" className="border rounded-lg px-6">
                    <AccordionTrigger className="hover:no-underline py-4" transition-all duration-300>
                      <div className="flex items-center gap-3 text-left">
                        <Download className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-base">App Downloads</div>
                          <p className="text-sm text-muted-foreground font-normal">
                            Manage mobile app download links for App Store and Google Play
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <AppDownloadsManagement />
                    </AccordionContent>
                  </AccordionItem>
                </>
              )}
            </Accordion>
          </TabsContent>

          {/* Products Management */}

          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col gap-6">
              {/* Header Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{allProducts.length}</div>
                    <p className="text-xs text-muted-foreground">All submitted products</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                    <Clock className="h-4 w-4" style={{ color: '#0C332C' }} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" style={{ color: '#0C332C' }}>
                      {allProducts.filter(p => p.status === 'pending').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Awaiting review</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {allProducts.filter(p => p.status === 'approved').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Live products</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                    <XCircle className="h-4 w-4 text-primary-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary-600">
                      {allProducts.filter(p => p.status === 'rejected').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Declined products</p>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Product Creation */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Plus className="h-5 w-5" />
                        Admin Product Creation
                      </CardTitle>
                      
                    </div>
                    <Button
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('product-creation', 'slide-left');
                        } else {
                          // Fallback for direct URL navigation
                          const url = new URL(window.location.href);
                          url.searchParams.set('page', 'product-creation');
                          window.location.href = url.toString();
                        }
                      }}
                      className="bg-primary hover:bg-primary text-white" transition-all duration-300
                      data-testid="admin-create-product-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Product
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Products Management Tabs */}
              <Tabs defaultValue="pending" className="w-full">
                <div className="sticky top-0 z-10 bg-background -mx-4 px-4 mb-4">
                  <ScrollArea className="w-full">
                    <div className="min-w-max">
                      <TabsList className="flex w-max justify-start gap-1 h-auto p-1">
                        <TabsTrigger value="pending" data-testid="tab-pending-products" className="px-2 md:px-4 py-2 text-xs shrink-0">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          <span className="whitespace-nowrap">Pending ({allProducts.filter(p => p.status === 'pending').length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="approved" data-testid="tab-approved-products" className="px-2 md:px-4 py-2 text-xs shrink-0">
                          <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          <span className="whitespace-nowrap">Approved ({allProducts.filter(p => p.status === 'approved').length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="rejected" data-testid="tab-rejected-products" className="px-2 md:px-4 py-2 text-xs shrink-0">
                          <XCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          <span className="whitespace-nowrap">Rejected ({allProducts.filter(p => p.status === 'rejected').length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="all" data-testid="tab-all-products" className="px-2 md:px-4 py-2 text-xs shrink-0">
                          <Package className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          <span className="whitespace-nowrap">All ({allProducts.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="categories" data-testid="tab-categories" className="px-2 md:px-4 py-2 text-xs shrink-0">
                          <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          <span className="whitespace-nowrap">Categories</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </ScrollArea>
                </div>

                {/* Pending Products Tab */}
                <TabsContent value="pending">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base" style={{ color: '#0C332C' }}>Pending Products - Require Your Approval</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Review and approve or reject products submitted by freelancers and teachers
                      </p>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[600px]">
                        <div className="p-4 space-y-4">
                          {productsLoading ? (
                            <div className="text-center py-8">Loading products...</div>
                          ) : allProducts.filter(p => p.status === 'pending').length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                              <h3 className="text-lg font-medium">All caught up!</h3>
                              <p>No products pending approval.</p>
                            </div>
                          ) : (
                            allProducts.filter(p => p.status === 'pending').map((product) => (
                              <ProductApprovalCard 
                                key={product.id}
                                product={product}
                                onApprove={(id) => updateProductStatusMutation.mutate({ productId: id, status: 'approved' })}
                                onReject={(id, reason) => updateProductStatusMutation.mutate({ productId: id, status: 'rejected', rejectionReason: reason })}
                                loading={updateProductStatusMutation.isPending}
                              />
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Other tabs for approved, rejected, and all products */}
                <TabsContent value="approved">
                  <ProductsList products={allProducts.filter(p => p.status === 'approved')} status="approved" />
                </TabsContent>
                
                <TabsContent value="rejected">
                  <ProductsList products={allProducts.filter(p => p.status === 'rejected')} status="rejected" />
                </TabsContent>
                
                <TabsContent value="all">
                  <ProductsList products={allProducts} status="all" />
                </TabsContent>
                
                <TabsContent value="categories">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Shop Category Management
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Manage product categories with custom images and styling for the shop page
                      </p>
                    </CardHeader>
                    <CardContent className="p-6">
                      <CategoryManagement embedded={true} />
                    </CardContent>
                  </Card>
                </TabsContent>
                        <TabsContent value="system-errors" className="space-y-6">
            <SystemErrorsPanel />
          </TabsContent>
        </Tabs>
            </div>

          </TabsContent>

          {/* Support Tickets Management */}
          <TabsContent value="support-tickets" className="space-y-6">
            <div className="flex flex-col gap-6">
              {/* Header Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{supportTickets.length}</div>
                    <p className="text-xs text-muted-foreground">All support tickets</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-800" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-800">
                      {supportTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Awaiting response</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Responded</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-blue-800" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-800">
                      {supportTickets.filter((t: any) => t.status === 'responded').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Admin replied</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    <CheckCircle2 className="h-4 w-4" style={{ color: '#0C332C' }} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" style={{ color: '#0C332C' }}>
                      {supportTickets.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Completed tickets</p>
                  </CardContent>
                </Card>
              </div>

              {/* Support Tickets List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Support Tickets
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    View and respond to customer support tickets. Replies will be sent via email.
                  </p>
                  
                  {/* Search/Filter Input */}
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search tickets by subject, message, customer, email, or ID..."
                      value={ticketSearchQuery}
                      onChange={(e) => setTicketSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-ticket-search"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <div className="p-4 space-y-4">
                      {ticketsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-muted-foreground">Loading support tickets...</p>
                        </div>
                      ) : filteredTickets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <h3 className="text-lg font-medium">
                            {ticketSearchQuery ? 'No Matching Tickets' : 'No Support Tickets'}
                          </h3>
                          <p>{ticketSearchQuery ? 'Try a different search term' : 'No tickets have been submitted yet.'}</p>
                        </div>
                      ) : (
                        filteredTickets.map((ticket: any) => (
                          <Card key={ticket.id} className="border-2" data-testid={`ticket-card-${ticket.id}`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                                    <Badge 
                                      variant={
                                        ticket.status === 'open' ? 'default' :
                                        ticket.status === 'in_progress' ? 'secondary' :
                                        ticket.status === 'responded' ? 'outline' :
                                        'default'
                                      }
                                      className={
                                        ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                                        ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        ticket.status === 'responded' ? 'bg-green-100 text-green-800 border-green-300' :
                                        ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                        ''
                                      }
                                      data-testid={`ticket-status-${ticket.id}`}
                                    >
                                      {ticket.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                    <Badge 
                                      variant="outline"
                                      className={
                                        ticket.priority === 'urgent' ? 'border-primary text-primary-700' :
                                        ticket.priority === 'high' ? 'border-orange-500 text-orange-700' :
                                        ticket.priority === 'medium' ? 'border-yellow-500 text-yellow-700' :
                                        'border-gray-500 text-gray-700'
                                      }
                                    >
                                      {ticket.priority?.toUpperCase() || 'MEDIUM'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Ticket ID: {ticket.id.substring(0, 8)} • 
                                    Customer: {ticket.customerName || 'Unknown'} ({ticket.customerEmail || 'N/A'}) • 
                                    {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <h4 className="text-sm font-medium mb-1">Customer Message:</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded-md">{ticket.message}</p>
                              </div>

                              {ticket.adminReply && (
                                <div className="border-t pt-3">
                                  <h4 className="text-sm font-medium mb-1">
                                    Admin Response 
                                    {ticket.adminName && <span className="font-normal text-muted-foreground"> by {ticket.adminName}</span>}
                                    {ticket.adminEmail && <span className="font-normal text-muted-foreground"> ({ticket.adminEmail})</span>}
                                  </h4>
                                  <p className="text-sm bg-blue-50 p-3 rounded-md">{ticket.adminReply}</p>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2 flex-wrap">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="default"
                                      size="sm"
                                      className="bg-primary hover:bg-primary text-white" transition-all duration-300
                                      data-testid={`button-reply-${ticket.id}`}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-2 text-white" />
                                      {ticket.adminReply ? 'Update Reply' : 'Reply to Ticket'}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent 
                                    className="max-w-2xl" 
                                    data-testid={`dialog-reply-${ticket.id}`}
                                    key={`${ticket.id}-${adminProfile?.name || ''}-${adminProfile?.email || ''}`}
                                  >
                                    <DialogHeader>
                                      <DialogTitle>Reply to Support Ticket</DialogTitle>
                                      <DialogDescription>
                                        Your reply will be sent to the customer via email
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor={`admin-name-${ticket.id}`}>Your Name *</Label>
                                        <Input
                                          id={`admin-name-${ticket.id}`}
                                          placeholder="Enter your name"
                                          defaultValue={adminProfile?.name || 'Support Team'}
                                          data-testid={`input-admin-name-${ticket.id}`}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor={`admin-email-${ticket.id}`}>Your Email *</Label>
                                        <Input
                                          id={`admin-email-${ticket.id}`}
                                          type="email"
                                          placeholder="Enter your email"
                                          defaultValue={adminProfile?.email || user?.email || 'support@edufiliova.com'}
                                          data-testid={`input-admin-email-${ticket.id}`}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="reply-message">Reply Message *</Label>
                                        <Textarea
                                          id="reply-message"
                                          rows={6}
                                          placeholder="Type your reply here..."
                                          defaultValue={ticket.adminReply || ''}
                                          data-testid={`textarea-reply-${ticket.id}`}
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      {replyFormError && (
                                        <p className="text-sm text-primary-600 mb-2">{replyFormError}</p>
                                      )}
                                      <AjaxButton
                                        operation={activeTicketId === ticket.id ? ticketAjaxOperation : 'idle'}
                                        onClick={(e) => {
                                          const dialog = e.currentTarget.closest('[role="dialog"]');
                                          const adminName = (dialog?.querySelector(`#admin-name-${ticket.id}`) as HTMLInputElement)?.value;
                                          const adminEmail = (dialog?.querySelector(`#admin-email-${ticket.id}`) as HTMLInputElement)?.value;
                                          const reply = (dialog?.querySelector('#reply-message') as HTMLTextAreaElement)?.value;
                                          
                                          if (!adminName || !adminEmail || !reply) {
                                            setReplyFormError('Please fill in all fields');
                                            return;
                                          }

                                          setReplyFormError('');
                                          replyToTicketMutation.mutate({
                                            ticketId: ticket.id,
                                            reply,
                                            adminName,
                                            adminEmail
                                          });
                                          
                                          // Close dialog after success
                                          setTimeout(() => {
                                            const closeButton = dialog?.querySelector('[data-dialog-close]') as HTMLButtonElement;
                                            closeButton?.click();
                                          }, 2000);
                                        }}
                                        disabled={replyToTicketMutation.isPending}
                                        data-testid={`button-send-reply-${ticket.id}`}
                                        loadingText="Sending reply..."
                                        successText="Reply sent!"
                                        errorText="Failed to send"
                                      >
                                        Send Reply
                                      </AjaxButton>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                
                                {/* Close/Resolve Ticket Button */}
                                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                  <AjaxButton
                                    operation={activeTicketId === ticket.id ? ticketAjaxOperation : 'idle'}
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5" transition-all duration-300
                                    onClick={() => {
                                      setTicketToResolve(ticket);
                                      setResolveDialogOpen(true);
                                    }}
                                    disabled={closeTicketMutation.isPending}
                                    data-testid={`button-close-${ticket.id}`}
                                    loadingText="Resolving..."
                                    successText="Resolved!"
                                    errorText="Failed"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-white" />
                                    Mark as Resolved
                                  </AjaxButton>
                                )}

                                {/* Delete Ticket Button (Admin Only) */}
                                <AjaxButton
                                  operation={activeTicketId === ticket.id ? ticketAjaxOperation : 'idle'}
                                  variant="destructive"
                                  className="bg-primary hover:bg-primary/700 text-white text-sm px-3 py-1.5" transition-all duration-300
                                  onClick={() => {
                                    setTicketToDelete(ticket);
                                    setDeleteDialogOpen(true);
                                  }}
                                  disabled={deleteTicketMutation.isPending}
                                  data-testid={`button-delete-${ticket.id}`}
                                  loadingText="Deleting..."
                                  successText="Deleted!"
                                  errorText="Failed"
                                >
                                  <Trash2 className="h-4 w-4 mr-2 text-white" />
                                  Delete
                                </AjaxButton>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Resolve Ticket Confirmation Dialog */}
              <AlertDialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                <AlertDialogContent data-testid="dialog-resolve-confirmation">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark Ticket as Resolved</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to mark ticket "{ticketToResolve?.subject}" as resolved? The customer will be notified.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      disabled={ticketAjaxOperation === 'updating'}
                      data-testid="button-cancel-resolve"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AjaxButton
                      operation={ticketAjaxOperation}
                      onClick={() => {
                        if (ticketToResolve) {
                          closeTicketMutation.mutate(ticketToResolve.id);
                        }
                      }}
                      disabled={closeTicketMutation.isPending}
                      className="bg-green-600 hover:bg-green-700" transition-all duration-300
                      data-testid="button-confirm-resolve"
                      loadingText="Resolving ticket..."
                      successText="Resolved!"
                      errorText="Failed to resolve"
                    >
                      Mark as Resolved
                    </AjaxButton>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Delete Ticket Confirmation Dialog */}
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent data-testid="dialog-delete-confirmation">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Support Ticket</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete ticket "{ticketToDelete?.subject}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      disabled={ticketAjaxOperation === 'deleting'}
                      data-testid="button-cancel-delete"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AjaxButton
                      operation={ticketAjaxOperation}
                      onClick={() => {
                        if (ticketToDelete) {
                          deleteTicketMutation.mutate(ticketToDelete.id);
                        }
                      }}
                      disabled={deleteTicketMutation.isPending}
                      variant="destructive"
                      data-testid="button-confirm-delete"
                      loadingText="Deleting ticket..."
                      successText="Deleted!"
                      errorText="Failed to delete"
                    >
                      Delete Ticket
                    </AjaxButton>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          {/* Pages Management */}

          {/* Admin Messaging - Full Screen */}
          <TabsContent value="messaging" className="h-full">
            <div className="h-full">
              <MessagingInterface 
                userRole="admin" 
                onChatModeChange={(isInChat) => {
                  if (!isInChat) {
                    // Quick return to dashboard tab without page reload
                    setSelectedTab("dashboard");
                  }
                }}
              />
            </div>
          </TabsContent>

          {/* Group Management */}
          <TabsContent value="groups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Group Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Approve or reject pending study groups. Only approved groups are visible to users.
                </p>
              </CardHeader>
              <CardContent>
                <GroupApproval />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Community Management */}
          <TabsContent value="community" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage and moderate the community posts, discussions, and interactions. As an admin, you can delete any post.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <CommunityChat />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help Chat Management */}
          <TabsContent value="help-chat" className="space-y-6">
            <AdminHelpChatManager />
          </TabsContent>

          {/* Support Profiles Management */}
          <TabsContent value="support-profiles" className="space-y-6">
            <SupportProfilesManagement />
          </TabsContent>

          {/* Assignment Mode Settings */}
          <TabsContent value="assignment-mode" className="space-y-6">
            <AssignmentModeSettings />
          </TabsContent>

          {/* Quick Responses Management */}
          <TabsContent value="quick-responses" className="space-y-6">
            <QuickResponsesManagement />
          </TabsContent>

          {/* Announcements Management */}
          <TabsContent value="announcements" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Announcements Management</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Create and manage system announcements for students and teachers. Target specific audiences and grades.
                    </p>
                  </div>
                  <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => {
                          setEditingAnnouncement(null);
                          setAnnouncementTitle('');
                          setAnnouncementContent('');
                          setTargetAudience('all');
                          setTargetGrade(null);
                          setPriority('normal');
                        }}
                        data-testid="create-announcement-button"
                      >
                        <Megaphone className="h-4 w-4 mr-2" />
                        Create Announcement
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Title *</label>
                          <Input
                            value={announcementTitle}
                            onChange={(e) => setAnnouncementTitle(e.target.value)}
                            placeholder="Announcement title..."
                            data-testid="announcement-title-input"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Content *</label>
                          <Textarea
                            value={announcementContent}
                            onChange={(e) => setAnnouncementContent(e.target.value)}
                            placeholder="Write your announcement content here..."
                            rows={4}
                            data-testid="announcement-content-input"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Target Audience</label>
                            <Select value={targetAudience} onValueChange={setTargetAudience}>
                              <SelectTrigger data-testid="target-audience-select">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="grade_specific">Specific Grade</SelectItem>
                                <SelectItem value="students">All Students</SelectItem>
                                <SelectItem value="teachers">All Teachers</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={priority} onValueChange={setPriority}>
                              <SelectTrigger data-testid="priority-select">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {targetAudience === 'grade_specific' && (
                          <div>
                            <label className="text-sm font-medium">Target Grade</label>
                            <Select 
                              value={targetGrade?.toString() || ''} 
                              onValueChange={(value) => setTargetGrade(value ? parseInt(value) : null)}
                            >
                              <SelectTrigger data-testid="target-grade-select">
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                                  <SelectItem key={grade} value={grade.toString()}>
                                    Grade {grade}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAnnouncementDialog(false)}
                            data-testid="cancel-announcement-button"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              const announcementData = {
                                title: announcementTitle,
                                content: announcementContent,
                                targetAudience,
                                targetGrade: targetAudience === 'grade_specific' ? (targetGrade || undefined) : undefined,
                                priority
                              };
                              
                              if (editingAnnouncement) {
                                updateAnnouncementMutation.mutate({
                                  ...announcementData,
                                  id: editingAnnouncement.id
                                });
                              } else {
                                createAnnouncementMutation.mutate(announcementData);
                              }
                            }}
                            disabled={!announcementTitle || !announcementContent || createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                            data-testid="save-announcement-button"
                          >
                            {(createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending) 
                              ? 'Saving...' 
                              : (editingAnnouncement ? 'Update' : 'Create')
                            }
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {announcementsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading announcements...</div>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-8">
                    <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-lg font-medium">No announcements yet</h3>
                    <p className="text-muted-foreground">Create your first announcement to get started.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {announcements.map((announcement: any) => (
                        <div key={announcement.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{announcement.title}</h4>
                                <Badge 
                                  variant={announcement.priority === 'urgent' ? 'destructive' : 
                                          announcement.priority === 'high' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {announcement.priority}
                                </Badge>
                                {!announcement.isActive && (
                                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {announcement.content}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Audience: {announcement.targetAudience}</span>
                                {announcement.targetGrade && (
                                  <span>Grade: {announcement.targetGrade}</span>
                                )}
                                <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingAnnouncement(announcement);
                                  setAnnouncementTitle(announcement.title);
                                  setAnnouncementContent(announcement.content);
                                  setTargetAudience(announcement.targetAudience);
                                  setTargetGrade(announcement.targetGrade);
                                  setPriority(announcement.priority);
                                  setShowAnnouncementDialog(true);
                                }}
                                data-testid={`edit-announcement-${announcement.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                                disabled={deleteAnnouncementMutation.isPending}
                                data-testid={`delete-announcement-${announcement.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

                  <TabsContent value="system-errors" className="space-y-6">
            <SystemErrorsPanel />
          </TabsContent>
        </Tabs>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter user name"
                  data-testid="edit-name-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter email"
                  type="email"
                  data-testid="edit-email-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Age</label>
                  <Input
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    placeholder="Enter age"
                    type="number"
                    data-testid="edit-age-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Grade</label>
                  <Input
                    value={editForm.grade}
                    onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                    placeholder="Enter grade"
                    type="number"
                    data-testid="edit-grade-input"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <Select value={editForm.country} onValueChange={(value) => setEditForm({ ...editForm, country: value })}>
                  <SelectTrigger data-testid="edit-country-select">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                    <SelectItem value="Italy">Italy</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="China">China</SelectItem>
                    <SelectItem value="Japan">Japan</SelectItem>
                    <SelectItem value="Brazil">Brazil</SelectItem>
                    <SelectItem value="Mexico">Mexico</SelectItem>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                    <SelectItem value="Sweden">Sweden</SelectItem>
                    <SelectItem value="Norway">Norway</SelectItem>
                    <SelectItem value="Denmark">Denmark</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger data-testid="edit-role-select">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student (General User)</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Verification Badge</label>
                <Select value={editForm.verificationBadge} onValueChange={(value) => setEditForm({ ...editForm, verificationBadge: value })}>
                  <SelectTrigger data-testid="edit-verification-select">
                    <SelectValue placeholder="Select verification badge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="green">Green Badge (Verified)</SelectItem>
                    <SelectItem value="blue">Blue Badge (Premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="edit-cancel-button">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedUser) {
                      editUserMutation.mutate({
                        userId: selectedUser.userId,
                        name: editForm.name,
                        email: editForm.email,
                        age: parseInt(editForm.age),
                        grade: parseInt(editForm.grade),
                        country: editForm.country,
                        role: editForm.role,
                        verificationBadge: editForm.verificationBadge
                      });
                    }
                  }}
                  disabled={editUserMutation.isPending}
                  data-testid="edit-save-button"
                >
                  {editUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to delete this user? This action cannot be undone.</p>
              {selectedUser && (
                <div className="p-4 bg-muted rounded-lg">
                  <p><strong>Name:</strong> {selectedUser.name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)} data-testid="delete-cancel-button">
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (selectedUser) {
                      deleteUserMutation.mutate(selectedUser.userId);
                    }
                  }}
                  disabled={deleteUserMutation.isPending}
                  data-testid="delete-confirm-button"
                >
                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ban/Unban User Dialog */}
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage User Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Change the status of this user:</p>
              {selectedUser && (
                <div className="p-4 bg-muted rounded-lg">
                  <p><strong>Name:</strong> {selectedUser.name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Current Status:</strong> {getStatusBadge(selectedUser.status)}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBanDialog(false)} data-testid="ban-cancel-button">
                  Cancel
                </Button>
                <Button 
                  variant="outline"
                  className="text-green-600 border-green-300"
                  onClick={() => {
                    if (selectedUser) {
                      banUserMutation.mutate({ userId: selectedUser.userId, status: 'active' });
                    }
                  }}
                  disabled={banUserMutation.isPending}
                  data-testid="unban-user-button"
                >
                  Activate User
                </Button>
                <Button 
                  variant="outline"
                  className="text-primary border-orange-300"
                  onClick={() => {
                    if (selectedUser) {
                      banUserMutation.mutate({ userId: selectedUser.userId, status: 'suspended' });
                    }
                  }}
                  disabled={banUserMutation.isPending}
                  data-testid="suspend-user-button"
                >
                  Suspend User
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (selectedUser) {
                      banUserMutation.mutate({ userId: selectedUser.userId, status: 'banned' });
                    }
                  }}
                  disabled={banUserMutation.isPending}
                  data-testid="ban-user-button"
                >
                  {banUserMutation.isPending ? 'Updating...' : 'Ban User'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Manual Plan Assignment Dialog */}
        <ManualPlanAssignmentDialog
          open={showManualPlanDialog}
          onOpenChange={setShowManualPlanDialog}
        />
      </div>
    </div>
  );
}
