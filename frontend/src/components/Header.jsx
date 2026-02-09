//ai-shopping-search/frontend/src/components/Header.jsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { Bars3Icon } from '@heroicons/react/24/solid'
import { logoutUser } from '../services/api'
import { clearGuestId } from '../services/guest'
import AuthModal from './AuthModal'

export default function Header({ toggleSidebar, isGuest, guestId, title }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const buttonRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  // 1. Calculate Fixed Position (Solves "Hiding Behind Chat")
  useEffect(() => {
      if (isMenuOpen && buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setMenuStyle({
              position: 'fixed', 
              top: `${rect.bottom + 8}px`, // 8px gap below button
              left: `${rect.left}px`,
              zIndex: 9999 // Force on top
          });
      }
  }, [isMenuOpen]);

  // Click Outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (isMenuOpen && !event.target.closest('.user-menu-fixed') && !event.target.closest('.user-profile-btn')) {
        setIsMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", () => setIsMenuOpen(false), true); // Close on scroll
    return () => {
        window.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", () => setIsMenuOpen(false), true);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
      try { await logoutUser(); clearGuestId(); window.location.reload(); } catch(err) {}
  };

  return (
    <>
    {/* Transparent Header */}
    <div className="h-16 flex items-center justify-between px-4 md:px-6 absolute top-0 w-full z-30 pointer-events-none bg-transparent">
        
        {/* LEFT: Sidebar Toggle & Profile */}
        <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-gray-200/50 md:hidden text-gray-600">
                <Bars3Icon className="w-6 h-6" />
            </button>
            
            {/* Profile Button */}
            <button 
                ref={buttonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="user-profile-btn flex items-center justify-center w-10 h-10 rounded-full hover:opacity-80 transition-opacity overflow-hidden ring-2 ring-white shadow-sm bg-white cursor-pointer"
            >
                <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isGuest ? 'Guest' : guestId}`} 
                    alt="Profile" 
                    className="w-full h-full"
                />
            </button>
        </div>

        {/* CENTER: Chat Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-auto">
            {title && (
                <div className="px-4 py-1.5 bg-white/60 backdrop-blur-md rounded-full shadow-sm border border-white/50">
                    <h1 className="text-sm font-medium text-gray-700 truncate max-w-[150px] md:max-w-[300px]">
                        {title}
                    </h1>
                </div>
            )}
        </div>

        {/* RIGHT: Logo */}
        <div className="flex items-center pointer-events-auto">
             <span className="text-xs font-bold text-gray-400 tracking-widest uppercase select-none">
                AH Shopping Assistant
            </span>
        </div>
    </div>

    {/* FIXED MENU DROPDOWN */}
    {isMenuOpen && (
        <div 
            className="user-menu-fixed w-[260px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-200"
            style={menuStyle}
        >
            <div className="flex justify-between items-start mb-4">
                 <div>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">
                        {isGuest ? 'Guest Mode' : 'Signed In'}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-800">
                        {isGuest ? 'Guest User' : `User`}
                    </h3>
                    {/* Guest ID Display */}
                    <div className="mt-1 inline-block bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        <p className="text-[10px] text-gray-500 font-mono break-all">
                            ID: {guestId ? guestId.slice(0, 12) + "..." : "..."}
                        </p>
                    </div>
                 </div>
                 <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            {isGuest ? (
                <button 
                    onClick={() => { setIsMenuOpen(false); setAuthModalOpen(true); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-blue-200"
                >
                    Sign In / Sign Up
                </button>
            ) : (
                <button onClick={handleLogout} className="w-full bg-gray-50 hover:bg-gray-100 text-xs py-2 rounded-lg text-gray-700 transition-colors font-medium border border-gray-100">Sign Out</button>
            )}
        </div>
    )}

    <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} onLoginSuccess={() => window.location.reload()} />
    </>
  )
}