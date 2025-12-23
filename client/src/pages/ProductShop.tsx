import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { useGuestCart } from '@/hooks/useGuestCart';
import { ImageGallery } from '@/components/ImageGallery';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Logo from '@/components/Logo';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Star, 
  Package, 
  DollarSign,
  User,
  Users,
  Eye,
  Grid,
  List,
  Check,
  ExternalLink,
  Tag,
  Calendar,
  Palette,
  Image,
  Type,
  Smartphone,
  Monitor,
  Camera,
  Printer,
  Layers,
  Zap,
  Layout,
  BookOpen,
  Settings,
  GraduationCap,
  LogIn,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  Globe,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { filterCategories } from '@/data/filterCategories';

// Types
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
    verificationBadge?: 'blue' | 'green' | 'none' | null;
  };
}

type SortOption = 'recent' | 'popular' | 'price_low' | 'price_high' | 'rating';
type FilterType = 'all' | 'digital' | 'physical';
type ViewMode = 'grid' | 'list';

// Types for shop categories
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

// Default category icons mapping
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

interface ProductShopProps {
  onNavigate?: (page: string, customTransition?: string, data?: any) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  navigationData?: any;
}

export function ProductShop({ onNavigate = () => {}, searchQuery = '', onSearchChange, navigationData }: ProductShopProps = {}) {
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // Helper function to get the appropriate dashboard based on user role
  const getDashboardForRole = (): string => {
    if (!profile) return 'customer-dashboard';
    switch (profile.role) {
      case 'teacher': return 'teacher-dashboard';
      case 'freelancer': return 'freelancer-dashboard';
      case 'student': return 'student-dashboard';
      default: return 'customer-dashboard';
    }
  };
  
  // Only show login controls when auth is fully loaded and user is NOT logged in
  // This prevents showing login UI while auth is still checking the session
  const showLoginControls = !authLoading && !user;
  const { 
    isGuestMode, 
    addToGuestCart, 
    getGuestCartCount 
  } = useGuestCart();
  const [selectedCategory, setSelectedCategory] = useState<string>(navigationData?.category || 'all_categories');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [productType, setProductType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [pendingAddIds, setPendingAddIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  
  // New filter states
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [selectedCreatorName, setSelectedCreatorName] = useState<string | null>(null);
  
  // Ref for creators scroll container
  const creatorsScrollRef = useRef<HTMLDivElement>(null);
  
  const scrollCreators = (direction: 'left' | 'right') => {
    if (creatorsScrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = creatorsScrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      creatorsScrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };
  
  // Update selected category when navigation data changes
  useEffect(() => {
    if (navigationData?.category) {
      setSelectedCategory(navigationData.category);
    }
  }, [navigationData?.category]);
  
  // Real-time like/follow data disabled (database tables not available)

  // Fetch shop categories - cached for instant display
  const { data: categoriesData = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<ShopCategory[]>({
    queryKey: ['/api/shop-categories'],
    queryFn: async () => {
      try {
        // Try authenticated request first (for freelancers/teachers/admins who may have custom categories)
        if (user) {
          const authResponse = await apiRequest('/api/shop-categories');
          return authResponse.data || [];
        } else {
          // Use public endpoint for unauthenticated users
          const publicResponse = await fetch('/api/shop-categories/public');
          if (!publicResponse.ok) throw new Error('Failed to fetch public categories');
          const data = await publicResponse.json();
          return data.data || [];
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - categories rarely change
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    placeholderData: keepPreviousData, // Show previous data instantly while loading
  });

  // Add "All Categories" option and filter active categories only
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

  // Fetch approved products - cached for instant display
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products/approved', searchQuery, selectedCategory, selectedTags, productType, sortBy, [...selectedSubcategories].sort().join(','), selectedCreatorId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'all_categories') params.append('category', selectedCategory);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      if (productType !== 'all') params.append('type', productType);
      params.append('sort', sortBy);
      // Add subcategories filter
      if (selectedSubcategories.length > 0) params.append('subcategories', selectedSubcategories.join(','));
      // Add creator filter
      if (selectedCreatorId) params.append('seller', selectedCreatorId);
      
      const response = await fetch(`/api/products/approved?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes - products show instantly from cache
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    placeholderData: keepPreviousData, // Show previous data instantly while loading new data
  });

  // Extract available tags
  const availableTags = Array.from(new Set(products.flatMap(p => p.tags))).sort();

  // Fetch cart count for authenticated users
  const { data: cartCountData } = useQuery({
    queryKey: ['/api/cart/count'],
    queryFn: async () => {
      return await apiRequest('/api/cart/count');
    },
    staleTime: 30 * 1000, // Cache for 30 seconds (optimized from 5s polling)
    enabled: !!user, // Only fetch when user is authenticated
  });
  
  const cartCount = user ? (cartCountData?.count || 0) : getGuestCartCount();

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

  // Get product IDs that are in cart
  const productIdsInCart = new Set<string>(
    user 
      ? (cartItemsData?.items || []).map((item: any) => item.product?.id)
      : (guestCartData || []).map((item: any) => item.productId)
  );

  // Fetch featured creators - cached for instant display
  const { data: featuredCreators = [] } = useQuery({
    queryKey: ['/api/featured-creators'],
    queryFn: async () => {
      const response = await fetch('/api/featured-creators?limit=8');
      if (!response.ok) throw new Error('Failed to fetch featured creators');
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch default freelancer cover image - cached for instant display
  const { data: defaultCover } = useQuery({
    queryKey: ['/api/system-settings/freelancer-default-cover'],
    queryFn: async () => {
      const response = await fetch('/api/system-settings/freelancer-default-cover');
      if (!response.ok) return null;
      const data = await response.json();
      return data.url || null;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes - rarely changes
    gcTime: 30 * 60 * 1000,
  });


  // Add to cart function - handles both authenticated and guest users
  const handleAddToCart = async (product: Product) => {
    if (user) {
      // Authenticated user - use server cart
      await apiRequest('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    } else {
      // Guest user - use local cart
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


  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const ProductCard = ({ product }: { product: Product }) => {
    // Find the category object for this product
    const productCategory = categories.find(cat => cat.name === product.category);
    
    return (
      <Card 
        className="group cursor-pointer transition-all duration-300 overflow-hidden border border-gray-100 bg-white w-full"
        data-testid={`product-card-${product.id}`}
      >
        {/* Product Image - Click to navigate to detail page */}
        <div 
          className="aspect-[4/3] relative overflow-hidden bg-gray-50"
          onClick={() => onNavigate('product-detail', 'slide-left', { productId: product.id })}
        >
          <ImageGallery 
            images={product.images || []}
            productName={product.name}
            className="h-full w-full object-contain"
            disableLightbox={true}
            showDots={true}
          />
        </div>

        {/* Product Info */}
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Product Title */}
            <h3 
              className="font-bold text-base text-gray-900 line-clamp-2 leading-tight cursor-pointer font-['StackSans_Headline']"
              onClick={() => onNavigate('product-detail', 'slide-left', { productId: product.id })}
            >
              {product.name}
            </h3>
            
            {/* Category/Tags */}
            <div className="text-sm text-gray-600">
              {product.category && (
                <span className="capitalize">{product.category.replace(/_/g, ' ')}</span>
              )}
              {product.tags && product.tags.length > 0 && (
                <span>
                  {product.category && ', '}
                  {product.tags.slice(0, 2).join(', ')}
                </span>
              )}
            </div>

            {/* Add to Cart Button - Only show for paid products */}
            {parseFloat(product.price) > 0 && (
              <Button 
                className={`w-full font-medium transition-all ${
                  productIdsInCart.has(product.id)
                    ? 'text-gray-900 border-0'
                    : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
                style={productIdsInCart.has(product.id) ? { backgroundColor: '#b3db2d' } : undefined}
                onMouseEnter={(e) => productIdsInCart.has(product.id) && ((e.currentTarget as HTMLElement).style.backgroundColor = '#a0c928')}
                onMouseLeave={(e) => productIdsInCart.has(product.id) && ((e.currentTarget as HTMLElement).style.backgroundColor = '#b3db2d')}
                onClick={(e) => {
                  e.stopPropagation();
                  if (productIdsInCart.has(product.id)) {
                    onNavigate('cart');
                  } else {
                    addToCartMutation.mutate({ product });
                  }
                }}
                disabled={pendingAddIds.has(product.id) || (product.type === 'physical' && product.stock === 0)}
                data-testid={`button-cart-${product.id}`}
              >
                {pendingAddIds.has(product.id) ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mr-2" />
                    <span>Adding to Cart</span>
                  </div>
                ) : productIdsInCart.has(product.id) ? (
                  <div className="flex items-center justify-center text-gray-900">
                    <Check className="w-5 h-5 mr-2" />
                    <span>View Cart</span>
                  </div>
                ) : (
                  <>
                    <span className="text-lg mr-2">+</span>
                    Add to Cart
                  </>
                )}
              </Button>
            )}

            {/* More like this link - Navigate to category */}
            <button 
              className="w-full text-left text-sm text-gray-600 hover:text-gray-900 flex items-center justify-between group" transition-all duration-300
              onClick={(e) => {
                e.stopPropagation();
                if (productCategory && onNavigate) {
                  onNavigate('category-detail', 'slide-left', { categoryId: productCategory.id });
                }
              }}
            >
              <span>Explore More</span>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors" transition-all duration-300>→</span>
            </button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProductListItem = ({ product }: { product: Product }) => {
    // Find the category object for this product
    const productCategory = categories.find(cat => cat.name === product.category);
    
    return (
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer" transition-all duration-300 
        data-testid={`product-list-${product.id}`}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4">
            {/* Thumbnail - Click to navigate to detail page */}
            <div 
              className="w-20 sm:w-28 flex-shrink-0"
              onClick={() => onNavigate('product-detail', 'slide-left', { productId: product.id })}
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-gray-50 rounded">
                <ImageGallery 
                  images={product.images || []}
                  productName={product.name}
                  className="h-full w-full object-contain"
                  disableLightbox={true}
                  showDots={true}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <h3 
                  className="font-bold text-gray-900 line-clamp-2 text-xs sm:text-sm cursor-pointer font-['StackSans_Headline']"
                  onClick={() => onNavigate('product-detail', 'slide-left', { productId: product.id })}
                >
                  {product.name}
                </h3>
              </div>
              
              {/* Category/Tags */}
              <div className="text-xs sm:text-sm text-gray-600 mb-3">
                {product.category && (
                  <span className="capitalize">{product.category.replace(/_/g, ' ')}</span>
                )}
                {product.tags && product.tags.length > 0 && (
                  <span>
                    {product.category && ', '}
                    {product.tags.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>
              
              {/* Action Buttons - Only show for paid products */}
              <div className="flex gap-2">
                {parseFloat(product.price) > 0 && (
                  <Button 
                    size="sm" 
                    className={`text-xs transition-all ${
                      productIdsInCart.has(product.id)
                        ? 'text-gray-900 border-0'
                        : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
                    }`}
                    style={productIdsInCart.has(product.id) ? { backgroundColor: '#b3db2d' } : undefined}
                    onMouseEnter={(e) => productIdsInCart.has(product.id) && ((e.currentTarget as HTMLElement).style.backgroundColor = '#a0c928')}
                    onMouseLeave={(e) => productIdsInCart.has(product.id) && ((e.currentTarget as HTMLElement).style.backgroundColor = '#b3db2d')}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (productIdsInCart.has(product.id)) {
                        onNavigate('cart');
                      } else {
                        addToCartMutation.mutate({ product });
                      }
                    }}
                    disabled={pendingAddIds.has(product.id) || (product.type === 'physical' && product.stock === 0)}
                    data-testid={`button-cart-${product.id}`}
                  >
                    {pendingAddIds.has(product.id) ? (
                      <div className="flex items-center">
                        <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mr-1" />
                        <span>Adding to Cart</span>
                      </div>
                    ) : productIdsInCart.has(product.id) ? (
                      <div className="flex items-center text-gray-900">
                        <Check className="w-4 h-4 mr-1" />
                        <span>View Cart</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm mr-1">+</span>
                        Add to Cart
                      </>
                    )}
                  </Button>
                )}
                <button 
                  className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 group" transition-all duration-300
                  onClick={(e) => {
                    e.stopPropagation();
                    if (productCategory && onNavigate) {
                      onNavigate('category-detail', 'slide-left', { categoryId: productCategory.id });
                    }
                  }}
                >
                  <span>Explore More</span>
                  <span className="text-gray-400 group-hover:text-gray-600 transition-colors" transition-all duration-300>→</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-white" data-testid="product-shop">
      {/* AJAX Notification */}
      {notification.show && (
        <div 
          className={`fixed top-4 right-4 z-[9999] max-w-md animate-in slide-in-from-top-5 fade-in ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-primary'
          } text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3`}
          data-testid="ajax-notification"
        >
          <div className="flex-1 font-medium">{notification.message}</div>
          <button
            onClick={() => setNotification({ show: false, message: '', type: 'success' })}
            className="p-1 hover:bg-white/20 rounded transition-colors" transition-all duration-300
            data-testid="button-close-notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <Header 
        onNavigate={onNavigate} 
        currentPage="product-shop" 
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      {/* Premium Navigation Header */}
      <div className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-50 backdrop-blur-md pt-safe">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer hidden lg:block" onClick={() => onNavigate && onNavigate('home')}>
              <Logo />
            </div>
            
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
                        setSelectedCategory(category.name);
                        // Instant jump to products section (no animation)
                        setTimeout(() => {
                          const element = document.querySelector('[data-testid="products-section"]');
                          if (element) {
                            const headerOffset = 80;
                            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                            window.scrollTo({ top: elementPosition - headerOffset, behavior: 'instant' });
                          }
                        }, 0);
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
                        className="px-3 py-2 rounded-full font-medium text-sm text-gray-700 hover:text-gray-800 hover:scale-105 transform transition-all duration-200" transition-all duration-300
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
                                setSelectedCategory(category.name);
                                // Instant jump to products section (no animation)
                                setTimeout(() => {
                                  const element = document.querySelector('[data-testid="products-section"]');
                                  if (element) {
                                    const headerOffset = 80;
                                    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                                    window.scrollTo({ top: elementPosition - headerOffset, behavior: 'instant' });
                                  }
                                }, 0);
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
                    className="pl-10 pr-4 py-2 w-full rounded-full border-gray-300 bg-white/80 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-[#2f5a4e] focus:border-transparent transition-all duration-200"
                    data-testid="input-search-products"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSearchChange && onSearchChange('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 rounded-full"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b7f2b8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      data-testid="button-clear-search"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Spacer for centering */}
            <div className="flex-shrink-0 w-[88px] hidden lg:block"></div>
            
            {/* Login & Cart - Desktop Only */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm border-gray-300 text-gray-700 transition-all duration-200 hover:scale-105 transform relative" transition-all duration-300
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b7f2b8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => onNavigate && onNavigate('cart')}
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
              
              {authLoading ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center px-3 py-2 rounded-full font-medium text-sm border-gray-300 text-gray-400 animate-pulse"
                  disabled
                  data-testid="button-auth-loading"
                >
                  <User className="h-4 w-4" />
                </Button>
              ) : user ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center px-3 py-2 rounded-full font-medium text-sm border-gray-300 text-gray-700 transition-all duration-200 hover:scale-105 transform" transition-all duration-300
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b7f2b8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => onNavigate && onNavigate(getDashboardForRole())}
                  data-testid="button-profile"
                >
                  <User className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm text-white transition-all duration-200 hover:scale-105 transform" transition-all duration-300 style={{backgroundColor: '#0C332C'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#e04a2a'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#0C332C'}
                  onClick={() => onNavigate && onNavigate('shop-auth')}
                  data-testid="button-login"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Logo & Controls */}
            <div className="lg:hidden flex items-center gap-2 flex-1 justify-between">
              {/* Mobile Logo */}
              <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate && onNavigate('home')}>
                <Logo />
              </div>
              
              {/* Mobile Controls */}
              <div className="flex items-center gap-2">
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  // Instant jump to products section (no animation)
                  setTimeout(() => {
                    const element = document.querySelector('[data-testid="products-section"]');
                    if (element) {
                      const headerOffset = 80;
                      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                      window.scrollTo({ top: elementPosition - headerOffset, behavior: 'instant' });
                    }
                  }, 0);
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
                onClick={() => onNavigate && onNavigate('cart')}
                data-testid="button-cart-mobile"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Button>
              
              {/* Mobile Login/Profile Button */}
              {authLoading ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 px-2 py-2 rounded-full font-medium text-sm border-gray-300 text-gray-400 animate-pulse"
                  disabled
                  data-testid="button-auth-loading-mobile"
                >
                  <User className="h-4 w-4" />
                </Button>
              ) : user ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 px-2 py-2 rounded-full font-medium text-sm border-gray-300 text-gray-700 transition-all duration-200"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b7f2b8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => onNavigate && onNavigate(getDashboardForRole())}
                  data-testid="button-profile-mobile"
                >
                  <User className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1 px-3 py-2 rounded-full font-medium text-sm text-white transition-all duration-200" style={{backgroundColor: '#0C332C'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#e04a2a'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#0C332C'}
                  onClick={() => onNavigate && onNavigate('shop-auth')}
                  data-testid="button-login-mobile"
                >
                  <User className="h-4 w-4" />
                </Button>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dark Abstract Hero Section */}
      <div className="relative overflow-hidden pt-8 md:pt-16 pb-4 md:pb-8" style={{ 
        background: 'linear-gradient(135deg, #0a0e27 0%, #0f1425 50%, #0a0e27 100%)',
        backgroundColor: '#0a0e27'
      }}>
        {/* Animated gradient blob - Primary */}
        <div className="absolute -top-56 -right-56 w-96 h-96 opacity-25" style={{
          background: 'linear-gradient(135deg, #2f5a4e 0%, #1a3a33 50%, #0f2b26 100%)',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          animation: 'blobFloat 25s ease-in-out infinite',
          filter: 'blur(40px)'
        }}></div>

        {/* Animated gradient blob - Secondary */}
        <div className="absolute top-1/2 -left-64 w-80 h-80 opacity-20" style={{
          background: 'linear-gradient(225deg, #1a3a33 0%, #2f5a4e 50%, #0f1425 100%)',
          borderRadius: '60% 40% 50% 50% / 50% 60% 30% 40%',
          animation: 'blobFloat 30s ease-in-out infinite reverse',
          filter: 'blur(50px)'
        }}></div>

        {/* Accent blob */}
        <div className="absolute bottom-0 right-1/3 w-72 h-72 opacity-15" style={{
          background: 'radial-gradient(ellipse at center, #a0fab2 0%, transparent 70%)',
          borderRadius: '45% 55% 50% 50% / 50% 45% 55% 45%',
          animation: 'blobDrift 35s ease-in-out infinite',
          filter: 'blur(60px)'
        }}></div>

        {/* CSS animations */}
        <style>{`
          @keyframes blobFloat {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(40px, -60px) scale(1.05); }
            50% { transform: translate(-30px, 40px) scale(0.95); }
            75% { transform: translate(60px, 30px) scale(1.02); }
          }
          @keyframes blobDrift {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(50px, -50px) scale(1.1); }
          }
        `}</style>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 overflow-hidden w-full mt-24 md:mt-0">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center w-full">
            {/* Left side - Text content */}
            <div className="text-center md:text-left w-full min-w-0">
              {/* Main Heading */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-white break-words">
                Discover Premium
                <br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #a0fab2, #ffffff, #a0fab2)' }}>
                  Digital Products
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-full md:max-w-lg mb-8 leading-relaxed px-2 sm:px-0">
                Templates, courses, and resources crafted by talented creators worldwide. Elevate your projects with premium quality.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center md:items-start gap-2 sm:gap-3 px-2 sm:px-0">
                <Button
                  onClick={() => {
                    // Instant jump to products section (no animation)
                    const element = document.querySelector('[data-testid="products-section"]');
                    if (element) {
                      const headerOffset = 80;
                      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                      window.scrollTo({ top: elementPosition - headerOffset, behavior: 'instant' });
                    }
                  }}
                  size="lg"
                  className="px-6 py-3 font-semibold transition-all duration-300 rounded-lg shadow-lg w-full sm:w-auto"
                  style={{
                    backgroundColor: '#a0fab2',
                    color: '#2f5a4e',
                    boxShadow: '0 10px 25px rgba(160, 250, 178, 0.25)'
                  }}
                  data-testid="button-explore-products"
                >
                  <Package className="mr-2 h-5 w-5" />
                  Explore Products
                </Button>
                
                {showLoginControls && (
                  <Button
                    onClick={() => onNavigate('shop-auth')}
                    size="lg"
                    variant="outline"
                    className="px-6 py-3 font-semibold bg-white/5 border border-white/20 text-white rounded-lg backdrop-blur-sm w-full sm:w-auto"
                    data-testid="button-become-seller"
                  >
                    Become a Seller
                  </Button>
                )}
              </div>
            </div>

            {/* Right side - Stats/Features cards */}
            <div className="hidden md:grid grid-cols-2 gap-4">
              {/* Stat Card 1 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all duration-300" transition-all duration-300>
                <h3 className="text-lg font-bold text-white mb-1">Free Products</h3>
                <p className="text-sm text-slate-400">Available for Everyone</p>
              </div>
              
              {/* Stat Card 2 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all duration-300" transition-all duration-300>
                <h3 className="text-lg font-bold text-white mb-1">Premium Products</h3>
                <p className="text-sm text-slate-400">Exclusive Collections</p>
              </div>
              
              {/* Stat Card 3 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all duration-300" transition-all duration-300>
                <h3 className="text-2xl font-bold text-white mb-1">50K+</h3>
                <p className="text-sm text-slate-400">Products Sold</p>
              </div>
              
              {/* Stat Card 4 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all duration-300" transition-all duration-300>
                <h3 className="text-2xl font-bold text-white mb-1">25K+</h3>
                <p className="text-sm text-slate-400">Happy Customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Creators Section */}
      {featuredCreators.length > 0 && (
        <section className="pt-12 pb-8 bg-gray-50">
          <div className="px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-['StackSans_Headline']">Top Creators</h2>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">Discover our featured talented creators</p>
              </div>
            </div>
            
            {/* Horizontal scrollable creator cards */}
            <div className="relative group">
              {/* Left scroll button - Hidden on mobile */}
              <button
                onClick={() => scrollCreators('left')}
                className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity" transition-all duration-300
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>
              
              {/* Right scroll button - Hidden on mobile */}
              <button
                onClick={() => scrollCreators('right')}
                className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity" transition-all duration-300
                aria-label="Scroll right"
              >
                <ChevronRight className="h-6 w-6 text-gray-700" />
              </button>
              
              <div ref={creatorsScrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {featuredCreators.map((creator: any) => (
                  <div 
                    key={creator.id}
                    onClick={() => {
                      // Filter products by this creator and show their profile
                      setSelectedCreatorId(creator.userId);
                      setSelectedCreatorName(creator.name);
                      // Instant jump to products section (no animation)
                      setTimeout(() => {
                        const element = document.querySelector('[data-testid="products-section"]');
                        if (element) {
                          const headerOffset = 80;
                          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                          window.scrollTo({ top: elementPosition - headerOffset, behavior: 'instant' });
                        }
                      }, 0);
                    }}
                    className="flex-shrink-0 w-56 sm:w-64 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 overflow-hidden" transition-all duration-300
                    data-testid={`creator-card-${creator.id}`}
                  >
                    {/* Cover/Banner */}
                    <div 
                      className="h-24"
                      style={creator.coverImageUrl ? { backgroundImage: `url(${creator.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : (defaultCover && defaultCover !== null) ? { backgroundImage: `url(${defaultCover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(to right, #2f5a4e, #a0fab2)' }}
                    />
                    
                    {/* Creator Info */}
                    <div className="p-4 relative">
                      {/* Avatar */}
                      <div className="absolute -top-10 left-4">
                        <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                          {creator.avatarUrl ? (
                            <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#2f5a4e' }}>
                              {creator.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-8">
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold text-gray-900 truncate">{creator.name}</h3>
                          {creator.verificationBadge && creator.verificationBadge !== 'none' && (
                            creator.verificationBadge === 'blue' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0">
                                <g clipPath="url(#clip0_343_1428_featured)">
                                  <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                  <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                                </g>
                                <defs>
                                  <clipPath id="clip0_343_1428_featured">
                                    <rect width="24" height="24" fill="#fff" />
                                  </clipPath>
                                </defs>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0">
                                <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                              </svg>
                            )
                          )}
                        </div>
                        {creator.professionalTitle && (
                          <p className="text-xs text-gray-600 truncate mt-1">{creator.professionalTitle}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Filters & Products Section */}
      <section className="pt-8 pb-16" data-testid="products-section">
        <div className="px-4 md:px-8">
          
          <div className="flex gap-8">
            {/* Desktop Sidebar Filters - Yellow Images Style */}
            <aside className="w-56 flex-shrink-0 hidden lg:block">
                <div className="sticky top-24">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base">Filters</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSelectedSubcategories([]);
                        setSelectedCategory('all_categories');
                        setExpandedCategories(new Set());
                      }}
                      className="text-xs h-7 px-2"
                    >
                      Clear All
                    </Button>
                  </div>

                  {/* Scrollable Filters Container */}
                  <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    {/* All mockups option */}
                    <div className="mb-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded text-sm" transition-all duration-300>
                        <input 
                          type="radio" 
                          name="filter-all" 
                          checked={selectedSubcategories.length === 0}
                          onChange={() => setSelectedSubcategories([])}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-sm font-medium">All mockups</span>
                      </label>
                    </div>

                    {/* Category Filters with Expandable Subcategories */}
                    <div className="space-y-0.5">
                    {filterCategories.map((category) => (
                      <div key={category.id} className="border-b border-gray-100 last:border-0">
                        {category.subcategories.length > 0 ? (
                          <>
                            {/* Main category with arrow */}
                            <button
                              onClick={() => toggleCategory(category.id)}
                              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded text-sm font-medium" transition-all duration-300
                              data-testid={`filter-category-${category.id}`}
                            >
                              <span>{category.name.charAt(0).toUpperCase() + category.name.slice(1)}</span>
                              <ChevronDown 
                                className={`h-3.5 w-3.5 transition-transform ${
                                  expandedCategories.has(category.id) ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            
                            {/* Expandable subcategories */}
                            {expandedCategories.has(category.id) && (
                              <div className="pl-3 pr-2 pb-2 space-y-0.5">
                                {category.subcategories.map((sub) => (
                                  <label 
                                    key={sub} 
                                    className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-1.5 py-1 rounded" transition-all duration-300
                                    data-testid={`filter-subcategory-${sub.toLowerCase().replace(/\s+/g, '-')}`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={selectedSubcategories.includes(sub)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedSubcategories([...selectedSubcategories, sub]);
                                        } else {
                                          setSelectedSubcategories(selectedSubcategories.filter(s => s !== sub));
                                        }
                                      }}
                                      className="w-3 h-3"
                                    />
                                    <span className="text-xs">{sub}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          /* Standalone categories without subcategories */
                          <label 
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded" transition-all duration-300
                            data-testid={`filter-category-${category.id}`}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedSubcategories.includes(category.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubcategories([...selectedSubcategories, category.name]);
                                } else {
                                  setSelectedSubcategories(selectedSubcategories.filter(s => s !== category.name));
                                }
                              }}
                              className="w-3.5 h-3.5"
                            />
                            <span className="text-sm font-medium">{category.name.charAt(0).toUpperCase() + category.name.slice(1)}</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              </aside>

            {/* Mobile Sidebar Filter Modal/Drawer - Yellow Images Style */}
            {showSidebar && (
              <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowSidebar(false)}>
                <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-base">Filters</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedSubcategories([]);
                            setSelectedCategory('all_categories');
                            setExpandedCategories(new Set());
                          }}
                          className="text-xs h-7 px-2"
                        >
                          Clear All
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowSidebar(false)}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* All mockups option */}
                    <div className="mb-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded text-sm" transition-all duration-300>
                        <input 
                          type="radio" 
                          name="filter-all-mobile" 
                          checked={selectedSubcategories.length === 0}
                          onChange={() => setSelectedSubcategories([])}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-sm font-medium">All mockups</span>
                      </label>
                    </div>

                    {/* Category Filters with Expandable Subcategories */}
                    <div className="space-y-0.5">
                      {filterCategories.map((category) => (
                        <div key={category.id} className="border-b border-gray-100 last:border-0">
                          {category.subcategories.length > 0 ? (
                            <>
                              {/* Main category with arrow */}
                              <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded text-sm font-medium" transition-all duration-300
                              >
                                <span>{category.name.charAt(0).toUpperCase() + category.name.slice(1)}</span>
                                <ChevronDown 
                                  className={`h-3.5 w-3.5 transition-transform ${
                                    expandedCategories.has(category.id) ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              
                              {/* Expandable subcategories */}
                              {expandedCategories.has(category.id) && (
                                <div className="pl-3 pr-2 pb-2 space-y-0.5">
                                  {category.subcategories.map((sub) => (
                                    <label 
                                      key={sub} 
                                      className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-1.5 py-1 rounded" transition-all duration-300
                                    >
                                      <input 
                                        type="checkbox" 
                                        checked={selectedSubcategories.includes(sub)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedSubcategories([...selectedSubcategories, sub]);
                                          } else {
                                            setSelectedSubcategories(selectedSubcategories.filter(s => s !== sub));
                                          }
                                        }}
                                        className="w-3 h-3"
                                      />
                                      <span className="text-xs">{sub}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            /* Standalone categories without subcategories */
                            <label 
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded" transition-all duration-300
                            >
                              <input 
                                type="checkbox" 
                                checked={selectedSubcategories.includes(category.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSubcategories([...selectedSubcategories, category.name]);
                                  } else {
                                    setSelectedSubcategories(selectedSubcategories.filter(s => s !== category.name));
                                  }
                                }}
                                className="w-3.5 h-3.5"
                              />
                              <span className="text-sm font-medium">{category.name.charAt(0).toUpperCase() + category.name.slice(1)}</span>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 max-h-[calc(100vh-140px)] overflow-y-auto">
              {/* Creator Profile Section - Shows when creator is selected */}
              {selectedCreatorId && selectedCreatorName && (() => {
                const selectedCreator = featuredCreators.find((c: any) => c.userId === selectedCreatorId);
                return selectedCreator ? (
                  <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Cover/Banner */}
                    <div 
                      className="h-32 md:h-40 relative"
                      style={selectedCreator.coverImageUrl ? { backgroundImage: `url(${selectedCreator.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : (defaultCover && defaultCover !== null) ? { backgroundImage: `url(${defaultCover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(to right, #2f5a4e, #a0fab2)' }}
                    >
                      {/* Close button */}
                      <button
                        onClick={() => {
                          setSelectedCreatorId(null);
                          setSelectedCreatorName(null);
                        }}
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 transition-colors shadow-md" transition-all duration-300
                        data-testid="button-close-creator-profile"
                      >
                        <X className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>
                    
                    {/* Creator Info */}
                    <div className="p-6 relative">
                      {/* Avatar */}
                      <div className="absolute -top-16 left-6">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-gray-200/50 bg-gray-200 overflow-hidden">
                          {selectedCreator.avatarUrl ? (
                            <img src={selectedCreator.avatarUrl} alt={selectedCreator.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold" style={{ backgroundColor: '#2f5a4e' }}>
                              {selectedCreator.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-0 md:ml-36 mt-12 md:mt-2">
                        <div className="flex items-center gap-0.5">
                          <h2 className="text-2xl font-bold text-gray-900 font-['StackSans_Headline']">{selectedCreator.name}</h2>
                          {selectedCreator.verificationBadge && selectedCreator.verificationBadge !== 'none' && (
                            selectedCreator.verificationBadge === 'blue' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 self-center">
                                <g clipPath="url(#clip0_profile)">
                                  <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                                  <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                                </g>
                                <defs>
                                  <clipPath id="clip0_profile">
                                    <rect width="24" height="24" fill="#fff" />
                                  </clipPath>
                                </defs>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 self-center">
                                <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                              </svg>
                            )
                          )}
                        </div>
                        {selectedCreator.professionalTitle && (
                          <p className="text-gray-600 mt-1">{selectedCreator.professionalTitle}</p>
                        )}
                        {selectedCreator.bio && (
                          <p className="text-gray-700 mt-3 text-sm leading-relaxed">{selectedCreator.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
              
              {/* Top Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between mb-6 sm:mb-8 px-4 sm:px-0">
                <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="lg:hidden flex-shrink-0"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>

                  <Select value={productType} onValueChange={(value: FilterType) => setProductType(value)}>
                    <SelectTrigger className="w-32 sm:w-40 flex-shrink-0">
                      <SelectValue placeholder="Product Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="digital">Digital Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-36 sm:w-40 flex-shrink-0">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                
                  <Select value={viewMode} onValueChange={(value: 'grid' | 'list') => setViewMode(value)}>
                    <SelectTrigger className="w-28 sm:w-32 flex-shrink-0">
                      <SelectValue placeholder="View" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid View</SelectItem>
                      <SelectItem value="list">List View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Grid/List - Separated by Free and Paid */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {[...Array(12)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-primary-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Error loading products</h3>
              <p className="text-gray-500">Please try again later or contact support if the issue persists.</p>
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-6 px-4 sm:px-0">
              {/* Free Products Section */}
              {products.filter(p => parseFloat(p.price) === 0).length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['StackSans_Headline']">Free Products</h2>
                  <div className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 lg:grid-cols-4 gap-3'
                      : 'space-y-3 sm:space-y-4'
                  }>
                    {products.filter(p => parseFloat(p.price) === 0).map((product) => 
                      viewMode === 'grid' 
                        ? <ProductCard key={product.id} product={product} />
                        : <ProductListItem key={product.id} product={product} />
                    )}
                  </div>
                </div>
              )}
              
              {/* Paid Products Section */}
              {products.filter(p => parseFloat(p.price) > 0).length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['StackSans_Headline']">Premium Products</h2>
                  <div className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 lg:grid-cols-4 gap-3'
                      : 'space-y-3 sm:space-y-4'
                  }>
                    {products.filter(p => parseFloat(p.price) > 0).map((product) => 
                      viewMode === 'grid' 
                        ? <ProductCard key={product.id} product={product} />
                        : <ProductListItem key={product.id} product={product} />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or browse different categories.</p>
            </div>
          )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

export default ProductShop;
