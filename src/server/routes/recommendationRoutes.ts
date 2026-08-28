import { Router } from 'express';
import {
  getRecommendations,
  dismissRecommendation,
  getRecommendationCenter,
  parseCareerGoal,
  explainRoadmap,
  completeOnboarding,
  submitWeeklyCheckIn,
} from '../controllers/recommendationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Recommendation Center & Explanations
router.get('/center', authenticate, getRecommendationCenter);
router.post('/parse-goal', authenticate, parseCareerGoal);
router.post('/explain', authenticate, explainRoadmap);
router.post('/onboarding', authenticate, completeOnboarding);
router.post('/weekly-checkin', authenticate, submitWeeklyCheckIn);

// Legacy course recommendations
router.get('/', authenticate, getRecommendations);
router.post('/:id/dismiss', authenticate, dismissRecommendation);

export default router;
