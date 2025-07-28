import { Server } from 'socket.io';
import { pool } from '../config/db.js';

const activeUsers = new Map(); // socket.id => userId

let io; // The singleton Socket.IO server

export function registerSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: 'http://localhost:3000', credentials: true },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // The client should emit 'init' immediately after connecting, with their userId.
    socket.on('init', ({ userId }) => {
      if (!userId) return;
      activeUsers.set(socket.id, userId);
      socket.join(`user:${userId}`);
      // Optional: Debug log
      console.log(`Socket ${socket.id} joined user:${userId}`);
    });

    // This is a legacy event; your REST API currently processes accept/decline, not this socket event.
    // You can remove this if not used or keep as a fallback for real-time invitation responses.
    socket.on('invite:respond', async ({ inviteId, action }) => {
      if (!inviteId || !action) return;
      try {
        await pool.query('UPDATE invitations SET status=$1 WHERE id=$2', [action, inviteId]);
        const userId = activeUsers.get(socket.id);
        if (userId) {
          io.to(`user:${userId}`).emit('notification', { type: 'invite_status', inviteId, action });
        }
      } catch (err) {
        console.error('Socket invite:respond error:', err);
      }
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
      console.log('Socket disconnected:', socket.id);
    });
  });
}

// Safe getter for io instance
export function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}
