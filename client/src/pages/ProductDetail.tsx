import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useGuestCart } from '@/hooks/useGuestCart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Download, 
  Heart,
  Check,
  Share,
  ChevronLeft,
  ArrowLeft,
  ShoppingCart,
  Search,
  User,
  ChevronDown,
  Grid,
  Layout,
  BookOpen,
  Image,
  Settings,
  GraduationCap,
  Clock,
  X,
  Wallet,
  CreditCard
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ShopMembership, ShopMembershipPlan, ShopWallet } from '@shared/schema';
import { GRADE_SUBSCRIPTION_PLANS } from '@shared/schema';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { getStripePromise } from '@/lib/stripe';

interface Product {
  id: string;
  name: string;
  description: string;
  type: 'digital' | 'physical';
  price: string;
  currency: string;
  images: string[];
  stock?: number;
  category: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  salesCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  freelancer: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    rating: number;
    reviewCount: number;
    verificationBadge?: 'none' | 'green' | 'blue';
  };
}

interface ShopCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

const getCategoryIcon = (name: string) => {
  const iconMap: Record<string, any> = {
    'digital_templates': Layout,
    'ebooks_guides': BookOpen,
    'graphics_media': Image,
    'software_tools': Settings,
    'course_bundles': GraduationCap,
    'all_categories': Grid
  };
  return iconMap[name] || Grid;
};

