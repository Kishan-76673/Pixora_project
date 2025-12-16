import React, { createContext, useContext, useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import chatService from '../services/chatService';
const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map());

  const token = localStorage.getItem('accessToken');

  const {
    isConnected,
    messages: wsMessages,
    joinConversation: wsJoinConversation,
    leaveConversation: wsLeaveConversation,
    sendMessage: wsSendMessage,
    sendTyping: wsSendTyping,
    markAsRead: wsMarkAsRead,
    setMessages: setWsMessages
  } = useWebSocket(token);

  // Load conversations
  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token]);

  // Handle incoming WS messages
  useEffect(() => {
    const handleNewMessage = (event) => {
      const message = event.detail;

      if (message.conversation === activeConversation) {
        setCurrentMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          return exists ? prev : [...prev, message];
        });

        if (message.sender.id !== getCurrentUserId()) {
          wsMarkAsRead(message.id, message.conversation);
        }
      }

      updateConversationWithMessage(message);
    };

    window.addEventListener('ws:new_message', handleNewMessage);
    return () =>
      window.removeEventListener('ws:new_message', handleNewMessage);
  }, [activeConversation]);

  // Typing indicator
  useEffect(() => {
    const handleTyping = (event) => {
      const { user_id, username, is_typing } = event.detail;
      setTypingUsers(prev => {
        const updated = new Map(prev);
        if (is_typing) updated.set(user_id, username);
        else updated.delete(user_id);
        return updated;
      });
    };

    window.addEventListener('typing', handleTyping);
    return () => window.removeEventListener('typing', handleTyping);
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
    } finally {
      setLoading(false);
    }
  };

  const createOrGetConversation = async (participantId) => {
    try {
      const conversation = await chatService.createOrGetConversation(participantId);

      setConversations(prev => {
        if (!Array.isArray(prev)) return [conversation];
        const exists = prev.find(c => c.id === conversation.id);
        return exists ? prev : [conversation, ...prev];
      });

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const selectConversation = async (conversationId) => {
    try {
      if (activeConversation) {
        wsLeaveConversation(activeConversation);
      }

      wsJoinConversation(conversationId);
      setActiveConversation(conversationId);

      localStorage.setItem('activeConversation', conversationId);

      setLoading(true);
      const data = await chatService.getMessages(conversationId);
      setCurrentMessages(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (content, replyTo = null) => {
    if (!activeConversation || !content.trim()) return;

    setCurrentMessages(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        content,
        conversation: activeConversation,
        sender: { id: getCurrentUserId(), username: 'You' },
        optimistic: true,
        created_at: new Date().toISOString(),
      },
    ]);

    wsSendMessage(activeConversation, content.trim(), replyTo);
  };

  const sendTypingIndicator = (isTyping) => {
    if (activeConversation) {
      wsSendTyping(activeConversation, isTyping);
    }
  };

  const updateConversationWithMessage = (message) => {
    setConversations(prev => {
      // ✅ Ensure prev is always an array
      if (!Array.isArray(prev)) {
        console.warn('Conversations is not an array, initializing as empty array');
        return [];
      }

      return prev
        .map(c =>
          c.id === message.conversation
            ? { ...c, last_message: message, updated_at: message.created_at }
            : c
        )
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    });
  };

  const getCurrentUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        currentMessages,
        loading,
        isConnected,
        typingUsers,
        loadConversations,
        createOrGetConversation,
        selectConversation,
        sendMessage,
        sendTypingIndicator,
        getCurrentUserId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
