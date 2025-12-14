import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const WEBSOCKET_URL = 'ws://localhost:8000/ws/chat/';

const useWebSocket = (token) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Create WebSocket connection
    const ws = new WebSocket(`${WEBSOCKET_URL}?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);

      switch (data.type) {
        case 'connection_established':
          console.log('Connection established');
          break;
        
        case 'new_message':
          setMessages(prev => [...prev, data.message]);
          break;
        
        case 'typing':
          // Handle typing indicator
          window.dispatchEvent(new CustomEvent('typing', { detail: data }));
          break;
        
        case 'message_read':
          // Handle read receipt
          window.dispatchEvent(new CustomEvent('messageRead', { detail: data }));
          break;
        
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    socketRef.current = ws;

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [token]);

  // Join conversation
  const joinConversation = (conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'join_conversation',
        conversation_id: conversationId
      }));
    }
  };

  // Leave conversation
  const leaveConversation = (conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'leave_conversation',
        conversation_id: conversationId
      }));
    }
  };

  // Send message
  const sendMessage = (conversationId, content, replyTo = null) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'send_message',
        conversation_id: conversationId,
        content: content,
        reply_to: replyTo
      }));
    }
  };

  // Send typing indicator
  const sendTyping = (conversationId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        conversation_id: conversationId,
        is_typing: isTyping
      }));
    }
  };

  // Mark message as read
  const markAsRead = (messageId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'mark_as_read',
        message_id: messageId
      }));
    }
  };

  return {
    isConnected,
    messages,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    markAsRead,
    setMessages
  };
};

export default useWebSocket;