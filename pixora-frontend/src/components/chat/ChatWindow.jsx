import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import EmojiPicker from 'emoji-picker-react';
import MessageBubble from './MessageBubble';

const ChatWindow = () => {
  const {
    conversations,
    activeConversation,
    currentMessages,
    sendMessage,
    sendTypingIndicator,
    getCurrentUserId,
    typingUsers
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const currentConversation = conversations.find(c => c.id === activeConversation);
  const otherUser = currentConversation?.other_user;
  const currentUserId = getCurrentUserId();

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage, replyTo?.id);
      setInputMessage('');
      setReplyTo(null);
      setShowEmojiPicker(false);
      sendTypingIndicator(false);
    }
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    if (e.target.value) {
      sendTypingIndicator(true);

      // Stop typing after 3 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 3000);
    } else {
      sendTypingIndicator(false);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setInputMessage(prev => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

  const handleReply = (message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 bg-white border-b shadow-sm flex items-center space-x-3">
        <img
          src={otherUser?.avatar_url || '/default-avatar.png'}
          alt={otherUser?.username || 'User'}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => {
            e.target.src = '/default-avatar.png';
          }}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">
            {otherUser?.full_name || otherUser?.username || 'Unknown User'}
          </h3>
          {typingUsers.size > 0 && (
            <p className="text-sm text-blue-500">typing...</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {currentMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender.id === currentUserId}
            onReply={handleReply}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex justify-between items-center">
          <div className="flex-1">
            <p className="text-xs text-blue-600 font-semibold">
              Replying to {replyTo.sender.username}
            </p>
            <p className="text-sm text-gray-600 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={cancelReply}
            className="text-blue-600 hover:text-blue-800 ml-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t">
        <div className="flex items-end space-x-2">
          {/* Emoji Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-10">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;