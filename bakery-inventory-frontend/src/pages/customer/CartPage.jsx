import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  X,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';

/**
 * CartPage Component
 *
 * Displays shopping cart items, quantity adjusters, subtotal calculation,
 * real-time stock limits, and navigation back to the Home page bakery selection.
 */
export const CartPage = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalAmount,
    validateCart,
    cartNotice,
    clearCartNotice,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Revalidate cart against latest product catalog on page entry
  useEffect(() => {
    validateCart();
  }, [validateCart]);

  // Determine whether cart contains any item with availableQuantity <= 0 / isOutOfStock
  const hasOutOfStockItems = cartItems.some((item) => {
    const available =
      typeof item.availableQuantity === 'number'
        ? item.availableQuantity
        : 0;
    return available <= 0 || item.isOutOfStock === true;
  });

  if (cartItems.length === 0) {
    return (
      <div className="cart-page page-container">
        <div className="empty-cart-card card">
          <div className="empty-icon-circle">
            <ShoppingBag size={48} />
          </div>
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven't added any freshly baked treats yet!</p>
          <Link to="/#bakery-selection" className="btn-primary btn-explore">
            <Sparkles size={18} />
            <span>Explore Bakery Items</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    if (hasOutOfStockItems) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="cart-page page-container">
      <div className="cart-header-section">
        <div>
          <h1 className="cart-page-title">Your Shopping Cart</h1>
          <p className="cart-page-subtitle">Review items before placing your order</p>
        </div>
      </div>

      {/* Stock adjustment notification banner */}
      {cartNotice && (
        <div className="cart-adjustment-banner">
          <div className="cart-notice-content">
            <AlertTriangle size={18} className="cart-notice-icon" />
            <span>{cartNotice}</span>
          </div>
          <button
            type="button"
            onClick={clearCartNotice}
            className="btn-notice-dismiss"
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="cart-grid">
        {/* Item List Column */}
        <div className="cart-items-column">
          <div className="cart-card card">
            <div className="cart-card-header">
              <div className="cart-count-title">
                <h3>Order Items</h3>
                <span className="cart-items-pill">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
              </div>
              <button
                type="button"
                onClick={clearCart}
                className="btn-clear-cart"
                title="Clear all items in cart"
              >
                <Trash2 size={15} />
                <span>Clear Cart</span>
              </button>
            </div>

            <div className="cart-items-list">
              {cartItems.map((item) => {
                const itemImg = productService.getImageUrl(item.imagePath);
                const availableStock =
                  typeof item.availableQuantity === 'number'
                    ? Math.max(0, item.availableQuantity)
                    : 0;
                const isOutOfStock = availableStock <= 0 || item.isOutOfStock;
                const isMaxStock = !isOutOfStock && item.quantity >= availableStock;

                return (
                  <div key={item.id} className={`cart-item ${isOutOfStock ? 'item-out-of-stock' : ''}`}>
                    <div className="cart-item-img-wrapper">
                      <img src={itemImg} alt={item.name} className="cart-item-img" />
                    </div>

                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <div className="cart-item-price">₹{Number(item.price).toFixed(2)} each</div>

                      {/* Stock status messages */}
                      {isOutOfStock ? (
                        <div className="cart-stock-notice out-of-stock">
                          <AlertTriangle size={12} />
                          <span>Out of Stock</span>
                        </div>
                      ) : isMaxStock ? (
                        <div className="cart-stock-notice max-reached">
                          <span>Maximum available quantity reached</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="cart-item-qty-wrap">
                      <div className="cart-item-qty">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isOutOfStock}
                          className="qty-btn"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isMaxStock || isOutOfStock}
                          className="qty-btn"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-subtotal">
                      <span className="subtotal-label">Subtotal</span>
                      <span className="subtotal-amount">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="btn-remove-item"
                      title="Remove Item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart Summary Column */}
        <div className="cart-summary-column">
          <div className="summary-card card">
            <h3 className="summary-title">Order Summary</h3>

            <div className="summary-breakdown">
              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value font-mono">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Estimated Tax</span>
                <span className="summary-value font-mono">₹0.00</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Delivery Charges</span>
                <span className="delivery-free-badge">FREE</span>
              </div>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row summary-total">
              <span>Total Amount</span>
              <span className="total-amount-highlight font-mono">₹{totalAmount.toFixed(2)}</span>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              disabled={hasOutOfStockItems}
              className="btn-primary btn-checkout"
              title={
                hasOutOfStockItems
                  ? 'Please remove out-of-stock items before proceeding to checkout'
                  : 'Proceed to Checkout'
              }
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            {hasOutOfStockItems && (
              <div className="checkout-blocked-notice">
                <AlertTriangle size={14} />
                <span>Remove out-of-stock items to proceed to checkout</span>
              </div>
            )}

            <Link to="/#bakery-selection" className="continue-shopping-link">
              <ArrowLeft size={16} />
              <span>Continue Shopping</span>
            </Link>

            {/* Trust Assurances */}
            <div className="cart-trust-badges">
              <div className="trust-badge-item">
                <ShieldCheck size={16} className="trust-icon" />
                <span>Secure Checkout</span>
              </div>
              <div className="trust-badge-item">
                <Sparkles size={16} className="trust-icon" />
                <span>100% Fresh Daily</span>
              </div>
              <div className="trust-badge-item">
                <Truck size={16} className="trust-icon" />
                <span>Fast Bakery Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
