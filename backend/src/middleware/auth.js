import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'token';
export const JWT_EXPIRES_IN = '7d';
export const JWT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function signAuthToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Cookie options appropriate for local dev (secure off) and production
// (secure on, behind HTTPS).
export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: JWT_MAX_AGE_MS,
    path: '/',
  };
}

/**
 * 1. Reads the JWT from the httpOnly cookie.
 * 2. Verifies it.
 * 3. Attaches { id } to req.user.
 * 4. Rejects missing/invalid/expired tokens with 401.
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res
      .status(401)
      .json({ error: { code: 'UNAUTHORIZED', message: 'Missing authentication token.' } });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub) };
    return next();
  } catch {
    return res
      .status(401)
      .json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' } });
  }
}
