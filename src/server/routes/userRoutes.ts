import { Router } from 'express';
import { getPreferences, updatePreferences, updateProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody, updatePreferencesSchema, updateProfileSchema } from '../middleware/validation.js';

const router = Router();

router.get('/preferences', authenticate, getPreferences);
router.put('/preferences', authenticate, validateBody(updatePreferencesSchema), updatePreferences);
router.put('/profile', authenticate, validateBody(updateProfileSchema), updateProfile);

export default router;
