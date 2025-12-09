import api from './api';

export const userService = {
  // Get user profile by username
  getUserProfile: async (username) => {
    const response = await api.get(`/users/${username}/`);
    return response.data;
  },

  // Get current user profile
  getCurrentProfile: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  // Update profile (bio, full_name, avatar)
  updateProfile: async (formData) => {
    const response = await api.patch('/profile/update/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get user's posts
  getUserPosts: async (username) => {
    const response = await api.get(`/users/${username}/posts/`);
    // Handle pagination if exists
    if (response.data && response.data.results) {
      return response.data.results;
    }
    return response.data;
  },
};