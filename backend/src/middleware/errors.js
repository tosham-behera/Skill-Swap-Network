// Small helper so controllers can `throw httpError(400, 'CODE', 'message')`.
export function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`,
    },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // MySQL duplicate key (unique email) - can happen even after a pre-check,
  // e.g. two concurrent registrations.
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists.',
      },
    });
  }

  // MySQL connectivity / auth problems - log details, return a generic message.
  const DB_CODES = new Set(['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ETIMEDOUT']);
  if (err && DB_CODES.has(err.code)) {
    console.error(`[db] ${err.code}: ${err.message}`);
    return res.status(503).json({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database is unavailable. Check backend MySQL configuration.',
      },
    });
  }

  // Malformed JSON body from express.json().
  if (err && (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400))) {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' },
    });
  }

  const status = err.status || 500;
  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      // Hide internals for unexpected 500s; pass through messages we threw ourselves.
      message: status >= 500 && !err.status ? 'Something went wrong.' : err.message,
    },
  });
}
