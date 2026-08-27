import React, { useState } from 'react';

// CHANGE: Navigate is used for redirecting an already authenticated user.
// useLocation is used to recover the originally requested protected page.
import {
  Navigate,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom';

import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
// CHANGE: Renamed import from ChangePasswordModal → ResetPasswordModal
import { ResetPasswordModal } from './ResetPasswordModal';

// CHANGE: Centralized authentication helpers.
import {
  getRoleHome,
  hasAllowedRole,
  normalizeRole,
} from '../../utils/authUtils';

import {
  Lock,
  Mail,
  User,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Package,
  ShoppingBag,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

/**
 * RoleLoginForm Component
 *
 * Displays the login form for:
 *
 * CUSTOMER
 * INVENTORY MANAGER
 * ADMIN
 */
export const RoleLoginForm = ({
  roleKey = 'customer',
  title = 'Customer Sign In',
  subtitle = 'Sign in to access your orders and shopping cart',
  roleBadge = 'CUSTOMER',
}) => {
  const [loginMethod, setLoginMethod] = useState('username');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const {
    login,
    isAuthenticated,
    user,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // CHANGE: Recover the protected page that originally sent
  // the user to login.
  // =========================================================

  const fromLocation =
    location.state?.from || null;

  // CHANGE:
  // Preserve pathname + query string + hash.
  //
  // Example:
  // /products/10?something=true#details
  //
  // instead of only:
  // /products/10
  const from = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search || ''}${fromLocation.hash || ''}`
    : null;

  // CHANGE: ProtectedRoute stores which roles are allowed
  // to access the original page.
  const requiredRoles =
    location.state?.requiredRoles || [];

  // CHANGE: Always use the normalized role.
  const normalizedCurrentRole =
    normalizeRole(user?.role);

  // =========================================================
  // CHANGE: ALREADY AUTHENTICATED USER
  // =========================================================
  //
  // This fixes your exact problem:
  //
  // Logged in user
  //      ↓
  // /login
  //      ↓
  // should NOT see login form.
  //
  // Instead:
  //      ↓
  // requested page, if authorized
  // OR
  //      ↓
  // normal role landing page
  // =========================================================

  if (isAuthenticated) {
    const canReturnToRequestedPage =
      Boolean(from) &&
      hasAllowedRole(
        normalizedCurrentRole,
        requiredRoles
      );

    return (
      <Navigate
        to={
          canReturnToRequestedPage
            ? from
            : getRoleHome(normalizedCurrentRole)
        }
        replace
      />
    );
  }

  const portals = [
    {
      key: 'customer',
      path: '/login/customer',
      title: 'Customer',
      subtitle: 'Orders, cart & tracking',
      icon: ShoppingBag,
    },
    {
      key: 'manager',
      path: '/login/manager',
      title: 'Inventory Manager',
      subtitle: 'Stock, adjustments & vendors',
      icon: Package,
    },
    {
      key: 'admin',
      path: '/login/admin',
      title: 'Administrator',
      subtitle: 'User accounts & categories',
      icon: Shield,
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);

    // CHANGE: Validate password length before calling backend
    if (password.length < 8) {
      setError("Password can't be less than 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authService.login({
        usernameOrEmail: identifier.trim(),
        password,
      });

      // =====================================================
      // CHANGE: Normalize the role returned by the backend.
      // =====================================================

      const authenticatedRole =
        normalizeRole(response.role);

      // =====================================================
      // CHANGE: Determine which role portal the user selected.
      // =====================================================

      const selectedRole =
        roleKey === 'admin'
          ? 'ADMIN'
          : roleKey === 'manager'
            ? 'INVENTORY_MANAGER'
            : 'CUSTOMER';

      // =====================================================
      // CHANGE: Make sure the account's REAL backend role
      // matches the selected login portal.
      //
      // Example:
      //
      // User opens /login/admin
      // enters customer credentials
      //
      // Backend says CUSTOMER
      //
      // We do NOT create the session.
      // =====================================================

      if (authenticatedRole !== selectedRole) {
        setError('Unable to sign in. Invalid username/email or password.');

        return;
      }

      // =====================================================
      // CHANGE: Store the normalized role.
      // =====================================================

      login({
        ...response,
        role: authenticatedRole,
      });

      // =====================================================
      // CHANGE: Only return to the original page if this
      // authenticated role is allowed to access it.
      // =====================================================

      const canReturnToRequestedPage =
        Boolean(from) &&
        hasAllowedRole(
          authenticatedRole,
          requiredRoles
        );

      // =====================================================
      // CHANGE:
      //
      // If the user originally requested a page and has
      // permission, return there.
      //
      // Otherwise send them to their normal role landing page.
      // =====================================================

      navigate(
        canReturnToRequestedPage
          ? from
          : getRoleHome(authenticatedRole),
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error('Login error:', err);

      let msg = 'Login failed. Please check your credentials.';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'The login request timed out. Please try again.';
      } else if (err.response?.status === 401) {
        msg = 'Unable to sign in. Invalid username/email or password.';
      } else if (err.response?.data?.error === 'EMAIL_NOT_VERIFIED' || err.response?.data?.message?.includes('verified')) {
        msg = err.response.data.message || 'Your email is not verified. Please verify your email before logging in.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (typeof err.response?.data === 'string' && err.response.data.trim()) {
        msg = err.response.data;
      }

      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderRoleIcon = () => {
    if (roleKey === 'admin') {
      return <Shield size={20} />;
    }

    if (roleKey === 'manager') {
      return <Package size={20} />;
    }

    return <ShoppingBag size={20} />;
  };

  return (
    <div className="role-split-page page-container">
      <div className="role-split-layout">

        {/* ===================================================
            LEFT SIDE: ROLE SELECTION
            =================================================== */}

        <div className="portal-selector-column">
          <div className="portal-selector-header">
            <h2>Sign in as</h2>

            <p>
              Select your authorized role to access
              your account
            </p>
          </div>

          <div className="portal-cards-list">
            {portals.map((portal) => {
              const IconComp = portal.icon;
              const isActive =
                roleKey === portal.key;

              return (
                <Link
                  key={portal.key}
                  to={portal.path}
                  className={`portal-role-card ${isActive
                    ? `active-${portal.key}`
                    : ''
                    }`}
                >
                  <div
                    className={`portal-card-icon-box box-${portal.key}`}
                  >
                    <IconComp size={20} />
                  </div>

                  <div className="portal-card-content">
                    <span className="portal-card-title">
                      {portal.title}
                    </span>

                    <span className="portal-card-subtitle">
                      {portal.subtitle}
                    </span>
                  </div>

                  <ChevronRight
                    size={18}
                    className="portal-card-arrow"
                  />
                </Link>
              );
            })}
          </div>

          {/* Customer Registration Prompt */}
          <div className="portal-help-card">
            <Sparkles
              size={18}
              className="help-icon"
            />

            <div>
              <strong>
                Need a Customer Account?
              </strong>

              <p>
                Join to browse freshly baked
                artisan breads, pastries, and
                order online!
              </p>

              <Link
                to="/register"
                className="help-link"
              >
                Register Customer Account &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* ===================================================
            RIGHT SIDE: LOGIN FORM
            =================================================== */}

        <div className="portal-form-column">
          <div
            className={`auth-card card compact-auth-card role-card-${roleKey}`}
          >
            <div className="compact-auth-header">
              <div className="header-title-row">

                <div
                  className={`compact-icon-badge icon-${roleKey}`}
                >
                  {renderRoleIcon()}
                </div>

                <div>
                  <h3>{title}</h3>

                  <span
                    className={`role-pill-compact role-${roleKey}`}
                  >
                    {roleBadge}
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

            <form
              onSubmit={handleSubmit}
              className="auth-form compact-form"
            >

              {/* =================================================
                  LOGIN METHOD
                  ================================================= */}

              <div className="login-method-toggle compact-toggle">

                <button
                  type="button"
                  className={`toggle-tab ${loginMethod === 'username'
                    ? 'active'
                    : ''
                    }`}
                  onClick={() => {
                    setLoginMethod('username');
                    setError(null);
                  }}
                >
                  <User size={14} />
                  Username
                </button>

                <button
                  type="button"
                  className={`toggle-tab ${loginMethod === 'email'
                    ? 'active'
                    : ''
                    }`}
                  onClick={() => {
                    setLoginMethod('email');
                    setError(null);
                  }}
                >
                  <Mail size={14} />
                  Email
                </button>

              </div>

              {/* =================================================
                  USERNAME / EMAIL INPUT
                  ================================================= */}

              <div className="form-group compact-group">

                <label
                  htmlFor={
                    loginMethod === 'email'
                      ? 'login-email-input'
                      : 'login-username-input'
                  }
                >
                  {loginMethod === 'username'
                    ? 'Username'
                    : 'Email Address'}{' '}
                  *
                </label>

                <div className="input-with-icon">

                  {loginMethod === 'username' ? (
                    <>
                      <User
                        size={16}
                        className="input-icon"
                      />

                      <input
                        key="input-username"
                        id="login-username-input"
                        name="bakery_user"
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        placeholder={
                          roleKey === 'admin'
                            ? 'e.g. admin'
                            : roleKey === 'manager'
                              ? 'e.g. manager_sarah'
                              : 'e.g. john_baker'
                        }
                        value={identifier}
                        onChange={(e) =>
                          setIdentifier(e.target.value)
                        }
                      />
                    </>
                  ) : (
                    <>
                      <Mail
                        size={16}
                        className="input-icon"
                      />

                      <input
                        key="input-email"
                        id="login-email-input"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder={
                          roleKey === 'admin'
                            ? 'e.g. admin@bakery.com'
                            : roleKey === 'manager'
                              ? 'e.g. manager@bakery.com'
                              : 'e.g. customer@example.com'
                        }
                        value={identifier}
                        onChange={(e) =>
                          setIdentifier(e.target.value)
                        }
                      />
                    </>
                  )}

                </div>
              </div>

              {/* =================================================
                  PASSWORD INPUT
                  ================================================= */}

              <div className="form-group compact-group">

                <div className="label-with-action">

                  <label htmlFor="login-password-input">
                    Password *
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordModal(true)
                    }
                    className="btn-link-action"
                  >
                    <KeyRound size={12} />
                    {/* CHANGE: Accurate label — this is "Forgot Password", not "Change Password" */}
                    Forgot Password?
                  </button>

                </div>

                <div className="input-with-icon input-with-action">

                  <Lock
                    size={16}
                    className="input-icon"
                  />

                  <input
                    id="login-password-input"
                    name="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="input-eye-btn"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    tabIndex={-1}
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                </div>
              </div>

              {/* =================================================
                  SUBMIT BUTTON
                  ================================================= */}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary btn-block compact-submit-btn"
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={16}
                      className="btn-spinner"
                    />
                    <span>
                      Signing in...
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>
                      Sign In as {roleBadge}
                    </span>
                  </>
                )}
              </button>

            </form>

            {/* =================================================
                FOOTER
                ================================================= */}

            <div className="compact-auth-footer">

              {(roleKey === 'customer' ||
                roleKey === 'manager') && (
                  <p>
                    <Link to="/verify-email">
                      Verify account email with OTP
                    </Link>
                  </p>
                )}

              {roleKey === 'admin' && (
                <span className="compact-note">
                  Administrator account is securely
                  pre-provisioned in backend config.
                </span>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          PASSWORD RESET MODAL
          ===================================================== */}

      {/* CHANGE: Removed unused defaultRole prop (Issue #05) */}
      <ResetPasswordModal
        isOpen={showPasswordModal}
        onClose={() =>
          setShowPasswordModal(false)
        }
      />
    </div>
  );
};