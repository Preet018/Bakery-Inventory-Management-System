import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { GlobalModalScrollLock } from './components/common/GlobalModalScrollLock';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { LoginPage } from './pages/public/LoginPage';
import { CustomerLoginPage } from './pages/public/CustomerLoginPage';
import { ManagerLoginPage } from './pages/public/ManagerLoginPage';
import { AdminLoginPage } from './pages/public/AdminLoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { VerifyEmailPage } from './pages/public/VerifyEmailPage';

// Customer Pages
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderHistoryPage } from './pages/customer/OrderHistoryPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { AccountPage } from './pages/customer/AccountPage';

// Inventory Manager Pages
import { InventoryDashboard } from './pages/inventory/InventoryDashboard';
import { StockHistoryPage } from './pages/inventory/StockHistoryPage';
import { SupplierManagementPage } from './pages/inventory/SupplierManagementPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CategoryManagementPage } from './pages/admin/CategoryManagementPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { AdminOrderManagementPage } from './pages/admin/AdminOrderManagementPage';

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop helper
 * Ensures top scroll restoration on route changes unless an explicit hash target exists.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

/**
 * Main Application Router Configuration
 *
 * Separated into 3 clear role-based experience tiers:
 * 1. Customer Storefront (/, /products, /cart, /checkout, /customer/orders, /account)
 * 2. Inventory Manager Back-Office (/inventory, /inventory/dashboard, /inventory/history, /inventory/suppliers)
 * 3. Admin Back-Office (/admin, /admin/categories, /admin/users)
 */
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <GlobalModalScrollLock />
          <div className="app-layout">
            <Navbar />

            <main className="main-content">
              <Routes>

                {/* =====================================================
                    1. PUBLIC & STOREFRONT CATALOG ROUTES
                    ===================================================== */}

                <Route
                  path="/"
                  element={<HomePage />}
                />

                {/* CHANGE: Redirect obsolete /products catalog route to Home page bakery selection */}
                <Route
                  path="/products"
                  element={<Navigate to="/#bakery-selection" replace />}
                />

                <Route
                  path="/products/:id"
                  element={<ProductDetailPage />}
                />

                <Route
                  path="/cart"
                  element={<CartPage />}
                />

                {/* =====================================================
                    2. AUTHENTICATION PORTALS & REGISTRATION
                    ===================================================== */}

                <Route
                  path="/login"
                  element={<LoginPage />}
                />

                <Route
                  path="/login/customer"
                  element={<CustomerLoginPage />}
                />

                <Route
                  path="/login/manager"
                  element={<ManagerLoginPage />}
                />

                <Route
                  path="/login/admin"
                  element={<AdminLoginPage />}
                />

                <Route
                  path="/register"
                  element={<RegisterPage />}
                />

                <Route
                  path="/verify-email"
                  element={<VerifyEmailPage />}
                />

                {/* =====================================================
                    3. CUSTOMER PROTECTED STOREFRONT ROUTES (CUSTOMER)
                    ===================================================== */}

                {/* CHANGE: Protect customer account and checkout exclusively for CUSTOMER role */}
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute
                      allowedRoles={['CUSTOMER', 'INVENTORY_MANAGER', 'ADMIN']}
                    >
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute
                      allowedRoles={['CUSTOMER']}
                    >
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/customer/orders"
                  element={
                    <ProtectedRoute
                      allowedRoles={['CUSTOMER', 'ADMIN']}
                    >
                      <OrderHistoryPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/customer/orders/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={['CUSTOMER', 'ADMIN']}
                    >
                      <OrderDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* =====================================================
                    4. INVENTORY MANAGER BACK-OFFICE ROUTES (INVENTORY_MANAGER, ADMIN)
                    ===================================================== */}

                {/* CHANGE: Structured inventory back-office route boundaries */}
                <Route
                  path="/inventory"
                  element={<Navigate to="/inventory/dashboard" replace />}
                />

                <Route
                  path="/inventory-manager"
                  element={<Navigate to="/inventory/dashboard" replace />}
                />

                <Route
                  path="/inventory/dashboard"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        'INVENTORY_MANAGER',
                        'ADMIN',
                      ]}
                    >
                      <InventoryDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/inventory/history"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        'INVENTORY_MANAGER',
                        'ADMIN',
                      ]}
                    >
                      <StockHistoryPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/inventory/suppliers"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        'INVENTORY_MANAGER',
                        'ADMIN',
                      ]}
                    >
                      <SupplierManagementPage />
                    </ProtectedRoute>
                  }
                />

                {/* =====================================================
                    5. ADMIN BACK-OFFICE ROUTES (ADMIN ONLY)
                    ===================================================== */}

                {/* CHANGE: Dedicated Admin Dashboard route */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute
                      allowedRoles={['ADMIN']}
                    >
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/dashboard"
                  element={<Navigate to="/admin" replace />}
                />

                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute
                      allowedRoles={['ADMIN']}
                    >
                      <CategoryManagementPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute
                      allowedRoles={['ADMIN', 'INVENTORY_MANAGER']}
                    >
                      <AdminOrderManagementPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/inventory/orders"
                  element={<Navigate to="/admin/orders" replace />}
                />

                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute
                      allowedRoles={['ADMIN']}
                    >
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />

                {/* =====================================================
                    6. FALLBACK CATCH-ALL ROUTE
                    ===================================================== */}

                {/* CHANGE: Fallback route redirects unknown URLs safely */}
                <Route
                  path="*"
                  element={<Navigate to="/" replace />}
                />

              </Routes>
            </main>

            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;