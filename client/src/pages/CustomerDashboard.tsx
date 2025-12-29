import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { openExternalUrl } from '@/lib/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAjaxState } from '@/hooks/useAjaxState';
import { AjaxStatus } from '@/components/ui/ajax-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import Logo from '@/components/Logo';
import { BannerAdDisplay } from '@/components/BannerAdDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useStripe, Elements, PaymentElement, CardElement, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { getStripePromise } from '@/lib/stripe';
import type { 
  ShopDashboardStats, 
  ShopPurchase, 
  ShopAd, 
  ShopMembership, 
  ShopMembershipPlan,
  ShopTransaction, 
  ShopSupportTicket,
  ShopWallet,
  ShopProfile
} from '@shared/schema';
import {
  Home,
  ShoppingBag,
  Megaphone,
  Crown,
  Wallet,
  HeadphonesIcon,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  Package,
  Plus,
  ChevronRight,
  Download,
  Calendar,
  MessageCircle,
  GraduationCap,
  Briefcase,
  Check,
  CreditCard,
  Eye,
  Receipt,
  Mail,
  Globe,
  Phone,
  Clock,
  Trash2,
  Loader2,
  BookOpen,
  LayoutGrid,
  Users,
  Gift,
  Key,
  ShoppingCart,
  CheckCircle2
} from 'lucide-react';
import { AjaxLoader, type AjaxOperation } from '@/components/ui/ajax-loader';
import VisitorHelpChat from '@/components/VisitorHelpChat';
import BillingPage from '@/components/BillingPage';
import MyAdsPage from './MyAdsPage';
import FreelancerPricingPlans from '@/components/FreelancerPricingPlans';
import FreelancerSignupBasic from './FreelancerSignupBasic';
import { SiPaypal } from 'react-icons/si';
import MyAds from '@/components/MyAds';
import { CoursesSection } from './StudentDashboard';
import CourseDetail from './CourseDetail';
import CoursePlayer from './CoursePlayer';
import { FindTalent } from './FindTalent';
import { PortfolioGallery } from './PortfolioGallery';
import ReceiptsSection from '@/components/ReceiptsSection';
import BuyVoucherSection from '@/components/BuyVoucherSection';
import ApiKeysPage from './ApiKeysPage';
import { ProductShop } from './ProductShop';


interface CustomerDashboardProps {
  onNavigate?: (page: string) => void;
  navigationOptions?: {
    tab?: string;
  };
}

type DashboardPage = 'home' | 'purchases' | 'downloads' | 'ads' | 'courses' | 'course-detail' | 'course-player' | 'marketplace' | 'portfolio-gallery' | 'service-orders' | 'membership' | 'wallet' | 'billing' | 'receipts' | 'support' | 'settings' | 'become-student' | 'become-freelancer' | 'create-ad' | 'buy-voucher' | 'api' | 'shop';

