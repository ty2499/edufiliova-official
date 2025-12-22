import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ImageGallery } from '@/components/ImageGallery';
import { useAuth } from '@/hooks/useAuth';
import { useGuestCart } from '@/hooks/useGuestCart';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Star, 
  Eye,
  Grid,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  X,
  Check
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
  filters?: CategoryFilter[];
}

interface CategoryFilter {
  id: string;
  key: string;
  label: string;
  type: 'multiselect' | 'singleselect' | 'range' | 'boolean';
  options?: string[];
  min?: number;
  max?: number;
}

interface CategoryDetailProps {
  categoryId: string;
  onNavigate: (page: string, customTransition?: string, data?: any) => void;
}

type SortOption = 'recent' | 'popular' | 'price_low' | 'price_high' | 'rating';

export function CategoryDetail({ categoryId, onNavigate }: CategoryDetailProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    isGuestMode, 
    addToGuestCart, 
    getGuestCartCount 
  } = useGuestCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});  const [rangeFilters, setRangeFilters] = useState<Record<string, { min: number | null, max: number | null }>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [pendingAddIds, setPendingAddIds] = useState<Set<string>>(new Set());
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  
  const toggleCategory = (categoryId: string) => {
    setExpandedFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery<ShopCategory>({
    queryKey: [`/api/shop-categories/public/${categoryId}`],
    queryFn: async () => {
      const response = await fetch(`/api/shop-categories/public/${categoryId}`);
      if (!response.ok) throw new Error('Failed to fetch category');
      const data = await response.json();
      return data.data;
    }
  });

  // Extract filters from category data
  const filters = category?.filters || [];

  // Fetch products for this category
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: [
      '/api/products/approved',
      category?.name,
      searchQuery,
      JSON.stringify(selectedFilters),
      JSON.stringify(rangeFilters),
      [...selectedTags].sort().join(','),
      [...selectedSubcategories].sort().join(','),
      sortBy
    ],
    queryFn: async () => {
      if (!category?.name) return [];
      
      const params = new URLSearchParams();
      params.append('category', category.name);
      if (searchQuery) params.append('search', searchQuery);
      
      // Combine regular and range filters
      const allFilters = { ...selectedFilters };
      Object.entries(rangeFilters).forEach(([key, range]) => {
        if (range.min !== null || range.max !== null) {
          allFilters[key] = [`${range.min || ''}:${range.max || ''}`];
        }
      });
      
      if (Object.keys(allFilters).length > 0) {
        params.append('filters', JSON.stringify(allFilters));
      }
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      // Add subcategories filter
      if (selectedSubcategories.length > 0) params.append('subcategories', selectedSubcategories.join(','));
      params.append('sort', sortBy);
      
      const response = await fetch(`/api/products/approved?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!category?.name,
  });

  // Extract available tags from products
  const availableTags = Array.from(new Set(products.flatMap(p => p.tags))).sort();

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

  // Handle filter changes
  const handleFilterChange = (filterKey: string, option: string | boolean, checked: boolean) => {
    setSelectedFilters(prev => {
      const current = prev[filterKey] || [];
      if (checked) {
        return { ...prev, [filterKey]: [...current, String(option)] };
      } else {
        const updated = current.filter(o => o !== String(option));
        if (updated.length === 0) {
          const { [filterKey]: removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [filterKey]: updated };
      }
    });
  };

  // Handle range filter changes
  const handleRangeFilterChange = (filterKey: string, min: number | null, max: number | null) => {
    setRangeFilters(prev => {
      if (min === null && max === null) {
        const { [filterKey]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [filterKey]: { min, max } };
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleFilterExpansion = (filterKey: string) => {
    setExpandedFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filterKey)) {
        newSet.delete(filterKey);
      } else {
        newSet.add(filterKey);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    setRangeFilters({});
    setSelectedTags([]);
    setSelectedSubcategories([]);
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    const filterCount = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);
    const rangeCount = Object.keys(rangeFilters).length;
    return filterCount + rangeCount + selectedTags.length + selectedSubcategories.length;
  };

  const ProductCard = ({ product }: { product: Product }) => {
    // Find the category object for this product
    const productCategory = category;
    
    return (
      <Card 
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 bg-white"
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
              className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight cursor-pointer hover:text-blue-600"
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
              className="w-full text-left text-sm text-gray-600 hover:text-gray-900 flex items-center justify-between group"
              onClick={(e) => {
                e.stopPropagation();
                if (productCategory && onNavigate) {
                  onNavigate('category-detail', 'slide-left', { categoryId: productCategory.id });
                }
              }}
            >
              <span>Explore More</span>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
            </button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Filters Sidebar Component - Yellow Images Style
  const FiltersSidebar = () => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-xs h-7 px-2"
        >
          Clear all
        </Button>
      </div>

      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-9 text-xs h-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>
      </div>

      {/* All mockups option */}
      <div className="mb-2">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded text-sm">
          <input 
            type="radio" 
            name="filter-all-category" 
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
                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded text-base font-medium"
                >
                  <span>{category.name}</span>
                  <ChevronDown 
                    className={`h-3.5 w-3.5 transition-transform ${
                      expandedFilters.has(category.id) ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {/* Expandable subcategories */}
                {expandedFilters.has(category.id) && (
                  <div className="pl-3 pr-2 pb-2 space-y-0.5">
                    {category.subcategories.map((sub) => (
                      <label 
                        key={sub} 
                        className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-1.5 py-1 rounded"
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
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded"
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
                <span className="text-base font-medium">{category.name}</span>
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('product-shop')}
              className="gap-1 sm:gap-2 px-2 sm:px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Shop</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
              {categoryLoading ? '' : (category?.displayName || category?.name || '')}
            </h1>
          </div>
          
          {category?.description && (
            <p className="text-sm sm:text-base text-gray-600 max-w-3xl mb-3 sm:mb-0">
              {category.description}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mt-3 sm:mt-4">
            <div className="text-xs sm:text-sm text-gray-500">
              Showing <strong>{products.length}</strong> items
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* Mobile Filters Button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden flex-1 sm:flex-none">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersSidebar />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-32 sm:w-40 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Newest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-6">
              <FiltersSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tag Filters */}
            {availableTags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className={`cursor-pointer text-xs ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(12)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200" />
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-200 rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 px-4">
                <Grid className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No products found</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">Try adjusting your search criteria or filters.</p>
                <Button onClick={clearAllFilters} variant="outline" size="sm" className="sm:size-default">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
