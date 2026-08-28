import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, AlertTriangle, X } from 'lucide-react';

/**
 * CartPage Component
 *
 * Displays shopping cart items, quantity adjusters, subtotal calculation,
 * real-time stock limits, and navigation back to the Home page bakery selection.
 *
 * CHANGE:
 *   - Calls validateCart() on mount to detect live stock fluctuations (Issue #07).
 *   - Displays clear "Out of Stock" vs "Maximum available quantity reached" indicators.
 *   - Enforces quantity bounds (cannot become <= 0, cannot exceed available stock).
 *   - "Explore Bakery Items" and "Continue Shopping" navigate to /#bakery-selection.
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

  // CHANGE: Revalidate cart against latest product catalog on page entry (Issue #07)
  useEffect(() => {
    validateCart();
  }, [validateCart]);

  // CHANGE: Determine whether cart contains any item with availableQuantity <= 0 / isOutOfStock (Issue #07)
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
            <ShoppingBag size={40} />
          </div>
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven't added any delicious bakery treats yet!</p>
          <Link to="/#bakery-selection" className="btn-primary">
            Explore Bakery Items
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
      <div className="page-header">
        <h1>Your Shopping Cart</h1>
        <p>Review items before placing your order</p>
      </div>

      {/* CHANGE: Display stock adjustment notice if server stock changed (Issue #07) */}
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
        {/* Item List */}
        <div className="cart-items-column">
          <div className="cart-card card">
            <div className="cart-card-header">
              <h3>Order Items ({cartItems.length})</h3>
              <button onClick={clearCart} className="btn-text-danger">
                Clear Cart
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
                    <img src={itemImg} alt={item.name} className="cart-item-img" />

                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <div className="cart-item-price">₹{Number(item.price).toFixed(2)} each</div>

                      {/* CHANGE: Distinct stock status messages (Issue #07) */}
                      {isOutOfStock ? (
                        <div className="cart-stock-notice out-of-stock">
                          Out of Stock
                        </div>
                      ) : isMaxStock ? (
                        <div className="cart-stock-notice max-reached">
                          Maximum available quantity reached
                        </div>
                      ) : null}
                    </div>

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

                    <div className="cart-item-subtotal">
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="btn-remove"
                      title="Remove Item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
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
            <h3>Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Estimated Tax</span>
              <span>₹0.00</span>
            </div>
            <div className="summary-row">
              <span>Delivery Charges</span>
              <span className="text-success">FREE</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row summary-total">
              <span>Total Amount</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              disabled={hasOutOfStockItems}
              className="btn-primary btn-block btn-large"
              title={
                hasOutOfStockItems
                  ? 'Please remove out-of-stock items before proceeding to checkout'
                  : 'Proceed to Checkout'
              }
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            {/* CHANGE: Notice informing user why checkout cannot proceed when out-of-stock items exist (Issue #07) */}
            {hasOutOfStockItems && (
              <div className="checkout-blocked-notice">
                <AlertTriangle size={14} />
                <span>Remove out-of-stock items to proceed to checkout</span>
              </div>
            )}

            <Link to="/#bakery-selection" className="continue-shopping-link">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
