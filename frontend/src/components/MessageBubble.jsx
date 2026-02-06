//ai-shopping-search/src/components/MessageBubble.jsx
'use client';
export default function MessageBubble({ text, isUser, products }) {
  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {/* Avatar for AI */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-red-500 flex-shrink-0 mr-4 mt-1 flex items-center justify-center text-white text-xs font-bold">
            AI
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] md:max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Text Area */}
        {text && (
            <div className={`py-2 px-4 rounded-2xl text-[15px] leading-7 ${
            isUser
                ? 'bg-[#f0f4f9] text-[#1f1f1f] rounded-br-sm' // User style like Gemini (Subtle gray)
                : 'text-[#1f1f1f] w-full' // AI text plain
            }`}>
            <p className="whitespace-pre-wrap">{text}</p>
            </div>
        )}

        {/* Product Cards (Horizontal Scroll or Grid) */}
        {products && products.length > 0 && (
          <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod, idx) => (
              <a
                key={idx}
                href={prod.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full"
              >
                <div className="h-40 w-full bg-gray-100 relative flex items-center justify-center overflow-hidden">
                    {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="object-contain h-full w-full p-2" />
                    ) : (
                        <span className="text-4xl">🛍️</span>
                    )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1" title={prod.name}>
                        {prod.name}
                    </h4>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="text-blue-600 font-bold text-sm">
                            {prod.price ? `$${prod.price}` : "Check Price"}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">View</span>
                    </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}