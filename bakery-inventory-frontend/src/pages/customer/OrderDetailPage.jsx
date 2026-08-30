import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { getErrorMessage } from '../../utils/apiError';
import artisanBakeryLogoImg from '../../assets/artisan-baecurry.png';
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  RefreshCw,
  XCircle,
  Printer,
  Calendar,
  Clock,
  CreditCard,
  Cake,
  Truck,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

/**
 * Status definitions and metadata for Customer Invoice View
 */
const STATUS_META = {
  PENDING_PAYMENT: {
    label: 'Pending Payment',
    badgeClass: 'badge-order-placed',
    icon: <Clock size={13} />,
    description: 'Awaiting customer payment confirmation',
  },
  PLACED: {
    label: 'Placed',
    badgeClass: 'badge-order-placed',
    icon: <Clock size={13} />,
    description: 'Order received and awaiting store confirmation',
  },
  CONFIRMED: {
    label: 'Confirmed',
    badgeClass: 'badge-order-confirmed',
    icon: <CheckCircle2 size={13} />,
    description: 'Order confirmed! Queued for kitchen preparation',
  },
  PROCESSING: {
    label: 'Preparing / Processing',
    badgeClass: 'badge-order-processing',
    icon: <RefreshCw size={13} />,
    description: 'Your bakery items are being freshly prepared and packed',
  },
  READY: {
    label: 'Ready for Dispatch',
    badgeClass: 'badge-order-ready',
    icon: <Package size={13} />,
    description: 'Order is packed fresh and ready for delivery/pickup',
  },
  DELIVERED: {
    label: 'Delivered',
    badgeClass: 'badge-order-delivered',
    icon: <CheckCircle2 size={13} />,
    description: 'Delivered with care. Thank you for your purchase!',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeClass: 'badge-order-cancelled',
    icon: <XCircle size={13} />,
    description: 'Order was cancelled and stock was restored',
  },
};

const LIFECYCLE_STEPS = ['PLACED', 'CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED'];

/**
 * OrderDetailPage Component
 *
 * Premium artisan bakery invoice & order receipt view:
 * - Real product catalog enrichment (names, images, categories)
 * - Order progress lifecycle stepper
 * - Detailed pricing breakdown & tax receipt header
 * - Delivery address & payment method cards
 * - Secure cancellation flow with consequences confirmation
 * - Print / Save PDF capability
 */
