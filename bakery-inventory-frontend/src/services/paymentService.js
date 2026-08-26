import axiosInstance from '../api/axiosInstance';

/**
 * NEW FILE: PaymentService
 * Manages order payment retrieval and Razorpay verification.
 */

export const paymentService = {
  getPaymentByOrderId: async (orderId) => {
    const response = await axiosInstance.get(`/api/payments/order/${orderId}`);
    return response.data;
  },

  verifyAndConfirmPayment: async (paymentId, verificationData) => {
    // verificationData = { razorpayPaymentId, razorpaySignature }
    const response = await axiosInstance.post(`/api/payments/${paymentId}/verify`, verificationData);
    return response.data;
  },

  markAsFailed: async (paymentId) => {
    const response = await axiosInstance.post(`/api/payments/${paymentId}/fail`);
    return response.data;
  }
};
