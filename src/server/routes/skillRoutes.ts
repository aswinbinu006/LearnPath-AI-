import { Router } from 'express';
import { getSkillAnalysis } from '../controllers/skillController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getSkillAnalysis);
router.get('/analysis', authenticate, getSkillAnalysis);

export default router;
