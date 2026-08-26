import axiosInstance from '../api/axiosInstance';

/**
 * NEW FILE: AdminService
 * Handles registration and lifecycle of Inventory Managers by Admin.
 */

export const adminService = {
  registerInventoryManager: async (managerData) => {
    // managerData = { firstName, lastName, email, password, phoneNumber }
    const response = await axiosInstance.post('/api/admin/inventory-managers', managerData);
    return response.data;
  },

  deactivateInventoryManager: async (id) => {
    const response = await axiosInstance.patch(`/api/admin/inventory-managers/${id}/deactivate`);
    return response.data;
  },

  reactivateInventoryManager: async (id) => {
    const response = await axiosInstance.patch(`/api/admin/inventory-managers/${id}/reactivate`);
    return response.data;
  },

  deleteInventoryManager: async (id) => {
    const response = await axiosInstance.delete(`/api/admin/inventory-managers/${id}`);
    return response.data;
  }
};
