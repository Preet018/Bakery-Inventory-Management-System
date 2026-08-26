import axiosInstance, { API_BASE_URL } from '../api/axiosInstance';

/**
 * NEW FILE: ProductService
 * Handles catalog browsing, product creation with image upload, updating, activation.
 */

export const productService = {
  // Get all active/available products
  getAllProducts: async () => {
    const response = await axiosInstance.get('/api/products');
    return response.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await axiosInstance.get(`/api/products/${id}`);
    return response.data;
  },

  // Create product with multipart image upload (ADMIN/INVENTORY_MANAGER)
  createProduct: async (productData, imageFiles) => {
    const formData = new FormData();
    // Spring Boot expects request part "product" as JSON string or Blob
    const jsonBlob = new Blob([JSON.stringify(productData)], { type: 'application/json' });
    formData.append('product', jsonBlob);

    if (imageFiles && imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
      }
    }

    const response = await axiosInstance.post('/api/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update existing product
  updateProduct: async (id, productData) => {
    const response = await axiosInstance.put(`/api/products/${id}`, productData);
    return response.data;
  },

  // Activate product
  activateProduct: async (id) => {
    const response = await axiosInstance.patch(`/api/products/${id}/activate`);
    return response.data;
  },

  // Deactivate product
  deactivateProduct: async (id) => {
    const response = await axiosInstance.patch(`/api/products/${id}/deactivate`);
    return response.data;
  },

  // Helper to format image URLs returned by backend
  getImageUrl: (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    let cleanPath = imagePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.substring('uploads'.length);
    }
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    if (!cleanPath.startsWith('/images/products/') && !cleanPath.startsWith('/images/')) {
      cleanPath = '/images/products' + cleanPath;
    }
    return `${API_BASE_URL}${cleanPath}`;
  }
};
