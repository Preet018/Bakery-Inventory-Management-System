import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { supplierService } from '../../services/supplierService';
import { X, PackagePlus, Sliders, AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';

/**
 * NEW FILE: StockOperationsModal
 * Interactive Modal handling Stock Purchase, Adjustment, Damage Record, Supplier Return, and Minimum Stock limit updates.
 */

export const StockOperationsModal = ({ product, operationType, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [quantity, setQuantity] = useState('');
  const [unitCostPrice, setUnitCostPrice] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [minimumStockLevel, setMinimumStockLevel] = useState(product?.minimumStockLevel || 5);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (operationType === 'PURCHASE' || operationType === 'RETURN') {
      supplierService.getAllSuppliers().then((data) => {
        setSuppliers(data || []);
        if (data && data.length > 0) setSupplierId(data[0].id);
      }).catch(console.error);
    }
  }, [operationType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (operationType === 'PURCHASE') {
        await inventoryService.purchaseStock(product.productId || product.id, {
          quantity: Number(quantity),
          unitCostPrice: Number(unitCostPrice),
          supplierId: Number(supplierId),
          batchNumber: batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
          remarks: remarks,
        });
      } else if (operationType === 'ADJUST') {
        await inventoryService.adjustStock(product.productId || product.id, {
          adjustmentQuantity: Number(quantity),
          reason: reason || 'Manual Audit Adjustment',
          remarks: remarks,
        });
      } else if (operationType === 'DAMAGE') {
        await inventoryService.recordDamage(product.productId || product.id, {
          quantity: Number(quantity),
          damageReason: reason || 'EXPIRED',
          remarks: remarks,
        });
      } else if (operationType === 'RETURN') {
        await inventoryService.returnStock(product.productId || product.id, {
          quantity: Number(quantity),
          supplierId: Number(supplierId),
          reason: reason || 'Defective quality',
          remarks: remarks,
        });
      } else if (operationType === 'MINIMUM') {
        await inventoryService.updateMinimumStock(product.productId || product.id, Number(minimumStockLevel));
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Stock operation error:', err);
      setError(err.response?.data?.message || err.response?.data || 'Failed to complete stock operation.');
    } finally {
      setSubmitting(false);
    }
  };

  const getModalTitle = () => {
    switch (operationType) {
      case 'PURCHASE': return 'Purchase Stock';
      case 'ADJUST': return 'Adjust Stock Count';
      case 'DAMAGE': return 'Record Damaged Stock';
      case 'RETURN': return 'Return Stock to Supplier';
      case 'MINIMUM': return 'Set Minimum Stock Alert Threshold';
      default: return 'Stock Operation';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container card">
        <div className="modal-header">
          <h3>{getModalTitle()} - {product?.productName || product?.name}</h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {operationType === 'MINIMUM' ? (
            <div className="form-group">
              <label>Minimum Stock Level Threshold</label>
              <input
                type="number"
                required
                min={1}
                value={minimumStockLevel}
                onChange={(e) => setMinimumStockLevel(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>
                  {operationType === 'ADJUST' ? 'Adjustment Quantity (+ or -)' : 'Quantity'}
                </label>
                <input
                  type="number"
                  required
                  placeholder={operationType === 'ADJUST' ? 'e.g. 10 or -5' : 'e.g. 50'}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              {operationType === 'PURCHASE' && (
                <>
                  <div className="form-group">
                    <label>Unit Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 45.00"
                      value={unitCostPrice}
                      onChange={(e) => setUnitCostPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Batch Number</label>
                    <input
                      type="text"
                      placeholder="e.g. BATCH-2026-08"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                    />
                  </div>
                </>
              )}

              {(operationType === 'PURCHASE' || operationType === 'RETURN') && (
                <div className="form-group">
                  <label>Supplier</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.contactPerson})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(operationType === 'ADJUST' || operationType === 'DAMAGE' || operationType === 'RETURN') && (
                <div className="form-group">
                  <label>Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broken packaging, expired shelf life"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional additional notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Processing...' : 'Submit Operation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
