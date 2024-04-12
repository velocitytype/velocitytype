import React, { createContext } from 'react';
import { io, Socket } from 'socket.io-client';

// This provides a context, so the socket can be used across multiple pages

const socket = io('http://localhost:5000')
const SocketContext = createContext(socket);

socket.on('connect', () => console.log('connected to socket'));

const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
export { SocketContext, SocketProvider };
