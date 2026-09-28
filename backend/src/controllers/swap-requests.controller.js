import {
  createSwapRequest,
  findOpenSwapBetween,
  findSwapRequestById,
  getActiveExchangesForUser,
  getCompletedExchangesForUser,
  getSwapRequestsForUser,
  updateSwapRequestStatus,
} from '../models/SwapRequest.js';
import { findUserById } from '../models/User.js';
import { findSkillById } from '../models/Skill.js';
import { httpError } from '../middleware/errors.js';

// GET /api/swap-requests - my incoming + outgoing requests
export async function listSwapRequests(req, res, next) {
  try {
    const { incoming, outgoing } = await getSwapRequestsForUser(req.user.id);
    return res.status(200).json({ incoming, outgoing });
  } catch (err) {
    next(err);
  }
}

// GET /api/swap-requests/active - my accepted exchanges (either role)
export async function listActiveExchanges(req, res, next) {
  try {
    const exchanges = await getActiveExchangesForUser(req.user.id);
    return res.status(200).json({ exchanges });
  } catch (err) {
    next(err);
  }
}

// GET /api/swap-requests/completed - my completed exchanges (either role)
export async function listCompletedExchanges(req, res, next) {
  try {
    const exchanges = await getCompletedExchangesForUser(req.user.id);
    return res.status(200).json({ exchanges });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/swap-requests/:id/complete - mark an active exchange as done.
// Either participant may complete it; the row moves out of Active Exchanges
// and into Completed Exchanges for both users.
export async function completeExchangeHandler(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw httpError(400, 'VALIDATION_ERROR', 'Invalid swap request id.');
    }

    const swapRequest = await findSwapRequestById(id);
    if (!swapRequest) {
      throw httpError(404, 'SWAP_REQUEST_NOT_FOUND', 'Swap request not found.');
    }
    const isParticipant =
      swapRequest.requester.id === req.user.id || swapRequest.recipient.id === req.user.id;
    if (!isParticipant) {
      // 404 (not 403) avoids revealing other users' request ids.
      throw httpError(404, 'SWAP_REQUEST_NOT_FOUND', 'Swap request not found.');
    }
    if (swapRequest.status !== 'accepted') {
      const why =
        swapRequest.status === 'pending'
          ? 'This request has not been accepted yet.'
        : swapRequest.status === 'completed'
          ? 'This exchange was already completed.'
          : 'This request was declined; only accepted exchanges can be completed.';
      throw httpError(409, 'EXCHANGE_NOT_ACTIVE', why);
    }

    const updated = await updateSwapRequestStatus(id, 'completed');
    return res.status(200).json({ exchange: updated });
  } catch (err) {
    next(err);
  }
}

// POST /api/swap-requests
// Body: { recipientId, skillRequesterTeaches, skillRecipientTeaches }
// (skill values are skill IDs: what I teach them / what they teach me)
export async function createSwapRequestHandler(req, res, next) {
  try {
    const recipientId = Number(req.body?.recipientId);
    const skillRequesterTeaches = Number(req.body?.skillRequesterTeaches);
    const skillRecipientTeaches = Number(req.body?.skillRecipientTeaches);

    if (!Number.isInteger(recipientId) || recipientId <= 0) {
      throw httpError(400, 'VALIDATION_ERROR', 'A valid "recipientId" is required.');
    }
    if (!Number.isInteger(skillRequesterTeaches) || skillRequesterTeaches <= 0 ||
        !Number.isInteger(skillRecipientTeaches) || skillRecipientTeaches <= 0) {
      throw httpError(400, 'VALIDATION_ERROR', 'Both "skillRequesterTeaches" and "skillRecipientTeaches" skill IDs are required.');
    }
    if (recipientId === req.user.id) {
      throw httpError(400, 'VALIDATION_ERROR', 'You cannot send a swap request to yourself.');
    }

    // Everything must actually exist (FKs also enforce this; these checks
    // give friendly 400/404s instead of raw 500s).
    const [recipient, skillIOffer, skillTheyOffer] = await Promise.all([
      findUserById(recipientId),
      findSkillById(skillRequesterTeaches),
      findSkillById(skillRecipientTeaches),
    ]);
    if (!recipient) throw httpError(404, 'USER_NOT_FOUND', 'Recipient user not found.');
    if (!skillIOffer) throw httpError(404, 'SKILL_NOT_FOUND', 'Skill you want to teach was not found.');
    if (!skillTheyOffer) throw httpError(404, 'SKILL_NOT_FOUND', 'Skill you want to learn was not found.');

    const duplicate = await findOpenSwapBetween(
      req.user.id, recipientId, skillRequesterTeaches, skillRecipientTeaches,
    );
    if (duplicate) {
      throw httpError(409, 'SWAP_REQUEST_EXISTS', 'An open swap request for this exchange already exists.');
    }

    const swapRequest = await createSwapRequest({
      requesterId: req.user.id,
      recipientId,
      skillRequesterTeaches,
      skillRecipientTeaches,
    });
    return res.status(201).json({ swapRequest });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/swap-requests/:id - recipient accepts or declines
// Body: { status: 'accepted' | 'declined' }
export async function respondToSwapRequest(req, res, next) {
  try {
    const id = Number(req.params.id);
    const status = req.body?.status;
    if (!Number.isInteger(id) || id <= 0) {
      throw httpError(400, 'VALIDATION_ERROR', 'Invalid swap request id.');
    }
    if (status !== 'accepted' && status !== 'declined') {
      throw httpError(400, 'VALIDATION_ERROR', 'Field "status" must be "accepted" or "declined".');
    }

    const swapRequest = await findSwapRequestById(id);
    if (!swapRequest) {
      throw httpError(404, 'SWAP_REQUEST_NOT_FOUND', 'Swap request not found.');
    }
    if (swapRequest.recipient.id !== req.user.id) {
      // 404 (not 403) avoids revealing other users' request ids.
      throw httpError(404, 'SWAP_REQUEST_NOT_FOUND', 'Swap request not found.');
    }
    if (swapRequest.status !== 'pending') {
      throw httpError(409, 'SWAP_REQUEST_ALREADY_RESOLVED', `This request was already ${swapRequest.status}.`);
    }

    const updated = await updateSwapRequestStatus(id, status);
    return res.status(200).json({ swapRequest: updated });
  } catch (err) {
    next(err);
  }
}
