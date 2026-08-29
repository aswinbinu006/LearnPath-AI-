import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';
import { validateEnv } from './config/envValidator.js';
import { prisma } from './services/prismaClient.js';
import { ensureCourseCatalogSeeded } from './services/courseCatalogService.js';

dotenv.config();

// Validate production environment configurations
const validatedEnv = validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(validatedEnv.PORT, 10) || 5000;

// Trust proxy headers from Render/cloud load balancers
app.set('trust proxy', 1);

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — support local development and deployed Render domains
const allowedOrigins = validatedEnv.CORS_ORIGIN
  ? validatedEnv.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. same-origin SPA, mobile apps, curl)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
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

// Serve static frontend assets
const possibleDistPaths = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(__dirname, '../../dist'),
  path.resolve(__dirname, '..'),
  path.resolve(__dirname, '../..'),
];

const distPath = possibleDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (distPath) {
  logger.info(`Serving static frontend assets from: ${distPath}`);
  app.use(express.static(distPath));

  // SPA fallback for all non-API GET routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  logger.warn('Frontend build (dist/index.html) not found. API routes are active.');
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      message: 'LearnPath AI API Server is running.',
      hint: 'Frontend dist/index.html was not found. Please build frontend with `npm run build`.',
      healthCheck: '/api/health',
    });
  });
}

// Error handling middleware
app.use(errorHandler);

// Automatic database schema & seed check on startup
async function initDatabase() {
  try {
    await prisma.user.count();
    logger.info('Database schema and tables verified.');
    await ensureCourseCatalogSeeded();
  } catch (err: any) {
    logger.warn('Database tables missing or uninitialized. Initializing schema...', { error: err?.message });
    try {
      const { execSync } = await import('child_process');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      logger.info('Database schema pushed successfully.');

      const userCount = await prisma.user.count();
      if (userCount === 0) {
        logger.info('Database is empty. Seeding starter curriculum & demo accounts...');
        execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
        logger.info('Database seeding completed successfully.');
      }
      await ensureCourseCatalogSeeded();
    } catch (pushErr) {
      logger.error('Database schema auto-push failed, will continue...', pushErr);
    }
  }
}

const server = app.listen(PORT, async () => {
  logger.info(`LearnPath AI Server running on port ${PORT}`, {
    port: PORT,
    environment: validatedEnv.NODE_ENV,
    nodeVersion: process.version,
  });
  logger.info(`API endpoint: http://localhost:${PORT}/api`);
  await initDatabase();
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

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection', reason);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception — shutting down', err);
  handleShutdown('uncaughtException');
});

export default app;