export const OrderDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [msg, setMsg] = useState(
    location.state?.orderPlaced ? 'Order placed successfully! Thank you for choosing Artisan BaeCurry.' : null
  );

  // Auto-dismiss success notification banner after 6 seconds (5-8 seconds range)
  useEffect(() => {
    if (msg) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => {
        setMsg(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  // CHANGE: State management for customer cancellation in View Details page
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchOrderAndCatalog = async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setPageError(null);

      const [orderData, productsData] = await Promise.all([
        orderService.getOrderById(id),
        productService.getAllProducts().catch(() => []),
      ]);

      const pMap = {};
      (productsData || []).forEach((p) => {
        pMap[p.id] = p;
      });
      setProductsMap(pMap);
      setOrder(orderData);
    } catch (err) {
      setPageError(getErrorMessage(err, 'Failed to load order details.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderAndCatalog();
  }, [id]);

  if (loading) {
    return (
      <div className="invoice-page-wrapper page-container">
        <div className="card loading-state text-center py-8">
          <RefreshCw className="spinner text-primary" size={36} />
          <p className="mt-3 text-muted">Retrieving your official invoice & receipt...</p>
        </div>
      </div>
    );
  }

  if (pageError || !order) {
    return (
      <div className="invoice-page-wrapper page-container">
        <div className="card text-center py-8">
          <h2>Order Receipt Not Found</h2>
          <p className="text-muted mt-2">{pageError || 'The requested order could not be retrieved.'}</p>
          <Link to="/customer/orders" className="btn-primary mt-4">
            <ArrowLeft size={16} />
            <span>Back to My Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = order.orderStatus || order.status || 'PLACED';
  const statusMeta = STATUS_META[currentStatus] || STATUS_META.PLACED;
  const isCancelled = currentStatus === 'CANCELLED';

  // CHANGE: Eligible customer orders can be cancelled while status is PENDING_PAYMENT, PLACED, or CONFIRMED
  const canCancel = ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED'].includes(currentStatus);

  const handleExecuteCancellation = async () => {
    try {
      setCancelling(true);
      setActionError(null);
      await orderService.cancelOrder(order.id);
      setConfirmCancelOpen(false);
      fetchOrderAndCatalog(true);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to cancel order. Please try again.'));
    } finally {
      setCancelling(false);
    }
  };

  const orderDate = new Date(order.createdAt || Date.now());
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const payment = order.payment;
  const isPaid = payment?.paymentStatus === 'PAID';
  const isRefunded = payment?.paymentStatus === 'REFUNDED';

  const formatPaymentMethod = (m) => {
    const raw = (m || 'CREDIT_CARD').toUpperCase();
    if (raw.includes('CARD')) return 'Credit / Debit Card';
    if (raw.includes('NETBANKING') || raw.includes('NET_BANKING')) return 'Net Banking';
    if (raw.includes('UPI')) return 'UPI Payment';
    if (raw.includes('COD')) return 'Cash on Delivery';
    return raw;
  };

  return (
    <div className="invoice-page-wrapper">
      {/* Top Action Bar */}
      <div className="invoice-top-actions-bar">
        {/* // CHANGE: Renamed to 'Back to My Order History' and styled matching Stock History back-link */}
        <Link to="/customer/orders" className="back-link">
          <ArrowLeft size={16} /> Back to My Order History
        </Link>

        <div className="invoice-header-controls">
          <button
            onClick={() => fetchOrderAndCatalog(true)}
            className="btn-invoice-action"
            disabled={refreshing}
            title="Refresh order status"
          >
            <RefreshCw className={refreshing ? 'spinner' : ''} size={15} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-invoice-action"
            title="Print or save as PDF"
          >
            <Printer size={15} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {msg && (
        <div className="supplier-success-banner mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-success" />
            <span>{msg}</span>
          </div>
        </div>
      )}

      {/* Order Lifecycle Progress Stepper */}
      {currentStatus === 'CANCELLED' ? (
        <div className="alert alert-danger mb-4 flex items-center gap-3">
          <XCircle size={22} className="text-danger flex-shrink-0" />
          <div>
            <strong>Order Cancelled</strong>
            <p className="text-sm mt-0.5">
              This order has been cancelled and reserved items were restored to inventory.
              {isRefunded && ' Your payment has been fully refunded through Razorpay.'}
            </p>
          </div>
        </div>
      ) : currentStatus === 'PENDING_PAYMENT' ? (
        <div className="alert alert-warning mb-4 flex items-center gap-3">
          <Clock size={22} className="text-warning flex-shrink-0" />
          <div>
            <strong>Payment Pending</strong>
            <p className="text-sm mt-0.5">
              Awaiting payment confirmation before your order can be placed with the bakery.
            </p>
          </div>
        </div>
      ) : (
        <div className="invoice-stepper-card">
          <div className="invoice-stepper-title-row">
            <div className="invoice-stepper-heading">
              <Sparkles size={16} className="text-primary" />
              <span>Order Progress Status</span>
            </div>
            <span className="invoice-stepper-desc">{statusMeta.description}</span>
          </div>

          <div className="invoice-stepper-track">
            {/* Background Connector Bar */}
            <div className="invoice-step-connector">
              <div
                className="invoice-step-connector-progress"
                style={{
                  width:
                    currentStatus === 'DELIVERED'
                      ? '100%'
                      : `${(Math.max(0, LIFECYCLE_STEPS.indexOf(currentStatus)) / (LIFECYCLE_STEPS.length - 1)) * 100}%`,
                }}
              />
            </div>

            {LIFECYCLE_STEPS.map((step, idx) => {
              const currentIdx = LIFECYCLE_STEPS.indexOf(currentStatus);
              const isDelivered = currentStatus === 'DELIVERED';
              const isCompleted = isDelivered ? true : currentIdx > idx;
              const isCurrent = isDelivered ? false : currentIdx === idx;

              return (
                <div
                  key={step}
                  className={`invoice-step-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  <div className="invoice-step-circle">
                    {isCompleted ? <CheckCircle2 size={16} /> : <span>{idx + 1}</span>}
                  </div>
                  <span className="invoice-step-label">{STATUS_META[step]?.label || step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Official Paper Receipt Card */}
      <div className="invoice-paper-card">
        {/* Brand & Invoice Heading Strip */}
        <div className="invoice-brand-strip">
          <div className="invoice-brand-info">
            <img src={artisanBakeryLogoImg} alt="Artisan BaeCurry" className="invoice-brand-logo" />
            <div className="invoice-brand-text">
              <h2>ARTISAN BAECURRY</h2>
              <p>Handcrafted Artisan Breads, Pastries & Gourmet Bakery Treats</p>
            </div>
          </div>

          <div className="invoice-title-block">
            <h1 className="invoice-main-title">Tax Invoice & Receipt</h1>
            <span className="invoice-order-number-chip">#ORD-{order.id}</span>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="invoice-meta-bar">
          <div className="invoice-meta-datetime">
            <div className="invoice-datetime-item">
              <Calendar size={14} className="text-primary" />
              <span>Placed: <strong>{formattedDate}</strong></span>
            </div>
            <div className="invoice-datetime-item">
              <Clock size={14} className="text-primary" />
              <span>Time: <strong>{formattedTime}</strong></span>
            </div>
          </div>

          <div className="invoice-meta-badges">
            {/* Order Status Badge */}
            <span className={`order-status-badge ${statusMeta.badgeClass}`}>
              {statusMeta.icon}
              <span>{statusMeta.label}</span>
            </span>

            {/* Payment Status Badge */}
            {isRefunded ? (
              <span className="payment-status-badge badge-payment-refunded">
                <RefreshCw size={12} /> Refunded
              </span>
            ) : isPaid ? (
              <span className="payment-status-badge badge-payment-success">
                <CheckCircle2 size={12} /> Paid ({formatPaymentMethod(payment?.paymentMethod)})
              </span>
            ) : (
              <span className="payment-status-badge badge-payment-pending">
                <Clock size={12} /> Pending Payment
              </span>
            )}
          </div>
        </div>

        {/* Invoice Body 2-Column Grid */}
        <div className="invoice-body-grid">
          {/* Left Column: Items Table & Pricing Breakdown */}
          <div className="invoice-items-col">
            <div className="invoice-items-card">
              <div className="invoice-items-header-bar">
                <span>Ordered Bakery Items</span>
                <span className="text-xs text-muted">
                  {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <table className="invoice-table">
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>Product Item</th>
                    <th style={{ width: '18%' }} className="text-right">Unit Price</th>
                    <th style={{ width: '14%' }} className="text-center">Qty</th>
                    <th style={{ width: '18%' }} className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, idx) => {
                    const product = productsMap[item.productId];
                    const name = product?.name || item.productName || `Product #${item.productId}`;
                    const categoryName = product?.category?.name || product?.categoryName || null;
                    const subtotal = Number(item.subtotal || item.unitPrice * item.quantity || 0);

                    return (
                      <tr key={item.id || idx}>
                        <td>
                          <div className="invoice-item-cell">
                            {product?.imageUrl ? (
                              <img src={product.imageUrl} alt={name} className="invoice-item-thumb" />
                            ) : (
                              <div className="invoice-item-thumb-placeholder">
                                <Cake size={20} />
                              </div>
                            )}
                            <div>
                              <span className="invoice-item-name">{name}</span>
                              {categoryName && <span className="invoice-item-cat">{categoryName}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="text-right font-medium">
                          ₹{Number(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <span className="invoice-qty-badge">×{item.quantity}</span>
                        </td>
                        <td className="invoice-subtotal-cell">
                          ₹{subtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pricing Summary Card */}
            <div className="invoice-price-breakdown-card">
              <div className="invoice-price-row">
                <span>Items Subtotal</span>
                <span className="font-semibold">₹{Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="invoice-price-row">
                <span>Bakery Packaging & Hygiene Handling</span>
                <span className="text-emerald font-semibold">FREE</span>
              </div>
              <div className="invoice-price-row">
                <span>Fresh Doorstep Delivery</span>
                <span className="badge-free-delivery">
                  <Truck size={13} />
                  <span>FREE</span>
                </span>
              </div>
              <div className="invoice-grand-total-row">
                <span>Grand Total Amount</span>
                <span className="invoice-grand-total-amount">
                  ₹{Number(order.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Delivery Info, Payment Details & Freshness Guarantee */}
          <div className="invoice-sidebar-col">
            {/* Delivery Address Block */}
            <div className="invoice-info-panel">
              <div className="invoice-panel-heading">
                <MapPin size={15} className="text-primary" />
                <span>Delivery Address</span>
              </div>

              <div className="invoice-panel-detail-row">
                <span className="invoice-detail-label">Recipient:</span>
                <span className="invoice-detail-val strong">
                  {order.username || 'Customer'}
                </span>
              </div>

              {order.contact && (
                <div className="invoice-panel-detail-row">
                  <span className="invoice-detail-label">Contact Phone:</span>
                  <span className="invoice-detail-val">
                    <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {order.contact}
                  </span>
                </div>
              )}

              <div className="invoice-panel-detail-row">
                <span className="invoice-detail-label">Address:</span>
                <span className="invoice-detail-val">
                  {order.deliveryAddress || 'Standard Delivery'}
                  {order.deliveryLandmark && ` (Near ${order.deliveryLandmark})`}
                </span>
              </div>

              {(order.deliveryCity || order.deliveryState || order.deliveryPostalCode) && (
                <div className="invoice-panel-detail-row">
                  <span className="invoice-detail-label">City, State & PIN:</span>
                  <span className="invoice-detail-val">
                    {[order.deliveryCity, order.deliveryState, order.deliveryPostalCode ? `PIN: ${order.deliveryPostalCode}` : null]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Summary Block */}
            <div className="invoice-info-panel">
              <div className="invoice-panel-heading">
                <CreditCard size={15} className="text-primary" />
                <span>Payment Summary</span>
              </div>

              {/* CHANGE: Kept clean business-focused Payment Summary without displaying internal Razorpay Payment ID */}
              <div className="invoice-panel-detail-row">
                <span className="invoice-detail-label">Payment Method:</span>
                <span className="invoice-detail-val strong">
                  {formatPaymentMethod(payment?.paymentMethod || order.paymentMethod)}
                </span>
              </div>

              <div className="invoice-panel-detail-row">
                <span className="invoice-detail-label">Payment Status:</span>
                <span className="invoice-detail-val">
                  {isRefunded ? 'Fully Refunded' : isPaid ? 'Paid & Verified' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Freshness Guarantee */}
            <div className="invoice-freshness-guarantee">
              <ShieldCheck size={18} className="text-primary flex-shrink-0" />
              <span>
                <strong>Freshness Guarantee:</strong> Every item is baked fresh with natural ingredients and packed with 100% hygienic seals.
              </span>
            </div>
          </div>
        </div>

        {/* // CHANGE: Cancel Order section on View Details page for eligible customer orders */}
        {canCancel && (
          <div className="invoice-cancellation-container">
            {actionError && (
              <div className="alert alert-danger mb-3 flex items-center gap-2">
                <XCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <div className="invoice-cancel-card">
              <div className="invoice-cancel-info">
                <h4>Cancel Order Before Preparation</h4>
                <p>
                  You can cancel your order anytime before baking and kitchen preparation begins.
                  {isPaid && ` A full refund of ₹${Number(order.totalAmount || 0).toFixed(2)} will be credited back to your payment method.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setConfirmCancelOpen(true);
                }}
                disabled={cancelling}
                className="btn-sm btn-danger"
                title="Cancel this order"
              >
                <XCircle size={14} style={{ marginRight: '4px' }} />
                <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Safety Confirmation Dialog for Customer Cancellation */}
      {confirmCancelOpen && (
        <div className="modal-overlay" onClick={() => !cancelling && setConfirmCancelOpen(false)}>
          <div
            className="modal-container card confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <XCircle className="text-danger" size={22} />
                <h3>Cancel Order #{order.id}?</h3>
              </div>
              <button
                onClick={() => !cancelling && setConfirmCancelOpen(false)}
                className="modal-close-btn"
                aria-label="Close dialog"
                disabled={cancelling}
              >
                ×
              </button>
            </div>

            <div className="confirmation-modal-body">
              <div className="cancellation-consequences-box">
                <p className="mb-2">
                  Are you sure you want to cancel <strong>Order #{order.id}</strong>?
                </p>
                <ul className="text-sm text-muted" style={{ paddingLeft: '1.25rem', lineHeight: '1.6', margin: '0.5rem 0' }}>
                  <li>Your order will be permanently marked as <strong>Cancelled</strong>.</li>
                  <li>Reserved bakery treats will be restored to inventory.</li>
                  {isPaid && (
                    <li className="font-semibold text-primary">
                      A full refund of ₹{Number(order.totalAmount || 0).toFixed(2)} will be initiated via Razorpay to your payment method.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setConfirmCancelOpen(false)}
                className="btn-secondary"
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleExecuteCancellation}
                className="btn-danger"
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
