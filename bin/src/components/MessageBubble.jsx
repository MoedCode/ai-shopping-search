//ai-shopping-search/src/components/MessageBubble.jsx
'use client';
import { useState } from 'react';
import { BookmarkIcon } from '@heroicons/react/24/outline'; // أيقونة مفرغة
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid'; // أيقونة ممتلئة
import { saveProduct } from '../services/api';

export default function MessageBubble({ text, isUser, products }) {
  // حالة محلية لتخزين حالة الحفظ لكل منتج
  const [savedItems, setSavedItems] = useState({});

  const handleSave = async (prod) => {
    // 1. تغيير الشكل فوراً (Optimistic UI update)
    const isCurrentlySaved = savedItems[prod.objectID];
    setSavedItems(prev => ({ ...prev, [prod.objectID]: !isCurrentlySaved }));

    try {
        if (!isCurrentlySaved) {
            // حفظ في الباكند
            await saveProduct({
                product_id: prod.objectID,
                name: prod.name,
                price: prod.price,
                image_url: prod.image,
                product_url: prod.url,
                brand: prod.brand,
                rating: prod.rating
            });
            console.log("Saved silently");
        } 
        // ملاحظة: لو أردت دعم "إلغاء الحفظ" من هنا، ستحتاج دالة delete في الـ API تعتمد على product_id
    } catch (error) {
        console.error("Save failed", error);
        // تراجع عن التغيير في حال الفشل
        setSavedItems(prev => ({ ...prev, [prod.objectID]: isCurrentlySaved }));
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
              
              return (
              <div key={idx} className="relative flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
                
                {/* زر الحفظ (Bookmark Style) */}
                <button 
                    onClick={() => handleSave(prod)}
                    className="absolute top-0 right-4 p-0 z-20 transition-transform active:scale-95"
                    title={isSaved ? "Saved" : "Save to My Stuff"}
                >
                    {isSaved ? (
                        // أيقونة ممتلئة وسوداء (Instagram Style)
                        <BookmarkIconSolid className="w-8 h-8 text-black drop-shadow-sm" />
                    ) : (
                        // أيقونة مفرغة
                        <BookmarkIcon className="w-8 h-8 text-gray-400 hover:text-gray-800" />
                    )}
                </button>

                <div className="h-48 w-full bg-gray-50 flex items-center justify-center overflow-hidden p-4">
                    {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="object-contain h-full w-full mix-blend-multiply" />
                    ) : (
                        <span className="text-4xl">🛍️</span>
                    )}
                </div>
                
                <a href={prod.url || '#'} target="_blank" rel="noreferrer" className="p-4 flex flex-col flex-1 block">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-snug hover:text-blue-600" title={prod.name}>
                        {prod.name}
                    </h4>
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-blue-600 font-bold text-lg">
                            {prod.price ? `$${prod.price}` : "N/A"}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">View</span>
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