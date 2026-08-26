import axiosInstance from '../api/axiosInstance';

/**
 * NEW FILE: StockTransactionService
 * Fetch audit logs of all inventory transactions.
 */

export const stockTransactionService = {
  getAllTransactions: async () => {
    const response = await axiosInstance.get('/api/stock-transactions');
    return response.data;
  },

  getTransactionsByProductId: async (productId) => {
    const response = await axiosInstance.get(`/api/stock-transactions/product/${productId}`);
    return response.data;
  },

  getTransactionsByCategoryId: async (categoryId) => {
    const response = await axiosInstance.get(`/api/stock-transactions/category/${categoryId}`);
    return response.data;
  },

  getTransactionsByOrderId: async (orderId) => {
    const response = await axiosInstance.get(`/api/stock-transactions/order/${orderId}`);
    return response.data;
  }
};
