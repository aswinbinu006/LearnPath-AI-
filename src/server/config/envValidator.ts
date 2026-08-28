import { z } from 'zod';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for PostgreSQL persistence'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters for security'),
  REFRESH_TOKEN_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  ADMIN_SECURITY_CODE: z.string().default('HCL-ADMIN-2026'),
  GEMINI_API_KEY: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnv(): ValidatedEnv {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      console.error('❌ FATAL: Production environment validation failed:');
      (err.issues || []).forEach((e: any) => {
        console.error(`  - ${e.path.join('.')}: ${e.message}`);
      });
      process.exit(1);
    }
    throw err;
  }
}

