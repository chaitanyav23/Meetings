import { Server } from 'socket.io';
import { pool } from '../config/db.js';

const activeUsers = new Map(); // socket.id => userId

let io; // The singleton Socket.IO server

export function registerSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { 
      origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
      credentials: true 
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Client should emit 'init' immediately after connecting with userId
    socket.on('init', ({ userId }) => {
      try {
        if (!userId) {
          console.warn('Socket init without userId:', socket.id);
          return;
        }

        // Remove any existing entries for this user
        for (const [socketId, uid] of activeUsers.entries()) {
          if (uid === userId && socketId !== socket.id) {
            activeUsers.delete(socketId);
          }
        }

        activeUsers.set(socket.id, userId);
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined user:${userId}`);
      } catch (error) {
        console.error('Error in socket init:', error);
      }
    });

    socket.on('disconnect', () => {
      const userId = activeUsers.get(socket.id);
      activeUsers.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id} (user: ${userId || 'unknown'})`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
}

// Safe getter for io instance
export function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}
