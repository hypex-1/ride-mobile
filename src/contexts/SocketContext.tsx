import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      initializeSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user]);

  const initializeSocket = () => {
    try {
      const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://192.168.1.36:3000';
      
      const socketInstance = io(WS_URL, {
        transports: ['websocket'],
        auth: {
          userId: user?.id,
          role: user?.role,
        },
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setError(null);
        
        // Join user-specific room
        socketInstance.emit('user:connect', {
          userId: user?.id,
          role: user?.role,
        });
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(err.message);
        setIsConnected(false);
      });

      // Ride-related events
      socketInstance.on('rideUpdate', (data) => {
        console.log('Ride update received:', data);
      });

      socketInstance.on('driverLocation', (data) => {
        console.log('Driver location update:', data);
      });

      socketInstance.on('rideRequest', (data) => {
        console.log('Ride request received:', data);
      });

      setSocket(socketInstance);
    } catch (err) {
      console.error('Failed to initialize socket:', err);
      setError('Failed to connect to server');
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setError(null);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    error,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};