import axiosInstance from '../api/axiosInstance';

/**
 * NEW FILE: OrderService
 * Encapsulates order placement, status tracking, cancellations, and order management.
 */

export const orderService = {
  // Create order (CUSTOMER)
  createOrder: async (orderData) => {
    // CHANGE: Backend CustomerOrderCreateRequest expects { contact, savedAddressId, paymentMethod, items: [{ productId, quantity }] }
    const response = await axiosInstance.post('/api/orders', orderData);
    return response.data; // CustomerOrderResponse
  },

  // Get all orders (ADMIN)
  getAllOrders: async () => {
    const response = await axiosInstance.get('/api/orders');
    return response.data;
  },

  // Get specific order details (CUSTOMER / ADMIN)
  getOrderById: async (id) => {
    const response = await axiosInstance.get(`/api/orders/${id}`);
    return response.data;
  },

  // Get orders by User ID (CUSTOMER / ADMIN)
  getOrdersByUserId: async (userId) => {
    if (!userId) {
      console.warn('getOrdersByUserId called without a valid userId');
      return [];
    }
    const response = await axiosInstance.get(`/api/orders/user/${userId}`);
    return response.data;
  },

  // Update order status (ADMIN)
  updateOrderStatus: async (id, status) => {
    // CHANGE: Backend OrderStatus enum: PLACED | CONFIRMED | PROCESSING | READY | DELIVERED | CANCELLED
    const response = await axiosInstance.patch(`/api/orders/${id}/status`, { status });
    return response.data;
  },

  // Cancel order (CUSTOMER / ADMIN)
  cancelOrder: async (id) => {
    const response = await axiosInstance.post(`/api/orders/${id}/cancel`);
    return response.data;
  }
};
