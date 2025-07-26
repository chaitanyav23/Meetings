import { Server } from 'socket.io';
import { pool } from '../config/db.js';

const activeUsers = new Map();   // socket.id -> userId

let io;  // Declare io here for export

export function registerSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: 'http://localhost:3000' }
  });

  io.on('connection', socket => {
    console.log('user connected', socket.id);

    socket.on('init', ({ userId }) => {
      activeUsers.set(socket.id, userId);
      socket.join(`user:${userId}`);
    });

    socket.on('invite:respond', async ({ inviteId, action }) => {
      // update DB, emit to host, etc.
      await pool.query('UPDATE invitations SET status=$1 WHERE id=$2',
                       [action, inviteId]);
      io.to(`user:${activeUsers.get(socket.id)}`)
        .emit('notification', { type:'invite_status', inviteId, action });
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
    });
  });
}

// New safe getter for io instance
export function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}
