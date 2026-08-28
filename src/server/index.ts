import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';
import { validateEnv } from './config/envValidator.js';
import { prisma } from './services/prismaClient.js';

dotenv.config();

// Validate production environment configurations
const validatedEnv = validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(validatedEnv.PORT, 10) || 5000;

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — origins driven by env var, not hardcoded
const allowedOrigins = validatedEnv.CORS_ORIGIN
  ? validatedEnv.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Global rate limiting
app.use(globalRateLimiter);

// Structured request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip || req.socket.remoteAddress,
      });
    }
  });
  next();
});

// API Routes
app.use('/api', apiRouter);

// Serve static frontend assets if in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`LearnPath AI Server running on port ${PORT}`, {
    port: PORT,
    environment: validatedEnv.NODE_ENV,
    nodeVersion: process.version,
  });
  logger.info(`API endpoint: http://localhost:${PORT}/api`);
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnection', err);
      process.exit(1);
    }
  });

  // Force close after 10s if hung
  setTimeout(() => {
    logger.error('Forceful shutdown triggered after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;

