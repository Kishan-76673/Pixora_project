import { useEffect, useRef, useState, useCallback } from 'react';

const WEBSOCKET_URL = 'ws://localhost:8000/ws/chat/';

const useWebSocket = (token) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!token) return;

    console.log('🔌 Connecting to WebSocket...');

    const ws = new WebSocket(`${WEBSOCKET_URL}?token=${token}`);

    ws.onopen = () => {
      console.log('✅ WebSocket Connected');
      setIsConnected(true);

      // Rejoin last conversation automatically
      const lastConversation = localStorage.getItem('activeConversation');
      if (lastConversation) {
        ws.send(JSON.stringify({
          type: 'join_conversation',
          conversation_id: lastConversation
        }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 WebSocket message received:', data);

      switch (data.type) {
        case 'connection_established':
          console.log('✅ Connection established');
          break;

        case 'new_message':
          console.log('💬 New message:', data.message);
          window.dispatchEvent(
            new CustomEvent('ws:new_message', {
              detail: data.message
            })
          );
          break;

        case 'joined_conversation':
          console.log('✅ Joined conversation:', data.conversation_id);
          break;

        case 'typing':
          window.dispatchEvent(new CustomEvent('typing', { detail: data }));
          break;

        case 'message_read':
          window.dispatchEvent(new CustomEvent('messageRead', { detail: data }));
          break;

        case 'reaction_added':
          window.dispatchEvent(new CustomEvent('reactionAdded', { detail: data }));
          break;

        case 'conversation_updated':
          window.dispatchEvent(new CustomEvent('conversationUpdated', { detail: data }));
          break;

        case 'error':
          console.error('❌ WebSocket error:', data.message);
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('❌ WebSocket Disconnected');
      setIsConnected(false);

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        connect();
      }, 3000);
    };

    socketRef.current = ws;
  }, [token]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      console.log('🔵 Joining conversation:', conversationId);
      socketRef.current.send(JSON.stringify({
        type: 'join_conversation',
        conversation_id: conversationId
      }));
    }
  }, [isConnected]);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      console.log('🔴 Leaving conversation:', conversationId);
      socketRef.current.send(JSON.stringify({
        type: 'leave_conversation',
        conversation_id: conversationId
      }));
    }
  }, [isConnected]);

  const sendMessage = useCallback((conversationId, content, replyTo = null) => {
    if (socketRef.current && isConnected) {
      console.log('💬 Sending message:', content);
      socketRef.current.send(JSON.stringify({
        type: 'send_message',
        conversation_id: conversationId,
        content: content,
        reply_to: replyTo
      }));
    } else {
      console.error('❌ Cannot send message: WebSocket not connected');
    }
  }, [isConnected]);

  const sendTyping = useCallback((conversationId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        conversation_id: conversationId,
        is_typing: isTyping
      }));
    }
  }, [isConnected]);

  const markAsRead = useCallback((messageId, conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'mark_as_read',
        message_id: messageId,
        conversation_id: conversationId
      }));
    }
  }, [isConnected]);

  const addReaction = useCallback((messageId, emoji, conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'add_reaction',
        message_id: messageId,
        emoji: emoji,
        conversation_id: conversationId
      }));
    }
  }, [isConnected]);

  return {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    markAsRead,
    addReaction,
  };
};

export default useWebSocket;