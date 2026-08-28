import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  analyzeCode,
  getHint,
  chatWithPairMentor,
  runSandbox,
} from '../controllers/pairProgrammerController.js';

const router = Router();

// All pair programming endpoints require authentication
router.use(authenticate);

router.post('/analyze', analyzeCode);
router.post('/hint', getHint);
router.post('/chat', chatWithPairMentor);
router.post('/run', runSandbox);

export default router;
