import { Router } from 'express';
import passport from '../config/passport.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import db from '../config/db.js'; // Adjust if your db client path differs
import cookieParser from 'cookie-parser';

const router = Router();

// Middleware to parse cookies (make sure this is also in your main app if needed)
router.use(cookieParser());

// Helper to generate JWT tokens
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Initiate Google OAuth login
router.get(
  '/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
    ],
    accessType: 'offline', // Request refresh token
    prompt: 'consent',
  })
);

// Google OAuth callback handler
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: 'http://localhost:3000/login',
  }),
  async (req, res) => {
    try {
      // `req.user` is your DB user record from the passport verify callback
      const user = req.user;

      const email = user.email;
      const googleId = user.google_id;
      const name = user.name;
      const profilePicture = user.avatar_url || null;
      const refreshToken = req.authInfo?.refreshToken || null;

      if (!email) {
        return res.redirect('http://localhost:3000/login?error=no_email');
      }

      // Confirm user exists in DB (defensive)
      const existingUserResult = await db.query(
        'SELECT * FROM users WHERE google_id = $1 OR email = $2',
        [googleId, email]
      );

      if (existingUserResult.rows.length > 0) {
        const existingUser = existingUserResult.rows[0];

        // Update refresh token if changed
        if (refreshToken && refreshToken !== existingUser.google_refresh_token) {
          await db.query(
            'UPDATE users SET google_refresh_token = $1, updated_at = NOW() WHERE id = $2',
            [refreshToken, existingUser.id]
          );
          existingUser.google_refresh_token = refreshToken;
        }

        // Create JWT token, set as cookie
        const token = generateToken(existingUser);

        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/home`);
      } else {
        // New user, set a temporary token with the Google info to finish signup
        const tempUser = {
          googleId,
          email,
          name,
          profilePicture,
          google_refresh_token: refreshToken,
        };

        const tempToken = jwt.sign(tempUser, process.env.JWT_SECRET || 'your-secret-key', {
          expiresIn: '1h',
        });

        res.cookie('temp_auth_token', tempToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 1000,
        });

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/setup-account`);
      }
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }
);

// Route for user to complete account setup with username/password after Google OAuth
router.post('/setup-account', async (req, res) => {
  try {
    const { username, password } = req.body;
    const tempToken = req.cookies.temp_auth_token;

    if (!tempToken) {
      return res.status(400).json({ error: 'No temporary authentication found' });
    }

    let tempUserData;
    try {
      tempUserData = jwt.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (!validator.isLength(username, { min: 3, max: 50 })) {
      return res.status(400).json({ error: 'Username must be 3 to 50 characters' });
    }

    if (!validator.isLength(password, { min: 6 })) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check username uniqueness
    const usernameExists = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (usernameExists.rows.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Check if email is already registered
    const emailExists = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [tempUserData.email]
    );
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new user
    const insertRes = await db.query(
      `INSERT INTO users (username, email, password_hash, name, google_id, google_refresh_token, avatar_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, username, email, name, google_id, avatar_url`,
      [
        username,
        tempUserData.email,
        passwordHash,
        tempUserData.name,
        tempUserData.googleId,
        tempUserData.google_refresh_token || null,
        tempUserData.profilePicture || null,
      ]
    );
    const user = insertRes.rows[0];

    const token = generateToken(user);

    // Clear temp token cookie, set auth token cookie
    res.clearCookie('temp_auth_token');
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, user, token });
  } catch (error) {
    console.error('Setup account error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Username & password login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const userRes = await db.query('SELECT * FROM users WHERE username = $1', [username]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = userRes.rows[0];

    if (!user.password_hash) {
      return res.status(401).json({ error: 'User registered with Google only; please use Google sign-in' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
      token,
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch current user info if authenticated
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.auth_token || (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7));

    if (!token) {
      return res.status(401).json({ error: 'Authentication token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const userRes = await db.query(
      'SELECT id, username, email, name, avatar_url, google_id, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    return res.json({ user: userRes.rows[0] });
  } catch (e) {
    console.error('Auth check error:', e);
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route clears cookies
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.clearCookie('temp_auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get temporary user data for setup page
router.get('/temp-user', (req, res) => {
  try {
    const tempToken = req.cookies.temp_auth_token;

    if (!tempToken) {
      return res.status(400).json({ error: 'No temporary token found' });
    }

    const tempUserData = jwt.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');

    return res.json({
      email: tempUserData.email,
      name: tempUserData.name,
      profilePicture: tempUserData.profilePicture || null,
    });
  } catch (e) {
    console.error('Temp user error:', e);
    if (e.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
