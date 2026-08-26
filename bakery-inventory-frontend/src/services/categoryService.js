import axiosInstance from '../api/axiosInstance';

/**
 * NEW FILE: CategoryService
 * Manages category browsing and Admin CRUD operations.
 */

export const categoryService = {
  getAllCategories: async () => {
    const response = await axiosInstance.get('/api/categories');
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await axiosInstance.get(`/api/categories/${id}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    // categoryData = { name, description }
    const response = await axiosInstance.post('/api/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await axiosInstance.put(`/api/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await axiosInstance.delete(`/api/categories/${id}`);
    return response.data;
  }
};
