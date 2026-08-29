import React, { useEffect, useState, useMemo } from 'react';
import { adminService } from '../../services/adminService';
import { BackOfficeHeaderBadge } from '../../components/common/BackOfficeHeaderBadge';
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
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Power,
  PowerOff,
  AlertTriangle,
  Lock,
} from 'lucide-react';

/**
 * UserManagementPage Component
 * Issue #17: Complete Admin User Management for Inventory Manager accounts.
 *
 * Backed exclusively by backend database endpoints (no localStorage fallbacks):
 * - KPI Metrics: Total, Active, Inactive Inventory Managers.
 * - Live directory search by ID (#1 or 1), username, and email.
 * - Reversible account status toggling (Deactivate / Reactivate) preserving all account details.
 * - Permanent account deletion with safe database record handling.
 * - Register New Manager modal reusing standard backend registration logic.
 */
export const UserManagementPage = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & KPI Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Action Confirmation Modal State
  // type: 'DEACTIVATE' | 'REACTIVATE' | 'DELETE' | null
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    manager: null,
    submitting: false,
    error: null,
    deleteStep: 1, // 1: Admin Email, 2: OTP Verification, 3: Final Confirmation
    adminEmail: '',
    maskedEmail: '',
    otp: '',
    verificationToken: '',
    resendCooldown: 0,
    resending: false,
  });

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState(null);

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
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          'Unable to load inventory managers from the backend database.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  // Auto-dismiss success message after 6 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Resend OTP Cooldown Timer
  useEffect(() => {
    let interval = null;
    if (confirmModal.resendCooldown > 0) {
      interval = setInterval(() => {
        setConfirmModal((prev) => ({
          ...prev,
          resendCooldown: Math.max(0, prev.resendCooldown - 1),
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [confirmModal.resendCooldown]);

  // Helper to determine active boolean state safely
  const isManagerActive = (manager) => {
    if (manager.active !== undefined) return Boolean(manager.active);
    if (manager.isActive !== undefined) return Boolean(manager.isActive);
    return true;
  };

  // Summary Metrics (Backend-backed source of truth)
  const totalManagers = managers.length;
  const activeManagers = managers.filter((m) => isManagerActive(m)).length;
  const inactiveManagers = managers.filter((m) => !isManagerActive(m)).length;

  // Contextual Frontend Filtering against data loaded from backend
  const filteredManagers = useMemo(() => {
    return managers.filter((manager) => {
      const active = isManagerActive(manager);

      // 1. KPI Card Status Filter
      if (filterMode === 'ACTIVE' && !active) return false;
      if (filterMode === 'INACTIVE' && active) return false;

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

  // Handle Lifecycle Actions (Deactivate, Reactivate, Delete)
  const openConfirmModal = (type, manager) => {
    setConfirmModal({
      open: true,
      type,
      manager,
      submitting: false,
      error: null,
      deleteStep: 1,
      adminEmail: '',
      maskedEmail: '',
      otp: '',
      verificationToken: '',
      resendCooldown: 0,
      resending: false,
    });
  };

  const closeConfirmModal = () => {
    if (confirmModal.submitting) return;
    setConfirmModal({
      open: false,
      type: null,
      manager: null,
      submitting: false,
      error: null,
      deleteStep: 1,
      adminEmail: '',
      maskedEmail: '',
      otp: '',
      verificationToken: '',
      resendCooldown: 0,
      resending: false,
    });
  };

  // Step 1: Request OTP for Deletion
  const handleRequestDeleteOtp = async (e) => {
    if (e) e.preventDefault();
    const { manager, adminEmail } = confirmModal;
    if (!adminEmail || !adminEmail.trim()) {
      setConfirmModal((prev) => ({
        ...prev,
        error: 'Please enter your registered administrator email address.',
      }));
      return;
    }

    setConfirmModal((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      const res = await adminService.requestDeletionOtp(manager.id, adminEmail.trim());
      setConfirmModal((prev) => ({
        ...prev,
        submitting: false,
        deleteStep: 2,
        maskedEmail: res.maskedEmail || 'your registered email',
        error: null,
        resendCooldown: 60,
      }));
    } catch (err) {
      console.error('Failed to request deletion OTP:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data ||
        'Failed to verify email and dispatch verification code. Please check the entered email.';
      setConfirmModal((prev) => ({ ...prev, submitting: false, error: errMsg }));
    }
  };

  // Step 2: Resend Deletion OTP
  const handleResendDeleteOtp = async () => {
    if (confirmModal.resendCooldown > 0 || confirmModal.resending) return;
    const { manager, adminEmail } = confirmModal;

    setConfirmModal((prev) => ({ ...prev, resending: true, error: null }));

    try {
      const res = await adminService.requestDeletionOtp(manager.id, adminEmail.trim());
      setConfirmModal((prev) => ({
        ...prev,
        resending: false,
        maskedEmail: res.maskedEmail || prev.maskedEmail,
        resendCooldown: 60,
        error: null,
      }));
    } catch (err) {
      console.error('Failed to resend deletion OTP:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data ||
        'Failed to resend verification code. Please wait before trying again.';
      setConfirmModal((prev) => ({ ...prev, resending: false, error: errMsg }));
    }
  };

  // Step 2: Verify Deletion OTP
  const handleVerifyDeleteOtp = async (e) => {
    if (e) e.preventDefault();
    const { manager, otp } = confirmModal;
    if (!otp || otp.trim().length !== 6) {
      setConfirmModal((prev) => ({
        ...prev,
        error: 'Please enter the complete 6-digit verification code.',
      }));
      return;
    }

    setConfirmModal((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      const res = await adminService.verifyDeletionOtp(manager.id, otp.trim());
      setConfirmModal((prev) => ({
        ...prev,
        submitting: false,
        deleteStep: 3,
        verificationToken: res.verificationToken,
        error: null,
      }));
    } catch (err) {
      console.error('Failed to verify deletion OTP:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data ||
        'Invalid or expired verification code. Please check and try again.';
      setConfirmModal((prev) => ({ ...prev, submitting: false, error: errMsg }));
    }
  };

  // Step 3: Final Permanent Deletion Execution
  const handleFinalDeleteExecution = async () => {
    const { manager, verificationToken } = confirmModal;
    if (!verificationToken) {
      setConfirmModal((prev) => ({
        ...prev,
        error: 'Missing deletion authorization token. Please restart verification.',
      }));
      return;
    }

    setConfirmModal((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      await adminService.confirmDeleteInventoryManager(manager.id, verificationToken);
      setSuccessMsg(`Inventory Manager "${manager.username}" was permanently deleted.`);
      closeConfirmModal();
      await fetchManagers(false);
    } catch (err) {
      console.error('Failed to permanently delete manager:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data ||
        'Failed to execute permanent deletion.';
      setConfirmModal((prev) => ({ ...prev, submitting: false, error: errMsg }));
    }
  };

  // Handle Deactivate and Reactivate Execution
  const handleExecuteAction = async () => {
    const { type, manager } = confirmModal;
    if (!type || !manager) return;

    setConfirmModal((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      if (type === 'DEACTIVATE') {
        await adminService.deactivateInventoryManager(manager.id);
        setSuccessMsg(`Inventory Manager "${manager.username}" was deactivated successfully.`);
      } else if (type === 'REACTIVATE') {
        await adminService.reactivateInventoryManager(manager.id);
        setSuccessMsg(`Inventory Manager "${manager.username}" was reactivated successfully.`);
      }

      closeConfirmModal();
      await fetchManagers(false);
    } catch (err) {
      console.error(`Failed to execute ${type} on manager:`, err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data ||
        `Action failed: Could not ${type.toLowerCase()} the manager.`;
      setConfirmModal((prev) => ({ ...prev, submitting: false, error: errMsg }));
    }
  };

  // Handle Register Form
  const handleRegChange = (e) => {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError(null);
    setRegSubmitting(true);

    try {
      const msg = await adminService.registerInventoryManager(regForm);
      setSuccessMsg(
        msg ||
          `Inventory Manager "${regForm.username}" registered successfully! They must verify their email before logging in.`
      );
      setShowRegisterModal(false);
      setRegForm({ username: '', email: '', password: '' });
      await fetchManagers(false);
    } catch (err) {
      console.error('Registration failed:', err);
      setRegError(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to register Inventory Manager. Please verify the entered details.'
      );
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="admin-dashboard-page user-admin-page page-container">
      {/* ===================================================
          1. HEADER & ACTIONS
          =================================================== */}
      <div className="dashboard-header-container">
        <div className="dashboard-title-area">
          <BackOfficeHeaderBadge lastUpdated={lastUpdated} />
          <h1>User Account Administration</h1>
          <p className="dashboard-subtitle">
            Manage registered Inventory Manager accounts, authorizations, and credentials
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            onClick={() => fetchManagers(true)}
            className="btn-secondary refresh-btn"
            disabled={refreshing || loading}
            title="Refresh manager directory from database"
          >
            <RefreshCw className={refreshing ? 'spinner' : ''} size={16} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => {
              setRegError(null);
              setShowRegisterModal(true);
            }}
            className="btn-primary"
            title="Register new Inventory Manager"
          >
            <UserPlus size={16} />
            <span>Register New Manager</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="error-alert mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Global Success Banner */}
      {successMsg && (
        <div className="success-alert mb-4 flex-between">
          <div className="flex-center gap-2">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="modal-close-btn"
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ===================================================
          2. INVENTORY MANAGER 3 KPI CARDS
          =================================================== */}
      <div className="metrics-grid admin-staff-metrics-grid mb-6">
        {/* Total Inventory Managers */}
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

        {/* Active Inventory Managers */}
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

        {/* Inactive Inventory Managers */}
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
            <div className="metric-subtext">Deactivated or pending verification</div>
          </div>
        </div>
      </div>

      {/* ===================================================
          3. SEARCH TOOLBAR
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
          4. INVENTORY MANAGERS DIRECTORY TABLE
          =================================================== */}
      <div className="admin-section">
        <div className="section-header-row flex-between mb-3">
          <div>
            <h2 className="section-title">Inventory Manager Directory</h2>
            <p className="section-subtitle">
              Manage lifecycle, access activation, and credentials of staff members
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-table-container admin-empty-container">
            <RefreshCw className="spinner" size={28} />
            <p className="mt-2 text-muted">Loading inventory managers from database...</p>
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
          <div className="table-responsive card inventory-table-card">
            <div className="table-header-strip">
              <span className="table-count-label">
                Showing&nbsp;<strong>{filteredManagers.length}</strong>&nbsp;of&nbsp;<strong>{totalManagers}</strong>&nbsp;managers
              </span>
            </div>

            <table className="inventory-table admin-managers-table">
              <thead>
                <tr>
                  <th style={{ width: '9%' }}>Manager ID</th>
                  <th style={{ width: '16%' }}>Username / Name</th>
                  <th style={{ width: '25%' }}>Email Address</th>
                  <th style={{ width: '16%' }}>Assigned Role</th>
                  <th style={{ width: '14%' }}>Account Status</th>
                  <th style={{ width: '20%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredManagers.map((manager) => {
                  const active = isManagerActive(manager);

                  return (
                    <tr key={manager.id || manager.username} className="inventory-row">
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
                      <td>
                        {active ? (
                          <span className="status-badge badge-delivered">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="status-badge badge-cancelled">
                            <Clock size={12} /> Inactive
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-action-group">
                          {active ? (
                            <button
                              onClick={() => openConfirmModal('DEACTIVATE', manager)}
                              className="btn-sm btn-warning"
                              title="Deactivate account (reversible)"
                            >
                              <PowerOff size={13} /> Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => openConfirmModal('REACTIVATE', manager)}
                              className="btn-sm btn-success"
                              title="Reactivate account (reversible)"
                            >
                              <Power size={13} /> Reactivate
                            </button>
                          )}

                          <button
                            onClick={() => openConfirmModal('DELETE', manager)}
                            className="btn-sm btn-danger"
                            title="Permanently delete account from database"
                          >
                            <Trash2 size={13} /> Delete
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
      </div>

      {/* ===================================================
          5. ACTION CONFIRMATION MODAL
             (Distinguishes Reversible Deactivation vs 3-Step Permanent Deletion)
          =================================================== */}
      {confirmModal.open && confirmModal.manager && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div
            className="modal-container card confirmation-modal backoffice-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                {confirmModal.type === 'DELETE' ? (
                  confirmModal.deleteStep === 3 ? (
                    <AlertTriangle className="text-danger" size={22} />
                  ) : confirmModal.deleteStep === 2 ? (
                    <Lock className="text-primary" size={22} />
                  ) : (
                    <Shield className="text-primary" size={22} />
                  )
                ) : confirmModal.type === 'DEACTIVATE' ? (
                  <PowerOff className="text-warning" size={22} />
                ) : (
                  <Power className="text-success" size={22} />
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                    {confirmModal.type === 'DELETE'
                      ? confirmModal.deleteStep === 1
                        ? 'Admin Email Verification (Step 1 of 3)'
                        : confirmModal.deleteStep === 2
                        ? 'Enter Verification Code (Step 2 of 3)'
                        : 'Confirm Permanent Deletion (Step 3 of 3)'
                      : confirmModal.type === 'DEACTIVATE'
                      ? 'Deactivate Inventory Manager?'
                      : 'Reactivate Inventory Manager?'}
                  </h3>
                  {confirmModal.type === 'DELETE' && (
                    <div className="modal-subtitle" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {confirmModal.deleteStep === 1
                        ? 'Confirm administrator identity before requesting deletion OTP'
                        : confirmModal.deleteStep === 2
                        ? `6-digit verification code sent to ${confirmModal.maskedEmail}`
                        : 'Review verified authorization and permanently delete account'}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={closeConfirmModal}
                disabled={confirmModal.submitting}
                className="modal-close-btn"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {confirmModal.error && (
              <div className="error-alert mb-3">
                <AlertCircle size={16} />
                <span>{confirmModal.error}</span>
              </div>
            )}

            <div className="confirmation-modal-body">
              {confirmModal.type === 'DELETE' ? (
                confirmModal.deleteStep === 1 ? (
                  /* ===================================================
                     STEP 1: ADMIN EMAIL CONFIRMATION
                     =================================================== */
                  <form onSubmit={handleRequestDeleteOtp} className="modal-form">
                    <div className="target-manager-card mb-3" style={{ background: '#F9FAFB', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-primary" />
                        <span className="font-semibold">{confirmModal.manager.username}</span>
                        <span className="text-muted text-sm">(#{confirmModal.manager.id})</span>
                      </div>
                      <div className="text-sm text-muted">
                        <Mail size={13} className="inline-icon mr-1" />
                        <span>{confirmModal.manager.email || 'No email assigned'}</span>
                      </div>
                    </div>

                    <div className="warning-banner mb-3" style={{ backgroundColor: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <strong>Permanent Action:</strong> To permanently delete this Inventory Manager, please enter your registered administrator email address. A 6-digit OTP will be dispatched to authorize this specific deletion.
                    </div>

                    <div className="form-group mb-4">
                      <label htmlFor="admin-verify-email" className="font-semibold text-sm">
                        Registered Administrator Email Address *
                      </label>
                      <div className="input-with-icon">
                        <Mail size={18} className="input-icon" />
                        <input
                          id="admin-verify-email"
                          type="email"
                          required
                          placeholder="Enter your admin email (e.g. fragy2002op@gmail.com)"
                          value={confirmModal.adminEmail}
                          onChange={(e) => setConfirmModal((prev) => ({ ...prev, adminEmail: e.target.value }))}
                          disabled={confirmModal.submitting}
                          style={{ paddingLeft: '46px' }}
                          autoFocus
                        />
                      </div>
                      <span className="field-hint text-xs text-muted">
                        Must match the email address of your current logged-in administrator account.
                      </span>
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        onClick={closeConfirmModal}
                        disabled={confirmModal.submitting}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={confirmModal.submitting || !confirmModal.adminEmail.trim()}
                        className="btn-primary"
                      >
                        <Shield size={16} />
                        <span>{confirmModal.submitting ? 'Sending Code...' : 'Send Verification OTP'}</span>
                      </button>
                    </div>
                  </form>
                ) : confirmModal.deleteStep === 2 ? (
                  /* ===================================================
                     STEP 2: OTP VERIFICATION
                     =================================================== */
                  <form onSubmit={handleVerifyDeleteOtp} className="modal-form">
                    <div className="target-manager-card mb-3" style={{ background: '#F9FAFB', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{confirmModal.manager.username}</span>
                          <span className="text-muted text-sm ml-1">(#{confirmModal.manager.id})</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Step 2: Enter Code
                        </span>
                      </div>
                    </div>

                    <div className="info-banner mb-3" style={{ backgroundColor: '#EFF6FF', border: '1px solid #93C5FD', color: '#1E40AF', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      A 6-digit verification code has been dispatched to <strong>{confirmModal.maskedEmail}</strong>. Enter the code below to authorize permanent deletion of manager #{confirmModal.manager.id}.
                    </div>

                    <div className="form-group mb-2">
                      <label htmlFor="admin-deletion-otp" className="font-semibold text-sm">
                        6-Digit Verification Code *
                      </label>
                      <div className="input-with-icon">
                        <Lock size={18} className="input-icon" />
                        <input
                          id="admin-deletion-otp"
                          type="text"
                          required
                          maxLength={6}
                          placeholder="000000"
                          value={confirmModal.otp}
                          onChange={(e) => setConfirmModal((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                          disabled={confirmModal.submitting}
                          style={{ paddingLeft: '46px', letterSpacing: '4px', fontWeight: 'bold', fontSize: '1.1rem' }}
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 text-xs">
                      <span className="text-muted">Code expires in 5 minutes</span>
                      <button
                        type="button"
                        onClick={handleResendDeleteOtp}
                        disabled={confirmModal.resendCooldown > 0 || confirmModal.resending || confirmModal.submitting}
                        className="btn-link"
                        style={{ background: 'none', border: 'none', color: confirmModal.resendCooldown > 0 ? '#9CA3AF' : 'var(--color-primary)', cursor: confirmModal.resendCooldown > 0 ? 'not-allowed' : 'pointer', fontWeight: 600, padding: 0 }}
                      >
                        {confirmModal.resending ? (
                          'Resending code...'
                        ) : confirmModal.resendCooldown > 0 ? (
                          `Resend code in ${confirmModal.resendCooldown}s`
                        ) : (
                          'Resend Verification Code'
                        )}
                      </button>
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        onClick={closeConfirmModal}
                        disabled={confirmModal.submitting}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={confirmModal.submitting || confirmModal.otp.trim().length !== 6}
                        className="btn-primary"
                      >
                        <CheckCircle2 size={16} />
                        <span>{confirmModal.submitting ? 'Verifying...' : 'Verify OTP'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ===================================================
                     STEP 3: FINAL DELETION CONFIRMATION
                     =================================================== */
                  <div className="deletion-step-3">
                    <div className="success-banner mb-3" style={{ backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                      <span><strong>Identity Verified:</strong> Administrator authorization token generated for this deletion operation.</span>
                    </div>

                    <p className="mb-2">
                      You are about to permanently delete Inventory Manager{' '}
                      <strong>{confirmModal.manager.username}</strong> (#{confirmModal.manager.id}).
                    </p>

                    <div className="warning-banner mb-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <strong>Permanent Deletion:</strong> The manager account, stock operation permissions, and associated records will be permanently removed from the database.
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        onClick={closeConfirmModal}
                        disabled={confirmModal.submitting}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleFinalDeleteExecution}
                        disabled={confirmModal.submitting}
                        className="btn-danger"
                      >
                        <Trash2 size={16} />
                        <span>{confirmModal.submitting ? 'Deleting Permanently...' : 'Permanently Delete'}</span>
                      </button>
                    </div>
                  </div>
                )
              ) : confirmModal.type === 'DEACTIVATE' ? (
                <>
                  <p className="mb-2">
                    Are you sure you want to deactivate manager{' '}
                    <strong>{confirmModal.manager.username}</strong> (#{confirmModal.manager.id})?
                  </p>
                  <p className="text-muted text-sm mb-3">
                    <strong>Reversible:</strong> This manager will be marked inactive and unable to access inventory management operations. Their email address and account records are preserved, and you can reactivate this account at any time.
                  </p>

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={closeConfirmModal}
                      disabled={confirmModal.submitting}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteAction}
                      disabled={confirmModal.submitting}
                      className="btn-warning"
                    >
                      {confirmModal.submitting ? 'Deactivating...' : 'Confirm Deactivation'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-2">
                    Are you sure you want to reactivate manager{' '}
                    <strong>{confirmModal.manager.username}</strong> (#{confirmModal.manager.id})?
                  </p>
                  <p className="text-muted text-sm mb-3">
                    <strong>Reversible:</strong> The manager will be restored to active status and will regain full access to inventory and stock operations.
                  </p>

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={closeConfirmModal}
                      disabled={confirmModal.submitting}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteAction}
                      disabled={confirmModal.submitting}
                      className="btn-success"
                    >
                      {confirmModal.submitting ? 'Reactivating...' : 'Confirm Reactivation'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          6. REGISTER NEW MANAGER MODAL
          =================================================== */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => !regSubmitting && setShowRegisterModal(false)}>
          <div
            className="modal-container card backoffice-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '560px' }}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <Shield size={22} className="text-primary" />
                <div>
                  <h3>Register Inventory Manager</h3>
                  <div className="modal-subtitle">
                    Create staff credentials with access to stock operations and procurement
                  </div>
                </div>
              </div>
              <button
                onClick={() => !regSubmitting && setShowRegisterModal(false)}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {regError && (
              <div className="error-alert mb-3">
                <AlertCircle size={16} />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="reg-username">Username *</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    id="reg-username"
                    type="text"
                    name="username"
                    required
                    minLength={3}
                    maxLength={50}
                    placeholder="e.g. manager_sarah"
                    value={regForm.username}
                    onChange={handleRegChange}
                    disabled={regSubmitting}
                    style={{ paddingLeft: '46px' }}
                  />
                </div>
                <span className="field-hint">3–50 characters, unique username</span>
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Work Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    name="email"
                    required
                    placeholder="manager@bakery.com"
                    value={regForm.email}
                    onChange={handleRegChange}
                    disabled={regSubmitting}
                    style={{ paddingLeft: '46px' }}
                  />
                </div>
                <span className="field-hint">A verification OTP will be sent to this email.</span>
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Initial Password *</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="reg-password"
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    maxLength={100}
                    placeholder="Min 8 characters"
                    value={regForm.password}
                    onChange={handleRegChange}
                    disabled={regSubmitting}
                    style={{ paddingLeft: '46px' }}
                  />
                </div>
                <span className="field-hint">Must be between 8 and 100 characters</span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  disabled={regSubmitting}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="btn-primary"
                >
                  <UserPlus size={16} />
                  <span>{regSubmitting ? 'Registering Manager...' : 'Register Manager'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
