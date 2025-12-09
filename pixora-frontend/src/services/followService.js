import api from './api';

export const followService = {
  // Follow a user - FIXED URL
  followUser: async (username) => {
    const response = await api.post(`/users/${username}/follow/`);
    return response.data;
  },

  // Unfollow a user - FIXED URL
  unfollowUser: async (username) => {
    const response = await api.delete(`/users/${username}/follow/`);
    return response.data;
  },

  // Check follow status - FIXED URL
  checkFollowStatus: async (username) => {
    const response = await api.get(`/users/${username}/follow/status/`);
    return response.data;
  },

  // Get followers
  getFollowers: async (username) => {
    const response = await api.get(`/users/${username}/followers/`);
    return response.data;
  },

  // Get following
  getFollowing: async (username) => {
    const response = await api.get(`/users/${username}/following/`);
    return response.data;
  },
};