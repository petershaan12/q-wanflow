import axios from 'axios';

export const userService = {
  getUsers: async () => {
    try {
      const response = await axios.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  updateUser: async (userId, data) => {
    try {
      const response = await axios.put(`/api/users/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  updateUserPlan: async (userId, plan) => {
    try {
      const response = await axios.put(`/api/users/${userId}/plan`, { plan });
      return response.data;
    } catch (error) {
      console.error('Error updating user plan:', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await axios.delete(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      // Assuming stats are gathered from workflows and users
      const users = await axios.get('/api/users');
      const workflows = await axios.get('/api/workflows');
      return {
        totalUsers: users.data.length,
        totalWorkflows: workflows.data.length,
        activeRuns: 0, // Backend doesn't support this yet
        apiUsage: 0
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { totalUsers: 0, totalWorkflows: 0, activeRuns: 0, apiUsage: 0 };
    }
  }
};
