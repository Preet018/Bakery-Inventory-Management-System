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
    // purchaseData = { quantity, unitCostPrice, supplierId, batchNumber, remarks }
    const response = await axiosInstance.post(`/api/inventory/${productId}/purchase`, purchaseData);
    return response.data;
  },

  // Return stock to supplier
  returnStock: async (productId, returnData) => {
    // returnData = { quantity, supplierId, reason, remarks }
    const response = await axiosInstance.post(`/api/inventory/${productId}/return`, returnData);
    return response.data;
  },

  // Adjust stock count manually
  adjustStock: async (productId, adjustData) => {
    // adjustData = { adjustmentQuantity, reason, remarks }
    const response = await axiosInstance.post(`/api/inventory/${productId}/adjust`, adjustData);
    return response.data;
  },

  // Record damaged / expired stock
  recordDamage: async (productId, damageData) => {
    // damageData = { quantity, damageReason, remarks }
    const response = await axiosInstance.post(`/api/inventory/${productId}/damage`, damageData);
    return response.data;
  },

  // Update minimum stock alert threshold
  updateMinimumStock: async (productId, minimumStockLevel) => {
    const response = await axiosInstance.patch(`/api/inventory/${productId}/minimum-stock`, { minimumStockLevel });
    return response.data;
  }
};
