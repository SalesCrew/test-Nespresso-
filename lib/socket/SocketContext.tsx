"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeSocket = async () => {
      const supabase = createSupabaseBrowserClient();
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('No session token available for Socket.IO connection');
        return;
      }

      // Create Socket.IO connection
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        auth: {
          token: session.access_token,
        },
        autoConnect: true,
      });

      socketInstance.on('connect', () => {
        console.log('Socket.IO connected');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setIsConnected(false);
      });

      setSocket(socketInstance);

      // Cleanup on unmount
      return () => {
        socketInstance.disconnect();
      };
    };

    initializeSocket();
  }, []);

  // Listen for auth state changes and reconnect if needed
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Disconnect and reconnect with new token
        if (socket) {
          socket.disconnect();
        }
        
        if (session?.access_token && event === 'TOKEN_REFRESHED') {
          const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
            auth: {
              token: session.access_token,
            },
          });

          newSocket.on('connect', () => {
            console.log('Socket.IO reconnected with new token');
            setIsConnected(true);
          });

          newSocket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
            setIsConnected(false);
          });

          setSocket(newSocket);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

