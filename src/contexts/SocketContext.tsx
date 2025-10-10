import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  // Event handlers
  onRideUpdate: (callback: (data: any) => void) => void;
  onDriverLocation: (callback: (data: any) => void) => void;
  onIncomingRide: (callback: (data: any) => void) => void;
  onRideAccepted: (callback: (data: any) => void) => void;
  onRideCancelled: (callback: (data: any) => void) => void;
  // Actions
  joinRoom: (userId: string | number, role: string) => void;
  emitDriverLocation: (locationData: any) => void;
  emitRideRequest: (rideData: any) => void;
  emitRideAccept: (rideId: string | number) => void;
  emitRideCancel: (rideId: string | number, reason?: string) => void;
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
        console.log(' Socket connected');
        console.log(' Socket ID:', socketInstance.id);
        console.log(' Socket URL:', WS_URL);
        console.log(' User context:', { id: user?.id, role: user?.role });
        setIsConnected(true);
        setError(null);
        
        // Join user-specific room with enhanced logging
        console.log(` Joining room for User ID: ${user?.id}, Role: ${user?.role}`);
        socketInstance.emit('join', {
          userId: user?.id,
          role: user?.role,
        }, (ack: any) => {
          console.log(' Join room acknowledgement:', ack);
        });
        
        // Test: emit a generic event to check server response
        socketInstance.emit('ping', { timestamp: Date.now() }, (ack: any) => {
          console.log(' Ping acknowledgement:', ack);
        });
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.error(' Socket connection error:', err);
        console.error('Error message:', err.message);
        console.error('Error type:', err.type);
        console.error('Error description:', err.description);
        setError(err.message);
        setIsConnected(false);
      });

      // Enhanced ride-related events with better logging
      socketInstance.on('rideUpdate', (data) => {
        console.log(' Ride update received:', data);
      });

      socketInstance.on('driverLocation', (data) => {
        console.log(' Driver location update:', data);
      });

      socketInstance.on('incomingRide', (data) => {
        console.log(' Incoming ride request:', data);
      });

      socketInstance.on('rideAccepted', (data) => {
        console.log(' Ride accepted:', data);
      });

      socketInstance.on('rideCancelled', (data) => {
        console.log(' Ride cancelled:', data);
      });

      socketInstance.on('driverAssigned', (data) => {
        console.log('‍ Driver assigned:', data);
      });

      socketInstance.on('rideStarted', (data) => {
        console.log(' Ride started:', data);
      });

      socketInstance.on('rideCompleted', (data) => {
        console.log(' Ride completed:', data);
      });

      // Listen for ALL events from server (debugging)
      socketInstance.onAny((eventName, ...args) => {
        console.log(` Received event: ${eventName}`, args);
      });

      // Listen for acknowledgement responses
      socketInstance.on('ack', (data) => {
        console.log(' Generic ack received:', data);
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

  // Event handler methods
  const onRideUpdate = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('rideUpdate', callback);
    }
  };

  const onDriverLocation = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('driverLocation', callback);
    }
  };

  const onIncomingRide = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('incomingRide', callback);
    }
  };

  const onRideAccepted = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('rideAccepted', callback);
    }
  };

  const onRideCancelled = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('rideCancelled', callback);
    }
  };

  // Action methods
  const joinRoom = (userId: string | number, role: string) => {
    if (socket) {
      console.log(` Manually joining room - User: ${userId}, Role: ${role}`);
      socket.emit('join', { userId, role });
    }
  };

  const emitDriverLocation = (locationData: any) => {
    if (socket) {
      console.log(' Emitting driver location:', locationData);
      socket.emit('driverLocation', locationData);
    }
  };

  const emitRideRequest = (rideData: any) => {
    if (socket) {
      console.log(' Emitting ride request:', rideData);
      const emitWithAck = () =>
        socket.emit('rideRequest', rideData, (ack: any) => {
          if (ack?.error) {
            console.warn(' Ride request ack reported error:', ack.error);
          } else if (ack) {
            console.log(' Ride request ack:', ack);
          } else {
            console.log('ℹ Ride request emitted without explicit ack payload');
          }
        });

      try {
        // Prefer using timeout-based ack tracking when available
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore socket.timeout is available on socket.io-client >=4.0
        socket.timeout?.(5000).emit('rideRequest', rideData, (err: unknown, ack: any) => {
          if (err) {
            console.warn(' Ride request ack timed out or failed:', err);
            emitWithAck();
            return;
          }
          if (ack?.error) {
            console.warn(' Ride request ack reported error:', ack.error);
          } else if (ack) {
            console.log(' Ride request ack:', ack);
          } else {
            console.log('ℹ Ride request acknowledged without payload');
          }
        });
      } catch (error) {
        console.warn(' Ride request ack tracking not supported, falling back:', error);
        emitWithAck();
      }
    }
  };

  const emitRideAccept = (rideId: string | number) => {
    if (socket) {
      console.log(' Emitting ride accept:', rideId);
      socket.emit('rideAccept', { rideId });
    }
  };

  const emitRideCancel = (rideId: string | number, reason?: string) => {
    if (socket) {
      console.log(' Emitting ride cancel:', { rideId, reason });
      socket.emit('rideCancel', { rideId, reason });
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    error,
    // Event handlers
    onRideUpdate,
    onDriverLocation,
    onIncomingRide,
    onRideAccepted,
    onRideCancelled,
    // Actions
    joinRoom,
    emitDriverLocation,
    emitRideRequest,
    emitRideAccept,
    emitRideCancel,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};