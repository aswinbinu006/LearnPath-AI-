import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  getSessions,
  revokeSession,
  logoutAllSessions,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody, registerSchema, loginSchema } from '../middleware/validation.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', authenticate, logoutAllSessions);
router.get('/me', authenticate, getMe);
router.get('/sessions', authenticate, getSessions);
router.delete('/sessions/:sessionId', authenticate, revokeSession);

export default router;
