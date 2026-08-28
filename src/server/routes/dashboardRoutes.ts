import { Router } from 'express';
import { getDashboardData, streamDashboardEvents } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getDashboardData);
router.get('/stream', authenticate, streamDashboardEvents);

export default router;

