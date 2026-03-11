import axios from 'axios';

export const workflowService = {
  getWorkflows: async () => {
    const response = await axios.get('/api/workflows/');
    return response.data;
  },

  getWorkflow: async (id) => {
    const response = await axios.get(`/api/workflows/${id}`);
    return response.data;
  },

  getWorkflowByShareId: async (shareId) => {
    const response = await axios.get(`/api/workflows/share/${shareId}`);
    return response.data;
  },

  createWorkflow: async (data) => {
    const response = await axios.post('/api/workflows/', data);
    return response.data;
  },

  updateWorkflow: async (id, data) => {
    const response = await axios.put(`/api/workflows/${id}`, data);
    return response.data;
  },

  deleteWorkflow: async (id) => {
    const response = await axios.delete(`/api/workflows/${id}`);
    return response.data;
  },

  runWorkflow: async (id, inputData = {}) => {
    const response = await axios.post(`/api/workflows/${id}/run`, { input_data: inputData });
    return response.data;
  },

  getNodes: async (workflowId) => {
    const response = await axios.get(`/api/nodes/workflow/${workflowId}`);
    return response.data;
  },

  getEdges: async (workflowId) => {
    const response = await axios.get(`/api/nodes/workflow/${workflowId}/edges`);
    return response.data;
  },

  saveNode: async (data) => {
    const response = await axios.post('/api/nodes/', data);
    return response.data;
  },

  updateNode: async (id, data) => {
    const response = await axios.put(`/api/nodes/${id}`, data);
    return response.data;
  },

  deleteNode: async (id) => {
    const response = await axios.delete(`/api/nodes/${id}`);
    return response.data;
  },

  saveEdge: async (data) => {
    const response = await axios.post('/api/nodes/edge', data);
    return response.data;
  },

  deleteEdge: async (id) => {
    const response = await axios.delete(`/api/nodes/edge/${id}`);
    return response.data;
  }
};
