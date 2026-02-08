//ai-shopping-search/frontend/src/components/SavedProductsModal.jsx
'use client'
import { useEffect, useState } from 'react'
import { getSavedProducts, removeSavedProduct } from '../services/api'
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function SavedProductsModal({ isOpen, onClose }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadProducts();
        }
    }, [isOpen]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await getSavedProducts();
            setProducts(res.data);
        } catch (error) {
            console.error("Failed to load saved items", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (dbId) => {
        if(!confirm("Remove from saved items?")) return;
        try {
            await removeSavedProduct(dbId);
            setProducts(prev => prev.filter(p => p.id !== dbId));
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
                
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">📦</span> My Stuff
                        <span className="text-sm font-normal text-gray-500 ml-2">({products.length} items)</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                            <p>No saved items yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map((prod) => {
                                // Flexible URL check
                                const productUrl = prod.url || prod.product_url;
                                const hasValidLink = productUrl && (productUrl.startsWith('http') || productUrl.startsWith('https'));
                                
                                return (
                                <div key={prod.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative">
                                    <button 
                                        onClick={() => handleDelete(prod.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-all z-10"
                                        title="Remove"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>

                                    <div className="h-40 p-4 flex items-center justify-center bg-gray-50">
                                        <img 
                                            // Prefer 'image', fall back to 'image_url', then placeholder
                                            src={prod.image || prod.image_url || "https://placehold.co/400x400?text=No+Image"} 
                                            alt={prod.name} 
                                            className="h-full object-contain mix-blend-multiply" 
                                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400?text=No+Image"; }}
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-medium text-gray-800 text-sm line-clamp-2 h-10 mb-2">{prod.name}</h3>
                                        <div className="flex justify-between items-center">
                                            <span className="text-blue-600 font-bold">${prod.price}</span>
                                            <a 
                                                href={hasValidLink ? productUrl : '#'} 
                                                target={hasValidLink ? "_blank" : "_self"}
                                                className={`text-xs text-gray-500 hover:underline ${!hasValidLink ? 'cursor-default opacity-50' : ''}`}
                                                onClick={(e) => !hasValidLink && e.preventDefault()}
                                            >
                                                View
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}