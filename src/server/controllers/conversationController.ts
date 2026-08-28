import { Response } from 'express';
import { prisma } from '../services/prismaClient.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

export const listConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    const grouped = {
      TODAY: conversations.filter((c) => c.timeGroup === 'TODAY'),
      YESTERDAY: conversations.filter((c) => c.timeGroup === 'YESTERDAY'),
      PREVIOUS: conversations.filter((c) => c.timeGroup !== 'TODAY' && c.timeGroup !== 'YESTERDAY'),
    };

    return res.status(200).json({
      success: true,
      data: {
        conversations,
        grouped,
      },
    });
  } catch (error: any) {
    logger.error('Failed to list conversations', error);
    return res.status(500).json({ success: false, message: 'Failed to load conversations.' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    logger.error('Failed to get conversation', error);
    return res.status(500).json({ success: false, message: 'Failed to load conversation.' });
  }
};

export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { title = 'New Mentoring Session', initialMessage } = req.body;

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title,
        timeGroup: 'TODAY',
        messages: {
          create: [
            {
              role: 'assistant',
              content:
                initialMessage ||
                'Hello! I am your AI Mentor. What concept, coding challenge, or architecture problem would you like to explore today?',
            },
          ],
        },
      },
      include: {
        messages: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    logger.error('Failed to create conversation', error);
    return res.status(500).json({ success: false, message: 'Failed to create conversation.' });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { id } = req.params;

    await prisma.conversation.deleteMany({
      where: { id, userId },
    });

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully.',
    });
  } catch (error: any) {
    logger.error('Failed to delete conversation', error);
    return res.status(500).json({ success: false, message: 'Failed to delete conversation.' });
  }
};
