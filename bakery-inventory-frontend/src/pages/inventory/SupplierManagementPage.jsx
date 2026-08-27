import React, { useEffect, useState } from 'react';
import { supplierService } from '../../services/supplierService';
import { Truck, Plus, RefreshCw, X, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * NEW FILE: SupplierManagementPage Component
 * Supplier listing and creation modal for Inventory Managers.
 */

export const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // CHANGE: Backend SupplierRequest expects: { name, email, phone, address } (no contactPerson)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAllSuppliers();
      setSuppliers(data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await supplierService.createSupplier(formData);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="supplier-page page-container">
      <Link to="/inventory/dashboard" className="back-link">
        <ArrowLeft size={18} /> Back to Inventory Dashboard
      </Link>

      <div className="page-header flex-between">
        <div>
          <h1>Supplier Directory</h1>
          <p>Manage ingredient suppliers, contacts, and vendor listings</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} /> Add New Supplier
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw className="spinner" size={32} />
          <p>Loading suppliers...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="empty-state card">
          <Truck size={48} />
          <h3>No Suppliers Found</h3>
          <p>Add your flour, dairy, and ingredient vendors to start recording purchase orders.</p>
        </div>
      ) : (
        <div className="supplier-grid">
          {suppliers.map((sup) => (
            <div key={sup.id} className="supplier-card card">
              <div className="supplier-header">
                <h3>{sup.name}</h3>
                {/* CHANGE: Backend SupplierResponse field is isActive (not active) */}
                <span className={`status-pill ${sup.isActive !== false ? 'pill-active' : 'pill-inactive'}`}>
                  {sup.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="supplier-details">
                <p><Mail size={14} /> {sup.email || 'N/A'}</p>
                <p><Phone size={14} /> {sup.phone || 'N/A'}</p>
                <p><MapPin size={14} /> {sup.address || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container card">
            <div className="modal-header">
              <h3>Register New Supplier</h3>
              <button onClick={() => setShowModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <form onSubmit={handleCreateSupplier} className="modal-form">
              <div className="form-group">
                <label>Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Mills & Dairy Products"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="vendor@supplier.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  rows={2}
                  placeholder="Vendor warehouse address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
