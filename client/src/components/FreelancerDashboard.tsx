import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { openExternalUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  User,
  Menu,
  X,
  MessageSquare, 
  Send, 
  Plus,
  GraduationCap,
  Clock,
  MessageCircle,
  Megaphone,
  AlertCircle,
  XCircle,
  Home,
  Calendar,
  BookOpen,
  TrendingUp,
  Award,
  FileText,
  Settings,
  Bell,
  Download,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Star,
  Eye,
  Heart,
  Target,
  BookMarked,
  ClipboardList,
  DollarSign,
  CreditCard,
  Banknote,
  Upload,
  Camera,
  Loader2,
  Info,
  LogOut,
  Briefcase,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Package,
  HelpCircle,
  Edit,
  ShoppingBag,
  Wallet,
  Receipt,
  Globe,
  Phone,
  Mail,
  BarChart3,
  AtSign,
  Reply,
  LayoutGrid,
  Gift
} from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
// Format number with K, M, B suffixes
const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

// PayPal logo component
const PayPalLogo = () => (
  <svg className="w-4 h-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#03a9f4" d="M36.817,14.654c0.464-2.956-0.003-4.967-1.602-6.789C33.455,5.859,30.275,5,26.206,5H14.396
        c-0.831,0-1.539,0.605-1.669,1.426L7.809,37.612c-0.097,0.615,0.379,1.172,1.001,1.172h7.291l-0.503,3.191
        C15.513,42.513,15.929,43,16.474,43h6.146c0.728,0,1.347-0.529,1.46-1.248l0.06-0.312l1.158-7.342l0.075-0.406
        c0.113-0.719,0.733-1.248,1.46-1.248h0.919c5.954,0,10.616-2.419,11.978-9.415c0.569-2.923,0.275-5.363-1.23-7.078
        C38.044,15.433,37.478,15.004,36.817,14.654"></path>
    <path fill="#3949ab" d="M36.817,14.654c0.464-2.956-0.003-4.967-1.602-6.789C33.455,5.859,30.275,5,26.206,5H14.396
        c-0.831,0-1.539,0.605-1.669,1.426L7.809,37.612c-0.097,0.615,0.379,1.172,1.001,1.172h7.291l1.832-11.614l-0.057,0.364
        c0.13-0.821,0.832-1.427,1.663-1.427h3.466c6.806,0,12.135-2.765,13.692-10.761C36.743,15.109,36.782,14.88,36.817,14.654"></path>
    <path fill="#1a237e" d="M17.898,27.534c0.13-0.821,0.832-1.427,1.663-1.427h3.466c11.878,0,13.184-8.52,13.813-11.453
        c-0.393-0.208-2.227-1.209-6.199-1.209h-9.258c-0.227,0-1.173,0.105-1.46,1.248L17.898,27.534z"></path>
  </svg>
);
import { FaExclamationTriangle, FaCheckCircle, FaGlobe } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ProfileSettingsForm } from './ProfileSettingsForm';
import { EnhancedProfileSetup } from './EnhancedProfileSetup';
import { MessagingInterface } from './MessagingInterface';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import Logo from '@/components/Logo';
import { BannerAdDisplay } from '@/components/BannerAdDisplay';
import { SponsoredListingDisplay } from '@/components/SponsoredListingDisplay';
import { ProductManager } from './ProductManager';

import { PortfolioManager } from './PortfolioManager';
import { WalletPage } from './wallet/WalletPage';
import type { ShopPurchase } from '@shared/schema';
import BillingPage from '@/components/BillingPage';
import MyAdsPage from '@/pages/MyAdsPage';
import { CoursesSection } from '@/pages/StudentDashboard';
import CourseDetail from '@/pages/CourseDetail';
import CoursePlayer from '@/pages/CoursePlayer';
import FreelancerPricingPlans from '@/components/FreelancerPricingPlans';
import CourseCreator from '@/pages/CourseCreator';
import PurchasesPage from './PurchasesPage';
import MyAds from '@/components/MyAds';
import { FindTalent } from '@/pages/FindTalent';
import { PortfolioGallery } from '@/pages/PortfolioGallery';
import FreelancerProfile from '@/pages/FreelancerProfile';
import  PortfolioPreview from '@/pages/PortfolioPreview';
import { FreelancerProfileDialog } from './FreelancerProfileDialog';
import ReceiptsSection from '@/components/ReceiptsSection';
import BuyVoucherSection from '@/components/BuyVoucherSection';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  clientId: string;
  clientName?: string;
  budget: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  progressPercentage?: number;
  milestones: ProjectMilestone[];
}

interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  amount: number;
  order: number;
  createdAt: string;
}

interface FreelancerStats {
  activeProjects: number;
  completedProjects: number;
  totalEarnings: number;
  pendingPayments: number;
  averageRating: number;
  totalReviews: number;
}

interface CreatorBalance {
  creatorId: string;
  availableBalance: string;
  pendingBalance: string;
  lifetimeEarnings: string;
  totalWithdrawn: string;
  nextPayoutDate: string;
}

interface CreatorEarningEvent {
  id: string;
  eventType: string;
  sourceType: string;
  grossAmount: string;
  platformCommission: string;
  creatorAmount: string;
  status: string;
  metadata: any;
  eventDate: string;
}

interface ProductDownloadStats {
  productId: string;
  productName: string;
  totalDownloads: number;
  freeDownloads: number;
  paidDownloads: number;
  subscriptionDownloads: number;
  lastMilestoneCount: number;
}

interface FreelancerEarnings {
  availableBalance: string;
  totalEarnings: string;
  totalWithdrawn: string;
  pendingPayouts: string;
  lastUpdated: string;
}

interface FreelancerTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  method?: 'bank' | 'paypal';
  description: string;
  createdAt: string;
  processedAt?: string;
}

interface PayoutAccount {
  id: string;
  type: 'bank' | 'paypal';
  accountName: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
  details?: any;
}

interface Bank {
  id: string;
  bankName: string;
  bankCode: string;
  swiftCode: string;
}

interface UserLocation {
  country: string;
  countryName: string;
}

interface Country {
  countryCode: string;
  countryName: string;
  bankCount: number;
}

