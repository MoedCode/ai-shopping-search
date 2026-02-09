//ai-shopping-search/frontend/src/components/RenameModal.jsx
'use client'
import { useState, useEffect } from 'react'

export default function RenameModal({ isOpen, onClose, onRename, currentTitle }) {
  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    setTitle(currentTitle);
  }, [currentTitle, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform scale-100 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Rename Chat</h3>
        <p className="text-sm text-gray-500 mb-5">Enter a new name for this conversation.</p>
        
        <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all mb-6"
            autoFocus
            onKeyDown={(e) => {
                if(e.key === 'Enter') onRename(title);
                if(e.key === 'Escape') onClose();
            }}
        />
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onRename(title)}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
          >
            Save Name
          </button>
        </div>
      </div>
    </div>
  )
}