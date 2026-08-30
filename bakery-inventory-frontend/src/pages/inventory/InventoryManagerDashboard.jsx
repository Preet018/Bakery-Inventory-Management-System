import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { inventoryService } from '../../services/inventoryService';
import { BackOfficeHeaderBadge } from '../../components/common/BackOfficeHeaderBadge';
import {
  Package,
  ShoppingBag,
  RefreshCw,
  Store,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Truck,
  ArrowRight,
} from 'lucide-react';

/**
 * InventoryManagerDashboard Component
 * Operational Overview of Bakery Operations for INVENTORY_MANAGER role.
 *
 * Dedicated strictly to role-appropriate operational summaries:
 * 1. Customer Orders Overview (Total, Placed, In Progress, Delivered, Cancelled) -> /inventory/orders
 * 2. Inventory & Stock Health (Total, Healthy, Low Stock, Out of Stock) -> /inventory/manage
 *
 * Admin-only sections (Staff/User Administration, Category Management) are strictly excluded.
 */
export const InventoryManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Summary Metrics State
  const [orderStats, setOrderStats] = useState({
    total: 0,
    placed: 0,
    inProgress: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [inventoryStats, setInventoryStats] = useState({
    total: 0,
    optimal: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const fetchOverviewData = async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [ordersRes, inventoryRes] = await Promise.allSettled([
        orderService.getAllOrders(),
        inventoryService.getAllInventory(),
      ]);

      // 1. Customer Orders Overview
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
        const ords = ordersRes.value;
        const total = ords.length;
        const placed = ords.filter((o) => (o.orderStatus || o.status) === 'PLACED').length;
        const inProgress = ords.filter((o) =>
          ['CONFIRMED', 'PROCESSING', 'READY'].includes(o.orderStatus || o.status)
        ).length;
        const delivered = ords.filter((o) => (o.orderStatus || o.status) === 'DELIVERED').length;
        const cancelled = ords.filter((o) => (o.orderStatus || o.status) === 'CANCELLED').length;
        setOrderStats({ total, placed, inProgress, delivered, cancelled });
      }

      // 2. Inventory & Stock Health Overview
      if (inventoryRes.status === 'fulfilled' && Array.isArray(inventoryRes.value)) {
        const invs = inventoryRes.value;
        const total = invs.length;
        let outOfStock = 0;
        let lowStock = 0;
        let optimal = 0;

        invs.forEach((item) => {
          const totalQty = item.quantity ?? 0;
          const reservedQty = item.reservedQuantity ?? 0;
          const availableQty = item.availableQuantity ?? Math.max(totalQty - reservedQty, 0);
          const minThreshold = item.minimumStock ?? 5;

          if (availableQty <= 0) {
            outOfStock++;
          } else if (item.lowStock || availableQty <= minThreshold) {
            lowStock++;
          } else {
            optimal++;
          }
        });

        setInventoryStats({ total, optimal, lowStock, outOfStock });
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load inventory manager overview data:', err);
      setError('Unable to load overview data from the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  return (
    <div className="admin-dashboard-page page-container">
      {/* ===================================================
          1. HEADER & ACTIONS
          =================================================== */}
      <div className="dashboard-header-container">
        <div className="dashboard-title-area">
          <BackOfficeHeaderBadge lastUpdated={lastUpdated} />
          <h1>Inventory Operations Center</h1>
          <p className="dashboard-subtitle">
            Operational overview of bakery inventory health and customer orders
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            onClick={() => fetchOverviewData(true)}
            className="btn-secondary refresh-btn"
            disabled={refreshing || loading}
            title="Refresh dashboard overview metrics"
          >
            <RefreshCw className={refreshing ? 'spinner' : ''} size={16} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link
            to="/#bakery-selection"
            className="btn-secondary nav-action-btn"
            title="Browse customer storefront"
          >
            <Store size={16} /> Storefront
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-alert mb-4">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && !refreshing ? (
        <div className="admin-table-container admin-empty-container my-6">
          <RefreshCw className="spinner" size={32} />
          <p className="mt-3 text-muted">Loading operational overview metrics...</p>
        </div>
      ) : (
        <>
          {/* ===================================================
              2. CUSTOMER ORDERS OVERVIEW
              =================================================== */}
          <div className="admin-section mb-6">
            <div className="section-header-row flex-between mb-3">
              <div>
                <h2 className="section-title">Customer Orders</h2>
                <p className="section-subtitle">
                  Live order processing and delivery status across all customer orders
                </p>
              </div>

              <Link
                to="/inventory/orders"
                className="btn-secondary btn-sm"
                title="Manage Orders in Order Management"
              >
                <span>Manage Orders</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div
              className="metrics-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* 1. Total Orders */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-blue">
                  <ShoppingBag size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{orderStats.total}</div>
                  <div className="metric-label">Total Orders</div>
                  <div className="metric-subtext">All customer orders</div>
                </div>
              </div>

              {/* 2. Placed / New Orders */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-amber">
                  <Clock size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{orderStats.placed}</div>
                  <div className="metric-label">New / Placed</div>
                  <div className="metric-subtext">Awaiting store confirmation</div>
                </div>
              </div>

              {/* 3. In Progress / In Preparation */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-purple">
                  <RefreshCw size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{orderStats.inProgress}</div>
                  <div className="metric-label">In Preparation</div>
                  <div className="metric-subtext">Confirmed, Baking, or Ready</div>
                </div>
              </div>

              {/* 4. Delivered */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-green">
                  <CheckCircle2 size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{orderStats.delivered}</div>
                  <div className="metric-label">Delivered</div>
                  <div className="metric-subtext">Fulfilled and completed</div>
                </div>
              </div>

              {/* 5. Cancelled */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-red">
                  <XCircle size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{orderStats.cancelled}</div>
                  <div className="metric-label">Cancelled</div>
                  <div className="metric-subtext">Cancelled customer orders</div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================
              3. INVENTORY & STOCK HEALTH OVERVIEW
              =================================================== */}
          <div className="admin-section mb-6">
            <div className="section-header-row flex-between mb-3">
              <div>
                <h2 className="section-title">Inventory & Stock Health</h2>
                <p className="section-subtitle">
                  Live stock availability and critical replenishment alerts
                </p>
              </div>

              <Link
                to="/inventory/manage"
                className="btn-secondary btn-sm"
                title="Manage Inventory in Inventory Back-Office"
              >
                <span>Manage Inventory</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div
              className="metrics-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* 1. Tracked Products */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-blue">
                  <Package size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{inventoryStats.total}</div>
                  <div className="metric-label">Tracked Products</div>
                  <div className="metric-subtext">Catalog items in inventory</div>
                </div>
              </div>

              {/* 2. Low Stock Alerts */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-amber">
                  <AlertTriangle size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{inventoryStats.lowStock}</div>
                  <div className="metric-label">Low Stock Alerts</div>
                  <div className="metric-subtext">Needs supplier replenishment</div>
                </div>
              </div>

              {/* 3. Out of Stock */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-red">
                  <XCircle size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{inventoryStats.outOfStock}</div>
                  <div className="metric-label">Out of Stock</div>
                  <div className="metric-subtext">Immediate restock required</div>
                </div>
              </div>

              {/* 4. Healthy Stock */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-green">
                  <CheckCircle2 size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{inventoryStats.optimal}</div>
                  <div className="metric-label">Healthy Stock</div>
                  <div className="metric-subtext">Stock above minimum level</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
