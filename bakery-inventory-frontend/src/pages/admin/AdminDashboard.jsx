import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { orderService } from '../../services/orderService';
import { inventoryService } from '../../services/inventoryService';
import { categoryService } from '../../services/categoryService';
import { BackOfficeHeaderBadge } from '../../components/common/BackOfficeHeaderBadge';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  ShoppingBag,
  Package,
  Layers,
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
 * AdminDashboard Component
 * Executive Overview of Bakery Operations:
 *
 * Dedicated strictly to high-level executive summaries:
 * 1. Inventory Managers Overview (Total, Active, Inactive) -> /admin/users
 * 2. Customer Orders Overview (Total, Placed, In Progress, Delivered, Cancelled) -> /admin/orders
 * 3. Inventory & Stock Health (Total, Healthy, Low Stock, Out of Stock) -> /inventory/dashboard
 * 4. Product Categories Overview (Total Categories) -> /admin/categories
 *
 * Detailed searching, filtering, tables, and CRUD/lifecycle actions reside exclusively
 * on their respective dedicated management pages.
 */
export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Summary Metrics State
  const [managerStats, setManagerStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [orderStats, setOrderStats] = useState({ total: 0, placed: 0, inProgress: 0, delivered: 0, cancelled: 0 });
  const [inventoryStats, setInventoryStats] = useState({ total: 0, optimal: 0, lowStock: 0, outOfStock: 0 });
  const [categoryStats, setCategoryStats] = useState({ total: 0 });

  const fetchOverviewData = async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [managersRes, ordersRes, inventoryRes, categoriesRes] = await Promise.allSettled([
        adminService.getInventoryManagers(),
        orderService.getAllOrders(),
        inventoryService.getAllInventory(),
        categoryService.getAllCategories(),
      ]);

      // 1. Staff / Managers Overview
      if (managersRes.status === 'fulfilled' && Array.isArray(managersRes.value)) {
        const mgrs = managersRes.value;
        const total = mgrs.length;
        const active = mgrs.filter((m) => m.active !== false && m.isActive !== false).length;
        const inactive = mgrs.filter((m) => m.active === false || m.isActive === false).length;
        setManagerStats({ total, active, inactive });
      }

      // 2. Customer Orders Overview
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

      // 3. Inventory Overview
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

      // 4. Categories Overview
      if (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)) {
        setCategoryStats({ total: categoriesRes.value.length });
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load admin overview data:', err);
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
          <h1>Admin Control Center</h1>
          <p className="dashboard-subtitle">
            Executive overview of bakery operations, staffing, orders, and inventory health
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

          <Link to="/#bakery-selection" className="btn-secondary nav-action-btn" title="Browse customer storefront">
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
          <p className="mt-3 text-muted">Loading executive overview metrics...</p>
        </div>
      ) : (
        <>
          {/* ===================================================
              2. INVENTORY MANAGERS OVERVIEW
              =================================================== */}
          <div className="admin-section mb-6">
            <div className="section-header-row flex-between mb-4">
              <div>
                <h2 className="section-title">Inventory Managers</h2>
                <p className="section-subtitle">
                  Authorized personnel managing bakery inventory operations
                </p>
              </div>

              <Link
                to="/admin/users"
                className="btn-secondary btn-sm"
                title="Manage Inventory Managers in User Administration"
              >
                <span>Manage Inventory Managers</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div
              className="metrics-grid admin-staff-metrics-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}
            >
              {/* Total Managers */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-blue">
                  <Users size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{managerStats.total}</div>
                  <div className="metric-label">Total Inventory Managers</div>
                  <div className="metric-subtext">All registered manager accounts</div>
                </div>
              </div>

              {/* Active Managers */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-green">
                  <UserCheck size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{managerStats.active}</div>
                  <div className="metric-label">Active Inventory Managers</div>
                  <div className="metric-subtext">Authorized for stock operations</div>
                </div>
              </div>

              {/* Inactive Managers */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-red">
                  <UserX size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{managerStats.inactive}</div>
                  <div className="metric-label">Inactive Inventory Managers</div>
                  <div className="metric-subtext">Deactivated or pending verification</div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================
              3. CUSTOMER ORDERS OVERVIEW
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
                to="/admin/orders"
                className="btn-secondary btn-sm"
                title="Manage Orders in Order Administration"
              >
                <span>Manage Orders</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div
              className="metrics-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}
            >
              {/* 1. Total Orders */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-blue">
                  <ShoppingBag size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{orderStats.total}</div>
                  <div className="metric-label">Total Orders</div>
                  <div className="metric-subtext">All historical customer orders</div>
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
              4. INVENTORY & STOCK HEALTH OVERVIEW
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
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}
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

          {/* ===================================================
              5. PRODUCT CATEGORIES OVERVIEW
              =================================================== */}
          <div className="admin-section mb-6">
            <div className="section-header-row flex-between mb-3">
              <div>
                <h2 className="section-title">Product Categories</h2>
                <p className="section-subtitle">
                  Taxonomy and catalog organization for bakery products
                </p>
              </div>

              <Link
                to="/admin/categories"
                className="btn-secondary btn-sm"
                title="Manage Categories in Category Administration"
              >
                <span>Manage Categories</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div
              className="metrics-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}
            >
              {/* Total Categories */}
              <div className="metric-card card" style={{ cursor: 'default' }}>
                <div className="metric-icon-wrapper icon-purple">
                  <Layers size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{categoryStats.total}</div>
                  <div className="metric-label">Product Categories</div>
                  <div className="metric-subtext">Active categories structuring catalog</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
