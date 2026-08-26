import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

import {
  ShoppingBag,
  Cake,
  LogOut,
  Package,
  Shield,
  Layers,
  Truck,
  History,
  Store,
  User,
} from 'lucide-react';

/**
 * Role-aware Navigation Bar supporting:
 * 1. Customer Storefront experience (Catalog, Orders, Account, Cart)
 * 2. Inventory Manager Back-Office experience (Dashboard, History, Suppliers)
 * 3. Administrator Back-Office experience (Categories, User Accounts, Inventory)
 */
export const Navbar = () => {
  const {
    user,
    isAuthenticated,
    isCustomer,
    isInventoryManager,
    isAdmin,
    logout,
  } = useAuth();

  const { totalItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // CHANGE: Brand logo always targets the public home page (/) for every role
  const brandTarget = '/';

  const brandSubtitle = isAdmin
    ? 'Admin Back Office'
    : isInventoryManager
    ? 'Inventory Workspace'
    : 'Inventory & Store';

  // CHANGE: When clicking brand logo, smoothly scroll to top on Home page or navigate cleanly to /
  const handleBrandClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      // Clear any URL hash
      if (window.location.hash) {
        window.history.replaceState(null, '', '/');
      }
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    }
  };

  return (
    <nav className={`bakery-navbar ${isAdmin ? 'navbar-admin' : isInventoryManager ? 'navbar-inventory' : 'navbar-storefront'}`}>
      <div className="navbar-container">

        {/* ===================================================
            BRAND LOGO (Universal / for all roles & Top Scroll on Home)
            =================================================== */}

        <Link
          to={brandTarget}
          onClick={handleBrandClick}
          className="navbar-brand"
        >
          <div className="brand-icon-wrapper">
            <Cake
              className="brand-icon"
              size={28}
            />
          </div>

          <div className="brand-text">
            <span className="brand-title">
              Artisan Bakery
            </span>

            <span className="brand-subtitle">
              {brandSubtitle}
            </span>
          </div>
        </Link>

        {/* ===================================================
            NAVIGATION LINKS (Uniform Pill Buttons across all roles)
            =================================================== */}

        <div className="navbar-links">

          {/* 1. CUSTOMER / GUEST STOREFRONT NAVIGATION */}
          {/* CHANGE: Removed Bakery Catalog navbar button per revised storefront flow */}
          {isCustomer && (
            <>
              <Link
                to="/customer/orders"
                className="nav-link"
              >
                <Package size={16} />
                <span>My Orders</span>
              </Link>

              <Link
                to="/account"
                className="nav-link"
              >
                <User size={16} />
                <span>My Account</span>
              </Link>
            </>
          )}

          {/* 2. INVENTORY MANAGER BACK-OFFICE NAVIGATION */}
          {isInventoryManager && (
            <>
              <Link
                to="/inventory/suppliers"
                className="nav-link"
              >
                <Truck size={16} />
                <span>Suppliers</span>
              </Link>

              <Link
                to="/inventory/history"
                className="nav-link"
              >
                <History size={16} />
                <span>Stock History</span>
              </Link>

              <Link
                to="/inventory/dashboard"
                className="nav-link"
              >
                <Package size={16} />
                <span>Manage Inventory</span>
              </Link>

              {/* CHANGE: Universal My Account link for Inventory Manager */}
              <Link
                to="/account"
                className="nav-link"
              >
                <User size={16} />
                <span>My Account</span>
              </Link>
            </>
          )}

          {/* 3. ADMIN BACK-OFFICE NAVIGATION */}
          {isAdmin && (
            <>
              <Link
                to="/admin/categories"
                className="nav-link"
              >
                <Layers size={16} />
                <span>Categories</span>
              </Link>

              <Link
                to="/admin/users"
                className="nav-link"
              >
                <Shield size={16} />
                <span>User Accounts</span>
              </Link>

              <Link
                to="/inventory/dashboard"
                className="nav-link"
              >
                <Package size={16} />
                <span>Manage Inventory</span>
              </Link>

              {/* CHANGE: Universal My Account link for Admin */}
              <Link
                to="/account"
                className="nav-link"
              >
                <User size={16} />
                <span>My Account</span>
              </Link>
            </>
          )}
        </div>

        {/* ===================================================
            RIGHT ACTIONS
            =================================================== */}

        <div className="navbar-actions">

          {/* Cart ONLY for guests and customers */}
          {(!isAuthenticated || isCustomer) && (
            <Link
              to="/cart"
              className="cart-btn"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={22} />

              {totalItemsCount > 0 && (
                <span className="cart-badge">
                  {totalItemsCount}
                </span>
              )}
            </Link>
          )}

          {/* Authenticated User Menu */}
          {isAuthenticated ? (
            <div className="user-profile-menu">

              <div className="user-badge-info">

                <span className="user-name">
                  {user?.username}
                </span>

                <span
                  className={`role-pill role-${user?.role?.toLowerCase()}`}
                >
                  {user?.role}
                </span>

              </div>

              <button
                onClick={handleLogout}
                className="logout-btn"
                title="Logout"
              >
                <LogOut size={18} />

                <span>
                  Logout
                </span>
              </button>

            </div>
          ) : (
            <div className="auth-buttons">

              <Link
                to="/login"
                className="btn-secondary"
              >
                <User size={16} />

                <span>
                  Sign In
                </span>
              </Link>

              <Link
                to="/register"
                className="btn-primary"
              >
                Customer Signup
              </Link>

            </div>
          )}

        </div>
      </div>
    </nav>
  );
};