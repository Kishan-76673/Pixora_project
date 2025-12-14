// import { useState, useEffect } from 'react';
// import { useLocation } from 'react-router-dom';
// import { useChat } from '../context/ChatContext';

// const Messages = () => {
//   const location = useLocation();
//   const { conversationId } = location.state || {};
//   const { selectConversation, currentMessages, sendMessage, getCurrentUserId } = useChat();

//   const [text, setText] = useState('');
//  const messagesEndRef = useRef(null);


//   useEffect(() => {
//     if (conversationId) {
//       selectConversation(conversationId);
//     }
//   }, [conversationId]);

//   // Auto-scroll on new message
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [currentMessages]);

//   const handleSend = () => {
//     if (!text.trim()) return;

//     sendMessage(text);
//     setText('');
//   };
  
//   if (!conversationId) {
//     return <p className="text-center mt-4">No conversation selected</p>;
//   }

//   return (
//     <div className="container mt-4">
//       <h4>Messages</h4>

//       {/* Messages box */}
//       <div
//         className="border rounded p-3 mb-3"
//         style={{ height: '350px', overflowY: 'auto' }}
//       >
//         {currentMessages.length === 0 && (
//           <p className="text-muted">No messages yet</p>
//         )}

//         {currentMessages.map(msg => (
//           <div key={msg.id} className="mb-2">
//             <strong>{msg.sender.username}:</strong> {msg.content}
//           </div>
//         ))}
//       </div>

//       {/* Input + Send */}
//       <div className="d-flex gap-2">
//         <input
//           type="text"
//           className="form-control"
//           placeholder="Type a message..."
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//         />
//         <button className="btn btn-primary" onClick={handleSend}>
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Messages;


import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../context/ChatContext';

const Messages = () => {
  const location = useLocation();
  const { conversationId } = location.state || {};
  const { selectConversation, currentMessages, sendMessage, getCurrentUserId } = useChat();

  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
  };

  if (!conversationId) {
    return (
      <div className="text-center text-muted mt-5">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h4 className="mb-3">Messages</h4>

      {/* Chat Box */}
      <div
        className="border rounded p-3 mb-3"
        style={{ height: '400px', overflowY: 'auto' }}
      >
        {currentMessages.length === 0 && (
          <p className="text-muted text-center mt-4">No messages yet</p>
        )}

        {currentMessages.map(msg => {
          const isMe = msg.sender?.id === getCurrentUserId();

          return (
            <div
              key={msg.id}
              className={`d-flex mb-2 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}
            >
              <div
                className={`px-3 py-2 rounded`}
                style={{
                  maxWidth: '70%',
                  backgroundColor: isMe ? '#0d6efd' : '#2c2f33',
                  color: 'white',
                  wordBreak: 'break-word'
                }}
              >
                {!isMe && (
                  <small className="text-info d-block mb-1">
                    {msg.sender.username}
                  </small>
                )}
                {msg.content}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="d-flex gap-2">
        <input
          type="text"
          className="form-control"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="btn btn-primary px-4"
          onClick={handleSend}
          disabled={!text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Messages;
