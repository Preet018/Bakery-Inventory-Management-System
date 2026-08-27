import axiosInstance from '../api/axiosInstance';

/**
 * NEW FILE: InventoryService
 * Manages inventory status, stock purchase, adjustments, damages, and supplier returns.
 */

export const inventoryService = {
  // Get full inventory list
  getAllInventory: async () => {
    const response = await axiosInstance.get('/api/inventory');
    return response.data;
  },

  // Get inventory for specific product
  getInventoryByProductId: async (productId) => {
    const response = await axiosInstance.get(`/api/inventory/${productId}`);
    return response.data;
  },

  // Get low-stock inventory items
  getLowStockProducts: async () => {
    const response = await axiosInstance.get('/api/inventory/low-stock');
    return response.data;
  },

  // Get out-of-stock items
  getOutOfStockProducts: async () => {
    const response = await axiosInstance.get('/api/inventory/out-of-stock');
    return response.data;
  },

  // Purchase new stock from supplier
  purchaseStock: async (productId, purchaseData) => {
    // CHANGE: Backend StockPurchaseRequest expects: { quantity, reason }
    const response = await axiosInstance.post(`/api/inventory/${productId}/purchase`, purchaseData);
    return response.data;
  },

  // Return stock to supplier
  returnStock: async (productId, returnData) => {
    // CHANGE: Backend SupplierReturnRequest expects: { quantity, reason }
    const response = await axiosInstance.post(`/api/inventory/${productId}/return`, returnData);
    return response.data;
  },

  // Adjust stock count manually
  adjustStock: async (productId, adjustData) => {
    // CHANGE: Backend StockAdjustmentRequest expects: { targetQuantity, reason }
    const response = await axiosInstance.post(`/api/inventory/${productId}/adjust`, adjustData);
    return response.data;
  },

  // Record damaged / expired stock
  recordDamage: async (productId, damageData) => {
    // CHANGE: Backend StockDamageRequest expects: { quantity, reason }
    const response = await axiosInstance.post(`/api/inventory/${productId}/damage`, damageData);
    return response.data;
  },

  // Update minimum stock alert threshold
  updateMinimumStock: async (productId, minimumStock) => {
    // CHANGE: Backend MinimumStockUpdateRequest expects field { minimumStock }
    const response = await axiosInstance.patch(`/api/inventory/${productId}/minimum-stock`, { minimumStock });
    return response.data;
  }
};
