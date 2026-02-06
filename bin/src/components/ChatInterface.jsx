// ai-shopping-search/frontend/src/components/ChatInterface.jsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useChatStream } from '../hooks/useChatStream'
import MessageBubble from './MessageBubble'
import { fetchUserSessions, deleteSession } from '../services/api'
import { getGuestId } from '../services/guest'

// أيقونات بسيطة (يمكنك استخدام مكتبة مثل lucide-react لاحقاً)
const MenuIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const PlusIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const SendIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;

export default function ChatInterface() {
  const { messages, isLoading, sendMessage, loadHistory, clearChat, sessionId } = useChatStream();
  const [text, setText] = useState('');
  const [sessions, setSessions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // للتحكم في ظهور القائمة
  
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  // 1. تحميل قائمة الجلسات عند فتح الموقع
  const loadSessionsList = async () => {
    const guestId = await getGuestId();
    if (guestId) {
      try {
        const res = await fetchUserSessions(guestId);
        setSessions(res.data);
      } catch (err) {
        console.error("Error loading sessions:", err);
      }
    }
  };

  useEffect(() => {
    loadHistory(); // تحميل المحادثة الحالية (إن وجدت)
    loadSessionsList(); // تحميل القائمة الجانبية
  }, []);

  // تحديث القائمة الجانبية كلما تغيرت الجلسة (مثلاً بعد أول رسالة في شات جديد)
  useEffect(() => {
    if (sessionId) {
        loadSessionsList();
    }
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [text]);

  const handleSend = async () => {
    if (!text.trim() || isLoading) return;
    const currentText = text;
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
    await sendMessage(currentText);
    // بعد الإرسال، نحدث القائمة لأن العنوان قد يتغير أو جلسة جديدة تنشأ
    loadSessionsList(); 
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    clearChat();
    if (window.innerWidth < 768) setIsSidebarOpen(false); // إغلاق القائمة في الموبايل
  };

  const handleSelectSession = (id) => {
    localStorage.setItem('last_session_id', id);
    window.location.reload(); // أسهل طريقة حالياً لعمل Reset للـ Hooks
    // ملاحظة: الحل الأفضل مستقبلاً هو تعديل Hook ليدعم تغيير ID بدون Reload
  };

  const handleDeleteSession = async (e, idToDelete) => {
    e.stopPropagation(); // منع فتح الجلسة عند الضغط على الحذف
    if(!confirm("Delete this chat?")) return;

    const guestId = await getGuestId();
    try {
        await deleteSession(guestId, idToDelete);
        setSessions(prev => prev.filter(s => s.id !== idToDelete));
        
        // إذا حذفت الجلسة المفتوحة حالياً، ابدأ واحدة جديدة
        if (idToDelete === sessionId) {
            clearChat();
        }
    } catch (err) {
        console.error("Failed to delete", err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f0f4f9] text-[#1f1f1f] overflow-hidden font-sans">
      
      {/* === SIDEBAR === */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#f0f4f9] transform transition-transform duration-300 ease-in-out border-r border-gray-200/50
        md:relative md:translate-x-0 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-none'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between">
            <button 
                onClick={handleNewChat}
                className="flex items-center gap-3 px-4 py-3 bg-[#dde3ea] hover:bg-white rounded-xl text-sm font-medium transition-colors text-[#444746] w-full"
            >
                <PlusIcon />
                <span>New chat</span>
            </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
            <div className="px-3 py-2 text-xs font-medium text-gray-500">Recent</div>
            {sessions.map(session => (
                <div 
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`
                        group flex items-center justify-between px-3 py-2 rounded-full cursor-pointer text-sm truncate
                        ${sessionId === session.id ? 'bg-[#c2e7ff] text-[#001d35] font-semibold' : 'hover:bg-[#e6eaf1] text-[#444746]'}
                    `}
                >
                    <span className="truncate flex-1 pr-2">
                        {session.title || "Untitled Chat"}
                    </span>
                    
                    {/* Delete Button (Visible on Hover or Active) */}
                    <button 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className={`p-1.5 rounded-full hover:bg-gray-300 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity ${sessionId === session.id ? 'opacity-100 hover:bg-[#b3d7ef]' : ''}`}
                        title="Delete chat"
                    >
                        <TrashIcon />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* === MAIN CHAT AREA === */}
      <div className="flex-1 flex flex-col relative h-full w-full">
        
        {/* Top Navbar (Mobile Menu & Title) */}
        <div className="h-16 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-gray-200 text-gray-600">
                    <MenuIcon />
                </button>
                <span className="text-lg font-medium text-gray-600">Gemini Clone</span>
            </div>
        </div>

        {/* Chat Messages */}
        <div ref={listRef} className="flex-1 overflow-y-auto w-full">
            <div className="max-w-3xl mx-auto px-4 pb-32 pt-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center mt-20 opacity-80 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-gradient-to-tr from-blue-400 to-red-400 rounded-full blur-2xl opacity-40 mb-6"></div>
                        <h1 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent mb-4">
                            Hello, Human
                        </h1>
                        <p className="text-xl text-gray-400">How can I help you shop today?</p>
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
                
                {isLoading && messages[messages.length-1]?.role === 'user' && (
                    <div className="flex gap-4 mt-6 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-red-500"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Input Area (Bottom Fixed) */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#f0f4f9] via-[#f0f4f9] to-transparent pt-10 pb-6 px-4">
            <div className="max-w-3xl mx-auto bg-[#f0f4f9]">
                <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm flex items-end p-2 focus-within:shadow-md focus-within:border-gray-300 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter a prompt here"
                        className="flex-1 max-h-[150px] bg-transparent border-none outline-none resize-none py-3 px-4 text-base text-gray-800 placeholder-gray-400"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!text.trim() || isLoading}
                        className={`p-3 m-1 rounded-full transition-all duration-200 ${text.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <SendIcon />}
                    </button>
                </div>
                <div className="text-center text-xs text-gray-400 mt-3">
                    AI Shopping Agent can make mistakes. Check important info.
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}


