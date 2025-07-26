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

const query = (text, params) => pool.query(text, params);

export { pool };
export default {
  query,
  pool,
};
