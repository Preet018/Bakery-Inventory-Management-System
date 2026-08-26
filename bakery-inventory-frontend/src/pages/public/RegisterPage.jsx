import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { User, Mail, Lock, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * RegisterPage Component
 *
 * Compact, fit-to-screen Customer Registration form
 * Visually consistent with the 520px Role Login Form
 */
export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const msg = await authService.register(formData);
      setSuccessMsg(
        msg ||
          'Registration successful! An OTP code has been sent to your email. Redirecting to verification...'
      );

      // Redirect to OTP verification page after short delay
      setTimeout(() => {
        navigate('/verify-email', { state: { email: formData.email } });
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-standalone-page page-container">
      <div className="auth-card card compact-auth-card role-card-customer">
        <div className="compact-auth-header">
          <div className="header-title-row">
            <div className="compact-icon-badge icon-customer">
              <UserPlus size={20} />
            </div>
            <div>
              <h3>Create Customer Account</h3>
              <span className="role-pill-compact role-customer">
                CUSTOMER REGISTRATION
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-alert compact-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="success-alert compact-alert">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form compact-form">
          <div className="form-group compact-group">
            <label htmlFor="reg-username">Username (Display Name) *</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                id="reg-username"
                type="text"
                name="username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={50}
                placeholder="e.g. john_baker (3–50 chars)"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group compact-group">
            <label htmlFor="reg-email">Email Address (For OTP Verification) *</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="reg-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="e.g. customer@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group compact-group">
            <label htmlFor="reg-password">Password *</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="reg-password"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary btn-block compact-submit-btn"
          >
            <UserPlus size={16} />
            <span>
              {submitting ? 'Registering...' : 'Register & Send Verification OTP'}
            </span>
          </button>
        </form>

        <div className="compact-auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
          <p style={{ marginTop: '4px' }}>
            <Link to="/verify-email">Already received OTP? Verify Email</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
