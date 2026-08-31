import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { StockOperationsModal } from './StockOperationsModal';
import { BackOfficeHeaderBadge } from '../../components/common/BackOfficeHeaderBadge';
import {
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Sliders,
  RefreshCw,
  History,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Search,
  Filter,
  X,
} from 'lucide-react';

/**
 * InventoryDashboard Component (Back-Office)
 * Issue #11: Comprehensive Back-Office Inventory Manager Dashboard.
 *
 * Provides:
 * - Clear distinction between Total Stock (quantity) and Available Stock (quantity - reserved_quantity).
 * - Global KPI cards: Total Tracked Products, Low Stock Alerts, Out of Stock, Optimal Stock.
 * - Dynamic Status Tab counts calculated from search/category-filtered subset.
 * - Parallel product and category enrichment (real product names, real category names, prices, images).
 * - Direct Quick Operations Hub with searchable suggestive autocomplete product picker.
 * - Dynamic Category filter and multi-filter toolbar with immediate row updates.
 * - Unified 5-button action toolbar per row (+ Stock In, Adjust, Damage, Return, Min. Level).
 */
export const InventoryDashboard = () => {
  const [rawInventory, setRawInventory] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [categoriesMap, setCategoriesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filters
  const [filterMode, setFilterMode] = useState('ALL'); // ALL | LOW | OUT | OPTIMAL
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [operationType, setOperationType] = useState(null);

  // Parallel fetch: Inventory data + Product catalog + Category catalog
  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [inventoryData, productsData, categoriesData] = await Promise.all([
        inventoryService.getAllInventory(),
        productService.getAllProducts().catch((err) => {
          console.warn('Failed to fetch product catalog details for enrichment:', err);
          return [];
        }),
        categoryService.getAllCategories().catch((err) => {
          console.warn('Failed to fetch category catalog details for enrichment:', err);
          return [];
        }),
      ]);

      // Category Map: categoryId -> categoryName
      const catMap = {};
      if (Array.isArray(categoriesData)) {
        categoriesData.forEach((cat) => {
          if (cat && cat.id) {
            catMap[cat.id] = cat.name;
          }
        });
      }
      setCategoriesMap(catMap);

      // Product Map: productId -> product object
      const prodMap = {};
      if (Array.isArray(productsData)) {
        productsData.forEach((prod) => {
          if (prod && prod.id) {
            prodMap[prod.id] = prod;
          }
        });
      }
      setProductsMap(prodMap);

      setRawInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load inventory dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Enriched inventory records with distinct Total Stock & Available Stock
  const enrichedInventory = useMemo(() => {
    return rawInventory.map((item) => {
      const prodId = item.productId || item.id;
      const productInfo = productsMap[prodId] || {};

      const categoryId = productInfo.categoryId || item.categoryId;
      const resolvedCategory =
        (categoryId && categoriesMap[categoryId]) ||
        productInfo.categoryName ||
        productInfo.category?.name ||
        item.categoryName ||
        'Bakery';

      const totalQty = item.quantity ?? 0;
      const reservedQty = item.reservedQuantity ?? 0;
      const availableQty =
        item.availableQuantity ?? Math.max(totalQty - reservedQty, 0);
      const minThreshold = item.minimumStock ?? 5;

      const isOut = availableQty <= 0;
      const isLow = !isOut && (item.lowStock ?? (availableQty <= minThreshold));
      const isOptimal = !isOut && !isLow;

      return {
        ...item,
        productId: prodId,
        productName: productInfo.name || item.productName || item.name || `Product #${prodId}`,
        categoryName: resolvedCategory,
        price: productInfo.price ?? item.price ?? 0,
        imageUrl: productInfo.imageUrl || productInfo.imagePath || item.imageUrl || null,
        totalQuantity: totalQty,
        reservedQuantity: reservedQty,
        availableQuantity: availableQty,
        minimumStock: minThreshold,
        isOutOfStock: isOut,
        isLowStock: isLow,
        isOptimalStock: isOptimal,
      };
    });
  }, [rawInventory, productsMap, categoriesMap]);

  // Extract unique category options dynamically from enriched inventory and categoriesMap
  const categoryOptions = useMemo(() => {
    const categories = new Set();
    Object.values(categoriesMap).forEach((name) => {
      if (name && typeof name === 'string' && name.trim()) {
        categories.add(name.trim());
      }
    });
    enrichedInventory.forEach((item) => {
      if (item.categoryName && typeof item.categoryName === 'string' && item.categoryName.trim()) {
        categories.add(item.categoryName.trim());
      }
    });
    return Array.from(categories).sort();
  }, [categoriesMap, enrichedInventory]);

  // GLOBAL KPI Metrics (Strictly calculated over the entire inventory dataset based on Available Stock)
  const totalProductsCount = enrichedInventory.length;
  const lowStockCount = enrichedInventory.filter((i) => i.isLowStock).length;
  const outOfStockCount = enrichedInventory.filter((i) => i.isOutOfStock).length;
  const optimalStockCount = enrichedInventory.filter((i) => i.isOptimalStock).length;
  const totalAvailableUnits = enrichedInventory.reduce(
    (sum, item) => sum + (item.availableQuantity || 0),
    0
  );
  const totalTrackedUnits = enrichedInventory.reduce(
    (sum, item) => sum + (item.totalQuantity || 0),
    0
  );

  // Contextual inventory filtered by non-status filters (Search query & Category)
  const contextuallyFilteredInventory = useMemo(() => {
    return enrichedInventory.filter((item) => {
      // Category Filter
      if (selectedCategory !== 'ALL' && item.categoryName !== selectedCategory) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const rawId = q.replace(/^#\s*/, '');
        const idMatch =
          String(item.productId || '') === rawId ||
          `#${item.productId}`.toLowerCase().includes(q) ||
          (rawId && String(item.productId || '').includes(rawId));
        const nameMatch = (item.productName || '').toLowerCase().includes(q);
        const catMatch = (item.categoryName || '').toLowerCase().includes(q);
        const supplierMatch = (item.supplierName || '').toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !supplierMatch && !idMatch) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedInventory, selectedCategory, searchQuery]);

  // Status Tab Counts (Dynamically calculated from the search/category-filtered subset)
  const tabAllCount = contextuallyFilteredInventory.length;
  const tabLowCount = contextuallyFilteredInventory.filter((i) => i.isLowStock).length;
  const tabOutCount = contextuallyFilteredInventory.filter((i) => i.isOutOfStock).length;
  const tabOptimalCount = contextuallyFilteredInventory.filter((i) => i.isOptimalStock).length;

  // Final filtered inventory list for the data table (applying status filter onto contextual dataset)
  const filteredInventory = useMemo(() => {
    return contextuallyFilteredInventory.filter((item) => {
      if (filterMode === 'LOW' && !item.isLowStock) return false;
      if (filterMode === 'OUT' && !item.isOutOfStock) return false;
      if (filterMode === 'OPTIMAL' && !item.isOptimalStock) return false;
      return true;
    });
  }, [contextuallyFilteredInventory, filterMode]);

  const hasActiveFilters = filterMode !== 'ALL' || selectedCategory !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setFilterMode('ALL');
    setSelectedCategory('ALL');
    setSearchQuery('');
  };

  // KPI card click handler: clears category filter and toggles status filter back to ALL (Total) if already selected
  const handleKpiCardClick = (targetMode) => {
    setSelectedCategory('ALL');
    if (targetMode === 'ALL') {
      setFilterMode('ALL');
    } else {
      setFilterMode((prev) => (prev === targetMode ? 'ALL' : targetMode));
    }
  };

  // Open modal from table row or global quick actions
  const openOperationModal = (item = null, type = 'PURCHASE') => {
    setActiveModalProduct(item);
    setOperationType(type);
  };

  return (
    <div className="inventory-dashboard page-container">
      {/* ===================================================
          1. BACK-OFFICE DASHBOARD HEADER
          =================================================== */}
      <div className="dashboard-header-container">
        <div className="dashboard-title-area">
          <BackOfficeHeaderBadge lastUpdated={lastUpdated} />
          <h1>Manage Bakery Inventory</h1>
          <p className="dashboard-subtitle">
            Live stock tracking, physical calibrations, threshold alerts, and inventory operations
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            onClick={() => fetchDashboardData(true)}
            className="btn-secondary refresh-btn"
            disabled={refreshing || loading}
            title="Refresh current inventory data"
          >
            <RefreshCw className={refreshing ? 'spinner' : ''} size={16} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link to="/inventory/history" className="btn-secondary nav-action-btn">
            <History size={16} /> Stock History
          </Link>

          <Link to="/inventory/suppliers" className="btn-secondary nav-action-btn">
            <Truck size={16} /> Suppliers
          </Link>
        </div>
      </div>

      {/* ===================================================
          2. CURRENT INVENTORY KPIS (GLOBAL SUMMARY METRICS)
          =================================================== */}
      <div className="metrics-grid">
        {/* Total Tracked Products */}
        <div
          className={`metric-card card ${filterMode === 'ALL' ? 'active-metric metric-card-all' : ''}`}
          onClick={() => handleKpiCardClick('ALL')}
          role="button"
          tabIndex={0}
          title="Click to view all products across all categories"
        >
          <div className="metric-icon-wrapper icon-blue">
            <Package size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{totalProductsCount}</div>
            <div className="metric-label">Total Tracked Products</div>
            <div className="metric-subtext">
              {totalTrackedUnits} total units ({totalAvailableUnits} available)
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          className={`metric-card card ${filterMode === 'LOW' ? 'active-metric metric-card-low' : ''}`}
          onClick={() => handleKpiCardClick('LOW')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-amber">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{lowStockCount}</div>
            <div className="metric-label">Low Stock Alerts</div>
            <div className="metric-subtext">
              {lowStockCount > 0 ? 'Requires attention soon' : 'All levels sufficient'}
            </div>
          </div>
        </div>

        {/* Out of Stock Items */}
        <div
          className={`metric-card card ${filterMode === 'OUT' ? 'active-metric metric-card-out' : ''}`}
          onClick={() => handleKpiCardClick('OUT')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-red">
            <XCircle size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{outOfStockCount}</div>
            <div className="metric-label">Out of Stock Items</div>
            <div className="metric-subtext">
              {outOfStockCount > 0 ? 'Immediate restock required' : 'No stockouts recorded'}
            </div>
          </div>
        </div>

        {/* Optimal Stock */}
        <div
          className={`metric-card card ${filterMode === 'OPTIMAL' ? 'active-metric metric-card-optimal' : ''}`}
          onClick={() => handleKpiCardClick('OPTIMAL')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-green">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{optimalStockCount}</div>
            <div className="metric-label">Optimal Stock</div>
            <div className="metric-subtext">Healthy stock levels</div>
          </div>
        </div>
      </div>

      {/* ===================================================
          3. QUICK INVENTORY OPERATIONS HUB
          =================================================== */}
      <div className="quick-actions-panel card">
        <div className="quick-actions-header">
          <div className="quick-actions-title">
            <Sliders size={18} className="text-primary" />
            <h3>Quick Inventory Operations</h3>
          </div>
          <span className="quick-actions-help">
            Execute common stock transactions directly with search autocomplete
          </span>
        </div>

        <div className="quick-actions-grid">
          <button
            onClick={() => openOperationModal(null, 'PURCHASE')}
            className="quick-action-tile tile-purchase"
          >
            <div className="tile-icon-box box-green">
              <ArrowUpRight size={18} />
            </div>
            <div className="tile-text">
              <span className="tile-title">Stock In</span>
              <span className="tile-desc">Record supplier purchase</span>
            </div>
          </button>

          <button
            onClick={() => openOperationModal(null, 'ADJUST')}
            className="quick-action-tile tile-adjust"
          >
            <div className="tile-icon-box box-blue">
              <Sliders size={18} />
            </div>
            <div className="tile-text">
              <span className="tile-title">Stock Adjustment</span>
              <span className="tile-desc">Calibrate physical Total Stock</span>
            </div>
          </button>

          <button
            onClick={() => openOperationModal(null, 'DAMAGE')}
            className="quick-action-tile tile-damage"
          >
            <div className="tile-icon-box box-red">
              <ArrowDownRight size={18} />
            </div>
            <div className="tile-text">
              <span className="tile-title">Stock Out (Damage)</span>
              <span className="tile-desc">Record expired / spoiled items</span>
            </div>
          </button>

          <button
            onClick={() => openOperationModal(null, 'RETURN')}
            className="quick-action-tile tile-return"
          >
            <div className="tile-icon-box box-amber">
              <ArrowDownRight size={18} />
            </div>
            <div className="tile-text">
              <span className="tile-title">Stock Out (Return)</span>
              <span className="tile-desc">Return items to supplier</span>
            </div>
          </button>

          <button
            onClick={() => openOperationModal(null, 'MINIMUM')}
            className="quick-action-tile tile-threshold"
          >
            <div className="tile-icon-box box-purple">
              <ShieldAlert size={18} />
            </div>
            <div className="tile-text">
              <span className="tile-title">Min. Threshold</span>
              <span className="tile-desc">Set low stock warning level</span>
            </div>
          </button>
        </div>
      </div>

      {/* ===================================================
          4. SEARCH & FILTER TOOLBAR
          =================================================== */}
      {/* ===================================================
          4. SEARCH TOOLBAR
          =================================================== */}
      <div className="inventory-toolbar card">
        <div className="toolbar-search-wrapper" style={{ width: '100%' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by product name, category, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
            aria-label="Search inventory"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ===================================================
          5. INVENTORY DATA TABLE & RESULTS
          =================================================== */}
      {loading ? (
        <div className="loading-state card">
          <RefreshCw className="spinner" size={36} />
          <p>Loading current inventory data...</p>
        </div>
      ) : totalProductsCount === 0 ? (
        // CHANGE: Standardized empty dataset state when inventory is empty
        <div className="empty-state card">
          <Package size={48} className="text-muted" />
          <h3>No Inventory Items Found</h3>
          <p>There are currently no products registered in the inventory database.</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        // CHANGE: Standardized filtered empty state with clear filters CTA
        <div className="empty-state card">
          <Package size={48} className="text-muted" />
          <h3>No Matching Inventory Items Found</h3>
          <p>No products matched your current search or stock status filter criteria.</p>
          <button onClick={handleResetFilters} className="btn-secondary mt-3">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="table-responsive card inventory-table-card">
          <div className="table-header-strip">
            <span className="table-count-label">
              Showing <strong>{filteredInventory.length}</strong> of{' '}
              <strong>{totalProductsCount}</strong> tracked products
            </span>
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock Status</th>
                <th>Total Stock</th>
                <th>Available Stock</th>
                <th>Min. Alert Threshold</th>
                <th className="actions-column-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const totalStock = item.totalQuantity;
                const reservedStock = item.reservedQuantity;
                const availableStock = item.availableQuantity;
                const minThreshold = item.minimumStock;
                const isOut = item.isOutOfStock;
                const isLow = item.isLowStock;

                // Relative stock ratio for meter (based on Available Stock vs Min Threshold)
                const stockRatio =
                  minThreshold > 0
                    ? Math.min((availableStock / minThreshold) * 100, 100)
                    : availableStock > 0
                    ? 100
                    : 0;

                return (
                  <tr
                    key={item.id || item.productId}
                    className={`inventory-row ${
                      isOut ? 'row-out-of-stock' : isLow ? 'row-low-stock' : 'row-optimal'
                    }`}
                  >
                    {/* Product Name & ID */}
                    <td>
                      <div className="product-cell">
                        <span className="product-cell-name font-bold">
                          {item.productName}
                        </span>
                        <span className="product-cell-id">
                          ID: #{item.productId}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="category-pill">{item.categoryName}</span>
                    </td>

                    {/* Stock Status Badge (Based on Available Stock) */}
                    <td>
                      {isOut ? (
                        <span className="stock-badge-table badge-out">
                          <XCircle size={14} /> Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="stock-badge-table badge-low">
                          <AlertTriangle size={14} /> Low Stock
                        </span>
                      ) : (
                        <span className="stock-badge-table badge-optimal">
                          <CheckCircle2 size={14} /> Optimal
                        </span>
                      )}
                    </td>

                    {/* Total Stock (inventory.quantity) & Reserved details */}
                    <td>
                      <div className="total-stock-cell">
                        <span className="total-stock-number font-bold">
                          {totalStock} <span className="unit-label">units</span>
                        </span>
                        {reservedStock > 0 && (
                          <span
                            className="reserved-stock-tag"
                            title={`${reservedStock} units reserved for unfulfilled customer orders`}
                          >
                            ({reservedStock} reserved)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Available Stock (quantity - reserved_quantity) & Visual Meter */}
                    <td>
                      <div className="stock-unit-cell">
                        <span
                          className={`stock-unit-number font-bold ${
                            isOut ? 'text-danger' : isLow ? 'text-amber' : 'text-success'
                          }`}
                        >
                          {availableStock} <span className="unit-label">units</span>
                        </span>
                        <div className="stock-meter-bar">
                          <div
                            className={`stock-meter-fill ${
                              isOut ? 'fill-danger' : isLow ? 'fill-amber' : 'fill-success'
                            }`}
                            style={{ width: `${Math.max(stockRatio, 4)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Min Alert Threshold */}
                    <td>
                      <div className="threshold-cell">
                        <span className="threshold-value">{minThreshold} units</span>
                      </div>
                    </td>

                    {/* Action Buttons Group with 5 visually consistent buttons */}
                    <td className="actions-cell">
                      <div className="action-buttons-group">
                        <button
                          onClick={() => openOperationModal(item, 'PURCHASE')}
                          className="btn-sm btn-success"
                          title="Stock In / Purchase"
                        >
                          + Stock In
                        </button>
                        <button
                          onClick={() => openOperationModal(item, 'ADJUST')}
                          className="btn-sm btn-secondary"
                          title="Calibrate Total Stock (Physical Audit)"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => openOperationModal(item, 'DAMAGE')}
                          className="btn-sm btn-danger"
                          title="Record Damaged Stock"
                        >
                          Damage
                        </button>
                        <button
                          onClick={() => openOperationModal(item, 'RETURN')}
                          className="btn-sm btn-warning"
                          title="Return Stock to Supplier"
                        >
                          Return
                        </button>
                        <button
                          onClick={() => openOperationModal(item, 'MINIMUM')}
                          className="btn-sm btn-outline"
                          title="Set Minimum Alert Threshold"
                        >
                          Min. Level
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================================================
          6. STOCK OPERATIONS MODAL
          =================================================== */}
      {operationType && (
        <StockOperationsModal
          product={activeModalProduct}
          inventoryList={enrichedInventory}
          operationType={operationType}
          onClose={() => {
            setActiveModalProduct(null);
            setOperationType(null);
          }}
          onSuccess={() => fetchDashboardData(false)}
        />
      )}
    </div>
  );
};
