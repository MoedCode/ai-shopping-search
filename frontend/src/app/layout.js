// ai-shopping-search/frontend/src/app/layout.js
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./globals.css";

export const metadata = {
  title: "AI Shopping Agent",
  description: "Your intelligent shopping assistant",
};

// Replace this with your actual Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com"; 

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <h3 className="text-3xl font-bold text-center mb-4 pt-4">ElA-shba7 Shopping Agent</h3>
            {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}