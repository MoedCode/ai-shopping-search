//ai-shopping-search/src/components/MessageBubble.jsx
'use client';
import { BookmarkIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'; 
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { saveProduct } from '../services/api';
import { useState } from 'react';

// Added onViewDetails prop
export default function MessageBubble({ id, text, isUser, products, onDelete, onViewDetails }) { 
  const [savedItems, setSavedItems] = useState({});

  const handleSave = async (prod, resolvedImage) => {
    // ... existing save logic ...
    // Copy your previous handleSave logic here
    const isCurrentlySaved = savedItems[prod.objectID];
    setSavedItems(prev => ({ ...prev, [prod.objectID]: !isCurrentlySaved }));
    try {
        if (!isCurrentlySaved) {
            await saveProduct({
                product_id: prod.objectID,
                name: prod.name || prod.title,
                price: prod.price,
                image: resolvedImage,
                url: prod.url || prod.product_url,
                brand: prod.brand,
                rating: prod.rating
            });
        } 
    } catch (error) {
        console.error("Save failed", error);
        setSavedItems(prev => ({ ...prev, [prod.objectID]: isCurrentlySaved }));
    }
  };

  return (
    <div className={`group flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
      
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-red-500 flex-shrink-0 mr-3 mt-1 flex items-center justify-center text-white text-[10px] font-bold shadow-md">
            AI
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] md:max-w-2xl relative ${isUser ? 'items-end' : 'items-start'}`}>
        
        {text && (
            <div className={`relative py-3 px-5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
            isUser
                ? 'bg-[#e9eef6] text-[#1f1f1f] rounded-br-none' 
                : 'bg-white text-[#1f1f1f] w-full border border-gray-100 rounded-bl-none'
            }`}>
            {text}
            </div>
        )}

        {/* Delete Button */}
        <button 
            onClick={() => onDelete(id)}
            className={`
                absolute top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-white rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50
                ${isUser ? '-left-10' : '-right-10'}
            `}
            title="Delete Message"
        >
            <TrashIcon className="w-4 h-4" />
        </button>

        {/* PRODUCTS GRID */}
        {products && products.length > 0 && (
          <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((prod, idx) => {
                const imageUrl = prod.image || prod.image_url || "https://placehold.co/400x400?text=No+Image";
                const isSaved = savedItems[prod.objectID];

                return (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg transition-shadow relative group/card">
                     
                     {/* Save Button */}
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleSave(prod, imageUrl); }}
                        className="absolute top-2 right-2 p-1.5 z-10 bg-white/80 rounded-full hover:bg-white text-gray-400 hover:text-gray-900 transition-colors"
                     >
                        {isSaved ? <BookmarkIconSolid className="w-5 h-5 text-black"/> : <BookmarkIcon className="w-5 h-5"/>}
                     </button>

                     {/* Image Area */}
                     <div className="h-32 w-full flex items-center justify-center bg-gray-50 rounded-lg mb-3 overflow-hidden cursor-pointer" onClick={() => onViewDetails(prod)}>
                        <img src={imageUrl} className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover/card:scale-105" onError={(e)=>{e.target.src="https://placehold.co/200"}}/>
                     </div>

                     {/* Content */}
                     <div className="cursor-pointer" onClick={() => onViewDetails(prod)}>
                        <p className="text-xs font-bold text-gray-800 line-clamp-2 mb-1 min-h-[2.5em]">{prod.name}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-blue-600 font-bold text-sm">${prod.price}</p>
                            
                            {/* VIEW BUTTON (Restored) */}
                            <button 
                                className="flex items-center gap-1 text-[10px] font-medium bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md text-gray-600 transition-colors"
                            >
                                <EyeIcon className="w-3 h-3" /> View
                            </button>
                        </div>
                     </div>
                </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}