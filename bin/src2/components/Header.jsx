//ai-shopping-search/frontend/src/components/Header.jsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { UserCircleIcon, Bars3Icon } from '@heroicons/react/24/solid'
import { logoutUser, deleteAccount } from '../services/api'
import { clearGuestId } from '../services/guest'
import AuthModal from './AuthModal' // استيراد المودال الجديد

export default function Header({ toggleSidebar, title, isGuest, guestId }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const buttonRef = useRef(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event) {
      if (isMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // تسجيل الخروج
  const handleLogout = async () => {
      try {
          await logoutUser();
          clearGuestId(); // مسح الكوكيز
          window.location.reload();
      } catch(err) {
          console.error("Logout failed", err);
      }
  };

  // حذف الحساب
  const handleDeleteAccount = async () => {
      if(confirm("⚠️ Delete Account?\nThis action is irreversible. All chats and saved items will be lost.")) {
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
    <div className="h-16 flex items-center justify-between px-4 sticky top-0 bg-[#f0f4f9]/95 backdrop-blur z-30">
        <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-200 md:hidden">
                <Bars3Icon className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-medium text-gray-600 flex items-center gap-2">
                {title || "Gemini Shopping"}
            </h1>
        </div>

        {/* User Profile Area */}
        <div className="user-menu-container">
            <button 
                ref={buttonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 transition-colors border border-gray-200"
            >
                {/* صورة مختلفة إذا كان زائراً أو عضواً */}
                <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isGuest ? 'Guest' : guestId}`} 
                    alt="Profile" 
                    className="w-full h-full rounded-full"
                />
            </button>

            {/* === القائمة العائمة (Fixed Solution) === */}
            {/* استخدام fixed يخرج القائمة من حدود الهيدر وبالتالي تظهر كاملة */}
            {isMenuOpen && (
                <div 
                    className="fixed top-16 right-4 w-[320px] bg-[#e9eef6] rounded-[28px] shadow-2xl border border-white/50 p-4 z-[9999] animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                    style={{ filter: 'drop-shadow(0px 10px 40px rgba(0,0,0,0.2))' }}
                >
                    {/* زر إغلاق صغير */}
                    <button 
                        onClick={() => setIsMenuOpen(false)}
                        className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 text-gray-400"
                    >
                        ✕
                    </button>

                    <div className="bg-white rounded-[24px] p-5 shadow-sm text-center mb-2">
                        <p className="text-xs text-gray-500 mb-4 font-semibold tracking-wide uppercase">
                            {isGuest ? 'Guest Account' : 'Verified Account'}
                        </p>
                        
                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-3 overflow-hidden border-4 border-[#e9eef6]">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isGuest ? 'Guest' : guestId}`} alt="Avatar" />
                        </div>
                        
                        <h3 className="text-lg font-medium text-gray-800 mb-1">
                            {isGuest ? 'Welcome, Guest!' : 'Welcome Back!'}
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 break-all px-2">{guestId}</p>
                        
                        {/* زر تسجيل الدخول يظهر فقط للزوار */}
                        {isGuest && (
                            <button 
                                onClick={() => { setIsMenuOpen(false); setAuthModalOpen(true); }}
                                className="border border-gray-300 text-blue-600 text-sm font-medium px-6 py-2.5 rounded-full hover:bg-blue-50 transition-colors w-full mb-3"
                            >
                                Sign In / Sign Up
                            </button>
                        )}
                        
                        {/* أزرار التحكم */}
                        <div className="flex flex-col gap-1 w-full">
                            {!isGuest && (
                                <button 
                                    onClick={handleLogout}
                                    className="w-full bg-[#f8f9fa] hover:bg-gray-100 text-sm py-3 rounded-xl text-gray-700 transition-colors font-medium"
                                >
                                    Sign Out
                                </button>
                            )}
                            
                            <button 
                                onClick={handleDeleteAccount}
                                className="w-full bg-white hover:bg-red-50 text-sm py-3 rounded-xl text-red-600 transition-colors font-medium"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>

                    <div className="text-center text-[10px] text-gray-400 mt-2">
                        Privacy Policy • Terms of Service
                    </div>
                </div>
            )}
        </div>
    </div>

    {/* نافذة تسجيل الدخول */}
    <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
            // إعادة تحميل الصفحة لتحديث البيانات وحالة المستخدم
            window.location.reload();
        }}
    />
    </>
  )
}