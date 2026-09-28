import { getPool } from '../config/db.js';

export const MAX_SKILL_NAME = 80; // matches schema VARCHAR(80)

function normalizeSkillName(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------

export async function getAllSkills() {
  const [rows] = await getPool().execute(
    'SELECT id, name FROM skills ORDER BY name ASC',
  );
  return rows;
}

export async function findSkillById(id) {
  const [rows] = await getPool().execute(
    'SELECT id, name FROM skills WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0] || null;
}

export async function findSkillByName(name) {
  const [rows] = await getPool().execute(
    'SELECT id, name FROM skills WHERE name = ? LIMIT 1',
    [normalizeSkillName(name)],
  );
  return rows[0] || null;
}

// Get-or-create by exact (normalized) name. Relies on uq_skills_name;
// a concurrent insert races to the same canonical row.
export async function findOrCreateSkill(rawName) {
  const name = normalizeSkillName(rawName);
  if (!name || name.length > MAX_SKILL_NAME) return null;
  const existing = await findSkillByName(name);
  if (existing) return existing;
  const [result] = await getPool().execute(
    'INSERT INTO skills (name) VALUES (?)',
    [name],
  );
  return { id: result.insertId, name };
}

// ---------------------------------------------------------------
// Per-user skill links
// ---------------------------------------------------------------

export async function getTeachSkills(userId) {
  const [rows] = await getPool().execute(
    `SELECT s.id, s.name, us.created_at AS added_at
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
      WHERE us.user_id = ?
      ORDER BY us.created_at ASC, s.name ASC`,
    [userId],
  );
  return rows;
}

export async function getWantedSkills(userId) {
  const [rows] = await getPool().execute(
    `SELECT s.id, s.name, uw.created_at AS added_at
       FROM user_wanted_skills uw
       JOIN skills s ON s.id = uw.skill_id
      WHERE uw.user_id = ?
      ORDER BY uw.created_at ASC, s.name ASC`,
    [userId],
  );
  return rows;
}

export async function addTeachSkill(userId, skillId) {
  await getPool().execute(
    'INSERT IGNORE INTO user_skills (user_id, skill_id) VALUES (?, ?)',
    [userId, skillId],
  );
}

export async function addWantedSkill(userId, skillId) {
  await getPool().execute(
    'INSERT IGNORE INTO user_wanted_skills (user_id, skill_id) VALUES (?, ?)',
    [userId, skillId],
  );
}

export async function userTeachesSkill(userId, skillId) {
  const [rows] = await getPool().execute(
    'SELECT 1 AS x FROM user_skills WHERE user_id = ? AND skill_id = ? LIMIT 1',
    [userId, skillId],
  );
  return rows.length > 0;
}

export async function userWantsSkill(userId, skillId) {
  const [rows] = await getPool().execute(
    'SELECT 1 AS x FROM user_wanted_skills WHERE user_id = ? AND skill_id = ? LIMIT 1',
    [userId, skillId],
  );
  return rows.length > 0;
}
