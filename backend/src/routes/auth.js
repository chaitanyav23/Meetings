import { Router } from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import cookieParser from 'cookie-parser';
import { watchCalendarEvents } from '../services/google.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(cookieParser());

// Helper to generate JWT token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be set');
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Google OAuth login route with required scopes and parameters
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    accessType: 'offline',  // This requests refresh token
    prompt: 'consent',      // Forces consent screen every login
  })
);

// Google OAuth callback route
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: 'http://localhost:3000/login',
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const email = user.email;
      // Refresh token is passed in passport's info param - fallback to null
      const refreshToken = req.authInfo?.refreshToken || null;

      if (!email) {
        return res.redirect('http://localhost:3000/login?error=no_email');
      }

      // Update Google refresh token if a new one is received
      if (refreshToken && refreshToken !== user.google_refresh_token) {
        await db.query(
          'UPDATE users SET google_refresh_token = $1, updated_at = NOW() WHERE id = $2',
          [refreshToken, user.id]
        );

        // Register Google Calendar webhook for push notifications on calendar changes
        try {
          const channelId = `myapp-${user.id}-${uuidv4()}`;
          const webhookUrl = `${process.env.API_BASE_URL}/api/webhooks/google-calendar?token=${process.env.WEBHOOK_SECRET}`;
          await watchCalendarEvents(user, channelId, webhookUrl);
          console.log(`Registered Google Calendar webhook for user ${user.email}`);
        } catch (err) {
          console.error('Failed to register Google Calendar webhook:', err);
          // Do NOT block login if webhook registration fails
        }
      }

      // Set JWT as HTTP-only cookie
      res.cookie('auth_token', generateToken(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // true only in production with HTTPS
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/home`);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }
);

// Endpoint to get current authenticated user info based on JWT token in cookie or Authorization header
router.get('/me', async (req, res) => {
  try {
    const token =
      req.cookies.auth_token ||
      (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7));

    if (!token) {
      return res.status(401).json({ error: 'Authentication token missing' });
    }

    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be set');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userRes = await db.query(
      'SELECT id, email, name, avatar_url, google_id, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    return res.json({ user: userRes.rows[0] });
  } catch (err) {
    console.error('Auth check error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint clears the auth token cookie
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
