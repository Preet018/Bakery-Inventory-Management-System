import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';

/**
 * CartPage Component
 *
 * Displays shopping cart items, quantity adjusters, subtotal calculation,
 * and navigation back to the Home page bakery selection.
 *
 * CHANGE:
 *   - "Explore Bakery Items" and "Continue Shopping" navigate to /#bakery-selection (Home storefront selection)
 *     instead of obsolete /products route.
 */

export const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="cart-page page-container">
        <div className="empty-cart-card card">
          <div className="empty-icon-circle">
            <ShoppingBag size={40} />
          </div>
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven't added any delicious bakery treats yet!</p>
          {/* CHANGE: Navigates to Home page bakery selection section */}
          <Link to="/#bakery-selection" className="btn-primary">
            Explore Bakery Items
          </Link>
        </div>
      </div>
    );
  }

  const handleProceedToCheckout = () => {
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

                return (
                  <div key={item.id} className="cart-item">
                    <img src={itemImg} alt={item.name} className="cart-item-img" />

                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <div className="cart-item-price">₹{Number(item.price).toFixed(2)} each</div>
                    </div>

                    <div className="cart-item-qty">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="qty-btn"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
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

            <button onClick={handleProceedToCheckout} className="btn-primary btn-block btn-large">
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            {/* CHANGE: Navigates to Home page bakery selection section */}
            <Link to="/#bakery-selection" className="continue-shopping-link">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
