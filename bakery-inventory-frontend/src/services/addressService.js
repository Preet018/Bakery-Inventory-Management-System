import axiosInstance from '../api/axiosInstance';

/**
 * AddressService
 *
 * Encapsulates Customer Saved Address REST API operations:
 *   - GET all saved addresses
 *   - GET a specific saved address
 *   - POST create saved address
 *   - PUT update saved address
 *   - DELETE saved address
 *   - PATCH set saved address as default
 */
export const addressService = {
  // Get all saved addresses for the authenticated customer
  getAllAddresses: async () => {
    const response = await axiosInstance.get('/api/addresses');
    return response.data; // List<SavedAddressResponse>
  },

  // Get a specific saved address by ID
  getAddressById: async (id) => {
    const response = await axiosInstance.get(`/api/addresses/${id}`);
    return response.data; // SavedAddressResponse
  },

  // Create a new saved address
  createAddress: async (addressData) => {
    const response = await axiosInstance.post('/api/addresses', addressData);
    return response.data; // SavedAddressResponse
  },

  // Update an existing saved address (does NOT modify isDefault)
  updateAddress: async (id, addressData) => {
    const response = await axiosInstance.put(`/api/addresses/${id}`, addressData);
    return response.data; // SavedAddressResponse
  },

  // Delete a saved address
  deleteAddress: async (id) => {
    const response = await axiosInstance.delete(`/api/addresses/${id}`);
    return response.data;
  },

  // Set an address as the customer's default address
  setDefaultAddress: async (id) => {
    const response = await axiosInstance.patch(`/api/addresses/${id}/default`);
    return response.data; // SavedAddressResponse
  }
};
