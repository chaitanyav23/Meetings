import express from 'express';
import http from 'http';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';     // <-- Added import for cookie-parser
import passport from './config/passport.js';
import { pool } from './config/db.js';

dotenv.config();

import { registerSocket } from './sockets/io.js';
import meetingsRouter from './routes/meetings.js';
import invitationsRouter from './routes/invitations.js';
import notificationsRouter from './routes/notifications.js';
import authRouter from './routes/auth.js';

// *** IMPORT AUTHENTICATION MIDDLEWARE ***
import authenticateToken from './middleware/auth.js';

const app = express();
const server = http.createServer(app);

// Use cookie-parser middleware BEFORE session middleware
app.use(cookieParser());

// Create session store
const pgSession = connectPgSimple(session);

// Session middleware - MUST come after cookie-parser and before passport middleware
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set true if using HTTPS in production
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
  }
}));

// Passport middleware - MUST come after session middleware
app.use(passport.initialize());
app.use(passport.session());

// CORS middleware - allow credentials for cookies/session
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// JSON body parser middleware (for POST requests)
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/meetings', meetingsRouter);

// *** PROTECT THESE ROUTES WITH AUTH MIDDLEWARE ***
app.use('/api/invitations', authenticateToken, invitationsRouter);
app.use('/api/notifications', authenticateToken, notificationsRouter);

// Setup Socket.IO
registerSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
