'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { toast } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

// Type for JWT payload (adjust if needed)
interface JwtPayload {
  sub?: string;       // standard JWT field (user email or username)
  email?: string;     // sometimes apps store it here instead
}

export default function NotificationHandler() {
  const { subscribe, isConnected } = useWebSocket();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Extract user email from JWT token (assuming it's stored in localStorage)
    const token = localStorage.getItem('token'); // adjust if using cookies
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        const email = decoded.email || decoded.sub || null;
        setUserEmail(email);
        console.log('🔐 Logged in as:', email);
      } catch (error) {
        console.error('Failed to decode JWT:', error);
      }
    } else {
      console.warn('No JWT token found in localStorage.');
    }
  }, []);

  useEffect(() => {
    if (!isConnected || !userEmail) return;

    console.log('✅ Subscribing to notifications for', userEmail);

    // 1️⃣ Global notifications
    const subGlobal = subscribe('/topic/notifications', (msg: any) => {
      const notification = typeof msg === 'string' ? JSON.parse(msg) : msg;
      console.log('📩 Global Notification:', notification);
      toast.success(notification.message, { duration: 5000, icon: '🌍' });
    });

    // 2️⃣ Private notifications
    const subPrivate = subscribe(`/user/${userEmail}/queue/notifications`, (msg: any) => {
      const notification = typeof msg === 'string' ? JSON.parse(msg) : msg;
      console.log('🔒 Private Notification:', notification);
      toast(notification.message, { duration: 5000, icon: '🔔' });
    });

    return () => {
      subGlobal?.unsubscribe();
      subPrivate?.unsubscribe();
    };
  }, [isConnected, userEmail, subscribe]);

  return null;
}