interface ProductDetailProps {
  onNavigate?: (page: string, customTransition?: string, data?: any) => void;
  productId?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function ProductDetail({ onNavigate = () => {}, productId: initialProductId, searchQuery = '', onSearchChange }: ProductDetailProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { 
    isGuestMode, 
    addToGuestCart, 
    getGuestCartCount 
  } = useGuestCart();
  const [productId, setProductId] = useState(initialProductId);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all_categories');

  const [pendingAddIds, setPendingAddIds] = useState<Set<string>>(new Set());
  const [pendingPurchaseIds, setPendingPurchaseIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadType, setDownloadType] = useState<'free' | 'membership' | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showStudentPricingModal, setShowStudentPricingModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [studentBillingCycle, setStudentBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradeCosts, setUpgradeCosts] = useState<{[key: string]: any}>({});
  const [studentUpgradeCosts, setStudentUpgradeCosts] = useState<{[key: string]: any}>({});
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ShopMembershipPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Load Stripe dynamically
  useEffect(() => {
    getStripePromise().then((stripe) => {
      if (stripe) {
        setStripePromise(Promise.resolve(stripe));
      }
    });
  }, []);

  // Refs for modal scroll containers
  const pricingModalScrollRef = useRef<HTMLDivElement>(null);
  const studentPricingModalScrollRef = useRef<HTMLDivElement>(null);

  // Update productId when initialProductId changes
  useEffect(() => {
    if (initialProductId && initialProductId !== productId) {
      setProductId(initialProductId);
      setCurrentImageIndex(0);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [initialProductId]);

  // Auto-scroll pricing modal to top when opened
  useEffect(() => {
    if (showPricingModal && pricingModalScrollRef.current) {
      pricingModalScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [showPricingModal]);

  // Auto-scroll student pricing modal to top when opened
  useEffect(() => {
    if (showStudentPricingModal && studentPricingModalScrollRef.current) {
      studentPricingModalScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [showStudentPricingModal]);

  // Fetch product details
  const { data: selectedProduct, isLoading } = useQuery<Product>({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      return data.data;
    },
    enabled: !!productId,
  });

  // Fetch shop categories
  const { data: categoriesData = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<ShopCategory[]>({
    queryKey: ['/api/shop-categories'],
    queryFn: async () => {
      try {
        if (user) {
          const authResponse = await apiRequest('/api/shop-categories');
          return authResponse.data || [];
        } else {
          const publicResponse = await fetch('/api/shop-categories/public');
          if (!publicResponse.ok) throw new Error('Failed to fetch public categories');
          const data = await publicResponse.json();
          return data.data || [];
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        return [];
      }
    }
  });

  const categories = [
    { 
      id: 'all_categories', 
      name: 'all_categories',
      displayName: 'All Categories', 
      description: 'Browse all available products',
      backgroundColor: 'bg-gradient-to-br from-gray-100 to-gray-200',
      textColor: 'text-gray-800',
      sortOrder: -1,
      isActive: true
    },
    ...categoriesData.filter(cat => cat.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  ];

  // Fetch cart items to check which products are in cart
  const { data: cartItemsData } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: async () => {
      if (user) {
        return await apiRequest('/api/cart');
      }
      return null;
    },
    staleTime: 30 * 1000, // Cache for 30 seconds (optimized from 5s polling)
    enabled: !!user,
  });

  // Fetch guest cart items for non-authenticated users
  const { data: guestCartData } = useQuery({
    queryKey: ['/guest-cart'],
    queryFn: async () => {
      const guestCart = JSON.parse(localStorage.getItem('guest_cart_items') || '[]');
      return guestCart;
    },
    staleTime: 5 * 1000, // Cache for 5 seconds (removed polling - localStorage doesn't need it)
    enabled: !user,
  });

  // Check if user can download this product with their membership
  const { data: membershipEligibility } = useQuery({
    queryKey: ['/api/shop/membership/can-download', productId],
    queryFn: async () => {
      if (!user || !productId) return null;
      try {
        const response = await apiRequest(`/api/shop/membership/can-download/${productId}`);
        return response;
      } catch (error) {
        return null;
      }
    },
    enabled: !!user && !!productId && !!selectedProduct && parseFloat(selectedProduct.price) > 0,
  });

  // Fetch cart count for authenticated users
  const { data: cartCountData } = useQuery({
    queryKey: ['/api/cart/count'],
    queryFn: async () => {
      return await apiRequest('/api/cart/count');
    },
    staleTime: 30 * 1000, // Cache for 30 seconds (optimized from 5s polling)
    enabled: !!user,
  });
  
  const cartCount = user ? (cartCountData?.count || 0) : getGuestCartCount();

  // Get product IDs that are in cart
  const productIdsInCart = new Set<string>(
    user 
      ? (cartItemsData?.items || []).map((item: any) => item.product?.id)
      : (guestCartData || []).map((item: any) => item.productId)
  );

  // Fetch similar products (same category, exclude current product)
  const { data: similarProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/similar', selectedProduct?.id, selectedProduct?.category],
    queryFn: async () => {
      if (!selectedProduct) return [];
      const params = new URLSearchParams();
      params.append('category', selectedProduct.category);
      params.append('excludeId', selectedProduct.id);
      params.append('limit', '12');
      
      const response = await fetch(`/api/products/approved?${params}`);
      if (!response.ok) return [];
      const data = await response.json();
      const products = (data.data || [])
        .filter((p: Product) => p.id !== selectedProduct.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);
      return products;
    },
    enabled: !!selectedProduct,
  });

  // Fetch product like stats (includes whether current user has liked)
  const { data: likeStatsData } = useQuery({
    queryKey: ['/api/products', selectedProduct?.id, 'like-stats'],
    queryFn: async () => {
      if (!selectedProduct) return null;
      try {
        const response = await apiRequest(`/api/products/${selectedProduct.id}/like-stats`);
        return response?.data || { likesCount: 0, likedByMe: false, likedBy: [] };
      } catch (error) {
        console.error('Error fetching like stats:', error);
        return { likesCount: 0, likedByMe: false, likedBy: [] };
      }
    },
    enabled: !!selectedProduct && !!user,
  });

  // Fetch seller follow stats (includes whether current user is following)
  const { data: followStatsData } = useQuery({
    queryKey: ['/api/sellers', selectedProduct?.freelancer?.id, 'follow-stats'],
    queryFn: async () => {
      if (!selectedProduct?.freelancer) return null;
      try {
        const response = await apiRequest(`/api/sellers/${selectedProduct.freelancer.id}/follow-stats`);
        return response?.data || { followersCount: 0, followingByMe: false, followers: [] };
      } catch (error) {
        console.error('Error fetching follow stats:', error);
        return { followersCount: 0, followingByMe: false, followers: [] };
      }
    },
    enabled: !!selectedProduct?.freelancer && !!user,
  });

  // Extract like and follow status
  const isLiked = likeStatsData?.likedByMe || false;
  const isFollowing = followStatsData?.followingByMe || false;

  // Fetch membership data for pricing modal
  const { data: membership } = useQuery<ShopMembership>({
    queryKey: ['/api/shop/membership'],
    enabled: !!user && (profile?.role === 'general' || profile?.role === 'freelancer'),
  });

  // Fetch membership plans for pricing modal
  const { data: plansData } = useQuery<ShopMembershipPlan[]>({
    queryKey: ['/api/shop/membership-plans'],
    enabled: !!user && (profile?.role === 'general' || profile?.role === 'freelancer'),
  });

  // Fetch wallet data for payment method selection
  const { data: wallet } = useQuery<ShopWallet>({
    queryKey: ['/api/shop/wallet'],
    enabled: !!user && (profile?.role === 'general' || profile?.role === 'freelancer'),
  });

  // Fetch upgrade costs when membership or billing cycle changes
  useEffect(() => {
    if (membership && membership.renewalDate && plansData && showPricingModal) {
      plansData.forEach(async (plan) => {
        if (plan.planId !== membership.plan && plan.planId !== 'free') {
          try {
            const response = await apiRequest('/api/shop/membership/calculate-upgrade', {
              method: 'POST',
              body: JSON.stringify({
                targetPlanId: plan.planId,
                billingCycle: billingCycle
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
  }, [membership, billingCycle, plansData, showPricingModal]);

  // Student subscription data
  const hasActiveStudentSubscription = profile?.role === 'student' && profile?.subscriptionTier && profile.subscriptionTier !== null;
  const currentStudentTier = profile?.subscriptionTier || null;

  // Fetch student upgrade costs when subscription or billing cycle changes
  useEffect(() => {
    if (hasActiveStudentSubscription && user && showStudentPricingModal) {
      const tiers: Array<keyof typeof GRADE_SUBSCRIPTION_PLANS> = ['elementary', 'high_school', 'college_university'];
      tiers.forEach(async (tier) => {
        if (tier !== currentStudentTier) {
          try {
            const response = await apiRequest(`/api/calculate-upgrade-cost`, {
              method: 'POST',
              body: JSON.stringify({
                targetTier: tier,
                billingCycle: studentBillingCycle
              })
            });
            
            const result = await response.json();
            if (result.success) {
              setStudentUpgradeCosts(prev => ({
                ...prev,
                [tier]: result.data
              }));
            }
          } catch (error) {
            console.error(`Error fetching student upgrade cost for ${tier}:`, error);
          }
        }
      });
    }
  }, [hasActiveStudentSubscription, currentStudentTier, studentBillingCycle, user, showStudentPricingModal]);

  // Mutation for student plan selection
  const studentPlanMutation = useMutation({
    mutationFn: async ({ tier, isUpgrade }: { tier: keyof typeof GRADE_SUBSCRIPTION_PLANS; isUpgrade: boolean }) => {
      const plan = GRADE_SUBSCRIPTION_PLANS[tier];
      const planPrice = isUpgrade && studentUpgradeCosts[tier] 
        ? studentUpgradeCosts[tier]!.upgradeCost 
        : plan.pricing[studentBillingCycle];
      
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: planPrice,
          planName: plan.name,
          billingCycle: studentBillingCycle,
          subscriptionTier: tier,
          userId: user?.id,
          isUpgrade: isUpgrade
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create payment intent");
      }

      return {
        clientSecret: result.clientSecret,
        amount: planPrice,
        planName: plan.name,
        tier: tier,
        billingCycle: studentBillingCycle,
        isUpgrade: isUpgrade,
        upgradeCostData: isUpgrade ? studentUpgradeCosts[tier] : null
      };
    },
    onSuccess: (checkoutData) => {
      onNavigate('checkout', 'slide-left', { checkoutData });
    },
    onError: (error: any) => {}
  });

  // Add to cart function - handles both authenticated and guest users
  const handleAddToCart = async (product: Product) => {
    if (user) {
      await apiRequest('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    } else {
      await addToGuestCart(product);
    }
  };

  // Add to cart mutation for the UI
  const addToCartMutation = useMutation({
    mutationFn: async ({ product }: { product: Product }) => {
      return await handleAddToCart(product);
    },
    onMutate: ({ product }) => {
      setPendingAddIds(prev => new Set(prev).add(product.id));
    },
    onSuccess: (data, { product }) => {
      setPendingAddIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/guest-cart'] });
    },
    onError: (error, { product }) => {
      setPendingAddIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  });

  // Quick purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest('/api/orders/purchase', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    },
    onMutate: (productId) => {
      setPendingPurchaseIds(prev => new Set(prev).add(productId));
    },
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl || '/checkout';
    },
    onSettled: (data, error, productId) => {
      setPendingPurchaseIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  });

  // Like/unlike product mutation
  const likeMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest(`/api/products/${productId}/like`, {
        method: 'POST',
      });
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['/api/products', productId, 'like-stats'] });
      const previousStats = queryClient.getQueryData(['/api/products', productId, 'like-stats']);
      queryClient.setQueryData(['/api/products', productId, 'like-stats'], (old: any) => ({
        ...old,
        likedByMe: !old?.likedByMe,
        likesCount: old?.likedByMe ? (old.likesCount - 1) : (old.likesCount + 1)
      }));
      return { previousStats };
    },
    onSuccess: (data, productId) => {
      if (data?.data) {
        queryClient.setQueryData(['/api/products', productId, 'like-stats'], (old: any) => ({
          ...old,
          likedByMe: data.data.liked,
          likesCount: data.data.likesCount
        }));
      }
      queryClient.invalidateQueries({ queryKey: ['/api/products/approved'] });
    },
    onError: (err, productId, context: any) => {
      if (context?.previousStats) {
        queryClient.setQueryData(['/api/products', productId, 'like-stats'], context.previousStats);
      }
    }
  });

  // Handle liking product
  const handleLike = async (product: Product) => {
    if (!user) {
      onNavigate?.('shop-auth', 'slide-left');
      return;
    }
    likeMutation.mutate(product.id);
  };

  // Follow/unfollow creator mutation
  const followMutation = useMutation({
    mutationFn: async (sellerId: string) => {
      return await apiRequest(`/api/sellers/${sellerId}/follow`, {
        method: 'POST',
      });
    },
    onMutate: async (sellerId) => {
      await queryClient.cancelQueries({ queryKey: ['/api/sellers', sellerId, 'follow-stats'] });
      const previousStats = queryClient.getQueryData(['/api/sellers', sellerId, 'follow-stats']);
      queryClient.setQueryData(['/api/sellers', sellerId, 'follow-stats'], (old: any) => ({
        ...old,
        followingByMe: !old?.followingByMe,
        followersCount: old?.followingByMe ? (old.followersCount - 1) : (old.followersCount + 1)
      }));
      return { previousStats };
    },
    onSuccess: (data, sellerId) => {
      if (data?.data) {
        queryClient.setQueryData(['/api/sellers', sellerId, 'follow-stats'], (old: any) => ({
          ...old,
          followingByMe: data.data.following,
          followersCount: data.data.followersCount
        }));
      }
      queryClient.invalidateQueries({ queryKey: ['/api/products/approved'] });
    },
    onError: (err, sellerId, context: any) => {
      if (context?.previousStats) {
        queryClient.setQueryData(['/api/sellers', sellerId, 'follow-stats'], context.previousStats);
      }
    }
  });

  // Handle following creator
  const handleFollow = async (creator: Product['freelancer']) => {
    if (!user) {
      onNavigate?.('shop-auth', 'slide-left');
      return;
    }
    followMutation.mutate(creator.id);
  };

  // Membership upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: async (data: { planId: string; billingCycle: string; paymentMethod: string }) => {
      const response = await apiRequest('/api/shop/membership/upgrade', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: (data) => {
      console.log('🔵 Upgrade API response:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/shop/membership'] });
      
      // Handle wallet payment success
      if (data.success && data.paymentMethod === 'wallet') {
        console.log('🔵 MODAL STATE 3: Wallet payment success - closing modal & invalidating cache');
        setShowPricingModal(false);
      } 
      // Handle card payment - show payment form in modal
      else if (data.success && data.paymentMethod === 'card' && data.clientSecret) {
        console.log('🔵 MODAL STATE 3: Card payment - showing payment form with clientSecret');
        setClientSecret(data.clientSecret);
      } 
      // Legacy checkout URL redirect
      else if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } 
      // Free plan - just close modal
      else {
        setShowPricingModal(false);
      }
    },
    onError: (error: any) => {}
  });

  // Handle plan selection
  const handlePlanClick = (plan: ShopMembershipPlan) => {
    console.log('🔵 MODAL STATE 1: Plan selected:', plan.planId);
    const price = parseFloat(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice);
    const billingCycleValue = billingCycle === 'monthly' ? 'monthly' : 'yearly';
    
    // Free plan uses wallet payment - no dialog needed
    if (plan.planId === 'free' || price === 0) {
      setSelectedPlan(plan);
      upgradeMutation.mutate({ 
        planId: plan.planId,
        billingCycle: billingCycleValue,
        paymentMethod: 'wallet'
      });
      return;
    }

    // For paid plans - set selected plan and reset payment states
    // This will trigger the modal to show payment method selection
    console.log('🔵 MODAL STATE 2: Opening payment method selection');
    setSelectedPlan(plan);
    setPaymentMethod('wallet');
    setClientSecret(null);
  };

  // Handle payment method submit
  const handlePaymentMethodSubmit = () => {
    if (!selectedPlan) return;
    
    console.log('🔵 Payment method selected:', paymentMethod, 'Calling /api/shop/membership/upgrade');
    const billingCycleValue = billingCycle === 'monthly' ? 'monthly' : 'yearly';
    upgradeMutation.mutate({
      planId: selectedPlan.planId,
      billingCycle: billingCycleValue,
      paymentMethod
    });
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      console.log('🔵 Payment succeeded, confirming with paymentIntentId:', paymentIntentId);
      await apiRequest('/api/shop/membership/confirm-upgrade', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId })
      });
      
      console.log('🔵 Payment confirmed - invalidating cache and closing modal');
      queryClient.invalidateQueries({ queryKey: ['/api/shop/membership'] });
      setShowPricingModal(false);
      setClientSecret(null);
      setSelectedPlan(null);
    } catch (error: any) {}
  };

  // Handle sharing product
  const handleShare = async (product: Product) => {
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    const shareData = {
      title: product.name,
      text: `Check out this ${product.type} product: ${product.name}`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (error) {
      // Silent fallback
    }
  };

  // Handle download actions (free)
  const handleDownloadFree = async () => {
    if (!selectedProduct) return;
    
    setIsDownloading(true);
    setDownloadMessage({ text: '', type: null });
    
    try {
      if (!user) {
        onNavigate('shop-auth', 'slide-left');
        return;
      }
      
      const response = await apiRequest('/api/shop/purchases/claim-free', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
        }),
      });

      setDownloadMessage({
        text: 'Item added to your account successfully! Redirecting to Downloads...',
        type: 'success'
      });

      if (response.data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = selectedProduct.name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Redirect to downloads page
      setTimeout(() => {
        onNavigate('customer-dashboard', 'slide-left', { tab: 'downloads' });
        setShowDownloadModal(false);
        setDownloadMessage({ text: '', type: null });
      }, 2000);
    } catch (error: any) {
      console.error('Claim error:', error);
      
      if (error?.message?.includes('Daily limit') || error?.message?.includes('limit reached')) {
        setDownloadMessage({
          text: 'Daily limit reached! Upgrade to Premium for unlimited downloads or try again tomorrow',
          type: 'error'
        });
        
        setTimeout(() => {
          onNavigate('customer-dashboard', 'slide-left', { tab: 'membership' });
          setShowDownloadModal(false);
          setDownloadMessage({ text: '', type: null });
        }, 3000);
      } else {
        const errorMessage = error?.message || 'Failed to claim item. Please try again.';
        setDownloadMessage({
          text: errorMessage,
          type: 'error'
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle download actions (membership)
  const handleDownloadMembership = async () => {
    if (!selectedProduct) return;
    
    setIsDownloading(true);
    setDownloadMessage({ text: '', type: null });
    
    try {
      if (!user) {
        onNavigate('shop-auth', 'slide-left');
        return;
      }
      
      const response = await apiRequest('/api/shop/purchases/claim-with-membership', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProduct.id,
        }),
      });

      setDownloadMessage({
        text: 'Downloaded with your membership successfully! Redirecting to Downloads...',
        type: 'success'
      });

      if (response.data?.downloadUrl) {
        window.location.href = response.data.downloadUrl;
      }

      // Redirect to downloads page
      setTimeout(() => {
        onNavigate('customer-dashboard', 'slide-left', { tab: 'downloads' });
        setShowDownloadModal(false);
        setDownloadMessage({ text: '', type: null });
      }, 2000);
    } catch (error: any) {
      console.error('Membership download error:', error);
      
      const errorMessage = error?.message || 'Failed to download. Please try again.';
      setDownloadMessage({
        text: errorMessage,
        type: 'error'
      });
      
      if (error?.upgradeRequired) {
        setTimeout(() => {
          onNavigate('customer-dashboard', 'slide-left', { tab: 'membership' });
          setShowDownloadModal(false);
          setDownloadMessage({ text: '', type: null });
        }, 3000);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} currentPage="product-detail" />
        <div className="px-4 pt-8 pb-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-200 rounded-lg" style={{ minHeight: '400px', maxHeight: '70vh' }} />
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-12 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} currentPage="product-shop" />
        <div className="px-4 pt-8 pb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Button onClick={() => onNavigate('product-shop')}>
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={onNavigate} currentPage="product-shop" />
      
      {/* Premium Navigation Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md shadow-sm">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Home Link */}
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
              onClick={() => onNavigate('home')}
              data-testid="link-home"
            >
              Home
            </Button>

            {/* Center Section: Categories and Search */}
            <div className="hidden lg:flex items-center gap-4 flex-1 justify-center mx-4">
              {/* Premium Category Navigation */}
              <div className="flex items-center gap-1">
                {!categoriesLoading && !categoriesError && categories.slice(0, 4).map((category) => {
                  const isSelected = selectedCategory === category.name;
                  const IconComponent = getCategoryIcon(category.name);
                  return (
                    <Button
                      key={category.id}
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className={`px-3 py-2 rounded-full font-medium text-sm transition-all duration-200 hover:scale-105 transform ${
                        isSelected 
                          ? 'text-gray-800' 
                          : 'text-gray-700 hover:text-gray-800'
                      }`}
                      style={isSelected ? {backgroundColor: '#b7f2b8'} : undefined}
                      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#b7f2b8')}
                      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => {
                        if (category.name === 'all_categories') {
                          onNavigate('product-shop');
                        } else {
                          onNavigate('product-shop', 'fade', { category: category.name });
                        }
                      }}
                      data-testid={`nav-category-${category.id}`}
                    >
                      {category.displayName}
                    </Button>
                  );
                })}
                
                {/* More Categories Dropdown for overflow */}
                {!categoriesLoading && !categoriesError && categories.length > 4 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 rounded-full font-medium text-sm text-gray-700 hover:text-gray-800 hover:scale-105 transform transition-all duration-200"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b7f2b8')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        data-testid="nav-more-categories"
                      >
                        More
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="flex flex-col gap-1">
                        {categories.slice(4).map((category) => {
                          const isSelected = selectedCategory === category.name;
                          return (
                            <Button
                              key={category.id}
                              variant={isSelected ? "default" : "ghost"}
                              size="sm"
                              className={`justify-start px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                isSelected 
                                  ? 'text-gray-800' 
                                  : 'text-gray-700 hover:text-gray-800'
                              }`}
                              style={isSelected ? {backgroundColor: '#b7f2b8'} : undefined}
                              onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#b7f2b8')}
                              onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                              onClick={() => {
                                if (category.name === 'all_categories') {
                                  onNavigate('product-shop');
                                } else {
                                  onNavigate('product-shop', 'fade', { category: category.name });
                                }
                              }}
                              data-testid={`nav-more-category-${category.id}`}
                            >
                              {category.displayName}
                            </Button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Search Products Input */}
              <div className="relative flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery || ''}
                    onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-full border-gray-300 bg-white/80 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    data-testid="input-search-products"
                  />
                </div>
              </div>
            </div>
            
            {/* Login & Cart - Desktop Only */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm border-gray-300 text-gray-700 transition-all duration-200 hover:scale-105 transform relative"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b7f2b8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => onNavigate('cart')}
                data-testid="button-cart"
              >
                <ShoppingCart className="h-4 w-4" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Button>
              
              {!user && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm text-white transition-all duration-200 hover:scale-105 transform" style={{backgroundColor: '#0C332C'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#e04a2a'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#0C332C'}
                  onClick={() => onNavigate('shop-auth')}
                  data-testid="button-login"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Category Selector, Cart & Login */}
            <div className="lg:hidden flex items-center gap-2">
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => {
                  const selectedCat = categories.find(cat => cat.name === value);
                  if (selectedCat?.name === 'all_categories') {
                    onNavigate('product-shop');
                  } else if (selectedCat) {
                    onNavigate('product-shop', 'fade', { category: selectedCat.name });
                  }
                }}
              >
                <SelectTrigger className="w-32 bg-white border-gray-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Mobile Cart Button */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 px-2 py-2 rounded-full font-medium text-sm border-gray-300 text-gray-700 transition-all duration-200 relative"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b7f2b8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => onNavigate('cart')}
                data-testid="button-cart-mobile"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Button>
              
              {/* Mobile Login Button */}
              {!user && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1 px-3 py-2 rounded-full font-medium text-sm text-white transition-all duration-200" style={{backgroundColor: '#0C332C'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#e04a2a'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#0C332C'}
                  onClick={() => onNavigate('shop-auth')}
                  data-testid="button-login-mobile"
                >
                  <User className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-20 right-4 z-[9999] p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="px-4 md:px-8 pt-4 md:pt-8 pb-4 md:pb-8 flex-1">
        {/* Breadcrumb Only */}
        <div className="mb-3 md:mb-4 px-2 md:px-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <button 
              onClick={() => onNavigate('product-shop')}
              className="hover:text-gray-700 transition-colors"
            >
              Shop
            </button>
            <span>/</span>
            <button 
              onClick={() => onNavigate('product-shop', 'fade', { category: selectedProduct.category })}
              className="capitalize hover:text-gray-700 transition-colors"
            >
              {selectedProduct.category?.replace(/_/g, ' ')}
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium font-['StackSans_Headline']">{selectedProduct.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-4 items-start">
          {/* Left Side - Product Images */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden relative">
            
            {/* Horizontal Scrollable Image Gallery - 3:4 ratio, 1 image visible on mobile */}
            <div 
              id="image-gallery"
              className="flex gap-2 md:gap-3 overflow-x-auto p-2 md:p-3 snap-x snap-mandatory scrollbar-hide justify-center lg:justify-start" 
              style={{ scrollbarWidth: 'none' }}
            >
              {selectedProduct.images && selectedProduct.images.map((image, index) => (
                <div 
                  key={index}
                  className="flex-shrink-0 snap-center md:snap-start bg-gray-50 rounded-lg overflow-hidden w-[calc(100%-16px)] md:w-auto"
                  style={{ 
                    aspectRatio: '3/4',
                    maxWidth: window.innerWidth < 768 ? 'calc(100% - 16px)' : 'clamp(240px, 45vw, 360px)'
                  }}
                >
                  <img 
                    src={image}
                    alt={`${selectedProduct.name} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    data-testid={`gallery-image-${index}`}
                  />
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows */}
            {selectedProduct.images && selectedProduct.images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const gallery = document.getElementById('image-gallery');
                    if (gallery) {
                      const scrollAmount = window.innerWidth < 768 ? gallery.offsetWidth : gallery.offsetWidth * 0.45;
                      gallery.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-2 top-1/3 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center z-10 transition-all"
                  aria-label="Previous image"
                  data-testid="button-previous"
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
                </button>
                
                <button
                  onClick={() => {
                    const gallery = document.getElementById('image-gallery');
                    if (gallery) {
                      const scrollAmount = window.innerWidth < 768 ? gallery.offsetWidth : gallery.offsetWidth * 0.45;
                      gallery.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-2 top-1/3 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center z-10 transition-all"
                  aria-label="Next image"
                  data-testid="button-next"
                >
                  <svg className="h-5 w-5 md:h-6 md:w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Thumbnail Gallery */}
            {selectedProduct.images && selectedProduct.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto px-2 md:px-3 pb-2 md:pb-3 justify-center lg:justify-start">
                {selectedProduct.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const gallery = document.querySelector('.snap-x');
                      const imageElement = gallery?.children[index] as HTMLElement;
                      imageElement?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    }}
                    className="relative flex-shrink-0 w-16 h-20 rounded overflow-hidden transition-all border-2 border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100"
                    style={{ aspectRatio: '3/4' }}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product Description */}
            <div className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-sm font-semibold text-gray-900 mb-3">Product Description</div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedProduct.description || 'Add a new product to your shop. It will be submitted for review before going live.'}
              </p>
            </div>
          
            {/* Creator Info */}
            <div className="pt-4 md:pt-6 border-t border-gray-200 px-3 md:px-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 md:mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 md:h-12 md:w-12">
                    <AvatarImage src={selectedProduct.freelancer.avatarUrl || undefined} />
                    <AvatarFallback className="bg-gray-200">
                      {selectedProduct.freelancer.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-0.5">
                      <span className="font-semibold text-gray-900 text-sm md:text-base truncate">
                        {selectedProduct.freelancer.displayName || selectedProduct.freelancer.name}
                      </span>
                      {selectedProduct.freelancer.verificationBadge && selectedProduct.freelancer.verificationBadge !== 'none' && (
                        <span className="inline-flex flex-shrink-0 self-center">
                          {selectedProduct.freelancer.verificationBadge === 'blue' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3">
                              <g clipPath="url(#clip0_343_1428_product)">
                                <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                              </g>
                              <defs>
                                <clipPath id="clip0_343_1428_product">
                                  <rect width="24" height="24" fill="#fff" />
                                </clipPath>
                              </defs>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3">
                              <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">Author</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`ml-auto md:ml-2 h-8 px-3 md:h-9 md:px-4 ${
                      isFollowing 
                        ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
                    }`}
                    onClick={() => handleFollow(selectedProduct.freelancer)}
                    disabled={followMutation.isPending}
                    data-testid="button-follow"
                  >
                    {followMutation.isPending && (
                      <div className="animate-spin w-3 h-3 md:w-4 md:h-4 border-2 border-current border-t-transparent rounded-full md:mr-2" />
                    )}
                    <span className="hidden md:inline">{isFollowing ? 'Following' : 'Follow'}</span>
                    <span className="md:hidden text-xs">{isFollowing ? 'Following' : 'Follow'}</span>
                  </Button>
                </div>
                
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-8 px-2 md:h-9 md:px-3 ${
                      isLiked 
                        ? 'bg-primary/10 border-red-300 hover:bg-primary/100 text-primary-600' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
                    }`}
                    onClick={() => handleLike(selectedProduct)}
                    disabled={likeMutation.isPending}
                    data-testid="button-like"
                  >
                    {likeMutation.isPending ? (
                      <div className="animate-spin w-3 h-3 md:w-4 md:h-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Heart className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isLiked ? 'fill-red-600' : ''}`} />
                    )}
                    <span className="hidden md:inline ml-2">
                      {isLiked ? 'Liked' : 'Like'}
                      {likeStatsData?.likesCount > 0 && ` (${likeStatsData.likesCount})`}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-gray-300 hover:bg-gray-50 text-gray-900 h-8 px-2 md:h-9 md:px-3"
                    onClick={() => handleShare(selectedProduct)}
                    data-testid="button-share"
                  >
                    <Share className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden md:inline ml-2">Share</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Similar Products Section */}
            {similarProducts.length > 0 && (
              <div className="pt-4 md:pt-6 border-t border-gray-200 px-3 md:px-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Other Things You Might Like
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {similarProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group cursor-pointer"
                      onClick={() => {
                        onNavigate('product-detail', 'fade', { productId: product.id });
                      }}
                      data-testid={`similar-product-${product.id}`}
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                        <img
                          src={product.images?.[0] || ''}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 font-['StackSans_Headline']">
                        {product.name}
                      </h4>
                      <p className="text-base font-bold text-gray-900">
                        ${product.price}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Product Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
            <div className="space-y-4">
              {/* Price */}
              {parseFloat(selectedProduct.price) > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Price</div>
                  <div className="text-3xl font-bold text-gray-900">
                    ${selectedProduct.price} USD
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {selectedProduct.type === 'digital' && parseFloat(selectedProduct.price) === 0 ? (
                  <Button
                    className="w-full h-12 bg-[#151314] hover:bg-[#2a2728] font-medium text-white border-0"
                    onClick={() => {
                      setDownloadType('free');
                      setShowDownloadModal(true);
                    }}
                    disabled={isDownloading}
                    data-testid="button-download-free"
                  >
                    {isDownloading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span>Downloading...</span>
                      </div>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Free
                      </>
                    )}
                  </Button>
                ) : membershipEligibility?.canDownload && membershipEligibility?.method === 'membership' ? (
                  <Button
                    className="w-full h-12 bg-[#151314] hover:bg-[#2a2728] font-medium text-white border-0"
                    onClick={() => {
                      setDownloadType('membership');
                      setShowDownloadModal(true);
                    }}
                    disabled={isDownloading}
                    data-testid="button-download-with-membership"
                  >
                    {isDownloading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span>Downloading...</span>
                      </div>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download with Membership
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        if (selectedProduct) {
                          if (productIdsInCart.has(selectedProduct.id)) {
                            onNavigate('cart');
                          } else {
                            addToCartMutation.mutate({ product: selectedProduct });
                          }
                        }
                      }}
                      disabled={pendingAddIds.has(selectedProduct.id) || (selectedProduct.type === 'physical' && selectedProduct.stock === 0)}
                      className="w-full h-12 font-medium transition-all bg-[#c5f13c] hover:bg-[#a8cc32] text-gray-900"
                      data-testid="button-add-to-cart"
                    >
                      {pendingAddIds.has(selectedProduct.id) ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin mr-2" />
                          <span>Adding to Cart</span>
                        </div>
                      ) : productIdsInCart.has(selectedProduct.id) ? (
                        <div className="flex items-center justify-center text-gray-900">
                          <Check className="w-5 h-5 mr-2" />
                          <span>View Cart</span>
                        </div>
                      ) : (
                        'Add to Cart'
                      )}
                    </Button>
                    
                    {selectedProduct.type === 'digital' && (
                      <Button
                        className="w-full h-12 bg-[#2d5ddd] hover:bg-[#1e3d99] font-medium text-white border-0"
                        onClick={async () => {
                          if (selectedProduct) {
                            try {
                              if (!productIdsInCart.has(selectedProduct.id)) {
                                await addToCartMutation.mutateAsync({ product: selectedProduct });
                              }
                              
                              if (!user) {
                                onNavigate('shop-auth', 'slide-left');
                                return;
                              }
                              
                              const orderData = await apiRequest('/api/orders/checkout', {
                                method: 'POST',
                                body: JSON.stringify({
                                  paymentMethod: 'stripe',
                                }),
                              });
                              
                              const cartData = await apiRequest('/api/cart');
                              const orderDataWithCartItems = {
                                ...orderData,
                                cartItems: cartData?.data?.items || []
                              };
                              
                              onNavigate('checkout', 'slide-left', { 
                                orderData: orderDataWithCartItems,
                                amount: parseFloat(orderData.data.order.totalAmount || '0'),
                                courseName: 'Cart Items',
                                courseId: 'cart'
                              });
                            } catch (error) {
                              console.error('Checkout error:', error);
                            }
                          }
                        }}
                        disabled={pendingAddIds.has(selectedProduct.id)}
                        data-testid="button-download"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Product Specifications */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm font-semibold text-gray-900 mb-3">Product Specifications</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{selectedProduct.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{selectedProduct.category?.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Subscribe Section - Only show for customers and students who are not on highest tier */}
              {user && (profile?.role === 'general' || profile?.role === 'student') && (
                (profile?.role === 'general' && membership?.plan !== 'business') ||
                (profile?.role === 'student' && currentStudentTier !== 'college_university')
              ) && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="mb-3 text-center">
                    <p className="text-sm font-medium text-gray-700">
                      Why pay full price? Save 90% with Membership
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      // Check user role and show appropriate pricing modal
                      if (profile?.role === 'student') {
                        // Student users see student pricing modal
                        setShowStudentPricingModal(true);
                      } else if (profile?.role === 'general') {
                        // Customer users see customer pricing modal
                        setShowPricingModal(true);
                      }
                    }}
                    className="w-full h-12 font-medium bg-[#c5f13c] hover:bg-[#a8cc32] text-gray-900 rounded-2xl"
                    data-testid="button-subscribe-now"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {(!membership || membership.plan === 'free') && profile?.role === 'general' ? 'Subscribe now' : 
                     !hasActiveStudentSubscription && profile?.role === 'student' ? 'Subscribe now' : 'Upgrade now'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer onNavigate={onNavigate} />

      {/* Download Confirmation Modal */}
      <Dialog open={showDownloadModal} onOpenChange={(open) => {
        setShowDownloadModal(open);
        if (!open) {
          setDownloadMessage({ text: '', type: null });
          setDownloadType(null);
        }
      }}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-download-confirmation">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
              {downloadType === 'free' ? 'Download Free Item' : 'Download with Membership'}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              {downloadType === 'free' 
                ? 'This item will be added to your downloads. Click "Go to Downloads" to proceed and access your item.'
                : 'This item will be downloaded using your membership. Click "Go to Downloads" to proceed and access your item.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {/* Download Status Message */}
          {downloadMessage.text && (
            <div className={`mt-4 p-4 rounded-lg ${
              downloadMessage.type === 'success' 
                ? 'bg-[#2d5ddd] border border-[#2d5ddd]' 
                : 'bg-primary/10 border border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                downloadMessage.type === 'success' ? 'text-white' : 'text-primary-800'
              }`}>
                {downloadMessage.text}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              onClick={() => {
                if (downloadType === 'free') {
                  handleDownloadFree();
                } else if (downloadType === 'membership') {
                  handleDownloadMembership();
                }
              }}
              disabled={isDownloading || downloadMessage.type === 'success'}
              className="flex-1 h-12 bg-[#2d5ddd] hover:bg-[#2554cc] text-white font-semibold border-0 disabled:opacity-50"
              data-testid="button-confirm-download"
            >
              {isDownloading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Processing...</span>
                </div>
              ) : (
                'Go to Downloads'
              )}
            </Button>
            <Button
              onClick={() => {
                setShowDownloadModal(false);
                setDownloadType(null);
                setDownloadMessage({ text: '', type: null });
              }}
              disabled={isDownloading}
              variant="outline"
              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold disabled:opacity-50"
              data-testid="button-explore-more"
            >
              {downloadMessage.type === 'error' ? 'Close' : 'Explore More'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing Modal */}
      <Dialog open={showPricingModal} onOpenChange={(open) => {
        setShowPricingModal(open);
        if (!open) {
          console.log('🔵 MODAL CLOSED: Resetting all payment states');
          setSelectedPlan(null);
          setClientSecret(null);
          setPaymentMethod('wallet');
        }
      }}>
        <DialogContent ref={pricingModalScrollRef} className={`max-h-[90vh] overflow-y-auto ${!selectedPlan ? 'max-w-7xl' : 'w-[calc(100%-2rem)] sm:max-w-[500px]'} sm:rounded-2xl`} data-testid="dialog-pricing-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              {!selectedPlan 
                ? 'Unlock Premium Savings' 
                : clientSecret
                ? 'Complete Payment'
                : 'Choose Payment Type'
              }
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 mt-2">
              {!selectedPlan 
                ? 'Choose your perfect plan and save up to 90% on every purchase'
                : clientSecret
                ? `Complete your payment to upgrade to ${selectedPlan.name}`
                : 'Select your preferred payment method to proceed'
              }
            </DialogDescription>
          </DialogHeader>

          {!selectedPlan ? (
            <div className="space-y-4 mt-4">
            {/* Billing Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
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
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  data-testid="button-billing-annual"
                >
                  Annual
                  <span className="ml-1.5 text-[10px] bg-purple-700 text-white px-1.5 py-0.5 rounded-full">Save 50%</span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {(plansData || []).map((plan) => {
                const isCurrentPlan = membership?.plan === plan.planId;
                const displayPrice = billingCycle === 'monthly' 
                  ? parseFloat(plan.monthlyPrice || '0')
                  : parseFloat(plan.yearlyPrice || '0') / 12;
                
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
                        <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-medium">
                          Popular
                        </div>
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      <div className="space-y-0.5">
                        <h3 className="text-base font-semibold">{plan.name}</h3>
                        <p className="text-[11px] text-gray-600 leading-snug min-h-[32px]">
                          {plan.description}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        {upgradeCosts[plan.planId] && !isCurrentPlan ? (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-purple-600">
                                ${upgradeCosts[plan.planId].upgradeCost.toFixed(2)}
                              </span>
                              <span className="text-gray-500 text-xs">
                                upgrade fee
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-600 space-y-0.5">
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
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-2xl font-bold text-gray-900">
                              ${displayPrice.toFixed(0)}
                            </span>
                            <span className="text-gray-500 text-xs">
                              /month
                            </span>
                          </div>
                        )}
                      </div>

                      {isCurrentPlan ? (
                        <Button
                          disabled
                          className="w-full h-8 text-xs"
                          variant="outline"
                          data-testid={`button-current-plan-${plan.planId}`}
                        >
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePlanClick(plan)}
                          disabled={upgradeMutation.isPending}
                          className={`w-full h-8 text-xs ${
                            plan.planId === 'pro'
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : plan.planId === 'business'
                              ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white'
                              : ''
                          }`}
                          variant={plan.planId === 'free' ? 'outline' : 'default'}
                          data-testid={`button-select-plan-${plan.planId}`}
                        >
                          {upgradeMutation.isPending ? 'Processing...' : 
                           plan.planId === 'free' ? 'Get Started' : 
                           !membership || membership.plan === 'free' ? 'Subscribe' : 'Upgrade'}
                        </Button>
                      )}

                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold mb-2 text-gray-900">Features</p>
                        <ul className="space-y-1.5">
                          {(plan.features || []).map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5 text-sm">
                              <Check className="h-3.5 w-3.5 text-purple-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 text-[11px] leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {billingCycle === 'annual' && (
              <div className="text-center text-xs text-gray-600 pt-1">
                <p>💰 Save up to 50% with annual billing</p>
              </div>
            )}
          </div>
          ) : !clientSecret ? (
            <div className="space-y-6 mt-4">
              {/* Payment Method Tabs */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'wallet'
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                  data-testid="option-payment-wallet"
                >
                  <Wallet className="h-5 w-5" />
                  <span className="font-medium">Wallet</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                  data-testid="option-payment-card"
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Card</span>
                </button>
              </div>

              {/* Payment Content Area */}
              <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                {paymentMethod === 'wallet' ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${wallet?.balance || '0.00'}
                      </p>
                      <p className="text-sm text-gray-600">Available balance</p>
                    </div>
                    
                    {(() => {
                      const actualCost = upgradeCosts[selectedPlan.planId]?.upgradeCost !== undefined
                        ? upgradeCosts[selectedPlan.planId].upgradeCost
                        : parseFloat(billingCycle === 'monthly' ? selectedPlan.monthlyPrice || '0' : selectedPlan.yearlyPrice || '0');
                      return parseFloat(wallet?.balance || '0') < actualCost && (
                        <div className="bg-primary/10 border border-red-200 rounded-lg p-3 text-sm text-primary-700">
                          Insufficient balance. You need ${actualCost.toFixed(2)} but have ${parseFloat(wallet?.balance || '0').toFixed(2)}. Please add funds to your wallet or pay with card.
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600">Secure payment processing via Stripe</p>
                    </div>
                  </>
                )}

                {/* Plan Details */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Plan Details</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{selectedPlan.name}</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${billingCycle === 'monthly' 
                        ? parseFloat(selectedPlan.monthlyPrice || '0').toFixed(2)
                        : parseFloat(selectedPlan.yearlyPrice || '0').toFixed(2)}
                      <span className="text-sm font-normal text-gray-500">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Terms Notice */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    By proceeding with your payment, you agree to our terms and conditions. Your subscription will automatically renew unless cancelled.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4">
                <Button
                  onClick={handlePaymentMethodSubmit}
                  disabled={upgradeMutation.isPending || 
                    (paymentMethod === 'wallet' && parseFloat(wallet?.balance || '0') < (upgradeCosts[selectedPlan.planId]?.upgradeCost !== undefined ? upgradeCosts[selectedPlan.planId].upgradeCost : parseFloat(billingCycle === 'monthly' ? selectedPlan.monthlyPrice || '0' : selectedPlan.yearlyPrice || '0')))}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-base"
                  data-testid="button-confirm-payment-selection"
                >
                  {upgradeMutation.isPending ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {clientSecret && stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <MembershipPaymentForm
                    amount={billingCycle === 'monthly' 
                      ? parseFloat(selectedPlan.monthlyPrice || '0').toFixed(2)
                      : parseFloat(selectedPlan.yearlyPrice || '0').toFixed(2)}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => {
                      setSelectedPlan(null);
                      setClientSecret(null);
                    }}
                  />
                </Elements>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Pricing Modal */}
      <Dialog open={showStudentPricingModal} onOpenChange={setShowStudentPricingModal}>
        <DialogContent ref={studentPricingModalScrollRef} className="max-w-7xl max-h-[90vh] overflow-y-auto sm:rounded-2xl" data-testid="dialog-student-pricing-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-gray-900">Student Subscription Plans</DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 mt-2">
              Choose the perfect plan for your education level and unlock premium learning resources
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Billing Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setStudentBillingCycle('monthly')}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    studentBillingCycle === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  data-testid="button-student-billing-monthly"
                >
                  Monthly
                </button>
                <button
                  onClick={() => setStudentBillingCycle('yearly')}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    studentBillingCycle === 'yearly'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  data-testid="button-student-billing-yearly"
                >
                  Yearly
                  <span className="ml-1.5 text-[10px] bg-purple-700 text-white px-1.5 py-0.5 rounded-full">Save 50%</span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(GRADE_SUBSCRIPTION_PLANS).map(([tier, plan]) => {
                const isCurrentPlan = currentStudentTier === tier;
                const displayPrice = studentBillingCycle === 'monthly' 
                  ? plan.pricing.monthly
                  : plan.pricing.yearly / 12;
                const isUpgrade = !!(hasActiveStudentSubscription && tier !== currentStudentTier);
                
                return (
                  <Card
                    key={tier}
                    className={`relative overflow-hidden transition-all hover:shadow-lg ${
                      isCurrentPlan ? 'ring-2 ring-blue-500' : ''
                    }`}
                    data-testid={`card-student-plan-${tier}`}
                  >
                    <div className="p-4 space-y-3">
                      <div className="space-y-0.5">
                        <h3 className="text-base font-semibold">{plan.name}</h3>
                        <p className="text-[11px] text-gray-600 leading-snug min-h-[32px]">
                          {plan.description}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        {studentUpgradeCosts[tier] && isUpgrade ? (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-purple-600">
                                ${studentUpgradeCosts[tier].upgradeCost.toFixed(2)}
                              </span>
                              <span className="text-gray-500 text-xs">
                                upgrade fee
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-600 space-y-0.5">
                              <p className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {studentUpgradeCosts[tier].daysRemaining} days credit: ${studentUpgradeCosts[tier].credit.toFixed(2)}
                              </p>
                              <p className="text-gray-500">
                                Then ${displayPrice.toFixed(0)}/month
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-2xl font-bold text-gray-900">
                              ${displayPrice.toFixed(0)}
                            </span>
                            <span className="text-gray-500 text-xs">
                              /month
                            </span>
                          </div>
                        )}
                      </div>

                      {isCurrentPlan ? (
                        <Button
                          disabled
                          className="w-full h-8 text-xs"
                          variant="outline"
                          data-testid={`button-current-student-plan-${tier}`}
                        >
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          onClick={() => studentPlanMutation.mutate({ tier: tier as keyof typeof GRADE_SUBSCRIPTION_PLANS, isUpgrade })}
                          disabled={studentPlanMutation.isPending}
                          className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                          data-testid={`button-select-student-plan-${tier}`}
                        >
                          {studentPlanMutation.isPending ? 'Processing...' : 
                           !hasActiveStudentSubscription ? 'Subscribe' : 'Upgrade'}
                        </Button>
                      )}

                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold mb-2 text-gray-900">Features</p>
                        <ul className="space-y-1.5">
                          {plan.features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5 text-sm">
                              <Check className="h-3.5 w-3.5 text-purple-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 text-[11px] leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {studentBillingCycle === 'yearly' && (
              <div className="text-center text-xs text-gray-600 pt-1">
                <p>💰 Save up to 50% with yearly billing</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Membership Payment Form Component
function MembershipPaymentForm({ 
  amount, 
  onSuccess, 
  onCancel 
}: { 
  amount: string; 
  onSuccess: (paymentIntentId: string) => void; 
  onCancel: () => void; 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/customer-dashboard`,
        },
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <div className="bg-primary/10 text-primary-800 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
          data-testid="button-cancel-payment"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1"
          data-testid="button-confirm-payment"
        >
          {isLoading ? 'Processing...' : `Pay $${amount}`}
        </Button>
      </div>
    </form>
  );
}

export default ProductDetail;
