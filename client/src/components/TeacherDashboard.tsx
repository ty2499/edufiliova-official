import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { openExternalUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  User,
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
  Package,
  ShoppingBag,
  Wallet,
  Menu,
  X,
  Receipt,
  Briefcase,
  LayoutGrid,
  Gift
} from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { SiPaypal } from 'react-icons/si';
import { FaExclamationTriangle, FaCheckCircle, FaGlobe } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { ProfileSettingsForm } from './ProfileSettingsForm';
import { MessagingInterface } from './MessagingInterface';
import { CommunityChat } from './CommunityChat';
import { AnnouncementFeed } from './AnnouncementFeed';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { AssignmentDashboard } from './teacher/AssignmentDashboard';
import { ProductManager } from './ProductManager';
import { WalletPage } from './wallet/WalletPage';
import { BannerAdDisplay } from '@/components/BannerAdDisplay';
import { SponsoredListingDisplay } from '@/components/SponsoredListingDisplay';
import { AjaxLoader, AjaxCard, AjaxButton, AjaxStatus } from '@/components/ui/ajax-loader';
import MeetingScheduler from '@/pages/MeetingScheduler';
import { CategoryAccessManager } from './CategoryAccessManager';
import MyAdsPage from '@/pages/MyAdsPage';
import { CoursesSection } from '@/pages/StudentDashboard';
import CourseDetail from '@/pages/CourseDetail';
import CoursePlayer from '@/pages/CoursePlayer';
import CourseCreator from '@/pages/CourseCreator';
import SubjectCreator from '@/pages/SubjectCreator';
import { FindTalent } from '@/pages/FindTalent';
import { PortfolioGallery } from '@/pages/PortfolioGallery';
import { TeacherMeetingsTab } from './teacher/TeacherMeetingsTab';
import { TeacherDashboardPending } from './TeacherDashboardPending';
import ReceiptsSection from '@/components/ReceiptsSection';
import BuyVoucherSection from '@/components/BuyVoucherSection';

interface Student {
  studentId: string;
  name: string;
  pronouns?: string;
  avatarUrl?: string;
  grade: number;
  assignedAt: string;
  subjectId?: string;
  subjectName?: string;
  subjects?: string[]; // New field for multiple subjects
  notes?: string;
  lastMessageTime?: string;
  unreadCount: number;
  totalLessonsStarted?: number;
  completedLessons?: number;
  averageProgress?: number;
  lastActiveAt?: string;
}

interface ClassPerformance {
  subject: string;
  averageScore: number;
  totalStudents: number;
  completionRate: number;
  trend: 'up' | 'down' | 'stable';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetAudience: string;
  targetGrade?: number;
  createdAt: string;
  readBy: string[];
}

interface Appointment {
  id: string;
  teacherId: string;
  studentId: string;
  subject?: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  status: string;
  meetingLink?: string;
  notes?: string;
  price?: number;
  paymentStatus: string;
  teacherName?: string;
  studentName?: string;
  createdAt: string;
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

interface TeacherEarnings {
  availableBalance: string;
  totalEarnings: string;
  totalWithdrawn: string;
  pendingPayouts: string;
  lastUpdated: string;
}

interface TeacherTransaction {
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

