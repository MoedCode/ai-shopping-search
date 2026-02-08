// ai-shopping-search/frontend/src/components/ChatInterface.jsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/solid'
import { useChatStream } from '../hooks/useChatStream'
import { fetchUserSessions, deleteSession } from '../services/api'
import { getGuestId } from '../services/guest'

import Sidebar from './Sidebar'
import Header from './Header'
import MessageBubble from './MessageBubble'
import SavedProductsModal from './SavedProductsModal'

export default function ChatInterface() {
  const { messages, isLoading, sendMessage, loadHistory, clearChat, sessionId } = useChatStream();
  const [text, setText] = useState('');
  const [sessions, setSessions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [guestId, setGuestIdState] = useState(null);
  const [showMyStuff, setShowMyStuff] = useState(false);
  
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  // Load Initial Data
  useEffect(() => {
    const initData = async () => {
      const id = await getGuestId();
      if (id) {
          setGuestIdState(id);
          const res = await fetchUserSessions(id);
          setSessions(res.data);
      }
    };
    initData();
    // Note: loadHistory is handled inside useChatStream useEffect
  }, []);

  // Update sessions list when active session changes
  useEffect(() => {
    if (sessionId && guestId) {
        setTimeout(() => {
            fetchUserSessions(guestId).then(res => setSessions(res.data));
        }, 1000);
    }
  }, [sessionId, guestId]);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // === FIX: Auto-grow Input Box logic ===
  useEffect(() => {
    if (textareaRef.current) {
        // Reset height to calculate correctly
        textareaRef.current.style.height = 'auto';
        // Set new height up to max 200px
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSend = async () => {
    if (!text.trim() || isLoading) return;
    const msg = text;
    setText('');
    // Reset height manually after send
    if (textareaRef.current) textareaRef.current.style.height = '52px'; 
    await sendMessage(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectSession = (id) => {
    localStorage.setItem('last_session_id', id);
    window.location.reload(); 
  };

  const handleDeleteSession = async (idToDelete) => {
    if(!confirm("Delete this chat permanently?")) return;
    await deleteSession(guestId, idToDelete);
    setSessions(prev => prev.filter(s => s.id !== idToDelete));
    if (idToDelete === sessionId) clearChat();
  };

  return (
    <div className="flex h-screen w-full bg-[#f0f4f9] text-[#1f1f1f] overflow-hidden font-sans">
      
      {/* Left Sidebar */}
      <Sidebar 
        sessions={sessions} 
        currentSessionId={sessionId}
        isOpen={isSidebarOpen}
        onSelectSession={handleSelectSession}
        onNewChat={clearChat}
        onDeleteSession={handleDeleteSession}
        onOpenMyStuff={() => setShowMyStuff(true)} // === الربط هنا ضروري ===
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full w-full bg-white md:bg-[#f0f4f9] md:rounded-tl-3xl md:rounded-bl-3xl md:ml-0 shadow-2xl overflow-hidden">
        
        <Header 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            title={sessions.find(s => s.id === sessionId)?.title || "New Chat"}
            isGuest={true} 
            guestId={guestId}
        />

        {/* Chat Area */}
        <div ref={listRef} className="flex-1 overflow-y-auto w-full custom-scrollbar bg-white rounded-3xl md:m-4 md:mt-0 shadow-sm border border-gray-100">
            <div className="max-w-4xl mx-auto px-4 pb-40 pt-8">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center mt-20 opacity-80 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-gradient-to-tr from-blue-400 to-red-400 rounded-full blur-3xl opacity-30 mb-6"></div>
                        <h1 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent mb-4 text-center">
                            Hello, Human
                        </h1>
                        <p className="text-xl text-gray-400 text-center">How can I help you shop today?</p>
                    </div>
                ) : (
                    messages.map((m, i) => (
                        <MessageBubble 
                            key={i} 
                            text={m.content} 
                            isUser={m.role === 'user'} 
                            products={m.products} 
                        />
                    ))
                )}
                {isLoading && (
                    <div className="flex gap-4 mt-6 animate-pulse pl-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                        <div className="space-y-2 flex-1 max-w-sm">
                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Floating Input Area (Updated for Expansion) */}
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-6 pt-10 bg-gradient-to-t from-white via-white to-transparent">
            <div className="max-w-4xl mx-auto">
                <div className="bg-[#f0f4f9] rounded-[28px] border border-gray-200 flex items-end p-2 pl-4 focus-within:shadow-md focus-within:bg-white transition-all duration-200">
                    
                    <button className="p-3 mb-1 rounded-full bg-[#dce3e9] hover:bg-gray-300 text-gray-600 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        // === FIX: Classes for expanding textarea ===
                        className="flex-1 bg-transparent border-none outline-none resize-none py-3.5 px-4 text-base text-gray-800 placeholder-gray-500 min-h-[52px] max-h-[200px] overflow-y-auto"
                        rows={1}
                        disabled={isLoading}
                    />
                    
                    <button 
                        onClick={handleSend}
                        disabled={!text.trim() || isLoading}
                        className={`p-3 mb-1 rounded-full transition-all duration-200 ${text.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-transparent text-gray-400'}`}
                    >
                        <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="text-center text-[11px] text-gray-400 mt-2">
                    AI Shopping Agent can make mistakes. Check important info.
                </div>
            </div>
        </div>

      </div>

      {/* Saved Products Modal (The Popup) */}
      <SavedProductsModal isOpen={showMyStuff} onClose={() => setShowMyStuff(false)} />
    </div>
  )
}
