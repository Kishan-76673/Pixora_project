import api from './api';

export const userService = {
  // Get user profile by username
  getUserProfile: async (username) => {
    const response = await api.get(`/users/${username}/`);
    return response.data;
  },

  // UserService.js - Update getCurrentProfile function
getCurrentProfile: async () => {
  try {
    // Try multiple endpoints
    let response;
    
    try {
      // First try /auth/me/
      response = await api.get('/auth/me/');
    } catch (error) {
      if (error.response?.status === 405) {
        // If 405, try to get user from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.username) {
          // Get profile by username
          response = await api.get(`/users/${user.username}/`);
        } else {
          throw new Error('User not found');
        }
      } else {
        throw error;
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
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