export default function CustomerDashboard({ onNavigate, navigationOptions }: CustomerDashboardProps) {
  const { user, profile, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activePage, setActivePage] = useState<DashboardPage>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Fetch user's membership to check for business plan
  const { data: membership } = useQuery<ShopMembership>({
    queryKey: ['/api/shop/membership'],
  });

  // Check if user has business plan (for API access)
  const hasBusinessPlan = membership?.plan === 'business';

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  // Auto-navigate to tab from navigation options
  useEffect(() => {
    if (navigationOptions?.tab) {
      const targetTab = navigationOptions.tab as DashboardPage;
      setActivePage(targetTab);
    }
  }, [navigationOptions?.tab]);

  // Handle DodoPay payment verification when returning from checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('payment_id');
    const paymentComplete = params.get('paymentComplete');
    const status = params.get('status');
    
    if (paymentId && (paymentComplete === 'true' || status === 'succeeded')) {
      console.log('🔄 Verifying DodoPay payment:', paymentId);
      
      // Call the verify endpoint to record the purchase
      fetch(`/api/dodopay/verify/${paymentId}`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ Payment verification result:', data);
          if (data.success) {
            // Refresh purchases and downloads data
            queryClient.invalidateQueries({ queryKey: ['/api/shop/purchases'] });
            queryClient.invalidateQueries({ queryKey: ['/api/digital-downloads'] });
            queryClient.invalidateQueries({ queryKey: ['/api/shop/dashboard/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
            queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
            
            // Navigate to downloads page to show the purchase
            setActivePage('downloads');
          }
        })
        .catch(err => {
          console.error('❌ Payment verification error:', err);
        })
        .finally(() => {
          // Clean up URL parameters
          const url = new URL(window.location.href);
          url.searchParams.delete('payment_id');
          url.searchParams.delete('paymentComplete');
          url.searchParams.delete('status');
          url.searchParams.delete('productType');
          url.searchParams.delete('itemId');
          window.history.replaceState({}, '', url.toString());
        });
    }
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setTimeout(async () => {
      await logout();
      onNavigate?.('shop-auth');
    }, 3000);
  };

  const handlePageChange = (page: DashboardPage) => {
    if (page === activePage) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActivePage(page);
      setIsTransitioning(false);
      setMobileMenuOpen(false);
    }, 150);
  };

  // Course navigation handler - intercepts course navigation to stay in dashboard
  const handleCourseNavigation = (target: string) => {
    console.log('🔀 CustomerDashboard handleCourseNavigation:', target);
    
    if (target.startsWith('course-detail-')) {
      const courseId = target.replace('course-detail-', '');
      setSelectedCourseId(courseId);
      handlePageChange('course-detail');
    } else if (target.startsWith('course-player-')) {
      const courseId = target.replace('course-player-', '');
      setSelectedCourseId(courseId);
      handlePageChange('course-player');
    } else if (target.startsWith('course/')) {
      const courseId = target.replace('course/', '');
      setSelectedCourseId(courseId);
      handlePageChange('course-detail');
    } else if (target === 'courses') {
      setSelectedCourseId(null);
      handlePageChange('courses');
    } else if (target === 'auth' || target === 'shop-auth') {
      // Handle auth navigation - this should redirect to main auth page
      onNavigate?.('shop-auth');
    } else if (target === 'student-dashboard' || target === 'customer-dashboard') {
      // Navigate back to dashboard home
      setSelectedCourseId(null);
      handlePageChange('home');
    } else if (target === 'course-creator') {
      // Navigate to course creator (external navigation)
      onNavigate?.(target);
    } else {
      // For any other navigation, use parent onNavigate if available
      console.log('🔀 Using parent onNavigate for:', target);
      onNavigate?.(target);
    }
  };

  // Back handler from course views
  const handleBackFromCourse = () => {
    setSelectedCourseId(null);
    handlePageChange('courses');
  };

  const navigation = [
    { id: 'home', name: 'Dashboard', icon: Home },
    { id: 'purchases', name: 'Purchases', icon: ShoppingBag },
    { id: 'downloads', name: 'Downloads', icon: Download },
    { id: 'shop', name: 'Explore Shop', icon: ShoppingCart },
    { id: 'ads', name: 'Advertising', icon: Megaphone },
    { id: 'courses', name: 'Courses', icon: BookOpen },
    { id: 'portfolio-gallery', name: 'Freelancer Works', icon: LayoutGrid },
    { id: 'marketplace', name: 'Find Freelancers', icon: Users },
    { id: 'service-orders', name: 'Service Orders', icon: Package },
    { id: 'buy-voucher', name: 'Buy Voucher', icon: Gift },
    { id: 'membership', name: 'Membership', icon: Receipt },
    { id: 'wallet', name: 'Wallet', icon: Wallet },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'receipts', name: 'Receipts', icon: Receipt },
    ...(hasBusinessPlan ? [{ id: 'api', name: 'API', icon: Key }] : []),
    { id: 'support', name: 'Support', icon: HeadphonesIcon },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const upgradeNavigation = [
    { id: 'become-freelancer', name: 'Become a Freelancer', icon: Briefcase },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <DashboardHome onNavigate={handlePageChange} userName={profile?.name} />;
      case 'purchases':
        return <PurchasesPage onNavigate={handleCourseNavigation} />;
      case 'downloads':
        return <DownloadsPage />;
      case 'ads':
        return <AdsPage onNavigateExternal={onNavigate} onNavigateInternal={handlePageChange} />;
      case 'create-ad':
        return (
          <div className="space-y-6">
            <MyAdsPage onNavigate={onNavigate} userRole="customer" />
          </div>
        );
      case 'courses':
        return <CoursesPage onNavigate={handleCourseNavigation} onPageChange={handlePageChange} />;
      case 'course-detail':
        return selectedCourseId ? (
          <CourseDetail 
            courseId={selectedCourseId}
            onNavigate={handleCourseNavigation}
            onBack={handleBackFromCourse}
            hideFooter={true}
          />
        ) : null;
      case 'course-player':
        return selectedCourseId ? (
          <CoursePlayer 
            courseId={selectedCourseId}
            onNavigate={handleCourseNavigation}
          />
        ) : null;
      case 'marketplace':
        return <FindTalent onNavigate={handleCourseNavigation} context="dashboard" />;
      case 'portfolio-gallery':
        return <PortfolioGallery onNavigate={handleCourseNavigation} context="dashboard" />;
      case 'service-orders':
        return <ServiceOrdersPage onNavigate={handleCourseNavigation} />;
      case 'membership':
        return <MembershipPage />;
      case 'wallet':
        return <WalletPage />;
      case 'billing':
        return <BillingPage />;
      case 'receipts':
        return <ReceiptsSection showTitle={true} />;
      case 'support':
        return <SupportPage />;
      case 'shop':
        return <ProductShop />;
      case 'settings':
        return <SettingsPage />;
      case 'become-student':
        return <BecomeStudentPage />;
      case 'become-freelancer':
        return <BecomeFreelancerPage />;
      case 'buy-voucher':
        return <BuyVoucherSection onBack={() => handlePageChange('home')} />;
      case 'api':
        return <ApiKeysPage />;
      default:
        return <DashboardHome onNavigate={handlePageChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40 pt-safe">
        <div>
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-gray-500 hover:text-gray-700 px-3 py-2" transition-all duration-300
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Logo size="md" type="customer" disableHomeNavigation={true} />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 px-8 py-3">{profile?.name || user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar - Fixed on desktop, mobile overlay - Hidden when viewing portfolio gallery */}
        <aside
          className={`${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } ${activePage === 'portfolio-gallery' ? 'lg:-translate-x-full' : 'lg:translate-x-0'} fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:top-16`}
        >
          <div className="flex flex-col h-full lg:h-[calc(100vh-4rem)]">
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto pt-20 lg:pt-5 pb-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id as DashboardPage)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                    data-testid={`button-nav-${item.id}`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                );
              })}

              <div className="pt-4 border-t border-gray-200">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Upgrade Your Account
                </p>
                {upgradeNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handlePageChange(item.id as DashboardPage)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-900 hover:bg-gray-50'
                      }`}
                      data-testid={`button-nav-${item.id}`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </nav>
            <div className="p-4 border-t border-gray-200 space-y-2 flex-shrink-0">
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
        </aside>

        {/* Main Content - Scrollable area with left margin for fixed sidebar */}
        <main className={`flex-1 ${activePage === 'portfolio-gallery' ? 'lg:ml-0' : 'lg:ml-64'} min-h-screen overflow-y-auto transition-all duration-300`}>
          <div className="p-6 lg:p-8">
            <div className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              {renderPage()}
            </div>
          </div>
        </main>
      </div>
      
      {/* Live Chat Widget - Always visible for customer service */}
      <VisitorHelpChat isAuthenticated={true} alwaysVisible={true} userRole={profile?.role} />
    </div>
  );
}

// Dashboard Home Page
function DashboardHome({ onNavigate, userName }: { onNavigate: (page: DashboardPage) => void; userName?: string }) {
  const { data: stats, isLoading } = useQuery<ShopDashboardStats>({
    queryKey: ['/api/shop/dashboard/stats'],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} data-testid={`skeleton-stat-${i}`}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Advertisement - Top of Dashboard */}
      <BannerAdDisplay placement="customer_dashboard" className="mb-6" />
      
      <div>
        <h2 className="font-bold text-gray-900 text-[19px]">
          {getGreeting()}{userName ? `, ${userName}` : ''}!
        </h2>
        <p className="text-gray-600 mt-1">Here's an overview of your account</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card data-testid="card-total-purchases">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Purchases
            </CardTitle>
            <ShoppingBag className="h-5 w-5 text-gray-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalPurchases || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Orders completed</p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-ads">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Campaigns
            </CardTitle>
            <Megaphone className="h-5 w-5 text-gray-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.activeAds || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Currently running</p>
          </CardContent>
        </Card>

        {stats?.membership && (
          <Card data-testid="card-membership-usage">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Membership Usage
              </CardTitle>
              <Receipt className="h-5 w-5 text-gray-900" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Plan: {stats.membership.planName} ({stats.membership.billingCycle})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Daily Downloads</p>
                  <div className="flex items-center gap-2">
                    <div className="text-base font-bold text-gray-900">
                      {stats.membership.dailyDownloadsUsed}/{stats.membership.dailyDownloadLimit === null ? '∞' : stats.membership.dailyDownloadLimit}
                    </div>
                  </div>
                </div>
                {stats.membership.monthlyPaidDownloadLimit && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Monthly Paid Downloads</p>
                    <div className="text-base font-bold text-gray-900">
                      {stats.membership.monthlyPaidDownloadsUsed}/{stats.membership.monthlyPaidDownloadLimit}
                    </div>
                  </div>
                )}
                {stats.membership.adLimit && stats.membership.billingCycle === 'yearly' && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Monthly Ad Credits</p>
                    <div className="text-base font-bold text-gray-900">
                      {stats.membership.adsCreatedThisMonth}/{stats.membership.adLimit}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button size="sm" className="justify-start bg-primary hover:bg-primary text-white" transition-all duration-300 data-testid="button-view-purchases" onClick={() => onNavigate('purchases')}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            View Purchases
          </Button>
          <Button size="sm" className="justify-start bg-primary hover:bg-primary text-white" transition-all duration-300 data-testid="button-create-ad" onClick={() => onNavigate('ads')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Ad
          </Button>
          <Button size="sm" className="justify-start bg-primary hover:bg-primary text-white" transition-all duration-300 data-testid="button-add-funds" onClick={() => onNavigate('wallet')}>
            <DollarSign className="h-4 w-4 mr-2" />
            Add Funds
          </Button>
          <Button size="sm" className="justify-start bg-primary hover:bg-primary text-white" transition-all duration-300 data-testid="button-contact-support" onClick={() => onNavigate('support')}>
            <HeadphonesIcon className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Order Slip Viewer Modal
function OrderSlipViewer({ 
  orderId, 
  isOpen, 
  onClose 
}: { 
  orderId: string; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { data: orderDetails, isLoading, error } = useQuery<{
    order: any;
    items: any[];
  }>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: isOpen && !!orderId,
  });

  console.log('OrderSlipViewer:', { orderId, isOpen, isLoading, hasData: !!orderDetails, error });

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-[#C4F03B] text-gray-900';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" data-testid="dialog-order-slip">
        <DialogHeader className="sr-only">
          <DialogTitle>Invoice</DialogTitle>
          <DialogDescription>
            View detailed invoice for your order
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        ) : orderDetails ? (
          <div className="bg-white" data-testid="order-slip-details">
            {/* Invoice Header - Clean White with Logo */}
            <div className="bg-white border-b-2 border-gray-200 px-8 py-6">
              <div className="flex justify-between items-start">
                <div className="max-w-md">
                  <Logo variant="wide" context="customer" className="h-24 w-auto mb-2" />
                  <p className="text-gray-600 text-sm">Edufiliova — Creativity, Learning, and Growth in One Place.</p>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-bold text-gray-900 mb-1">INVOICE</h1>
                  <p className="text-gray-600 text-sm">Order Receipt</p>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Invoice Info */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Invoice Details</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Invoice Number</p>
                      <p className="font-semibold text-gray-900" data-testid="text-order-id">
                        #{orderId.substring(0, 12).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date Issued</p>
                      <p className="font-medium text-gray-900" data-testid="text-order-date">
                        {formatDate(orderDetails.order.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge className={`${getStatusColor(orderDetails.order.status)} font-medium`} data-testid="badge-order-status">
                        {orderDetails.order.status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="font-medium text-gray-900 capitalize" data-testid="text-payment-method">
                        {orderDetails.order.paymentMethod || 'Stripe'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Currency</p>
                      <p className="font-medium text-gray-900">USD ($)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {orderDetails.order.shippingAddress && (
                <div className="mb-8 pb-6 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Shipping Address</h3>
                  <p className="text-sm text-gray-700" data-testid="text-shipping-address">
                    {orderDetails.order.shippingAddress}
                  </p>
                </div>
              )}

              {/* Line Items Table */}
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Order Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orderDetails.items.map((item: any, index: number) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors" transition-all duration-300 data-testid={`order-item-${index}`}>
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-900">{item.product?.name || 'Unknown Item'}</p>
                            {item.product?.description && (
                              <p className="text-xs text-gray-500 mt-1">{item.product.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right text-gray-700">
                            ${parseFloat(item.price).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-gray-900">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900 font-medium">
                        ${parseFloat(orderDetails.order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (0%)</span>
                      <span className="text-gray-900 font-medium">$0.00</span>
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-900 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-[#A0FAB2]" data-testid="text-total-amount">
                        ${parseFloat(orderDetails.order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Blue Background */}
              <div className="bg-[#4169E1] text-white px-8 py-6 -mx-8 -mb-6 mt-8">
                <div className="grid grid-cols-3 gap-6 text-xs mb-4">
                  <div>
                    <h4 className="font-semibold mb-2">Contact Us</h4>
                    <p className="mb-1 opacity-90 flex items-center gap-1.5">
                      <HeadphonesIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href="mailto:support@edufiliova.com" className="text-[#C4F03B] hover:underline" transition-all duration-300>
                        support@edufiliova.com
                      </a>
                    </p>
                    <p className="opacity-90 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href="mailto:payments@edufiliova.com" className="text-[#C4F03B] hover:underline" transition-all duration-300>
                        payments@edufiliova.com
                      </a>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Website</h4>
                    <a href="https://edufiliova.com" target="_blank" rel="noopener noreferrer" className="text-[#C4F03B] hover:underline opacity-90 flex items-center gap-1.5" transition-all duration-300>
                      <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>edufiliova.com</span>
                    </a>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Thank You!</h4>
                    <p className="opacity-90">We appreciate your business and look forward</p>
                    <p className="opacity-90">to serving you again.</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/20 text-center">
                  <p className="text-xs opacity-75">
                    This is an automated invoice. For questions or concerns, please contact{' '}
                    <a href="mailto:support@edufiliova.com" className="text-[#C4F03B] hover:underline" transition-all duration-300>
                      support@edufiliova.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Invoice not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Purchases Page
function PurchasesPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showAllPurchases, setShowAllPurchases] = useState(false);
  
  const { data: purchases, isLoading } = useQuery<ShopPurchase[]>({
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
      orderId: cp.id, // Use course purchase ID as order ID
      itemName: cp.courseTitle || 'Course Purchase',
      price: cp.amount,
      createdAt: cp.createdAt,
      type: 'course' as const,
      originalData: cp
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Generate available months from paid purchases only (exclude free items and subscription purchases)
  const availableMonths = allPurchases ? Array.from(
    new Set(
      allPurchases
        .filter(p => parseFloat(p.price) > 0) // Only include paid purchases
        .map(p => {
          const date = new Date(p.createdAt);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        })
    )
  ).sort((a, b) => b.localeCompare(a)) : [];

  // Filter purchases by selected month and exclude free items and subscription purchases
  const filteredPurchases = allPurchases?.filter(purchase => {
    // Exclude free items and items purchased with subscription (price is 0 or "0.00")
    if (parseFloat(purchase.price) === 0) return false;
    
    if (selectedMonth === 'all') return true;
    const date = new Date(purchase.createdAt);
    const purchaseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return purchaseMonth === selectedMonth;
  }) || [];

  const handleDownloadSlip = async (orderId: string) => {
    try {
      // Get session ID from localStorage for authentication
      const sessionId = localStorage.getItem('sessionId');
      
      const headers: Record<string, string> = {};
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch(`/api/orders/${orderId}/slip`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to download slip');
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-slip-${orderId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download order slip:', error);
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

  // Format month for display
  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const handleDownload = async (downloadToken: string, productName: string) => {
    try {
      // Use direct navigation to follow the redirect properly
      // This allows the browser to handle the download with correct file type
      window.location.href = `/download/${downloadToken}`;
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-bold text-gray-900">Purchase History</h2>
        
        {/* Month Filter */}
        {allPurchases && allPurchases.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="month-filter" className="text-sm text-gray-600 whitespace-nowrap">Filter by:</Label>
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
            <p className="text-gray-600">No purchases found for {formatMonthDisplay(selectedMonth)}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSelectedMonth('all')}
              data-testid="button-clear-filter"
            >
              View All Purchases
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {(showAllPurchases ? filteredPurchases : filteredPurchases.slice(0, 3)).map((purchase) => (
              <Card key={purchase.id} data-testid={`card-purchase-${purchase.id}`}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{purchase.itemName}</h3>
                        {purchase.type === 'course' && (
                          <Badge className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0">Course</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {purchase.type === 'shop' ? `Order #${purchase.orderId}` : 'Course Purchase'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${purchase.price}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    {purchase.type === 'shop' ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedOrderId(purchase.orderId)}
                          className="bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-full px-4 py-1 h-8 text-xs" transition-all duration-300
                          data-testid={`button-view-slip-${purchase.id}`}
                        >
                          <Receipt className="h-3 w-3 mr-1.5" />
                          View Slip
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => purchase.orderId && handleDownloadSlip(purchase.orderId)}
                          className="bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-full px-4 py-1 h-8 text-xs" transition-all duration-300
                          data-testid={`button-download-${purchase.id}`}
                        >
                          <Download className="h-3 w-3 mr-1.5" />
                          Download
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          const courseId = purchase.originalData.courseId;
                          if (courseId) {
                            window.history.pushState({}, '', `?page=course-player&courseId=${courseId}`);
                            onNavigate?.('course-player');
                          }
                        }}
                        className="bg-primary hover:bg-primary text-white font-medium rounded-full px-4 py-1 h-8 text-xs" transition-all duration-300
                        data-testid={`button-view-course-${purchase.id}`}
                      >
                        View Course
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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

      {/* Order Slip Viewer Modal */}
      <OrderSlipViewer
        orderId={selectedOrderId || ''}
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}

