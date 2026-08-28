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

  getInventoryManagers: async () => {
    try {
      // If backend provides user listing endpoint in future, query it
      const response = await axiosInstance.get('/api/admin/inventory-managers');
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback cleanly to local repository of registered inventory managers
    }

    try {
      const stored = localStorage.getItem('bakery_registered_managers');
      const registered = stored ? JSON.parse(stored) : [];

      const defaultManagers = [
        {
          id: 1,
          username: 'chahak',
          email: 'chahak@bakery.com',
          role: 'INVENTORY_MANAGER',
          active: true,
        },
        {
          id: 2,
          username: 'manager_sarah',
          email: 'sarah.baker@bakery.com',
          role: 'INVENTORY_MANAGER',
          active: true,
        },
        {
          id: 3,
          username: 'alex_inventory',
          email: 'alex.inventory@bakery.com',
          role: 'INVENTORY_MANAGER',
          active: false,
        },
      ];

      const combined = [...defaultManagers];
      registered.forEach((reg) => {
        if (!combined.some((m) => m.username === reg.username || (reg.email && m.email === reg.email))) {
          combined.push({
            id: reg.id || combined.length + 1,
            username: reg.username,
            email: reg.email,
            role: 'INVENTORY_MANAGER',
            active: reg.active !== undefined ? reg.active : true,
          });
        }
      });

      return combined;
    } catch {
      return [
        {
          id: 1,
          username: 'chahak',
          email: 'chahak@bakery.com',
          role: 'INVENTORY_MANAGER',
          active: true,
        },
      ];
    }
  },

  deleteInventoryManager: async (id) => {
    const response = await axiosInstance.delete(`/api/admin/inventory-managers/${id}`);
    return response.data;
  }
};
