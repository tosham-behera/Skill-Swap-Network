import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import skillsRoutes from './routes/skills.routes.js';
import matchesRoutes from './routes/matches.routes.js';
import swapRequestRoutes from './routes/swap-requests.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errors.js';

const app = express();

// Trust the first proxy (e.g. nginx/Render) so secure cookies work in production.
app.set('trust proxy', 1);

// CORS locked to the Vite frontend. No wildcard origin with credentials.
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Health check (no auth, no DB).
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/swap-requests', swapRequestRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);

function reportMissingConfig() {
  const required = ['DB_USER', 'DB_NAME', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');

  if (!process.env.DB_HOST) {
    console.warn('[config] DB_HOST not set - defaulting to "localhost".');
  }
  if (!process.env.DB_PORT) {
    console.warn('[config] DB_PORT not set - defaulting to 3306.');
  }
  if (!process.env.DB_PASSWORD) {
    console.warn('[config] DB_PASSWORD not set - using empty password.');
  }
  if (!process.env.CLIENT_URL) {
    console.warn('[config] CLIENT_URL not set - defaulting to "http://localhost:5173".');
  }

  return missing;
}

async function start() {
  const missing = reportMissingConfig();
  if (missing.length > 0) {
    console.error('[config] Missing required environment variables: ' + missing.join(', '));
    console.error('[config] Copy backend/.env.example to backend/.env and fill in real values.');
    process.exit(1);
  }

  // Non-fatal DB check: the server still starts so /api/health works while
  // MySQL is being configured; auth endpoints will return 503 until it is reachable.
  try {
    await connectDB();
    console.log('[db] MySQL connection OK');
  } catch (err) {
    console.error('[db] MySQL connection FAILED -', err.code || '', err.message);
    console.error('[db] Checklist to fix:');
    console.error('[db]   1. Is MySQL Server 8.4 installed and running?');
    console.error(`[db]   2. Create the database/schema: mysql -u ${process.env.DB_USER} -p < sql/schema.sql`);
    console.error('[db]   3. Verify DB_USER / DB_PASSWORD in backend/.env match your MySQL root credentials.');
  }

  app.listen(PORT, () => {
    console.log(`[server] SkillBridge API listening on http://localhost:${PORT}`);
  });
}

start();
