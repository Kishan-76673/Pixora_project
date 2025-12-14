import api from './api';

const chatService = {
  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/chat/conversations/');
    return response.data;
  },

  // Create or get conversation with a user
  createOrGetConversation: async (participantId) => {
    const response = await api.post('/chat/conversations/create_or_get/', {
      participant_id: participantId
    });
    return response.data;
  },

  // Get messages for a conversation
  getMessages: async (conversationId, page = 1) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages/`, {
      params: { page }
    });
    return response.data;
  },

  // Mark conversation as read
  markConversationAsRead: async (conversationId) => {
    const response = await api.post(`/chat/conversations/${conversationId}/mark_as_read/`);
    return response.data;
  },

  // Mark specific message as read
  markMessageAsRead: async (messageId) => {
    const response = await api.post(`/chat/messages/${messageId}/mark_as_read/`);
    return response.data;
  },

  // Send message with file (REST fallback)
  sendMessageWithFile: async (conversationId, formData) => {
    const response = await api.post('/chat/messages/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/chat/messages/${messageId}/soft_delete/`);
    return response.data;
  }
};

export default chatService;