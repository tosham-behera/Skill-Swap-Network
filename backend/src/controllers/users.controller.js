import { searchUsers } from '../models/User.js';
import { httpError } from '../middleware/errors.js';

// GET /api/users/search?q=<name or skill>
// Auth required; the logged-in user is never included in results.
export async function searchUsersHandler(req, res, next) {
  try {
    const q = String(req.query?.q ?? '').trim();
    if (!q) {
      throw httpError(400, 'VALIDATION_ERROR', 'Provide a search query via the "q" parameter.');
    }
    if (q.length > 80) {
      throw httpError(400, 'VALIDATION_ERROR', 'Search query must be at most 80 characters.');
    }
    const users = await searchUsers(req.user.id, q);
    return res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}
