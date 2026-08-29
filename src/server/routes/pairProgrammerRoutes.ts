import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import {
  analyzeCode,
  getHint,
  chatWithPairMentor,
  runSandbox,
} from '../controllers/pairProgrammerController.js';

const router = Router();

// All pair programming endpoints require authentication + rate limiting
router.use(authenticate);
router.use(aiRateLimiter);

router.post('/analyze', analyzeCode);
router.post('/hint', getHint);
router.post('/chat', chatWithPairMentor);
router.post('/run', runSandbox);

export default router;