// Enhanced PaymentMethodsCard Component with Facebook-like behavior
function PaymentMethodsCard({ user }: { user: any }) {
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PayoutAccount | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showUpdateWarning, setShowUpdateWarning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // Facebook-like transition state
  const [selectedType, setSelectedType] = useState<'bank' | 'paypal'>('paypal');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [formData, setFormData] = useState({
    accountName: '',
    // PayPal fields
    paypalEmail: '',
    // Bank fields
    accountHolderName: '',
    bankName: '',
    selectedBankId: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    country: 'US',
    swiftCode: ''
  });

  const [editFormData, setEditFormData] = useState({
    accountName: '',
    // PayPal fields
    paypalEmail: '',
    // Bank fields
    accountHolderName: '',
    bankName: '',
    selectedBankId: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    country: 'US',
    swiftCode: ''
  });

  // Fetch countries
  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const response = await fetch('/api/countries/with-banks');
      const data = await response.json();
      
      if (data.success) {
        setCountries(data.countries || []);
      } else {
        setCountries([]);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  // Fetch user location
  const fetchUserLocation = async () => {
    try {
      const response = await fetch('/api/user/location');
      const data = await response.json();
      
      if (data.success) {
        setUserLocation(data);
        setFormData(prev => ({ ...prev, country: data.country }));
        // Fetch banks for detected country
        fetchBanksByCountry(data.country);
      }
    } catch (error) {
      console.error('Error fetching user location:', error);
    }
  };

  // Fetch banks by country
  const fetchBanksByCountry = async (countryCode: string) => {
    if (!countryCode) return;
    
    try {
      setLoadingBanks(true);
      const response = await fetch(`/api/banks/${countryCode}`);
      const data = await response.json();
      
      if (data.success) {
        setBanks(data.banks || []);
      } else {
        setBanks([]);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      setBanks([]);
    } finally {
      setLoadingBanks(false);
    }
  };

  // Handle bank selection
  const handleBankSelect = (bankId: string) => {
    const selectedBank = banks.find(bank => bank.id === bankId);
    if (selectedBank) {
      setFormData(prev => ({
        ...prev,
        selectedBankId: bankId,
        bankName: selectedBank.bankName,
        routingNumber: selectedBank.bankCode || '',
        swiftCode: selectedBank.swiftCode || ''
      }));
    }
  };

  // Handle country change
  const handleCountryChange = (countryCode: string) => {
    setFormData(prev => ({ 
      ...prev, 
      country: countryCode,
      selectedBankId: '',
      bankName: '',
      routingNumber: '',
      swiftCode: ''
    }));
    
    // If Other is selected, switch to PayPal and don't fetch banks
    if (countryCode === 'OTHER') {
      setSelectedType('paypal');
      setBanks([]);
    } else {
      fetchBanksByCountry(countryCode);
    }
  };

  // Fetch user notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/notifications/${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch payout accounts with Facebook-like transitions
  const fetchPayoutAccounts = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/payout-accounts/${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setPayoutAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching payout accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Facebook-like account switching animation
  const handleShowAddForm = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowAddForm(true);
      setIsTransitioning(false);
    }, 300); // Smooth transition like Facebook
  };

  const handleHideAddForm = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowAddForm(false);
      setIsTransitioning(false);
    }, 300);
  };

  // Add new payout account with enhanced feedback
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Check account limits - only 1 account allowed
    if (payoutAccounts.length >= 1) {
      console.warn('Only 1 payment account allowed at a time.');
      return;
    }

    try {
      setLoading(true);
      setSubmitting(true);
      
      const accountDetails = selectedType === 'paypal' 
        ? { paypalEmail: formData.paypalEmail }
        : {
            accountHolderName: formData.accountHolderName,
            bankName: formData.bankName,
            routingNumber: formData.routingNumber,
            accountNumber: formData.accountNumber,
            accountType: formData.accountType,
            country: formData.country,
            swiftCode: formData.swiftCode
          };

      const response = await fetch('/api/payout-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: selectedType,
          accountName: formData.accountName,
          details: accountDetails
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Reset form
        setFormData({
          accountName: '', paypalEmail: '', accountHolderName: '',
          bankName: '', selectedBankId: '', routingNumber: '', accountNumber: '', 
          accountType: 'checking', country: 'US', swiftCode: ''
        });
        
        
        handleHideAddForm();
        fetchPayoutAccounts(); // Refresh the list
        fetchNotifications(); // Check for any new notifications
      } else {
        console.error('Error adding payment method:', result.error);
      }
    } catch (error) {
      console.error('Error adding payout account:', error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Set default account
  const handleSetDefault = async (accountId: string) => {
    try {
      const response = await fetch(`/api/payout-accounts/${accountId}/set-default`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        fetchPayoutAccounts(); // Refresh to show updated default
      }
    } catch (error) {
      console.error('Error setting default account:', error);
    }
  };

  // Delete account with 5-day restriction
  const handleDeleteAccount = async (accountId: string) => {
    const account = payoutAccounts.find(acc => acc.id === accountId);
    if (!account) return;

    // Check if account is older than 5 days
    const createdDate = new Date(account.createdAt);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    
    if (createdDate > fiveDaysAgo) {
      const daysLeft = Math.ceil((createdDate.getTime() + 5 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000));
      console.log(`Account can only be deleted after 5 days of creation. ${daysLeft} more day${daysLeft > 1 ? 's' : ''} remaining.`);
      return;
    }
    
    if (!confirm('Are you sure you want to delete this payment account?')) return;
    
    try {
      const response = await fetch(`/api/payout-accounts/${accountId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchPayoutAccounts(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  // Edit account functionality
  const handleEditAccount = (account: PayoutAccount) => {
    setEditingAccount(account);
    setShowUpdateWarning(true); // Show warning first
    setShowAddForm(false);
  };

  const handleConfirmEdit = () => {
    if (!editingAccount) return;
    
    setShowUpdateWarning(false);
    setShowEditForm(true);
    
    // Pre-populate edit form with account data
    if (editingAccount.type === 'paypal') {
      setEditFormData({
        accountName: editingAccount.accountName,
        paypalEmail: editingAccount.details?.paypalEmail || '',
        accountHolderName: '',
        bankName: '',
        selectedBankId: '',
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking',
        country: 'US',
        swiftCode: ''
      });
      setSelectedType('paypal');
    } else {
      setEditFormData({
        accountName: editingAccount.accountName,
        paypalEmail: '',
        accountHolderName: editingAccount.details?.accountHolderName || '',
        bankName: editingAccount.details?.bankName || '',
        selectedBankId: '',
        routingNumber: editingAccount.details?.routingNumber || '',
        accountNumber: editingAccount.details?.accountNumber || '',
        accountType: editingAccount.details?.accountType || 'checking',
        country: editingAccount.details?.country || 'US',
        swiftCode: editingAccount.details?.swiftCode || ''
      });
      setSelectedType('bank');
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !editingAccount) return;

    try {
      setSubmitting(true);
      
      const accountDetails = selectedType === 'paypal' 
        ? { paypalEmail: editFormData.paypalEmail }
        : {
            accountHolderName: editFormData.accountHolderName,
            bankName: editFormData.bankName,
            routingNumber: editFormData.routingNumber,
            accountNumber: editFormData.accountNumber,
            accountType: editFormData.accountType,
            country: editFormData.country,
            swiftCode: editFormData.swiftCode
          };

      const response = await fetch(`/api/payout-accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: editFormData.accountName,
          details: accountDetails
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Payment method updated successfully!');
        handleHideEditForm();
        fetchPayoutAccounts(); // Refresh the list
      } else {
        console.error('Error updating payment method:', result.error);
      }
    } catch (error) {
      console.error('Error updating payout account:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHideEditForm = () => {
    setShowEditForm(false);
    setEditingAccount(null);
    setShowDeleteConfirmation(false);
    setShowUpdateWarning(false);
    setEditFormData({
      accountName: '', paypalEmail: '', accountHolderName: '',
      bankName: '', selectedBankId: '', routingNumber: '', accountNumber: '', 
      accountType: 'checking', country: 'US', swiftCode: ''
    });
  };

  const handleDeleteClick = () => {
    if (!editingAccount) return;
    
    // Check if account is older than 5 days
    const createdDate = new Date(editingAccount.createdAt);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    
    if (createdDate > fiveDaysAgo) {
      const daysLeft = Math.ceil((createdDate.getTime() + 5 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000));
      console.log(`Account can only be deleted after 5 days of creation. ${daysLeft} more day${daysLeft > 1 ? 's' : ''} remaining.`);
      return;
    }
    
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingAccount) return;
    
    try {
      setSubmitting(true);
      const response = await fetch(`/api/payout-accounts/${editingAccount.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('Payment method deleted successfully!');
        handleHideEditForm();
        fetchPayoutAccounts(); // Refresh the list
      } else {
        console.error('Error deleting payment method.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    fetchPayoutAccounts();
    fetchCountries(); // Fetch all available countries
    fetchUserLocation(); // Auto-detect user location on component mount
    fetchNotifications(); // Fetch any decline notifications
  }, [user?.id]);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-gray-600" />
            Payment & Payout Settings
          </CardTitle>
          {notifications.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-white border-gray-300 hover:opacity-80 hover:shadow-lg hover:scale-105 w-full sm:w-auto sm:ml-auto" transition-all duration-300 style={{backgroundColor: '#0C332C'}}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              {notifications.length} Alert{notifications.length > 1 ? 's' : ''}
            </Button>
          )}
        </div>
        <CardDescription className="text-sm">
          Manage your PayPal and bank accounts for receiving payments
        </CardDescription>
        
        {/* Notifications Panel - Facebook-like */}
        {showNotifications && notifications.length > 0 && (
          <div className="mt-4 p-4 bg-primary/10 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Payment Method Alerts
            </h4>
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div key={notification.id || index} className="text-sm text-primary bg-white p-3 rounded border">
                  <div className="font-medium">{notification.reason}</div>
                  <div className="text-primary mt-1">
                    {notification.details?.message || 'Please review and try again.'}
                  </div>
                  <div className="text-xs text-primary mt-2">
                    {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Accounts - Facebook-like hiding when switching */}
        {payoutAccounts.length > 0 && (
          <div className={`space-y-4 transition-all duration-300 ${showAddForm || isTransitioning ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h4 className="font-medium text-base">Your Payment Account</h4>
            </div>
            {payoutAccounts.map((account) => (
              <div key={account.id} className="border rounded-lg p-4 transition-all duration-200 hover:shadow-md" transition-all duration-300>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Account Icon and Info */}
                  <div className="flex items-center gap-3 flex-1">
                    {account.type === 'paypal' ? (
                      <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0 border border-gray-200">
                        <PayPalLogo />
                      </div>
                    ) : (
                      <CreditCard className="w-10 h-10 text-gray-700 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <p className="font-medium text-base truncate">{account.accountName}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {account.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                          {account.isVerified ? (
                            <Badge variant="default" className="text-xs text-white flex items-center gap-1" style={{ backgroundColor: '#0C332C' }}>
                              <CheckmarkIcon size="sm" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-primary">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending Verification
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground capitalize">
                          {account.type.charAt(0).toUpperCase() + account.type.slice(1)} Account
                        </p>
                        {account.type === 'bank' && account.details?.accountNumber && (
                          <p className="text-xs text-gray-500">
                            ••••••••{account.details.accountNumber.slice(-4)}
                          </p>
                        )}
                        {account.type === 'paypal' && account.details?.paypalEmail && (
                          <p className="text-xs text-gray-500">
                            {account.details.paypalEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit Icon */}
                  <div 
                    className="flex items-center gap-1 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors duration-200" transition-all duration-300
                    onClick={() => handleEditAccount(account)}
                    data-testid={`button-edit-${account.id}`}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="text-sm">Edit</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Account Button - when no accounts exist */}
        {payoutAccounts.length === 0 && !showAddForm && (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-medium mb-2">No Payment Methods Added</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add a payment method to receive your earnings
            </p>
            <Button onClick={handleShowAddForm} className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Payment Method
            </Button>
          </div>
        )}

        {/* Add New Account Form - Facebook-like overlay */}
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-blue-50/50 border-blue-200 transition-all duration-300">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-blue-800">Add New Payment Method</h4>
              <Button size="sm" onClick={handleHideAddForm} className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}>
                Cancel
              </Button>
            </div>


            <form onSubmit={handleAddAccount} className="space-y-4">
              {/* Account Type Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Account Type</label>
                <Select 
                  value={selectedType} 
                  onValueChange={(value: 'paypal' | 'bank') => setSelectedType(value)}
                  disabled={formData.country === 'OTHER'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-white rounded flex items-center justify-center border">
                          <PayPalLogo />
                        </div>
                        PayPal
                      </div>
                    </SelectItem>
                    <SelectItem value="bank" disabled={formData.country === 'OTHER'}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-700" />
                        Bank Account
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formData.country === 'OTHER' && (
                  <p className="text-xs text-blue-600 mt-2">
                    <FaGlobe className="inline mr-1" /> For your region, we support PayPal payments
                  </p>
                )}
              </div>

              {/* Account Name */}
              <div>
                <label className="text-sm font-medium mb-1 block">Account Name</label>
                <Input
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder={`My ${selectedType} account`}
                  required
                />
              </div>

              {/* PayPal Form */}
              {selectedType === 'paypal' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">PayPal Email</label>
                  <Input
                    type="email"
                    value={formData.paypalEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, paypalEmail: e.target.value }))}
                    placeholder="your@paypal.com"
                    required
                  />
                </div>
              )}


              {/* Bank Form */}
              {selectedType === 'bank' && (
                <div className="space-y-4">
                  {/* Country Selection */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Country</label>
                    <Select 
                      value={formData.country} 
                      onValueChange={handleCountryChange}
                      disabled={loadingCountries}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCountries ? (
                          <SelectItem value="loading" disabled>Loading countries...</SelectItem>
                        ) : (
                          <>
                            {userLocation && (
                              <SelectItem value={userLocation.country}>
                                🌍 {userLocation.countryName} (Detected)
                              </SelectItem>
                            )}
                            {countries.map(country => (
                              <SelectItem key={country.countryCode} value={country.countryCode}>
                                {country.countryName} ({country.bankCount} banks)
                              </SelectItem>
                            ))}
                            <SelectItem value="OTHER">Other (PayPal only)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bank Selection */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Bank</label>
                    <Select 
                      value={formData.selectedBankId} 
                      onValueChange={handleBankSelect}
                      disabled={loadingBanks || !formData.country || formData.country === 'OTHER'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingBanks ? "Loading banks..." : "Select your bank"} />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map(bank => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.bankName} ({bank.bankCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Account Holder Name</label>
                    <Input
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                      placeholder="Full name as it appears on your account"
                      required
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Account Number</label>
                    <Input
                      value={formData.accountNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="Your account number"
                      required
                    />
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Account Type</label>
                    <Select value={formData.accountType} onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking Account</SelectItem>
                        <SelectItem value="savings">Savings Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Routing Number - Auto-filled */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Routing Number / Bank Code</label>
                    <Input
                      value={formData.routingNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, routingNumber: e.target.value }))}
                      placeholder="Bank routing number"
                      required
                    />
                  </div>

                  {/* SWIFT Code - Auto-filled for international */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">SWIFT Code (International)</label>
                    <Input
                      value={formData.swiftCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, swiftCode: e.target.value }))}
                      placeholder="SWIFT/BIC code for international transfers"
                    />
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full text-white hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Account...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </>
                )}
              </Button>
              
              {/* Payout Policy Link - Small text under button */}
              <div className="text-center">
                <span className="text-xs text-gray-600">Read Our Payout Policy </span>
                <button 
                  type="button" 
                  onClick={() => window.open(window.location.origin + '?page=payout-policy', '_blank')}
                  className="text-xs text-blue-600 hover:text-blue-800 underline font-medium" transition-all duration-300
                >
                  View Policy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Facebook-Style Edit Warning - Show this independently */}
        {showUpdateWarning && editingAccount && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-800">Edit Payment Method</h4>
                <p className="text-sm text-blue-700">
                  Changes to your payment method may take up to 5 business days to process. During this time, payouts may be delayed. Are you sure you want to edit "{editingAccount?.accountName}"?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowUpdateWarning(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50" transition-all duration-300
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmEdit}
                className="flex-1 text-white hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}
                disabled={submitting}
              >
                Continue to Edit
              </Button>
            </div>
          </div>
        )}

        {/* Edit Account Form - Facebook-like overlay */}
        {showEditForm && editingAccount && (
          <div className="border rounded-lg p-4 space-y-4 bg-blue-50/50 border-blue-200 transition-all duration-300">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-blue-800">Edit Payment Method</h4>
              <Button size="sm" onClick={handleHideEditForm} className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}>
                Cancel
              </Button>
            </div>

            <form onSubmit={handleUpdateAccount} className="space-y-4">
              {/* Account Name */}
              <div>
                <label className="text-sm font-medium mb-1 block">Account Name</label>
                <Input
                  value={editFormData.accountName}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder={`My ${selectedType} account`}
                  required
                />
              </div>

              {/* PayPal Form */}
              {selectedType === 'paypal' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">PayPal Email</label>
                  <Input
                    type="email"
                    value={editFormData.paypalEmail}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, paypalEmail: e.target.value }))}
                    placeholder="your@paypal.com"
                    required
                  />
                </div>
              )}

              {/* Bank Form */}
              {selectedType === 'bank' && (
                <div className="space-y-4">
                  {/* Account Holder Name */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Account Holder Name</label>
                    <Input
                      value={editFormData.accountHolderName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                      placeholder="Full name as it appears on your account"
                      required
                    />
                  </div>

                  {/* Bank Name */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Bank Name</label>
                    <Input
                      value={editFormData.bankName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="Bank name"
                      required
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Account Number</label>
                    <Input
                      value={editFormData.accountNumber}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="Your account number"
                      required
                    />
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Account Type</label>
                    <Select value={editFormData.accountType} onValueChange={(value) => setEditFormData(prev => ({ ...prev, accountType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking Account</SelectItem>
                        <SelectItem value="savings">Savings Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Routing Number */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Routing Number / Bank Code</label>
                    <Input
                      value={editFormData.routingNumber}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, routingNumber: e.target.value }))}
                      placeholder="Bank routing number"
                      required
                    />
                  </div>

                  {/* SWIFT Code */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">SWIFT Code (International)</label>
                    <Input
                      value={editFormData.swiftCode}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, swiftCode: e.target.value }))}
                      placeholder="SWIFT/BIC code for international transfers"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  disabled={submitting || showDeleteConfirmation || showUpdateWarning}
                  onClick={handleDeleteClick}
                  className="text-primary border-red-300 hover:bg-primary/10 flex-1" transition-all duration-300
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <></>
                  )}
                  Delete Account
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || showUpdateWarning}
                  className="text-white hover:opacity-80 hover:shadow-lg hover:scale-105 flex-1" transition-all duration-300 style={{backgroundColor: '#0C332C'}}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Account...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Payment Method
                    </>
                  )}
                </Button>
              </div>

              {/* Inline Delete Confirmation */}
              {showDeleteConfirmation && (
                <div className="border border-red-200 bg-primary/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-red-800">Confirm Deletion</h4>
                      <p className="text-sm text-primary">
                        Are you sure you want to delete "{editingAccount?.accountName}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowDeleteConfirmation(false)}
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50" transition-all duration-300
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleConfirmDelete}
                      className="flex-1 bg-primary hover:bg-red-700 text-white" transition-all duration-300
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Yes, Delete'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FreelancerDashboardProps {
  onNavigate?: (page: string, transition?: string, data?: any) => void;
  initialTab?: string;
}

