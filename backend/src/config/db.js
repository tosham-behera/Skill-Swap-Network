import 'dotenv/config';
import mysql from 'mysql2/promise';

// Lazily-created singleton pool. All queries use `?` placeholders
// (prepared statements) so user input is never concatenated into SQL.
let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || undefined,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      decimalNumbers: true,
    });
  }
  return pool;
}

// Quick connectivity check used at server startup (and by future health checks).
export async function connectDB() {
  await getPool().query('SELECT 1');
}

export async function closeDB() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
