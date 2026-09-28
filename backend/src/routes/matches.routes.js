import { Router } from 'express';
import { listMatches } from '../controllers/matches.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listMatches);

export default router;
