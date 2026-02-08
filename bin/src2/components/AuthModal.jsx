//ai-shopping-search/frontend/src/components/AuthModal.jsx

'use client'
import { useState } from 'react'
import { authenticateUser } from '../services/api'
import { getGuestId } from '../services/guest'
import { XMarkIcon } from '@heroicons/react/24/solid'

// أيقونات الشركات (SVG)
const GoogleIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.26 5 11.22S8.36 3.17 12.18 3.17c2.47 0 4.52 1.67 5.23 3.36h2.59c-1.49-3.89-4.75-6.7-9-6.7C4.9 0 0 4.9 0 11.22s4.9 11.22 11 11.22c6.35 0 11.27-4.63 11.27-11.22 0-.89-.23-1.22-.92-1.22h-.01z"/></svg>
const AppleIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 19.35c-1.11 2.3-3.64 2.13-5.26.54-1.63-1.6-3.72-1.39-4.77.54-3.05-3.32-4.14-8.75-.4-11.62 2.33-1.8 4.79-1.4 6.13.3 1.34 1.7 3.39 1.5 4.92.2 1.05-.9 1.7-2.2 1.9-2.9-4.15 1.5-6.35 5.6-5.52 9.2-.5 2.15-1.55 4.3-2.9 6.25zM12.05 2c.2 2.5-2.2 5.1-4.7 5.3-.6-2.5 2.7-5.3 4.7-5.3z"/></svg>
const MicrosoftIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
const KeyIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.87-1.521-1.22-2.375-1.22a3.12 3.12 0 00-3.12 3.12c0 .55.15 1.07.41 1.51l-5.63 8.35a.75.75 0 01-.6.31H1.5a.75.75 0 01-.75-.75v-3a.75.75 0 01.31-.6l3.63-5.38a6.002 6.002 0 019.06-9.98z" /></svg>

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
    const [view, setView] = useState('providers'); // 'providers' or 'standard'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleStandardLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const guestId = await getGuestId();
            // إنشاء إيميل وهمي لمنع توقف التطبيق
            // clean username spaces
            const cleanUser = username.trim().replace(/\s+/g, '.');
            const dummyEmail = `${cleanUser}@dummy-user.local`;

            const res = await authenticateUser(dummyEmail, password, guestId);
            onLoginSuccess(res.data.user);
            onClose();
        } catch (err) {
            setError("Login failed. Try a different username.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 relative overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-normal text-gray-800 mb-2">Log in or sign up</h2>
                    <p className="text-gray-500">You'll get smarter responses and can upload files.</p>
                </div>

                {view === 'providers' ? (
                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                            <GoogleIcon /> Continue with Google
                        </button>
                        <button className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                            <AppleIcon /> Continue with Apple
                        </button>
                        <button className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                            <MicrosoftIcon /> Continue with Microsoft
                        </button>
                        <button className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                            <KeyIcon /> Passkey / YubiKey
                        </button>
                        
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">OR</span></div>
                        </div>

                        <button 
                            onClick={() => setView('standard')}
                            className="w-full py-3 px-4 bg-gray-900 text-white rounded-full hover:bg-black transition-colors font-medium"
                        >
                            Standard Login (Username)
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleStandardLogin} className="space-y-4 animate-in slide-in-from-right">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Enter a unique username"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                required 
                                placeholder="******"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setView('providers')}
                                className="flex-1 py-3 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700"
                            >
                                Back
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium disabled:opacity-50"
                            >
                                {loading ? 'Checking...' : 'Continue'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}