import { Router } from 'express';
import {
  listConversations,
  getConversation,
  createConversation,
  deleteConversation,
} from '../controllers/conversationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody, createConversationSchema } from '../middleware/validation.js';

const router = Router();

router.get('/', authenticate, listConversations);
router.get('/:id', authenticate, getConversation);
router.post('/', authenticate, validateBody(createConversationSchema), createConversation);
router.delete('/:id', authenticate, deleteConversation);

export default router;
