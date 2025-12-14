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

  // Load conversations on mount
  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token]);

  // Handle new WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const latestMessage = wsMessages[wsMessages.length - 1];

      // Add to current messages if it's for active conversation
      if (latestMessage.conversation === activeConversation) {
        // setCurrentMessages(prev => {
        //   // Avoid duplicates
        //   const exists = prev.find(m => m.id === latestMessage.id);
        //   return exists ? prev : [...prev, latestMessage];
        // });

        setCurrentMessages(prev => {
          const tempIndex = prev.findIndex(
            m =>
              m.optimistic &&
              m.content === latestMessage.content &&
              m.sender.id === latestMessage.sender.id
          );

          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = latestMessage;
            return updated;
          }

          const exists = prev.find(m => m.id === latestMessage.id);
          return exists ? prev : [...prev, latestMessage];
        });


        // Mark as read
        if (latestMessage.sender.id !== getCurrentUserId()) {
          wsMarkAsRead(latestMessage.id);
        }
      }

      // Update conversation list
      updateConversationWithMessage(latestMessage);
    }
  }, [wsMessages, activeConversation]);

  // Handle typing events
  useEffect(() => {
    const handleTyping = (event) => {
      const { user_id, username, is_typing } = event.detail;
      setTypingUsers(prev => {
        const updated = new Map(prev);
        if (is_typing) {
          updated.set(user_id, username);
        } else {
          updated.delete(user_id);
        }
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
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrGetConversation = async (participantId) => {
    try {
      const conversation = await chatService.createOrGetConversation(participantId);

      // Update conversations list
      // setConversations(prev => {
      //   const exists = prev.find(c => c.id === conversation.id);
      //   return exists ? prev : [conversation, ...prev];
      // });

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
      // Leave previous conversation
      if (activeConversation) {
        wsLeaveConversation(activeConversation);
      }

      // Join new conversation
      wsJoinConversation(conversationId);
      setActiveConversation(conversationId);

      // Load messages
      setLoading(true);
      const data = await chatService.getMessages(conversationId);
      setCurrentMessages(data.results || data.messages || []);
      setWsMessages([]);

      // Mark as read
      await chatService.markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Error selecting conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  // const sendMessage = (content, replyTo = null) => {
  //   if (activeConversation && content.trim()) {
  //     wsSendMessage(activeConversation, content.trim(), replyTo);
  //   }
  // };

  const sendMessage = (content, replyTo = null) => {
    if (!activeConversation || !content.trim()) return;

    const tempMessage = {
      id: `temp-${Date.now()}`, // temporary id
      content: content.trim(),
      conversation: activeConversation,
      sender: {
        id: getCurrentUserId(),
        username: 'You'
      },
      created_at: new Date().toISOString(),
      optimistic: true
    };

    // 🔥 Update UI immediately
    setCurrentMessages(prev => [...prev, tempMessage]);

    // 🔥 Send to WebSocket
    wsSendMessage(activeConversation, content.trim(), replyTo);
  };



  const sendTypingIndicator = (isTyping) => {
    if (activeConversation) {
      wsSendTyping(activeConversation, isTyping);
    }
  };

  const updateConversationWithMessage = (message) => {
    setConversations(prev => {
      if (!Array.isArray(prev)) return prev;
      return prev.map(conv => {

        if (conv.id === message.conversation) {
          return {
            ...conv,
            last_message: message,
            updated_at: message.created_at
          };
        }
        return conv;
      }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    });
  };

  const getCurrentUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  const value = {
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
    getCurrentUserId
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );

};