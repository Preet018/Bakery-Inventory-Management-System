import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';
import { addressService } from '../../services/addressService';
import { paymentService } from '../../services/paymentService';
import { razorpayService } from '../../services/razorpayService';
import {
  MapPin,
  Phone,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Home,
  Briefcase,
  Star,
  Lock
} from 'lucide-react';

/**
 * CheckoutPage Component
 *
 * Implements Issue #09 Checkout & Razorpay Payment Flow:
 *  - CUSTOMER role requirement with login redirect preserving destination
 *  - Loading customer's saved addresses with default pre-selection
 *  - Contact phone number validation
 *  - Payment method selection (UPI, CREDIT_CARD, DEBIT_CARD)
 *  - Cart stock / out-of-stock protection
 *  - Submitting POST /api/orders
 *  - Launching Razorpay Checkout SDK modal
 *  - Server-side signature verification via POST /api/payments/{id}/verify
 *  - Cart clearance and receipt redirection only on successful verification
 *  - Failure and cancellation error handling preserving cart
 */
export const CheckoutPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { cartItems, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication guard: Require CUSTOMER
  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [contactPhoneNumber, setContactPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD'

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null); // 'creating_order' | 'awaiting_payment' | 'verifying_payment'

  // Fetch saved addresses for the authenticated customer
  const fetchAddresses = useCallback(async () => {
    if (!isCustomer) return;
    try {
      setLoadingAddresses(true);
      setError(null);
      const data = await addressService.getAllAddresses();
      setAddresses(data);

      if (data && data.length > 0) {
        // Pre-select the default address, otherwise first address
        const defaultAddr = data.find((addr) => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else {
          setSelectedAddressId(data[0].id);
        }
      } else {
        setSelectedAddressId(null);
      }
    } catch (err) {
      console.error('Failed to load saved addresses for checkout:', err);
      setError('Could not load saved delivery addresses. Please refresh or try again.');
    } finally {
      setLoadingAddresses(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // If user is not authenticated or not customer, redirect to login preserving destination
  if (!isAuthenticated || !isCustomer) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="page-container">
        <div className="card text-center empty-checkout-card">
          <h2>Your Cart is Empty</h2>
          <p className="text-muted mt-2">Add delicious items from our bakery selection before proceeding to checkout.</p>
          <Link to="/#bakery-selection" className="btn-primary mt-4">
            Explore Bakery Selection
          </Link>
        </div>
      </div>
    );
  }

  // Stock / Out-of-Stock check (Issue #07 preserved)
  const hasOutOfStockItems = cartItems.some(
    (item) => (item.availableQuantity !== undefined && item.availableQuantity <= 0) || item.isOutOfStock
  );

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation checks
    if (!selectedAddressId) {
      setError('Please select a saved delivery address to proceed.');
      return;
    }

    const trimmedPhone = contactPhoneNumber.trim();
    if (!trimmedPhone || trimmedPhone.length < 10) {
      setError('Please provide a valid 10-digit contact phone number for delivery.');
      return;
    }

    if (hasOutOfStockItems) {
      setError('Your cart contains out-of-stock items. Please return to your cart and remove them before checking out.');
      return;
    }

    setSubmitting(true);
    setProcessingStatus('creating_order');

    let createdOrder = null;

    try {
      // Step 1: Submit Order Creation
      const orderPayload = {
        contact: trimmedPhone,
        savedAddressId: Number(selectedAddressId),
        paymentMethod: paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      createdOrder = await orderService.createOrder(orderPayload);
      const payment = createdOrder.payment;

      if (!payment || !payment.id) {
        throw new Error('Payment record was not generated for this order. Please try again.');
      }

      const paymentId = payment.id;
      const razorpayOrderId = payment.providerOrderId;
      const razorpayKeyId = payment.providerKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '';
      const orderAmountPaise = Math.round(Number(payment.amount || createdOrder.totalAmount) * 100);
      const orderCurrency = payment.currency || 'INR';

      setProcessingStatus('awaiting_payment');

      // Step 2: Configure Razorpay Checkout Options
      const options = {
        key: razorpayKeyId,
        amount: orderAmountPaise,
        currency: orderCurrency,
        name: 'Artisan Bakery',
        description: `Order #${createdOrder.id} Payment (${paymentMethod})`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.username || '',
          email: user?.email || '',
          contact: trimmedPhone,
        },
        theme: {
          color: '#C05621',
        },
        handler: async (response) => {
          // Step 3: Handle Razorpay success response and verify signature on backend
          setSubmitting(true);
          setProcessingStatus('verifying_payment');

          try {
            const verificationPayload = {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            };

            await paymentService.verifyAndConfirmPayment(paymentId, verificationPayload);

            // Step 4: Verification successful -> Clear cart & navigate to receipt
            clearCart();
            navigate(`/customer/orders/${createdOrder.id}`, {
              state: { orderPlaced: true, paymentSuccess: true },
            });
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            const verifyMsg =
              verifyErr.response?.data?.message ||
              'Payment verification failed. If your account was debited, please contact support with Order ID #' +
                createdOrder.id;
            setError(verifyMsg);
            setSubmitting(false);
            setProcessingStatus(null);
          }
        },
        modal: {
          ondismiss: () => {
            // Dismissal / Cancellation: keep cart intact, do NOT call markAsFailed, allow retry
            setSubmitting(false);
            setProcessingStatus(null);
            setError('Payment window was closed. You can retry paying to complete your order.');
          },
        },
      };

      // Step 5: Open Razorpay Checkout modal
      const onPaymentFailed = async (failureResponse) => {
        setSubmitting(false);
        setProcessingStatus(null);
        const errorDesc = failureResponse?.error?.description || 'Payment was declined by your bank or gateway.';
        setError(`Payment Failed: ${errorDesc}. You can choose another payment method and try again.`);

        try {
          if (paymentId) {
            await paymentService.markAsFailed(paymentId);
          }
        } catch (failErr) {
          console.warn('Failed to record payment failure on server:', failErr);
        }
      };

      await razorpayService.openRazorpayCheckout(options, onPaymentFailed);
    } catch (err) {
      console.error('Checkout processing error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to initiate checkout. Please verify inventory and try again.';
      setError(msg);
      setSubmitting(false);
      setProcessingStatus(null);
    }
  };

  return (
    <div className="checkout-page page-container">
      <div className="page-header">
        <h1>Checkout & Payment</h1>
        <p>Review your items, select a saved delivery address, and complete payment via Razorpay</p>
      </div>

      {hasOutOfStockItems && (
        <div className="alert alert-danger mb-4">
          <AlertTriangle size={18} />
          <div>
            <strong>Cannot Proceed to Checkout</strong>
            <p className="text-sm mt-1">
              One or more items in your cart are currently out of stock. Please{' '}
              <Link to="/cart" className="underline font-bold">
                view your cart
              </Link>{' '}
              and remove unavailable items before placing an order.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="checkout-grid">
        {/* Form Column */}
        <div className="checkout-form-column">
          <form onSubmit={handleSubmitOrder} className="card checkout-card">
            {/* 1. Saved Delivery Address Selector */}
            <div className="checkout-section">
              <div className="checkout-section-header">
                <div className="section-title-wrapper">
                  <div className="section-step-num">1</div>
                  <h3>Select Delivery Address</h3>
                </div>
                <Link to="/account" className="btn-link-account text-sm">
                  <Plus size={14} />
                  <span>Manage in Account</span>
                </Link>
              </div>

              {loadingAddresses ? (
                <div className="checkout-address-loading">
                  <RefreshCw size={20} className="spinner text-primary" />
                  <span>Loading your saved addresses...</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="checkout-no-address-state">
                  <MapPin size={28} className="text-amber mb-2" />
                  <h4>No Saved Delivery Addresses</h4>
                  <p className="text-sm text-muted">
                    You need at least one saved delivery address with pinpoint location to complete checkout.
                  </p>
                  <Link to="/account" className="btn-primary btn-sm mt-3">
                    <Plus size={15} />
                    <span>Add Delivery Address in Account</span>
                  </Link>
                </div>
              ) : (
                <div className="checkout-addresses-list">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <label
                        key={addr.id}
                        className={`checkout-address-option ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="savedAddress"
                          value={addr.id}
                          checked={isSelected}
                          onChange={() => setSelectedAddressId(addr.id)}
                          disabled={submitting}
                        />
                        <div className="checkout-address-content">
                          <div className="checkout-address-header">
                            <span className="address-label-tag">
                              {addr.label === 'Home' ? (
                                <Home size={12} />
                              ) : addr.label === 'Work' ? (
                                <Briefcase size={12} />
                              ) : (
                                <MapPin size={12} />
                              )}
                              <span>{addr.label}</span>
                            </span>
                            {addr.isDefault && (
                              <span className="default-pill-small">
                                <Star size={10} fill="currentColor" /> Default
                              </span>
                            )}
                          </div>
                          <p className="checkout-address-line">{addr.addressLine}</p>
                          {addr.landmark && (
                            <p className="checkout-address-landmark text-muted text-xs">
                              <strong>Landmark:</strong> {addr.landmark}
                            </p>
                          )}
                          <p className="checkout-address-city text-xs text-muted">
                            {addr.city}, {addr.state} - {addr.postalCode}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Contact Phone Number */}
            <div className="checkout-section">
              <div className="section-title-wrapper">
                <div className="section-step-num">2</div>
                <h3>Contact Phone Number</h3>
              </div>
              <div className="form-group mt-3">
                <label htmlFor="checkout-phone">10-Digit Mobile Number for Delivery *</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    maxLength={15}
                    placeholder="e.g. 9876543210"
                    value={contactPhoneNumber}
                    onChange={(e) => setContactPhoneNumber(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <span className="field-hint text-xs text-muted mt-1">
                  Delivery updates and OTP will be sent to this number.
                </span>
              </div>
            </div>

            {/* 3. Payment Method Selection */}
            <div className="checkout-section">
              <div className="section-title-wrapper">
                <div className="section-step-num">3</div>
                <h3>Select Payment Method</h3>
              </div>
              <p className="text-xs text-muted mb-3">
                Securely powered by Razorpay. All major UPI apps, cards, and netbanking accepted.
              </p>

              <div className="payment-options">
                <label className={`payment-option-card ${paymentMethod === 'UPI' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={submitting}
                  />
                  <div className="option-details">
                    <div className="option-title">UPI Payment (GPay, PhonePe, Paytm, BHIM)</div>
                    <div className="option-desc">Instant payment through any UPI app or QR scan</div>
                  </div>
                </label>

                <label className={`payment-option-card ${paymentMethod === 'CREDIT_CARD' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CREDIT_CARD"
                    checked={paymentMethod === 'CREDIT_CARD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={submitting}
                  />
                  <div className="option-details">
                    <div className="option-title">Credit Card</div>
                    <div className="option-desc">Visa, MasterCard, RuPay, and American Express</div>
                  </div>
                </label>

                <label className={`payment-option-card ${paymentMethod === 'DEBIT_CARD' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="DEBIT_CARD"
                    checked={paymentMethod === 'DEBIT_CARD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={submitting}
                  />
                  <div className="option-details">
                    <div className="option-title">Debit Card</div>
                    <div className="option-desc">Direct debit from your savings or current bank account</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || hasOutOfStockItems || addresses.length === 0}
              className="btn-primary btn-block btn-large mt-4"
            >
              {submitting ? (
                <>
                  <RefreshCw size={20} className="spinner" />
                  <span>
                    {processingStatus === 'creating_order'
                      ? 'Creating Order...'
                      : processingStatus === 'verifying_payment'
                      ? 'Verifying Payment...'
                      : 'Connecting to Razorpay...'}
                  </span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Pay with Razorpay (₹{totalAmount.toFixed(2)})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Items Review */}
        <div className="checkout-summary-column">
          <div className="card summary-card">
            <h3>Order Summary ({cartItems.length} items)</h3>
            <div className="checkout-item-list">
              {cartItems.map((item) => {
                const isItemOutOfStock =
                  (item.availableQuantity !== undefined && item.availableQuantity <= 0) || item.isOutOfStock;

                return (
                  <div key={item.id} className={`checkout-item-row ${isItemOutOfStock ? 'item-out-of-stock' : ''}`}>
                    <div className="item-details-block">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty text-muted"> × {item.quantity}</span>
                      {isItemOutOfStock && <span className="badge-out-of-stock-inline">Out of Stock</span>}
                    </div>
                    <span className="item-price">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span className="text-muted">Subtotal</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="text-muted">Delivery Charges</span>
              <span className="text-success font-bold">FREE</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row summary-total">
              <span>Total Payable</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>

            <div className="checkout-security-notice mt-4">
              <ShieldCheck size={16} className="text-emerald inline-icon" />
              <span className="text-xs text-muted">
                128-bit SSL encrypted. Payment is processed securely via Razorpay.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
