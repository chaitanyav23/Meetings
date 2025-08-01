import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('✅ Postgres connected');
});

// Helper to run queries (mostly use pool.query or transactions as needed)
const query = (text, params) => pool.query(text, params);

export { pool };
export default {
  query,
  pool,
};
