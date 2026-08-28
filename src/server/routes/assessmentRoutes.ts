import { Router } from 'express';
import {
  getAvailableAssessments,
  getAssessmentQuestions,
  submitAssessment,
  getAssessmentHistory,
  getBaselineQuiz,
  submitQuizAttempt,
} from '../controllers/assessmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody, submitAssessmentSchema } from '../middleware/validation.js';

const router = Router();

// Adaptive Quiz & Baseline Check
router.get('/baseline-quiz', authenticate, getBaselineQuiz);
router.post('/quiz-attempt', authenticate, submitQuizAttempt);

// Standard Assessments
router.get('/available', authenticate, getAvailableAssessments);
router.get('/questions', authenticate, getAssessmentQuestions);
router.post('/submit', authenticate, validateBody(submitAssessmentSchema), submitAssessment);
router.get('/history', authenticate, getAssessmentHistory);

export default router;
