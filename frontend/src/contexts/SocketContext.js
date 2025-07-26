import { createContext, useEffect } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext(null);

export function SocketProvider({ userId, children }) {
  const socket = io('http://localhost:5000', { autoConnect:false });
  useEffect(() => {
    socket.connect();
    socket.emit('init', { userId });
    return () => socket.disconnect();
  }, [userId]);
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
