import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface GuestCartItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtAdd: string;
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

export interface GuestCartData {
  items: GuestCartItem[];
  totals: {
    totalItems: number;
    totalAmount: string;
  };
}

const GUEST_CART_KEY = 'guest_cart_items';

export function useGuestCart() {
  const { user } = useAuth();
  const [guestCartItems, setGuestCartItems] = useState<GuestCartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (!user) { // Only use guest cart when not authenticated
      try {
        const stored = localStorage.getItem(GUEST_CART_KEY);
        if (stored) {
          const items = JSON.parse(stored);
          setGuestCartItems(items);
        }
      } catch (error) {
        console.error('Failed to load guest cart:', error);
      }
    }
  }, [user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!user && guestCartItems.length >= 0) {
      try {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCartItems));
      } catch (error) {
        console.error('Failed to save guest cart:', error);
      }
    }
  }, [guestCartItems, user]);

  // Clear guest cart when user logs in
  useEffect(() => {
    if (user) {
      setGuestCartItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, [user]);

  const addToGuestCart = async (product: any) => {
    if (user) return; // Don't use guest cart if authenticated

    const existingItemIndex = guestCartItems.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...guestCartItems];
      updatedItems[existingItemIndex].quantity += 1;
      setGuestCartItems(updatedItems);
    } else {
      // Add new item
      const newItem: GuestCartItem = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        quantity: 1,
        priceAtAdd: product.price,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          type: product.type,
          price: product.price,
          currency: product.currency,
          images: product.images || [],
          stock: product.stock,
          category: product.category,
          status: product.status,
        },
        seller: {
          id: product.sellerId || 'unknown',
          name: product.sellerName || 'Unknown Seller',
          displayName: product.sellerDisplayName || product.sellerName || 'Unknown Seller',
          avatarUrl: product.sellerAvatarUrl || null,
        }
      };
      setGuestCartItems([...guestCartItems, newItem]);
    }
  };

  const updateGuestCartQuantity = (itemId: string, quantity: number) => {
    if (user) return; // Don't use guest cart if authenticated
    
    if (quantity <= 0) {
      removeFromGuestCart(itemId);
      return;
    }

    const updatedItems = guestCartItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    );
    setGuestCartItems(updatedItems);
  };

  const removeFromGuestCart = (itemId: string) => {
    if (user) return; // Don't use guest cart if authenticated
    
    const updatedItems = guestCartItems.filter(item => item.id !== itemId);
    setGuestCartItems(updatedItems);
  };

  const clearGuestCart = () => {
    if (user) return; // Don't use guest cart if authenticated
    
    setGuestCartItems([]);
    localStorage.removeItem(GUEST_CART_KEY);
  };

  const getGuestCartData = (): GuestCartData => {
    const totalItems = guestCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = guestCartItems.reduce(
      (sum, item) => sum + (parseFloat(item.priceAtAdd) * item.quantity), 
      0
    ).toFixed(2);

    return {
      items: guestCartItems,
      totals: {
        totalItems,
        totalAmount,
      }
    };
  };

  const getGuestCartCount = () => {
    return guestCartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  return {
    isGuestMode: !user,
    guestCartItems,
    addToGuestCart,
    updateGuestCartQuantity,
    removeFromGuestCart,
    clearGuestCart,
    getGuestCartData,
    getGuestCartCount,
  };
}
