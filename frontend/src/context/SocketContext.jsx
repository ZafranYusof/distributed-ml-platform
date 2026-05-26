import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [liveUsers, setLiveUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    const socketInstance = io('/', {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      if (user) {
        socketInstance.emit('user:join', { username: user.username });
      }
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('live:users', (users) => {
      setLiveUsers(users);
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && connected && user) {
      socket.emit('user:join', { username: user.username });
    }
  }, [user, connected, socket]);

  const emitTrainingStart = (data) => {
    if (socket) socket.emit('training:start', data);
  };

  const emitTrainingProgress = (data) => {
    if (socket) socket.emit('training:progress', data);
  };

  const emitTrainingComplete = () => {
    if (socket) socket.emit('training:complete');
  };

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      liveUsers,
      emitTrainingStart,
      emitTrainingProgress,
      emitTrainingComplete
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}
