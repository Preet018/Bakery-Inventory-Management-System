import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { BackOfficeHeaderBadge } from '../../components/common/BackOfficeHeaderBadge';
import { getErrorMessage } from '../../utils/apiError';
import {
  ShoppingBag,
  RefreshCw,
  Search,
  X,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Calendar,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  AlertCircle,
  ArrowRight,
  User,
  ShieldCheck,
  ChevronRight,
  Sliders,
  DollarSign,
  Truck,
} from 'lucide-react';

/**
 * Metadata definitions for Order Statuses & Transitions
 */
export const ORDER_STATUS_META = {
  PLACED: {
    label: 'Placed',
    badgeClass: 'badge-order-placed',
    icon: <Clock size={13} />,
    description: 'New order received, pending confirmation',
    nextAction: {
      targetStatus: 'CONFIRMED',
      actionLabel: 'Confirm Order',
      btnClass: 'btn-primary',
      description: 'Confirm order and prepare for baking',
    },
    allowCancel: true,
  },
  CONFIRMED: {
    label: 'Confirmed',
    badgeClass: 'badge-order-confirmed',
    icon: <CheckCircle2 size={13} />,
    description: 'Order confirmed and queued for preparation',
    nextAction: {
      targetStatus: 'PROCESSING',
      actionLabel: 'Start Processing',
      btnClass: 'btn-warning',
      description: 'Move order into baking / preparation',
    },
    allowCancel: false,
  },
  PROCESSING: {
    label: 'Processing',
    badgeClass: 'badge-order-processing',
    icon: <RefreshCw size={13} />,
    description: 'Items are being baked and packed',
    nextAction: {
      targetStatus: 'READY',
      actionLabel: 'Mark Ready',
      btnClass: 'btn-info',
      description: 'Order is packed and ready for delivery/pickup',
    },
    allowCancel: false,
  },
  READY: {
    label: 'Ready',
    badgeClass: 'badge-order-ready',
    icon: <Package size={13} />,
    description: 'Order ready for dispatch / customer pickup',
    nextAction: {
      targetStatus: 'DELIVERED',
      actionLabel: 'Mark Delivered',
      btnClass: 'btn-success',
      description: 'Complete order and mark as delivered',
    },
    allowCancel: false,
  },
  DELIVERED: {
    label: 'Delivered',
    badgeClass: 'badge-order-delivered',
    icon: <CheckCircle2 size={13} />,
    description: 'Order successfully delivered and fulfilled',
    nextAction: null,
    allowCancel: false,
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeClass: 'badge-order-cancelled',
    icon: <XCircle size={13} />,
    description: 'Order was cancelled and reserved stock was restored',
    nextAction: null,
    allowCancel: false,
  },
};

const ORDER_LIFECYCLE_STEPS = ['PLACED', 'CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED'];

/**
 * AdminOrderManagementPage Component
 * Back-Office Order Management for Admin and Inventory Managers.
 *
 * Capabilities:
 * - High-level Order Metrics (Total, Placed, In Preparation, Delivered, Cancelled)
 * - Search filter (by Order #ID, Customer Name, Email, Address, Status)
 * - Status tab filters (All, Placed, In Preparation, Delivered, Cancelled)
 * - Full Order Details modal with customer details, delivery address, items table, and payment summary.
 * - Strict status transition controls complying with backend business rules.
 * - Order cancellation capability with safety confirmation.
 */
