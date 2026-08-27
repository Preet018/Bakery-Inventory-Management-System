import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { Package, Calendar, Clock, Eye, RefreshCw } from 'lucide-react';

/**
 * OrderHistoryPage Component
 * Displays order list for customer with status badges.
 */
export const OrderHistoryPage = () => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        let data = [];
        if (isAdmin) {
          data = await orderService.getAllOrders();
        } else if (user?.userId) {
          data = await orderService.getOrdersByUserId(user.userId);
        }
        setOrders(data || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, isAdmin]);

  // CHANGE: Backend OrderStatus enum: PLACED, CONFIRMED, PROCESSING, READY, DELIVERED, CANCELLED
  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="status-badge status-badge-success">Delivered</span>;
      case 'READY':
        return <span className="status-badge status-badge-info">Ready for Pickup/Delivery</span>;
      case 'PROCESSING':
        return <span className="status-badge status-badge-warning">Processing</span>;
      case 'CONFIRMED':
        return <span className="status-badge status-badge-primary">Confirmed</span>;
      case 'PLACED':
        return <span className="status-badge status-badge-secondary">Placed</span>;
      case 'CANCELLED':
        return <span className="status-badge status-badge-danger">Cancelled</span>;
      default:
        return <span className="status-badge status-badge-secondary">{status || 'Placed'}</span>;
    }
  };

  return (
    <div className="order-history-page page-container">
      <div className="page-header">
        <h1>My Order History</h1>
        <p>Review and track your bakery purchases</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw className="spinner" size={32} />
          <p>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state card text-center">
          <Package size={48} className="empty-icon" />
          <h3>No Orders Placed Yet</h3>
          <p>Explore our fresh bread, pastries, and treats to place your first order!</p>
          <Link to="/#bakery-selection" className="btn-primary mt-3">
            Explore Bakery Items
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card card">
              <div className="order-header">
                <div>
                  <div className="order-id">Order #{order.id}</div>
                  <div className="order-date">
                    <Calendar size={14} />
                    <span>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</span>
                    <Clock size={14} className="ml-2" />
                    <span>{new Date(order.createdAt || Date.now()).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="order-status">
                  {/* CHANGE: Backend CustomerOrderResponse field is orderStatus */}
                  {getStatusBadge(order.orderStatus || order.status)}
                </div>
              </div>

              <div className="order-body">
                <div className="order-items-preview">
                  <strong>Items: </strong>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <span key={idx} className="item-tag">
                        {item.productName || `Product #${item.productId}`} (x{item.quantity})
                        {idx < order.items.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  ) : (
                    <span>Details inside receipt</span>
                  )}
                </div>

                <div className="order-meta">
                  <span className="order-total">
                    Total: <strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong>
                  </span>
                  <span className="order-payment">
                    {/* CHANGE: Payment method is on order.payment.paymentMethod */}
                    Payment: <strong>{order.payment?.paymentMethod || order.paymentMethod || 'UPI'}</strong>
                  </span>
                </div>
              </div>

              <div className="order-footer">
                <Link
                  to={`/customer/orders/${order.id}`}
                  className="btn-secondary btn-sm"
                >
                  <Eye size={15} />
                  <span>View Invoice</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
