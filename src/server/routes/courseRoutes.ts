import { Router } from 'express';
import {
  listCourses,
  getCourseDetails,
  completeCourse,
  startCourse,
  getCourseQuiz,
  submitCourseQuiz,
} from '../controllers/courseController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', listCourses);
router.get('/:slug', getCourseDetails);
router.post('/:slug/start', authenticate, startCourse);
router.post('/:slug/complete', authenticate, completeCourse);
router.get('/:slug/quiz', authenticate, getCourseQuiz);
router.post('/:slug/quiz-attempt', authenticate, submitCourseQuiz);

export default router;
