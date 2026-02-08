//ai-shopping-search/frontend/src/components/AuthModal.jsx

'use client'
import { useState } from 'react'
import { authenticateUser } from '../services/api'
import { getGuestId } from '../services/guest'
import { XMarkIcon } from '@heroicons/react/24/solid'

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const guestId = await getGuestId();
            // الباكند ذكي: إذا الإيميل موجود سيسجل دخول ويدمج، وإذا جديد سينشئ حساباً
            const res = await authenticateUser(email, password, guestId);
            
            // نجاح
            onLoginSuccess(res.data.user);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Authentication failed. Check credentials.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-gray-500 text-sm mb-6">Login to sync your history or create a new account automatically.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    )
}