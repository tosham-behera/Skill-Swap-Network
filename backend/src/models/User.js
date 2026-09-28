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

// ---------------------------------------------------------------
// Profile search (GET /api/users/search?q=...)
// Matches on full name, skills they teach, or skills they want to
// learn. The current user is always excluded. All user input is
// bound via ? placeholders; LIMIT is a constant, never user input.
// ---------------------------------------------------------------
const SEARCH_LIMIT = 20;

export async function searchUsers(currentUserId, rawQuery) {
  const pattern = `%${String(rawQuery).trim()}%`;
  const [rows] = await getPool().execute(
    `SELECT DISTINCT u.id, u.full_name, u.email
       FROM users u
       LEFT JOIN user_skills us ON us.user_id = u.id
       LEFT JOIN skills ts ON ts.id = us.skill_id
       LEFT JOIN user_wanted_skills uw ON uw.user_id = u.id
       LEFT JOIN skills ws ON ws.id = uw.skill_id
      WHERE u.id <> ?
        AND (u.full_name LIKE ? OR ts.name LIKE ? OR ws.name LIKE ?)
      ORDER BY u.full_name ASC
      LIMIT ${SEARCH_LIMIT}`,
    [currentUserId, pattern, pattern, pattern],
  );
  if (rows.length === 0) return [];

  // Attach each matched user's teach + wanted skills (parameterized IN).
  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => '?').join(', ');

  const [teachRows] = await getPool().execute(
    `SELECT us.user_id, s.id, s.name
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
      WHERE us.user_id IN (${placeholders})
      ORDER BY s.name ASC`,
    ids,
  );
  const [wantedRows] = await getPool().execute(
    `SELECT uw.user_id, s.id, s.name
       FROM user_wanted_skills uw
       JOIN skills s ON s.id = uw.skill_id
      WHERE uw.user_id IN (${placeholders})
      ORDER BY s.name ASC`,
    ids,
  );

  const teachByUser = new Map();
  for (const row of teachRows) {
    if (!teachByUser.has(row.user_id)) teachByUser.set(row.user_id, []);
    teachByUser.get(row.user_id).push({ id: row.id, name: row.name });
  }
  const wantedByUser = new Map();
  for (const row of wantedRows) {
    if (!wantedByUser.has(row.user_id)) wantedByUser.set(row.user_id, []);
    wantedByUser.get(row.user_id).push({ id: row.id, name: row.name });
  }

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    teachSkills: teachByUser.get(row.id) ?? [],
    wantedSkills: wantedByUser.get(row.id) ?? [],
  }));
}

export { toPublicUser };
