//ai-shopping-search/frontend/src/components/SettingsModal.jsx
'use client'
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function SettingsModal({ isOpen, onClose, guestId, onDeleteAccount }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Options</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
        </div>

        <div className="p-6">
            {/* User Info */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full mb-3 p-1 border-2 border-white shadow-sm overflow-hidden">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId || 'Guest'}`} 
                        alt="Profile" 
                        className="w-full h-full"
                    />
                </div>
                <h4 className="text-xl font-bold text-gray-800">Guest User</h4>
                <div className="mt-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 font-mono">
                       Your ID: {guestId}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <button 
                    onClick={onDeleteAccount}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium py-3 rounded-xl transition-all shadow-sm"
                >
                    <TrashIcon className="w-5 h-5" />
                    Delete Account
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}