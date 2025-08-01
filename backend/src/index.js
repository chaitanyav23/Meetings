import express from 'express';
import http from 'http';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import { pool } from './config/db.js';
import googleCalendarWebhookRouter from './routes/webhooks/google-calendar.js';
import { registerSocket } from './sockets/io.js';
import meetingsRouter from './routes/meetings.js';
import invitationsRouter from './routes/invitations.js';
import notificationsRouter from './routes/notifications.js';
import authRouter from './routes/auth.js';
import authenticateToken from './middleware/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ----- Place CORS at the very top -----
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use('/api/webhooks/google-calendar', googleCalendarWebhookRouter);

app.use(cookieParser());

const pgSession = connectPgSimple(session);

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/invitations', authenticateToken, invitationsRouter);
app.use('/api/notifications', authenticateToken, notificationsRouter);

registerSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
