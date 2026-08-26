import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';
import { Truck, Phone, CreditCard, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * NEW FILE: CheckoutPage Component
 * Order placement form requiring delivery address, contact phone, payment method (COD or RAZORPAY),
 * and submitting to Spring Boot POST /api/orders endpoint.
 */

export const CheckoutPage = () => {
  const { cartItems, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhoneNumber, setContactPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (cartItems.length === 0) {
    return (
      <div className="page-container">
        <div className="card text-center">
          <h2>No Items to Checkout</h2>
          <p>Your cart is currently empty.</p>
          <Link to="/#bakery-selection" className="btn-primary">Explore Bakery Items</Link>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Build order payload matching backend CustomerOrderCreateRequest
      const orderPayload = {
        deliveryAddress: deliveryAddress.trim(),
        contactPhoneNumber: contactPhoneNumber.trim(),
        paymentMethod: paymentMethod, // "COD" or "RAZORPAY"
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      const createdOrder = await orderService.createOrder(orderPayload);

      // Clear shopping cart state upon successful placement
      clearCart();

      // Navigate to order details receipt page
      navigate(`/customer/orders/${createdOrder.id}`, {
        state: { orderPlaced: true },
      });
    } catch (err) {
      console.error('Order creation error:', err);
      const msg = err.response?.data?.message || err.response?.data || 'Failed to place order. Insufficient stock or invalid details.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page page-container">
      <div className="page-header">
        <h1>Checkout & Order Placement</h1>
        <p>Provide your delivery information to complete the order</p>
      </div>

      {error && (
        <div className="error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="checkout-grid">
        {/* Form Column */}
        <div className="checkout-form-column">
          <form onSubmit={handleSubmitOrder} className="card checkout-card">
            <h3>1. Delivery Information</h3>

            <div className="form-group">
              <label>Delivery Address *</label>
              <div className="input-with-icon">
                <Truck size={18} className="input-icon" />
                <textarea
                  required
                  rows={3}
                  placeholder="Street name, apartment, building, city, postal code"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contact Phone Number *</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={contactPhoneNumber}
                  onChange={(e) => setContactPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <h3>2. Payment Method</h3>
            <div className="payment-options">
              <label className={`payment-option-card ${paymentMethod === 'COD' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-details">
                  <div className="option-title">Cash on Delivery (COD)</div>
                  <div className="option-desc">Pay with cash when bakery items are delivered to your doorstep</div>
                </div>
              </label>

              <label className={`payment-option-card ${paymentMethod === 'RAZORPAY' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="RAZORPAY"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-details">
                  <div className="option-title">Online Payment (Razorpay)</div>
                  <div className="option-desc">Pay securely using UPI, Credit/Debit Cards, or Netbanking</div>
                </div>
              </label>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary btn-block btn-large">
              <ShieldCheck size={20} />
              <span>{submitting ? 'Processing Order...' : `Confirm & Place Order (₹${totalAmount.toFixed(2)})`}</span>
            </button>
          </form>
        </div>

        {/* Order Items Review */}
        <div className="checkout-summary-column">
          <div className="card summary-card">
            <h3>Order Items ({cartItems.length})</h3>
            <div className="checkout-item-list">
              {cartItems.map((item) => (
                <div key={item.id} className="checkout-item-row">
                  <div>
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty"> x {item.quantity}</span>
                  </div>
                  <span className="item-price">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row summary-total">
              <span>Total Payable</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
