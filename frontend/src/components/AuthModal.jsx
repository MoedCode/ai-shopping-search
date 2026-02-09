//ai-shopping-search/frontend/src/components/AuthModal.jsx
'use client'
import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { authenticateUser, socialLogin } from '../services/api'
import { getGuestId } from '../services/guest'
import { XMarkIcon } from '@heroicons/react/24/solid'

// --- Icons ---
const GoogleIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M24 12.276c0-.816-.066-1.603-.188-2.374H12.24v4.527h6.639c-.292 1.545-1.163 2.852-2.457 3.732v3.082h3.957c2.316-2.133 3.653-5.276 3.653-8.967z"/><path fill="#34A853" d="M12.24 24c3.24 0 5.957-1.063 7.942-2.906l-3.957-3.082c-1.077.733-2.466 1.157-3.985 1.157-3.083 0-5.69-2.079-6.623-4.887H1.936v3.096C3.96 21.442 7.79 24 12.24 24z"/><path fill="#FBBC05" d="M5.617 14.282c-.237-.717-.373-1.482-.373-2.282s.136-1.565.373-2.282V6.622H1.936C.703 9.083 0 11.91 0 15c0 3.09.703 5.917 1.936 8.378l3.681-3.096z"/><path fill="#4285F4" d="M12.24 4.75c1.722 0 3.272.597 4.512 1.774l3.35-3.35C17.952 1.19 15.316 0 12.24 0 7.79 0 3.96 2.558 1.936 6.622l3.681 3.096c.933-2.808 3.54-4.887 6.623-4.887z"/></svg>;
const AppleIcon = () => <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 19.35c-1.11 2.3-3.64 2.13-5.26.54-1.63-1.6-3.72-1.39-4.77.54-3.05-3.32-4.14-8.75-.4-11.62 2.33-1.8 4.79-1.4 6.13.3 1.34 1.7 3.39 1.5 4.92.2 1.05-.9 1.7-2.2 1.9-2.9-4.15 1.5-6.35 5.6-5.52 9.2-.5 2.15-1.55 4.3-2.9 6.25zM12.05 2c.2 2.5-2.2 5.1-4.7 5.3-.6-2.5 2.7-5.3 4.7-5.3z"/></svg>;
const MicrosoftIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>;
const PasskeyIcon = () => <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
    const [view, setView] = useState('providers'); // 'providers' or 'standard'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Google Login Flow ---
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                // Send the token to Django Backend
                const res = await socialLogin('google', tokenResponse.access_token);
                onLoginSuccess(res.data.user || res.data); // Adjust based on Django response
                onClose();
            } catch (err) {
                console.error("Google Auth Error:", err);
                setError("Google Login failed via server.");
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError("Google Popup Failed"),
    });

    // --- Placeholder Handlers for Other Providers ---
    const handleProviderClick = (provider) => {
        // Since we only have Google configured right now
        if (provider === 'Google') {
            handleGoogleLogin();
        } else {
            setError(`${provider} login requires backend configuration keys.`);
            setTimeout(() => setError(''), 4000);
        }
    };

    // --- Standard Login Flow ---
    const handleStandardLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const guestId = await getGuestId();
            // Convert simple username to dummy email for Django
            const cleanUser = username.trim().replace(/\s+/g, '.');
            const dummyEmail = `${cleanUser}@store.local`;

            const res = await authenticateUser(dummyEmail, password, guestId);
            onLoginSuccess(res.data.user);
            onClose();
        } catch (err) {
            setError("Login failed. Username may be taken or incorrect.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] w-full max-w-[400px] shadow-2xl p-8 relative overflow-hidden">
                
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="text-center mb-8 mt-2">
                    <h2 className="text-[28px] font-normal text-gray-800 mb-2 font-sans">Log in or sign up</h2>
                    <p className="text-sm text-gray-500">
                        You'll get smarter responses and can upload files.
                    </p>
                </div>

                {/* Main View: List of Providers */}
                {view === 'providers' ? (
                    <div className="space-y-3">
                         {error && (
                            <div className="mb-2 p-2 bg-blue-50 text-blue-600 text-xs rounded-lg text-center border border-blue-100">
                                {error}
                            </div>
                        )}

                        <button 
                            onClick={() => handleProviderClick('Google')}
                            className="w-full flex items-center justify-between py-3 px-6 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-600 font-medium bg-white"
                        >
                            <span>Continue with Google</span>
                            <GoogleIcon />
                        </button>

                        <button 
                            onClick={() => handleProviderClick('Apple')}
                            className="w-full flex items-center justify-between py-3 px-6 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-600 font-medium bg-white"
                        >
                            <span>Continue with Apple</span>
                            <AppleIcon />
                        </button>
                        
                        <button 
                            onClick={() => handleProviderClick('Microsoft')}
                            className="w-full flex items-center justify-between py-3 px-6 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-600 font-medium bg-white"
                        >
                            <span>Continue with Microsoft</span>
                            <MicrosoftIcon />
                        </button>

                        <button 
                            onClick={() => handleProviderClick('Passkey')}
                            className="w-full flex items-center justify-between py-3 px-6 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-600 font-medium bg-white"
                        >
                            <span>Passkey / YubiKey</span>
                            <PasskeyIcon />
                        </button>
                        
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                            <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-gray-400">OR</span></div>
                        </div>

                        <button 
                            onClick={() => setView('standard')}
                            className="w-full py-3 px-4 bg-[#1f1f1f] text-white rounded-full hover:bg-black transition-colors font-medium shadow-lg shadow-gray-200"
                        >
                            Standard Login (Username)
                        </button>
                    </div>
                ) : (
                    // Secondary View: Standard Login Form
                    <form onSubmit={handleStandardLogin} className="space-y-4 animate-in slide-in-from-right duration-300">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Username</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Unique username"
                                className="w-full px-5 py-3.5 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-gray-800"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Password</label>
                            <input 
                                type="password" 
                                required 
                                placeholder="••••••••"
                                className="w-full px-5 py-3.5 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-gray-800"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setView('providers')}
                                className="flex-1 py-3 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium shadow-md shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing in...' : 'Continue'}
                            </button>
                        </div>
                    </form>
                )}
                
                <div className="mt-8 text-center text-[11px] text-gray-400">
                    By continuing, you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
                </div>
            </div>
        </div>
    )
}
