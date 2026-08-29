import axiosInstance from '../api/axiosInstance';

/**
 * AdminService
 * Handles registration and lifecycle of Inventory Managers by Admin via Spring Boot REST API.
 */

export const adminService = {
  getInventoryManagers: async () => {
    const response = await axiosInstance.get('/api/admin/inventory-managers');
    return response.data;
  },

  registerInventoryManager: async (managerData) => {
    // managerData = { username, email, password }
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

  requestDeletionOtp: async (managerId, adminEmail) => {
    const response = await axiosInstance.post(`/api/admin/inventory-managers/${managerId}/deletion-otp`, {
      adminEmail,
    });
    return response.data;
  },

  verifyDeletionOtp: async (managerId, otp) => {
    const response = await axiosInstance.post(`/api/admin/inventory-managers/${managerId}/verify-deletion-otp`, {
      otp,
    });
    return response.data;
  },

  confirmDeleteInventoryManager: async (managerId, verificationToken) => {
    const response = await axiosInstance.post(`/api/admin/inventory-managers/${managerId}/confirm-delete`, {
      verificationToken,
    });
    return response.data;
  },
};
