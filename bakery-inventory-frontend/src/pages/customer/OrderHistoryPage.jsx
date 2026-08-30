import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { getErrorMessage } from '../../utils/apiError';
import {
  Package,
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ArrowRight,
  Wallet,
  ReceiptText,
  AlertCircle,
  X,
} from 'lucide-react';

// CHANGE: Order progress lifecycle steps and labels for order history cards
const LIFECYCLE_STEPS = ['PLACED', 'CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED'];

const STEP_LABELS = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Baking / Processing',
  READY: 'Ready for Dispatch',
  DELIVERED: 'Delivered',
};

/**
 * OrderHistoryPage Component
 * Displays modern customer order history cards with product names, status badges, progress bar, direct cancellation, and details links.
 */
export const OrderHistoryPage = () => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Cancellation modal & action states
  const [confirmCancelOrder, setConfirmCancelOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchOrdersAndProducts = async () => {
    try {
      setLoading(true);
      const [ordersData, productsData] = await Promise.all([
        isAdmin
          ? orderService.getAllOrders().catch(() => [])
          : user?.userId
          ? orderService.getOrdersByUserId(user.userId).catch(() => [])
          : Promise.resolve([]),
        productService.getAllProducts().catch(() => []),
      ]);

      // Map products for fast name resolution
      const pMap = {};
      (productsData || []).forEach((prod) => {
        pMap[prod.id] = prod;
      });
      setProductsMap(pMap);

      // Sort most recent first
      const sorted = (ordersData || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setOrders(sorted);
    } catch (err) {
      console.error('Failed to load orders or products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrdersAndProducts();
    }
  }, [user, isAdmin]);

  const handleExecuteCancel = async () => {
    if (!confirmCancelOrder) return;
    setCancelling(true);
    setActionError(null);

    try {
      const updated = await orderService.cancelOrder(confirmCancelOrder.id);
      
      // Update local orders list state
      setOrders((prev) =>
        prev.map((o) => (o.id === confirmCancelOrder.id ? { ...o, ...updated, orderStatus: 'CANCELLED', status: 'CANCELLED' } : o))
      );

      const isPaid = confirmCancelOrder.payment?.paymentStatus === 'PAID';
      setSuccessMsg(
        isPaid
          ? `Order #${confirmCancelOrder.id} has been cancelled successfully. Your payment has been fully refunded through Razorpay.`
          : `Order #${confirmCancelOrder.id} has been cancelled successfully.`
      );
      setConfirmCancelOrder(null);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setActionError(getErrorMessage(err, 'Failed to cancel order. Please try again.'));
    } finally {
      setCancelling(false);
    }
  };

  // Status Badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="order-status-badge badge-order-delivered">
            <CheckCircle2 size={13} /> Delivered
          </span>
        );
      case 'READY':
        return (
          <span className="order-status-badge badge-order-ready">
            <Package size={13} /> Ready
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="order-status-badge badge-order-processing">
            <RefreshCw size={13} /> Processing
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="order-status-badge badge-order-confirmed">
            <CheckCircle2 size={13} /> Confirmed
          </span>
        );
      case 'PLACED':
        return (
          <span className="order-status-badge badge-order-placed">
            <Clock size={13} /> Placed
          </span>
        );
      case 'PENDING_PAYMENT':
        return (
          <span className="order-status-badge badge-order-placed">
            <Clock size={13} /> Pending Payment
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="order-status-badge badge-order-cancelled">
            <XCircle size={13} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="order-status-badge badge-order-placed">
            <Clock size={13} /> {status || 'Placed'}
          </span>
        );
    }
  };

  // Helper for Payment Method display
  const formatPaymentMethod = (method) => {
    const m = (method || 'NETBANKING').toUpperCase();
    if (m === 'NETBANKING' || m === 'NET_BANKING') return 'Net Banking';
    if (m === 'CREDIT_CARD') return 'Credit Card';
    if (m === 'DEBIT_CARD') return 'Debit Card';
    if (m === 'CARD') return 'Card';
    if (m === 'UPI') return 'UPI';
    if (m === 'COD') return 'COD';
    return m;
  };

  const getPaymentSummaryText = (order) => {
    const payment = order.payment;
    if (payment?.paymentStatus === 'REFUNDED') {
      return 'Payment Refunded';
    }
    if (payment?.paymentStatus === 'PAID') {
      return `Paid (${formatPaymentMethod(payment.paymentMethod)})`;
    }
    if (payment?.paymentStatus === 'FAILED') {
      return 'Payment Failed';
    }
    return formatPaymentMethod(payment?.paymentMethod || order.paymentMethod);
  };

  return (
    <div className="order-history-page page-container">
      <div className="page-header mb-5">
        <h1>My Order History</h1>
        <p className="page-header-subtitle">Review and track your recent bakery orders and invoices</p>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="supplier-success-banner mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-success" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Showing X of Y orders header strip */}
      {!loading && orders.length > 0 && (
        <div className="table-header-strip mb-4" style={{ borderRadius: 'var(--radius-sm, 8px)', border: '1px solid var(--color-border, #E5E7EB)' }}>
          <span className="table-count-label">
            Showing&nbsp;<strong>{orders.length}</strong>&nbsp;of&nbsp;<strong>{orders.length}</strong>&nbsp;orders
          </span>
        </div>
      )}

      {loading ? (
        <div className="card loading-state text-center py-8">
          <RefreshCw className="spinner text-primary" size={32} />
          <p className="mt-3 text-muted">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state card text-center py-8">
          <div className="empty-icon-circle mb-3">
            <Package size={36} className="text-muted" />
          </div>
          <h3>No Orders Placed Yet</h3>
          <p className="text-muted mb-4">Explore our fresh breads, cakes, and pastries to place your first order!</p>
          <Link to="/#bakery-selection" className="btn-primary">
            <ShoppingBag size={16} />
            <span>Explore Bakery Selection</span>
          </Link>
        </div>
      ) : (
        <div className="orders-list-grid">
          {orders.map((order) => {
            const currentStatus = order.orderStatus || order.status || 'PLACED';
            const isEligibleForCancel = ['PLACED', 'PENDING_PAYMENT', 'CONFIRMED'].includes(currentStatus);

            const orderDate = new Date(order.createdAt || Date.now());
            const formattedDate = orderDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = orderDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={order.id} className="order-history-card card">
                {/* Card Top Row: Order ID, Date & Status */}
                <div className="order-card-top">
                  <div className="order-identity-meta">
                    <span className="order-card-id-tag">Order #{order.id}</span>
                    <div className="order-card-timestamp">
                      <span className="order-time-chip">
                        <Calendar size={13} />
                        <span>{formattedDate}</span>
                      </span>
                      <span className="order-time-chip">
                        <Clock size={13} />
                        <span>{formattedTime}</span>
                      </span>
                    </div>
                  </div>

                  <div className="order-status-wrap">
                    {getStatusBadge(currentStatus)}
                  </div>
                </div>

                {/* Card Items Section */}
                <div className="order-card-items-section">
                  <div className="order-items-label">Ordered Items:</div>
                  <div className="order-items-chips-wrap">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => {
                        const product = productsMap[item.productId];
                        const productName = product?.name || item.productName || `Product #${item.productId}`;

                        return (
                          <span key={idx} className="order-item-badge">
                            <ShoppingBag size={12} className="item-bag-icon" />
                            <span className="item-name">{productName}</span>
                            <span className="item-quantity">×{item.quantity}</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-muted text-sm">Details available in invoice</span>
                    )}
                  </div>
                </div>

                {/* // CHANGE: Added Order Progress Status Bar to history card */}
                {currentStatus !== 'CANCELLED' && (
                  <div className="order-card-progress-section">
                    <div className="invoice-stepper-track">
                      <div className="invoice-step-connector">
                        <div
                          className="invoice-step-connector-progress"
                          style={{
                            width: `${(Math.max(0, LIFECYCLE_STEPS.indexOf(currentStatus)) / (LIFECYCLE_STEPS.length - 1)) * 100}%`,
                          }}
                        />
                      </div>

                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const currentIdx = LIFECYCLE_STEPS.indexOf(currentStatus);
                        const isCompleted = currentIdx > idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div
                            key={step}
                            className={`invoice-step-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                          >
                            <div className="invoice-step-circle">
                              {isCompleted ? <CheckCircle2 size={14} /> : <span>{idx + 1}</span>}
                            </div>
                            <span className="invoice-step-label">{STEP_LABELS[step] || step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Card Bottom Row: Total, Payment & Actions */}
                <div className="order-card-bottom">
                  <div className="order-summary-meta">
                    <div className="order-total-block">
                      <span className="total-label">Total Amount:</span>
                      <span className="total-amount">₹{Number(order.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    <div className="order-payment-block">
                      <Wallet size={14} className="payment-icon" />
                      <span>{getPaymentSummaryText(order)}</span>
                    </div>
                  </div>

                  {/* // CHANGE: Matched visual styling with Admin/Inventory Manager Cancel Order button using btn-sm btn-danger */}
                  <div className="order-card-actions-group">
                    {isEligibleForCancel && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmCancelOrder(order);
                          setActionError(null);
                        }}
                        className="btn-sm btn-danger"
                        title="Cancel this order"
                        disabled={cancelling}
                      >
                        <XCircle size={13} style={{ marginRight: '4px' }} />
                        <span>Cancel Order</span>
                      </button>
                    )}

                    {/* // CHANGE: Renamed button from 'View Invoice' to 'View Details' */}
                    <Link
                      to={`/customer/orders/${order.id}`}
                      className="btn-order-view"
                      title="View complete order details"
                    >
                      <ReceiptText size={15} />
                      <span>View Details</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Confirmation Dialog for Customer Cancellation */}
      {confirmCancelOrder && (
        <div className="modal-overlay" onClick={() => setConfirmCancelOrder(null)}>
          <div
            className="modal-container card confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <XCircle className="text-danger" size={22} />
                <h3>Cancel Order #{confirmCancelOrder.id}?</h3>
              </div>
              <button
                onClick={() => setConfirmCancelOrder(null)}
                className="modal-close-btn"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="confirmation-modal-body">
              {/* Action error banner */}
              {actionError && (
                <div className="error-alert mb-3">
                  <AlertCircle size={18} />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="cancellation-consequences-box">
                <p className="mb-2">
                  Are you sure you want to cancel <strong>Order #{confirmCancelOrder.id}</strong>?
                </p>
                <ul className="text-sm text-muted" style={{ paddingLeft: '1.25rem', lineHeight: '1.6', margin: '0.5rem 0' }}>
                  <li>Your order will be permanently marked as <strong>Cancelled</strong>.</li>
                  <li>Reserved bakery treats will be restored to bakery inventory.</li>
                  {confirmCancelOrder.payment?.paymentStatus === 'PAID' && (
                    <li className="font-semibold text-primary">
                      A full refund of ₹{Number(confirmCancelOrder.totalAmount || 0).toFixed(2)} will be initiated via Razorpay to your payment method.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setConfirmCancelOrder(null)}
                className="btn-secondary"
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
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
