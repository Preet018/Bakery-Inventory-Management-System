import React, { createContext, useContext, useState, useEffect } from 'react';

// CHANGE: Centralized role normalization and JWT parser helpers
import { normalizeRole, parseJwt } from '../utils/authUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // CHANGE: Synchronously restore and validate authentication state on initial load/refresh
  const [authState, setAuthState] = useState(() => {
    const savedToken = localStorage.getItem('bakery_token');
    const savedUser = localStorage.getItem('bakery_user');

    if (!savedToken) {
      // Clean up orphaned user state if token is absent
      if (savedUser) localStorage.removeItem('bakery_user');
      return { token: null, user: null };
    }

    // Decode token to verify integrity and expiration
    const decoded = parseJwt(savedToken);

    // If token is malformed or expired, clear session immediately
    if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
      localStorage.removeItem('bakery_token');
      localStorage.removeItem('bakery_user');
      return { token: null, user: null };
    }

    // Restore authoritative user details from the verified token
    let userData = null;
    try {
      if (savedUser) {
        userData = JSON.parse(savedUser);
      }
    } catch {
      userData = null;
    }

    const authoritativeUser = {
      userId: decoded.userId || userData?.userId || null,
      username: decoded.sub || userData?.username || '',
      role: normalizeRole(decoded.role || userData?.role),
    };

    // Ensure synchronized localStorage
    localStorage.setItem('bakery_user', JSON.stringify(authoritativeUser));

    return {
      token: savedToken,
      user: authoritativeUser,
    };
  });

  // CHANGE: Centralized login establishing authoritative authentication state from backend response
  const loginUser = (loginResponse) => {
    const { accessToken, username, role } = loginResponse;
    const decoded = parseJwt(accessToken);

    const userData = {
      userId: decoded?.userId || null,
      username: username || decoded?.sub || '',
      role: normalizeRole(role || decoded?.role),
    };

    localStorage.setItem('bakery_token', accessToken);
    localStorage.setItem('bakery_user', JSON.stringify(userData));

    setAuthState({
      token: accessToken,
      user: userData,
    });
  };

  // CHANGE: Centralized logout clearing all authentication tokens and state
  const logoutUser = () => {
    localStorage.removeItem('bakery_token');
    localStorage.removeItem('bakery_user');

    setAuthState({
      token: null,
      user: null,
    });
  };

  // CHANGE: Handle session expiration dispatched globally by Axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      logoutUser();
    };

    window.addEventListener('bakery:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('bakery:session-expired', handleSessionExpired);
    };
  }, []);

  const token = authState.token;
  const user = authState.user;
  const isAuthenticated = Boolean(token && user);

  // Derived canonical role flags
  const isCustomer = user?.role === 'CUSTOMER';
  const isInventoryManager = user?.role === 'INVENTORY_MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        isCustomer,
        isInventoryManager,
        isAdmin,
        login: loginUser,
        logout: logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};