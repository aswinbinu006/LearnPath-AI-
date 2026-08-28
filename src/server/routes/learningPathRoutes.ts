import { Router } from 'express';
import { getLearningPath, regeneratePath } from '../controllers/learningPathController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody, regeneratePathSchema } from '../middleware/validation.js';

const router = Router();

router.get('/', authenticate, getLearningPath);
router.post('/generate', authenticate, validateBody(regeneratePathSchema), regeneratePath);

export default router;
