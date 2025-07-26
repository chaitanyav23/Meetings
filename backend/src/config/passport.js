import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI,
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('OAuth Profile:', profile);
    console.log('Refresh Token:', refreshToken);

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [profile.id, profile.emails[0].value]
    );

    if (existingUser.rows.length > 0) {
      // Update existing user
      const user = existingUser.rows[0];
      const updatedUser = await pool.query(
        `UPDATE users SET 
          google_id = $1, 
          google_refresh_token = $2, 
          avatar_url = $3,
          updated_at = NOW()
          WHERE id = $4
          RETURNING *`,
        [profile.id, refreshToken, profile.photos[0].value, user.id]
      );

      // Pass refreshToken in info parameter so it is accessible in req.authInfo
      return done(null, updatedUser.rows[0], { refreshToken });
    } else {
      // Create new user
      const newUser = await pool.query(
        `INSERT INTO users (id, email, name, google_id, google_refresh_token, avatar_url)
          VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
          RETURNING *`,
        [
          profile.emails[0].value,
          profile.displayName,
          profile.id,
          refreshToken,
          profile.photos[0].value
        ]
      );

      return done(null, newUser.rows[0], { refreshToken });
    }
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    console.log('Deserializing user:', id);
    done(null, result.rows[0]);
  } catch (error) {
    console.error('Deserialize error:', error);
    done(error, null);
  }
});

export default passport;
