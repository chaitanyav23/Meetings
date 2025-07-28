import { Router } from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import cookieParser from 'cookie-parser';

const router = Router();

// Middleware to parse cookies
router.use(cookieParser());

// Helper to generate JWT token (only id and email now)
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Google OAuth login – GMAIL ONLY
router.get(
  '/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
    ],
    accessType: 'offline', // to get refresh token
    prompt: 'consent',
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: 'http://localhost:3000/login',
  }),
  async (req, res) => {
    try {
      // req.user is DB user
      const user = req.user;
      const email = user.email;
      const refreshToken = req.authInfo?.refreshToken || null;

      if (!email) {
        return res.redirect('http://localhost:3000/login?error=no_email');
      }

      // Update Google refresh token if changed
      if (refreshToken && refreshToken !== user.google_refresh_token) {
        await db.query(
          'UPDATE users SET google_refresh_token = $1, updated_at = NOW() WHERE id = $2',
          [refreshToken, user.id]
        );
      }

      // Create auth token, set as httpOnly cookie
      const token = generateToken(user);

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Google OAuth flow always redirects to frontend home
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/home`);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
      );
    }
  }
);

// Fetch info for current logged-in user via token/cookie
router.get('/me', async (req, res) => {
  try {
    const token =
      req.cookies.auth_token ||
      (req.headers.authorization?.startsWith('Bearer ') &&
        req.headers.authorization.slice(7));

    if (!token) {
      return res.status(401).json({ error: 'Authentication token missing' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

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

// Logout: clear the token cookie
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
