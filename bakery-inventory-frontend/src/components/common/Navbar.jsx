import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import artisanBakeryLogoImg from '../../assets/artisan-bakery.png';

import {
  ShoppingBag,
  Cake,
  LogOut,
  Package,
  Layers,
  Tag,
  User,
  Users,
  LayoutDashboard,
  ReceiptText,
  Menu,
  X,
} from 'lucide-react';

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const brandTarget = '/';

  const brandSubtitle = isAdmin
    ? 'Admin Back Office'
    : isInventoryManager
    ? 'Inventory Workspace'
    : 'Inventory & Store';

  const handleBrandClick = (e) => {
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      e.preventDefault();
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
            BRAND LOGO (Artisan Bakery Image Logo)
            =================================================== */}
        <Link
          to={brandTarget}
          onClick={handleBrandClick}
          className="navbar-brand"
        >
          <img
            src={artisanBakeryLogoImg}
            alt="Artisan Bakery"
            className="brand-logo-img"
          />

          <div className="brand-text">
            <span className="brand-title">
              ARTISAN BAKERY
            </span>
            <span className="brand-subtitle">
              {brandSubtitle}
            </span>
          </div>
        </Link>

        {/* Mobile menu toggle button */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Collapsible wrapper */}
        <div className={`navbar-collapsible ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>

          {/* ===================================================
              NAVIGATION LINKS (Segmented Pill Track with Icon On Top)
              =================================================== */}
          <div className="navbar-links">

            {/* 1. GUEST STOREFRONT NAVIGATION */}
            {!isAuthenticated && (
              <Link
                to="/cart"
                className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <ShoppingBag size={17} className="nav-icon" />
                <span className="nav-label">Cart</span>
                {totalItemsCount > 0 && (
                  <span className="nav-cart-badge">
                    {totalItemsCount}
                  </span>
                )}
              </Link>
            )}

            {/* 2. CUSTOMER STOREFRONT NAVIGATION */}
            {isCustomer && (
              <>
                <Link
                  to="/cart"
                  className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <ShoppingBag size={17} className="nav-icon" />
                  <span className="nav-label">Cart</span>
                  {totalItemsCount > 0 && (
                    <span className="nav-cart-badge">
                      {totalItemsCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/customer/orders"
                  className={`nav-link ${location.pathname.startsWith('/customer/orders') || location.pathname === '/orders' ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Package size={17} className="nav-icon" />
                  <span className="nav-label">My Orders</span>
                </Link>

                <Link
                  to="/account"
                  className={`nav-link ${location.pathname.startsWith('/account') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <User size={17} className="nav-icon" />
                  <span className="nav-label">My Account</span>
                </Link>
              </>
            )}

            {/* 3. INVENTORY MANAGER BACK-OFFICE NAVIGATION */}
            {isInventoryManager && (
              <>
                <Link
                  to="/inventory/dashboard"
                  className={`nav-link ${location.pathname === '/inventory/dashboard' || location.pathname === '/inventory' || location.pathname === '/inventory-manager' ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <LayoutDashboard size={17} className="nav-icon" />
                  <span className="nav-label">Dashboard</span>
                </Link>

                <Link
                  to="/inventory/orders"
                  className={`nav-link ${location.pathname === '/inventory/orders' || location.pathname.startsWith('/inventory/orders/') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <ReceiptText size={17} className="nav-icon" />
                  <span className="nav-label">Orders</span>
                </Link>

                <Link
                  to="/inventory/manage"
                  className={`nav-link ${location.pathname === '/inventory/manage' || location.pathname === '/inventory/items' || location.pathname === '/inventory/history' || location.pathname === '/inventory/suppliers' || location.pathname.startsWith('/inventory/manage/') || location.pathname.startsWith('/inventory/history/') || location.pathname.startsWith('/inventory/suppliers/') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Package size={17} className="nav-icon" />
                  <span className="nav-label">Inventory</span>
                </Link>

                <Link
                  to="/account"
                  className={`nav-link ${location.pathname.startsWith('/account') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <User size={17} className="nav-icon" />
                  <span className="nav-label">My Account</span>
                </Link>
              </>
            )}

            {/* 4. ADMIN BACK-OFFICE NAVIGATION */}
            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`nav-link ${location.pathname === '/admin' || location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <LayoutDashboard size={17} className="nav-icon" />
                  <span className="nav-label">Dashboard</span>
                </Link>

                <Link
                  to="/admin/users"
                  className={`nav-link ${location.pathname.startsWith('/admin/users') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Users size={17} className="nav-icon" />
                  <span className="nav-label">Staff</span>
                </Link>

                <Link
                  to="/admin/products"
                  className={`nav-link ${location.pathname.startsWith('/admin/products') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Cake size={17} className="nav-icon" />
                  <span className="nav-label">Products</span>
                </Link>

                <Link
                  to="/admin/orders"
                  className={`nav-link ${location.pathname.startsWith('/admin/orders') || location.pathname.startsWith('/inventory/orders') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <ReceiptText size={17} className="nav-icon" />
                  <span className="nav-label">Orders</span>
                </Link>

                <Link
                  to="/admin/categories"
                  className={`nav-link ${location.pathname.startsWith('/admin/categories') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Tag size={17} className="nav-icon" />
                  <span className="nav-label">Categories</span>
                </Link>

                <Link
                  to="/inventory/manage"
                  className={`nav-link ${location.pathname === '/inventory/manage' || location.pathname === '/inventory/items' || location.pathname === '/inventory/history' || location.pathname === '/inventory/suppliers' || location.pathname.startsWith('/inventory/manage/') || location.pathname.startsWith('/inventory/history/') || location.pathname.startsWith('/inventory/suppliers/') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Package size={17} className="nav-icon" />
                  <span className="nav-label">Inventory</span>
                </Link>

                <Link
                  to="/account"
                  className={`nav-link ${location.pathname.startsWith('/account') ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <User size={17} className="nav-icon" />
                  <span className="nav-label">My Account</span>
                </Link>
              </>
            )}
          </div>

          {/* ===================================================
              RIGHT ACTIONS (Profile Capsule matching reference design)
              =================================================== */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <div className="user-profile-menu">
                <div className="user-badge-info">
                  <span className="user-name">
                    {user?.name || user?.username}
                  </span>
                  <span
                    className={`role-pill role-${user?.role?.toLowerCase()}`}
                  >
                    {user?.role?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="navbar-divider" />

                <button
                  onClick={handleLogout}
                  className="logout-btn"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
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
                  <span>Sign In</span>
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
        </div>
      </div>
    </nav>
  );
};