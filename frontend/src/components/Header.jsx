//ai-shopping-search/frontend/src/components/Header.jsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { UserCircleIcon, Bars3Icon } from '@heroicons/react/24/solid'
import { logoutUser, deleteAccount } from '../services/api'
import { clearGuestId } from '../services/guest'
import AuthModal from './AuthModal'

export default function Header({ toggleSidebar, title, isGuest, guestId }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 }); // نستخدم left بدلاً من right
  const buttonRef = useRef(null);

  // تحديث مكان القائمة بناءً على مكان الزر
  const updateMenuPosition = () => {
      if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setMenuPosition({
              top: rect.bottom + 10, // أسفل الزر بـ 10px
              left: rect.left // محاذاة لليسار مع الزر
          });
      }
  };

  useEffect(() => {
    if (isMenuOpen) {
        updateMenuPosition();
        window.addEventListener('resize', updateMenuPosition);
        window.addEventListener('scroll', updateMenuPosition);
    }
    return () => {
        window.removeEventListener('resize', updateMenuPosition);
        window.removeEventListener('scroll', updateMenuPosition);
    };
  }, [isMenuOpen]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event) {
      if (isMenuOpen && !event.target.closest('.user-menu-fixed') && !event.target.closest('.user-profile-btn')) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = async () => {
      try {
          await logoutUser();
          clearGuestId();
          window.location.reload();
      } catch(err) {
          console.error("Logout failed", err);
      }
  };

  const handleDeleteAccount = async () => {
      if(confirm("⚠️ Delete Account?\nThis action is irreversible.")) {
          try {
            await deleteAccount(guestId);
            clearGuestId();
            window.location.reload();
          } catch(err) {
              alert("Failed to delete account");
          }
      }
  };

  return (
    <>
    <div className="h-16 flex items-center justify-between px-4 sticky top-0 bg-[#f0f4f9]/95 backdrop-blur z-30 border-b border-gray-200/50">
        <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-200 md:hidden">
                <Bars3Icon className="w-6 h-6 text-gray-600" />
            </button>
            
            {/* User Profile Button - Moved here as per your image */}
            <button 
                ref={buttonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="user-profile-btn flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 transition-colors border border-gray-200 overflow-hidden"
            >
                <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isGuest ? 'Guest' : guestId}`} 
                    alt="Profile" 
                    className="w-full h-full"
                />
            </button>
        </div>

        <h1 className="text-lg font-medium text-gray-600 absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
            {title || "Gemini Shopping"}
        </h1>
        
        <div className="w-10"></div> {/* Spacer to center title */}
    </div>

    {/* === القائمة العائمة (Fixed + Dynamic Position) === */}
    {isMenuOpen && (
        <div 
            className="user-menu-fixed fixed w-[300px] bg-[#e9eef6] rounded-[24px] shadow-2xl border border-white/60 p-4 z-[9999] animate-in fade-in zoom-in-95 duration-200"
            style={{ 
                top: `${menuPosition.top}px`, 
                left: `${menuPosition.left}px`,
                filter: 'drop-shadow(0px 10px 40px rgba(0,0,0,0.2))'
            }}
        >
            {/* زر إغلاق */}
            <button 
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 text-gray-400"
            >
                ✕
            </button>

            <div className="bg-white rounded-[20px] p-5 shadow-sm text-center mb-2">
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-4">
                    {isGuest ? 'Guest Mode' : 'Signed In'}
                </p>
                
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 overflow-hidden border-2 border-[#e9eef6]">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isGuest ? 'Guest' : guestId}`} alt="Avatar" />
                </div>
                
                <h3 className="text-base font-semibold text-gray-800 mb-0.5">
                    {isGuest ? 'Guest User' : `Hi, ${guestId?.split('-')[0]}!`}
                </h3>
                <p className="text-xs text-gray-400 mb-5 break-all px-2">{isGuest ? 'History saves locally' : guestId}</p>
                
                {isGuest && (
                    <button 
                        onClick={() => { setIsMenuOpen(false); setAuthModalOpen(true); }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors mb-3 shadow-md shadow-blue-200"
                    >
                        Sign In / Sign Up
                    </button>
                )}
                
                <div className="space-y-1">
                    {!isGuest && (
                        <button 
                            onClick={handleLogout}
                            className="w-full bg-gray-50 hover:bg-gray-100 text-sm py-2.5 rounded-xl text-gray-700 transition-colors font-medium border border-gray-100"
                        >
                            Sign Out
                        </button>
                    )}
                    <button 
                        onClick={handleDeleteAccount}
                        className="w-full bg-white hover:bg-red-50 text-sm py-2.5 rounded-xl text-red-600 transition-colors font-medium border border-transparent hover:border-red-100"
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            <div className="flex justify-center gap-3 text-[10px] text-gray-400 mt-2">
                <a href="#" className="hover:text-gray-600">Privacy</a>
                <span>•</span>
                <a href="#" className="hover:text-gray-600">Terms</a>
            </div>
        </div>
    )}

    <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={() => window.location.reload()}
    />
    </>
  )
}