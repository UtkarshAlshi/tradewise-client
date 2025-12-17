import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WebSocketProvider } from './context/WebSocketContext';
import { Toaster } from 'react-hot-toast'; // <-- 1. IMPORT TOASTER
import NotificationHandler from './components/NotificationHandler'; // <-- 1. IMPORT HANDLER
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeWise", // Updated title
  description: "Real-Time Investment & Portfolio Analytics Platform", // Updated desc
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Strip known extension attributes (e.g. Grammarly) before React hydrates to avoid hydration errors */}
        <Script id="strip-extension-attrs" strategy="beforeInteractive">
          {`(function(){
            try{
              var attrs = ['data-new-gr-c-s-check-loaded','data-gr-ext-installed'];
              attrs.forEach(function(a){
                if (document.documentElement && document.documentElement.hasAttribute && document.documentElement.hasAttribute(a)) {
                  document.documentElement.removeAttribute(a);
                }
                if (document.body && document.body.hasAttribute && document.body.hasAttribute(a)) {
                  document.body.removeAttribute(a);
                }
              });
            }catch(e){/* noop */}
          })();`}
        </Script>
        <WebSocketProvider>
          {/* --- 2. ADD TOASTER & HANDLER --- */}
          <Toaster position="top-right" />
          <NotificationHandler />
          {/* --- END ADDITION --- */}
          
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}