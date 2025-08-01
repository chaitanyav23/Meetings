import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('OAuth Profile:', profile);
        console.log('Refresh Token:', refreshToken);

        const existingUser = await pool.query(
          'SELECT * FROM users WHERE google_id = $1 OR email = $2',
          [profile.id, profile.emails[0].value]
        );

        if (existingUser.rows.length > 0) {
          const user = existingUser.rows[0];
          let updatedUser;
          if (refreshToken) {
            updatedUser = await pool.query(
              `UPDATE users SET 
                google_id = $1, 
                google_refresh_token = $2,
                avatar_url = $3,
                updated_at = NOW()
                WHERE id = $4
                RETURNING *`,
              [profile.id, refreshToken, profile.photos[0]?.value, user.id]
            );
          } else {
            // Do NOT overwrite the old refresh token if none received
            updatedUser = await pool.query(
              `UPDATE users SET 
                google_id = $1, 
                avatar_url = $2,
                updated_at = NOW()
                WHERE id = $3
                RETURNING *`,
              [profile.id, profile.photos[0]?.value, user.id]
            );
          }
          return done(null, updatedUser.rows[0], { refreshToken });
        } else {
          // On creation, insert whatever refreshToken is present
          const newUser = await pool.query(
            `INSERT INTO users (id, email, name, google_id, google_refresh_token, avatar_url)
              VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
              RETURNING *`,
            [
              profile.emails[0].value,
              profile.displayName || profile.name?.givenName || '',
              profile.id,
              refreshToken,
              profile.photos[0]?.value || '',
            ]
          );
          return done(null, newUser.rows[0], { refreshToken });
        }
      } catch (error) {
        console.error('Google OAuth Error:', error);
        return done(error, null);
      }
    }
  )
);

// Always include access_type and prompt on every Google authorization request
GoogleStrategy.prototype.authorizationParams = function (options) {
  return {
    access_type: 'offline',
    prompt: 'consent',
  };
};

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
