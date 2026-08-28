import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { addressService } from '../../services/addressService';
import { ResetPasswordModal } from '../../components/auth/ResetPasswordModal';
import { AddressModal } from '../../components/address/AddressModal';
import {
  User,
  Shield,
  ShoppingBag,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Package,
  MapPin,
  Home,
  Briefcase,
  Plus,
  Edit2,
  Star,
  X,
} from 'lucide-react';

/**
 * Universal Account Page
 *
 * Available to all authenticated roles (CUSTOMER, INVENTORY_MANAGER, ADMIN).
 * Displays:
 *   - Authenticated user profile details (username, role, session status)
 *   - Role-appropriate quick actions
 *   - Saved Delivery Addresses (Customer-only, with Google Maps/Places picker)
 *   - Password reset (all roles, via OTP)
 *   - Account deletion (customer-only, via 2-step OTP flow)
 */
export const AccountPage = () => {
  const { user, isCustomer, isInventoryManager, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // CHANGE: Password reset modal state (available to all roles)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  // Saved Addresses state (Customer-only)
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [addressSuccess, setAddressSuccess] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(false);

  // Fetch saved addresses for customer
  const fetchAddresses = useCallback(async () => {
    if (!isCustomer) return;
    setLoadingAddresses(true);
    setAddressError(null);
    try {
      const data = await addressService.getAllAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      setAddressError(
        err.response?.data?.message || 'Failed to load saved addresses.'
      );
    } finally {
      setLoadingAddresses(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Handle save address (create or update)
  const handleSaveAddress = async (payload) => {
    if (addressToEdit?.id) {
      await addressService.updateAddress(addressToEdit.id, payload);
      setAddressSuccess('Address updated successfully.');
    } else {
      await addressService.createAddress(payload);
      setAddressSuccess('Address saved successfully.');
    }
    await fetchAddresses();
    setTimeout(() => setAddressSuccess(null), 4000);
  };

  // Handle set default address
  const handleSetDefaultAddress = async (addressId) => {
    setAddressError(null);
    try {
      await addressService.setDefaultAddress(addressId);
      setAddressSuccess('Default delivery address updated.');
      await fetchAddresses();
      setTimeout(() => setAddressSuccess(null), 4000);
    } catch (err) {
      setAddressError(
        err.response?.data?.message || 'Failed to update default address.'
      );
    }
  };

  // Handle delete address
  const handleConfirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    setDeletingAddress(true);
    setAddressError(null);
    try {
      await addressService.deleteAddress(addressToDelete.id);
      setAddressSuccess('Address deleted successfully.');
      setAddressToDelete(null);
      await fetchAddresses();
      setTimeout(() => setAddressSuccess(null), 4000);
    } catch (err) {
      setAddressError(
        err.response?.data?.message || 'Failed to delete address.'
      );
    } finally {
      setDeletingAddress(false);
    }
  };

  // Account deletion state (customer-only)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1 = Request OTP, 2 = Enter Password & OTP
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [otpSentMessage, setOtpSentMessage] = useState(null);

  // Step 1: Request account deletion OTP
  const handleRequestDeletionOtp = async () => {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const response = await authService.requestAccountDeletionOtp();
      setOtpSentMessage(
        typeof response === 'string'
          ? response
          : 'A 6-digit deletion OTP has been sent to your registered email.'
      );
      setDeleteStep(2);
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
        err.response?.data ||
        'Failed to send account deletion OTP. Please ensure your email is verified.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Step 2: Confirm account deletion
  const handleConfirmDeletion = async (e) => {
    e.preventDefault();
    setDeleteError(null);

    if (!deletePassword) {
      setDeleteError('Please enter your account password.');
      return;
    }
    if (!deleteOtp || deleteOtp.trim().length !== 6) {
      setDeleteError('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    setDeleteLoading(true);
    try {
      await authService.deleteOwnAccount({
        password: deletePassword,
        otp: deleteOtp.trim(),
      });

      // Clear authentication state and redirect
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
        err.response?.data ||
        'Account deletion failed. Please verify your password and OTP.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setDeletePassword('');
    setDeleteOtp('');
    setDeleteError(null);
    setOtpSentMessage(null);
  };

  // CHANGE: Compute role-appropriate pill class
  const rolePillClass = isAdmin
    ? 'role-admin'
    : isInventoryManager
      ? 'role-inventory_manager'
      : 'role-customer';

  return (
    <div className="account-page page-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>My Account</h1>
        <p>Manage your account</p>
      </div>

      <div className="account-grid">
        {/* Profile Card */}
        <div className="card account-card">
          <div className="account-card-header">
            <div className="account-avatar-wrapper">
              <User size={32} className="account-avatar-icon" />
            </div>
            <div>
              <h3>Account Profile</h3>
              <p className="account-card-subtitle">Your registered bakery credentials</p>
            </div>
          </div>

          <div className="account-details-list">
            <div className="account-detail-item">
              <span className="detail-label">Username</span>
              <span className="detail-value font-mono">{user?.username || 'N/A'}</span>
            </div>

            <div className="account-detail-item">
              <span className="detail-label">Account Role</span>
              {/* CHANGE: Dynamic role pill styling based on authenticated role */}
              <span className={`role-pill ${rolePillClass}`}>
                {user?.role || 'UNKNOWN'}
              </span>
            </div>

            <div className="account-detail-item">
              <span className="detail-label">Session Status</span>
              <span className="status-badge status-active">
                <CheckCircle2 size={14} /> Active Session
              </span>
            </div>
          </div>
        </div>

        {/* CHANGE: Role-appropriate Quick Actions Card */}
        <div className="card account-card">
          <div className="account-card-header">
            <div className="account-avatar-wrapper icon-amber">
              {isCustomer ? (
                <ShoppingBag size={28} />
              ) : isInventoryManager ? (
                <Package size={28} />
              ) : (
                <Shield size={28} />
              )}
            </div>
            <div>
              <h3>Quick Actions</h3>
              <p className="account-card-subtitle">
                {isCustomer
                  ? 'Browse catalog and track orders'
                  : isInventoryManager
                    ? 'Access your inventory workspace'
                    : 'Manage your admin workspace'}
              </p>
            </div>
          </div>

          <div className="account-quick-links">
            {/* CHANGE: Customer-only quick actions */}
            {isCustomer && (
              <>
                <Link to="/customer/orders" className="quick-action-link">
                  <div className="action-link-content">
                    <strong>My Orders</strong>
                    <p>View your order history and live delivery tracking</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>

                <Link to="/#bakery-selection" className="quick-action-link">
                  <div className="action-link-content">
                    <strong>Bakery Selection</strong>
                    <p>Explore freshly baked artisan bread, cakes & pastries</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>
              </>
            )}

            {/* CHANGE: Inventory Manager quick actions */}
            {isInventoryManager && (
              <>
                <Link to="/inventory/dashboard" className="quick-action-link">
                  <div className="action-link-content">
                    <strong>Inventory Dashboard</strong>
                    <p>Monitor stock levels and manage inventory operations</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>

                <Link to="/inventory/suppliers" className="quick-action-link">
                  <div className="action-link-content">
                    <strong>Suppliers</strong>
                    <p>Manage bakery supplier contacts and relationships</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>
              </>
            )}

            {/* CHANGE: Admin quick actions */}
            {isAdmin && (
              <>
                <Link to="/admin/categories" className="quick-action-link">
                  <div className="action-link-content">
                    <strong>Category Management</strong>
                    <p>Organize bakery products into logical groupings</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>

                <Link to="/admin/users" className="quick-action-link">
                  <div className="action-link-content">
                    <strong>User Accounts</strong>
                    <p>Manage registered users, roles, and permissions</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CHANGE: Password Management Card — available to ALL authenticated roles.
          Since the backend only supports OTP-based password reset (not authenticated
          change-password), this uses the same ResetPasswordModal with a pre-filled
          username for convenience. The flow still requires OTP verification. */}
      <div className="card account-card password-management-card">
        <div className="account-card-header">
          <div className="account-avatar-wrapper icon-blue">
            <Lock size={28} />
          </div>
          <div>
            <h3>Password Management</h3>
            <p className="account-card-subtitle">Change your account password via OTP verification</p>
          </div>
        </div>

        <div className="password-management-content">
          <div>
            <strong>Change Password</strong>
            <p>
              Change your password using a 6-digit OTP sent to your registered email.
              You will need to log in again with your new password after the reset.
            </p>
          </div>
          <button
            onClick={() => setShowResetPasswordModal(true)}
            className="btn-primary"
          >
            <KeyRound size={16} />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* CHANGE: Saved Delivery Addresses Section (Customer-only, Issue #08) */}
      {isCustomer && (
        <div className="card account-card saved-addresses-section">
          <div className="account-card-header address-section-header">
            <div className="address-header-left">
              <div className="account-avatar-wrapper icon-emerald">
                <MapPin size={28} />
              </div>
              <div>
                <h3>Saved Delivery Addresses</h3>
                <p className="account-card-subtitle">Manage delivery locations and Google Maps pinpoint</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddressToEdit(null);
                setShowAddressModal(true);
              }}
              className="btn-primary btn-sm btn-add-address"
            >
              <Plus size={16} />
              <span>Add New Address</span>
            </button>
          </div>

          {addressSuccess && (
            <div className="alert alert-success address-alert">
              <CheckCircle2 size={16} />
              <span>{addressSuccess}</span>
            </div>
          )}

          {addressError && (
            <div className="alert alert-danger address-alert">
              <AlertTriangle size={16} />
              <span>{addressError}</span>
            </div>
          )}

          {loadingAddresses ? (
            <div className="addresses-loading-state">
              <RefreshCw size={24} className="spinner text-primary" />
              <span>Loading saved addresses...</span>
            </div>
          ) : addresses.length === 0 ? (
            <div className="empty-addresses-state">
              <div className="empty-address-icon-circle">
                <MapPin size={32} />
              </div>
              <h4>No Saved Addresses</h4>
              <p>Add your first delivery address with Google Maps pinpoint for easy checkout.</p>
              <button
                type="button"
                onClick={() => {
                  setAddressToEdit(null);
                  setShowAddressModal(true);
                }}
                className="btn-primary"
              >
                <Plus size={16} />
                <span>Add First Address</span>
              </button>
            </div>
          ) : (
            <div className="saved-addresses-grid">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`saved-address-card ${addr.isDefault ? 'is-default-card' : ''}`}
                >
                  <div className="address-card-header-row">
                    <div className="address-label-badge-group">
                      <span className="address-label-badge">
                        {addr.label === 'Home' ? (
                          <Home size={13} />
                        ) : addr.label === 'Work' ? (
                          <Briefcase size={13} />
                        ) : (
                          <MapPin size={13} />
                        )}
                        <span>{addr.label}</span>
                      </span>
                      {addr.isDefault && (
                        <span className="default-address-pill">
                          <Star size={11} fill="currentColor" /> Default
                        </span>
                      )}
                    </div>

                    <div className="address-card-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setAddressToEdit(addr);
                          setShowAddressModal(true);
                        }}
                        className="btn-address-action"
                        title="Edit address"
                        aria-label="Edit address"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddressToDelete(addr)}
                        className="btn-address-action text-danger"
                        title="Delete address"
                        aria-label="Delete address"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="address-card-details">
                    <p className="address-line">{addr.addressLine}</p>
                    {addr.landmark && (
                      <p className="address-landmark">
                        <strong>Landmark:</strong> {addr.landmark}
                      </p>
                    )}
                    <p className="address-city-state-pin">
                      {addr.city}, {addr.state} - <span className="font-mono">{addr.postalCode}</span>
                    </p>
                  </div>

                  {!addr.isDefault && (
                    <div className="address-card-footer">
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="btn-set-default"
                      >
                        <Star size={13} />
                        <span>Set as Default</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHANGE: Danger Zone only shown for CUSTOMER (account deletion via OTP) */}
      {isCustomer && (
        <div className="card danger-zone-card">
          <div className="danger-zone-header">
            <div className="danger-icon-wrapper">
              <AlertTriangle size={24} className="danger-icon" />
            </div>
            <div>
              <h3>Danger Zone</h3>
              <p>Irreversible actions for your bakery customer account</p>
            </div>
          </div>

          <div className="danger-zone-content">
            <div>
              <strong>Delete Customer Account</strong>
              <p>
                Permanently deactivate your account. You will be required to confirm your password and a 6-digit OTP sent to your email.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-danger"
            >
              <Trash2 size={16} />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      )}

      {/* CHANGE: Password Reset Modal — available to all roles from /account */}
      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        prefillIdentifier={user?.username || ''}
      />

      {/* CHANGE: Saved Address Create / Edit Modal (Issue #08) */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setAddressToEdit(null);
        }}
        onSave={handleSaveAddress}
        address={addressToEdit}
        isFirstAddress={addresses.length === 0}
      />

      {/* Delete Address Confirmation Modal */}
      {addressToDelete && (
        <div className="modal-overlay" onClick={() => setAddressToDelete(null)}>
          <div
            className="modal-content delete-address-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-row">
                <AlertTriangle size={22} className="text-danger" />
                <h3>Delete Saved Address</h3>
              </div>
              <button
                className="close-btn"
                onClick={() => setAddressToDelete(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body p-3">
              <p>
                Are you sure you want to delete the address labeled{' '}
                <strong>"{addressToDelete.label}"</strong>?
              </p>
              <p className="text-sm text-muted mt-1">
                {addressToDelete.addressLine}, {addressToDelete.city}, {addressToDelete.postalCode}
              </p>
              {addressToDelete.isDefault && (
                <p className="text-sm text-amber mt-2">
                  <AlertTriangle size={14} className="inline-icon" /> This is currently your default delivery address.
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setAddressToDelete(null)}
                disabled={deletingAddress}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDeleteAddress}
                disabled={deletingAddress}
              >
                {deletingAddress ? (
                  <>
                    <RefreshCw size={14} className="spinner" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal (customer-only) */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={resetDeleteModal}>
          <div
            className="modal-content delete-account-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-row">
                <AlertTriangle size={22} className="text-danger" />
                <h3>Delete Account Confirmation</h3>
              </div>
              <button
                className="close-btn"
                onClick={resetDeleteModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {deleteError && (
              <div className="alert alert-danger">
                {deleteError}
              </div>
            )}

            {otpSentMessage && (
              <div className="alert alert-success">
                {otpSentMessage}
              </div>
            )}

            {deleteStep === 1 && (
              <div className="delete-step-1">
                <p className="delete-warning-text">
                  This action is <strong>permanent</strong> and cannot be undone. To proceed, we must verify ownership of this account by sending a 6-digit OTP to your registered email address.
                </p>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={resetDeleteModal}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={handleRequestDeletionOtp}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <RefreshCw size={16} className="spinner" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        <span>Send Deletion OTP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 2 && (
              <form onSubmit={handleConfirmDeletion} className="delete-step-2">
                <div className="form-group">
                  <label htmlFor="deletePassword">Confirm Your Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input
                      id="deletePassword"
                      type="password"
                      placeholder="Enter account password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="deleteOtp">6-Digit Deletion OTP</label>
                  <div className="input-with-icon">
                    <KeyRound size={18} className="field-icon" />
                    <input
                      id="deleteOtp"
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={deleteOtp}
                      onChange={(e) => setDeleteOtp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={resetDeleteModal}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-danger"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <RefreshCw size={16} className="spinner" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        <span>Permanently Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
