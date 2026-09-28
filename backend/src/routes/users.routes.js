import { Router } from 'express';
import { getMySkills, addMySkill } from '../controllers/skills.controller.js';
import { searchUsersHandler } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';

// Mounted at /api/users in server.js. The Dashboard fetches
// GET/POST /api/users/me/skills, which previously 404'd because these
// handlers were only reachable under /api/skills/me/skills.
const router = Router();

router.get('/me/skills', requireAuth, getMySkills);
router.post('/me/skills', requireAuth, addMySkill);
router.get('/search', requireAuth, searchUsersHandler);

export default router;
