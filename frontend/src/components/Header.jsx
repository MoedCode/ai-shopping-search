//ai-shopping-search/frontend/src/components/Header.jsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { UserCircleIcon, Bars3Icon, ChevronDownIcon } from '@heroicons/react/24/solid'

export default function Header({ toggleSidebar, title, isGuest, guestId }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-16 flex items-center justify-between px-4 sticky top-0 bg-[#f0f4f9]/90 backdrop-blur z-30">
        <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-200 md:hidden">
                <Bars3Icon className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-medium text-gray-600 flex items-center gap-2">
                {title || "Gemini Shopping"}
            </h1>
        </div>

        {/* User Profile / Menu */}
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 hover:bg-gray-200 pr-2 pl-1 py-1 rounded-full transition-colors"
            >
                <UserCircleIcon className="w-9 h-9 text-gray-400" />
            </button>

            {isMenuOpen && (
                // === FIX: Dropdown styling and Z-Index ===
                <div className="absolute right-0 mt-2 w-80 bg-[#eef2f6] rounded-[28px] shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    
                    <div className="bg-white rounded-[20px] p-4 shadow-sm text-center mb-2">
                        <p className="text-sm font-medium text-gray-800 break-all">{guestId ? `Guest: ${guestId.slice(0,8)}...` : 'User'}</p>
                        <p className="text-xs text-gray-500 mb-4">{isGuest ? 'Guest Session' : 'example@email.com'}</p>
                        
                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                             👤
                        </div>
                        
                        <h3 className="text-xl font-normal text-gray-800 mb-4">Hi, Human!</h3>
                        
                        <button className="border border-gray-300 text-blue-600 text-sm font-medium px-6 py-2 rounded-full hover:bg-blue-50 transition-colors w-full mb-2">
                            Manage Account
                        </button>
                        
                        <div className="flex gap-2 mt-2">
                            <button className="flex-1 bg-[#f8f9fa] border border-gray-200 text-sm py-3 rounded-l-[18px] rounded-r-sm hover:bg-gray-100 transition-colors">
                                Add account
                            </button>
                            <button className="flex-1 bg-[#f8f9fa] border border-gray-200 text-sm py-3 rounded-r-[18px] rounded-l-sm hover:bg-gray-100 transition-colors">
                                Sign out
                            </button>
                        </div>
                    </div>

                    <div className="text-center text-xs text-gray-500 mt-2">
                        Privacy Policy • Terms of Service
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}