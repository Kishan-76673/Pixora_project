import React from 'react';
import { useChat } from '../../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = () => {
  const { 
    conversations, 
    activeConversation, 
    selectConversation, 
    loading,
    getCurrentUserId 
  } = useChat();

  const currentUserId = getCurrentUserId();

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-center">No conversations yet</p>
            <p className="text-sm text-center mt-2">Visit a profile and click "Message" to start chatting</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const otherUser = conv.other_user;
            const isActive = activeConversation === conv.id;
            const lastMessage = conv.last_message;

            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={otherUser?.avatar_url || '/default-avatar.png'}
                      alt={otherUser?.username || 'User'}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                    {conv.unread_count > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {otherUser?.full_name || otherUser?.username || 'Unknown User'}
                      </h3>
                      {lastMessage && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      {lastMessage?.sender?.id === currentUserId && (
                        <span className="text-blue-500 mr-1">You: </span>
                      )}
                      <p className="text-sm text-gray-600 truncate">
                        {lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;