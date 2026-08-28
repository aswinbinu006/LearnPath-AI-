import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import learningPathRoutes from './learningPathRoutes.js';
import courseRoutes from './courseRoutes.js';
import progressRoutes from './progressRoutes.js';
import skillRoutes from './skillRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import aiChatRoutes from './aiChatRoutes.js';
import adminRoutes from './adminRoutes.js';
import pairProgrammerRoutes from './pairProgrammerRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/learning-path', learningPathRoutes);
apiRouter.use('/courses', courseRoutes);
apiRouter.use('/progress', progressRoutes);
apiRouter.use('/skills', skillRoutes);
apiRouter.use('/assessments', assessmentRoutes);
apiRouter.use('/recommendations', recommendationRoutes);
apiRouter.use('/conversations', conversationRoutes);
apiRouter.use('/ai/chat', aiChatRoutes);
apiRouter.use('/ai/pair-programmer', pairProgrammerRoutes);


import { prisma } from '../services/prismaClient.js';

// Deep System Health Check Route
apiRouter.get('/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = -1;

  try {
    const dbCheckStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbCheckStart;
    dbStatus = 'healthy';
  } catch (err: any) {
    dbStatus = 'unhealthy';
  }

  const memory = process.memoryUsage();
  const isHealthy = dbStatus === 'healthy';

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    system: {
      memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
      memoryHeapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
      nodeVersion: process.version,
    },
  };

  res.status(isHealthy ? 200 : 503).json(payload);
});

export default apiRouter;


