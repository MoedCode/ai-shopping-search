import "./globals.css";

export const metadata = {
  title: "AI Shopping Agent",
  description: "Your intelligent shopping assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}