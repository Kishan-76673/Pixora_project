import React, { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';

const MessageBubble = ({ message, isOwn, onReply, onReact, getCurrentUserId }) => {
  const [showActions, setShowActions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const isSender = msg.sender.id === currentUser.id;

  const readByOthers = msg.read_by?.length > 0;
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return '';
    }
  };

  const getReadStatus = () => {
    if (!isOwn) return null;

    const readReceipts = message.read_receipts || [];

    if (readReceipts.length === 0) {
      // Sent (single tick)
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
        </svg>
      );
    } else {
      // Read (double tick with eye)
      return (
        <div className="flex items-center space-x-0.5">
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
            <path d="M19.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0" />
          </svg>
          <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
  };

  const handleReactionClick = (emoji) => {
    if (onReact) {
      onReact(message.id, emoji);
    }
    setShowReactions(false);
    setShowMenu(false);
  };

  // Group reactions by emoji
  const groupedReactions = {};
  if (message.reactions) {
    message.reactions.forEach(reaction => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = [];
      }
      groupedReactions[reaction.emoji].push(reaction.user);
    });
  }

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-1`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowMenu(false);
        setShowReactions(false);
      }}
    >
      <div className={`max-w-xs lg:max-w-md relative`}>
        {/* Reply Preview */}
        {message.reply_to && (
          <div className={`mb-1 px-3 py-2 rounded-lg text-xs border-l-4 ${isOwn
              ? 'bg-blue-100 text-blue-800 border-blue-400'
              : 'bg-gray-100 text-gray-700 border-gray-400'
            }`}>
            <p className="font-semibold">{message.reply_to.sender}</p>
            <p className="truncate opacity-75">{message.reply_to.content}</p>
          </div>
        )}

        {/* Message Content */}
        <div
          className={`px-4 py-2 rounded-2xl shadow-md relative ${isOwn
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
            }`}
        >
          {/* Sender name (for received messages) */}
          {!isOwn && (
            <p className="text-xs font-semibold mb-1 text-blue-600">
              {message.sender.username}
            </p>
          )}

          {/* Message text */}
          <p className="break-words whitespace-pre-wrap">{message.content}</p>

          {/* File preview */}
          {message.file_url && (
            <div className="mt-2">
              {message.message_type === 'image' ? (
                <img
                  src={message.file_url}
                  alt="Shared"
                  className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90"
                  onClick={() => window.open(message.file_url, '_blank')}
                />
              ) : message.message_type === 'video' ? (
                <video
                  src={message.file_url}
                  controls
                  className="rounded-lg max-w-full h-auto"
                />
              ) : (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm p-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate">Download File</span>
                </a>
              )}
            </div>
          )}

          {/* Time - Only visible on hover */}
          {showActions && (
            <div className={`absolute -top-6 ${isOwn ? 'right-0' : 'left-0'} text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-lg`}>
              {formatTime(message.created_at)}
            </div>
          )}

          {/* Read status (for own messages) */}
          <div className={`text-xs mt-1 flex items-center justify-end space-x-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'
            }`}>
            {getReadStatus()}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <div
                key={emoji}
                className="bg-gray-100 rounded-full px-2 py-1 text-xs flex items-center space-x-1 cursor-pointer hover:bg-gray-200"
                title={users.map(u => u.username).join(', ')}
              >
                <span>{emoji}</span>
                <span className="text-gray-600 font-semibold">{users.length}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons (3-dot menu & emoji) */}
        {showActions && (
          <div
            className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
              } flex items-center space-x-1 px-2`}
          >
            {/* Emoji React Button */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-gray-100 rounded-full transition-colors"
                title="React"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Quick Reactions Popup */}
              {showReactions && (
                <div className="absolute bottom-full mb-2 bg-white rounded-lg shadow-xl border p-2 flex space-x-1 z-10">
                  {quickEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReactionClick(emoji)}
                      className="text-2xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3-Dot Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="More"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {/* Menu Dropdown */}
              {showMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-xl border py-1 z-10 min-w-32">
                  <button
                    onClick={() => {
                      onReply(message);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Reply</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;