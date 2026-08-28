import { Router } from 'express';
import {
  adminLogin,
  listUsers,
  getUserProgressDetails,
  resetUserLearningPath,
  updateUserRole,
  getAnalytics,
  getAuditLogs,
  exportAuditLogs,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { adminAuthRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public Admin Login endpoint (with Rate Limiting & Master Security Code)
router.post('/login', adminAuthRateLimiter, adminLogin);


// Protected Admin Routes (require valid JWT + ADMIN role)
router.get('/users', authenticate, requireAdmin, listUsers);
router.get('/users/:userId/progress', authenticate, requireAdmin, getUserProgressDetails);
router.post('/users/:userId/reset-path', authenticate, requireAdmin, resetUserLearningPath);
router.patch('/users/:userId/role', authenticate, requireAdmin, updateUserRole);

router.get('/analytics', authenticate, requireAdmin, getAnalytics);
router.get('/audit-logs', authenticate, requireAdmin, getAuditLogs);
router.get('/audit-logs/export', authenticate, requireAdmin, exportAuditLogs);

export default router;
