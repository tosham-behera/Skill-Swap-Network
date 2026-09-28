import { getMatchesForUser } from '../models/Match.js';

// GET /api/matches - deterministic two-way skill matches for me
export async function listMatches(req, res, next) {
  try {
    const matches = await getMatchesForUser(req.user.id);
    return res.status(200).json({ matches });
  } catch (err) {
    next(err);
  }
}