export const AdminOrderManagementPage = () => {
  const { user, isAdmin, isInventoryManager } = useAuth();
  const [orders, setOrders] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { order, action: 'STATUS_UPDATE' | 'CANCEL', targetStatus?, label? }
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Fetch all orders and products for catalog enrichment
  const fetchOrdersAndCatalog = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [ordersData, productsData] = await Promise.all([
        orderService.getAllOrders().catch((err) => {
          console.error('Error fetching orders:', err);
          return [];
        }),
        productService.getAllProducts().catch((err) => {
          console.error('Error fetching products for enrichment:', err);
          return [];
        }),
      ]);

      // Map products for fast lookup by productId
      const pMap = {};
      if (Array.isArray(productsData)) {
        productsData.forEach((p) => {
          pMap[p.id] = p;
        });
      }
      setProductsMap(pMap);

      // Sort newest orders first (descending by createdAt or ID)
      const sorted = Array.isArray(ordersData)
        ? [...ordersData].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return (b.id || 0) - (a.id || 0);
          })
        : [];

      setOrders(sorted);

      // Refresh currently open modal if any
      if (selectedOrder) {
        const refreshedCurrent = sorted.find((o) => o.id === selectedOrder.id);
        if (refreshedCurrent) {
          setSelectedOrder(refreshedCurrent);
        }
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndCatalog();
  }, []);

  // Summary Metrics
  const totalOrders = orders.length;
  const placedOrders = orders.filter((o) => (o.orderStatus || o.status) === 'PLACED').length;
  const inProgressOrders = orders.filter((o) =>
    ['CONFIRMED', 'PROCESSING', 'READY'].includes(o.orderStatus || o.status)
  ).length;
  const deliveredOrders = orders.filter((o) => (o.orderStatus || o.status) === 'DELIVERED').length;
  const cancelledOrders = orders.filter((o) => (o.orderStatus || o.status) === 'CANCELLED').length;

  // Contextual orders filtered by search query (Manage Inventory pattern)
  const contextuallyFilteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const rawId = q.replace(/^#\s*/, '');

        const idMatch =
          String(order.id || '') === rawId ||
          `#${order.id}`.toLowerCase().includes(q) ||
          (rawId && String(order.id || '').includes(rawId));
        const usernameMatch = (order.username || '').toLowerCase().includes(q);
        const phoneMatch = (order.customerPhone || order.phone || '').toLowerCase().includes(q);
        const locationMatch =
          (order.deliveryAddress || '').toLowerCase().includes(q) ||
          (order.deliveryLandmark || '').toLowerCase().includes(q) ||
          (order.deliveryCity || '').toLowerCase().includes(q) ||
          (order.deliveryState || '').toLowerCase().includes(q);

        const itemMatch = (order.items || []).some((item) => {
          const product = productsMap[item.productId];
          return (product?.name || '').toLowerCase().includes(q);
        });

        if (!idMatch && !usernameMatch && !phoneMatch && !locationMatch && !itemMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, productsMap]);

  // Status Tab Counts (Dynamically calculated from the search-filtered subset)
  const tabAllCount = contextuallyFilteredOrders.length;
  const tabPlacedCount = contextuallyFilteredOrders.filter((o) => (o.orderStatus || o.status) === 'PLACED').length;
  const tabInProgressCount = contextuallyFilteredOrders.filter((o) =>
    ['CONFIRMED', 'PROCESSING', 'READY'].includes(o.orderStatus || o.status)
  ).length;
  const tabDeliveredCount = contextuallyFilteredOrders.filter((o) => (o.orderStatus || o.status) === 'DELIVERED').length;
  const tabCancelledCount = contextuallyFilteredOrders.filter((o) => (o.orderStatus || o.status) === 'CANCELLED').length;

  // Final filtered orders list for the data table (applying status filter onto contextual dataset)
  const filteredOrders = useMemo(() => {
    return contextuallyFilteredOrders.filter((order) => {
      const currentStatus = order.orderStatus || order.status || 'PLACED';
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'IN_PROGRESS') {
        return ['CONFIRMED', 'PROCESSING', 'READY'].includes(currentStatus);
      }
      return currentStatus === statusFilter;
    });
  }, [contextuallyFilteredOrders, statusFilter]);

  const hasActiveFilters = statusFilter !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
  };

  // Open Order Details Modal
  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setActionError(null);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setActionError(null);
  };

  // Status Transition Action Trigger (Inventory Manager only)
  const handleTriggerStatusChange = (order, targetStatus, label) => {
    if (!isInventoryManager) return;
    setConfirmDialog({
      order,
      action: 'STATUS_UPDATE',
      targetStatus,
      label,
    });
    setActionError(null);
  };

  // Cancel Action Trigger (Admin and Inventory Manager for eligible orders)
  const handleTriggerCancel = (order) => {
    if (!isAdmin && !isInventoryManager) return;
    const currentStatus = order?.orderStatus || order?.status;
    if (currentStatus !== 'PLACED' && currentStatus !== 'PENDING_PAYMENT') return;

    setConfirmDialog({
      order,
      action: 'CANCEL',
      label: 'Cancel Order',
    });
    setActionError(null);
  };

  // Confirm and Execute Action
  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    const { order, action, targetStatus } = confirmDialog;

    if (action === 'STATUS_UPDATE' && !isInventoryManager) return;
    if (action === 'CANCEL' && !isAdmin && !isInventoryManager) return;

    setActionLoading(true);
    setActionError(null);

    try {
      if (action === 'STATUS_UPDATE') {
        const updated = await orderService.updateOrderStatus(order.id, targetStatus);
        setSuccessBanner(`Order #${order.id} status updated to ${ORDER_STATUS_META[targetStatus]?.label || targetStatus}.`);
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder(updated);
        }
      } else if (action === 'CANCEL') {
        const updated = await orderService.cancelOrder(order.id);
        setSuccessBanner(`Order #${order.id} has been cancelled successfully. Any captured Razorpay payment has been fully refunded.`);
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder(updated);
        }
      }

      setConfirmDialog(null);
      fetchOrdersAndCatalog();
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err) {
      console.error('Order action failed:', err);
      setActionError(getErrorMessage(err, 'Failed to execute order action. Please check the order state and try again.'));
    } finally {
      setActionLoading(false);
    }
  };

