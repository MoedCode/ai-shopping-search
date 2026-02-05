// ai-shopping-search/frontend/src/components/ChatInterface.jsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useChatStream } from '../hooks/useChatStream' // Import the new hook
import MessageBubble from './MessageBubble' // We will update this slightly next

export default function ChatInterface() {
  const { messages, isLoading, sendMessage, loadHistory, clearChat, sessionId } = useChatStream();
  const [text, setText] = useState('');
  
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    sendMessage(text);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div className="chat-title">
             AI Shopping Agent {sessionId ? <span className="text-xs text-green-500">● Live</span> : ''}
        </div>
        <button 
            className="delete-button" 
            onClick={clearChat} 
            disabled={messages.length === 0}
            title="Start New Session"
        >
            New Chat
        </button>
      </div>

      <div ref={listRef} className="messages scrollbar-hide" role="list">
        {messages.length === 0 && (
          <div className="message-pair animation-fade-in">
             {/* ... (نفس كود رسالة الترحيب القديم الخاص بك) ... */}
             <div className="message-bubble incoming" style={{ maxWidth: '90%', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <div className="space-y-3 p-1">
                    <h4 className="text-lg font-bold text-blue-900">👋 Welcome Back!</h4>
                    <p>I'm ready to find the best deals for you. What are we buying today?</p>
                </div>
            </div>
          </div>
        )}

        {/* Rendering Messages */}
        {messages.map((m, i) => (
          <MessageBubble 
            key={i} 
            text={m.content} 
            isUser={m.role === 'user'} 
            products={m.products} // Pass products found by AI
          />
        ))}
        
        {/* Loading Indicator */}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
             <div className="text-gray-400 text-sm animate-pulse px-4">AI is thinking...</div>
        )}
      </div>

      <div className="input-area">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="chat-input"
          rows={1}
          style={{ resize: 'none', overflow: 'hidden' }}
          disabled={isLoading}
        />
        <button 
            onClick={handleSend} 
            className="send-button" 
            disabled={!text.trim() || isLoading}
        >
          {isLoading ? '...' : '➤'}
        </button>
      </div>
    </div>
  )
}



