import api from './api';

export const followService = {
  // Follow a user
  followUser: async (username) => {
    const response = await api.post(`/users/${username}/follow/`);
    const data = response.data;

    // Handle both response formats (old: 'following', new: 'is_following')
    if (data.following !== undefined && data.is_following === undefined) {
      data.is_following = data.following;
    }
    return data;
  },

  // Unfollow a user
  unfollowUser: async (username) => {
    const response = await api.delete(`/users/${username}/follow/`);
    const data = response.data;

    // Handle both response formats
    if (data.following !== undefined && data.is_following === undefined) {
      data.is_following = data.following;
    }
    return data;
  },

  // Check follow status
  checkFollowStatus: async (username) => {
    const response = await api.get(`/users/${username}/follow/status/`);
    return response.data;
  },

  getFollowers: async (username) => {
    const response = await api.get(`/users/${username}/followers/`);
    return response.data; 
  },

  getFollowing: async (username) => {
    const response = await api.get(`/users/${username}/following/`);
    return response.data;
  },
};