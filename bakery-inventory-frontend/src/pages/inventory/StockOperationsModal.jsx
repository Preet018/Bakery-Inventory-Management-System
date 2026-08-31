import React, { useState, useEffect, useRef } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { getErrorMessage } from '../../utils/apiError';
import {
  X,
  Package,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  ShieldAlert,
  Search,
  Info,
} from 'lucide-react';

/**
 * StockOperationsModal Component
 * Handles all Back-Office inventory transactions:
 * 1. Stock In (Purchase)
 * 2. Stock Adjustment (Physical Count Calibrations based on Total Stock)
 * 3. Stock Out (Damage / Loss)
 * 4. Stock Out (Supplier Returns)
 * 5. Minimum Alert Threshold Updates
 *
 * Supports:
 * - Row-level actions: Product pre-selected.
 * - Global Quick Actions: Searchable autocomplete suggestive product picker.
 */
export const StockOperationsModal = ({
  product = null,
  inventoryList = [],
  operationType = 'PURCHASE',
  onClose,
  onSuccess,
}) => {
  // Pre-selected product or selected from autocomplete
  const [selectedProduct, setSelectedProduct] = useState(product);
  const [selectedProductId, setSelectedProductId] = useState(() => {
    if (product) return String(product.productId || product.id);
    return '';
  });

  // Autocomplete state
  const [productQuery, setProductQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [minimumStock, setMinimumStock] = useState(
    product?.minimumStock ?? 5
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected product and default minimum threshold when active product changes
  useEffect(() => {
    if (selectedProduct) {
      setMinimumStock(selectedProduct.minimumStock ?? 5);
      setSelectedProductId(String(selectedProduct.productId || selectedProduct.id));
    }
  }, [selectedProduct]);

  // Autocomplete suggestions based on product query
  const filteredSuggestions = React.useMemo(() => {
    if (!inventoryList || inventoryList.length === 0) return [];
    const query = productQuery.trim().toLowerCase();
    if (!query) {
      return inventoryList.slice(0, 8); // Show first 8 items when input is empty
    }
    return inventoryList
      .filter((item) => {
        const name = (item.productName || item.name || '').toLowerCase();
        const cat = (item.categoryName || '').toLowerCase();
        const id = String(item.productId || item.id || '');
        return name.includes(query) || cat.includes(query) || id.includes(query);
      })
      .slice(0, 10);
  }, [inventoryList, productQuery]);

  const handleSelectProduct = (item) => {
    setSelectedProduct(item);
    setSelectedProductId(String(item.productId || item.id));
    setProductQuery('');
    setIsDropdownOpen(false);
    setError(null);
    setQuantity('');
  };

  const handleClearSelectedProduct = () => {
    setSelectedProduct(null);
    setSelectedProductId('');
    setProductQuery('');
    setIsDropdownOpen(true);
    setQuantity('');
  };

  const currentTotalStock =
    selectedProduct?.totalQuantity ?? selectedProduct?.quantity ?? 0;
  const reservedStock = selectedProduct?.reservedQuantity ?? 0;
  const currentAvailableStock =
    selectedProduct?.availableQuantity ??
    Math.max(currentTotalStock - reservedStock, 0);
  const currentMinThreshold = selectedProduct?.minimumStock ?? 5;
  const productName =
    selectedProduct?.productName ||
    selectedProduct?.name ||
    `Product #${selectedProductId}`;

  // Adjustment Calculations
  const targetTotal = quantity !== '' ? Number(quantity) : null;
  const adjustmentDelta =
    targetTotal !== null && !isNaN(targetTotal)
      ? targetTotal - currentTotalStock
      : null;
  const resultingAvailable =
    targetTotal !== null && !isNaN(targetTotal)
      ? Math.max(targetTotal - reservedStock, 0)
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const targetId = Number(
      selectedProductId || selectedProduct?.productId || selectedProduct?.id
    );
    if (!targetId) {
      setError('Please search and select a product for this stock operation.');
      return;
    }

    const trimmedReason = reason.trim() || undefined;

    // Adjustment-specific validation
    if (operationType === 'ADJUST') {
      if (quantity === '' || isNaN(Number(quantity))) {
        setError('Please enter the target total stock count.');
        return;
      }
      const targetVal = Number(quantity);
      if (targetVal < reservedStock) {
        setError(
          `Target total stock (${targetVal}) cannot be less than reserved stock (${reservedStock} units).`
        );
        return;
      }
      if (targetVal === currentTotalStock) {
        setError(
          `Target total stock is already ${currentTotalStock} units. No adjustment needed.`
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      if (operationType === 'PURCHASE') {
        await inventoryService.purchaseStock(targetId, {
          quantity: Number(quantity),
          reason: trimmedReason,
        });
      } else if (operationType === 'ADJUST') {
        // Backend StockAdjustmentRequest expects { targetQuantity, reason }
        await inventoryService.adjustStock(targetId, {
          targetQuantity: Number(quantity),
          reason: trimmedReason,
        });
      } else if (operationType === 'DAMAGE') {
        await inventoryService.recordDamage(targetId, {
          quantity: Number(quantity),
          reason: trimmedReason,
        });
      } else if (operationType === 'RETURN') {
        await inventoryService.returnStock(targetId, {
          quantity: Number(quantity),
          reason: trimmedReason,
        });
      } else if (operationType === 'MINIMUM') {
        await inventoryService.updateMinimumStock(
          targetId,
          Number(minimumStock)
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Stock operation error:', err);
      setError(getErrorMessage(err, 'Failed to complete stock operation. Please check the values and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getModalConfig = () => {
    switch (operationType) {
      case 'PURCHASE':
        return {
          title: 'Stock In (Purchase)',
          subtitle: 'Record newly received stock batch from supplier order',
          icon: <ArrowUpRight className="text-success" size={20} />,
          submitText: 'Record Stock In',
          qtyLabel: 'Incoming Quantity (Units to Add)',
          qtyPlaceholder: 'e.g. 50',
          minQty: 1,
          reasonPlaceholder:
            'e.g. Morning bakery delivery, Bulk flour purchase, Batch restock',
        };
      case 'ADJUST':
        return {
          title: 'Stock Adjustment',
          subtitle:
            'Calibrate system Total Stock against physical shelf audit',
          icon: <Sliders className="text-primary" size={20} />,
          submitText: 'Apply Total Stock Adjustment',
          qtyLabel: 'Target Total Stock (after physical audit)',
          qtyPlaceholder: `Current total is ${currentTotalStock}`,
          minQty: reservedStock,
          reasonPlaceholder:
            'e.g. Physical inventory count correction, Discrepancy calibration',
        };
      case 'DAMAGE':
        return {
          title: 'Stock Out (Damage / Loss)',
          subtitle:
            'Deduct damaged, expired, or spoiled bakery items from inventory',
          icon: <ArrowDownRight className="text-danger" size={20} />,
          submitText: 'Record Damaged Stock',
          qtyLabel: 'Damaged Quantity (Units to Deduct)',
          qtyPlaceholder: 'e.g. 5',
          minQty: 1,
          reasonPlaceholder:
            'e.g. Expired shelf life, Oven burn, Handling damage during storage',
        };
      case 'RETURN':
        return {
          title: 'Stock Out (Supplier Return)',
          subtitle:
            'Deduct defective or excess units being returned to the supplier',
          icon: <ArrowDownRight className="text-amber" size={20} />,
          submitText: 'Process Supplier Return',
          qtyLabel: 'Return Quantity (Units to Return)',
          qtyPlaceholder: 'e.g. 10',
          minQty: 1,
          reasonPlaceholder:
            'e.g. Quality defect, Wrong shipment returned to vendor',
        };
      case 'MINIMUM':
        return {
          title: 'Set Minimum Stock Alert Threshold',
          subtitle:
            'Configure the threshold count that triggers Low Stock warnings',
          icon: <ShieldAlert className="text-amber" size={20} />,
          submitText: 'Save Threshold',
          qtyLabel: 'Minimum Alert Threshold (Units)',
          qtyPlaceholder: 'e.g. 10',
          minQty: 0,
          reasonPlaceholder: '',
        };
      default:
        return {
          title: 'Stock Operation',
          subtitle: 'Execute inventory operation',
          icon: <Package size={20} />,
          submitText: 'Submit Operation',
          qtyLabel: 'Quantity',
          qtyPlaceholder: 'e.g. 10',
          minQty: 1,
          reasonPlaceholder: 'Reason for stock operation...',
        };
    }
  };

  const config = getModalConfig();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container card backoffice-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-header-icon-title">
              {config.icon}
              <h3>{config.title}</h3>
            </div>
            <p className="modal-subtitle">{config.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Target Product Selection */}
          <div className="form-group">
            <label>Target Product *</label>

            {selectedProduct ? (
              <div className="selected-product-card">
                <div className="selected-product-info">
                  <Package size={18} className="text-primary" />
                  <div>
                    <span className="selected-product-name font-bold">
                      {productName}
                    </span>
                    <div className="selected-product-meta">
                      {selectedProduct.categoryName && (
                        <span className="category-pill">
                          {selectedProduct.categoryName}
                        </span>
                      )}
                      <span className="stock-hint">
                        Total: <strong>{currentTotalStock}</strong> | Available:{' '}
                        <strong>{currentAvailableStock}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                {!product && (
                  <button
                    type="button"
                    onClick={handleClearSelectedProduct}
                    className="btn-link-change"
                    title="Change product"
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div className="autocomplete-wrapper" ref={searchContainerRef}>
                <div className="autocomplete-input-box">
                  <Search size={16} className="autocomplete-search-icon" />
                  <input
                    type="text"
                    placeholder="Type to search product (e.g. 'Apple Tart', 'Sourdough')..."
                    value={productQuery}
                    onChange={(e) => {
                      setProductQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onClick={() => setIsDropdownOpen(true)}
                    className="autocomplete-input"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  {productQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductQuery('');
                        setIsDropdownOpen(false);
                      }}
                      className="clear-search-btn"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {isDropdownOpen && (
                  <div className="autocomplete-dropdown card">
                    {filteredSuggestions.length === 0 ? (
                      <div className="autocomplete-no-results">
                        <span>
                          No matching products found for "{productQuery}"
                        </span>
                      </div>
                    ) : (
                      <div className="autocomplete-list">
                        {filteredSuggestions.map((item) => {
                          const id = item.productId || item.id;
                          const name =
                            item.productName || item.name || `Product #${id}`;
                          const cat = item.categoryName || 'Bakery';
                          const tot = item.totalQuantity ?? item.quantity ?? 0;
                          const avail =
                            item.availableQuantity ??
                            Math.max(tot - (item.reservedQuantity ?? 0), 0);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => handleSelectProduct(item)}
                              className="autocomplete-item"
                            >
                              <div className="autocomplete-item-text">
                                <span className="item-name">{name}</span>
                                <span className="item-category">{cat}</span>
                              </div>
                              <span className="item-stock-tag">
                                Total: {tot} | Avail: {avail}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Product Current Context (Total Stock, Reserved Stock, Available Stock, Min Threshold) */}
          {selectedProduct && (
            <div className="stock-context-strip stock-context-4col">
              <div className="stock-context-item">
                <span className="context-label">Current Total Stock</span>
                <span className="context-value font-bold text-dark">
                  {currentTotalStock} units
                </span>
              </div>
              <div className="stock-context-item">
                <span className="context-label">Reserved (Orders)</span>
                <span className="context-value font-bold text-muted">
                  {reservedStock} units
                </span>
              </div>
              <div className="stock-context-item">
                <span className="context-label">Current Available</span>
                <span
                  className={`context-value font-bold ${
                    currentAvailableStock <= 0
                      ? 'text-danger'
                      : currentAvailableStock <= currentMinThreshold
                      ? 'text-amber'
                      : 'text-success'
                  }`}
                >
                  {currentAvailableStock} units
                </span>
              </div>
              <div className="stock-context-item">
                <span className="context-label">Min. Alert Level</span>
                <span className="context-value font-bold text-muted">
                  {currentMinThreshold} units
                </span>
              </div>
            </div>
          )}

          {/* Operation Inputs */}
          {operationType === 'MINIMUM' ? (
            <div className="form-group">
              <label htmlFor="minimum-threshold-input">
                {config.qtyLabel} *
              </label>
              <input
                id="minimum-threshold-input"
                type="number"
                required
                min={0}
                placeholder={config.qtyPlaceholder}
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
              />
              <span className="input-hint">
                When available stock falls at or below this level, a Low Stock
                alert will trigger.
              </span>
            </div>
          ) : operationType === 'ADJUST' ? (
            <>
              <div className="form-group">
                <label htmlFor="operation-quantity-input">
                  {config.qtyLabel} *
                </label>
                <input
                  id="operation-quantity-input"
                  type="number"
                  required
                  min={reservedStock}
                  placeholder={config.qtyPlaceholder}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  autoFocus={Boolean(selectedProduct)}
                />
                <span className="input-hint">
                  <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Target Total Stock represents the total physical count after audit. Adjustments update total inventory while existing reserved stock ({reservedStock} units) remains reserved.
                </span>
              </div>

              {/* Concise Single-Line Adjustment Total Stock Impact Preview */}
              {selectedProduct && targetTotal !== null && !isNaN(targetTotal) && (
                <div className="adjustment-impact-hint">
                  {adjustmentDelta > 0 ? (
                    <span className="text-success font-bold">
                      Total stock will increase by {adjustmentDelta} {adjustmentDelta === 1 ? 'unit' : 'units'}
                    </span>
                  ) : adjustmentDelta < 0 ? (
                    <span className="text-danger font-bold">
                      Total stock will decrease by {Math.abs(adjustmentDelta)} {Math.abs(adjustmentDelta) === 1 ? 'unit' : 'units'}
                    </span>
                  ) : (
                    <span className="text-muted font-bold">
                      Total stock will remain unchanged
                    </span>
                  )}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="operation-reason-input">
                  Adjustment Reason / Remarks (Optional)
                </label>
                <input
                  id="operation-reason-input"
                  type="text"
                  maxLength={255}
                  placeholder={config.reasonPlaceholder}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="operation-quantity-input">
                  {config.qtyLabel} *
                </label>
                <input
                  id="operation-quantity-input"
                  type="number"
                  required
                  min={config.minQty}
                  placeholder={config.qtyPlaceholder}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  autoFocus={Boolean(selectedProduct)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="operation-reason-input">
                  Remarks / Reason (Optional)
                </label>
                <input
                  id="operation-reason-input"
                  type="text"
                  maxLength={255}
                  placeholder={config.reasonPlaceholder}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedProduct}
              className="btn-primary"
            >
              {submitting ? 'Processing...' : config.submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
