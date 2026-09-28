import { Router } from 'express';
import { listSkills, createSkill, getMySkills, addMySkill } from '../controllers/skills.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Catalog list stays open so logged-out users can browse skills (per spec table);
// everything else requires auth.
router.get('/', listSkills);
router.post('/', requireAuth, createSkill);
router.get('/me/skills', requireAuth, getMySkills);
router.post('/me/skills', requireAuth, addMySkill);

export default router;
