import React, { useState } from 'react';
import { format } from 'date-fns';

const MessageBubble = ({ message, isOwn, onReply }) => {
  const [showActions, setShowActions] = useState(false);

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-xs lg:max-w-md relative`}>
        {/* Reply Preview */}
        {message.reply_to && (
          <div className={`mb-1 px-3 py-2 rounded-lg text-xs ${
            isOwn ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
          }`}>
            <p className="font-semibold">{message.reply_to.sender}</p>
            <p className="truncate opacity-75">{message.reply_to.content}</p>
          </div>
        )}

        {/* Message Content */}
        <div
          className={`px-4 py-2 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
          }`}
        >
          {/* Sender name (for received messages) */}
          {!isOwn && (
            <p className="text-xs font-semibold mb-1 text-gray-600">
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
                  className="rounded-lg max-w-full h-auto"
                />
              ) : (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>View File</span>
                </a>
              )}
            </div>
          )}

          {/* Time and read status */}
          <div className={`text-xs mt-1 flex items-center space-x-1 ${
            isOwn ? 'text-blue-100 justify-end' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.created_at)}</span>
            {isOwn && message.read_receipts?.length > 0 && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {showActions && (
          <div
            className={`absolute top-0 ${
              isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
            } flex items-center space-x-1 px-2`}
          >
            <button
              onClick={() => onReply(message)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Reply"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;