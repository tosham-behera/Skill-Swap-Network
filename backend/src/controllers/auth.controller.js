import bcrypt from 'bcryptjs';
import {
  findUserByEmail,
  findUserById,
  createUser,
  toPublicUser,
} from '../models/User.js';
import { signAuthToken, authCookieOptions, COOKIE_NAME } from '../middleware/auth.js';
import { httpError } from '../middleware/errors.js';

const BCRYPT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FULL_NAME = 120; // matches schema VARCHAR(120)
const MAX_EMAIL = 255; // matches schema VARCHAR(255)
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72; // bcrypt operates on at most 72 bytes

function normalizeEmail(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, authCookieOptions());
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const fullName = String(req.body?.fullName ?? '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');

    if (!fullName) {
      throw httpError(400, 'VALIDATION_ERROR', 'Full name is required.');
    }
    if (fullName.length > MAX_FULL_NAME) {
      throw httpError(400, 'VALIDATION_ERROR', `Full name must be at most ${MAX_FULL_NAME} characters.`);
    }
    if (!email || !EMAIL_RE.test(email)) {
      throw httpError(400, 'VALIDATION_ERROR', 'A valid email address is required.');
    }
    if (email.length > MAX_EMAIL) {
      throw httpError(400, 'VALIDATION_ERROR', `Email must be at most ${MAX_EMAIL} characters.`);
    }
    if (!password || password.length < MIN_PASSWORD) {
      throw httpError(400, 'VALIDATION_ERROR', `Password must be at least ${MIN_PASSWORD} characters.`);
    }
    if (password.length > MAX_PASSWORD) {
      throw httpError(400, 'VALIDATION_ERROR', `Password must be at most ${MAX_PASSWORD} characters.`);
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      throw httpError(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await createUser({ fullName, email, passwordHash });
    // Concurrent duplicate inserts are caught by the UNIQUE index and mapped
    // to 409 by the centralized error handler (ER_DUP_ENTRY).

    const token = signAuthToken(user.id);
    setAuthCookie(res, token);

    return res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');

    if (!email || !password) {
      throw httpError(400, 'VALIDATION_ERROR', 'Email and password are required.');
    }

    const user = await findUserByEmail(email);
    // Same bcrypt cost either way; generic message avoids account enumeration.
    const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !passwordOk) {
      throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const token = signAuthToken(user.id);
    setAuthCookie(res, token);

    return res.status(200).json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me (requireAuth runs first and sets req.user.id)
export async function me(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      throw httpError(401, 'UNAUTHORIZED', 'Account no longer exists.');
    }
    return res.status(200).json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, authCookieOptions());
  return res.status(200).json({ status: 'ok' });
}
