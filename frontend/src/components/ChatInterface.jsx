// ai-shopping-search/frontend/src/components/ChatInterface.jsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/solid'
import { useChatStream } from '../hooks/useChatStream'
import { fetchUserSessions, deleteSession, deleteMessage, renameSession, deleteAccount } from '../services/api' 
import { getGuestId, clearGuestId } from '../services/guest'

import Sidebar from './Sidebar'
import Header from './Header'
import MessageBubble from './MessageBubble'
import SavedProductsModal from './SavedProductsModal'
import ConfirmationModal from './ConfirmationModal'
import RenameModal from './RenameModal'
import SettingsModal from './SettingsModal'
import ProductDetailsModal from './ProductDetailsModal' // Import New Modal

export default function ChatInterface() {
  const { messages, setMessages, isLoading, sendMessage, clearChat, sessionId } = useChatStream();
  const [text, setText] = useState('');
  const [sessions, setSessions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [guestId, setGuestIdState] = useState(null);
  
  // Modals State
  const [showMyStuff, setShowMyStuff] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null); // Track selected product
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, isDanger: false });
  const [renameModal, setRenameModal] = useState({ isOpen: false, id: null, currentTitle: '' });
  
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  // Init Data
  useEffect(() => {
    const initData = async () => {
      const id = await getGuestId();
      if (id) {
          setGuestIdState(id);
          fetchUserSessions(id).then(res => setSessions(res.data));
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (guestId) {
        setTimeout(() => {
            fetchUserSessions(guestId).then(res => setSessions(res.data));
        }, 1500); 
    }
  }, [sessionId, guestId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isLoading]);

  // --- Handlers ---

  const handleViewDetails = (product) => {
      setViewingProduct(product);
  };

  const handleRenameConfirm = async (newTitle) => {
      if(!newTitle.trim()) return;
      try {
          await renameSession(guestId, renameModal.id, newTitle);
          setSessions(prev => prev.map(s => s.id === renameModal.id ? { ...s, title: newTitle } : s));
          setRenameModal({ ...renameModal, isOpen: false });
      } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = (msgId) => {
    setConfirmModal({
        isOpen: true,
        title: 'Delete Message',
        message: 'Remove this message?',
        isDanger: true,
        action: async () => {
            try {
                await deleteMessage(guestId, msgId);
                setMessages(prev => prev.filter(m => m.id !== msgId)); 
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            } catch (error) { console.error(error); }
        }
    });
  };

  const handleDeleteSession = (id) => {
     setConfirmModal({
        isOpen: true,
        title: 'Delete Chat',
        message: 'Permanently delete this chat?',
        isDanger: true,
        action: async () => {
            try {
                await deleteSession(guestId, id);
                setSessions(prev => prev.filter(s => s.id !== id));
                if (id === sessionId) clearChat();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            } catch (e) { console.error(e); }
        }
    });
  };

  const handleDeleteAccountRequest = () => {
      setShowSettings(false);
      setConfirmModal({
          isOpen: true,
          title: 'Delete Account',
          message: 'This will wipe all history and saved items. Cannot be undone.',
          isDanger: true,
          action: async () => {
              await deleteAccount(guestId);
              clearGuestId();
              window.location.reload();
          }
      });
  };

  const handleSend = async () => {
     if (!text.trim() || isLoading) return;
     const t = text; setText(''); 
     if (textareaRef.current) textareaRef.current.style.height = '52px';
     await sendMessage(t);
  };

  return (
    <div className="flex h-screen w-full bg-[#f0f4f9] text-[#1f1f1f] overflow-hidden font-sans">
      
      <Sidebar 
        sessions={sessions} 
        currentSessionId={sessionId}
        isOpen={isSidebarOpen}
        onSelectSession={(id) => { localStorage.setItem('last_session_id', id); window.location.reload(); }}
        onNewChat={clearChat}
        onTriggerDelete={handleDeleteSession}
        onTriggerRename={(id) => setRenameModal({ isOpen: true, id, currentTitle: sessions.find(s=>s.id===id)?.title || '' })}
        onOpenMyStuff={() => setShowMyStuff(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="flex-1 flex flex-col relative h-full w-full bg-white md:bg-[#f0f4f9] md:rounded-tl-3xl md:rounded-bl-3xl md:ml-0 shadow-2xl overflow-hidden">
        
        <Header 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            title={sessions.find(s => s.id === sessionId)?.title}
            isGuest={true} 
            guestId={guestId}
        />

        <div ref={listRef} className="flex-1 overflow-y-auto w-full custom-scrollbar bg-white rounded-3xl md:m-4 md:mt-0 shadow-sm border border-gray-100">
            <div className="max-w-4xl mx-auto px-4 pb-40 pt-24">
                {messages.map((m, i) => (
                    <MessageBubble 
                        key={m.id || i} 
                        id={m.id}
                        text={m.content} 
                        isUser={m.role === 'user'} 
                        products={m.products}
                        onDelete={handleDeleteMessage}
                        onViewDetails={handleViewDetails} // Pass the handler
                    />
                ))}
            </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-6 pt-10 bg-gradient-to-t from-white via-white to-transparent">
             <div className="max-w-4xl mx-auto">
                <div className="bg-[#f0f4f9] rounded-[28px] border border-gray-200 flex items-end p-2 pl-4 focus-within:shadow-md focus-within:bg-white transition-all duration-200">
                    <button className="p-3 mb-1 rounded-full bg-[#dce3e9] hover:bg-gray-300 text-gray-600"><PlusIcon className="w-5 h-5"/></button>
                    <textarea 
                        ref={textareaRef}
                        value={text} 
                        onChange={e => {
                            setText(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                        }} 
                        onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                        className="flex-1 bg-transparent border-none outline-none resize-none py-3.5 px-4 text-base text-gray-800 placeholder-gray-500 min-h-[52px] max-h-[200px]"
                        placeholder="Ask anything..." rows={1}
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={!text.trim()} className="p-3 mb-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"><PaperAirplaneIcon className="w-6 h-6"/></button>
                </div>
             </div>
        </div>
      </div>

      {/* --- ALL MODALS --- */}
      <SavedProductsModal isOpen={showMyStuff} onClose={() => setShowMyStuff(false)} />
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        guestId={guestId}
        onDeleteAccount={handleDeleteAccountRequest}
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        isDanger={confirmModal.isDanger}
      />

      <RenameModal 
        isOpen={renameModal.isOpen}
        currentTitle={renameModal.currentTitle}
        onClose={() => setRenameModal({ ...renameModal, isOpen: false })}
        onRename={handleRenameConfirm}
      />

      {/* Product Details Popup */}
      <ProductDetailsModal 
        isOpen={!!viewingProduct}
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
      />
    </div>
  )
}