import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasAllowedRole, getRoleHome } from '../../utils/authUtils';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * ProtectedRoute Component
 *
 * Enforces role-based route access:
 * 1. Unauthenticated users are redirected to /login with original location preserved.
 * 2. Authenticated users with permitted roles render the protected child component.
 * 3. Authenticated users with insufficient roles receive an Access Denied barrier with navigation back to their home workspace.
 */
export const ProtectedRoute = ({
  children,
  allowedRoles = [],
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // ---------------------------------------------------------
  // 1. NOT AUTHENTICATED -> Redirect to Login
  // ---------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          requiredRoles: allowedRoles,
        }}
        replace
      />
    );
  }

  // ---------------------------------------------------------
  // 2. AUTHENTICATED BUT UNAUTHORIZED ROLE -> Access Denied Barrier
  // ---------------------------------------------------------
  // CHANGE: Enforce strict role boundary and provide role-aware return link
  if (
    allowedRoles.length > 0 &&
    !hasAllowedRole(user?.role, allowedRoles)
  ) {
    const returnPath = getRoleHome(user?.role);

    return (
      <div className="unauthorized-container page-container">
        <div className="unauthorized-card card text-center">
          <div className="unauthorized-icon-wrapper mb-3">
            <ShieldAlert size={48} className="text-danger" />
          </div>

          <h2>Access Denied</h2>

          <p className="mb-3">
            You do not have authorization to access this area of the Bakery Management System.
          </p>

          <p className="role-notice mb-4">
            Active Role: <strong>{user?.role || 'UNKNOWN'}</strong>
          </p>

          <Link to={returnPath} className="btn-primary">
            <ArrowLeft size={16} />
            <span>Return to Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 3. AUTHORIZED -> Render protected child components
  // ---------------------------------------------------------
  return children;
};