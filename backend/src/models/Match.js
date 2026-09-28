import { getPool } from '../config/db.js';

/**
 * Deterministic matching:
 *   User B matches me when:
 *     - B teaches a skill that I want to learn, AND
 *     - B wants to learn a skill that I teach.
 *
 * One SQL query finds every (candidate, theirTeachSkill, theirWantSkill)
 * combination; rows are grouped per candidate in JS into match pairs.
 * Users already linked by a pending/accepted swap are excluded.
 */
export async function getMatchesForUser(userId) {
  const [rows] = await getPool().execute(
    `SELECT u.id    AS user_id,
            u.full_name,
            u.email,
            ts.id   AS teaches_id,
            ts.name AS teaches_name,
            ws.id   AS wants_id,
            ws.name AS wants_name
       FROM users u
       JOIN user_skills tsl
         ON tsl.user_id = u.id
        AND tsl.skill_id IN (SELECT skill_id FROM user_wanted_skills WHERE user_id = ?)
       JOIN skills ts
         ON ts.id = tsl.skill_id
       JOIN user_wanted_skills wsl
         ON wsl.user_id = u.id
        AND wsl.skill_id IN (SELECT skill_id FROM user_skills WHERE user_id = ?)
       JOIN skills ws
         ON ws.id = wsl.skill_id
      WHERE u.id <> ?
        AND NOT EXISTS (
          SELECT 1 FROM swap_requests sr
           WHERE sr.status IN ('pending', 'accepted')
             AND ((sr.requester_id = ? AND sr.recipient_id = u.id)
               OR (sr.requester_id = u.id AND sr.recipient_id = ?))
        )
      ORDER BY u.full_name ASC, teaches_name ASC, wants_name ASC`,
    [userId, userId, userId, userId, userId],
  );

  const byUser = new Map();
  for (const row of rows) {
    if (!byUser.has(row.user_id)) {
      byUser.set(row.user_id, {
        user: { id: row.user_id, fullName: row.full_name, email: row.email },
        pairs: [],
      });
    }
    byUser.get(row.user_id).pairs.push({
      // From MY perspective: they teach what I learn; I teach what they want.
      youLearn: { id: row.teaches_id, name: row.teaches_name },
      youTeach: { id: row.wants_id, name: row.wants_name },
    });
  }
  return Array.from(byUser.values());
}
