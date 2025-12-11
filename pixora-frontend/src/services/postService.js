import api from './api';

export const postService = {
  // Get all posts (feed)
  getPosts: async () => {
    const response = await api.get('/posts/');
    if (response.data && response.data.results) {
      return response.data.results;
    }
    return response.data;
  },

  // Get single post - ADD THIS METHOD
  getPost: async (postId) => {
    const response = await api.get(`/posts/${postId}/`);
    return response.data;
  },

  // Get user posts
  getUserPosts: async (username) => {
    const response = await api.get(`/users/${username}/posts/`);
    if (response.data && response.data.results) {
      return response.data.results;
    }
    return response.data;
  },

  // Create post
  createPost: async (formData) => {
    const response = await api.post('/posts/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}/`);
    return response.data;
  },

  // Like post
  likePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/like/`);
    return response.data;
  },

  // Unlike post
  unlikePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}/like/`);
    return response.data;
  },

  // Get comments
  getComments: async (postId) => {
    const response = await api.get(`/posts/${postId}/comments/`);
    return response.data;
  },

  // Add comment
  addComment: async (postId, text) => {
    const response = await api.post(`/posts/${postId}/comments/`, {
      text,
      post: postId
    });
    return response.data;
  },

  // Delete comment
  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}/`);
    return response.data;
  },
};