import { Router } from 'express';
import { sendChatMessage, streamChatMessage, getMentorContext } from '../controllers/aiChatController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody, sendChatMessageSchema } from '../middleware/validation.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/context', authenticate, getMentorContext);
router.post('/', authenticate, aiRateLimiter, validateBody(sendChatMessageSchema), sendChatMessage);
router.post('/stream', authenticate, aiRateLimiter, streamChatMessage);

export default router;

