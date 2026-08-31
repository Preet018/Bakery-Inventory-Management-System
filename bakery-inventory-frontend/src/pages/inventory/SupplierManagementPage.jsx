import React, { useEffect, useState, useMemo } from 'react';
import { supplierService } from '../../services/supplierService';
import { GoogleMapLocationPicker } from '../../components/address/GoogleMapLocationPicker';
import { BackOfficeHeaderBadge } from '../../components/common/BackOfficeHeaderBadge';
import { getErrorMessage, getFieldErrors } from '../../utils/apiError';
import {
  Truck,
  Plus,
  RefreshCw,
  X,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  AlertCircle,
  Building,
  Factory,
  Briefcase,
  Store,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Helper to parse existing supplier address string into structured fields
 */
const parseExistingAddress = (rawAddress) => {
  if (!rawAddress) return null;
  const trimmed = rawAddress.trim();

  // Check if stored as JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const isStdLabel = ['Warehouse', 'Factory', 'Office', 'Store'].includes(parsed.label);
      return {
        addressLabel: isStdLabel ? parsed.label : (parsed.label ? 'Other' : 'Warehouse'),
        customAddressLabel: isStdLabel ? '' : (parsed.label || ''),
        addressLine: parsed.addressLine || '',
        landmark: parsed.landmark || '',
        city: parsed.city || '',
        state: parsed.state || '',
        postalCode: parsed.postalCode || '',
        latitude: typeof parsed.latitude === 'number' ? parsed.latitude : 19.0760,
        longitude: typeof parsed.longitude === 'number' ? parsed.longitude : 72.8777,
      };
    } catch (e) {
      // fallback to plain text parsing
    }
  }

  let label = 'Warehouse';
  let customLabel = '';
  let content = trimmed;

  // Extract [Label] if prefix exists
  const labelMatch = content.match(/^\[(.*?)\]\s*/);
  if (labelMatch) {
    const extracted = labelMatch[1].trim();
    if (['Warehouse', 'Factory', 'Office', 'Store'].includes(extracted)) {
      label = extracted;
    } else if (extracted) {
      label = 'Other';
      customLabel = extracted;
    }
    content = content.slice(labelMatch[0].length).trim();
  }

  // Extract PIN code if present
  let postalCode = '';
  const pinMatch = content.match(/(?:PIN|Pin|Postal Code|Postal|Zip)[:\s]*([0-9]{5,6})/i);
  if (pinMatch) {
    postalCode = pinMatch[1];
    content = content.replace(pinMatch[0], '').trim();
  }

  // Extract Landmark if present
  let landmark = '';
  const lmMatch = content.match(/(?:Near|Opposite|Behind|Beside|Adj to|Near by|Landmark)[:\s]*([^,]+)/i);
  if (lmMatch) {
    landmark = lmMatch[0].trim();
  }

  const parts = content.split(',').map((p) => p.trim()).filter(Boolean);
  let city = '';
  let state = '';
  let addressLine = content;

  if (parts.length >= 3) {
    state = parts[parts.length - 1];
    city = parts[parts.length - 2];
    addressLine = parts.slice(0, parts.length - 2).join(', ');
  } else if (parts.length === 2) {
    city = parts[1];
    addressLine = parts[0];
  }

  return {
    addressLabel: label,
    customAddressLabel: customLabel,
    addressLine: addressLine || trimmed,
    landmark,
    city,
    state,
    postalCode,
    latitude: 19.0760,
    longitude: 72.8777,
  };
};

