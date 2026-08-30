import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';
import { addressService } from '../../services/addressService';
import { paymentService } from '../../services/paymentService';
import { razorpayService } from '../../services/razorpayService';
import artisanBakeryLogoImg from '../../assets/artisan-baecurry.png';
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
  Lock,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Truck,
  ArrowRight,
  Cake,
  ExternalLink,
} from 'lucide-react';

/**
 * CheckoutPage Component
 *
 * Implements Issue #09 Checkout & Razorpay Payment Flow:
 *  - Section Order: Order Summary FIRST, followed by Delivery Address, Contact Number, and Payment Method
 *  - Generous and distinct spacing between sections
 *  - Premium, modern bakery UI with rich card styling, badges, and trust indicators
 *  - CUSTOMER role requirement with login redirect preserving destination
 *  - Loading customer's saved addresses with default pre-selection
 *  - Contact phone number validation
 *  - Payment method selection (NETBANKING, CREDIT_CARD, DEBIT_CARD)
 *  - Cart stock / out-of-stock protection
 *  - Submitting POST /api/orders & launching Razorpay Checkout SDK modal
 *  - Server-side signature verification & receipt redirection
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
      <div className="page-container checkout-empty-wrapper">
        <div className="card text-center empty-checkout-card">
          <div className="empty-cart-icon-circle">
            <ShoppingBag size={36} />
          </div>
          <h2>Your Cart is Empty</h2>
          <p className="text-muted mt-2">Add delicious artisan items from our bakery selection before proceeding to checkout.</p>
          <Link to="/#bakery-selection" className="btn-primary mt-4">
            <span>Explore Bakery Selection</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Stock / Out-of-Stock check (Issue #07 preserved)
  const hasOutOfStockItems = cartItems.some(
    (item) => (item.availableQuantity !== undefined && item.availableQuantity <= 0) || item.isOutOfStock
  );

  const totalItemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

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
        paymentMethod: 'CREDIT_CARD',
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

      // Convert artisan-bakery.png into a compact Base64 PNG Data URI preserving aspect ratio and matching modal background
      const logoPngDataUri = await new Promise((resolve) => {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const size = 128;
              const canvas = document.createElement('canvas');
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');

              // Fill background with same color as payment gateway modal (#C05621)
              ctx.fillStyle = '#C05621';
              ctx.fillRect(0, 0, size, size);

              // Preserve aspect ratio and center logo
              const nw = img.naturalWidth || img.width || size;
              const nh = img.naturalHeight || img.height || size;
              const aspect = nw / nh;
              let drawW = size;
              let drawH = size;
              let drawX = 0;
              let drawY = 0;

              if (aspect > 1) {
                drawH = size / aspect;
                drawY = (size - drawH) / 2;
              } else {
                drawW = size * aspect;
                drawX = (size - drawW) / 2;
              }

              ctx.drawImage(img, drawX, drawY, drawW, drawH);
              resolve(canvas.toDataURL('image/png'));
            } catch {
              resolve(artisanBakeryLogoImg);
            }
          };
          img.onerror = () => resolve(artisanBakeryLogoImg);
          img.src = artisanBakeryLogoImg;
        } catch {
          resolve(artisanBakeryLogoImg);
        }
      });

      // Step 2: Configure Razorpay Checkout Options (Debit Card, Credit Card & Netbanking)
      const options = {
        key: razorpayKeyId,
        amount: orderAmountPaise,
        currency: orderCurrency,
        name: '𝐀𝐑𝐓𝐈𝐒𝐀𝐍 𝐁𝐀𝐊𝐄𝐑𝐘',
        description: `Order #${createdOrder.id} Payment`,
        image: logoPngDataUri,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.username || '',
          email: user?.email || '',
          contact: trimmedPhone,
        },
        config: {
          display: {
            blocks: {
              debit_card: {
                name: 'Debit Card',
                instruments: [
                  {
                    method: 'card',
                    card_type: 'debit',
                  },
                ],
              },
              credit_card: {
                name: 'Credit Card',
                instruments: [
                  {
                    method: 'card',
                    card_type: 'credit',
                  },
                ],
              },
              netbanking: {
                name: 'Netbanking',
                instruments: [
                  {
                    method: 'netbanking',
                  },
                ],
              },
            },
            sequence: ['block.debit_card', 'block.credit_card', 'block.netbanking'],
            preferences: {
              show_default_blocks: false,
            },
            hide: [
              { method: 'upi' },
              { method: 'wallet' },
              { method: 'emi' },
              { method: 'paylater' },
              { method: 'cardless_emi' },
            ],
          },
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
      {/* Page Header */}
      <div className="checkout-page-header">
        <div className="checkout-badge-pill">
          <ShieldCheck size={14} className="text-emerald" />
          <span>100% SECURE CHECKOUT</span>
        </div>
        <h1>Checkout & Payment</h1>
        <p>Review your bakery selection, choose your delivery address, and complete payment securely via Razorpay.</p>
      </div>

      {/* Stock warning banner */}
      {hasOutOfStockItems && (
        <div className="alert alert-danger mb-4 checkout-alert">
          <AlertTriangle size={20} className="alert-icon-main" />
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

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger mb-4 checkout-alert">
          <AlertCircle size={20} className="alert-icon-main" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: ORDER SUMMARY FIRST, then DELIVERY & PAYMENT FORM */}
      <div className="checkout-grid">
        {/* =========================================================================
            SECTION 1: ORDER SUMMARY (Placed First as Requested)
            ========================================================================= */}
        <div className="checkout-summary-column">
          <div className="card checkout-summary-card">
            <div className="summary-header">
              <div className="summary-title-row">
                <div className="summary-icon-box">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3>Order Summary</h3>
                  <span className="summary-item-count">{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in cart</span>
                </div>
              </div>
              <Link to="/cart" className="btn-edit-cart">
                <span>Edit</span>
              </Link>
            </div>

            {/* Items List */}
            <div className="checkout-item-list">
              {cartItems.map((item) => {
                const isItemOutOfStock =
                  (item.availableQuantity !== undefined && item.availableQuantity <= 0) || item.isOutOfStock;

                return (
                  <div
                    key={item.id}
                    className={`checkout-item-row ${isItemOutOfStock ? 'item-out-of-stock' : ''}`}
                  >
                    <div className="checkout-item-thumb-box">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="checkout-item-thumb-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="checkout-item-thumb-placeholder"
                        style={{ display: item.imageUrl ? 'none' : 'flex' }}
                      >
                        <Cake size={18} />
                      </div>
                    </div>

                    <div className="checkout-item-info">
                      <div className="checkout-item-name-row">
                        <span className="item-name">{item.name}</span>
                        {isItemOutOfStock && (
                          <span className="badge-out-of-stock-inline">Out of Stock</span>
                        )}
                      </div>
                      <div className="checkout-item-qty-row">
                        <span className="item-qty-pill">Qty: {item.quantity}</span>
                        <span className="item-unit-price text-muted text-xs">@ ₹{Number(item.price).toFixed(2)} each</span>
                      </div>
                    </div>

                    <div className="checkout-item-total">
                      <span>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Calculation Box */}
            <div className="summary-price-box">
              <div className="summary-price-row">
                <span className="text-muted">Items Subtotal</span>
                <span className="font-semibold">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="summary-price-row">
                <span className="text-muted">Delivery Charges</span>
                <span className="badge-free-delivery">
                  <Truck size={13} />
                  <span>FREE</span>
                </span>
              </div>
              <div className="summary-price-row">
                <span className="text-muted">Bakery Packaging & Handling</span>
                <span className="text-emerald font-semibold">FREE</span>
              </div>
            </div>

            {/* Total Payable Box */}
            <div className="summary-total-banner">
              <div className="total-label-block">
                <span className="total-title">Total Payable</span>
                <span className="total-subtext">Inclusive of all bakery taxes</span>
              </div>
              <div className="total-amount-display">
                ₹{totalAmount.toFixed(2)}
              </div>
            </div>

            {/* Freshness & Trust Highlights */}
            <div className="checkout-trust-box">
              <div className="trust-item">
                <Sparkles size={16} className="trust-icon" />
                <span>Baked fresh daily on order confirmation</span>
              </div>
              <div className="trust-item">
                <ShieldCheck size={16} className="trust-icon" />
                <span>100% contactless & hygienic packaging</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: DELIVERY ADDRESS, CONTACT PHONE & PAYMENT METHOD
            ========================================================================= */}
        <div className="checkout-form-column">
          <form onSubmit={handleSubmitOrder} className="checkout-form-wrapper">
            {/* Step 1: Select Delivery Address */}
            <div className="checkout-step-card">
              <div className="step-card-header">
                <div className="step-badge-title">
                  <div className="step-number-circle">1</div>
                  <div>
                    <h3>Select Delivery Address</h3>
                    <p className="step-subtitle">Where should we deliver your freshly baked order?</p>
                  </div>
                </div>
                <Link to="/account" className="btn-manage-addresses">
                  <Plus size={14} />
                  <span>Manage in Account</span>
                </Link>
              </div>

              <div className="step-card-body">
                {loadingAddresses ? (
                  <div className="checkout-address-loading">
                    <RefreshCw size={22} className="spinner text-primary" />
                    <span>Loading your saved delivery addresses...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="checkout-no-address-state">
                    <div className="no-address-icon-circle">
                      <MapPin size={26} />
                    </div>
                    <h4>No Saved Delivery Addresses Found</h4>
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
                          <div className="address-radio-wrapper">
                            <input
                              type="radio"
                              name="savedAddress"
                              value={addr.id}
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              disabled={submitting}
                            />
                          </div>
                          <div className="checkout-address-content">
                            <div className="checkout-address-header">
                              <span className={`address-label-tag tag-${addr.label?.toLowerCase() || 'home'}`}>
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
                                  <Star size={11} fill="currentColor" /> Default Address
                                </span>
                              )}
                            </div>
                            <p className="checkout-address-line">{addr.addressLine}</p>
                            {addr.landmark && (
                              <p className="checkout-address-landmark">
                                <strong>Landmark:</strong> {addr.landmark}
                              </p>
                            )}
                            <p className="checkout-address-city">
                              {addr.city}, {addr.state} - {addr.postalCode}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Contact Phone Number */}
            <div className="checkout-step-card">
              <div className="step-card-header">
                <div className="step-badge-title">
                  <div className="step-number-circle">2</div>
                  <div>
                    <h3>Contact Phone Number</h3>
                    <p className="step-subtitle">For delivery driver updates and OTP verification</p>
                  </div>
                </div>
              </div>

              <div className="step-card-body">
                <div className="form-group checkout-form-group">
                  <label htmlFor="checkout-phone" className="checkout-input-label">
                    10-Digit Mobile Number *
                  </label>
                  <div className="input-with-icon">
                    <Phone size={18} className="input-icon text-muted" />
                    <input
                      id="checkout-phone"
                      type="tel"
                      required
                      maxLength={15}
                      placeholder="e.g. 9876543210"
                      value={contactPhoneNumber}
                      onChange={(e) => setContactPhoneNumber(e.target.value)}
                      disabled={submitting}
                      className="checkout-phone-input"
                    />
                  </div>
                  <span className="field-hint text-xs text-muted mt-1.5">
                    Your delivery partner will call or send delivery updates to this number.
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Action Box */}
            <div className="checkout-action-box">
              <button
                type="submit"
                disabled={submitting || hasOutOfStockItems || addresses.length === 0}
                className="btn-primary btn-block btn-pay-now"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={20} className="spinner" />
                    <span>
                      {processingStatus === 'creating_order'
                        ? 'Creating Your Order...'
                        : processingStatus === 'verifying_payment'
                        ? 'Verifying Payment Signature...'
                        : 'Launching Razorpay Payment...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock size={19} />
                    <span>Pay with Razorpay (₹{totalAmount.toFixed(2)})</span>
                  </>
                )}
              </button>

              <div className="checkout-security-notice">
                <ShieldCheck size={16} className="text-emerald" />
                <span>
                  128-bit SSL encrypted. Payment is processed securely via Razorpay payment gateway.
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
