'use client';

import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { chatService } from '../services/api';

export default function ChatInterface() {
  // 1. تعريف الحالة (Logic) - ده الجزء اللي كان ناقص
  const [messages, setMessages] = useState([
    {
        id: 1,
        text: "أهلاً بك! 👋 \nأنا مساعد التسوق الذكي الخاص بك. \n\nيمكنك سؤالي عن منتجات، مقارنة أسعار، أو البحث عن مواصفات معينة.",
        isUser: false
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput(''); // مسح الحقل

    // إضافة رسالة المستخدم
    const newUserMsg = { id: Date.now(), text: userText, isUser: true };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // تجهيز الهيستوري
      const history = messages.slice(-6).map(m => ({
          role: m.isUser ? 'user' : 'assistant',
          content: m.text
      }));

      // الاتصال بالباك إند
      const data = await chatService.sendMessage(userText, history);

      // إضافة رد الـ AI
      const aiResponse = {
        id: Date.now() + 1,
        text: data.response || "عذراً، لم أستطع العثور على إجابة.",
        isUser: false,
        products: data.products || [] // قائمة المنتجات
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: "⚠️ حدث خطأ أثناء الاتصال بالخادم. تأكد من تشغيل Django.",
          isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. الواجهة (Design)
  return (
    <div className="flex flex-col h-[85vh] w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/50 ring-1 ring-gray-900/5">

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
            <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/30">
                    🤖
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            </div>
            <div>
                <h1 className="font-bold text-gray-900 text-xl tracking-tight">AI Shopping Agent</h1>
                <p className="text-xs text-gray-500 font-medium">مساعدك الشخصي الذكي</p>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 scroll-smooth bg-gray-50/50">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} text={msg.text} isUser={msg.isUser} products={msg.products} />
        ))}

        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white border px-5 py-4 rounded-2xl rounded-bl-none text-gray-500 text-sm flex items-center gap-2 shadow-sm">
                    <span className="text-xs font-semibold">جاري التفكير</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ابحث عن لابتوب، جوال، أو أي منتج..."
            className="w-full bg-gray-100 text-gray-900 rounded-2xl pl-4 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all shadow-inner font-medium"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute left-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 rotate-180 rtl:rotate-0">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 mt-3 font-medium tracking-wide">
            POWERED BY ALGOLIA & AI AGENTS
        </p>
      </div>
    </div>
  );
}