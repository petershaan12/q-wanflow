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
