import React, { useState } from 'react';
import { adminService } from '../../services/adminService';
import { Shield, UserPlus, CheckCircle2, AlertCircle, Mail, User, Lock } from 'lucide-react';

/**
 * UserManagementPage Component
 *
 * CHANGE: The backend AccountRegistrationRequest expects exactly: { username, password, email }
 * Previously the form sent { firstName, lastName, email, password, phoneNumber } which
 * would fail backend validation. Fixed to match the actual DTO.
 */

export const UserManagementPage = () => {
  const [formData, setFormData] = useState({
    username: '',   // CHANGE: was firstName/lastName
    email: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterManager = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const msg = await adminService.registerInventoryManager(formData);
      setSuccessMsg(msg || 'Inventory Manager registered successfully! They must verify their email before logging in.');
      setFormData({ username: '', email: '', password: '' }); // CHANGE: reset correct fields
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.response?.data || 'Failed to register Inventory Manager.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="user-admin-page page-container">
      <div className="page-header">
        <h1>User Account Administration</h1>
        <p>Register new Inventory Managers and manage role authorization</p>
      </div>

      <div className="card max-w-2xl mx-auto">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <Shield size={24} />
          </div>
          <h2>Register Inventory Manager</h2>
          <p>Create staff credentials with access to stock operations and inventory purchasing</p>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="success-alert">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegisterManager} className="auth-form">
          {/* CHANGE: Single username field instead of firstName + lastName */}
          <div className="form-group">
            <label>Username *</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                name="username"
                required
                minLength={3}
                maxLength={50}
                placeholder="e.g. manager_sarah"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <span className="field-hint">3–50 characters</span>
          </div>

          <div className="form-group">
            <label>Work Email Address *</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                name="email"
                required
                placeholder="manager@bakery.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <span className="field-hint">A verification OTP will be sent to this email.</span>
          </div>

          <div className="form-group">
            <label>Initial Password *</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                name="password"
                required
                minLength={8}
                maxLength={100}
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <span className="field-hint">Must be between 8 and 100 characters</span>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary btn-block">
            <UserPlus size={18} />
            <span>{submitting ? 'Registering Manager...' : 'Register Inventory Manager'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
