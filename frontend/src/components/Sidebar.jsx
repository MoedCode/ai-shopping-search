//ai-shopping-search/frontend/src/components/Sidebar.jsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { TrashIcon, ChatBubbleLeftIcon, PlusIcon, ArchiveBoxIcon, EllipsisHorizontalIcon, PencilSquareIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

export default function Sidebar({ sessions, currentSessionId, onSelectSession, onNewChat, onTriggerDelete, onTriggerRename, onOpenMyStuff, onOpenSettings, isOpen }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  // Calculate Fixed Position for Menu (Prevents clipping)
  const handleMenuClick = (e, sessionId) => {
      e.stopPropagation();
      if (openMenuId === sessionId) {
          setOpenMenuId(null);
      } else {
          const rect = e.currentTarget.getBoundingClientRect();
          setMenuPos({ 
              top: rect.bottom + 5, 
              left: rect.left 
          });
          setOpenMenuId(sessionId);
      }
  };

  // Close menu on scroll or click outside
  useEffect(() => {
    const close = () => setOpenMenuId(null);
    if(openMenuId) {
        window.addEventListener('click', close);
        window.addEventListener('scroll', close, true); // capture scroll
    }
    return () => {
        window.removeEventListener('click', close);
        window.removeEventListener('scroll', close, true);
    };
  }, [openMenuId]);

  return (
    <>
    <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#f0f4f9] border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-lg md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 
    `}>
      <div className="p-4 pt-6 space-y-2">
        <button 
            onClick={onNewChat}
            className="flex items-center gap-3 px-4 py-3 bg-[#dde3ea] hover:bg-white rounded-xl text-sm font-medium transition-all text-[#444746] w-full shadow-sm hover:shadow-md"
        >
            <PlusIcon className="w-5 h-5" />
            <span>New Chat</span>
        </button>

        <button 
            onClick={onOpenMyStuff}
            className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium transition-all text-[#444746] w-full"
        >
            <ArchiveBoxIcon className="w-5 h-5 text-blue-500" />
            <span>My Stuff</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar pb-4">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">Recent Chats</div>
        
        {sessions.map(session => (
            <div 
                key={session.id}
                className={`
                    group flex items-center justify-between px-3 py-2 rounded-full cursor-pointer text-sm transition-colors relative
                    ${currentSessionId === session.id ? 'bg-[#c2e7ff] text-[#001d35] font-semibold' : 'hover:bg-[#e6eaf1] text-[#444746]'}
                `}
                onClick={() => {
                    // Prevent reload if clicking active session
                    if (session.id !== currentSessionId) onSelectSession(session.id);
                }}
            >
                <div className="flex items-center gap-2 truncate overflow-hidden flex-1">
                    <ChatBubbleLeftIcon className="w-4 h-4 flex-shrink-0 opacity-70" />
                    <span className="truncate">{session.title || "New Conversation"}</span>
                </div>

                <button 
                    onClick={(e) => handleMenuClick(e, session.id)}
                    className={`p-1 rounded-full hover:bg-black/10 transition-opacity ${openMenuId === session.id ? 'opacity-100 bg-black/10' : 'opacity-0 group-hover:opacity-100'}`}
                >
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                </button>
            </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
          <button 
             onClick={onOpenSettings}
             className="flex items-center gap-3 px-3 py-2 w-full text-sm text-[#444746] hover:bg-[#e6eaf1] rounded-lg transition-colors"
          >
             <Cog6ToothIcon className="w-5 h-5" />
             <span>Settings</span>
          </button>
      </div>
    </div>

    {/* FIXED MENU PORTAL */}
    {openMenuId && (
        <div 
            className="fixed w-40 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100 py-1"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}
        >
            <button 
                onClick={() => { onTriggerRename(openMenuId); setOpenMenuId(null); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 text-left"
            >
                <PencilSquareIcon className="w-4 h-4 text-gray-500" /> Rename
            </button>
            <button 
                onClick={() => { onTriggerDelete(openMenuId); setOpenMenuId(null); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left border-t border-gray-50"
            >
                <TrashIcon className="w-4 h-4" /> Delete
            </button>
        </div>
    )}
    </>
  )
}