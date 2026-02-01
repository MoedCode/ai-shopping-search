// ai-shopping-search/frontend/src/components/MessageBubble.jsx
'use client';

// التغيير الأساسي هنا: غيرنا { message } إلى { text } ليطابق البيانات القادمة
export default function MessageBubble({ text, isUser, products }) {
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 animation-fade-in`}>
      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>

        {/* صندوق الرسالة مع تحسين الألوان والظلال */}
        <div className={`px-5 py-4 rounded-2xl shadow-md text-sm md:text-base leading-relaxed relative ${
          isUser
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
        }`}>
           <p className="whitespace-pre-wrap m-0 font-medium">
             {text}
           </p>
        </div>

        {/* كروت المنتجات بتصميم أفضل */}
        {products && products.length > 0 && (
          <div className="mt-4 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((prod, idx) => (
              <a
                key={idx}
                href={prod.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group"
              >
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className="w-16 h-16 bg-blue-50 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        🛍️
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600">
                            {prod.name || "منتج رائع"}
                        </h4>
                        <p className="text-blue-600 font-extrabold text-sm mt-1">
                            {prod.price || "عرض خاص"}
                        </p>
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