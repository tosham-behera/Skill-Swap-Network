import { getPool } from '../config/db.js';

function toPublicSwapRequest(row) {
  return {
    id: row.id,
    status: row.status,
    requester: { id: row.requester_id, fullName: row.requester_name },
    recipient: { id: row.recipient_id, fullName: row.recipient_name },
    skillRequesterTeaches: { id: row.skill_requester_teaches, name: row.skill_requester_teaches_name },
    skillRecipientTeaches: { id: row.skill_recipient_teaches, name: row.skill_recipient_teaches_name },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const REQUEST_SELECT = `
  SELECT sr.id, sr.status, sr.created_at, sr.updated_at,
         sr.requester_id, ru.full_name AS requester_name,
         sr.recipient_id, ru2.full_name AS recipient_name,
         sr.skill_requester_teaches, s1.name AS skill_requester_teaches_name,
         sr.skill_recipient_teaches, s2.name AS skill_recipient_teaches_name
    FROM swap_requests sr
    JOIN users ru   ON ru.id  = sr.requester_id
    JOIN users ru2  ON ru2.id = sr.recipient_id
    JOIN skills s1  ON s1.id  = sr.skill_requester_teaches
    JOIN skills s2  ON s2.id  = sr.skill_recipient_teaches`;

export async function createSwapRequest({ requesterId, recipientId, skillRequesterTeaches, skillRecipientTeaches }) {
  const [result] = await getPool().execute(
    `INSERT INTO swap_requests
       (requester_id, recipient_id, skill_requester_teaches, skill_recipient_teaches)
     VALUES (?, ?, ?, ?)`,
    [requesterId, recipientId, skillRequesterTeaches, skillRecipientTeaches],
  );
  return findSwapRequestById(result.insertId);
}

// Open (pending/accepted) request for the exact same pair + skills, either direction.
export async function findOpenSwapBetween(userAId, userBId, skillA, skillB) {
  const [rows] = await getPool().execute(
    `${REQUEST_SELECT}
      WHERE sr.status IN ('pending', 'accepted')
        AND (
          (sr.requester_id = ? AND sr.recipient_id = ? AND sr.skill_requester_teaches = ? AND sr.skill_recipient_teaches = ?)
          OR
          (sr.requester_id = ? AND sr.recipient_id = ? AND sr.skill_requester_teaches = ? AND sr.skill_recipient_teaches = ?)
        )
      LIMIT 1`,
    [userAId, userBId, skillA, skillB, userAId, userBId, skillB, skillA],
  );
  return rows[0] || null;
}

export async function findSwapRequestById(id) {
  const [rows] = await getPool().execute(
    `${REQUEST_SELECT} WHERE sr.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ? toPublicSwapRequest(rows[0]) : null;
}

export async function getSwapRequestsForUser(userId) {
  const [rows] = await getPool().execute(
    `${REQUEST_SELECT}
      WHERE sr.requester_id = ? OR sr.recipient_id = ?
      ORDER BY
        FIELD(sr.status, 'pending', 'accepted', 'declined'),
        sr.updated_at DESC`,
    [userId, userId],
  );
  const requests = rows.map(toPublicSwapRequest);
  return {
    incoming: requests.filter((r) => r.recipient.id === userId),
    outgoing: requests.filter((r) => r.requester.id === userId),
  };
}

export async function updateSwapRequestStatus(id, status) {
  await getPool().execute(
    'UPDATE swap_requests SET status = ? WHERE id = ?',
    [status, id],
  );
  return findSwapRequestById(id);
}
