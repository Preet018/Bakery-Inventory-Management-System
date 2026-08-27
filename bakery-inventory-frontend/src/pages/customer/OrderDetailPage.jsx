import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { ArrowLeft, CheckCircle2, Package, MapPin, Phone, RefreshCw, XCircle, AlertCircle } from 'lucide-react';

/**
 * NEW FILE: OrderDetailPage Component
 * Detailed order invoice receipt view with items, shipping details, payment info, and cancellation capability.
 */

export const OrderDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(location.state?.orderPlaced ? 'Order placed successfully! Thank you for your purchase.' : null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (err) {
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    setError(null);
    try {
      const updated = await orderService.cancelOrder(id);
      setOrder(updated);
      setMsg('Order has been cancelled successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state page-container">
        <RefreshCw className="spinner" size={32} />
        <p>Loading receipt details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-container">
        <div className="card text-center">
          <h2>Order Not Found</h2>
          <p>{error || 'The requested order could not be retrieved.'}</p>
          <Link to="/customer/orders" className="btn-primary">View All Orders</Link>
        </div>
      </div>
    );
  }

  // CHANGE: Backend CustomerOrderResponse uses orderStatus (PLACED, CONFIRMED)
  const canCancel = (order.orderStatus || order.status) === 'PLACED' || (order.orderStatus || order.status) === 'CONFIRMED';

  return (
    <div className="order-detail-page page-container">
      <Link to="/customer/orders" className="back-link">
        <ArrowLeft size={18} /> Back to Orders
      </Link>

      {msg && (
        <div className="success-alert mb-4">
          <CheckCircle2 size={18} />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="error-alert mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="receipt-card card">
        <div className="receipt-header">
          <div>
            <h1>Order Invoice #{order.id}</h1>
            <span className="order-timestamp">
              Placed on {new Date(order.createdAt || Date.now()).toLocaleString()}
            </span>
          </div>

          <div className="order-status-pill">
            {/* CHANGE: Backend CustomerOrderResponse field is orderStatus */}
            Status: <strong>{order.orderStatus || order.status}</strong>
          </div>
        </div>

        <div className="receipt-grid">
          {/* Items Table */}
          <div className="receipt-section">
            <h3>Items Ordered</h3>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.map((item, idx) => (
                  <tr key={idx}>
                    {/* CHANGE: OrderItemResponse contains productId, unitPrice, quantity, subtotal */}
                    <td>{item.productName || `Product #${item.productId}`}</td>
                    <td>₹{Number(item.unitPrice).toFixed(2)}</td>
                    <td>x{item.quantity}</td>
                    <td className="text-right font-bold">
                      ₹{(Number(item.subtotal || item.unitPrice * item.quantity)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delivery & Payment Details */}
          <div className="receipt-sidebar">
            <div className="info-block">
              <div className="info-title"><MapPin size={16} /> Delivery Address</div>
              <p className="info-text">{order.deliveryAddress}</p>
            </div>

            <div className="info-block">
              <div className="info-title"><Phone size={16} /> Contact Phone</div>
              {/* CHANGE: Backend CustomerOrderResponse field is contact */}
              <p className="info-text">{order.contact || order.contactPhoneNumber}</p>
            </div>

            <div className="info-block">
              <div className="info-title"><Package size={16} /> Payment Summary</div>
              {/* CHANGE: Payment method is nested in order.payment.paymentMethod */}
              <p className="info-text">Method: <strong>{order.payment?.paymentMethod || order.paymentMethod || 'UPI'}</strong></p>
              <p className="info-text">Total: <strong className="price-large">₹{Number(order.totalAmount).toFixed(2)}</strong></p>
            </div>

            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="btn-danger btn-block"
              >
                <XCircle size={18} />
                <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
