// ai-shopping-search/frontend/src/app/layout.js
import "./globals.css";

export const metadata = {
  title: "AI Shopping Agent",
  description: "Your intelligent shopping assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <h3 className="text-3xl font-bold text-center mb-4">ElA-shba7 Shopping Agent</h3>
        {children}

      </body>
    </html>
  );
}