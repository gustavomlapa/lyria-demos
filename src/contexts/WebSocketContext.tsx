import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleGenAI, LiveMusicSession } from '@google/genai';

interface WebSocketContextType {
  session: LiveMusicSession | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<LiveMusicSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ai = new GoogleGenAI({
      apiKey: 'YOUR_API_KEY',
      apiVersion: 'v1alpha',
    });

    const connect = async () => {
      try {
        const liveSession = await ai.live.music.connect({
          model: 'lyria-realtime-exp',
          callbacks: {
            onmessage: (message) => {
              console.log('Received message:', message);
            },
            onerror: (error) => {
              console.error('WebSocket error:', error);
              setIsConnected(false);
            },
            onclose: () => {
              console.log('WebSocket connection closed');
              setIsConnected(false);
            },
          },
        });
        setSession(liveSession);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    };

    connect();

    return () => {
      if (session) {
        session.close();
      }
    };
  }, []);

  const value = {
    session,
    isConnected,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
