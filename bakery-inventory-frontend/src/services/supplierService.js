import axiosInstance from '../api/axiosInstance';

/**
 * NEW FILE: SupplierService
 * Supplier directory and status management for inventory purchasing.
 */

export const supplierService = {
  getAllSuppliers: async () => {
    const response = await axiosInstance.get('/api/suppliers');
    return response.data;
  },

  getSupplierById: async (id) => {
    const response = await axiosInstance.get(`/api/suppliers/${id}`);
    return response.data;
  },

  createSupplier: async (supplierData) => {
    // CHANGE: Backend SupplierRequest expects { name, email, phone, address }
    const response = await axiosInstance.post('/api/suppliers', supplierData);
    return response.data;
  },

  updateSupplier: async (id, supplierData) => {
    const response = await axiosInstance.put(`/api/suppliers/${id}`, supplierData);
    return response.data;
  },

  activateSupplier: async (id) => {
    const response = await axiosInstance.patch(`/api/suppliers/${id}/activate`);
    return response.data;
  },

  deactivateSupplier: async (id) => {
    const response = await axiosInstance.patch(`/api/suppliers/${id}/deactivate`);
    return response.data;
  }
};
