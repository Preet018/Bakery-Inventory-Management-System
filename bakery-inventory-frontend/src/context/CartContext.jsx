import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';

/**
 * CartContext
 *
 * Manages customer shopping cart state, item quantities, localStorage persistence,
 * real-time server inventory validation, and stock limits (Issue #07).
 */

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('bakery_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [cartNotice, setCartNotice] = useState(null);

  // Sync cart state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bakery_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cartItems]);

  // CHANGE: CartContext owns validateCart() — refreshes cart against latest server product data (Issue #07)
  const validateCart = useCallback(async () => {
    try {
      const products = await productService.getAllProducts();
      if (!products || !Array.isArray(products)) return;

      const productMap = new Map();
      products.forEach((p) => productMap.set(p.id, p));

      let noticeMessage = null;

      setCartItems((prevItems) => {
        if (!prevItems || prevItems.length === 0) return prevItems;

        return prevItems.map((item) => {
          const serverProduct = productMap.get(item.id);

          if (!serverProduct || serverProduct.isActive === false) {
            // Product no longer available / deactivated
            noticeMessage = 'Some items in your cart are currently out of stock or unavailable.';
            return {
              ...item,
              availableQuantity: 0,
              isOutOfStock: true,
            };
          }

          const serverAvailable =
            typeof serverProduct.availableQuantity === 'number'
              ? Math.max(0, serverProduct.availableQuantity)
              : 0;

          const isOut = serverAvailable <= 0;
          let newQty = item.quantity;

          if (isOut) {
            noticeMessage = 'Some items in your cart are currently out of stock.';
          } else if (item.quantity > serverAvailable) {
            newQty = serverAvailable;
            noticeMessage = 'Some item quantities were adjusted to match current available stock.';
          }

          const serverImg =
            serverProduct.images && serverProduct.images.length > 0
              ? serverProduct.images[0].imagePath
              : serverProduct.imagePath || item.imagePath;

          return {
            ...item,
            name: serverProduct.name || item.name,
            price: serverProduct.price !== undefined ? serverProduct.price : item.price,
            imagePath: serverImg,
            availableQuantity: serverAvailable,
            isOutOfStock: isOut,
            quantity: newQty,
          };
        });
      });

      if (noticeMessage) {
        setCartNotice(noticeMessage);
      }
    } catch (err) {
      console.error('Failed to validate cart with product catalog:', err);
    }
  }, []);

  // CHANGE: Validate cart on initial mount/startup
  useEffect(() => {
    validateCart();
  }, [validateCart]);

  // CHANGE: Stock-aware addToCart factoring in existing cart quantity and server availableQuantity (Issue #07)
  const addToCart = (product, quantity = 1) => {
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    const availableStock =
      typeof product.availableQuantity === 'number'
        ? Math.max(0, product.availableQuantity)
        : 0;

    // Reject out-of-stock additions
    if (availableStock <= 0) {
      return { success: false, reason: 'OUT_OF_STOCK' };
    }

    let addedCount = 0;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        const existingItem = prevItems[existingIndex];
        const existingQty = existingItem.quantity || 0;
        const maxAddable = Math.max(0, availableStock - existingQty);

        if (maxAddable <= 0) {
          return prevItems; // Already at max capacity
        }

        const actualAdd = Math.min(qtyToAdd, maxAddable);
        addedCount = actualAdd;

        return prevItems.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                name: product.name || item.name,
                price: product.price !== undefined ? product.price : item.price,
                quantity: existingQty + actualAdd,
                availableQuantity: availableStock,
                isOutOfStock: false,
              }
            : item
        );
      } else {
        const actualAdd = Math.min(qtyToAdd, availableStock);
        addedCount = actualAdd;

        const imagePath =
          product.images && product.images.length > 0
            ? product.images[0].imagePath
            : product.imagePath || null;

        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            imagePath: imagePath,
            quantity: actualAdd,
            availableQuantity: availableStock,
            isOutOfStock: false,
          },
        ];
      }
    });

    return { success: addedCount > 0, addedQuantity: addedCount };
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // CHANGE: Quantity update enforcing 1 <= newQuantity <= availableQuantity
  const updateQuantity = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return; // Cannot become 0 or negative through controls
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== productId) return item;

        const availableStock =
          typeof item.availableQuantity === 'number'
            ? Math.max(0, item.availableQuantity)
            : 0;

        if (availableStock <= 0) {
          return { ...item, isOutOfStock: true };
        }

        const clampedQty = Math.min(availableStock, Math.max(1, qty));
        return { ...item, quantity: clampedQty, isOutOfStock: false };
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCartNotice(null);
    localStorage.removeItem('bakery_cart');
  };

  const clearCartNotice = () => {
    setCartNotice(null);
  };

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        validateCart,
        cartNotice,
        clearCartNotice,
        totalItemsCount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
