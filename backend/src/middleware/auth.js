import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const authenticateToken = async (req, res, next) => {
  try {
    // Prefer JWT from cookie; fallback to Bearer header
    const token =
      req.cookies?.auth_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be set in environment variables!');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userResult = await db.query(
      'SELECT id, email, name, avatar_url, google_id FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export default authenticateToken;
