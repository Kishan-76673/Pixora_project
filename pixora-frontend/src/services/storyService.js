import api from './api';

export const storyService = {
  getStories: async () => {
    try {
      const response = await api.get('/stories/');
      return response.data; // Make sure this is an array
    } catch (error) {
      console.error('Get stories error:', error);
      throw error;
    }
  },

  // Get user's stories
  getUserStories: async (username) => {
    const response = await api.get(`/users/${username}/stories/`);
    return response.data;
  },

  // Create story
  createStory: async (formData) => {
    const response = await api.post('/stories/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete story
  deleteStory: async (storyId) => {
    const response = await api.delete(`/stories/${storyId}/`);
    return response.data;
  },

  // Mark story as viewed
  markStoryViewed: async (storyId) => {
    const response = await api.post(`/stories/${storyId}/view/`);
    return response.data;
  },
};