import React from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import { useChat } from '../../context/ChatContext';

const ChatContainer = () => {
  const { activeConversation } = useChat();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Conversation List */}
      <div className="w-full md:w-1/3 bg-white border-r shadow-lg">
        <ConversationList />
      </div>

      {/* Main Chat Window */}
      <div className="hidden md:flex flex-1">
        {activeConversation ? (
          <ChatWindow />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-50">
            <svg className="w-24 h-24 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
            <p className="text-sm">Choose a conversation from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;