//ai-shopping-search/src/components/MessageBubble.jsx
'use client';
import { useState } from 'react';
import { BookmarkIcon } from '@heroicons/react/24/outline'; 
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid'; 
import { saveProduct } from '../services/api';

export default function MessageBubble({ text, isUser, products }) {
  const [savedItems, setSavedItems] = useState({});

  const handleSave = async (prod) => {
    // 1. Optimistic UI update
    const newStatus = !savedItems[prod.objectID];
    setSavedItems(prev => ({ ...prev, [prod.objectID]: newStatus }));

    try {
        if (newStatus) {
            await saveProduct({
                product_id: prod.objectID,
                name: prod.name,
                // Send raw data, backend will clean it
                price: prod.price,
                // Send both possible keys to be safe
                image: prod.image,
                image_url: prod.image_url,
                url: prod.url,
                product_url: prod.product_url,
                brand: prod.brand,
                rating: prod.rating
            });
        } 
    } catch (error) {
        console.error("Save failed", error);
        setSavedItems(prev => ({ ...prev, [prod.objectID]: !newStatus }));
    }
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-red-500 flex-shrink-0 mr-4 mt-1 flex items-center justify-center text-white text-xs font-bold">
            AI
        </div>
      )}

      <div className={`flex flex-col max-w-[95%] md:max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        {text && (
            <div className={`py-3 px-5 rounded-2xl text-[15px] leading-7 whitespace-pre-wrap shadow-sm ${
            isUser
                ? 'bg-[#f0f4f9] text-[#1f1f1f] rounded-br-sm' 
                : 'bg-white text-[#1f1f1f] w-full border border-gray-100'
            }`}>
            {text}
            </div>
        )}

        {products && products.length > 0 && (
          <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod, idx) => {
              const isSaved = savedItems[prod.objectID];
              
              // Flexible Data Handling
              const productUrl = prod.url || prod.product_url;
              const imageUrl = prod.image || prod.image_url;
              const hasValidLink = productUrl && (productUrl.startsWith('http') || productUrl.startsWith('https'));

              return (
              <div key={idx} className="relative flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
                
                <button 
                    onClick={() => handleSave(prod)}
                    className="absolute top-0 right-4 p-2 z-20"
                    title={isSaved ? "Saved" : "Save to My Stuff"}
                >
                    {isSaved ? (
                        <BookmarkIconSolid className="w-8 h-8 text-black drop-shadow-sm" />
                    ) : (
                        <BookmarkIcon className="w-8 h-8 text-gray-400 hover:text-gray-800" />
                    )}
                </button>

                <div className="h-48 w-full bg-gray-50 flex items-center justify-center overflow-hidden p-4">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={prod.name} 
                            className="object-contain h-full w-full mix-blend-multiply"
                            onError={(e) => {
                                // If image fails to load, swap to placeholder
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/400x400?text=No+Image";
                            }} 
                        />
                    ) : (
                        // If no image URL provided at all
                        <img src="https://placehold.co/400x400?text=No+Image" alt="No image" className="object-contain h-full w-full" />
                    )}
                </div>
                
                <a 
                    href={hasValidLink ? productUrl : '#'} 
                    target={hasValidLink ? "_blank" : "_self"}
                    rel="noreferrer" 
                    className={`p-4 flex flex-col flex-1 block ${!hasValidLink ? 'cursor-default' : ''}`}
                    onClick={(e) => !hasValidLink && e.preventDefault()}
                >
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-snug hover:text-blue-600" title={prod.name}>
                        {prod.name}
                    </h4>
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-blue-600 font-bold text-lg">
                            {prod.price ? `$${prod.price}` : "N/A"}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">
                            {hasValidLink ? "View" : "No Link"}
                        </span>
                    </div>
                </a>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}