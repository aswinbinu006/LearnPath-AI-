import { Router } from 'express';
import { toggleFocusTask, updateLessonProgress } from '../controllers/progressController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody, updateLessonProgressSchema } from '../middleware/validation.js';

const router = Router();

router.patch('/focus/:taskId/toggle', authenticate, toggleFocusTask);
router.post('/lesson', authenticate, validateBody(updateLessonProgressSchema), updateLessonProgress);

export default router;
