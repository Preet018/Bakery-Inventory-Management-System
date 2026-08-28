import React, { useEffect, useState, useMemo } from 'react';
import { stockTransactionService } from '../../services/stockTransactionService';
import { productService } from '../../services/productService';
import {
  History,
  RefreshCw,
  ArrowLeft,
  Search,
  Filter,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  ShoppingBag,
  RotateCcw,
  AlertOctagon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Human-readable mapping and icons for Stock Transaction Types
 */
const TRANSACTION_TYPE_META = {
  PURCHASE: {
    label: 'Purchase (Stock In)',
    badgeClass: 'badge-tx-purchase',
    icon: <ArrowUpRight size={13} />,
    defaultPositive: true,
  },
  SALE: {
    label: 'Customer Sale',
    badgeClass: 'badge-tx-sale',
    icon: <ShoppingBag size={13} />,
    defaultPositive: false,
  },
  DAMAGE: {
    label: 'Damage / Spoilage',
    badgeClass: 'badge-tx-damage',
    icon: <AlertOctagon size={13} />,
    defaultPositive: false,
  },
  SUPPLIER_RETURN: {
    label: 'Supplier Return',
    badgeClass: 'badge-tx-return',
    icon: <ArrowDownRight size={13} />,
    defaultPositive: false,
  },
  RETURN: {
    label: 'Supplier Return',
    badgeClass: 'badge-tx-return',
    icon: <ArrowDownRight size={13} />,
    defaultPositive: false,
  },
  ADJUSTMENT: {
    label: 'Stock Adjustment',
    badgeClass: 'badge-tx-adjustment',
    icon: <Sliders size={13} />,
    defaultPositive: null, // Direction determined by signed quantity
  },
  ADJUST: {
    label: 'Stock Adjustment',
    badgeClass: 'badge-tx-adjustment',
    icon: <Sliders size={13} />,
    defaultPositive: null,
  },
  CANCEL: {
    label: 'Order Cancellation',
    badgeClass: 'badge-tx-cancel',
    icon: <RotateCcw size={13} />,
    defaultPositive: true,
  },
};

/**
 * StockHistoryPage Component (Issue #13: Stock History Audit Trail)
 *
 * Provides:
 * - Full audit trail sorted with newest transactions first.
 * - Enriched product names and ID mapping.
 * - Single-sign signed quantity display (+ for additions/purchases, - for deductions/sales/damages/returns).
 * - Clear human-readable transaction type labels and distinct badges.
 * - Client-side search and filtering by Product and Transaction Type with Reset Filters.
 * - Back-office visual language consistent with Inventory Manager Dashboard.
 */
export const StockHistoryPage = () => {
  const [rawTransactions, setRawTransactions] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');

  const fetchTransactionsAndProducts = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [txData, prodData] = await Promise.all([
        stockTransactionService.getAllTransactions(),
        productService.getAllProducts().catch((err) => {
          console.warn('Failed to load product catalog for history enrichment:', err);
          return [];
        }),
      ]);

      const map = {};
      if (Array.isArray(prodData)) {
        prodData.forEach((p) => {
          if (p && p.id) {
            map[p.id] = p;
          }
        });
      }
      setProductsMap(map);

      // Sort newest transactions first (descending by createdAt, fallback to descending id)
      const sortedTransactions = Array.isArray(txData)
        ? [...txData].sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (timeB !== timeA) {
              return timeB - timeA;
            }
            return (b.id || 0) - (a.id || 0);
          })
        : [];

      setRawTransactions(sortedTransactions);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactionsAndProducts();
  }, []);

  // Enriched transactions with resolved product names and normalized quantities
  const enrichedTransactions = useMemo(() => {
    return rawTransactions.map((tx) => {
      const typeKey = (tx.type || 'TRANSACTION').toUpperCase();
      const meta = TRANSACTION_TYPE_META[typeKey] || {
        label: tx.type || 'Transaction',
        badgeClass: 'badge-tx-default',
        icon: <History size={13} />,
        defaultPositive: null,
      };

      const rawQty = Number(tx.quantity ?? 0);
      const absQty = Math.abs(rawQty);

      let isPositive = false;
      let quantityText = '0';

      if (typeKey === 'PURCHASE' || typeKey === 'CANCEL') {
        isPositive = true;
        quantityText = `+${absQty}`;
      } else if (typeKey === 'ADJUSTMENT' || typeKey === 'ADJUST') {
        if (rawQty > 0) {
          isPositive = true;
          quantityText = `+${rawQty}`;
        } else if (rawQty < 0) {
          isPositive = false;
          quantityText = `-${absQty}`;
        } else {
          isPositive = true;
          quantityText = '0';
        }
      } else {
        // Deductions: SALE, DAMAGE, SUPPLIER_RETURN, RETURN, ORDER
        isPositive = false;
        quantityText = `-${absQty}`;
      }

      const prodId = tx.productId || tx.inventoryId;
      const prod = productsMap[prodId];
      const productName =
        prod?.name || (tx.productName ? tx.productName : `Product #${prodId || tx.id}`);

      return {
        ...tx,
        resolvedTypeKey: typeKey,
        typeLabel: meta.label,
        badgeClass: meta.badgeClass,
        typeIcon: meta.icon,
        productId: prodId,
        productName,
        isPositiveQuantity: isPositive,
        formattedQuantity: quantityText,
      };
    });
  }, [rawTransactions, productsMap]);

  // Extract unique products for dropdown filter
  const productOptions = useMemo(() => {
    const map = new Map();
    enrichedTransactions.forEach((tx) => {
      if (tx.productId && tx.productName) {
        map.set(String(tx.productId), tx.productName);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [enrichedTransactions]);

  // Filtered transactions based on search query, type filter, and product filter
  const filteredTransactions = useMemo(() => {
    return enrichedTransactions.filter((tx) => {
      // Type Filter
      if (typeFilter !== 'ALL' && tx.resolvedTypeKey !== typeFilter) {
        return false;
      }

      // Product Filter
      if (productFilter !== 'ALL' && String(tx.productId) !== productFilter) {
        return false;
      }

      // Search Query Filter (Matches Product name, remarks/reason, or Tx ID)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const idMatch = String(tx.id || '').includes(query);
        const nameMatch = (tx.productName || '').toLowerCase().includes(query);
        const reasonMatch = (tx.reason || '').toLowerCase().includes(query);
        const typeMatch = (tx.typeLabel || '').toLowerCase().includes(query);
        if (!idMatch && !nameMatch && !reasonMatch && !typeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedTransactions, typeFilter, productFilter, searchQuery]);

  const hasActiveFilters =
    typeFilter !== 'ALL' || productFilter !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setProductFilter('ALL');
  };

  return (
    <div className="stock-history-page page-container">
      {/* Top Breadcrumb Link */}
      <Link to="/inventory/dashboard" className="back-link">
        <ArrowLeft size={18} /> Back to Inventory Dashboard
      </Link>

      {/* Page Header */}
      <div className="dashboard-header-container">
        <div className="dashboard-title-area">
          <div className="backoffice-badge-row">
            <span className="backoffice-badge">
              <History size={14} /> Audit Trail
            </span>
          </div>
          <h1>Stock Transaction Audit Logs</h1>
          <p className="dashboard-subtitle">
            Complete historical audit trail of inventory movement, purchases, sales, damages, and calibrations
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            onClick={() => fetchTransactionsAndProducts(true)}
            className="btn-secondary refresh-btn"
            disabled={refreshing || loading}
            title="Refresh transaction history"
          >
            <RefreshCw className={refreshing ? 'spinner' : ''} size={16} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="inventory-toolbar card">
        {/* Search Field */}
        <div className="toolbar-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by product, transaction ID (#1), or remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
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

        {/* Toolbar Controls */}
        <div className="toolbar-controls">
          {/* Transaction Type Filter */}
          <div className="category-select-wrapper">
            <Filter size={14} className="select-icon" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="category-dropdown"
              aria-label="Filter by Transaction Type"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="PURCHASE">Purchase (Stock In)</option>
              <option value="SALE">Customer Sale</option>
              <option value="DAMAGE">Damage / Spoilage</option>
              <option value="SUPPLIER_RETURN">Supplier Return</option>
              <option value="ADJUSTMENT">Stock Adjustment</option>
              <option value="CANCEL">Order Cancellation</option>
            </select>
          </div>

          {/* Product Filter */}
          {productOptions.length > 0 && (
            <div className="category-select-wrapper">
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="category-dropdown"
                aria-label="Filter by Product"
              >
                <option value="ALL">All Products</option>
                {productOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-reset-filters"
              title="Reset all filters"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Transaction Table & Statuses */}
      {loading ? (
        <div className="loading-state card">
          <RefreshCw className="spinner" size={36} />
          <p>Fetching stock transaction audit logs...</p>
        </div>
      ) : rawTransactions.length === 0 ? (
        <div className="empty-state card">
          <History size={48} className="text-muted" />
          <h3>No Transactions Recorded</h3>
          <p>Stock transactions will appear here as inventory is purchased, sold, or adjusted.</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="empty-state card">
          <History size={48} className="text-muted" />
          <h3>No matching transactions found</h3>
          <p>No transaction records match your current filter and search criteria.</p>
          <button onClick={handleResetFilters} className="btn-secondary mt-3">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="table-responsive card inventory-table-card">
          <div className="table-header-strip">
            <span className="table-count-label">
              Showing <strong>{filteredTransactions.length}</strong> of{' '}
              <strong>{enrichedTransactions.length}</strong> recorded transactions
            </span>
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Tx ID</th>
                <th style={{ minWidth: '170px' }}>Date & Time</th>
                <th style={{ minWidth: '220px' }}>Product</th>
                <th style={{ minWidth: '180px' }}>Transaction Type</th>
                <th style={{ minWidth: '120px' }}>Quantity</th>
                <th style={{ minWidth: '260px' }}>Remarks / Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                return (
                  <tr key={tx.id} className="inventory-row">
                    {/* Transaction ID */}
                    <td>
                      <span className="tx-id-badge">#{tx.id}</span>
                    </td>

                    {/* Date & Time */}
                    <td>
                      <span className="tx-date-cell">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </td>

                    {/* Product Name & ID */}
                    <td>
                      <div className="product-cell">
                        <span className="product-cell-name font-bold">
                          {tx.productName}
                        </span>
                        {tx.productId && (
                          <span className="product-cell-id">
                            ID: #{tx.productId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Human-readable Transaction Type Badge */}
                    <td>
                      <span className={`transaction-badge ${tx.badgeClass}`}>
                        {tx.typeIcon}
                        <span>{tx.typeLabel}</span>
                      </span>
                    </td>

                    {/* Signed Quantity with Green (+) / Red (-) Color */}
                    <td>
                      <span
                        className={`tx-quantity-cell font-bold ${
                          tx.isPositiveQuantity ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {tx.formattedQuantity}{' '}
                        <span className="unit-label">units</span>
                      </span>
                    </td>

                    {/* Remarks / Details */}
                    <td>
                      <span className="tx-remarks-text">
                        {tx.reason || <span className="text-muted">—</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
