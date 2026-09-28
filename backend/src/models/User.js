import { getPool } from '../config/db.js';

// Never select password_hash unless explicitly needed (e.g. login compare).
const PUBLIC_FIELDS = 'id, full_name, email, created_at, updated_at';

// Converts a DB row into the API shape. password_hash is never included.
function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findUserByEmail(email) {
  const [rows] = await getPool().execute(
    `SELECT id, full_name, email, password_hash, created_at, updated_at
       FROM users
      WHERE email = ?
      LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await getPool().execute(
    `SELECT ${PUBLIC_FIELDS}
       FROM users
      WHERE id = ?
      LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function createUser({ fullName, email, passwordHash }) {
  const [result] = await getPool().execute(
    'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
    [fullName, email, passwordHash],
  );
  return findUserById(result.insertId);
}

export { toPublicUser };
