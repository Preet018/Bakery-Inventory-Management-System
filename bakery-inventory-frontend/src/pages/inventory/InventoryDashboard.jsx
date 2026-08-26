import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { StockOperationsModal } from './StockOperationsModal';
import { Package, AlertTriangle, XCircle, Plus, Sliders, RefreshCw, History, Truck } from 'lucide-react';

/**
 * NEW FILE: InventoryDashboard Component
 * Inventory Manager Portal displaying metric counts (Total Stock, Low Stock, Out of Stock),
 * live stock table, and quick action modal triggers.
 */

export const InventoryDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('ALL'); // ALL | LOW | OUT
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [operationType, setOperationType] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      let data = [];
      if (filterMode === 'LOW') {
        data = await inventoryService.getLowStockProducts();
      } else if (filterMode === 'OUT') {
        data = await inventoryService.getOutOfStockProducts();
      } else {
        data = await inventoryService.getAllInventory();
      }
      setInventory(data || []);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filterMode]);

  const openOperationModal = (item, type) => {
    setActiveModalProduct(item);
    setOperationType(type);
  };

  const filteredInventory = inventory.filter((item) => {
    const name = item.productName || item.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalItemsCount = inventory.length;
  const lowStockCount = inventory.filter(i => (i.availableStock || i.quantity || 0) <= (i.minimumStockLevel || 5)).length;
  const outOfStockCount = inventory.filter(i => (i.availableStock || i.quantity || 0) <= 0).length;

  return (
    <div className="inventory-dashboard page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Inventory Management Portal</h1>
          <p>Monitor real-time stock, record purchases, and handle stock adjustments</p>
        </div>

        <div className="header-actions">
          <Link to="/inventory/history" className="btn-secondary">
            <History size={16} /> Stock Transaction Logs
          </Link>
          <Link to="/inventory/suppliers" className="btn-secondary">
            <Truck size={16} /> Manage Suppliers
          </Link>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="metrics-grid">
        <div
          className={`metric-card card ${filterMode === 'ALL' ? 'active-metric' : ''}`}
          onClick={() => setFilterMode('ALL')}
        >
          <div className="metric-icon-wrapper icon-blue">
            <Package size={24} />
          </div>
          <div>
            <div className="metric-value">{totalItemsCount}</div>
            <div className="metric-label">Total Tracked Products</div>
          </div>
        </div>

        <div
          className={`metric-card card ${filterMode === 'LOW' ? 'active-metric' : ''}`}
          onClick={() => setFilterMode('LOW')}
        >
          <div className="metric-icon-wrapper icon-amber">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="metric-value">{lowStockCount}</div>
            <div className="metric-label">Low Stock Alerts</div>
          </div>
        </div>

        <div
          className={`metric-card card ${filterMode === 'OUT' ? 'active-metric' : ''}`}
          onClick={() => setFilterMode('OUT')}
        >
          <div className="metric-icon-wrapper icon-red">
            <XCircle size={24} />
          </div>
          <div>
            <div className="metric-value">{outOfStockCount}</div>
            <div className="metric-label">Out of Stock Items</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="inventory-toolbar card">
        <input
          type="text"
          placeholder="Filter stock by product name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-field"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state">
          <RefreshCw className="spinner" size={32} />
          <p>Updating stock grid...</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="empty-state card">
          <h3>No inventory items found</h3>
          <p>Try changing your filter settings or search query.</p>
        </div>
      ) : (
        <div className="table-responsive card">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Available Stock</th>
                <th>Reserved Stock</th>
                <th>Min. Threshold</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const stock = item.availableStock ?? item.quantity ?? 0;
                const minThreshold = item.minimumStockLevel ?? 5;
                const isOut = stock <= 0;
                const isLow = stock <= minThreshold;

                return (
                  <tr key={item.id || item.productId}>
                    <td className="font-bold">{item.productName || item.name}</td>
                    <td>{item.categoryName || 'Bakery'}</td>
                    <td className="font-bold text-large">{stock}</td>
                    <td>{item.reservedQuantity || 0}</td>
                    <td>{minThreshold}</td>
                    <td>
                      {isOut ? (
                        <span className="stock-badge badge-out">Out of Stock</span>
                      ) : isLow ? (
                        <span className="stock-badge badge-low">Low Stock</span>
                      ) : (
                        <span className="stock-badge badge-in">Optimal</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="action-buttons-group">
                        <button
                          onClick={() => openOperationModal(item, 'PURCHASE')}
                          className="btn-sm btn-success"
                          title="Purchase Stock"
                        >
                          + Purchase
                        </button>
                        <button
                          onClick={() => openOperationModal(item, 'ADJUST')}
                          className="btn-sm btn-secondary"
                          title="Adjust Stock"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => openOperationModal(item, 'DAMAGE')}
                          className="btn-sm btn-danger"
                          title="Record Damage"
                        >
                          Damage
                        </button>
                        <button
                          onClick={() => openOperationModal(item, 'MINIMUM')}
                          className="btn-sm btn-outline"
                          title="Update Minimum Level"
                        >
                          Min Level
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

      {/* Operation Modal */}
      {activeModalProduct && operationType && (
        <StockOperationsModal
          product={activeModalProduct}
          operationType={operationType}
          onClose={() => { setActiveModalProduct(null); setOperationType(null); }}
          onSuccess={fetchInventory}
        />
      )}
    </div>
  );
};
