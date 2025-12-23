import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useGuestCart } from '@/hooks/useGuestCart';
import { ImageGallery } from '@/components/ImageGallery';
import { AjaxStatus, AjaxOperation } from '@/components/ui/ajax-loader';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  ArrowLeft,
  Package,
  AlertCircle,
  Download
} from 'lucide-react';
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { apiRequest } from '@/lib/queryClient';

// Types
interface CartItem {
  id: string;
  quantity: number;
  priceAtAdd: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    description: string;
    type: 'digital' | 'physical';
    price: string;
    currency: string;
    images: string[];
    stock?: number;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  seller: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface CartData {
  cart: {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  };
  items: CartItem[];
  totals: {
    totalItems: number;
    totalAmount: string;
  };
}

interface CartProps {
  onNavigate?: (page: string, customTransition?: string, data?: any) => void;
}

export function Cart({ onNavigate = () => {} }: CartProps = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<AjaxOperation>('idle');
  const [checkoutError, setCheckoutError] = useState('');
  const [claimStatus, setClaimStatus] = useState<AjaxOperation>('idle');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  
  const { 
    isGuestMode, 
    getGuestCartData, 
    updateGuestCartQuantity, 
    removeFromGuestCart, 
    clearGuestCart 
  } = useGuestCart();

  // Fetch cart data for authenticated users only
  const { data: serverCartData, isLoading, error } = useQuery<CartData>({
    queryKey: ['/api/cart'],
    queryFn: async () => {
      return await apiRequest('/api/cart');
    },
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Get cart data - either from server (authenticated) or guest cart
  const cartData = user ? serverCartData : getGuestCartData();

  // Calculate client-side totals respecting digital = quantity 1 rule
  const calculateCorrectTotals = () => {
    if (!cartData?.items) return { totalItems: 0, totalAmount: '0' };
    
    let totalItems = 0;
    let totalAmount = 0;
    
    cartData.items.forEach(item => {
      const effectiveQuantity = item.product.type === 'digital' ? 1 : item.quantity;
      totalItems += effectiveQuantity;
      
      // Get the raw price and sanitize it
      const rawPrice = item.priceAtAdd ?? item.product?.price;
      const price = typeof rawPrice === 'number' 
        ? rawPrice 
        : parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''));
      
      totalAmount += price * effectiveQuantity;
    });
    
    return {
      totalItems,
      totalAmount: totalAmount.toFixed(2)
    };
  };
  
  const correctTotals = calculateCorrectTotals();

  // Update item quantity - handles both authenticated and guest users
  const handleUpdateQuantity = async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
    if (user) {
      // Authenticated user - use server cart
      await apiRequest(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    } else {
      // Guest user - use local cart
      updateGuestCartQuantity(itemId, quantity);
    }
  };

  const updateQuantityMutation = useMutation({
    mutationFn: handleUpdateQuantity,
    onError: (error: any) => {
      // Silent error - user sees the quantity revert
    }
  });

  // Normalize digital items with quantity > 1 to quantity = 1 on cart load
  useEffect(() => {
    if (!cartData?.items) return;
    
    const digitalItemsToNormalize = cartData.items.filter(
      item => item.product.type === 'digital' && item.quantity > 1
    );
    
    digitalItemsToNormalize.forEach(item => {
      if (user) {
        // Authenticated user - update server cart
        handleUpdateQuantity({ 
          itemId: item.id, 
          quantity: 1 
        });
      } else {
        // Guest user - update local cart
        updateGuestCartQuantity(item.id, 1);
      }
    });
  }, [cartData?.items, user, handleUpdateQuantity, updateGuestCartQuantity]);

  // Remove item - handles both authenticated and guest users
  const handleRemoveItem = async (itemId: string) => {
    if (user) {
      // Authenticated user - use server cart
      await apiRequest(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    } else {
      // Guest user - use local cart
      removeFromGuestCart(itemId);
    }
  };

  const removeItemMutation = useMutation({
    mutationFn: handleRemoveItem,
    onSuccess: () => {
      // Silent success - item disappears from UI
    },
    onError: () => {
      // Silent error - item remains in UI
    }
  });

  // Clear cart - handles both authenticated and guest users
  const handleClearCart = async () => {
    if (user) {
      // Authenticated user - use server cart
      await apiRequest('/api/cart/clear', {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    } else {
      // Guest user - use local cart
      clearGuestCart();
    }
  };

  const clearCartMutation = useMutation({
    mutationFn: handleClearCart,
    onSuccess: () => {
      // Silent success - cart becomes empty
    },
    onError: () => {
      // Silent error - cart remains unchanged
    }
  });

  // Apply coupon mutation
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('/api/cart/apply-coupon', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      return response;
    },
    onSuccess: (response) => {
      // apiRequest already unwraps the response { success, data } → returns data
      setAppliedCoupon(response);
      setCouponError('');
      setCouponCode('');
    },
    onError: (error: any) => {
      setCouponError(error.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    }
  });

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponError('');
    applyCouponMutation.mutate(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Create a simpler checkout that works for guest users
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      setCheckoutStatus('loading');
      setCheckoutError('');
      
      // For guest users, create a simple order structure
      if (!user) {
        // Guest checkout - create order data from cart
        const guestOrderData = {
          order: {
            id: 'guest-' + Date.now(),
            items: cartData?.items || [],
            total: correctTotals.totalAmount,
            currency: 'USD',
            userId: 'guest'
          }
        };
        return guestOrderData;
      }
      
      // For authenticated users, try the server endpoint
      return await apiRequest('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: 'stripe',
          couponId: appliedCoupon?.coupon?.id || undefined,
        }),
      });
    },
    onSuccess: (data) => {
      setCheckoutStatus('success');
      // Keep button disabled during navigation - don't reset isCheckingOut
      
      // Navigate to checkout page with order data
      // Include the original cart items for proper display on payment success
      const orderDataWithCartItems = {
        ...data,
        cartItems: cartData?.items || []
      };
      
      if (onNavigate) {
        onNavigate('checkout', 'slide-left', { 
          orderData: orderDataWithCartItems,
          amount: parseFloat(correctTotals.totalAmount || '0'),
          courseName: 'Cart Items',
          courseId: 'cart'
        });
      }
    },
    onError: (error: any) => {
      setCheckoutStatus('error');
      setCheckoutError(error.message || 'Failed to process checkout. Please try again.');
      setIsCheckingOut(false);
    }
  });

  const handleQuantityChange = (itemId: string, newQuantity: number, productType: string) => {
    if (newQuantity < 1) return;
    // Prevent quantity changes for digital products
    if (productType === 'digital') return;
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };


  const handleCheckout = () => {
    // Redirect to shop auth if user is not logged in
    if (!user) {
      onNavigate('shop-auth', 'slide-left');
      return;
    }
    
    // Prevent checkout if cart is empty or already checking out
    // Check mutation state FIRST to prevent race conditions
    if (checkoutMutation.isPending || isCheckingOut || !cartData?.items || cartData.items.length === 0) {
      return;
    }
    
    setIsCheckingOut(true);
    checkoutMutation.mutate();
  };

  // Check if all items are free
  const isFreeCart = cartData?.items?.every(item => parseFloat(item.priceAtAdd) === 0) ?? false;

  const formatPrice = (price: string, currency: string = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${parseFloat(price).toFixed(2)}`;
  };

  const calculateItemTotal = (price: string, quantity: number, productType: string) => {
    // Digital products are always quantity 1 for pricing
    const effectiveQuantity = productType === 'digital' ? 1 : quantity;
    return (parseFloat(price) * effectiveQuantity).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-3 text-gray-600">Loading cart...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <AlertCircle className="h-16 w-16 mx-auto text-primary-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Error Loading Cart</h3>
            <p className="text-gray-500 mb-4">Please try again later.</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEmpty = !cartData?.items || cartData.items.length === 0;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="cart-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              className="flex items-center gap-1 sm:gap-2 text-sm sm:text-lg font-semibold text-gray-800 hover:text-blue-600 p-1 sm:p-2"
              onClick={() => onNavigate('product-shop')}
              data-testid="button-back-to-shop"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Shop</span>
            </Button>
            
            <h1 className="sm:text-2xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 text-[20px]">
              <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6" />
              <span className="hidden xs:inline">Shopping Cart</span>
              <span className="xs:hidden">Cart</span>
            </h1>
            
            <div></div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {isEmpty ? (
          // Empty cart state
          (<div className="text-center py-16">
            <Package className="h-24 w-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Browse our products and find something you like!
            </p>
            <Button 
              onClick={() => onNavigate('product-shop')}
              className="bg-primary hover:bg-primary text-white px-8 py-3"
              data-testid="button-continue-shopping"
            >
              Continue Shopping
            </Button>
          </div>)
        ) : (
          // Cart with items
          (<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center justify-between text-base sm:text-xl">
                    <span className="text-sm sm:text-base">Cart Items ({correctTotals.totalItems})</span>
                    <Badge variant="secondary" className="text-xs">
                      {correctTotals.totalItems} {correctTotals.totalItems === 1 ? 'item' : 'items'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                  {cartData.items.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex gap-2 sm:gap-4" data-testid={`cart-item-${item.id}`}>
                        {/* Product Image */}
                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <ImageGallery 
                            images={item.product.images || []}
                            productName={item.product.name}
                            className="h-full"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 line-clamp-1 sm:line-clamp-none">
                                {item.product.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2">
                                {item.product.description}
                              </p>
                            </div>

                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeItemMutation.isPending}
                              className="text-primary-600 hover:text-primary-700 hover:bg-primary/50 p-1 sm:p-2"
                              data-testid={`button-remove-${item.id}`}
                            >
                              {removeItemMutation.isPending ? (
                                <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-600 border-t-transparent rounded-full" />
                              ) : (
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          </div>

                          {/* Quantity and Price */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 sm:mt-4 gap-2 sm:gap-0">
                            {/* Only show quantity controls for physical products */}
                            {item.product.type === 'physical' ? (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs sm:text-sm text-gray-600">Qty:</span>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.product.type)}
                                    disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                                    className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                    data-testid={`button-decrease-${item.id}`}
                                  >
                                    <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQty = parseInt(e.target.value);
                                      if (newQty > 0) {
                                        handleQuantityChange(item.id, newQty, item.product.type);
                                      }
                                    }}
                                    className="w-12 sm:w-16 text-center h-6 sm:h-8 text-xs sm:text-sm"
                                    min="1"
                                    max={item.product.stock || 999}
                                    data-testid={`input-quantity-${item.id}`}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.product.type)}
                                    disabled={updateQuantityMutation.isPending || (item.product.stock != null && item.quantity >= item.product.stock)}
                                    className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                    data-testid={`button-increase-${item.id}`}
                                  >
                                    <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : null}

                            {parseFloat(item.priceAtAdd) > 0 && (
                              <div className="text-left sm:text-right">
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {formatPrice(item.priceAtAdd, item.product.currency)} each
                                </div>
                                <div className="text-base sm:text-lg font-semibold text-gray-900">
                                  {formatPrice(calculateItemTotal(item.priceAtAdd, item.quantity, item.product.type), item.product.currency)}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Stock Warning */}
                          {item.product.type === 'physical' && item.product.stock && item.product.stock < 10 && (
                            <div className="flex items-center gap-2 mt-2 text-amber-600">
                              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-xs sm:text-sm">Only {item.product.stock} left in stock!</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {index < cartData.items.length - 1 && <Separator className="mt-4 sm:mt-6" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-24">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-xl">
                    {isFreeCart ? 'Free Items' : 'Order Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                  {!isFreeCart && (
                    <div className="space-y-3">
                      {/* Coupon Section */}
                      {user && (
                        <div className="space-y-2 pb-3 border-b">
                          <label className="text-sm font-medium text-gray-700">Discount Code</label>
                          {!appliedCoupon ? (
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                placeholder="Enter code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                disabled={applyCouponMutation.isPending}
                                className="flex-1 uppercase"
                                data-testid="input-coupon-code"
                              />
                              <Button
                                onClick={handleApplyCoupon}
                                disabled={applyCouponMutation.isPending || !couponCode.trim()}
                                className="bg-primary hover:bg-primary text-white"
                                data-testid="button-apply-coupon"
                              >
                                {applyCouponMutation.isPending ? 'Applying...' : 'Apply'}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
                              <div className="flex items-center gap-2">
                                <CheckmarkIcon size="sm" variant="success" />
                                <div>
                                  <p className="text-sm font-medium text-green-900" data-testid="text-applied-coupon">
                                    {appliedCoupon.coupon.code}
                                  </p>
                                  {appliedCoupon.coupon.description && (
                                    <p className="text-xs text-green-700">{appliedCoupon.coupon.description}</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveCoupon}
                                className="text-green-700 hover:text-green-900 hover:bg-green-100"
                                data-testid="button-remove-coupon"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {couponError && (
                            <div className="flex items-center gap-2 text-primary-600 text-sm" data-testid="text-coupon-error">
                              <AlertCircle className="h-4 w-4" />
                              <span>{couponError}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal ({correctTotals.totalItems} items)</span>
                        <span className="font-medium">{formatPrice(appliedCoupon?.cartTotal || correctTotals.totalAmount)}</span>
                      </div>

                      {appliedCoupon && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount ({appliedCoupon.coupon.code})</span>
                          <span data-testid="text-discount-amount">-{formatPrice(appliedCoupon.discountAmount)}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span data-testid="text-final-total">{formatPrice(appliedCoupon?.finalTotal || correctTotals.totalAmount)}</span>
                      </div>
                    </div>
                  )}

                  {isFreeCart ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        {correctTotals.totalItems} free {correctTotals.totalItems === 1 ? 'item' : 'items'} ready to download
                      </p>
                      
                      <AjaxStatus 
                        operation={claimStatus} 
                        message={claimStatus === 'success' ? 'Free items claimed! They will be available in your downloads.' : undefined}
                        autoHide={5000}
                      />
                      
                      <Button 
                        onClick={() => {
                          if (!user) {
                            onNavigate('shop-auth', 'slide-left');
                            return;
                          }
                          // For free items, show AJAX notification
                          setClaimStatus('loading');
                          setTimeout(() => {
                            setClaimStatus('success');
                            setTimeout(() => setClaimStatus('idle'), 5000);
                          }, 500);
                        }}
                        disabled={claimStatus === 'loading' || claimStatus === 'success'}
                        className="w-full hover:bg-[#a8cc32] py-3 text-base font-medium bg-[#c5f13c] text-[#151314]"
                        data-testid="button-claim-free"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Claim Free Items
                      </Button>
                    </div>
                  ) : (
                    <>
                      <AjaxStatus 
                        operation={checkoutStatus} 
                        message={checkoutError}
                        autoHide={5000}
                      />
                      
                      <Button 
                        onClick={handleCheckout}
                        disabled={isCheckingOut || checkoutMutation.isPending || isEmpty}
                        className="w-full bg-primary hover:bg-primary text-white py-3 text-base font-medium disabled:opacity-50"
                        data-testid="button-checkout"
                      >
                        {isCheckingOut || checkoutMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            Proceed to Checkout
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  
                  {!user && !isFreeCart && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      You can checkout as a guest or 
                      <button 
                        onClick={() => onNavigate('auth')}
                        className="text-blue-600 hover:text-blue-700 underline ml-1"
                      >
                        sign in
                      </button>
                    </p>
                  )}

                  <div className="text-center space-y-3">
                    <Button 
                      onClick={() => onNavigate('product-shop')}
                      className="w-full bg-[#c5f13c] hover:bg-[#a8cc32] text-gray-900"
                      data-testid="button-continue-shopping-summary"
                    >
                      Continue Shopping
                    </Button>
                    
                    {!isEmpty && (
                      <Button
                        onClick={() => clearCartMutation.mutate()}
                        disabled={clearCartMutation.isPending}
                        className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
                        data-testid="button-empty-cart"
                      >
                        {clearCartMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full mr-2" />
                            Emptying...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Empty Cart
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>)
        )}
      </div>
    </div>
  );
}

export default Cart;
