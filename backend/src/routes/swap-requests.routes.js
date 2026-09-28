import { Router } from 'express';
import { listSwapRequests, listActiveExchanges, listCompletedExchanges, completeExchangeHandler, createSwapRequestHandler, respondToSwapRequest } from '../controllers/swap-requests.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listSwapRequests);
router.get('/active', requireAuth, listActiveExchanges);
router.get('/completed', requireAuth, listCompletedExchanges);
router.post('/', requireAuth, createSwapRequestHandler);
router.patch('/:id', requireAuth, respondToSwapRequest);
router.patch('/:id/complete', requireAuth, completeExchangeHandler);

export default router;