// Downloads Page
function DownloadsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: digitalDownloads, isLoading } = useQuery<any[]>({
    queryKey: ['/api/digital-downloads'],
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (optimized from 0)
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
            <Label htmlFor="status-filter" className="text-sm text-gray-600 whitespace-nowrap">Filter by:</Label>
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

// Service Orders Page - Track purchased freelancer services
function ServiceOrdersPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [, navigate] = useLocation();
  
  const { data, isLoading } = useQuery<{ orders: any[] }>({
    queryKey: ['/api/freelancer/orders/my-orders'],
    refetchOnMount: true,
    staleTime: 30 * 1000,
  });

  const orders = data?.orders || [];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending_payment: { label: 'Pending Payment', className: 'bg-yellow-100 text-yellow-800' },
      awaiting_requirements: { label: 'Awaiting Info', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', className: 'bg-purple-100 text-purple-800' },
      active: { label: 'Active', className: 'bg-green-100 text-green-800' },
      delivered: { label: 'Delivered', className: 'bg-teal-100 text-teal-800' },
      revision_requested: { label: 'Revision', className: 'bg-orange-100 text-orange-800' },
      completed: { label: 'Completed', className: 'bg-green-200 text-green-900' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
      refunded: { label: 'Refunded', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Service Orders</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Orders</h1>
          <p className="text-gray-600 text-sm">Track your purchased freelancer services</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/marketplace/services')}
          className="text-sm"
        >
          Browse Services
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-4">You haven't purchased any freelancer services yet.</p>
            <Button onClick={() => navigate('/marketplace/services')}>
              Browse Services
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card 
              key={order.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-gray-500">
                        Order #{order.id.slice(0, 8)}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">
                      {order.service?.title || 'Freelancer Service'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {order.packageType} Package
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      {order.deliveredAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          Delivered
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      ${parseFloat(order.amountTotal).toFixed(2)}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orders/${order.id}`);
                      }}
                    >
                      View Order
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

// Ads Page
function AdsPage({ onNavigateExternal, onNavigateInternal }: { onNavigateExternal?: (page: string) => void, onNavigateInternal?: (page: DashboardPage) => void }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <Megaphone className="h-5 w-5 text-blue-600" />
            Create Platform Banner Advertisement
          </CardTitle>
          <CardDescription>
            Create professional banner ads to reach students, teachers, and freelancers across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => onNavigateInternal?.('create-ad')}
            className="hover:bg-primary bg-[#1d4ed8] text-[#ffffff]" transition-all duration-300
            data-testid="button-create-banner-ad"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Banner Advertisement
          </Button>
        </CardContent>
      </Card>
      
      <MyAds userRole="customer" />
    </div>
  );
}

function CreateAdForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    campaignName: '',
    budget: '',
    targetAudience: '',
    adContent: '',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card data-testid="form-create-ad">
      <CardHeader>
        <CardTitle>Create New Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              required
              data-testid="input-campaign-name"
            />
          </div>
          <div>
            <Label htmlFor="budget">Budget ($)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              required
              data-testid="input-budget"
            />
          </div>
          <div>
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              required
              data-testid="input-target-audience"
            />
          </div>
          <div>
            <Label htmlFor="adContent">Ad Content</Label>
            <Textarea
              id="adContent"
              value={formData.adContent}
              onChange={(e) => setFormData({ ...formData, adContent: e.target.value })}
              required
              data-testid="textarea-ad-content"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                data-testid="input-start-date"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                data-testid="input-end-date"
              />
            </div>
          </div>
          <Button type="submit" data-testid="button-submit-ad">
            Create Campaign
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Courses Page
function CoursesPage({ onNavigate }: { onNavigate?: (page: string) => void; onPageChange?: (page: DashboardPage) => void }) {
  const { profile, loading } = useAuth();
  
  // Show loading state if auth is still loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  return <CoursesSection profile={profile} onNavigate={onNavigate} />;
}

// Old Courses Page code (kept for reference if needed)
function OldCoursesPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { data: coursesData, isLoading } = useQuery<{success: boolean; courses: any[]}>({
    queryKey: ['/api/course-creator/my-courses'],
  });
  
  const courses = coursesData?.courses || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Browse and access your enrolled courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Browse and access your enrolled courses</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!courses || courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No courses enrolled yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Start learning by browsing our course catalog</p>
              <Button 
                onClick={() => onNavigate?.('courses')} 
                className="bg-primary hover:bg-primary text-white" transition-all duration-300
                data-testid="button-explore-courses"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Explore Courses
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any, index: number) => (
                <Card key={course.courseId || index} className="hover:shadow-lg transition-shadow" transition-all duration-300 data-testid={`card-course-${index}`}>
                  {course.thumbnailUrl && (
                    <div className="aspect-video bg-gray-100 overflow-hidden rounded-t-lg">
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-base">{course.title || 'Untitled Course'}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {course.authorName && (
                      <div className="flex items-center text-sm text-gray-600">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        {course.authorName}
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{course.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        window.history.pushState({}, '', `?page=course-player&courseId=${course.courseId}`);
                        onNavigate?.('course-player');
                      }}
                      className="w-full bg-primary hover:bg-primary text-white" transition-all duration-300
                      size="sm"
                      data-testid={`button-continue-course-${index}`}
                    >
                      {(course.progress && course.progress > 0) ? 'Continue Learning' : 'Start Course'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learning Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BookOpen className="h-8 w-8 text-gray-900 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{courses?.length || 0}</p>
              <p className="text-sm text-gray-600">Enrolled Courses</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Check className="h-8 w-8 text-gray-900 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {courses?.filter((c: any) => c.progress === 100).length || 0}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-gray-900 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {courses?.filter((c: any) => c.progress > 0 && c.progress < 100).length || 0}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Membership Page
function MembershipPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ShopMembershipPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [upgradeCosts, setUpgradeCosts] = useState<{[key: string]: any}>({});
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);
  
  const { data: membership } = useQuery<ShopMembership>({
    queryKey: ['/api/shop/membership'],
  });

  const { data: plansData } = useQuery<ShopMembershipPlan[]>({
    queryKey: ['/api/shop/membership-plans'],
  });

  const { data: wallet } = useQuery<ShopWallet>({
    queryKey: ['/api/shop/wallet'],
  });

  // Fetch upgrade costs when membership or billing cycle changes
  useEffect(() => {
    if (membership && membership.renewalDate && plansData) {
      plansData.forEach(async (plan) => {
        if (plan.planId !== membership.plan && plan.planId !== 'free') {
          try {
            const response = await apiRequest('/api/shop/membership/calculate-upgrade', {
              method: 'POST',
              body: JSON.stringify({
                planId: plan.planId,
                billingCycle: billingCycle === 'monthly' ? 'monthly' : 'annual'
              })
            });
            
            if (response.success) {
              setUpgradeCosts(prev => ({
                ...prev,
                [plan.planId]: response.data
              }));
            }
          } catch (error) {
            console.error(`Error fetching upgrade cost for ${plan.planId}:`, error);
          }
        }
      });
    }
  }, [membership, billingCycle, plansData]);

  const upgradeMutation = useMutation({
    mutationFn: async ({ planId, billingCycle, paymentMethod }: { planId: string; billingCycle: string; paymentMethod: string }) => {
      const response = await apiRequest('/api/shop/membership/upgrade', {
        method: 'POST',
        body: JSON.stringify({ planId, billingCycle, paymentMethod })
      });
      return response;
    },
    onSuccess: (data: any) => {
      if (data.paymentMethod === 'wallet') {
        queryClient.invalidateQueries({ queryKey: ['/api/shop/membership'] });
        queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
        queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet/transactions'] });
        setShowPaymentDialog(false);
      } else if (data.paymentMethod === 'card' && data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error.error || 'Failed to upgrade membership. Please try again.'
      });
    },
  });

  const handlePlanClick = (plan: ShopMembershipPlan) => {
    const price = parseFloat(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice);
    
    // Free plan doesn't need payment dialog
    if (plan.planId === 'free' || price === 0) {
      upgradeMutation.mutate({ 
        planId: plan.planId, 
        billingCycle: billingCycle === 'monthly' ? 'monthly' : 'yearly', 
        paymentMethod: 'wallet' 
      });
      return;
    }

    setSelectedPlan(plan);
    setPaymentMethod('wallet');
    setClientSecret(null);
    setShowPaymentDialog(true);
  };

  const handlePaymentMethodSubmit = () => {
    if (!selectedPlan) return;
    
    upgradeMutation.mutate({
      planId: selectedPlan.planId,
      billingCycle: billingCycle === 'monthly' ? 'monthly' : 'yearly',
      paymentMethod
    });
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      await apiRequest('/api/shop/membership/confirm-upgrade', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId })
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/shop/membership'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet/transactions'] });
      setShowPaymentDialog(false);
      setClientSecret(null);
    } catch (error: any) {
      if (error.alreadyProcessed) {
        queryClient.invalidateQueries({ queryKey: ['/api/shop/membership'] });
        setShowPaymentDialog(false);
        setClientSecret(null);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Failed to confirm payment. Please contact support.'
        });
      }
    }
  };

  const plans = plansData || [];

  const getDisplayPrice = (plan: ShopMembershipPlan) => {
    const monthly = parseFloat(plan.monthlyPrice || '0');
    const yearly = parseFloat(plan.yearlyPrice || '0') / 12;
    return billingCycle === 'monthly' ? monthly : yearly;
  };

  const getSavingsPercentage = (plan: ShopMembershipPlan) => {
    const monthly = parseFloat(plan.monthlyPrice || '0');
    const yearly = parseFloat(plan.yearlyPrice || '0') / 12;
    if (monthly === 0) return 0;
    return Math.round(((monthly - yearly) / monthly) * 100);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Upgrade Plan</h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
          Pricing plans are designed to meet your needs as you grow
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mx-auto max-w-2xl rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-blue-50 border border-blue-200' 
            : 'bg-primary/10 border border-red-200'
        }`} data-testid={`message-${message.type}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm ${
                message.type === 'success' ? 'text-blue-800' : 'text-primary-800'
              }`}>
                {message.text}
              </p>
            </div>
            <button 
              onClick={() => setMessage(null)}
              className={`flex-shrink-0 ${
                message.type === 'success' ? 'text-blue-600 hover:text-blue-800' : 'text-primary-600 hover:text-primary-800'
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Scheduled Plan Change Notice */}
      {membership?.scheduledPlan && membership?.scheduledPlanDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-auto max-w-2xl" data-testid="scheduled-plan-notice">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">Scheduled Plan Change</h3>
              <p className="text-sm text-blue-800 mt-1">
                Your plan will change to <strong>{plans.find(p => p.planId === membership.scheduledPlan)?.name}</strong> on{' '}
                <strong>{new Date(membership.scheduledPlanDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</strong>. You will continue to enjoy your current plan benefits until then.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center px-4">
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="button-billing-monthly"
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingCycle === 'annual'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="button-billing-annual"
          >
            Annual
            <span className="ml-2 text-xs bg-primary/90 text-white px-2 py-0.5 rounded-full">Save 50%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = membership?.plan === plan.planId;
          const displayPrice = getDisplayPrice(plan);
          const savings = getSavingsPercentage(plan);
          
          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                plan.popular ? 'border-purple-500 border-2 shadow-md' : ''
              } ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
              data-testid={`card-plan-${plan.planId}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                    Popular
                  </div>
                </div>
              )}

              <CardHeader className="space-y-4 pb-6">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                </div>

                <div className="space-y-1">
                  {upgradeCosts[plan.planId] && !isCurrentPlan ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-primary">
                          ${upgradeCosts[plan.planId].upgradeCost.toFixed(2)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          upgrade fee
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {upgradeCosts[plan.planId].daysRemaining} days credit: ${upgradeCosts[plan.planId].credit.toFixed(2)}
                        </p>
                        <p className="text-gray-500">
                          Then ${displayPrice.toFixed(0)}/month
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${displayPrice.toFixed(0)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        /month
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {isCurrentPlan ? (
                  <Button
                    disabled
                    className="w-full"
                    variant="outline"
                    data-testid={`button-current-plan-${plan.planId}`}
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePlanClick(plan)}
                    disabled={upgradeMutation.isPending}
                    className={`w-full ${
                      plan.planId === 'pro'
                        ? 'bg-primary hover:bg-primary/80 hover:shadow-xl hover:scale-105 text-white'
                        : plan.planId === 'business'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white'
                        : ''
                    }`}
                    variant={plan.planId === 'free' ? 'outline' : 'default'}
                    data-testid={`button-select-plan-${plan.planId}`}
                  >
                    {upgradeMutation.isPending ? 'Processing...' : (plan.planId === 'free' ? 'Get Started' : 'Select Plan')}
                  </Button>
                )}

                <div className="border-t pt-6">
                  <p className="text-sm font-semibold mb-4 text-gray-900">Features</p>
                  <p className="text-xs text-gray-600 mb-3">
                    {plan.planId === 'free' ? 'Essential features to get started' : 
                     plan.planId === 'creator' ? 'Everything in Free, plus' :
                     plan.planId === 'pro' ? 'Everything in Creator, plus' :
                     'Everything in Pro, plus'}
                  </p>
                  <ul className="space-y-3">
                    {(plan.features || []).map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-xs leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {billingCycle === 'annual' && (
        <div className="text-center text-sm text-gray-600 pt-2 sm:pt-4 px-4">
          <p>💰 Save up to 44% with annual billing</p>
        </div>
      )}

      {/* Payment Method Selection Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Choose your payment method to complete the upgrade
            </DialogDescription>
          </DialogHeader>

          {!clientSecret ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-1">Plan Details:</p>
                <p className="text-sm text-gray-700">{selectedPlan?.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${billingCycle === 'monthly' 
                    ? parseFloat(selectedPlan?.monthlyPrice || '0').toFixed(2)
                    : parseFloat(selectedPlan?.yearlyPrice || '0').toFixed(2)}
                  <span className="text-sm font-normal text-gray-600">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <Label>Select Payment Method</Label>
                
                {/* Wallet Payment Option */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'wallet'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('wallet')}
                  data-testid="option-payment-wallet"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'wallet' ? 'border-purple-600' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'wallet' && (
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Wallet Balance</p>
                        <p className="text-sm text-gray-600">
                          Available: ${wallet?.balance || '0.00'}
                        </p>
                      </div>
                    </div>
                    <Wallet className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  {(() => {
                    const actualCost = selectedPlan && upgradeCosts[selectedPlan.planId]?.upgradeCost !== undefined
                      ? upgradeCosts[selectedPlan.planId].upgradeCost
                      : parseFloat(billingCycle === 'monthly' ? selectedPlan?.monthlyPrice || '0' : selectedPlan?.yearlyPrice || '0');
                    return parseFloat(wallet?.balance || '0') < actualCost && (
                      <div className="mt-2 text-xs text-primary-600">
                        Insufficient balance. You need ${actualCost.toFixed(2)} but have ${parseFloat(wallet?.balance || '0').toFixed(2)}. Please add funds to your wallet or pay with card.
                      </div>
                    );
                  })()}
                </div>

                {/* Card Payment Option */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('card')}
                  data-testid="option-payment-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'card' ? 'border-purple-600' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'card' && (
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Credit/Debit Card</p>
                        <p className="text-sm text-gray-600">Secure payment via Stripe</p>
                      </div>
                    </div>
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                  disabled={upgradeMutation.isPending}
                  className="flex-1"
                  data-testid="button-cancel-upgrade"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePaymentMethodSubmit}
                  disabled={upgradeMutation.isPending || 
                    (paymentMethod === 'wallet' && parseFloat(wallet?.balance || '0') < (selectedPlan && upgradeCosts[selectedPlan.planId]?.upgradeCost !== undefined ? upgradeCosts[selectedPlan.planId].upgradeCost : parseFloat(billingCycle === 'monthly' ? selectedPlan?.monthlyPrice || '0' : selectedPlan?.yearlyPrice || '0')))}
                  className="flex-1"
                  data-testid="button-confirm-upgrade"
                >
                  {upgradeMutation.isPending ? 'Processing...' : 'Continue'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {clientSecret && stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <MembershipPaymentForm
                    amount={billingCycle === 'monthly' 
                      ? parseFloat(selectedPlan?.monthlyPrice || '0').toFixed(2)
                      : parseFloat(selectedPlan?.yearlyPrice || '0').toFixed(2)}
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => {
                      setShowPaymentDialog(false);
                      setClientSecret(null);
                    }}
                  />
                </Elements>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Embedded Payment Form Component
function EmbeddedPaymentForm({ amount, clientSecret, onSuccess, onCancel }: { amount: string; clientSecret: string; onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'paypal' | 'wallet'>('card');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card element not found');
        setIsLoading(false);
        return;
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (paymentError) {
        setError(paymentError.message || 'Payment failed. Please try again.');
        setIsLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded - confirm on backend and update wallet balance
        try {
          await apiRequest('/api/shop/wallet/confirm-payment', {
            method: 'POST',
            body: JSON.stringify({ paymentIntentId: paymentIntent.id })
          });
          
          queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
          queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet/transactions'] });
          onSuccess();
        } catch (confirmError: any) {
          // If already processed (409), still consider it success
          if (confirmError.status === 409 || confirmError.alreadyProcessed) {
            queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
            queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet/transactions'] });
            onSuccess();
          } else {
            setError('Payment succeeded but confirmation failed. Please contact support.');
            setIsLoading(false);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Add Funds to Wallet</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors" transition-all duration-300
          data-testid="button-close-modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Order Summary */}
        <div className="space-y-6">
          <h3 className="font-semibold text-lg">Transaction Summary</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Add Funds to Wallet</div>
                <div className="text-xs text-muted-foreground">Instant credit • One-time payment</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Amount</span>
              <span>${parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total due today</span>
              <span>${parseFloat(amount).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              ✓ Funds will be instantly added to your wallet
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Use your wallet balance for courses, subscriptions, and products
            </p>
          </div>
        </div>

        {/* Right Side - Payment Form */}
        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Payment method</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <button
                onClick={() => setSelectedMethod('card')}
                className={`p-3 border-2 rounded-lg transition-all ${
                  selectedMethod === 'card'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-card"
              >
                <CreditCard className="w-5 h-5 mx-auto" />
                <span className="text-xs mt-1 block">Card</span>
              </button>
              
              <button
                onClick={() => setSelectedMethod('paypal')}
                className={`p-3 border-2 rounded-lg transition-all ${
                  selectedMethod === 'paypal'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-paypal"
              >
                <img 
                  src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" 
                  alt="PayPal" 
                  className="h-8 mx-auto"
                />
                <span className="text-xs mt-1 block">PayPal</span>
              </button>

              <button
                onClick={() => setSelectedMethod('wallet')}
                className={`p-3 border-2 rounded-lg transition-all ${
                  selectedMethod === 'wallet'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-applepay"
              >
                <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span className="text-xs mt-1 block">Pay</span>
              </button>

              <button
                onClick={() => setSelectedMethod('wallet')}
                className={`p-3 border-2 rounded-lg transition-all ${
                  selectedMethod === 'wallet'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-googlepay"
              >
                <svg className="w-5 h-5 mx-auto" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                <span className="text-xs mt-1 block">G Pay</span>
              </button>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Payment information</h3>
            
            {selectedMethod === 'card' && (
              <>
                {/* Card Icons */}
                <div className="flex gap-2 mb-4">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                  <img src="https://www.americanexpress.com/content/dam/amex/us/merchant/supplies-uplift/product/images/4_Card_color_horizontal.png" alt="American Express Accepted Here" className="h-6" />
                </div>

                <div className="border rounded-xl p-4 bg-white dark:bg-gray-950">
                  <CardElement 
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                          iconColor: '#666EE8',
                        },
                        invalid: {
                          color: '#9e2146',
                          iconColor: '#fa755a',
                        },
                      },
                    }}
                  />
                </div>

                {error && (
                  <div className="bg-primary/10 text-primary-800 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }}
                  disabled={!stripe || isLoading}
                  className="w-full bg-[#6366f1] hover:bg-[#5558e3] text-white h-12 text-base font-semibold rounded-xl" transition-all duration-300
                  data-testid="button-complete-payment"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    <>Complete Payment</>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  🔒 Secure 256-bit SSL encrypted payment
                </p>
              </>
            )}

            {selectedMethod === 'paypal' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">You will be redirected to PayPal to complete your payment</p>
                <Button
                  disabled={isLoading}
                  className="w-full bg-[#0070ba] hover:bg-[#003087] text-white h-12 text-base font-semibold rounded-xl" transition-all duration-300
                  data-testid="button-paypal-checkout"
                >
                  {isLoading ? 'Redirecting...' : 'Continue with PayPal'}
                </Button>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Wallet payments (Apple Pay & Google Pay) are available when supported by your device and browser.
                </p>
                <div className="border rounded-xl p-4 bg-white dark:bg-gray-950">
                  <PaymentElement />
                </div>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }}
                  disabled={!stripe || isLoading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base font-semibold rounded-xl" transition-all duration-300
                  data-testid="button-wallet-pay"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    <>Pay with Wallet</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Membership Payment Form Component
function MembershipPaymentForm({ amount, clientSecret, onSuccess, onCancel }: { amount: string; clientSecret: string; onSuccess: (paymentIntentId: string) => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'paypal' | 'wallet'>('card');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card element not found');
        setIsLoading(false);
        return;
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (paymentError) {
        setError(paymentError.message || 'Payment failed. Please try again.');
        setIsLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Membership Upgrade</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors" transition-all duration-300
          data-testid="button-close-modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Order Summary */}
        <div className="space-y-6">
          <h3 className="font-semibold text-lg">Upgrade Summary</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <Crown className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Premium Membership</div>
                <div className="text-xs text-muted-foreground">Subscription • Recurring payment</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subscription</span>
              <span>${parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total due today</span>
              <span>${parseFloat(amount).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-800">
              ✓ Access to all premium features
            </p>
            <p className="text-xs text-primary mt-2">
              Billed monthly • Cancel anytime
            </p>
          </div>
        </div>

        {/* Right Side - Payment Form */}
        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Payment method</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <button
                onClick={() => setSelectedMethod('card')}
                className={`p-3 border-2 rounded-lg transition-all ${
                  selectedMethod === 'card'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-card"
              >
                <CreditCard className="w-5 h-5 mx-auto" />
                <span className="text-xs mt-1 block">Card</span>
              </button>
              
              <button
                onClick={() => setSelectedMethod('paypal')}
                className={`p-3 border-2 rounded-lg transition-all ${
                  selectedMethod === 'paypal'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-paypal"
              >
                <img 
                  src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" 
                  alt="PayPal" 
                  className="h-8 mx-auto"
                />
                <span className="text-xs mt-1 block">PayPal</span>
              </button>

              <button
                onClick={() => setSelectedMethod('wallet')}
                className={`p-3 border-2 rounded-lg transition-all ${
                  selectedMethod === 'wallet'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-applepay"
              >
                <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span className="text-xs mt-1 block">Pay</span>
              </button>

              <button
                onClick={() => setSelectedMethod('wallet')}
                className={`p-3 border-2 rounded-lg transition-all ${
                  selectedMethod === 'wallet'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid="button-method-googlepay"
              >
                <svg className="w-5 h-5 mx-auto" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                <span className="text-xs mt-1 block">G Pay</span>
              </button>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Payment information</h3>
            
            {selectedMethod === 'card' && (
              <>
                {/* Card Icons */}
                <div className="flex gap-2 mb-4">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                  <img src="https://www.americanexpress.com/content/dam/amex/us/merchant/supplies-uplift/product/images/4_Card_color_horizontal.png" alt="American Express Accepted Here" className="h-6" />
                </div>

                <div className="border rounded-xl p-4 bg-white dark:bg-gray-950">
                  <CardElement 
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                          iconColor: '#666EE8',
                        },
                        invalid: {
                          color: '#9e2146',
                          iconColor: '#fa755a',
                        },
                      },
                    }}
                  />
                </div>

                {error && (
                  <div className="bg-primary/10 text-primary-800 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }}
                  disabled={!stripe || isLoading}
                  className="w-full bg-[#6366f1] hover:bg-[#5558e3] text-white h-12 text-base font-semibold rounded-xl" transition-all duration-300
                  data-testid="button-complete-payment"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    <>Complete Upgrade</>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  🔒 Secure 256-bit SSL encrypted payment
                </p>
              </>
            )}

            {selectedMethod === 'paypal' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">You will be redirected to PayPal to complete your upgrade</p>
                <Button
                  disabled={isLoading}
                  className="w-full bg-[#0070ba] hover:bg-[#003087] text-white h-12 text-base font-semibold rounded-xl" transition-all duration-300
                  data-testid="button-paypal-checkout"
                >
                  {isLoading ? 'Redirecting...' : 'Continue with PayPal'}
                </Button>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Wallet payments (Apple Pay & Google Pay) are available when supported by your device and browser.
                </p>
                <div className="border rounded-xl p-4 bg-white dark:bg-gray-950">
                  <PaymentElement />
                </div>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }}
                  disabled={!stripe || isLoading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base font-semibold rounded-xl" transition-all duration-300
                  data-testid="button-wallet-pay"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    <>Pay with Wallet</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wallet Page
function WalletPage() {
  const [addAmount, setAddAmount] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [voucherCode, setVoucherCode] = useState('');
  const voucherAjax = useAjaxState();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  const { data: wallet } = useQuery<ShopWallet>({
    queryKey: ['/api/shop/wallet'],
  });

  const { data: transactions } = useQuery<ShopTransaction[]>({
    queryKey: ['/api/shop/wallet/transactions'],
  });

  // Generate available months from transactions
  const availableMonths = transactions ? Array.from(
    new Set(
      transactions.map(tx => {
        const date = new Date(tx.createdAt);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort((a, b) => b.localeCompare(a)) : [];

  // Filter transactions by selected month
  const filteredTransactions = transactions?.filter(tx => {
    if (selectedMonth === 'all') return true;
    const date = new Date(tx.createdAt);
    const txMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return txMonth === selectedMonth;
  }) || [];

  // Format month for display
  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest('/api/shop/wallet/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
      return response;
    },
    onSuccess: (data: any) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPaymentDialog(true);
      }
    },
  });

  const redeemVoucherMutation = useMutation({
    mutationFn: async (code: string) => {
      voucherAjax.setLoading('Redeeming voucher...');
      const response = await apiRequest('/api/shop/vouchers/redeem', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      return response;
    },
    onSuccess: (data: any) => {
      voucherAjax.setSuccess(`Successfully redeemed! $${data.amount} has been added to your wallet.`);
      setVoucherCode('');
      queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/wallet/transactions'] });
      setTimeout(() => voucherAjax.setIdle(), 5000);
    },
    onError: (error: any) => {
      voucherAjax.setError(error.message || "Unable to redeem voucher. Please check the code and try again.");
      setTimeout(() => voucherAjax.setIdle(), 5000);
    },
  });

  const handleAddFunds = () => {
    if (addAmount && parseFloat(addAmount) > 0) {
      createPaymentIntentMutation.mutate(addAmount);
    }
  };

  const handleRedeemVoucher = () => {
    if (voucherCode.trim()) {
      redeemVoucherMutation.mutate(voucherCode.trim().toUpperCase());
    } else {
      voucherAjax.setError("Please enter a voucher code.");
      setTimeout(() => voucherAjax.setIdle(), 3000);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setClientSecret(null);
    setAddAmount('');
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
    setClientSecret(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Wallet</h2>
      </div>
      <Card data-testid="card-wallet-balance">
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">My Wallet</span>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-lg px-3 py-1">
                ${wallet?.balance || '0.00'}
              </Badge>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                ✓ Use your wallet balance for purchases and subscriptions
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Add funds below to increase your balance
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                data-testid="input-add-funds"
              />
              <Button
                onClick={handleAddFunds}
                disabled={!addAmount || createPaymentIntentMutation.isPending}
                data-testid="button-add-funds"
                className="bg-primary text-white hover:bg-primary" transition-all duration-300
              >
                Add Funds
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card data-testid="card-voucher-redemption">
        <CardHeader>
          <CardTitle>Redeem Voucher</CardTitle>
          <CardDescription>Enter a voucher code to add funds to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter voucher code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleRedeemVoucher();
                  }
                }}
                data-testid="input-voucher-code"
                className="font-mono"
              />
              <Button
                onClick={handleRedeemVoucher}
                disabled={!voucherCode.trim() || voucherAjax.isLoading}
                data-testid="button-redeem-voucher"
                className="bg-primary text-white hover:bg-primary" transition-all duration-300
              >
                {voucherAjax.isLoading ? 'Redeeming...' : 'Redeem'}
              </Button>
            </div>
            <AjaxStatus 
              operation={voucherAjax.operation} 
              message={voucherAjax.message} 
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Transaction History</CardTitle>
            
            {/* Month Filter */}
            {transactions && transactions.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="wallet-month-filter" className="text-sm text-gray-600 whitespace-nowrap">Filter by:</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="wallet-month-filter" className="w-full sm:w-[200px]" data-testid="select-wallet-month-filter">
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
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No transactions found for {formatMonthDisplay(selectedMonth)}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMonth('all')}
                data-testid="button-clear-wallet-filter"
              >
                View All Transactions
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {(showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 3)).map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${tx.type === 'add_funds' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'add_funds' ? '+' : '-'}${tx.amount}
                      </p>
                      <Badge variant="secondary">{tx.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              {filteredTransactions.length > 3 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                    className="w-full"
                    data-testid="button-view-all-transactions"
                  >
                    {showAllTransactions ? 'Show Less' : `View All (${filteredTransactions.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Embedded Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-4xl">
          {clientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedPaymentForm 
                amount={addAmount}
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Support Page
function SupportPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const { data: tickets } = useQuery<ShopSupportTicket[]>({
    queryKey: ['/api/shop/support/tickets'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/shop/support/tickets', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/support/tickets'] });
      setShowCreateForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      apiRequest(`/api/shop/support/tickets/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ message }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/support/tickets'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Support Center</h2>
      </div>
      <Button
        onClick={() => setShowCreateForm(!showCreateForm)}
        data-testid="button-create-ticket"
        className="w-full sm:w-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Support Ticket
      </Button>
      {showCreateForm && (
        <CreateTicketForm 
          onSubmit={createMutation.mutate}
          isSubmitting={createMutation.isPending}
        />
      )}
      {/* Support Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Your Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {!tickets || tickets.length === 0 ? (
            <div className="py-12 text-center">
              <HeadphonesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No support tickets</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isExpanded={expandedTicket === ticket.id}
                  onToggle={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                  onReply={(message) => updateMutation.mutate({ id: ticket.id, message })}
                  isReplying={updateMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TicketCard({ 
  ticket, 
  isExpanded, 
  onToggle, 
  onReply,
  isReplying 
}: { 
  ticket: ShopSupportTicket;
  isExpanded: boolean;
  onToggle: () => void;
  onReply: (message: string) => void;
  isReplying: boolean;
}) {
  const [replyMessage, setReplyMessage] = useState('');

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyMessage.trim()) {
      onReply(replyMessage);
      setReplyMessage('');
    }
  };

  return (
    <div
      className="border rounded-lg p-6"
      data-testid={`card-ticket-${ticket.id}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{ticket.subject}</h3>
            <Badge
              variant={ticket.status === 'open' ? 'default' : 'secondary'}
              data-testid={`badge-ticket-status-${ticket.id}`}
            >
              {ticket.status}
            </Badge>
            <Badge variant="outline">{ticket.priority || 'medium'}</Badge>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Created: {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          data-testid={`button-toggle-ticket-${ticket.id}`}
        >
          {isExpanded ? 'Collapse' : 'View Details'}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">Your Message:</p>
          <p className="text-sm text-gray-700">{ticket.message}</p>
        </div>

        {isExpanded && (
          <>
            {ticket.adminReply && (
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-blue-700 mb-1">Support Team Response:</p>
                <p className="text-sm text-gray-700">{ticket.adminReply}</p>
                {ticket.updatedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Responded: {new Date(ticket.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <form onSubmit={handleReplySubmit} className="space-y-3">
                <div>
                  <Label htmlFor={`reply-${ticket.id}`}>Add a reply</Label>
                  <Textarea
                    id={`reply-${ticket.id}`}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={3}
                    data-testid={`textarea-reply-${ticket.id}`}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={isReplying || !replyMessage.trim()}
                  data-testid={`button-submit-reply-${ticket.id}`}
                >
                  {isReplying ? 'Sending...' : 'Send Reply'}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CreateTicketForm({ onSubmit, isSubmitting }: { onSubmit: (data: any) => void; isSubmitting?: boolean }) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      subject: '',
      message: '',
      category: 'general',
      priority: 'medium',
    });
  };

  return (
    <Card data-testid="form-create-ticket">
      <CardHeader>
        <CardTitle>Create Support Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              data-testid="input-ticket-subject"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="account">Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger data-testid="select-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={5}
              data-testid="textarea-ticket-message"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} data-testid="button-submit-ticket">
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Settings Page
function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<ShopProfile>({
    queryKey: ['/api/shop/profile'],
  });

  const { data: countries } = useQuery<Array<{id: number; name: string; code: string}>>({
    queryKey: ['/api/countries'],
  });

  const { data: detectedLocation } = useQuery<{country: string; city: string; region: string}>({
    queryKey: ['/api/location/detect'],
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/shop/profile', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/profile'] });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    phoneCountryCode: '+1',
    country: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        phoneCountryCode: (profile as any).phoneCountryCode || '+1',
        country: profile.country || '',
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        phoneCountryCode: (profile as any).phoneCountryCode || '+1',
        country: profile.country || '',
      });
    }
    setIsEditing(false);
  };

  const countryCodes = [
    { code: '+1', country: 'US/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+93', country: 'Afghanistan' },
    { code: '+355', country: 'Albania' },
    { code: '+213', country: 'Algeria' },
    { code: '+376', country: 'Andorra' },
    { code: '+244', country: 'Angola' },
    { code: '+54', country: 'Argentina' },
    { code: '+374', country: 'Armenia' },
    { code: '+61', country: 'Australia' },
    { code: '+43', country: 'Austria' },
    { code: '+994', country: 'Azerbaijan' },
    { code: '+973', country: 'Bahrain' },
    { code: '+880', country: 'Bangladesh' },
    { code: '+375', country: 'Belarus' },
    { code: '+32', country: 'Belgium' },
    { code: '+501', country: 'Belize' },
    { code: '+229', country: 'Benin' },
    { code: '+975', country: 'Bhutan' },
    { code: '+591', country: 'Bolivia' },
    { code: '+387', country: 'Bosnia' },
    { code: '+267', country: 'Botswana' },
    { code: '+55', country: 'Brazil' },
    { code: '+673', country: 'Brunei' },
    { code: '+359', country: 'Bulgaria' },
    { code: '+226', country: 'Burkina Faso' },
    { code: '+257', country: 'Burundi' },
    { code: '+855', country: 'Cambodia' },
    { code: '+237', country: 'Cameroon' },
    { code: '+238', country: 'Cape Verde' },
    { code: '+236', country: 'Central African Republic' },
    { code: '+235', country: 'Chad' },
    { code: '+56', country: 'Chile' },
    { code: '+86', country: 'China' },
    { code: '+57', country: 'Colombia' },
    { code: '+269', country: 'Comoros' },
    { code: '+242', country: 'Congo' },
    { code: '+506', country: 'Costa Rica' },
    { code: '+225', country: 'Ivory Coast' },
    { code: '+385', country: 'Croatia' },
    { code: '+53', country: 'Cuba' },
    { code: '+357', country: 'Cyprus' },
    { code: '+420', country: 'Czech Republic' },
    { code: '+45', country: 'Denmark' },
    { code: '+253', country: 'Djibouti' },
    { code: '+593', country: 'Ecuador' },
    { code: '+20', country: 'Egypt' },
    { code: '+503', country: 'El Salvador' },
    { code: '+240', country: 'Equatorial Guinea' },
    { code: '+291', country: 'Eritrea' },
    { code: '+372', country: 'Estonia' },
    { code: '+251', country: 'Ethiopia' },
    { code: '+679', country: 'Fiji' },
    { code: '+358', country: 'Finland' },
    { code: '+33', country: 'France' },
    { code: '+241', country: 'Gabon' },
    { code: '+220', country: 'Gambia' },
    { code: '+995', country: 'Georgia' },
    { code: '+49', country: 'Germany' },
    { code: '+233', country: 'Ghana' },
    { code: '+30', country: 'Greece' },
    { code: '+502', country: 'Guatemala' },
    { code: '+224', country: 'Guinea' },
    { code: '+245', country: 'Guinea-Bissau' },
    { code: '+592', country: 'Guyana' },
    { code: '+509', country: 'Haiti' },
    { code: '+504', country: 'Honduras' },
    { code: '+852', country: 'Hong Kong' },
    { code: '+36', country: 'Hungary' },
    { code: '+354', country: 'Iceland' },
    { code: '+91', country: 'India' },
    { code: '+62', country: 'Indonesia' },
    { code: '+98', country: 'Iran' },
    { code: '+964', country: 'Iraq' },
    { code: '+353', country: 'Ireland' },
    { code: '+972', country: 'Israel' },
    { code: '+39', country: 'Italy' },
    { code: '+81', country: 'Japan' },
    { code: '+962', country: 'Jordan' },
    { code: '+7', country: 'Kazakhstan' },
    { code: '+254', country: 'Kenya' },
    { code: '+965', country: 'Kuwait' },
    { code: '+996', country: 'Kyrgyzstan' },
    { code: '+856', country: 'Laos' },
    { code: '+371', country: 'Latvia' },
    { code: '+961', country: 'Lebanon' },
    { code: '+266', country: 'Lesotho' },
    { code: '+231', country: 'Liberia' },
    { code: '+218', country: 'Libya' },
    { code: '+370', country: 'Lithuania' },
    { code: '+352', country: 'Luxembourg' },
    { code: '+853', country: 'Macau' },
    { code: '+389', country: 'Macedonia' },
    { code: '+261', country: 'Madagascar' },
    { code: '+265', country: 'Malawi' },
    { code: '+60', country: 'Malaysia' },
    { code: '+960', country: 'Maldives' },
    { code: '+223', country: 'Mali' },
    { code: '+356', country: 'Malta' },
    { code: '+222', country: 'Mauritania' },
    { code: '+230', country: 'Mauritius' },
    { code: '+52', country: 'Mexico' },
    { code: '+373', country: 'Moldova' },
    { code: '+377', country: 'Monaco' },
    { code: '+976', country: 'Mongolia' },
    { code: '+382', country: 'Montenegro' },
    { code: '+212', country: 'Morocco' },
    { code: '+258', country: 'Mozambique' },
    { code: '+95', country: 'Myanmar' },
    { code: '+264', country: 'Namibia' },
    { code: '+977', country: 'Nepal' },
    { code: '+31', country: 'Netherlands' },
    { code: '+64', country: 'New Zealand' },
    { code: '+505', country: 'Nicaragua' },
    { code: '+227', country: 'Niger' },
    { code: '+234', country: 'Nigeria' },
    { code: '+47', country: 'Norway' },
    { code: '+968', country: 'Oman' },
    { code: '+92', country: 'Pakistan' },
    { code: '+970', country: 'Palestine' },
    { code: '+507', country: 'Panama' },
    { code: '+675', country: 'Papua New Guinea' },
    { code: '+595', country: 'Paraguay' },
    { code: '+51', country: 'Peru' },
    { code: '+63', country: 'Philippines' },
    { code: '+48', country: 'Poland' },
    { code: '+351', country: 'Portugal' },
    { code: '+974', country: 'Qatar' },
    { code: '+40', country: 'Romania' },
    { code: '+7', country: 'Russia' },
    { code: '+250', country: 'Rwanda' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+221', country: 'Senegal' },
    { code: '+381', country: 'Serbia' },
    { code: '+232', country: 'Sierra Leone' },
    { code: '+65', country: 'Singapore' },
    { code: '+421', country: 'Slovakia' },
    { code: '+386', country: 'Slovenia' },
    { code: '+252', country: 'Somalia' },
    { code: '+27', country: 'South Africa' },
    { code: '+82', country: 'South Korea' },
    { code: '+211', country: 'South Sudan' },
    { code: '+34', country: 'Spain' },
    { code: '+94', country: 'Sri Lanka' },
    { code: '+249', country: 'Sudan' },
    { code: '+597', country: 'Suriname' },
    { code: '+268', country: 'Swaziland' },
    { code: '+46', country: 'Sweden' },
    { code: '+41', country: 'Switzerland' },
    { code: '+963', country: 'Syria' },
    { code: '+886', country: 'Taiwan' },
    { code: '+992', country: 'Tajikistan' },
    { code: '+255', country: 'Tanzania' },
    { code: '+66', country: 'Thailand' },
    { code: '+228', country: 'Togo' },
    { code: '+216', country: 'Tunisia' },
    { code: '+90', country: 'Turkey' },
    { code: '+993', country: 'Turkmenistan' },
    { code: '+256', country: 'Uganda' },
    { code: '+380', country: 'Ukraine' },
    { code: '+971', country: 'UAE' },
    { code: '+598', country: 'Uruguay' },
    { code: '+998', country: 'Uzbekistan' },
    { code: '+58', country: 'Venezuela' },
    { code: '+84', country: 'Vietnam' },
    { code: '+967', country: 'Yemen' },
    { code: '+260', country: 'Zambia' },
    { code: '+263', country: 'Zimbabwe' },
  ];

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-[15px]">
        <h2 className="font-bold text-gray-900 text-[20px]">Account Settings</h2>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-[#0C332C] hover:bg-[#e64d2e] text-white" transition-all duration-300
            data-testid="button-edit-profile"
          >
            Edit Profile
          </Button>
        )}
      </div>
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="message-save-success">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">
              Your changes have been saved successfully!
            </p>
          </div>
        </div>
      )}
      {updateMutation.isError && (
        <div className="bg-primary/10 border border-red-200 rounded-lg p-4" data-testid="message-save-error">
          <div className="flex items-center gap-3">
            <X className="h-5 w-5 text-primary-600" />
            <p className="text-sm text-primary-800 font-medium">
              Failed to save changes. Please try again.
            </p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-6">
              <div>
                <Label className="text-gray-500 text-sm">Full Name</Label>
                <p className="text-gray-900 font-medium mt-1 text-[16px]" data-testid="text-full-name">
                  {profile?.fullName || 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">Email</Label>
                <p className="text-gray-900 font-medium mt-1 text-[16px]" data-testid="text-email">
                  {profile?.email || 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">Phone</Label>
                <p className="text-gray-900 font-medium mt-1 text-[16px]" data-testid="text-phone">
                  {profile?.phone ? `${(profile as any).phoneCountryCode || '+1'} ${profile.phone}` : 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">Location/Country</Label>
                <p className="text-gray-900 font-medium mt-1 text-[16px]" data-testid="text-country">
                  {profile?.country || (detectedLocation ? `${detectedLocation.city}, ${detectedLocation.country}` : 'Not set')}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  data-testid="input-full-name"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-email"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.phoneCountryCode}
                    onValueChange={(value) => setFormData({ ...formData, phoneCountryCode: value })}
                  >
                    <SelectTrigger className="w-[140px]" data-testid="select-phone-country-code">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.code} {item.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-phone"
                    placeholder="Enter your phone number"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="country">Location/Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger id="country" data-testid="select-country">
                    <SelectValue placeholder={
                      detectedLocation && !formData.country
                        ? `${detectedLocation.city}, ${detectedLocation.country}` 
                        : "Select your country"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map((country) => (
                      <SelectItem key={country.id} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {detectedLocation && !formData.country && (
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-detected: {detectedLocation.city}, {detectedLocation.country}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-primary hover:bg-primary text-white" transition-all duration-300
                  data-testid="button-save-settings"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <ReferralSection />
    </div>
  );
}

// Referral Section Component
function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const { data: stats, isLoading } = useQuery<{
    referralCode: string;
    referralLink: string;
    referralCount: number;
    earnedRewards: number;
    rewardThreshold: number;
    rewardAmount: number;
    referralsToNextReward: number;
  }>({
    queryKey: ['/api/shop/referral'],
  });

  const handleCopy = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="card-referral">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Refer Friends & Earn
          </CardTitle>
          <CardDescription>
            Loading referral information...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-testid="card-referral">
      <CardHeader>
        <CardTitle className="font-bold text-[#1F1E30] tracking-tight flex items-center gap-2 text-[17px]">
          <DollarSign className="h-5 w-5 text-[#fe5637]" />
          Refer Friends & Earn
        </CardTitle>
        <CardDescription>
          Refer 50 people and get $15 in your wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reward Progress */}
        <div className="bg-gradient-to-r from-[#fe5637]/10 to-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Referral Progress</span>
            <span className="text-sm font-bold text-[#fe5637]">
              {stats?.referralCount || 0} / {stats?.rewardThreshold || 50}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-[#fe5637] to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((stats?.referralCount || 0) / (stats?.rewardThreshold || 50)) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            {stats?.referralsToNextReward === 0
              ? '🎉 Congratulations! You\'ve earned a reward!'
              : `${stats?.referralsToNextReward} more referral${stats?.referralsToNextReward === 1 ? '' : 's'} to earn $${stats?.rewardAmount}`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-900" data-testid="text-referral-count">
              {stats?.referralCount || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">Total Referrals</p>
          </div>
          <div className="text-center p-4 bg-[#fe5637]/10 rounded-lg">
            <p className="text-lg font-bold text-[#fe5637]" data-testid="text-earned-rewards">
              ${stats?.earnedRewards || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">Earned Rewards</p>
          </div>
        </div>

        {/* Referral Link */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Your Referral Link
          </Label>
          <div className="flex gap-2">
            <Input
              value={stats?.referralLink || ''}
              readOnly
              className="flex-1 font-mono text-sm"
              data-testid="input-referral-link"
            />
            <Button
              onClick={handleCopy}
              className="bg-primary hover:bg-primary text-white" transition-all duration-300
              data-testid="button-copy-referral"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                'Copy'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Share this link with your friends. When 50 people sign up using your link, you'll earn $15!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Become a Student Page
function BecomeStudentPage() {
  const [formData, setFormData] = useState({
    gradeLevel: '',
    school: '',
    educationLevel: 'grade',
    country: '',
    interests: '',
  });
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

  const { data: countries } = useQuery<Array<{id: number; name: string; code: string}>>({
    queryKey: ['/api/countries'],
  });

  const { data: detectedLocation } = useQuery<{country: string; city: string; region: string}>({
    queryKey: ['/api/location/detect'],
  });

  // Fetch grade systems for the selected country
  const { data: gradeSystems } = useQuery<Array<{id: number; gradeNumber: number; displayName: string; educationLevel: string; ageRange: string}>>({
    queryKey: ['/api/grade-systems', selectedCountryId],
    queryFn: async () => {
      if (!selectedCountryId) return [];
      const response = await fetch(`/api/grade-systems/${selectedCountryId}`);
      const data = await response.json();
      return data.success ? data.data : [];
    },
    enabled: !!selectedCountryId,
  });

  // Auto-fill country when location is detected
  useEffect(() => {
    if (detectedLocation?.country && !formData.country && countries) {
      const detectedCountry = countries.find(c => c.name === detectedLocation.country);
      if (detectedCountry) {
        setFormData(prev => ({ ...prev, country: detectedCountry.name }));
        setSelectedCountryId(detectedCountry.id);
      }
    }
  }, [detectedLocation, formData.country, countries]);

  const upgradeMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/profile/upgrade-to-student', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      // Invalidate auth profile to trigger auto-routing to student dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });},
    onError: (error: any) => {
      console.error('Upgrade failed:', error);},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upgradeMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Become a Student</h2>
        <p className="text-gray-600 mt-1">
          Upgrade your account to access our learning platform, courses, and educational resources.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Student Registration Form
          </CardTitle>
          <CardDescription>
            Please provide the following information to complete your student profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="gradeLevel">Grade Level *</Label>
              <Select
                value={formData.gradeLevel}
                onValueChange={(value) => setFormData({ ...formData, gradeLevel: value })}
                required
              >
                <SelectTrigger data-testid="select-grade-level">
                  <SelectValue placeholder={selectedCountryId ? "Select your grade level" : "Select a country first"} />
                </SelectTrigger>
                <SelectContent>
                  {gradeSystems && gradeSystems.length > 0 ? (
                    gradeSystems.map((grade) => (
                      <SelectItem key={grade.id} value={grade.gradeNumber.toString()}>
                        {grade.displayName} {grade.ageRange && `(${grade.ageRange})`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Please select a country first</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedCountryId && gradeSystems && gradeSystems.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Showing education system for {formData.country}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="educationLevel">Education Level *</Label>
              <Select
                value={formData.educationLevel}
                onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
                required
              >
                <SelectTrigger data-testid="select-education-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade">Grade School (K-12)</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="school">School/Institution Name *</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="Enter your school or institution name"
                required
                data-testid="input-school"
              />
            </div>

            <div>
              <Label htmlFor="country">Country *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => {
                  const country = countries?.find(c => c.name === value);
                  setFormData({ ...formData, country: value, gradeLevel: '' });
                  setSelectedCountryId(country?.id || null);
                }}
                required
              >
                <SelectTrigger id="country" data-testid="select-country">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countries?.map((country) => (
                    <SelectItem key={country.id} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="interests">Subjects of Interest</Label>
              <Textarea
                id="interests"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                placeholder="Tell us about the subjects you're interested in learning (e.g., Mathematics, Science, Art)"
                rows={3}
                data-testid="textarea-interests"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Benefits of Student Account:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>✓ Access to educational courses and materials</li>
                <li>✓ Track your learning progress</li>
                <li>✓ Connect with teachers and tutors</li>
                <li>✓ Join study groups and communities</li>
                <li>✓ Keep your existing wallet, purchases, and advertising campaigns</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={upgradeMutation.isPending}
              className="w-full bg-primary hover:bg-primary text-white font-semibold" transition-all duration-300
              data-testid="button-upgrade-student"
            >
              {upgradeMutation.isPending ? 'Upgrading...' : 'Upgrade to Student Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Become a Freelancer Page
function BecomeFreelancerPage() {
  return (
    <div className="space-y-6">
      <FreelancerSignupBasic />
    </div>
  );
}
