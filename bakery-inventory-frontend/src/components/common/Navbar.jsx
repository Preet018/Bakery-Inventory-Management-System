import React, { useState } from 'react'; // CHANGE: added useState for mobile menu toggle
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
  User,
  Users,
  LayoutDashboard,
  Menu,  // CHANGE: hamburger icon for mobile menu
  X,     // CHANGE: close icon for mobile menu
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

  // CHANGE: Mobile menu open/close state for responsive navbar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false); // CHANGE: close mobile menu on logout
    navigate('/');
  };

  // CHANGE: Close mobile menu when navigating to a new page
  const handleNavClick = () => {
    setMobileMenuOpen(false);
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
    setMobileMenuOpen(false); // CHANGE: close mobile menu on brand click
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

        {/* CHANGE: Mobile hamburger toggle button — visible only on mobile via CSS */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* CHANGE: Collapsible wrapper for links + actions on mobile */}
        <div className={`navbar-collapsible ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>

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
                  className={`nav-link ${location.pathname.startsWith('/customer/orders') || location.pathname === '/orders' ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Package size={16} />
                  <span>My Orders</span>
                </Link>

                <Link
                  to="/account"
                  className={`nav-link ${location.pathname.startsWith('/account') ? 'active' : ''}`}
                  onClick={handleNavClick}
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
                  to="/inventory/dashboard"
                  className={`nav-link ${location.pathname === '/inventory/dashboard' || location.pathname === '/inventory' || location.pathname === '/inventory-manager' ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/inventory/orders"
                  className={`nav-link ${location.pathname === '/inventory/orders' || location.pathname === '/admin/orders' || location.pathname.startsWith('/inventory/orders/') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <ShoppingBag size={16} />
                  <span>Manage Orders</span>
                </Link>

                <Link
                  to="/inventory/manage"
                  className={`nav-link ${location.pathname === '/inventory/manage' || location.pathname === '/inventory/items' || location.pathname === '/inventory/history' || location.pathname === '/inventory/suppliers' || location.pathname.startsWith('/inventory/manage/') || location.pathname.startsWith('/inventory/history/') || location.pathname.startsWith('/inventory/suppliers/') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Package size={16} />
                  <span>Manage Inventory</span>
                </Link>

                <Link
                  to="/account"
                  className={`nav-link ${location.pathname.startsWith('/account') ? 'active' : ''}`}
                  onClick={handleNavClick}
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
                  to="/admin"
                  className={`nav-link ${location.pathname === '/admin' || location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/admin/users"
                  className={`nav-link ${location.pathname.startsWith('/admin/users') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Users size={16} />
                  <span>Manage Staff</span>
                </Link>

                <Link
                  to="/admin/orders"
                  className={`nav-link ${location.pathname.startsWith('/admin/orders') || location.pathname.startsWith('/inventory/orders') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <ShoppingBag size={16} />
                  <span>Manage Orders</span>
                </Link>

                <Link
                  to="/admin/categories"
                  className={`nav-link ${location.pathname.startsWith('/admin/categories') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Layers size={16} />
                  <span>Categories</span>
                </Link>

                <Link
                  to="/inventory/manage"
                  className={`nav-link ${location.pathname === '/inventory/manage' || location.pathname === '/inventory/items' || location.pathname === '/inventory/history' || location.pathname === '/inventory/suppliers' || location.pathname.startsWith('/inventory/manage/') || location.pathname.startsWith('/inventory/history/') || location.pathname.startsWith('/inventory/suppliers/') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Package size={16} />
                  <span>Manage Inventory</span>
                </Link>

                {/* Universal My Account link for Admin */}
                <Link
                  to="/account"
                  className={`nav-link ${location.pathname.startsWith('/account') ? 'active' : ''}`}
                  onClick={handleNavClick}
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
                onClick={handleNavClick}
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
                  onClick={handleNavClick}
                >
                  <User size={16} />

                  <span>
                    Sign In
                  </span>
                </Link>

                <Link
                  to="/register"
                  className="btn-primary"
                  onClick={handleNavClick}
                >
                  Customer Signup
                </Link>

              </div>
            )}

          </div>
        </div>{/* CHANGE: end navbar-collapsible */}
      </div>
    </nav>
  );
};