    // Check account limits
    if (payoutAccounts.length >= 2) {
      alert('Maximum of 2 payment accounts allowed. You can delete or modify existing accounts after 5 days.');
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
        
        // Facebook-like success feedback
        const successMessage = `Your ${selectedType === 'paypal' ? 'PayPal' : 'bank account'} has been added! It's now pending verification.`;
        alert(successMessage);
        
        handleHideAddForm();
        fetchPayoutAccounts(); // Refresh the list
        fetchNotifications(); // Check for any new notifications
      } else {
        alert('Error adding payment method: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding payout account:', error);
      alert('Error adding payment method. Please check your connection and try again.');
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
      alert(`You can only delete this account after 5 days of creation. Please wait ${daysLeft} more day${daysLeft > 1 ? 's' : ''}.`);
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

  React.useEffect(() => {
    fetchPayoutAccounts();
    fetchCountries(); // Fetch all available countries
    fetchUserLocation(); // Auto-detect user location on component mount
    fetchNotifications(); // Fetch any decline notifications
  }, [user?.id]);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment & Payout Settings
          {notifications.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowNotifications(!showNotifications)}
              className="ml-auto text-white border-gray-300 hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              {notifications.length} Alert{notifications.length > 1 ? 's' : ''}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
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
          <div className={`space-y-3 transition-all duration-300 ${showAddForm || isTransitioning ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Your Payment Accounts</h4>
              {!showAddForm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShowAddForm}
                  className="text-white border-gray-300 hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Method
                </Button>
              )}
            </div>
            {payoutAccounts.map((account) => (
              <div key={account.id} className="border rounded-lg p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md" transition-all duration-300>
                <div className="flex items-center gap-3">
                  {account.type === 'paypal' ? (
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PP</span>
                    </div>
                  ) : (
                    <Banknote className="w-8 h-8 text-green-600" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{account.accountName}</p>
                      {account.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                      {account.isVerified ? (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800 flex items-center gap-1">
                          <CheckmarkIcon size="sm" variant="success" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-primary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Verification
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {account.type.charAt(0).toUpperCase() + account.type.slice(1)} Account
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!account.isDefault && (
                    <Button variant="outline" size="sm" onClick={() => handleSetDefault(account.id)} className="text-white border-gray-300 hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}>
                      Set Default
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleDeleteAccount(account.id)} className="text-white border-gray-300 hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}>
                    Delete
                  </Button>
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
              <Button variant="outline" size="sm" onClick={handleHideAddForm} className="border-gray-300 text-white hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}>
                Cancel
              </Button>
            </div>

            {/* Payout Policy Link */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Read Our Payout Policy</span>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(window.location.origin + '?page=payout-policy', '_blank')}
                  className="text-white border-gray-300 hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}
                >
                  View Policy
                </Button>
              </div>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              {/* Account Type Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Account Type</label>
                {/* Show PayPal and Bank options */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={selectedType === 'paypal' ? 'default' : 'outline'}
                    onClick={() => setSelectedType('paypal')}
                    className="justify-start"
                  >
                    <div className="w-6 h-6 bg-primary rounded mr-2 flex items-center justify-center">
                      <SiPaypal className="text-white text-sm" />
                    </div>
                    PayPal
                  </Button>
                  <Button
                    type="button"
                    variant={selectedType === 'bank' ? 'default' : 'outline'}
                    onClick={() => setSelectedType('bank')}
                    className="justify-start"
                    disabled={formData.country === 'OTHER'}
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    Bank Account
                  </Button>
                </div>
                {formData.country === 'OTHER' && (
                  <p className="text-xs text-blue-600 mt-2">
                    <FaGlobe className="inline mr-1" /> For your region, we support PayPal payments
                  </p>
                )}
              </div>

              {/* Account Name */}
              <div>
                <label className="text-sm font-medium mb-1 block">Account Display Name</label>
                <Input
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="e.g., My Primary PayPal, Main Bank Account"
                  required
                />
              </div>

              {/* PayPal Fields */}
              {selectedType === 'paypal' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">PayPal Email Address</label>
                  <Input
                    type="email"
                    value={formData.paypalEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, paypalEmail: e.target.value }))}
                    placeholder="your.email@example.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the email address associated with your PayPal account
                  </p>
                </div>
              )}


              {/* Bank Fields */}
              {selectedType === 'bank' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Account Holder Name</label>
                    <Input
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                      placeholder="Full name as it appears on your account"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Country</label>
                      <Select value={formData.country} onValueChange={handleCountryChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingCountries ? (
                            <SelectItem value="loading" disabled>Loading countries...</SelectItem>
                          ) : (
                            countries.map((country) => (
                              <SelectItem key={country.countryCode} value={country.countryCode}>
                                {country.countryName} ({country.bankCount} banks)
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Select Bank</label>
                      <Select value={formData.selectedBankId} onValueChange={handleBankSelect} disabled={loadingBanks}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingBanks ? "Loading banks..." : "Choose your bank"} />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.length > 0 ? (
                            banks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.id}>
                                {bank.bankName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {loadingBanks ? "Loading banks..." : "No banks available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Bank Name</label>
                    <Input
                      value={formData.bankName}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="Bank name will be auto-filled when you select a bank"
                      required
                      readOnly={!!formData.selectedBankId}
                      className={formData.selectedBankId ? "bg-gray-50" : ""}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Routing/Sort Code</label>
                      <Input
                        value={formData.routingNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, routingNumber: e.target.value }))}
                        placeholder="Bank routing/sort code"
                        required
                        readOnly={!!formData.selectedBankId}
                        className={formData.selectedBankId ? "bg-gray-50" : ""}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">SWIFT Code</label>
                      <Input
                        value={formData.swiftCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, swiftCode: e.target.value }))}
                        placeholder="International SWIFT code"
                        readOnly={!!formData.selectedBankId}
                        className={formData.selectedBankId ? "bg-gray-50" : ""}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Account Number</label>
                      <Input
                        value={formData.accountNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="Your account number"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Account Type</label>
                      <Select value={formData.accountType} onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="current">Current Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Security Notice:</strong> Your payment information is encrypted and secure. 
                      All accounts require verification before payouts can be processed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1 text-white" style={{backgroundColor: '#0C332C'}}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Payment Account...
                    </>
                  ) : (
                    'Add Payment Account'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

// Purchases View Component
function PurchasesView({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [, navigate] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showAllPurchases, setShowAllPurchases] = useState(false);
  
  const { data: purchases, isLoading } = useQuery<any[]>({
    queryKey: ['/api/shop/purchases'],
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (optimized from 0)
  });

  const { data: coursePurchases, isLoading: coursePurchasesLoading } = useQuery<any[]>({
    queryKey: ['/api/course-purchases'],
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (optimized from 0)
  });

  const { data: digitalDownloads, isLoading: downloadsLoading } = useQuery<any[]>({
    queryKey: ['/api/digital-downloads'],
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (optimized from 0)
  });

  // Merge and normalize all purchases (shop + course)
  const allPurchases = [
    ...(purchases || []).map(p => ({
      id: p.id,
      orderId: p.orderId,
      itemName: p.itemName,
      price: p.price,
      createdAt: p.createdAt,
      type: 'shop' as const,
      originalData: p
    })),
    ...(coursePurchases || []).map(cp => ({
      id: cp.id,
      orderId: cp.id,
      itemName: cp.courseTitle || 'Course Purchase',
      price: cp.amount,
      createdAt: cp.createdAt,
      type: 'course' as const,
      originalData: cp
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Generate available months from paid purchases only
  const availableMonths = allPurchases ? Array.from(
    new Set(
      allPurchases
        .filter(p => parseFloat(p.price) > 0)
        .map(p => {
          const date = new Date(p.createdAt);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        })
    )
  ).sort((a, b) => b.localeCompare(a)) : [];

  // Filter purchases by selected month and exclude free items
  const filteredPurchases = allPurchases?.filter(purchase => {
    if (parseFloat(purchase.price) === 0) return false;
    
    if (selectedMonth === 'all') return true;
    const date = new Date(purchase.createdAt);
    const purchaseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return purchaseMonth === selectedMonth;
  }) || [];

  // Format month for display
  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const handleDownload = async (downloadToken: string, productName: string) => {
    try {
      window.location.href = `/download/${downloadToken}`;
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (isLoading || coursePurchasesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Purchase History</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading purchases...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-bold text-gray-900">Purchase History</h2>
        
        {/* Month Filter */}
        {allPurchases && allPurchases.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="month-filter" className="text-sm text-gray-600 whitespace-nowrap">Filter by:</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-filter" className="w-full sm:w-[200px]" data-testid="select-month-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {formatMonthDisplay(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!allPurchases || allPurchases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No purchases yet</p>
          </CardContent>
        </Card>
      ) : filteredPurchases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No purchases found with the selected filters</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSelectedMonth('all')}
              data-testid="button-clear-filter"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {(showAllPurchases ? filteredPurchases : filteredPurchases.slice(0, 3)).map((purchase) => {
              // Find matching digital download for this purchase
              const matchingDownload = digitalDownloads?.find(
                (dl: any) => dl.orderId === purchase.orderId
              );

              return (
                <Card key={purchase.id} data-testid={`card-purchase-${purchase.id}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{purchase.itemName}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Order #{purchase.orderId.substring(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${purchase.price}</p>
                        <Badge variant="secondary" className="text-xs">{purchase.type}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      {matchingDownload && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(matchingDownload.downloadToken, matchingDownload.productName)}
                          disabled={matchingDownload.isExpired}
                          data-testid={`button-download-${purchase.id}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {matchingDownload.isExpired ? 'Link Expired' : 'Download'}
                        </Button>
                      )}
                      {purchase.type === 'course' && (
                        <Button size="sm" className="bg-primary hover:bg-primary text-white" transition-all duration-300 onClick={() => {
                          const courseId = purchase.originalData.courseId;
                          if (courseId) {
                            navigate(`/course/${courseId}/player`);
                          }
                        }}>
                          View Course
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {filteredPurchases.length > 3 && (
            <div className="mt-2">
              <Button
                variant="outline"
                onClick={() => setShowAllPurchases(!showAllPurchases)}
                className="w-full"
                data-testid="button-view-all-purchases"
              >
                {showAllPurchases ? 'Show Less' : `View All (${filteredPurchases.length})`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Downloads View Component
function DownloadsView() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: digitalDownloads, isLoading } = useQuery<any[]>({
    queryKey: ['/api/digital-downloads'],
    refetchOnMount: true,
    staleTime: 0,
  });

  // Generate available months from downloads
  const availableMonths = digitalDownloads ? Array.from(
    new Set(
      digitalDownloads.map(d => {
        const date = new Date(d.orderDate);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort((a, b) => b.localeCompare(a)) : [];

  // Filter downloads by selected month and status
  const filteredDownloads = digitalDownloads?.filter(download => {
    // Month filter
    if (selectedMonth !== 'all') {
      const date = new Date(download.orderDate);
      const downloadMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (downloadMonth !== selectedMonth) return false;
    }
    
    // Status filter
    if (selectedStatus === 'active' && download.isExpired) return false;
    if (selectedStatus === 'expired' && !download.isExpired) return false;
    
    return true;
  }) || [];

  // Format month for display
  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const handleDownload = async (downloadToken: string, productName: string) => {
    try {
      window.location.href = `/download/${downloadToken}`;
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Digital Downloads</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading downloads...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="font-bold text-gray-900 text-[18px]">Digital Downloads</h2>
        
        {/* Filters */}
        {digitalDownloads && digitalDownloads.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <label htmlFor="status-filter" className="text-sm text-gray-600 whitespace-nowrap">Filter by:</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status-filter" className="w-full sm:w-[150px]" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            
            {availableMonths.length > 0 && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-filter" className="w-full sm:w-[200px]" data-testid="select-month-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month}>
                      {formatMonthDisplay(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>
      {!digitalDownloads || digitalDownloads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No digital downloads yet</p>
          </CardContent>
        </Card>
      ) : filteredDownloads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No downloads found with the selected filters</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSelectedMonth('all');
                setSelectedStatus('all');
              }}
              data-testid="button-clear-filter"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDownloads.map((download) => (
            <Card key={download.id} data-testid={`card-download-${download.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{download.productName}</h3>
                    {download.productDescription && (
                      <p className="text-sm text-gray-500 mt-1">{download.productDescription}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <p className="text-sm text-gray-500">
                        Order #{download.orderId.substring(0, 8).toUpperCase()}
                      </p>
                      <span className="text-gray-300">•</span>
                      <p className="text-sm text-gray-500">
                        {new Date(download.orderDate).toLocaleDateString()}
                      </p>
                      {download.downloadedAt && (
                        <>
                          <span className="text-gray-300">•</span>
                          <p className="text-sm text-gray-500">
                            Downloaded {new Date(download.downloadedAt).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(download.downloadToken, download.productName)}
                      disabled={download.isExpired}
                      className={download.isExpired ? 'bg-gray-400' : 'bg-white hover:bg-gray-100 text-gray-700'}
                      data-testid={`button-download-${download.id}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {download.isExpired ? 'Link Expired' : 'Download'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface TeacherDashboardProps {
  onNavigate?: (page: string) => void;
}

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps = {}) {
  const { user, logout, teacherApplicationStatus } = useAuth();
  const queryClient = useQueryClient();
  
  // Show pending view if teacher application is not approved
  if (teacherApplicationStatus && teacherApplicationStatus.status !== 'approved') {
    return <TeacherDashboardPending />;
  }
  
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'classes' | 'meetings' | 'courses' | 'course-detail' | 'course-player' | 'marketplace' | 'portfolio-gallery' | 'create-course' | 'create-subject' | 'messages' | 'assignments' | 'calendar' | 'earnings' | 'products' | 'categories' | 'settings' | 'announcements' | 'community' | 'requests' | 'purchases' | 'downloads' | 'wallet' | 'create-ad' | 'receipts' | 'buy-voucher'>('overview');
  
  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Collapsible nav section states
  const [moneyOpen, setMoneyOpen] = useState(true);
  const [storeOpen, setStoreOpen] = useState(true);
  const [marketplaceOpen, setMarketplaceOpen] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    hourlyRate: '',
    bio: '',
    qualifications: '',
    experience: '',
    availableHours: ''
  });
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showNewAssignmentDialog, setShowNewAssignmentDialog] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    studentId: '',
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Availability form state
  const [availabilityForm, setAvailabilityForm] = useState({
    timezone: '',
    weeklyAvailability: {
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
      Saturday: false,
      Sunday: false
    },
    startTime: '09:00',
    endTime: '17:00'
  });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Close mobile menu when active tab changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [activeTab]);
  

  // Get assigned students with progress
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher', 'students', 'progress'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/teacher/students/progress', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    select: (data) => Array.isArray(data) ? data : [],
    enabled: !!user
  });


  // Get teacher assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['teacher', 'assignments'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/teacher/assignments', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    select: (data) => Array.isArray(data) ? data : [],
    enabled: !!user
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (assignmentData: any) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/teacher/assignments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionId}` },
        body: JSON.stringify(assignmentData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
      setShowNewAssignmentDialog(false);
      setNewAssignment({
        studentId: '',
        title: '',
        description: '',
        subject: '',
        dueDate: '',
        priority: 'medium'
      });
    },
    onError: (error: any) => {
      console.error('Failed to create assignment:', error);
    }
  });

  // Get class performance data from API
  const { data: classPerformance = [], isLoading: performanceLoading } = useQuery({
    queryKey: ['teacher', 'class-performance'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/teacher/class-performance', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    select: (data) => Array.isArray(data) ? data : [],
    enabled: !!user
  });

  // Get recent activities from API
  const { data: recentActivities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['teacher', 'recent-activities'],
    queryFn: () => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/teacher/recent-activities', {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    select: (data) => Array.isArray(data) ? data : [],
    enabled: !!user
  });

  // Get teacher earnings from creator-payouts API (commission-based)
  const { data: creatorBalanceData, isLoading: earningsLoading } = useQuery({
    queryKey: ['/api/creator-payouts/balance'],
    enabled: !!user
  });

  // Get teacher download stats for products
  const { data: downloadStatsData, isLoading: downloadStatsLoading } = useQuery({
    queryKey: ['/api/products/my/download-stats'],
    enabled: !!user
  });

  // Get payout accounts
  const { data: payoutAccountsData } = useQuery({
    queryKey: [`/api/payout-accounts/${user?.id}`],
    enabled: !!user?.id,
  });

  // Get teacher appointments from API
  const { data: appointments = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery({
    queryKey: ['teacher', 'appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/appointments/${user.id}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      // Filter for upcoming appointments and sort by date
      const appointmentsList = Array.isArray(response) ? response : (response?.data || []);
      return appointmentsList
        .filter((apt: Appointment) => ['scheduled', 'confirmed', 'pending'].includes(apt.status))
        .sort((a: Appointment, b: Appointment) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  });

  // Fetch teacher profile data
  const fetchTeacherProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/teacher/profile', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.profile) {
        setTeacherProfile(data.profile);
        setProfileForm({
          name: data.profile.name || '',
          email: data.profile.email || '',
          phoneNumber: data.profile.phoneNumber || '',
          hourlyRate: data.profile.hourlyRate || '0.00',
          bio: data.profile.bio || '',
          qualifications: data.profile.qualifications || '',
          experience: data.profile.experience || '',
          availableHours: data.profile.availableHours || ''
        });
      } else {
        console.error('Failed to fetch profile:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch teacher profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Auto-load teacher profile when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchTeacherProfile();
    }
  }, [user]);

  // Re-fetch when switching to settings tab
  useEffect(() => {
    if (activeTab === 'settings' && user && !teacherProfile) {
      fetchTeacherProfile();
    }
  }, [activeTab, user, teacherProfile]);

  // Load availability data when switching to settings
  useEffect(() => {
    if (activeTab === 'settings' && user) {
      fetchTeacherAvailability();
    }
  }, [activeTab, user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/teacher/profile', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      console.log('Profile updated successfully');
      // Refresh the profile data immediately
      fetchTeacherProfile();
    },
    onError: (error: any) => {
      console.error('Failed to update profile:', error);
    }
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    onSuccess: () => {
      refetchAppointments();
    },
    onError: (error: any) => {
      console.error('Failed to cancel appointment:', error);
    }
  });

  // Format date and time for appointments
  const formatAppointmentTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    const timeString = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    
    if (isToday) {
      return `Today at ${timeString}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeString}`;
    } else {
      return `${date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      })} at ${timeString}`;
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = (appointmentId: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      cancelAppointmentMutation.mutate(appointmentId);
    }
  };

  // Approve/decline appointment mutation
  const approveAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, action, meetingLink }: { appointmentId: string; action: 'approve' | 'decline'; meetingLink?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${sessionId}` },
        body: JSON.stringify({ action, meetingLink })
      });
    },
    onSuccess: () => {
      refetchAppointments();
    },
    onError: (error: any) => {
      console.error('Failed to approve/decline appointment:', error);
    }
  });

  // Handle appointment approval/decline
  const handleApproveAppointment = (appointmentId: string, meetingLink?: string) => {
    approveAppointmentMutation.mutate({ appointmentId, action: 'approve', meetingLink });
  };

  const handleDeclineAppointment = (appointmentId: string) => {
    if (confirm('Are you sure you want to decline this appointment?')) {
      approveAppointmentMutation.mutate({ appointmentId, action: 'decline' });
    }
  };

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const saveProfileChanges = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setTeacherProfile((prev: any) => ({ ...prev, avatarUrl: result.avatarUrl }));
        updateProfileMutation.mutate({ avatarUrl: result.avatarUrl });
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
    }
  };

  // Availability form handlers
  const handleTimezoneChange = (value: string) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      timezone: value
    }));
  };

  const handleDayToggle = (day: string) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      weeklyAvailability: {
        ...prev.weeklyAvailability,
        [day]: !prev.weeklyAvailability[day as keyof typeof prev.weeklyAvailability]
      }
    }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Load teacher availability
  const fetchTeacherAvailability = async () => {
    if (!user?.id) return;

    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/teacher/availability/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.availability) {
          setAvailabilityForm(data.availability);
        }
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  // Save availability
  const handleUpdateAvailability = async () => {
    if (!user?.id) return;

    setAvailabilityLoading(true);
    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/teacher/availability/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(availabilityForm)
      });

      const result = await response.json();
      if (result.success) {
        console.log('Availability updated successfully');
        // You might want to show a success message here
      } else {
        console.error('Failed to update availability:', result.error);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    } finally {
      setAvailabilityLoading(false);
    }
  };



  // Course navigation handler - intercepts course navigation to stay in dashboard
  const handleCourseNavigation = (target: string) => {
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
    } else {
      // For any other navigation, use parent onNavigate if available
      onNavigate?.(target);
    }
  };

  // Back handler from course views
  const handleBackFromCourse = () => {
    setSelectedCourseId(null);
    setActiveTab('courses');
  };

  const formatMessageTime = (dateString?: string) => {
    if (!dateString) return 'No messages';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Generate dynamic welcome message based on time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const name = teacherProfile?.name || 'Teacher';
    
    if (hour < 12) {
      return (
        <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
          Good morning, <strong className="font-extrabold">{name}</strong>
        </span>
      );
    } else if (hour < 17) {
      return (
        <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
          Good afternoon, <strong className="font-extrabold">{name}</strong>
        </span>
      );
    } else {
      return (
        <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
          Good evening, <strong className="font-extrabold">{name}</strong>
        </span>
      );
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-primary rotate-180" />;
      case 'stable': return <TrendingUp className="h-4 w-4 text-gray-500 rotate-90" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'message': return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'completion': return <CheckmarkIcon size="sm" variant="success" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar - Mobile */}
      <nav className="bg-[#0C332C] border-b border-white/10 fixed top-0 left-0 right-0 z-40 md:hidden pt-safe">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-white hover:text-gray-200" transition-all duration-300
                data-testid="button-mobile-menu"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Logo size="md" variant="white" type="teacher" />
            </div>
            <div className="flex items-center gap-3">
              {/* Notification badges if any */}
            </div>
          </div>
        </div>
      </nav>

      {/* Left Sidebar - Slide-in on mobile, fixed on desktop - Hidden when viewing portfolio gallery */}
      <div className={`${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
      } ${activeTab === 'portfolio-gallery' ? 'md:-translate-x-full' : 'md:translate-x-0'} fixed left-0 top-0 md:top-0 h-full w-64 border-r border-white/10 z-50 bg-[#0C332C] transition-transform duration-300`}>
        <div className="flex flex-col h-full py-4">
          
          {/* Logo - Desktop only */}
          <div className="mb-4 px-4 hidden md:block" data-testid="sidebar-logo">
            <Logo size="md" variant="white" type="teacher" />
          </div>
          
          {/* Navigation Items */}
          <nav className="flex flex-col space-y-1 px-3 flex-1 overflow-y-auto">
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "overview" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("overview"); setShowMobileMenu(false); }}
              data-testid="nav-overview"
            >
              <Home className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Overview</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "students" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("students"); setShowMobileMenu(false); }}
              data-testid="nav-students"
            >
              <Users className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Students</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "classes" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("classes"); setShowMobileMenu(false); }}
              data-testid="nav-classes"
            >
              <BookOpen className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Classes</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "courses" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("courses"); setShowMobileMenu(false); }}
              data-testid="nav-courses"
            >
              <GraduationCap className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Courses</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "create-course" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("create-course"); setShowMobileMenu(false); }}
              data-testid="nav-create-course"
            >
              <Plus className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Create Course</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "create-subject" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("create-subject"); setShowMobileMenu(false); }}
              data-testid="nav-create-subject"
            >
              <BookMarked className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Create Subject</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "messages" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("messages"); setShowMobileMenu(false); }}
              data-testid="nav-messages"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Messages</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "assignments" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("assignments"); setShowMobileMenu(false); }}
              data-testid="nav-assignments"
            >
              <ClipboardList className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Assignments</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "calendar" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("calendar"); setShowMobileMenu(false); }}
              data-testid="nav-calendar"
            >
              <Calendar className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Calendar</span>
            </Button>
            
            {/* Announcements - under Messages */}
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "announcements" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("announcements"); setShowMobileMenu(false); }}
              data-testid="nav-announcements"
            >
              <Bell className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Announcements</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "community" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("community"); setShowMobileMenu(false); }}
              data-testid="nav-community"
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Community</span>
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-lg transition-colors ${
                activeTab === "requests" 
                  ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => { setActiveTab("requests"); setShowMobileMenu(false); }}
              data-testid="nav-requests"
            >
              <Clock className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Requests</span>
            </Button>
            
            {/* MONEY Section - Collapsible */}
            <div className="pt-3">
              <button
                onClick={() => setMoneyOpen(!moneyOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors" transition-all duration-300
                data-testid="nav-money-toggle"
              >
                <span>Money</span>
                {moneyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {moneyOpen && (
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors ${
                    activeTab === "earnings" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setActiveTab("earnings"); setShowMobileMenu(false); }}
                  data-testid="nav-earnings"
                >
                  <DollarSign className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Earnings</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors ${
                    activeTab === "wallet" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setActiveTab("wallet"); setShowMobileMenu(false); }}
                  data-testid="nav-wallet"
                >
                  <Wallet className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Wallet</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors ${
                    activeTab === "receipts" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setActiveTab("receipts"); setShowMobileMenu(false); }}
                  data-testid="nav-receipts"
                >
                  <Receipt className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Receipts</span>
                </Button>
              </div>
            )}
            
            {/* STORE Section - Collapsible */}
            <div className="pt-3">
              <button
                onClick={() => setStoreOpen(!storeOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors" transition-all duration-300
                data-testid="nav-store-toggle"
              >
                <span>Store</span>
                {storeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {storeOpen && (
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors ${
                    activeTab === "products" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setActiveTab("products"); setShowMobileMenu(false); }}
                  data-testid="nav-products"
                >
                  <Package className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Products</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors ${
                    activeTab === "downloads" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setActiveTab("downloads"); setShowMobileMenu(false); }}
                  data-testid="nav-downloads"
                >
                  <Download className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Downloads</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors ${
                    activeTab === "purchases" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setActiveTab("purchases"); setShowMobileMenu(false); }}
                  data-testid="nav-purchases"
                >
                  <ShoppingBag className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Purchases</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors ${
                    activeTab === "buy-voucher" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setActiveTab("buy-voucher"); setShowMobileMenu(false); }}
                  data-testid="nav-buy-voucher"
                >
                  <Gift className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Buy Voucher</span>
                </Button>
              </div>
            )}
            
            {/* MARKETPLACE Section - Collapsible */}
            <div className="pt-3">
              <button
                onClick={() => setMarketplaceOpen(!marketplaceOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors" transition-all duration-300
                data-testid="nav-marketplace-toggle"
              >
                <span>Marketplace</span>
                {marketplaceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {marketplaceOpen && (
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors ${
                    activeTab === "portfolio-gallery" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setActiveTab("portfolio-gallery"); setShowMobileMenu(false); }}
                  data-testid="nav-portfolio-gallery"
                >
                  <LayoutGrid className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Freelancer Works</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors ${
                    activeTab === "marketplace" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setActiveTab("marketplace"); setShowMobileMenu(false); }}
                  data-testid="nav-marketplace"
                >
                  <Users className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Find Freelancers</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg transition-colors ${
                    activeTab === "create-ad" 
                      ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setActiveTab("create-ad"); setShowMobileMenu(false); }}
                  data-testid="nav-create-ad"
                >
                  <FileText className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Create Ad</span>
                </Button>
              </div>
            )}
            
            {/* SETTINGS - Standalone at bottom */}
            <div className="pt-3">
              <Button
                variant="ghost"
                className={`w-full justify-start rounded-lg transition-colors ${
                  activeTab === "settings" 
                    ? "bg-[#c4ee3d] text-black hover:bg-[#c4ee3d]/90" 
                    : "text-white hover:bg-white/10"
                }`}
                onClick={() => { setActiveTab("settings"); setShowMobileMenu(false); }}
                data-testid="nav-settings"
              >
                <Settings className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Settings</span>
              </Button>
            </div>
          </nav>
          
          <div className="p-4 border-t border-white/10 space-y-2 flex-shrink-0">
            <Button
              size="sm"
              className="w-full bg-[#c4ee3d] hover:bg-[#c4ee3d]/90 text-black font-medium" transition-all duration-300
              onClick={() => { openExternalUrl('https://edufiliova.com'); setShowMobileMenu(false); }}
              data-testid="nav-explore-website"
            >
              <FaGlobe className="h-4 w-4 mr-2" />
              Explore Website
            </Button>
            <Button
              size="sm"
              className="w-full bg-[#fe5831] hover:bg-[#e64d2e] text-white font-medium" transition-all duration-300
              onClick={() => {
                setIsLoggingOut(true);
                setShowMobileMenu(false);
                setTimeout(async () => {
                  await logout();
                  onNavigate?.('home');
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
      </div>

      {/* Main Content */}
      <div className={`pt-16 md:pt-0 ${activeTab === 'portfolio-gallery' ? 'md:ml-0' : 'md:ml-64'} transition-all duration-300 min-h-screen flex flex-col`}>
        {/* Header - Hidden when messages tab is active */}
        {activeTab !== 'messages' && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <h1>{getWelcomeMessage()}</h1>
                  </div>
                  <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                    {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Dashboard Content */}
        <main className={activeTab === "messages" ? "p-0 h-screen flex-1 bg-white" : "px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6 max-w-full overflow-x-hidden overflow-y-auto flex-1 bg-white"}>

        {/* Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Banner Advertisement - Top of Dashboard */}
            <BannerAdDisplay placement="teacher_dashboard" className="mb-6" />
            {/* Mobile Banner Advertisement */}
            <BannerAdDisplay placement="teacher_dashboard" className="mb-4" />
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-white border-0" style={{background: '#2d5cdd'}}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/90 text-sm font-medium">Total Students</p>
                      <p className="text-2xl sm:text-3xl font-bold">{students.length}</p>
                      <p className="text-white/90 text-xs mt-1">Active learners</p>
                    </div>
                    <Users className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="text-black border-0" style={{background: '#A0FAB2'}}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-black/90 text-sm font-medium">Active Classes</p>
                      <p className="text-2xl sm:text-3xl font-bold">{classPerformance.length}</p>
                      <p className="text-black/90 text-xs mt-1">Subjects taught</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-black/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="text-white border-0" style={{background: '#fe5831'}}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/90 text-sm font-medium">Avg Performance</p>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {performanceLoading ? '...' : classPerformance.length > 0 
                          ? Math.round(classPerformance.reduce((sum: any, cls: any) => sum + cls.averageScore, 0) / classPerformance.length) + '%'
                          : '0%'}
                      </p>
                      <p className="text-white/90 text-xs mt-1">Class average</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="text-white border-0" style={{background: '#151314'}}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/90 text-sm font-medium">Unread Messages</p>
                      <p className="text-2xl sm:text-3xl font-bold">{students.reduce((sum: number, s: Student) => sum + s.unreadCount, 0)}</p>
                      <p className="text-white/90 text-xs mt-1">Need response</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Class Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {classPerformance.length === 0 ? (
                    <div className="text-center py-8">
                      <Home className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No performance data available yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {classPerformance.map((cls: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{cls.subject}</span>
                              {getTrendIcon(cls.trend)}
                            </div>
                            <span className="text-sm text-muted-foreground">{cls.totalStudents} students</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Average Score</span>
                                <span>{cls.averageScore}%</span>
                              </div>
                              <Progress value={cls.averageScore} className="h-2" />
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Completion</div>
                              <div className="text-sm font-medium">{cls.completionRate}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No recent activities to show</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-4">
                        {recentActivities.map((activity: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            {getActivityIcon(activity.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{activity.student}</p>
                              <p className="text-xs text-muted-foreground">{activity.subject}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('students')}
                    data-testid="button-view-students"
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-xs">View Students</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('messages')}
                    data-testid="button-send-messages"
                  >
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-xs">Send Messages</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('assignments')}
                    data-testid="button-manage-assignments"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-xs">Manage Assignments</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('calendar')}
                    data-testid="button-view-calendar"
                  >
                    <Calendar className="h-6 w-6" />
                    <span className="text-xs">View Calendar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Students View */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-lg sm:text-2xl font-bold">My Students</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input placeholder="Search students..." className="flex-1 sm:w-64" />
              </div>
            </div>
            
            {/* Sponsored Freelancer Projects Section */}
            <SponsoredListingDisplay 
              itemType="freelancer_project" 
              limit={3} 
              className="mb-6"
            />
            
            {students.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">No Students Assigned</h3>
                    <p className="text-sm text-muted-foreground">
                      Contact an administrator to assign students to your classes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {students.map((student: Student) => (
                  <Card 
                    key={student.studentId} 
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer group" transition-all duration-300
                    onClick={() => {
                      setSelectedStudent(student.studentId);
                      setActiveTab('messages');
                    }}
                    data-testid={`student-card-${student.studentId}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatarUrl} />
                          <AvatarFallback>
                            {student.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate group-hover:text-green-600 transition-colors" transition-all duration-300>
                            {student.name}
                          </h3>
                          {student.pronouns && student.pronouns.toLowerCase() !== 'prefer not to say' && student.pronouns.toLowerCase() !== 'prefer_not_to_say' && (
                            <p className="text-xs text-muted-foreground">{student.pronouns}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Grade {student.grade}
                            </Badge>
                            {student.subjects && student.subjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {student.subjects.map((subject: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                              </div>
                            ) : student.subjectName && (
                              <Badge variant="secondary" className="text-xs">
                                {student.subjectName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-3">
                        {student.averageProgress !== undefined && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Avg Progress</span>
                              <span>{Math.round(student.averageProgress)}%</span>
                            </div>
                            <Progress value={student.averageProgress} className="h-2" />
                          </div>
                        )}
                        
                        {(student.completedLessons !== undefined && student.totalLessonsStarted !== undefined) && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Lessons</span>
                              <span>{student.completedLessons}/{student.totalLessonsStarted} completed</span>
                            </div>
                            <Progress 
                              value={student.totalLessonsStarted > 0 ? (student.completedLessons / student.totalLessonsStarted) * 100 : 0} 
                              className="h-2" 
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Message:</span>
                          <span>{formatMessageTime(student.lastMessageTime)}</span>
                        </div>
                        
                        {student.unreadCount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Unread:</span>
                            <Badge variant="default" className="h-6 w-6 text-xs rounded-full p-0 flex items-center justify-center">
                              {student.unreadCount}
                            </Badge>
                          </div>
                        )}
                        
                        <Button size="sm" variant="outline" className="w-full mt-3 text-white border-gray-300 hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300 style={{backgroundColor: '#0C332C'}}>
                          <MessageCircle className="h-3 w-3 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages View */}
        {activeTab === 'messages' && (
          <div className="h-full">
            <MessagingInterface 
              userRole="teacher" 
              onChatModeChange={(isInChat) => {
                if (!isInChat) {
                  // Quick return to overview tab without page reload
                  setActiveTab("overview");
                }
              }}
            />
          </div>
        )}

        {/* Classes View - Video Meetings */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <Button 
              size="lg"
              onClick={() => setActiveTab('meetings')}
              className="mb-4 bg-gradient-to-r from-primary to-red-500 hover:from-orange-600 hover:to-primary text-white" transition-all duration-300
              data-testid="button-view-meetings"
            >
              View & Manage Meetings
            </Button>
            <MeetingScheduler />
          </div>
        )}

        {/* Meetings View */}
        {activeTab === 'meetings' && (
          <TeacherMeetingsTab onNavigate={onNavigate} />
        )}

        {/* Courses View */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <CoursesSection profile={teacherProfile} onNavigate={handleCourseNavigation} />
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

        {/* Create Course View */}
        {activeTab === 'create-course' && (
          <div className="space-y-6">
            <CourseCreator onNavigate={(target) => {
              if (target === 'back' || target === 'courses') {
                setActiveTab('courses');
              }
            }} />
          </div>
        )}

        {/* Create Subject View */}
        {activeTab === 'create-subject' && (
          <div className="space-y-6">
            <SubjectCreator 
              onNavigate={(target) => {
                if (target === 'back') {
                  setActiveTab('overview');
                }
              }}
              userRole="teacher"
            />
          </div>
        )}

        {/* Assignments View */}
        {activeTab === 'assignments' && (
          <AssignmentDashboard teacherId={user?.id || ''} />
        )}

        {/* Products View */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <ProductManager userRole="teacher" />
          </div>
        )}


        {/* Earnings View */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <h2 className="text-lg sm:text-xl font-semibold">Earnings & Payments</h2>
              </div>
            </div>

            {/* Commission Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Commission Structure</p>
                  <p className="text-sm text-blue-700 mt-1">
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
                    <Banknote className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1" data-testid="available-balance">
                    {earningsLoading ? '...' : `$${(creatorBalanceData as any)?.data?.balance?.availableBalance || '0.00'}`}
                  </p>
                  <p className="text-xs text-gray-500">Ready to withdraw</p>
                </div>
              </div>

              {/* Pending Balance */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow" transition-all duration-300>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Balance</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1" data-testid="pending-balance">
                    {earningsLoading ? '...' : `$${(creatorBalanceData as any)?.data?.balance?.pendingBalance || '0.00'}`}
                  </p>
                  <p className="text-xs text-gray-500">Available on 5th</p>
                </div>
              </div>

              {/* Lifetime Earnings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow" transition-all duration-300>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Lifetime Earnings</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1" data-testid="total-earnings">
                    {earningsLoading ? '...' : `$${(creatorBalanceData as any)?.data?.balance?.lifetimeEarnings || '0.00'}`}
                  </p>
                  <p className="text-xs text-gray-500">Total earned (after commission)</p>
                </div>
              </div>

              {/* Total Withdrawn */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow" transition-all duration-300>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Withdrawn</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1" data-testid="total-withdrawn">
                    {earningsLoading ? '...' : `$${(creatorBalanceData as any)?.data?.balance?.totalWithdrawn || '0.00'}`}
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
              ) : (creatorBalanceData as any)?.data?.recentEarnings?.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-medium mb-2 text-gray-900">No Earnings Yet</h3>
                  <p className="text-sm text-gray-500">
                    Your earnings will appear here once you make sales from courses or products.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(creatorBalanceData as any)?.data?.recentEarnings?.map((earning: CreatorEarningEvent) => (
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
              )}
            </div>

            {/* Payment Methods & Payout Request */}
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

        {/* Purchases View */}
        {activeTab === 'purchases' && <PurchasesView onNavigate={handleCourseNavigation} />}

        {/* Downloads View */}
        {activeTab === 'downloads' && <DownloadsView />}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <h2 className="text-lg sm:text-2xl font-semibold">Class Calendar</h2>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Class
              </Button>
            </div>

            {/* Calendar Grid */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date();
                    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                    const startDate = new Date(firstDay);
                    startDate.setDate(startDate.getDate() - firstDay.getDay() + i);
                    const dayNumber = startDate.getDate();
                    const isCurrentMonth = startDate.getMonth() === date.getMonth();
                    const isToday = startDate.toDateString() === date.toDateString();
                    
                    // Check if this date has any appointments
                    const dayAppointments = appointments.filter((apt: Appointment) => {
                      const aptDate = new Date(apt.scheduledAt);
                      return aptDate.toDateString() === startDate.toDateString();
                    });
                    
                    const hasAppointments = dayAppointments.length > 0;
                    
                    return (
                      <div
                        key={i}
                        className={`p-2 h-10 flex flex-col items-center justify-center text-sm cursor-pointer rounded transition-colors relative
                          ${isCurrentMonth ? 'text-foreground hover:bg-accent' : 'text-muted-foreground'}
                          ${isToday ? 'bg-primary text-primary-foreground font-semibold' : ''}
                          ${hasAppointments && !isToday ? 'bg-blue-50 border border-blue-200' : ''}
                        `}
                        title={hasAppointments ? `${dayAppointments.length} appointment${dayAppointments.length > 1 ? 's' : ''}` : ''}
                        data-testid={`calendar-day-${startDate.getDate()}`}
                      >
                        <span>{dayNumber}</span>
                        {hasAppointments && (
                          <div className="w-1 h-1 bg-primary rounded-full mt-0.5" data-testid={`appointment-indicator-${startDate.getDate()}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-5 w-5" />
              <h2 className="text-lg sm:text-xl font-semibold">Teacher Settings</h2>
            </div>



            {/* Profile Settings */}
            <ProfileSettingsForm />

            {/* Payment Settings */}
            <PaymentMethodsCard user={user} />

            {/* Availability Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Availability & Schedule
                </CardTitle>
                <CardDescription>
                  Set your teaching hours and availability preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Available Time Zones</label>
                  <Select value={availabilityForm.timezone} onValueChange={handleTimezoneChange}>
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc-5">EST (UTC-5)</SelectItem>
                      <SelectItem value="utc-6">CST (UTC-6)</SelectItem>
                      <SelectItem value="utc-7">MST (UTC-7)</SelectItem>
                      <SelectItem value="utc-8">PST (UTC-8)</SelectItem>
                      <SelectItem value="utc+0">GMT (UTC+0)</SelectItem>
                      <SelectItem value="utc+1">CET (UTC+1)</SelectItem>
                      <SelectItem value="utc+5:30">IST (UTC+5:30)</SelectItem>
                      <SelectItem value="utc+8">CST (UTC+8)</SelectItem>
                      <SelectItem value="utc+9">JST (UTC+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Weekly Availability</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4" 
                          checked={availabilityForm.weeklyAvailability[day as keyof typeof availabilityForm.weeklyAvailability]}
                          onChange={() => handleDayToggle(day)}
                          data-testid={`checkbox-${day.toLowerCase()}`} 
                        />
                        <span className="text-sm">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Start Time</label>
                    <Input 
                      type="time" 
                      value={availabilityForm.startTime}
                      onChange={(e) => handleTimeChange('startTime', e.target.value)}
                      data-testid="input-start-time" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">End Time</label>
                    <Input 
                      type="time" 
                      value={availabilityForm.endTime}
                      onChange={(e) => handleTimeChange('endTime', e.target.value)}
                      data-testid="input-end-time" 
                    />
                  </div>
                </div>
                <Button 
                  className="w-full md:w-auto"
                  onClick={handleUpdateAvailability}
                  disabled={availabilityLoading}
                  data-testid="button-update-availability"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {availabilityLoading ? 'Updating...' : 'Update Availability'}
                </Button>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <WalletPage userRole="teacher" />
        )}

        {/* Receipts Tab */}
        {activeTab === 'receipts' && (
          <ReceiptsSection showTitle={true} />
        )}

        {/* Create Ad Tab */}
        {activeTab === 'create-ad' && (
          <MyAdsPage onNavigate={onNavigate} userRole="teacher" />
        )}

        {/* Buy Voucher Tab */}
        {activeTab === 'buy-voucher' && (
          <BuyVoucherSection onBack={() => setActiveTab("overview")} />
        )}

        {/* Announcements View */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              <h2 className="text-lg sm:text-xl font-semibold">Announcements</h2>
            </div>
            
            {/* Use the same AnnouncementFeed component that students use */}
            <AnnouncementFeed 
              userId={user?.userId || user?.id || ''} 
              showUnreadCount={true}
            />
          </div>
        )}

        {/* Community View */}
        {activeTab === 'community' && (
          <div className="h-[calc(100vh-140px)]">
            <CommunityChat />
          </div>
        )}

        {/* My Requests View */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
              <p className="text-gray-600">Pending appointment requests and calendar view</p>
            </div>

            {/* Calendar Grid */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Calendar View - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date();
                    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                    const startDate = new Date(firstDay);
                    startDate.setDate(startDate.getDate() - firstDay.getDay() + i);
                    const dayNumber = startDate.getDate();
                    const isCurrentMonth = startDate.getMonth() === date.getMonth();
                    const isToday = startDate.toDateString() === date.toDateString();
                    
                    // Check if this date has any appointments
                    const dayAppointments = appointments.filter((apt: Appointment) => {
                      const aptDate = new Date(apt.scheduledAt);
                      return aptDate.toDateString() === startDate.toDateString();
                    });
                    
                    const hasAppointments = dayAppointments.length > 0;
                    
                    return (
                      <div
                        key={i}
                        className={`p-2 h-10 flex flex-col items-center justify-center text-sm cursor-pointer rounded transition-colors relative
                          ${isCurrentMonth ? 'text-foreground hover:bg-accent' : 'text-muted-foreground'}
                          ${isToday ? 'bg-primary text-primary-foreground font-semibold' : ''}
                          ${hasAppointments && !isToday ? 'bg-blue-50 border border-blue-200' : ''}
                        `}
                        title={hasAppointments ? `${dayAppointments.length} appointment${dayAppointments.length > 1 ? 's' : ''}` : ''}
                        data-testid={`calendar-day-${startDate.getDate()}`}
                      >
                        <span>{dayNumber}</span>
                        {hasAppointments && (
                          <div className="w-1 h-1 bg-primary rounded-full mt-0.5" data-testid={`appointment-indicator-${startDate.getDate()}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Appointments</CardTitle>
                <CardDescription>Review and respond to student booking requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                      {appointments.filter((apt: Appointment) => apt.status === 'pending').length === 0 ? (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h4 className="font-medium mb-2">No Pending Requests</h4>
                          <p className="text-sm text-muted-foreground">
                            You don't have any pending appointment requests at the moment.
                          </p>
                        </div>
                      ) : (
                        appointments
                          .filter((appointment: Appointment) => appointment.status === 'pending')
                          .map((appointment: Appointment) => (
                            <div key={appointment.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow" transition-all duration-300 data-testid={`pending-appointment-${appointment.id}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">
                                      {appointment.studentName || 'Student'} - {appointment.subject || 'Class Session'}
                                    </span>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      Pending
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3 w-3" />
                                      <span>{formatAppointmentTime(appointment.scheduledAt)} - {appointment.duration} minutes</span>
                                    </div>
                                    {appointment.description && (
                                      <div className="flex items-start gap-2">
                                        <FileText className="h-3 w-3 mt-0.5" />
                                        <span>{appointment.description}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveAppointment(appointment.id)}
                                    className="bg-green-600 hover:bg-green-700" transition-all duration-300
                                    data-testid={`approve-appointment-${appointment.id}`}
                                  >
                                    <CheckmarkIcon size="sm" className="mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeclineAppointment(appointment.id)}
                                    className="text-primary border-red-200 hover:bg-primary/10" transition-all duration-300
                                    data-testid={`decline-appointment-${appointment.id}`}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        </main>
      </div>
    </div>
  );
}
