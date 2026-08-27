import React, { useState } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { X } from 'lucide-react';

/**
 * StockOperationsModal
 * Refactored to match backend DTO contracts (StockPurchaseRequest, StockAdjustmentRequest, StockDamageRequest, SupplierReturnRequest, MinimumStockUpdateRequest)
 * and database schema (quantity/targetQuantity and reason).
 */

export const StockOperationsModal = ({ product, operationType, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [minimumStock, setMinimumStock] = useState(product?.minimumStock ?? product?.minimumStockLevel ?? 5);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const targetId = product.productId || product.id;
      const trimmedReason = reason.trim() || undefined;

      if (operationType === 'PURCHASE') {
        // CHANGE: Backend StockPurchaseRequest expects { quantity, reason }
        await inventoryService.purchaseStock(targetId, {
          quantity: Number(quantity),
          reason: trimmedReason,
        });
      } else if (operationType === 'ADJUST') {
        // CHANGE: Backend StockAdjustmentRequest expects { targetQuantity, reason }
        await inventoryService.adjustStock(targetId, {
          targetQuantity: Number(quantity),
          reason: trimmedReason,
        });
      } else if (operationType === 'DAMAGE') {
        // CHANGE: Backend StockDamageRequest expects { quantity, reason }
        await inventoryService.recordDamage(targetId, {
          quantity: Number(quantity),
          reason: trimmedReason,
        });
      } else if (operationType === 'RETURN') {
        // CHANGE: Backend SupplierReturnRequest expects { quantity, reason }
        await inventoryService.returnStock(targetId, {
          quantity: Number(quantity),
          reason: trimmedReason,
        });
      } else if (operationType === 'MINIMUM') {
        // CHANGE: Backend MinimumStockUpdateRequest expects { minimumStock }
        await inventoryService.updateMinimumStock(targetId, Number(minimumStock));
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

  const getReasonPlaceholder = () => {
    switch (operationType) {
      case 'PURCHASE': return 'e.g. Initial chocolate cake stock, Morning bakery delivery';
      case 'ADJUST': return 'e.g. Physical stock count correction, Quantity mismatch';
      case 'DAMAGE': return 'e.g. Damaged during storage, Expired shelf life';
      case 'RETURN': return 'e.g. Returned excess stock to supplier';
      default: return 'Reason for stock operation...';
    }
  };

  const productName = product?.productName || product?.name || (product?.productId ? `Product #${product.productId}` : '');

  return (
    <div className="modal-overlay">
      <div className="modal-container card">
        <div className="modal-header">
          <h3>{getModalTitle()}{productName ? ` - ${productName}` : ''}</h3>
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
                min={0}
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>
                  {operationType === 'ADJUST'
                    ? 'Target Stock Quantity (Count after adjustment)'
                    : operationType === 'DAMAGE'
                    ? 'Damaged Quantity'
                    : operationType === 'RETURN'
                    ? 'Return Quantity'
                    : 'Quantity'}
                </label>
                <input
                  type="number"
                  required
                  min={operationType === 'ADJUST' ? 0 : 1}
                  placeholder={operationType === 'ADJUST' ? 'e.g. 50' : 'e.g. 10'}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              {/* CHANGE: Backend DTOs (StockPurchaseRequest, StockAdjustmentRequest, StockDamageRequest, SupplierReturnRequest) accept optional reason */}
              <div className="form-group">
                <label>Reason (Optional)</label>
                <input
                  type="text"
                  maxLength={255}
                  placeholder={getReasonPlaceholder()}
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
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Processing...' : 'Submit Operation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