export function FreelancerDashboard({ onNavigate, initialTab }: FreelancerDashboardProps) {
  const { user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'shop' | 'courses' | 'course-detail' | 'course-player' | 'marketplace' | 'portfolio-gallery' | 'portfolio-preview' | 'freelancer-profile' | 'create-course' | 'messages' | 'payments' | 'settings' | 'purchases' | 'wallet' | 'billing' | 'create-ad' | 'pricing-plans' | 'receipts' | 'buy-voucher'>(initialTab as any || 'overview');
  const [showMobileMenu, setShowMobileMenu] = useState(() => {
    // Open sidebar by default on desktop (lg breakpoint is 1024px)
    return typeof window !== 'undefined' && window.innerWidth >= 1024;
  });
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Collapsible nav section states
  const [moneyOpen, setMoneyOpen] = useState(true);
  const [storeOpen, setStoreOpen] = useState(true);
  const [marketplaceOpen, setMarketplaceOpen] = useState(true);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | null>(null);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [portfolioPreviewData, setPortfolioPreviewData] = useState<any>(null);
  const [earningsPage, setEarningsPage] = useState(0);

  // Handle cover image change with cache invalidation
  const handleCoverImageChange = async (url: string | null) => {
    setCoverImageUrl(url);
    // Invalidate profile query to refresh data across the dashboard
    queryClient.invalidateQueries({ queryKey: ['/api/me/profile', user?.id] });
  };

  // Project creation form schema
  const projectSchema = z.object({
    title: z.string().min(1, 'Project title is required'),
    description: z.string().min(1, 'Project description is required'),
    budget: z.number().min(0.01, 'Budget must be greater than 0'),
    deadline: z.string().min(1, 'Deadline is required')
  });

  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      budget: 0,
      deadline: ''
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof projectSchema>) => {
      return apiRequest('/api/freelancer/projects', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/projects/my'] });
      setShowCreateProject(false);
      projectForm.reset();
      // Show success message would be nice here
    },
    onError: (error: any) => {
      console.error('Failed to create project:', error);
      // Show error message would be nice here
    }
  });

  const handleCreateProject = (data: z.infer<typeof projectSchema>) => {
    createProjectMutation.mutate(data);
  };

  // Handle freelancer plan selection and checkout
  const handlePlanSelect = async (planId: string, billingPeriod: 'monthly' | 'yearly' | 'lifetime') => {
    if (!user) {
      console.error('Authentication required');
      return;
    }

    try {
      // Fetch plan details to get the price
      const plansResponse = await apiRequest('/api/freelancer-pricing-plans');
      const plans = plansResponse.data || plansResponse;
      const selectedPlan = plans.find((p: any) => p.planId === planId);
      
      if (!selectedPlan) {
        throw new Error("Plan not found");
      }

      // Calculate price based on billing period
      let amount = 0;
      let planName = selectedPlan.name;
      
      if (billingPeriod === 'lifetime' && selectedPlan.lifetimePrice) {
        amount = parseFloat(selectedPlan.lifetimePrice);
        planName = `${selectedPlan.name} (Lifetime)`;
      } else if (billingPeriod === 'yearly' && selectedPlan.yearlyPrice) {
        amount = parseFloat(selectedPlan.yearlyPrice);
        planName = `${selectedPlan.name} (Yearly)`;
      } else if (billingPeriod === 'monthly' && selectedPlan.monthlyPrice) {
        amount = parseFloat(selectedPlan.monthlyPrice);
        planName = `${selectedPlan.name} (Monthly)`;
      }

      // Validate amount
      if (!amount || amount <= 0) {
        throw new Error("Invalid plan configuration. Please contact support.");
      }

      // Create payment intent
      const response = await apiRequest('/api/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          planName,
          billingCycle: billingPeriod,
          userId: user.id,
          subscriptionTier: planId,
          planId,
          planType: 'freelancer'
        })
      });

      if (!response.success || !response.clientSecret) {
        throw new Error(response.error || "Failed to create payment intent");
      }

      // Navigate to checkout page with data in URL params
      const checkoutUrl = new URL(window.location.href);
      checkoutUrl.searchParams.set('page', 'freelancer-checkout');
      checkoutUrl.searchParams.set('clientSecret', response.clientSecret);
      checkoutUrl.searchParams.set('amount', amount.toString());
      checkoutUrl.searchParams.set('planName', planName);
      checkoutUrl.searchParams.set('planId', planId);
      checkoutUrl.searchParams.set('billingCycle', billingPeriod);
      window.history.pushState({}, '', checkoutUrl.toString());
      
      if (onNavigate) {
        onNavigate('freelancer-checkout', 'fade');
      }

    } catch (error: any) {
      console.error('Payment setup error:', error);
    }
  };

  // Course navigation handler - intercepts course navigation to stay in dashboard
  const handleCourseNavigation = (target: string, transition?: string, data?: any) => {
    if (target.startsWith('course-detail-')) {
      const courseId = target.replace('course-detail-', '');
      setSelectedCourseId(courseId);
      setActiveTab('course-detail');
    } else if (target.startsWith('course-player-')) {
      const courseId = target.replace('course-player-', '');
      setSelectedCourseId(courseId);
      setActiveTab('course-player');
    } else if (target.startsWith('course/')) {
      const courseId = target.replace('course/', '');
      setSelectedCourseId(courseId);
      setActiveTab('course-detail');
    } else if (target === 'courses') {
      setActiveTab('courses');
    } else if (target === 'freelancer-profile') {
      // Get freelancer ID from sessionStorage (set by FindTalent)
      const freelancerId = sessionStorage.getItem('selectedFreelancerId');
      if (freelancerId) {
        setSelectedFreelancerId(freelancerId);
        setActiveTab('freelancer-profile');
      }
    } else if (target === 'portfolio-preview') {
      // Handle portfolio preview navigation - stay within dashboard
      if (data?.workId) {
        setSelectedWorkId(data.workId);
        setPortfolioPreviewData(data);
        setActiveTab('portfolio-preview');
      }
    } else if (target === 'back') {
      // Handle back navigation - return to portfolio tab and clear preview
      setActiveTab('portfolio');
      setSelectedWorkId(null);
      setPortfolioPreviewData(null);
    } else if (target === 'portfolio-gallery' || target === 'marketplace') {
      // Navigate back to gallery or marketplace
      setActiveTab(target as any);
      setSelectedWorkId(null);
      setPortfolioPreviewData(null);
    } else {
      // For any other navigation, use parent onNavigate if available
      onNavigate?.(target, transition, data);
    }
  };

  // Back handler from course views
  const handleBackFromCourse = () => {
    setSelectedCourseId(null);
    setActiveTab('courses');
  };

  // Fetch user profile with approval status - no polling to avoid loading states
  const { data: userProfile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ['/api/me/profile', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Fetch freelancer portfolio works (real data)
  const { data: portfolioWorks = [], isLoading: portfolioLoading } = useQuery<any[]>({
    queryKey: ['/api/portfolio/my/works'],
    enabled: !!user,
  });

  // Fetch freelancer earnings from creator-payouts API (commission-based)
  const { data: creatorBalanceData, isLoading: earningsLoading } = useQuery({
    queryKey: ['/api/creator-payouts/balance'],
    enabled: !!user
  });
  
  console.log('💰 Creator Balance Data:', creatorBalanceData);

  // Get freelancer download stats for products
  const { data: downloadStatsData, isLoading: downloadStatsLoading } = useQuery({
    queryKey: ['/api/products/my/download-stats'],
    enabled: !!user
  });

  // Get payout accounts for freelancer
  const { data: payoutAccountsData } = useQuery({
    queryKey: [`/api/payout-accounts/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch freelancer stats with real data
  const { data: freelancerStats, isLoading: statsLoading, error: statsError } = useQuery<{ averageRating?: number; totalReviews?: number }>({
    queryKey: ['/api/freelancer/stats'],
    enabled: !!user,
  });

  // Fetch profile stats for views and likes
  const { data: profileStats, isLoading: profileStatsLoading } = useQuery<{ views: number; likes: number; followers: number }>({
    queryKey: ['/api/freelancers/stats', user?.id],
    queryFn: async () => {
      const response = await apiRequest(`/api/freelancers/${user?.id}/stats`);
      return response.data || response;
    },
    enabled: !!user?.id,
  });

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading, error: notificationsError } = useQuery<any[]>({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user,
  });

  // Fetch user balance and earnings
  const { data: balance, isLoading: balanceLoading, error: balanceError } = useQuery<{ totalEarnings?: number; pendingPayouts?: number }>({
    queryKey: ['/api/transactions/balance', user?.id],
    queryFn: () => apiRequest(`/api/transactions/balance/${user?.id}`),
    enabled: !!user?.id,
  });

  // Fetch manual plan assignments (active only)
  const { data: manualPlanData } = useQuery<{ success: boolean; assignments: any[] }>({
    queryKey: ['/api/manual-plan-assignments/user', user?.id],
    queryFn: async () => {
      const response = await apiRequest(`/api/manual-plan-assignments/user/${user?.id}`);
      return response;
    },
    enabled: !!user?.id,
  });

  const activeManualPlan = manualPlanData?.assignments?.find((a: any) => a.isActive);

  // Check if freelancer needs approval
  const needsApproval = userProfile?.role === 'freelancer' && userProfile?.approvalStatus !== 'approved';
  const isRejected = userProfile?.approvalStatus === 'rejected';
  const isPending = userProfile?.approvalStatus === 'pending';

  // If freelancer is pending approval, show review message (only on first load, not during polling)

  if (needsApproval) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="lg" type="freelancer" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Hello, {userProfile?.name || user?.email}</span>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsLoggingOut(true);
                  setTimeout(async () => {
                    await logout();
                    onNavigate?.('home', 'fade');
                  }, 3000);
                }}
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
        </header>

        {/* Main Content */}
        <div className="flex items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-fit">
                {isPending && <Timer className="h-8 w-8 text-white" />}
                {isRejected && <XCircle className="h-8 w-8 text-white" />}
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {isPending && "Application Under Review"}
                {isRejected && "Application Update"}
              </CardTitle>
              <CardDescription className="text-gray-600 px-4">
                {isPending && "We are reviewing your freelancer details. You'll receive an email notification once the review is complete."}
                {isRejected && "Your freelancer application has been reviewed. Please check your email for details."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <Badge 
                    variant={isPending ? "default" : "destructive"} 
                    className={cn(
                      isPending && "bg-blue-100 text-blue-800 border-blue-200",
                      isRejected && "bg-primary/15 text-red-800 border-red-200"
                    )}
                    data-testid="badge-approval-status"
                  >
                    {isPending && "Under Review"}
                    {isRejected && "Needs Revision"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Submitted</span>
                  <span className="text-sm text-gray-600">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>

                {isRejected && userProfile?.rejectionReason && (
                  <div className="p-3 bg-primary/10 border border-red-200 rounded-lg text-left">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Feedback:</h4>
                    <p className="text-sm text-primary">{userProfile.rejectionReason}</p>
                  </div>
                )}

                {isPending && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm text-blue-800 font-medium mb-1">What happens next?</p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• Our team will review your profile and experience</li>
                          <li>• You'll receive an email with the decision</li>
                          <li>• This page will automatically update when approved</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button variant="outline" onClick={() => window.location.reload()} className="w-full" data-testid="button-refresh">
                    <Timer className="h-4 w-4 mr-2" />
                    Check Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate stats from real data
  const stats: FreelancerStats = {
    activeProjects: portfolioWorks.filter((w) => w.status === 'published').length,
    completedProjects: portfolioWorks.length, // Total portfolio works count
    totalEarnings: balance?.totalEarnings || 0,
    pendingPayments: balance?.pendingPayouts || 0,
    averageRating: freelancerStats?.averageRating || 0,
    totalReviews: freelancerStats?.totalReviews || 0
  };

  // No need for sidebarItems array - will use individual buttons like TeacherDashboard

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-primary/15 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar - Always visible */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40 pt-safe">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="text-gray-500 hover:text-gray-700" transition-all duration-300
                  data-testid="button-toggle-menu"
                >
                  {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                <Logo size="md" variant="dark" type="freelancer" onClick={() => onNavigate?.('home')} className="cursor-pointer" />
              </div>
              <div className="flex items-center space-x-4">
                <FreelancerProfileDialog
                  profile={profile}
                  userProfile={userProfile}
                  profileStats={profileStats}
                  onLogout={() => {
                    setIsLoggingOut(true);
                    setTimeout(async () => {
                      await logout();
                      onNavigate?.('home', 'fade');
                    }, 3000);
                  }}
                  onStatisticsClick={() => setActiveTab('overview')}
                >
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity" transition-all duration-300 data-testid="button-profile-dropdown">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.displayName || 'Freelancer'} />
                      <AvatarFallback>
                        {profile?.displayName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'FL'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-900 hidden sm:block">
                        {profile?.displayName || profile?.name || 'Freelancer'}
                      </span>
                      {userProfile?.verificationBadge && userProfile.verificationBadge !== 'none' && (
                        <span title={userProfile.verificationBadge === 'blue' ? "Verified Professional" : "Premium Member"}>
                          {userProfile.verificationBadge === 'blue' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-4 w-4">
                              <g clipPath="url(#clip0_badge_blue)">
                                <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                              </g>
                              <defs>
                                <clipPath id="clip0_badge_blue">
                                  <rect width="24" height="24" fill="#fff" />
                                </clipPath>
                              </defs>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-4 w-4">
                              <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                    </div>
                  </button>
                </FreelancerProfileDialog>
              </div>
            </div>
          </div>
      </nav>

      {/* Left Sidebar - Collapsible on both mobile and desktop */}
      <aside
        className={`${
          showMobileMenu ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:top-16`}
      >
        <div className="flex flex-col h-full lg:h-[calc(100vh-4rem)]">
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-20 lg:pt-5 pb-4">
            {/* My Business Section */}
            <button
              onClick={() => { setActiveTab("overview"); setShowMobileMenu(false); }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "overview"
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="nav-overview"
            >
              <Home className="h-5 w-5 mr-3" />
              Overview
            </button>
            
            <button
              onClick={() => { setActiveTab("portfolio"); setShowMobileMenu(false); }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "portfolio"
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="nav-portfolio"
            >
              <Briefcase className="h-5 w-5 mr-3" />
              Portfolio
            </button>
            
            <button
              onClick={() => { setActiveTab("shop"); setShowMobileMenu(false); }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "shop"
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="nav-shop"
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              Shop
            </button>
            
            <button
              onClick={() => { setActiveTab("courses"); setShowMobileMenu(false); }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "courses"
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="nav-courses"
            >
              <BookOpen className="h-5 w-5 mr-3" />
              Courses
            </button>
            
            <button
              onClick={() => { setActiveTab("create-course"); setShowMobileMenu(false); }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "create-course"
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="nav-create-course"
            >
              <Plus className="h-5 w-5 mr-3" />
              Create Course
            </button>
            
            {/* Messages Section */}
            <div className="pt-3 pb-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider px-4">Messages</p>
            </div>
            
            <button
              onClick={() => { setActiveTab("messages"); setShowMobileMenu(false); }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "messages"
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="nav-messages"
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              Messages
            </button>
            
            {/* MONEY Section - Collapsible */}
            <div className="pt-3">
              <button
                onClick={() => setMoneyOpen(!moneyOpen)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors" transition-all duration-300
                data-testid="nav-money-toggle"
              >
                <span>Money</span>
                {moneyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {moneyOpen && (
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab("payments"); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "payments"
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="nav-payments"
                >
                  <DollarSign className="h-5 w-5 mr-3" />
                  Payments
                </button>
                
                <button
                  onClick={() => { setActiveTab("wallet"); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "wallet"
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="nav-wallet"
                >
                  <Wallet className="h-5 w-5 mr-3" />
                  Wallet
                </button>
                
                <button
                  onClick={() => { setActiveTab("receipts"); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "receipts"
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="nav-receipts"
                >
                  <Receipt className="h-5 w-5 mr-3" />
                  Receipts
                </button>
              </div>
            )}
            
            {/* STORE Section - Collapsible */}
            <div className="pt-3">
              <button
                onClick={() => setStoreOpen(!storeOpen)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors" transition-all duration-300
                data-testid="nav-store-toggle"
              >
                <span>Store</span>
                {storeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {storeOpen && (
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab("purchases"); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "purchases"
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="nav-purchases"
                >
                  <ShoppingBag className="h-5 w-5 mr-3" />
                  Purchases
                </button>
                
                <button
                  onClick={() => { setActiveTab("pricing-plans"); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "pricing-plans"
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="nav-pricing-plans"
                >
                  <Receipt className="h-5 w-5 mr-3" />
                  Pricing Plans
                </button>
                
                <button
                  onClick={() => { setActiveTab("billing"); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "billing"
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="nav-billing"
                >
                  <CreditCard className="h-5 w-5 mr-3" />
                  Billing
                </button>
                
                <button
                  onClick={() => { setActiveTab("buy-voucher"); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "buy-voucher"
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="nav-buy-voucher"
                >
                  <Gift className="h-5 w-5 mr-3" />
                  Buy Voucher
                </button>
              </div>
            )}
            
            {/* MARKETPLACE Section - Collapsible */}
            <div className="pt-3">
              <button
                onClick={() => setMarketplaceOpen(!marketplaceOpen)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors" transition-all duration-300
                data-testid="nav-marketplace-toggle"
              >
                <span>Marketplace</span>
                {marketplaceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {marketplaceOpen && (
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab("portfolio-gallery"); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "portfolio-gallery"
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="nav-portfolio-gallery"
                >
                  <LayoutGrid className="h-5 w-5 mr-3" />
                  Freelancer Works
                </button>
                
                <button
                  onClick={() => { setActiveTab("marketplace"); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "marketplace"
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="nav-marketplace"
                >
                  <Users className="h-5 w-5 mr-3" />
                  Find Freelancers
                </button>
                
                <button
                  onClick={() => { setActiveTab('create-ad'); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "create-ad"
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid="nav-advertise"
                >
                  <Megaphone className="h-5 w-5 mr-3" />
                  Create Ad
                </button>
              </div>
            )}
            
            {/* SETTINGS - Standalone at bottom */}
            <div className="pt-3">
              <button
                onClick={() => { setActiveTab("settings"); setShowMobileMenu(false); }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "settings"
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid="nav-settings"
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </button>
            </div>
          </nav>
          
          <div className="p-4 border-t border-gray-200 space-y-2 flex-shrink-0">
            <Button
              size="sm"
              className="w-full bg-primary hover:bg-primary text-white" transition-all duration-300
              onClick={() => { openExternalUrl('https://edufiliova.com'); setShowMobileMenu(false); }}
              data-testid="nav-explore-website"
            >
              <FaGlobe className="h-4 w-4 mr-2" />
              Explore Website
            </Button>
            <Button
              size="sm"
              className="w-full bg-[#151314] hover:bg-[#2a2826] text-white" transition-all duration-300
              onClick={() => {
                setIsLoggingOut(true);
                setShowMobileMenu(false);
                setTimeout(async () => {
                  await logout();
                  onNavigate?.('home', 'fade');
                }, 3000);
              }}
              disabled={isLoggingOut}
              data-testid="nav-logout"
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
      </aside>

      {/* Overlay for sidebar on desktop when portfolio-gallery, freelancer-profile, or portfolio-preview is active */}
      {(activeTab === 'portfolio-gallery' || activeTab === 'freelancer-profile' || activeTab === 'portfolio-preview') && showMobileMenu && (
        <div 
          className="hidden lg:block fixed inset-0 bg-black bg-opacity-50 z-20 top-16"
          onClick={() => setShowMobileMenu(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Main Content */}
      <div className="flex pt-16">
        <main className={`flex-1 ${showMobileMenu ? 'lg:ml-64' : 'lg:ml-0'} min-h-screen overflow-y-auto transition-all duration-300 bg-white`}>
          <div className={`${(activeTab === 'portfolio-gallery' || activeTab === 'freelancer-profile' || activeTab === 'portfolio-preview') ? 'p-0' : 'p-6 lg:p-8'}`}>
            {/* Dashboard Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Banner Advertisement */}
                <BannerAdDisplay placement="freelancer_dashboard" className="mb-6" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-bold text-gray-900 dark:text-white text-[18px] text-center">
                      Welcome back, {profile?.displayName}!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-center text-[14px]">
                      Here's your freelance business overview
                    </p>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Briefcase className="h-8 w-8 text-gray-700" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Portfolios</p>
                          <p className="text-2xl font-bold text-gray-900" data-testid="text-portfolios-count">
                            {portfolioLoading ? '...' : portfolioWorks.length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Heart className="h-8 w-8 text-gray-700" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Likes</p>
                          <p className="text-2xl font-bold text-gray-900" data-testid="text-likes-count">
                            {profileStatsLoading ? '...' : formatNumber(profileStats?.likes || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-gray-700" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Views</p>
                          <p className="text-2xl font-bold text-gray-900" data-testid="text-views-count">
                            {profileStatsLoading ? '...' : formatNumber(profileStats?.views || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-gray-700" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Followers</p>
                          <p className="text-2xl font-bold text-gray-900" data-testid="text-followers-count">
                            {profileStatsLoading ? '...' : formatNumber(profileStats?.followers || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-2 py-4 border-gray-300"
                        onClick={() => setActiveTab('portfolio')}
                        data-testid="button-quick-portfolio"
                      >
                        <Plus className="h-6 w-6 text-gray-700" />
                        <span className="text-xs font-medium text-gray-700">Add Portfolio</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-2 py-4 border-gray-300"
                        onClick={() => setActiveTab('shop')}
                        data-testid="button-quick-shop"
                      >
                        <Package className="h-6 w-6 text-gray-700" />
                        <span className="text-xs font-medium text-gray-700">Upload Product</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-2 py-4 border-gray-300"
                        onClick={() => setActiveTab('create-course')}
                        data-testid="button-quick-course"
                      >
                        <GraduationCap className="h-6 w-6 text-gray-700" />
                        <span className="text-xs font-medium text-gray-700">Create Course</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-2 py-4 border-gray-300"
                        onClick={() => setActiveTab('marketplace')}
                        data-testid="button-quick-marketplace"
                      >
                        <Users className="h-6 w-6 text-gray-700" />
                        <span className="text-xs font-medium text-gray-700">Browse Talent</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-2 py-4 border-gray-300"
                        onClick={() => setActiveTab('messages')}
                        data-testid="button-quick-messages"
                      >
                        <MessageSquare className="h-6 w-6 text-gray-700" />
                        <span className="text-xs font-medium text-gray-700">Messages</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-2 py-4 border-gray-300"
                        onClick={() => setActiveTab('payments')}
                        data-testid="button-quick-payments"
                      >
                        <DollarSign className="h-6 w-6 text-gray-700" />
                        <span className="text-xs font-medium text-gray-700">Payments</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications Feed */}
                <Card>
                  <CardHeader className="cursor-pointer" onClick={() => setNotificationsExpanded(!notificationsExpanded)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Recent Notifications
                          {!notificationsExpanded && notifications.filter((n: any) => !n.isRead).length > 0 && (
                            <Badge variant="default" className="ml-2 bg-gray-700">
                              {notifications.filter((n: any) => !n.isRead).length}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>Latest updates and alerts</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" data-testid="button-toggle-notifications">
                        {notificationsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>
                  </CardHeader>
                  {notificationsExpanded && (
                    <CardContent>
                      {notificationsError ? (
                        <div className="text-center py-8">
                          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load notifications</h3>
                          <p className="text-gray-500">Please try again later</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-8" data-testid="empty-notifications">
                          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                          <p className="text-gray-500">You're all caught up!</p>
                        </div>
                      ) : (
                        <div className="space-y-4" data-testid="notifications-list">
                          {notifications.map((notification: any) => {
                            // Determine icon and color based on notification type
                            const getNotificationIcon = () => {
                              const type = notification.type || notification.metadata?.type;
                              switch (type) {
                                case 'comment':
                                  return { icon: MessageCircle, bgColor: 'bg-gray-100', iconColor: 'text-gray-700' };
                                case 'reply':
                                  return { icon: Reply, bgColor: 'bg-gray-100', iconColor: 'text-gray-700' };
                                case 'mention':
                                  return { icon: AtSign, bgColor: 'bg-gray-100', iconColor: 'text-gray-700' };
                                case 'like':
                                  return { icon: Heart, bgColor: 'bg-gray-100', iconColor: 'text-gray-700' };
                                default:
                                  return { icon: Bell, bgColor: 'bg-gray-100', iconColor: 'text-gray-700' };
                              }
                            };

                            const { icon: NotificationIcon, bgColor, iconColor } = getNotificationIcon();

                            const handleNotificationClick = async () => {
                              if (notification.actionUrl) {
                                // Mark as read if not already read
                                if (!notification.isRead) {
                                  try {
                                    await apiRequest(`/api/notifications/${notification.id}/read`, {
                                      method: 'PUT'
                                    });
                                    // Invalidate notifications query to refresh
                                    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
                                  } catch (error) {
                                    console.error('Failed to mark notification as read:', error);
                                  }
                                }
                                
                                // Parse the action URL to extract workId and optional commentId
                                // Comment format: /portfolio/works/${workId}?comment=${commentId}
                                // Like format: /portfolio/works/${workId}
                                const commentMatch = notification.actionUrl.match(/\/portfolio\/works\/([^?]+)\?comment=([^&#]+)/);
                                const workMatch = notification.actionUrl.match(/\/portfolio\/works\/([^?]+)/);
                                
                                if (commentMatch && onNavigate) {
                                  const workId = commentMatch[1];
                                  const commentId = commentMatch[2];
                                  onNavigate('portfolio-preview', '', { workId, commentId });
                                } else if (workMatch && onNavigate) {
                                  const workId = workMatch[1];
                                  onNavigate('portfolio-preview', '', { workId });
                                } else {
                                  // Fallback for other notification types (admin alerts, etc.)
                                  window.location.href = notification.actionUrl;
                                }
                              }
                            };

                            return (
                              <div 
                                key={notification.id} 
                                className={cn(
                                  "flex items-start space-x-3 p-3 rounded-lg transition-colors",
                                  notification.actionUrl ? "cursor-pointer hover:bg-gray-100" : "hover:bg-gray-50",
                                  !notification.isRead && "bg-gray-50"
                                )}
                                onClick={handleNotificationClick}
                                data-testid={`notification-${notification.id}`}
                              >
                                <div className="flex-shrink-0">
                                  <div className={`p-2 ${bgColor} rounded-lg`}>
                                    <NotificationIcon className={`h-4 w-4 ${iconColor}`} />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-sm text-gray-900",
                                    !notification.isRead && "font-semibold"
                                  )} data-testid="text-notification-title">{notification.title}</p>
                                  <p className="text-sm text-gray-500" data-testid="text-notification-content">{notification.content || notification.message}</p>
                                  <p className="text-xs text-gray-400 mt-1" data-testid="text-notification-date">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-gray-700 rounded-full" data-testid="indicator-unread"></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

              </div>
            )}


            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <PortfolioManager onNavigate={(target: string, transition?: string, data?: any) => {
                // Intercept portfolio-preview and back to keep preview embedded
                if (target === 'portfolio-preview' || target === 'back') {
                  handleCourseNavigation(target, transition, data);
                } else {
                  // Let create/edit flow through to parent Index handler
                  onNavigate?.(target, transition, data);
                }
              }} />
            )}

            {/* Shop Tab */}
            {activeTab === 'shop' && (
              <div className="space-y-6">
                <ProductManager userRole="freelancer" />
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
                <CoursesSection profile={profile} onNavigate={handleCourseNavigation} />
              </div>
            )}

            {/* Course Detail View - Embedded */}
            {activeTab === 'course-detail' && selectedCourseId && (
              <CourseDetail 
                courseId={selectedCourseId}
                onNavigate={handleCourseNavigation}
                onBack={handleBackFromCourse}
                hideFooter={true}
              />
            )}

            {/* Course Player View - Embedded */}
            {activeTab === 'course-player' && selectedCourseId && (
              <CoursePlayer 
                courseId={selectedCourseId}
                onNavigate={handleCourseNavigation}
              />
            )}

            {/* Freelancer Marketplace - Embedded */}
            {activeTab === 'marketplace' && (
              <FindTalent onNavigate={handleCourseNavigation} context="dashboard" />
            )}

            {/* Portfolio Gallery - Browse Freelancer Works */}
            {activeTab === 'portfolio-gallery' && (
              <PortfolioGallery onNavigate={handleCourseNavigation} context="dashboard" />
            )}

            {/* Freelancer Profile - View Profile Within Dashboard */}
            {activeTab === 'freelancer-profile' && (
              selectedFreelancerId ? (
                <FreelancerProfile 
                  freelancerId={selectedFreelancerId}
                  onNavigate={(target: string) => {
                    if (target === 'back' || target === 'marketplace') {
                      setActiveTab('marketplace');
                      setSelectedFreelancerId(null);
                    } else {
                      handleCourseNavigation(target);
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Selected</h3>
                  <p className="text-gray-600 mb-4">Please select a freelancer from the marketplace to view their profile.</p>
                  <Button 
                    onClick={() => setActiveTab('marketplace')}
                    className="bg-primary hover:bg-primary text-white" transition-all duration-300
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Marketplace
                  </Button>
                </div>
              )
            )}

            {/* Portfolio Preview - View Work Within Dashboard */}
            {activeTab === 'portfolio-preview' && (
              selectedWorkId ? (
                <PortfolioPreview 
                  workId={selectedWorkId}
                  onNavigate={(target: string, transition?: string, data?: any) => {
                    if (target === 'back' || target === 'portfolio-gallery') {
                      setActiveTab('portfolio-gallery');
                      setSelectedWorkId(null);
                      setPortfolioPreviewData(null);
                    } else {
                      handleCourseNavigation(target, transition, data);
                    }
                  }}
                  commentId={portfolioPreviewData?.commentId}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <LayoutGrid className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Selected</h3>
                  <p className="text-gray-600 mb-4">Please select a portfolio work to view its details.</p>
                  <Button 
                    onClick={() => setActiveTab('portfolio-gallery')}
                    className="bg-primary hover:bg-primary text-white" transition-all duration-300
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Gallery
                  </Button>
                </div>
              )
            )}

            {/* Create Course Tab */}
            {activeTab === 'create-course' && (
              <div className="space-y-6">
                <CourseCreator onNavigate={(target) => {
                  if (target === 'back' || target === 'courses') {
                    setActiveTab('overview');
                  }
                }} />
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="h-[calc(100vh-140px)]">
                <MessagingInterface userRole="freelancer" />
              </div>
            )}

            

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    <h2 className="text-lg sm:text-xl font-semibold">Earnings & Payments</h2>
                  </div>
                </div>

                {/* Commission Info Banner */}
                <div className="bg-[#151314] border border-[#151314] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-white mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Commission Structure</p>
                      <p className="text-sm text-white mt-1">
                        You earn 65% from sales. Platform takes 35% commission. Earnings become available on the 5th of each month.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Earnings Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Available Balance */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow" transition-all duration-300>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                        <Banknote className="h-5 w-5 text-gray-900" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Available Balance</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1" data-testid="available-balance">
                        {earningsLoading ? '...' : `$${(creatorBalanceData as any)?.balance?.availableBalance || '0.00'}`}
                      </p>
                      <p className="text-xs text-gray-500">Ready to withdraw</p>
                    </div>
                  </div>

                  {/* Pending Balance */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow" transition-all duration-300>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-gray-900" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Pending Balance</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1" data-testid="pending-balance">
                        {earningsLoading ? '...' : `$${(creatorBalanceData as any)?.balance?.pendingBalance || '0.00'}`}
                      </p>
                      <p className="text-xs text-gray-500">Available on 5th</p>
                    </div>
                  </div>

                  {/* Lifetime Earnings */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow" transition-all duration-300>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-gray-900" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Lifetime Earnings</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1" data-testid="total-earnings">
                        {earningsLoading ? '...' : `$${(creatorBalanceData as any)?.balance?.lifetimeEarnings || '0.00'}`}
                      </p>
                      <p className="text-xs text-gray-500">Total earned (after commission)</p>
                    </div>
                  </div>

                  {/* Total Withdrawn */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow" transition-all duration-300>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-gray-900" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Withdrawn</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1" data-testid="total-withdrawn">
                        {earningsLoading ? '...' : `$${(creatorBalanceData as any)?.balance?.totalWithdrawn || '0.00'}`}
                      </p>
                      <p className="text-xs text-gray-500">Successfully paid out</p>
                    </div>
                  </div>
                </div>

                {/* Download Statistics */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Download Statistics</h3>
                  <p className="text-sm text-gray-600 mb-4">Track how many people downloaded your content</p>
                  {downloadStatsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Loading download stats...</p>
                    </div>
                  ) : (downloadStatsData as any)?.data?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Free</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Paid</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Subscription</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(downloadStatsData as any)?.data?.map((stat: ProductDownloadStats) => (
                            <tr key={stat.productId} className="border-b hover:bg-gray-50" transition-all duration-300>
                              <td className="py-3 px-4 text-sm font-medium text-gray-900">{stat.productName}</td>
                              <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">{stat.totalDownloads}</td>
                              <td className="py-3 px-4 text-sm text-right text-gray-600">{stat.freeDownloads}</td>
                              <td className="py-3 px-4 text-sm text-right text-green-600">{stat.paidDownloads}</td>
                              <td className="py-3 px-4 text-sm text-right text-blue-600">{stat.subscriptionDownloads}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Download className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm text-gray-500">No download data yet. Create products to start tracking downloads.</p>
                    </div>
                  )}
                </div>

                {/* Recent Earnings with Commission Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Earnings</h3>
                  <p className="text-sm text-gray-600 mb-4">Your earnings with commission breakdown</p>
                  {earningsLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Loading earnings...</p>
                    </div>
                  ) : (creatorBalanceData as any)?.recentEarnings?.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="font-medium mb-2 text-gray-900">No Earnings Yet</h3>
                      <p className="text-sm text-gray-500">
                        Your earnings will appear here once you make sales from products or services.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {(creatorBalanceData as any)?.recentEarnings
                          ?.slice(earningsPage * 5, (earningsPage + 1) * 5)
                          ?.map((earning: CreatorEarningEvent) => (
                          <div key={earning.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors" transition-all duration-300>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {earning.eventType === 'product_sale' ? '🛍️ Product Sale' :
                                   earning.eventType === 'course_sale' ? '📚 Course Sale' :
                                   earning.eventType === 'free_download_milestone' ? '🎉 Download Milestone' :
                                   earning.eventType}
                                </p>
                                <p className="text-sm text-gray-600">{earning.metadata?.productName || earning.metadata?.courseName}</p>
                              </div>
                              <Badge variant={earning.status === 'available' ? 'default' : 'secondary'}>
                                {earning.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                              <div>
                                <p className="text-gray-500">Gross Sale</p>
                                <p className="font-semibold text-gray-900">${earning.grossAmount}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Commission (25%)</p>
                                <p className="font-semibold text-primary">-${earning.platformCommission}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Your Earnings</p>
                                <p className="font-semibold text-green-600">${earning.creatorAmount}</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(earning.eventDate).toLocaleDateString()} at {new Date(earning.eventDate).toLocaleTimeString()}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination Controls */}
                      {(creatorBalanceData as any)?.recentEarnings?.length > 5 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            Showing {earningsPage * 5 + 1}-{Math.min((earningsPage + 1) * 5, (creatorBalanceData as any)?.recentEarnings?.length)} of {(creatorBalanceData as any)?.recentEarnings?.length} transactions
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEarningsPage(prev => Math.max(0, prev - 1))}
                              disabled={earningsPage === 0}
                              data-testid="button-prev-earnings"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEarningsPage(prev => prev + 1)}
                              disabled={(earningsPage + 1) * 5 >= (creatorBalanceData as any)?.recentEarnings?.length}
                              data-testid="button-next-earnings"
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Methods</h3>
                  <p className="text-sm text-gray-600 mb-4">Manage your payout accounts to receive earnings</p>
                  
                  <div className="space-y-3">
                    {(payoutAccountsData as any)?.length > 0 ? (
                      <div className="space-y-2">
                        {(payoutAccountsData as any)?.map((account: PayoutAccount) => (
                          <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              {account.type === 'paypal' ? <Wallet className="h-5 w-5 text-blue-600" /> : <Banknote className="h-5 w-5 text-green-600" />}
                              <div>
                                <p className="font-medium text-gray-900">{account.accountName}</p>
                                <p className="text-sm text-gray-500">{account.type === 'paypal' ? 'PayPal' : 'Bank Transfer'}</p>
                              </div>
                            </div>
                            {account.isDefault && <Badge>Default</Badge>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">No payment methods added yet</p>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('settings')}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Payment Methods
                    </Button>
                  </div>
                </div>

              </div>
            )}


            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Manage your freelancer profile and preferences</p>
                </div>

                {/* Enhanced Profile Setup */}
                <div className="space-y-6">
                  <EnhancedProfileSetup showPublicPreview={true} />
                </div>

                {/* Payment Settings */}
                <div className="space-y-6">
                  <PaymentMethodsCard user={user} />
                </div>

                {/* Notification Settings */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Notification Preferences</CardTitle>
                    <CardDescription className="text-sm">Choose what notifications you'd like to receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      {[
                        { id: 'new-projects', label: 'New project opportunities' },
                        { id: 'messages', label: 'New messages from clients' },
                        { id: 'payments', label: 'Payment confirmations' },
                        { id: 'milestones', label: 'Milestone reminders' },
                      ].map((notification) => (
                        <div key={notification.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors" transition-all duration-300>
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" 
                            defaultChecked
                            data-testid={`checkbox-${notification.id}`}
                          />
                          <span className="text-sm font-medium flex-1">{notification.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <WalletPage userRole="freelancer" />
            )}

            {/* Pricing Plans Tab */}
            {activeTab === 'pricing-plans' && (
              <div className="space-y-6">
                <FreelancerPricingPlans onPlanSelect={handlePlanSelect} />
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <BillingPage />
            )}

            {/* Receipts Tab */}
            {activeTab === 'receipts' && (
              <ReceiptsSection showTitle={true} />
            )}

            {/* Buy Voucher Tab */}
            {activeTab === 'buy-voucher' && (
              <BuyVoucherSection onBack={() => setActiveTab("overview")} />
            )}

            {/* Create Ad Tab */}
            {activeTab === 'create-ad' && (
              <div className="space-y-6">
                <MyAdsPage onNavigate={onNavigate} userRole="freelancer" />
              </div>
            )}

            {/* Purchases Tab */}
            {activeTab === 'purchases' && (
              <PurchasesPage />
            )}
          </div>
        </main>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit(handleCreateProject)} className="space-y-4">
              <FormField
                control={projectForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project title" {...field} data-testid="input-project-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={projectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your project" {...field} data-testid="textarea-project-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={projectForm.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-project-budget"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={projectForm.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-project-deadline"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={createProjectMutation.isPending}
                  data-testid="button-submit-project"
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateProject(false)}
                  data-testid="button-cancel-project"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      {/* Live Chat Widget - Hidden for freelancers via role-based logic in App.tsx */}
    </div>
  );
}
