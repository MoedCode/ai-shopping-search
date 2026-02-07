//ai-shopping-search/frontend/src/components/Sidebar.jsx
'use client'
import { TrashIcon, ChatBubbleLeftIcon, PlusIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'

export default function Sidebar({ sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession, onOpenMyStuff, isOpen }) {
  return (
    <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#f0f4f9] border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col
    `}>
      {/* New Chat Button */}
      <div className="p-4">
        <button 
            onClick={onNewChat}
            className="flex items-center gap-3 px-4 py-3 bg-[#dde3ea] hover:bg-white rounded-xl text-sm font-medium transition-all text-[#444746] w-full shadow-sm hover:shadow-md"
        >
            <PlusIcon className="w-5 h-5" />
            <span>New Chat</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</div>
        
        {sessions.map(session => (
            <div 
                key={session.id}
                className={`
                    group flex items-center justify-between px-3 py-2 rounded-full cursor-pointer text-sm
                    ${currentSessionId === session.id ? 'bg-[#c2e7ff] text-[#001d35] font-semibold' : 'hover:bg-[#e6eaf1] text-[#444746]'}
                `}
                onClick={() => onSelectSession(session.id)}
            >
                <div className="flex items-center gap-2 truncate overflow-hidden">
                    <ChatBubbleLeftIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{session.title || "New Conversation"}</span>
                </div>
                
                {/* Delete Button */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    className={`p-1.5 rounded-full hover:bg-gray-300 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity ${currentSessionId === session.id ? 'opacity-100 hover:bg-[#b3d7ef]' : ''}`}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        ))}
      </div>

      {/* Footer / My Stuff Link */}
      <div className="p-4 border-t border-gray-200">
         <button 
            onClick={onOpenMyStuff} // <--- هذا هو الرابط المفقود!
            className="flex items-center gap-3 px-3 py-2 w-full text-sm text-[#444746] hover:bg-[#e6eaf1] rounded-lg transition-colors"
         >
            <ArchiveBoxIcon className="w-5 h-5" />
            <span>My Stuff (Saved Items)</span>
         </button>
      </div>
    </div>
  )
}