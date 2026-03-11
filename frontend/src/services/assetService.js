import axios from 'axios';

// Assuming API base URL is handled by vite proxy or axios defaults
// If not, we could add a base URL here.

export const assetService = {
  getAssets: async () => {
    const response = await axios.get('/api/assets/');
    return response.data;
  },

  createAsset: async (formData) => {
    const response = await axios.post('/api/assets/', formData);
    return response.data;
  },

  updateAsset: async (id, formData) => {
    const response = await axios.put(`/api/assets/${id}`, formData);
    return response.data;
  },

  deleteAsset: async (id) => {
    const response = await axios.delete(`/api/assets/${id}`);
    return response.data;
  },

  getStorageInfo: async () => {
    const response = await axios.get('/api/assets/storage-info');
    return response.data;
  }
};
