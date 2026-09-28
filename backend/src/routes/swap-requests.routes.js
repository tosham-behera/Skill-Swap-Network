import { Router } from 'express';
import { listSwapRequests, createSwapRequestHandler, respondToSwapRequest } from '../controllers/swap-requests.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listSwapRequests);
router.post('/', requireAuth, createSwapRequestHandler);
router.patch('/:id', requireAuth, respondToSwapRequest);

export default router;
