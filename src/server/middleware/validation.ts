import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory that validates req.body against a Zod schema.
 * Returns 400 with structured error messages on validation failure.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as any).issues || (error as any).errors || [];
        return res.status(400).json({
          success: false,
          message: 'Validation failed.',
          errors: issues.map((e: any) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware factory that validates req.query against a Zod schema.
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as any).issues || (error as any).errors || [];
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters.',
          errors: issues.map((e: any) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware factory that validates req.params against a Zod schema.
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as any).issues || (error as any).errors || [];
        return res.status(400).json({
          success: false,
          message: 'Invalid route parameters.',
          errors: issues.map((e: any) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

// ═══════════════════════════════════════════════════════
//  Zod Schemas for all routes
// ═══════════════════════════════════════════════════════

// Auth
export const registerSchema = z.object({
  email: z.string().email('Valid email is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  name: z.string().min(1, 'Name is required.').max(100),
  targetRole: z.string().max(100).optional(),
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

// User preferences
export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  targetRole: z.string().max(100).optional(),
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  dailyGoalMinutes: z.number().int().min(5).max(480).optional(),
});

// User profile
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  headline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
});

// AI Chat
export const sendChatMessageSchema = z.object({
  conversationId: z.string().uuid().optional().nullable(),
  message: z.string().min(1, 'Message cannot be empty.').max(5000),
});

// Learning path generation
export const regeneratePathSchema = z.object({
  targetRole: z.string().min(1).max(100).optional(),
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  goalDescription: z.string().max(2000).optional(),
});

// Assessment submission
export const submitAssessmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedOptionIndex: z.number().int().min(0).max(10),
    })
  ).min(1, 'At least one answer is required.'),
});

// Conversation creation
export const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
  initialMessage: z.string().max(5000).optional(),
});

// Progress
export const updateLessonProgressSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required.'),
  isCompleted: z.boolean().optional(),
});

// Query schemas
export const courseQuerySchema = z.object({
  category: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
}).passthrough();

export const assessmentQuerySchema = z.object({
  category: z.string().max(100).optional(),
}).passthrough();

// Param schemas
export const idParamSchema = z.object({
  id: z.string().min(1),
}).passthrough();

export const slugParamSchema = z.object({
  slug: z.string().min(1),
}).passthrough();

export const taskIdParamSchema = z.object({
  taskId: z.string().min(1),
}).passthrough();
