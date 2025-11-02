import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WebSocketProvider } from './context/WebSocketContext'; // <-- 1. IMPORT

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
        {/* --- 2. WRAP HERE --- */}
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
        {/* --- END WRAP --- */}
      </body>
    </html>
  );
}