// Helper mappings for payment methods
const PAYMENT_METHOD_SHORT_LABELS = {
  CREDIT_CARD: 'Card',
  DEBIT_CARD: 'Card',
  CARD: 'Card',
  UPI: 'UPI',
  NET_BANKING: 'Net Banking',
  NETBANKING: 'Net Banking',
  WALLET: 'Wallet',
  COD: 'COD',
  CASH: 'Cash',
  RAZORPAY: 'Online',
};

const PAYMENT_METHOD_FULL_LABELS = {
  CREDIT_CARD: 'Credit / Debit Card',
  DEBIT_CARD: 'Debit Card',
  CARD: 'Credit / Debit Card',
  UPI: 'UPI Payment',
  NET_BANKING: 'Net Banking',
  NETBANKING: 'Net Banking',
  WALLET: 'Digital Wallet',
  COD: 'Cash on Delivery (COD)',
  CASH: 'Cash on Delivery',
  RAZORPAY: 'Online Payment (Razorpay)',
};

const formatPaymentMethod = (rawMethod) => {
  if (!rawMethod) return 'COD';
  const upper = String(rawMethod).toUpperCase().trim();
  return PAYMENT_METHOD_SHORT_LABELS[upper] || rawMethod;
};

const formatPaymentMethodFull = (rawMethod) => {
  if (!rawMethod) return 'Cash on Delivery (COD)';
  const upper = String(rawMethod).toUpperCase().trim();
  return PAYMENT_METHOD_FULL_LABELS[upper] || rawMethod;
};

  // Helper for Payment Status Badge
  const getPaymentStatusBadge = (payment) => {
    if (!payment) {
      return (
        <span className="payment-status-badge badge-payment-pending">
          <Clock size={12} /> Pending (COD)
        </span>
      );
    }
    const status = payment.paymentStatus || 'PENDING';
    const methodLabel = formatPaymentMethod(payment.paymentMethod);

    if (status === 'REFUNDED') {
      return (
        <span className="payment-status-badge badge-payment-refunded" title={`Refunded (${methodLabel})`}>
          <RefreshCw size={12} /> Refunded ({methodLabel})
        </span>
      );
    }
    if (status === 'SUCCESS' || status === 'PAID') {
      return (
        <span className="payment-status-badge badge-payment-success" title={`Method: ${methodLabel}`}>
          <CheckCircle2 size={12} /> Paid ({methodLabel})
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span className="payment-status-badge badge-payment-failed" title={`Method: ${methodLabel}`}>
          <XCircle size={12} /> Failed ({methodLabel})
        </span>
      );
    }
    return (
      <span className="payment-status-badge badge-payment-pending" title={`Method: ${methodLabel}`}>
        <Clock size={12} /> Pending ({methodLabel})
      </span>
    );
  };

  // Helper for Order Status Badge
  const getOrderStatusBadge = (rawStatus) => {
    const statusKey = rawStatus || 'PLACED';
    const meta = ORDER_STATUS_META[statusKey] || {
      label: statusKey,
      badgeClass: 'badge-order-placed',
      icon: <Clock size={13} />,
    };

    return (
      <span className={`order-status-badge ${meta.badgeClass}`}>
        {meta.icon}
        <span>{meta.label}</span>
      </span>
    );
  };

  return (
    <div className="admin-orders-page page-container">
      {/* Page Header */}
      <div className="dashboard-header-container">
        <div className="dashboard-title-area">
          <BackOfficeHeaderBadge lastUpdated={lastUpdated} />
          <h1>Customer Order Management</h1>
          <p className="dashboard-subtitle">
            Track incoming customer purchases, review delivery addresses, update fulfillment statuses, and manage order lifecycles
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            onClick={() => fetchOrdersAndCatalog(true)}
            className="btn-secondary refresh-btn"
            disabled={refreshing || loading}
            title="Refresh order records"
          >
            <RefreshCw className={refreshing ? 'spinner' : ''} size={16} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="supplier-success-banner">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-success" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="banner-close-btn"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="metrics-grid admin-orders-metrics-grid">
        {/* Total Orders */}
        <div
          className={`metric-card card ${statusFilter === 'ALL' ? 'active-metric metric-card-all' : ''}`}
          onClick={() => setStatusFilter('ALL')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-blue">
            <ShoppingBag size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{totalOrders}</div>
            <div className="metric-label">Total Orders</div>
            <div className="metric-subtext">All historical customer orders</div>
          </div>
        </div>

        {/* Placed / New Orders */}
        <div
          className={`metric-card card ${statusFilter === 'PLACED' ? 'active-metric metric-card-low' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'PLACED' ? 'ALL' : 'PLACED')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-amber">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{placedOrders}</div>
            <div className="metric-label">New / Placed</div>
            <div className="metric-subtext">Awaiting store confirmation</div>
          </div>
        </div>

        {/* In-Progress Orders */}
        <div
          className={`metric-card card ${statusFilter === 'IN_PROGRESS' ? 'active-metric metric-card-purple' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-purple">
            <RefreshCw size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{inProgressOrders}</div>
            <div className="metric-label">In Preparation</div>
            <div className="metric-subtext">Confirmed, Baking, or Ready</div>
          </div>
        </div>

        {/* Completed / Delivered Orders */}
        <div
          className={`metric-card card ${statusFilter === 'DELIVERED' ? 'active-metric metric-card-optimal' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'DELIVERED' ? 'ALL' : 'DELIVERED')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-green">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{deliveredOrders}</div>
            <div className="metric-label">Delivered</div>
            <div className="metric-subtext">Fulfilled and completed</div>
          </div>
        </div>

        {/* Cancelled Orders */}
        <div
          className={`metric-card card ${statusFilter === 'CANCELLED' ? 'active-metric metric-card-out' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'CANCELLED' ? 'ALL' : 'CANCELLED')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-red">
            <XCircle size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{cancelledOrders}</div>
            <div className="metric-label">Cancelled</div>
            <div className="metric-subtext">Stock released back to inventory</div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="inventory-toolbar card mb-6">
        <div className="toolbar-search-wrapper" style={{ width: '100%' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID (#101), username, city, or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
            aria-label="Search orders"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Orders Data Table */}
      {loading ? (
        <div className="loading-state card">
          <RefreshCw className="spinner" size={36} />
          <p>Loading order records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state card">
          <ShoppingBag size={48} className="text-muted" />
          <h3>No Orders Placed Yet</h3>
          <p>When customers purchase bakery products from the storefront, their orders will appear here for processing.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state card">
          <ShoppingBag size={48} className="text-muted" />
          <h3>No matching orders found</h3>
          <p>No orders matched your search or status filter criteria.</p>
          <button onClick={handleResetFilters} className="btn-secondary mt-3">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="table-responsive card inventory-table-card">
          <div className="table-header-strip">
            <span className="table-count-label">
              Showing&nbsp;<strong>{filteredOrders.length}</strong>&nbsp;of&nbsp;<strong>{orders.length}</strong>&nbsp;orders
            </span>
          </div>

          <table className="inventory-table admin-orders-table">
            <thead>
              <tr>
                <th style={{ width: '6%' }}>Order ID</th>
                <th style={{ width: '12%' }}>Date & Time</th>
                <th style={{ width: '16%' }}>Customer / Contact</th>
                <th style={{ width: '16%' }}>Items Summary</th>
                <th style={{ width: '10%' }}>Total Amount</th>
                <th style={{ width: '16%' }}>Payment</th>
                <th style={{ width: '14%' }}>Status</th>
                <th style={{ width: '10%' }} className="actions-column-header">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const currentStatus = order.orderStatus || order.status || 'PLACED';
                const statusMeta = ORDER_STATUS_META[currentStatus] || ORDER_STATUS_META.PLACED;
                const nextAction = statusMeta.nextAction;

                const itemsCount = (order.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);
                const firstItem = order.items?.[0];
                const firstProduct = firstItem ? productsMap[firstItem.productId] : null;

                const dateObj = new Date(order.createdAt || Date.now());
                const formattedDate = dateObj.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                const formattedTime = dateObj.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={order.id} className="inventory-row">
                    {/* Order ID */}
                    <td>
                      <span className="tx-id-badge">#{order.id}</span>
                    </td>

                    {/* Date & Time */}
                    <td>
                      <div className="order-table-datetime">
                        <span className="datetime-date">{formattedDate}</span>
                        <span className="datetime-time text-muted">{formattedTime}</span>
                      </div>
                    </td>

                    {/* Customer / Contact */}
                    <td>
                      <div className="order-customer-cell">
                        <div className="flex items-center gap-1 font-semibold text-dark">
                          <User size={13} className="text-muted flex-shrink-0" />
                          <span>{order.username || `Customer #${order.userId}`}</span>
                        </div>
                        {order.contact && (
                          <div className="flex items-center gap-1 text-muted text-xs mt-0.5">
                            <Phone size={12} className="flex-shrink-0" />
                            <span>{order.contact}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Items Summary */}
                    <td>
                      <div className="order-items-summary-cell">
                        <span className="items-count-tag">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                        <span className="items-names-preview" title={(order.items || []).map((i) => `${productsMap[i.productId]?.name || `Product #${i.productId}`} (x${i.quantity})`).join(', ')}>
                          {firstProduct ? firstProduct.name : firstItem ? `Product #${firstItem.productId}` : 'Items'}
                          {order.items?.length > 1 && ` +${order.items.length - 1} more`}
                        </span>
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td>
                      <span className="order-total-amount">
                        ₹{Number(order.totalAmount || 0).toFixed(2)}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td>
                      {getPaymentStatusBadge(order.payment)}
                    </td>

                    {/* Status Badge */}
                    <td>
                      {getOrderStatusBadge(currentStatus)}
                    </td>

                    {/* Actions */}
                    <td className="actions-cell">
                      <div className="action-buttons-group">
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="btn-sm btn-secondary btn-order-inspect"
                          title="View complete order details"
                        >
                          <Eye size={13} style={{ marginRight: '4px' }} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================================================
          ORDER DETAILS & STATUS WORKFLOW MODAL
          =================================================== */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div
            className="modal-container card backoffice-modal order-details-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-info">
                <div className="modal-header-icon-title">
                  <ShoppingBag className="text-primary" size={20} />
                  <h3>Order Details #{selectedOrder.id}</h3>
                  {getOrderStatusBadge(selectedOrder.orderStatus || selectedOrder.status)}
                </div>
                <p className="modal-subtitle">
                  Placed on {new Date(selectedOrder.createdAt || Date.now()).toLocaleString('en-IN')} &bull; Customer #{selectedOrder.userId}
                </p>
              </div>
              <button
                onClick={handleCloseDetails}
                className="modal-close-btn"
                aria-label="Close order details"
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="error-alert mb-3">
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <div className="order-details-modal-body">
              {/* Order Lifecycle Progress Stepper */}
              {((selectedOrder.orderStatus || selectedOrder.status) !== 'CANCELLED') && (
                <div className="order-stepper-card">
                  <div className="order-stepper">
                    {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
                      const currentStatus = selectedOrder.orderStatus || selectedOrder.status || 'PLACED';
                      const currentIdx = ORDER_LIFECYCLE_STEPS.indexOf(currentStatus);
                      const isCompleted = currentIdx > idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div
                          key={step}
                          className={`stepper-step ${isCompleted ? 'step-completed' : ''} ${
                            isCurrent ? 'step-current' : ''
                          }`}
                        >
                          <div className="stepper-circle">
                            {isCompleted ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>
                          <span className="stepper-label">
                            {ORDER_STATUS_META[step]?.label || step}
                          </span>
                          {idx < ORDER_LIFECYCLE_STEPS.length - 1 && (
                            <div className={`stepper-line ${isCompleted ? 'line-completed' : ''}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grid 2-Column: Customer/Delivery Details + Payment Summary */}
              <div className="modal-form-grid-2 mb-3">
                {/* Delivery & Customer Info Card */}
                <div className="order-info-panel-card">
                  <h4 className="panel-card-title">
                    <MapPin size={15} className="text-primary" /> Delivery & Customer Info
                  </h4>
                  <div className="panel-card-content">
                    <div className="info-row">
                      <span className="info-label">Customer:</span>
                      <span className="info-value font-semibold">
                        {selectedOrder.username || `Customer #${selectedOrder.userId}`}
                      </span>
                    </div>
                    {selectedOrder.contact && (
                      <div className="info-row">
                        <span className="info-label">Contact Number:</span>
                        <span className="info-value">{selectedOrder.contact}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">Delivery Address:</span>
                      <span className="info-value">
                        {selectedOrder.deliveryAddress || 'Standard Delivery'}
                        {selectedOrder.deliveryLandmark && ` (Near ${selectedOrder.deliveryLandmark})`}
                      </span>
                    </div>
                    {(selectedOrder.deliveryCity || selectedOrder.deliveryState || selectedOrder.deliveryPostalCode) && (
                      <div className="info-row">
                        <span className="info-label">City, State & PIN:</span>
                        <span className="info-value">
                          {[
                            selectedOrder.deliveryCity,
                            selectedOrder.deliveryState,
                            selectedOrder.deliveryPostalCode ? `PIN: ${selectedOrder.deliveryPostalCode}` : null,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment & Financials Card */}
                <div className="order-info-panel-card">
                  <h4 className="panel-card-title">
                    <CreditCard size={15} className="text-primary" /> Payment Summary
                  </h4>
                  <div className="panel-card-content">
                    <div className="info-row">
                      <span className="info-label">Payment Method:</span>
                      <span className="info-value font-semibold">
                        {formatPaymentMethodFull(selectedOrder.payment?.paymentMethod)}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Payment Status:</span>
                      <span className="info-value">{getPaymentStatusBadge(selectedOrder.payment)}</span>
                    </div>
                    {selectedOrder.payment?.providerPaymentId && (
                      <div className="info-row">
                        <span className="info-label">Payment ID:</span>
                        <span className="info-value font-mono text-xs">
                          {selectedOrder.payment.providerPaymentId}
                        </span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">Total Amount:</span>
                      <span className="info-value order-modal-grand-total">
                        ₹{Number(selectedOrder.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ordered Items Table */}
              <div className="order-items-table-section">
                <h4 className="panel-card-title mb-2">
                  <Package size={15} className="text-primary" /> Ordered Bakery Items ({selectedOrder.items?.length || 0})
                </h4>

                <table className="items-summary-table">
                  <thead>
                    <tr>
                      <th style={{ width: '46%' }}>Product Item</th>
                      <th style={{ width: '18%' }} className="text-right">Unit Price</th>
                      <th style={{ width: '16%' }} className="text-center">Quantity</th>
                      <th style={{ width: '20%' }} className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => {
                      const product = productsMap[item.productId];

                      return (
                        <tr key={item.id || idx}>
                          <td>
                            <div className="item-preview-cell">
                              {product?.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="item-preview-thumb"
                                />
                              ) : (
                                <div className="item-preview-placeholder">
                                  <Package size={16} />
                                </div>
                              )}
                              <div className="item-preview-text">
                                <span className="item-preview-name" title={product?.name || `Product #${item.productId}`}>
                                  {product?.name || `Product #${item.productId}`}
                                </span>
                                {product?.category?.name && (
                                  <span className="item-preview-category text-muted">
                                    {product.category.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-right font-medium">
                            ₹{Number(item.unitPrice || 0).toFixed(2)}
                          </td>
                          <td className="text-center font-bold">
                            {item.quantity}
                          </td>
                          <td className="text-right font-bold text-dark">
                            ₹{Number(item.subtotal || (item.unitPrice * item.quantity) || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="text-right font-bold">
                        Grand Total:
                      </td>
                      <td className="text-right font-bold text-primary text-lg">
                        ₹{Number(selectedOrder.totalAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Fulfillment Actions & Status Panel (Role-based) */}
              {isInventoryManager ? (
                /* Inventory Manager Active Fulfillment Workflow Panel */
                <div className="order-workflow-action-panel mt-4">
                  <div className="workflow-panel-info">
                    <span className="workflow-panel-title">Order Status Workflow</span>
                    <span className="workflow-panel-desc">
                      {ORDER_STATUS_META[selectedOrder.orderStatus || selectedOrder.status]?.description}
                    </span>
                  </div>

                  <div className="workflow-panel-actions">
                    {(() => {
                      const currentStatus = selectedOrder.orderStatus || selectedOrder.status || 'PLACED';
                      const statusMeta = ORDER_STATUS_META[currentStatus] || ORDER_STATUS_META.PLACED;
                      const nextAction = statusMeta.nextAction;

                      return (
                        <>
                          {nextAction && (
                            <button
                              type="button"
                              className={`btn-primary ${nextAction.btnClass}`}
                              onClick={() =>
                                handleTriggerStatusChange(
                                  selectedOrder,
                                  nextAction.targetStatus,
                                  nextAction.actionLabel
                                )
                              }
                              disabled={actionLoading}
                            >
                              <ArrowRight size={16} />
                              <span>{nextAction.actionLabel}</span>
                            </button>
                          )}

                          {statusMeta.allowCancel && (
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => handleTriggerCancel(selectedOrder)}
                              disabled={actionLoading}
                            >
                              <XCircle size={16} />
                              <span>Cancel Order</span>
                            </button>
                          )}

                          {!nextAction && !statusMeta.allowCancel && (
                            <span className="terminal-status-notice">
                              <CheckCircle2 size={16} className="text-success" />
                              <span>This order is in a final completed state ({statusMeta.label}).</span>
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                /* Admin Read-Only Fulfillment Status Panel with Eligible Order Cancellation */
                <div className="order-readonly-status-panel mt-4">
                  <div className="readonly-status-info">
                    <div className="flex items-center gap-2">
                      <span className="readonly-status-title">Fulfillment Status:</span>
                      {getOrderStatusBadge(selectedOrder.orderStatus || selectedOrder.status)}
                    </div>
                    <p className="readonly-status-desc">
                      {ORDER_STATUS_META[selectedOrder.orderStatus || selectedOrder.status]?.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
                    <div className="readonly-status-role-badge">
                      <ShieldCheck size={14} className="text-primary flex-shrink-0" />
                      <span>Fulfillment managed operationally by Inventory & Kitchen staff</span>
                    </div>

                    {((selectedOrder.orderStatus || selectedOrder.status) === 'PLACED' ||
                      (selectedOrder.orderStatus || selectedOrder.status) === 'PENDING_PAYMENT') && (
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => handleTriggerCancel(selectedOrder)}
                        disabled={actionLoading}
                      >
                        <XCircle size={15} />
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="modal-actions">
              <button
                type="button"
                onClick={handleCloseDetails}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          CONFIRMATION DIALOG FOR STATUS UPDATES & CANCELLATIONS (Admin & Inventory Manager)
          =================================================== */}
      {confirmDialog && (isAdmin || isInventoryManager) && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div
            className="modal-container card confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                {confirmDialog.action === 'CANCEL' ? (
                  <XCircle className="text-danger" size={22} />
                ) : (
                  <CheckCircle2 className="text-primary" size={22} />
                )}
                <h3>
                  {confirmDialog.action === 'CANCEL'
                    ? 'Cancel Customer Order?'
                    : `Advance Order to ${ORDER_STATUS_META[confirmDialog.targetStatus]?.label || confirmDialog.targetStatus}?`}
                </h3>
              </div>
              <button
                onClick={() => setConfirmDialog(null)}
                className="modal-close-btn"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="confirmation-modal-body">
              {confirmDialog.action === 'CANCEL' ? (
                <div className="cancellation-consequences-box">
                  <p className="mb-2">
                    Are you sure you want to cancel <strong>Order #{confirmDialog.order?.id}</strong>?
                  </p>
                  <ul className="text-sm text-muted" style={{ paddingLeft: '1.25rem', lineHeight: '1.6', margin: '0.5rem 0' }}>
                    <li>This order will be permanently marked as <strong>Cancelled</strong>.</li>
                    <li>All reserved bakery items will be automatically released back to available inventory.</li>
                    {confirmDialog.order?.payment?.paymentStatus === 'PAID' && (
                      <li className="font-semibold text-primary">
                        A full refund of ₹{Number(confirmDialog.order?.totalAmount || 0).toFixed(2)} will be initiated via Razorpay to the customer's payment method.
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <p>
                  Are you sure you want to change the status of <strong>Order #{confirmDialog.order?.id}</strong> from{' '}
                  <strong>{ORDER_STATUS_META[confirmDialog.order?.orderStatus || confirmDialog.order?.status]?.label}</strong> to{' '}
                  <strong>{ORDER_STATUS_META[confirmDialog.targetStatus]?.label}</strong>?
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={confirmDialog.action === 'CANCEL' ? 'btn-danger' : 'btn-primary'}
                disabled={actionLoading}
              >
                {actionLoading
                  ? 'Updating...'
                  : confirmDialog.action === 'CANCEL'
                  ? 'Yes, Cancel Order'
                  : `Yes, ${confirmDialog.label || 'Update'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
