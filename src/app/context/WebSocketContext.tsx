'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Define the shape of the context
interface WebSocketContextType {
  subscribe: (topic: string, callback: (message: any) => void) => StompSubscription | null;
  isConnected: boolean;
}

// Create the context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Create the Provider component
export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    // 1. Create a STOMP client
    const client = new Client({
      // connectHeaders: {}, // Removed, as token is passed via query param for SockJS handshake
      webSocketFactory: () => {
        // 2. Use SockJS as the transport and connect to the API Gateway.
        // Prefer NEXT_PUBLIC_API_URL when set, otherwise default to http://localhost:8000 (API Gateway)
        try {
          const envBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'; // Changed to 8000
          const base = envBase.replace(/\/$/, '');
          if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            // Pass token as a query parameter for authentication during WebSocket handshake
            const url = token ? `${base}/ws?token=${encodeURIComponent(token)}` : `${base}/ws`;
            // No need to set connectHeaders here for SockJS initial handshake
            return new SockJS(url);
          }
          return new SockJS(`${base}/ws`);
        } catch (err) {
          const fallback = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'; // Changed to 8000
          return new SockJS(`${fallback.replace(/\/$/, '')}/ws`);
        }
      },
      onConnect: () => {
        console.log('WebSocket connected!');
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected!');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    stompClientRef.current = client;

    // 3. Activate the connection
    client.activate();

    // 4. Cleanup on unmount
    return () => {
      client.deactivate();
    };
  }, []);

  // 5. Subscription function
  const subscribe = (topic: string, callback: (message: any) => void): StompSubscription | null => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      // Subscribe to the topic and parse the JSON body
      return stompClientRef.current.subscribe(topic, (message: IMessage) => {
        callback(JSON.parse(message.body));
      });
    }
    return null;
  };

  return (
    <WebSocketContext.Provider value={{ subscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// 6. Custom hook to use the context easily
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
