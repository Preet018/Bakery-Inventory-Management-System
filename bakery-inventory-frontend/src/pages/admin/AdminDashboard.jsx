import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Search,
  X,
  Mail,
  User,
  Store,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

/**
 * AdminDashboard Component
 * Issue #16 Refinement: Admin Dashboard dedicated to Staff Overview & Inventory Manager directory.
 *
 * Provides:
 * - 3 Prominent KPI Cards (Total, Active, Inactive Inventory Managers) matching Order Management visual/interaction styling.
 * - Search toolbar allowing search by Manager ID (#1) or Username/Name/Email with dynamic filtering.
 * - Structurally stable Inventory Manager directory table with fixed layout and dimensions.
 * - Clicking a KPI card updates the filtered rows without shifting the container structure or displaying a redundant 'Clear Filters' button.
 */
export const AdminDashboard = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Search & KPI Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  const fetchManagers = async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await adminService.getInventoryManagers();
      setManagers(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load Inventory Managers:', err);
      setError('Unable to load inventory managers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  // Summary Metrics
  const totalManagers = managers.length;
  const activeManagers = managers.filter((m) => m.active !== false).length;
  const inactiveManagers = managers.filter((m) => m.active === false).length;

  // Contextual filtering with search query and selected KPI filter
  const filteredManagers = useMemo(() => {
    return managers.filter((manager) => {
      // 1. KPI Card Status Filter
      if (filterMode === 'ACTIVE' && manager.active === false) return false;
      if (filterMode === 'INACTIVE' && manager.active !== false) return false;

      // 2. Search Query (supports ID like #1 or 1, and text matching username/name/email)
      if (searchQuery.trim()) {
        const cleanQuery = searchQuery.trim();

        if (/^#?\s*\d+$/.test(cleanQuery)) {
          const rawId = cleanQuery.replace(/^#\s*/, '').trim();
          return String(manager.id || '') === rawId;
        }

        const query = cleanQuery.toLowerCase();
        const usernameMatch = (manager.username || '').toLowerCase().includes(query);
        const nameMatch = (manager.name || '').toLowerCase().includes(query);
        const emailMatch = (manager.email || '').toLowerCase().includes(query);

        if (!usernameMatch && !nameMatch && !emailMatch) {
          return false;
        }
      }

      return true;
    });
  }, [managers, filterMode, searchQuery]);

  return (
    <div className="admin-dashboard-page page-container">
      {/* ===================================================
          1. HEADER & ACTIONS
          =================================================== */}
      <div className="dashboard-header-container">
        <div className="dashboard-title-area">
          <div className="backoffice-badge-row">
            <span className="backoffice-badge admin-badge">
              <Shield size={14} /> System Administrator
            </span>
            {lastUpdated && (
              <span className="last-updated-text">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <h1>Admin Control Center</h1>
          <p className="dashboard-subtitle">
            Executive overview of bakery staff and inventory manager authorizations
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            onClick={() => fetchManagers(true)}
            className="btn-secondary refresh-btn"
            disabled={refreshing || loading}
            title="Refresh manager directory"
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

      {/* ===================================================
          2. INVENTORY MANAGER 3 KPI CARDS
             (Matches Customer Order Management Visual & Interaction Behavior)
          =================================================== */}
      <div className="metrics-grid admin-staff-metrics-grid mb-6">
        {/* Total Inventory Managers (Styled like Total Orders) */}
        <div
          className={`metric-card card ${filterMode === 'ALL' ? 'active-metric metric-card-all' : ''}`}
          onClick={() => setFilterMode('ALL')}
          role="button"
          tabIndex={0}
          title="Show all registered inventory managers"
        >
          <div className="metric-icon-wrapper icon-blue">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{totalManagers}</div>
            <div className="metric-label">Total Inventory Managers</div>
            <div className="metric-subtext">All registered manager accounts</div>
          </div>
        </div>

        {/* Active Inventory Managers (Styled like Delivered) */}
        <div
          className={`metric-card card ${filterMode === 'ACTIVE' ? 'active-metric metric-card-optimal' : ''}`}
          onClick={() => setFilterMode('ACTIVE')}
          role="button"
          tabIndex={0}
          title="Filter active inventory managers"
        >
          <div className="metric-icon-wrapper icon-green">
            <UserCheck size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{activeManagers}</div>
            <div className="metric-label">Active Inventory Managers</div>
            <div className="metric-subtext">Authorized for stock operations</div>
          </div>
        </div>

        {/* Inactive Inventory Managers (Styled like Cancelled) */}
        <div
          className={`metric-card card ${filterMode === 'INACTIVE' ? 'active-metric metric-card-out' : ''}`}
          onClick={() => setFilterMode('INACTIVE')}
          role="button"
          tabIndex={0}
          title="Filter inactive inventory managers"
        >
          <div className="metric-icon-wrapper icon-red">
            <UserX size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{inactiveManagers}</div>
            <div className="metric-label">Inactive Inventory Managers</div>
            <div className="metric-subtext">Pending verification or deactivated</div>
          </div>
        </div>
      </div>

      {/* ===================================================
          3. SEARCH TOOLBAR
             (Matches Customer Order Management Search Pattern)
          =================================================== */}
      <div className="inventory-toolbar card mb-6">
        <div className="toolbar-search-wrapper" style={{ width: '100%' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Manager ID (#1), username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
            aria-label="Search inventory managers"
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

      {/* ===================================================
          4. INVENTORY MANAGERS LIST (STRUCTURALLY STABLE DIRECTORY)
          =================================================== */}
      <div className="admin-section">
        <div className="section-header-row flex-between mb-3">
          <div>
            <h2 className="section-title">Inventory Managers</h2>
            <p className="section-subtitle">
              Overview of registered staff authorized for stock management and operations
            </p>
          </div>

          <Link to="/admin/users" className="btn-secondary btn-sm" title="Register new staff in User Administration">
            <UserPlus size={14} /> Register New Manager
          </Link>
        </div>

        {loading ? (
          <div className="admin-table-container admin-empty-container">
            <RefreshCw className="spinner" size={28} />
            <p className="mt-2 text-muted">Loading inventory managers...</p>
          </div>
        ) : filteredManagers.length === 0 ? (
          <div className="admin-table-container">
            <div className="table-header-strip">
              <span className="table-count-label">
                Showing&nbsp;<strong>0</strong>&nbsp;of&nbsp;<strong>{totalManagers}</strong>&nbsp;managers
              </span>
            </div>
            <div className="admin-empty-container" style={{ minHeight: '232px' }}>
              <Users size={40} className="text-muted mb-2" />
              <h3>No Inventory Managers Found</h3>
              <p className="text-muted mb-3">
                {searchQuery.trim()
                  ? 'No managers match your current search query.'
                  : 'No inventory managers found for the selected filter.'}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="btn-secondary">
                  <X size={14} /> Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="admin-table-container">
            <div className="table-header-strip">
              <span className="table-count-label">
                Showing&nbsp;<strong>{filteredManagers.length}</strong>&nbsp;of&nbsp;<strong>{totalManagers}</strong>&nbsp;managers
              </span>
            </div>

            <div className="table-responsive" style={{ width: '100%' }}>
              <table className="inventory-table admin-managers-table">
                <thead>
                  <tr>
                    <th>Manager ID</th>
                    <th>Username / Name</th>
                    <th>Email Address</th>
                    <th>Assigned Role</th>
                    <th className="text-right">Account Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManagers.map((manager) => {
                    const isActive = manager.active !== false;

                    return (
                      <tr key={manager.id || manager.username}>
                        <td className="font-bold">
                          <span className="table-manager-id">
                            #{manager.id}
                          </span>
                        </td>
                        <td>
                          <div className="manager-user-cell">
                            <div className="manager-user-avatar">
                              <User size={16} />
                            </div>
                            <span className="manager-username font-semibold">
                              {manager.username || manager.name || 'Inventory Manager'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="manager-email-cell text-muted">
                            <Mail size={14} className="inline-icon mr-1" />
                            <span>{manager.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="role-pill role-inventory_manager">
                            INVENTORY MANAGER
                          </span>
                        </td>
                        <td className="text-right">
                          {isActive ? (
                            <span className="status-badge badge-delivered">
                              <CheckCircle2 size={12} /> Active
                            </span>
                          ) : (
                            <span className="status-badge badge-cancelled">
                              <Clock size={12} /> Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
