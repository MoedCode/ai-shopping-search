// src/app/page.js
import ChatInterface from '../components/ChatInterface';
import Footer from '../components/Footer';
export default function Home() {
  return (
    // خلفية متدرجة (Gradient) لإعطاء حياة للتطبيق
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center p-4 md:p-6">

      <ChatInterface />
      <Footer />
    </main>

  );
}