export const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // ADD | EDIT
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Deactivate/Activate Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState(null); // { supplier, action: 'activate' | 'deactivate' }

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addressLabel: 'Warehouse',
    customAddressLabel: '',
    addressLine: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    latitude: 19.0760,
    longitude: 72.8777,
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSuppliers = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setPageError(null);
      const data = await supplierService.getAllSuppliers();
      setSuppliers(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      setPageError(getErrorMessage(err, 'Unable to load supplier records from the server.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Summary Metrics
  const totalCount = suppliers.length;
  const activeCount = suppliers.filter((s) => s.isActive !== false).length;
  const inactiveCount = suppliers.filter((s) => s.isActive === false).length;

  // Filtered Suppliers list
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      // Status Filter
      const isActive = sup.isActive !== false;
      if (statusFilter === 'ACTIVE' && !isActive) return false;
      if (statusFilter === 'INACTIVE' && isActive) return false;

      // Search Query Match (name, email, phone, address)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = sup.name?.toLowerCase().includes(q);
        const emailMatch = sup.email?.toLowerCase().includes(q);
        const phoneMatch = sup.phone?.toLowerCase().includes(q);
        const addrMatch = sup.address?.toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || addrMatch;
      }

      return true;
    });
  }, [suppliers, statusFilter, searchTerm]);

  const hasActiveFilters = Boolean(searchTerm.trim()) || statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setModalMode('ADD');
    setSelectedSupplier(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      addressLabel: 'Warehouse',
      customAddressLabel: '',
      addressLine: '',
      landmark: '',
      city: '',
      state: '',
      postalCode: '',
      latitude: 19.0760,
      longitude: 72.8777,
    });
    setFormErrors({});
    setServerError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (supplier) => {
    setModalMode('EDIT');
    setSelectedSupplier(supplier);
    setFormErrors({});
    setServerError(null);

    const parsed = parseExistingAddress(supplier.address);
    if (parsed) {
      setFormData({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        addressLabel: parsed.addressLabel || 'Warehouse',
        customAddressLabel: parsed.customAddressLabel || '',
        addressLine: parsed.addressLine || '',
        landmark: parsed.landmark || '',
        city: parsed.city || '',
        state: parsed.state || '',
        postalCode: parsed.postalCode || '',
        latitude: parsed.latitude || 19.0760,
        longitude: parsed.longitude || 72.8777,
      });
    } else {
      setFormData({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        addressLabel: 'Warehouse',
        customAddressLabel: '',
        addressLine: supplier.address || '',
        landmark: '',
        city: '',
        state: '',
        postalCode: '',
        latitude: 19.0760,
        longitude: 72.8777,
      });
    }

    setModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSupplier(null);
    setFormErrors({});
    setServerError(null);
  };

  // Validate Form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Supplier/Company name is required';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (formData.phone.trim()) {
      const phoneClean = formData.phone.replace(/[\s\-\(\)\+]/g, '');
      if (phoneClean.length < 7 || phoneClean.length > 15) {
        errors.phone = 'Phone number must be between 7 and 15 digits';
      }
    }

    if (formData.postalCode.trim()) {
      if (!/^[0-9A-Za-z\s\-]{3,10}$/.test(formData.postalCode.trim())) {
        errors.postalCode = 'Please enter a valid postal/PIN code';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Location Picker Updates
  const handleLocationSelect = (loc) => {
    setFormData((prev) => ({
      ...prev,
      latitude: loc.latitude,
      longitude: loc.longitude,
      addressLine: loc.addressLine || prev.addressLine,
      city: loc.city || prev.city,
      state: loc.state || prev.state,
      postalCode: loc.postalCode || prev.postalCode,
      landmark: loc.landmark || prev.landmark,
    }));
  };

  // Save Supplier (Create / Update)
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    setServerError(null);
    setPageError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const activeLabel =
        formData.addressLabel === 'Other'
          ? (formData.customAddressLabel.trim() || 'Facility')
          : formData.addressLabel;

      const addressParts = [
        formData.addressLine.trim(),
        formData.landmark.trim() ? `Near ${formData.landmark.trim()}` : null,
        formData.city.trim(),
        formData.state.trim(),
        formData.postalCode.trim() ? `PIN: ${formData.postalCode.trim()}` : null,
      ].filter(Boolean);

      const fullFormattedAddress = [
        activeLabel ? `[${activeLabel}]` : null,
        addressParts.join(', '),
      ].filter(Boolean).join(' ');

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: fullFormattedAddress || undefined,
      };

      if (modalMode === 'ADD') {
        await supplierService.createSupplier(payload);
        setSuccessBanner(`Supplier "${payload.name}" registered successfully.`);
      } else if (modalMode === 'EDIT' && selectedSupplier) {
        await supplierService.updateSupplier(selectedSupplier.id, payload);
        setSuccessBanner(`Supplier "${payload.name}" updated successfully.`);
      }

      handleCloseModal();
      fetchSuppliers();

      // Auto-hide success banner after 5s
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err) {
      console.error('Save supplier error:', err);
      const msg = getErrorMessage(err, 'Failed to save supplier details. Please check the fields and try again.');
      setServerError(msg);
      const fields = getFieldErrors(err);
      if (fields && Object.keys(fields).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...fields }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Activate / Deactivate
  const handleToggleStatus = async () => {
    if (!confirmDialog) return;
    const { supplier, action } = confirmDialog;
    setSubmitting(true);
    setPageError(null);

    try {
      if (action === 'activate') {
        await supplierService.activateSupplier(supplier.id);
        setSuccessBanner(`Supplier "${supplier.name}" has been activated.`);
      } else {
        await supplierService.deactivateSupplier(supplier.id);
        setSuccessBanner(`Supplier "${supplier.name}" has been deactivated.`);
      }

      setConfirmDialog(null);
      fetchSuppliers();
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err) {
      console.error('Status toggle error:', err);
      setConfirmDialog(null);
      setPageError(getErrorMessage(err, 'Failed to update supplier status.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="supplier-page page-container">
      {/* Sub-Page Back Navigation */}
      <Link to="/inventory/manage" className="back-link">
        <ArrowLeft size={16} /> Back to Manage Inventory
      </Link>

      {/* Page Header */}
      <div className="dashboard-header-container">
        <div className="dashboard-title-area">
          <BackOfficeHeaderBadge lastUpdated={lastUpdated} />
          <h1>Supplier Management</h1>
          <p className="dashboard-subtitle">
            Manage ingredient vendors, bulk suppliers, contact records, and active procurement listings
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            onClick={() => fetchSuppliers(true)}
            className="btn-secondary refresh-btn"
            disabled={refreshing || loading}
            title="Refresh supplier list"
          >
            <RefreshCw className={refreshing ? 'spinner' : ''} size={16} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button onClick={handleOpenAddModal} className="btn-primary">
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      {/* Page Error Banner */}
      {pageError && (
        <div className="alert alert-danger mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-danger" />
            <span>{pageError}</span>
          </div>
          <button
            onClick={() => setPageError(null)}
            className="banner-close-btn"
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

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
            aria-label="Dismiss banner"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="metrics-grid supplier-metrics-grid">
        {/* Total Suppliers */}
        <div
          className={`metric-card card ${statusFilter === 'ALL' ? 'active-metric metric-card-all' : ''}`}
          onClick={() => setStatusFilter('ALL')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-blue">
            <Building size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{totalCount}</div>
            <div className="metric-label">Total Registered Suppliers</div>
            <div className="metric-subtext">Active and archived vendors</div>
          </div>
        </div>

        {/* Active Suppliers */}
        <div
          className={`metric-card card ${statusFilter === 'ACTIVE' ? 'active-metric metric-card-optimal' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-green">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{activeCount}</div>
            <div className="metric-label">Active Suppliers</div>
            <div className="metric-subtext">Available for purchasing</div>
          </div>
        </div>

        {/* Inactive Suppliers */}
        <div
          className={`metric-card card ${statusFilter === 'INACTIVE' ? 'active-metric metric-card-out' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'INACTIVE' ? 'ALL' : 'INACTIVE')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-red">
            <XCircle size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{inactiveCount}</div>
            <div className="metric-label">Inactive Suppliers</div>
            <div className="metric-subtext">Procurement paused</div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="inventory-toolbar card">
        <div className="toolbar-search-wrapper" style={{ width: '100%' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by supplier name, email, phone, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-field"
            id="supplier-search-input"
            aria-label="Search suppliers"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Supplier Data Table & List */}
      {loading ? (
        <div className="loading-state card">
          <RefreshCw className="spinner" size={36} />
          <p>Loading supplier directory...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="empty-state card">
          <Truck size={48} className="text-muted" />
          <h3>No Suppliers Found</h3>
          <p>Register your flour, dairy, and packaging vendors to start recording purchase orders.</p>
          <button onClick={handleOpenAddModal} className="btn-primary mt-3">
            <Plus size={16} /> Add First Supplier
          </button>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="empty-state card">
          <Truck size={48} className="text-muted" />
          <h3>No matching suppliers found</h3>
          <p>No vendors matched your current filter and search criteria.</p>
          <button onClick={handleResetFilters} className="btn-secondary mt-3">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="table-responsive card inventory-table-card">
          <div className="table-header-strip">
            <span className="table-count-label">
              Showing&nbsp;<strong>{filteredSuppliers.length}</strong>&nbsp;of&nbsp;<strong>{suppliers.length}</strong>&nbsp;registered suppliers
            </span>
          </div>

          <table className="inventory-table supplier-table">
            <thead>
              <tr>
                <th style={{ width: '6%' }}>ID</th>
                <th style={{ width: '22%' }}>Supplier / Company</th>
                <th style={{ width: '21%' }}>Contact Email</th>
                <th style={{ width: '14%' }}>Phone</th>
                <th style={{ width: '20%' }}>Address / Warehouse</th>
                <th style={{ width: '8%' }}>Status</th>
                <th style={{ width: '15%' }} className="actions-column-header">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((sup) => {
                const isActive = sup.isActive !== false;

                return (
                  <tr
                    key={sup.id}
                    className={`inventory-row ${!isActive ? 'row-inactive-supplier' : ''}`}
                  >
                    {/* ID */}
                    <td>
                      <span className="tx-id-badge">#{sup.id}</span>
                    </td>

                    {/* Supplier Name */}
                    <td>
                      <div className="product-cell">
                        <span className="product-cell-name font-bold">
                          {sup.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td>
                      {sup.email ? (
                        <a
                          href={`mailto:${sup.email}`}
                          className="supplier-contact-link"
                          title="Send email"
                        >
                          <Mail size={13} />
                          <span>{sup.email}</span>
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td>
                      {sup.phone ? (
                        <a
                          href={`tel:${sup.phone}`}
                          className="supplier-phone-link"
                          title="Call supplier"
                        >
                          <Phone size={13} />
                          <span>{sup.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Address */}
                    <td>
                      {sup.address ? (
                        <div className="supplier-address-cell">
                          <MapPin size={13} className="text-muted" style={{ flexShrink: 0, marginTop: '3px' }} />
                          <span>{sup.address}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span
                        className={`stock-badge-table ${
                          isActive ? 'badge-optimal' : 'badge-out'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 size={13} /> Active
                          </>
                        ) : (
                          <>
                            <XCircle size={13} /> Inactive
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="actions-cell">
                      <div className="action-buttons-group">
                        <button
                          onClick={() => handleOpenEditModal(sup)}
                          className="btn-sm btn-secondary btn-supplier-edit"
                          title="Edit supplier details"
                        >
                          <Edit2 size={12} style={{ marginRight: '4px' }} /> Edit
                        </button>

                        {isActive ? (
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                supplier: sup,
                                action: 'deactivate',
                              })
                            }
                            className="btn-sm btn-danger btn-supplier-toggle"
                            title="Deactivate supplier"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                supplier: sup,
                                action: 'activate',
                              })
                            }
                            className="btn-sm btn-success btn-supplier-toggle"
                            title="Activate supplier"
                          >
                            Activate
                          </button>
                        )}
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
          ADD / EDIT SUPPLIER MODAL
          =================================================== */}
      {modalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-container card backoffice-modal supplier-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-info">
                <div className="modal-header-icon-title">
                  <Truck className="text-primary" size={20} />
                  <h3>
                    {modalMode === 'ADD'
                      ? 'Register New Supplier'
                      : `Edit Supplier #${selectedSupplier?.id}`}
                  </h3>
                </div>
                <p className="modal-subtitle">
                  {modalMode === 'ADD'
                    ? 'Add vendor details and structured warehouse address for ingredient purchases'
                    : `Update contact, procurement details, and warehouse address for ${selectedSupplier?.name}`}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {serverError && (
              <div className="error-alert">
                <AlertCircle size={16} />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="modal-form">
              {/* Supplier Name */}
              <div className="form-group">
                <label htmlFor="supplier-name-input">
                  Supplier / Company Name *
                </label>
                <input
                  id="supplier-name-input"
                  type="text"
                  required
                  placeholder="e.g. Royal Mills & Grain Supply"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) {
                      setFormErrors({ ...formErrors, name: null });
                    }
                  }}
                  className={formErrors.name ? 'input-error' : ''}
                  autoFocus
                />
                {formErrors.name && (
                  <span className="field-error-text">{formErrors.name}</span>
                )}
              </div>

              {/* Email & Phone Grid */}
              <div className="modal-form-grid-2">
                <div className="form-group">
                  <label htmlFor="supplier-email-input">Email Address</label>
                  <input
                    id="supplier-email-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="orders@supplier.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) {
                        setFormErrors({ ...formErrors, email: null });
                      }
                    }}
                    className={formErrors.email ? 'input-error' : ''}
                  />
                  {formErrors.email && (
                    <span className="field-error-text">{formErrors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="supplier-phone-input">Phone Number</label>
                  <input
                    id="supplier-phone-input"
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Structured Address Section */}
              <div className="address-section supplier-address-section">
                <h4 className="address-section-title">
                  <MapPin size={15} className="text-primary" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />
                  Warehouse & Address Details
                </h4>

                {/* Address Label Pills */}
                <div className="form-group mb-3">
                  <label className="form-label">Address Label *</label>
                  <div className="address-label-pills">
                    <button
                      type="button"
                      className={`label-pill ${formData.addressLabel === 'Warehouse' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, addressLabel: 'Warehouse' })}
                    >
                      <Building size={14} />
                      <span>Warehouse</span>
                    </button>
                    <button
                      type="button"
                      className={`label-pill ${formData.addressLabel === 'Factory' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, addressLabel: 'Factory' })}
                    >
                      <Factory size={14} />
                      <span>Factory</span>
                    </button>
                    <button
                      type="button"
                      className={`label-pill ${formData.addressLabel === 'Office' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, addressLabel: 'Office' })}
                    >
                      <Briefcase size={14} />
                      <span>Office</span>
                    </button>
                    <button
                      type="button"
                      className={`label-pill ${formData.addressLabel === 'Store' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, addressLabel: 'Store' })}
                    >
                      <Store size={14} />
                      <span>Store</span>
                    </button>
                    <button
                      type="button"
                      className={`label-pill ${formData.addressLabel === 'Other' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, addressLabel: 'Other' })}
                    >
                      <MapPin size={14} />
                      <span>Other</span>
                    </button>
                  </div>

                  {formData.addressLabel === 'Other' && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="e.g. Distribution Hub, Flour Mill, Cold Storage"
                      value={formData.customAddressLabel}
                      onChange={(e) => setFormData({ ...formData, customAddressLabel: e.target.value })}
                      maxLength={30}
                    />
                  )}
                </div>

                {/* Google Places Autocomplete & Map */}
                <div className="form-group address-picker-form-group mb-3">
                  <GoogleMapLocationPicker
                    initialLatitude={formData.latitude}
                    initialLongitude={formData.longitude}
                    onLocationSelect={(loc) => {
                      setFormData((prev) => ({
                        ...prev,
                        addressLine: loc.addressLine || prev.addressLine,
                        city: loc.city || prev.city,
                        state: loc.state || prev.state,
                        postalCode: loc.postalCode || prev.postalCode,
                        latitude: typeof loc.latitude === 'number' ? loc.latitude : prev.latitude,
                        longitude: typeof loc.longitude === 'number' ? loc.longitude : prev.longitude,
                      }));
                    }}
                  />
                </div>

                {/* House / Flat / Block No., Street & Area */}
                <div className="form-group mb-3">
                  <label htmlFor="supplier-address-line" className="form-label">
                    House / Flat / Block No., Street & Area
                  </label>
                  <input
                    id="supplier-address-line"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Unit 4, Plot 12, Industrial Estate, Andheri East"
                    value={formData.addressLine}
                    onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                    maxLength={255}
                  />
                </div>

                {/* Landmark (Optional) */}
                <div className="form-group mb-3">
                  <label htmlFor="supplier-landmark" className="form-label">
                    Landmark (Optional)
                  </label>
                  <input
                    id="supplier-landmark"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Near Metro Station, Behind Container Depot"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    maxLength={255}
                  />
                </div>

                {/* City, State, PIN Code Grid */}
                <div className="address-fields-grid">
                  <div className="form-group">
                    <label htmlFor="supplier-city" className="form-label">City</label>
                    <input
                      id="supplier-city"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      maxLength={100}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="supplier-state" className="form-label">State</label>
                    <input
                      id="supplier-state"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Maharashtra"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      maxLength={100}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="supplier-postal-code" className="form-label">PIN Code</label>
                    <input
                      id="supplier-postal-code"
                      type="text"
                      className="form-control"
                      placeholder="6-digit PIN Code"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting
                    ? 'Saving...'
                    : modalMode === 'ADD'
                    ? 'Register Supplier'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          CONFIRMATION DIALOG (ACTIVATE / DEACTIVATE)
          =================================================== */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div
            className="modal-container card confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                {confirmDialog.action === 'deactivate' ? (
                  <XCircle className="text-danger" size={22} />
                ) : (
                  <CheckCircle2 className="text-success" size={22} />
                )}
                <h3>
                  {confirmDialog.action === 'deactivate'
                    ? 'Deactivate Supplier?'
                    : 'Activate Supplier?'}
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
              <p>
                {confirmDialog.action === 'deactivate' ? (
                  <>
                    Are you sure you want to deactivate{' '}
                    <strong>{confirmDialog.supplier?.name}</strong>?
                    Deactivated suppliers will be marked as inactive in the directory.
                  </>
                ) : (
                  <>
                    Are you sure you want to activate{' '}
                    <strong>{confirmDialog.supplier?.name}</strong>?
                    Active suppliers are available for stock purchasing and procurement.
                  </>
                )}
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                className={
                  confirmDialog.action === 'deactivate'
                    ? 'btn-danger'
                    : 'btn-success'
                }
                disabled={submitting}
              >
                {submitting
                  ? 'Processing...'
                  : confirmDialog.action === 'deactivate'
                  ? 'Yes, Deactivate'
                  : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
