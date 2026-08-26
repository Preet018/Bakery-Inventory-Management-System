import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * CartContext
 *
 * Manages customer shopping cart state, item quantities, and localStorage persistence.
 *
 * CHANGE:
 *   - Fixed in-place state mutation bug in addToCart.
 *   - Pure immutable array update prevents double-counting or exponential quantity growth in React.
 *   - Explicit number conversion guarantees exact requested quantity is added per click.
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

  useEffect(() => {
    try {
      localStorage.setItem('bakery_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cartItems]);

  // CHANGE: Pure immutable cart update ensuring exact quantity addition per click
  const addToCart = (product, quantity = 1) => {
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        // Return a new array with an immutable updated item copy
        return prevItems.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      } else {
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
            quantity: qtyToAdd,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // CHANGE: Immutable quantity update
  const updateQuantity = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('bakery_cart');
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
