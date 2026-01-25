// src/app/page.js
import ChatInterface from '../components/ChatInterface';

export default function Home() {
  return (
    // خلفية متدرجة (Gradient) لإعطاء حياة للتطبيق
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center p-4 md:p-6">

      <ChatInterface />
              <footer className="text-center text-sm text-gray-500 mt-8 mb-4">
          &copy; {new Date().getFullYear()} ElA-shba7
          <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-2">
            GitHub
                  </a>
            <a href="https://www.linkedin.com/in/mohamed-mahmoud-4874b41b0/"
            target="_blank" rel="noopener noreferrer"
            className="text-blue-500 hover:underline ml-2">
              LinkedIn

          </a>
        </footer>
    </main>

  );
}