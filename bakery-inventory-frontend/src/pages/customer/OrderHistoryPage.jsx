import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
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
} from 'lucide-react';

/**
 * OrderHistoryPage Component
 * Displays modern customer order history cards with product names, count strip, and standardized status badges.
 */
export const OrderHistoryPage = () => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    if (user) {
      fetchOrdersAndProducts();
    }
  }, [user, isAdmin]);

  // Exact Status Badges matching Manage Orders
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
    if (m === 'NETBANKING' || m === 'NET_BANKING') return 'Paid (Netbanking)';
    if (m === 'CREDIT_CARD') return 'Paid (Credit Card)';
    if (m === 'DEBIT_CARD') return 'Paid (Debit Card)';
    if (m === 'CARD') return 'Paid (Card)';
    return m;
  };

  return (
    <div className="order-history-page page-container">
      <div className="page-header mb-5">
        <h1>My Order History</h1>
        <p className="page-header-subtitle">Review and track your recent bakery orders and invoices</p>
      </div>

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
                    {getStatusBadge(order.orderStatus || order.status)}
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

                {/* Card Bottom Row: Total, Payment & Details Action */}
                <div className="order-card-bottom">
                  <div className="order-summary-meta">
                    <div className="order-total-block">
                      <span className="total-label">Total Amount:</span>
                      <span className="total-amount">₹{Number(order.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    <div className="order-payment-block">
                      <Wallet size={14} className="payment-icon" />
                      <span>{formatPaymentMethod(order.payment?.paymentMethod || order.paymentMethod)}</span>
                    </div>
                  </div>

                  <Link
                    to={`/customer/orders/${order.id}`}
                    className="btn-order-view"
                  >
                    <ReceiptText size={15} />
                    <span>View Invoice</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

