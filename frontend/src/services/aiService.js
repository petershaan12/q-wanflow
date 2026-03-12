import axios from 'axios';

const toApiError = (error, fallback) => {
  if (axios.isCancel(error)) {
    const err = new Error('Request canceled');
    err.isCanceled = true;
    return err;
  }
  const detail = error?.response?.data?.detail;
  let message = fallback;

  if (typeof detail === 'string' && detail.trim()) {
    message = detail;
  } else if (detail && typeof detail === 'object') {
    message = JSON.stringify(detail);
  } else if (error?.message) {
    message = error.message;
  }

  return new Error(message);
};

const aiService = {
  // Check status of an async generation task
  checkTaskStatus: async (taskId, options = {}) => {
    try {
      const response = await axios.get(`/api/ai/task-status/${taskId}`, options);
      return response.data;
    } catch (error) {
      console.error('Error checking task status:', error);
      throw toApiError(error, 'Failed to check task status');
    }
  },

  // Poll task until completion (for image/video generation recovery)
  pollTaskUntilDone: async (taskId, { onProgress, signal, interval = 2000, timeout = 600000 } = {}) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      // Check if aborted
      if (signal?.aborted) {
        const err = new Error('Polling canceled');
        err.isCanceled = true;
        throw err;
      }

      try {
        const result = await aiService.checkTaskStatus(taskId);
        onProgress?.(result);

        const status = (result.status || '').toUpperCase();
        if (status === 'SUCCEEDED' || status === 'SUCCESS' || status === 'COMPLETED') {
          return result;
        }
        if (status === 'FAILED' || status === 'FAIL' || status === 'CANCELED' || status === 'CANCELLED') {
          throw new Error(`Task failed with status: ${status}`);
        }
      } catch (error) {
        // Re-throw cancel errors
        if (error.isCanceled) throw error;
        // For other errors, log and continue polling (might be transient)
        console.warn('Polling error (will retry):', error.message);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Task timeout - generation took too long');
  },

  enhancePrompt: async (prompt, options = {}) => {
    try {
      const response = await axios.post('/api/ai/prompt/enhance', { prompt }, options);
      return response.data.enhanced_prompt;
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      throw toApiError(error, 'Failed to enhance prompt');
    }
  },

  generateImage: async (config, options = {}) => {
    try {
      const response = await axios.post('/api/ai/generate-image', config, options);
      return response.data;
    } catch (error) {
      console.error('Error generating image:', error);
      throw toApiError(error, 'Failed to generate image');
    }
  },

  generateVideo: async (config, options = {}) => {
    try {
      const response = await axios.post('/api/ai/generate-video', config, options);
      return response.data;
    } catch (error) {
      console.error('Error generating video:', error);
      throw toApiError(error, 'Failed to generate video');
    }
  },

  generateText: async (config, options = {}) => {
    try {
      const response = await axios.post('/api/ai/generate-text', config, options);
      return response.data;
    } catch (error) {
      console.error('Error generating text:', error);
      throw toApiError(error, 'Failed to generate text');
    }
  },

  interpretImage: async (imageUrl, prompt, options = {}) => {
    try {
      const response = await axios.post('/api/ai/interpret-image', { image_url: imageUrl, prompt }, options);
      return response.data;
    } catch (error) {
      console.error('Error interpreting image:', error);
      throw toApiError(error, 'Failed to interpret image');
    }
  },
  generateSpeech: async (config, options = {}) => {
    try {
      const response = await axios.post('/api/ai/generate-speech', config, options);
      return response.data;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw toApiError(error, 'Failed to generate speech');
    }
  }
};

export default aiService;
