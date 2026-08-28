import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for sensitive administrative authentication.
 * Strict lockout protection: 5 attempts per 5 minutes per IP.
 */
export const adminAuthRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Administrative login locked due to multiple failed attempts. Please try again after 5 minutes.',
  },
});

/**
 * Rate limiter for authentication routes (login, register).
 * Prevents brute-force attacks.
 * 10 requests per minute per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 1 minute.',
  },
});


/**
 * Rate limiter for AI chat routes.
 * Prevents Gemini API quota abuse.
 * 20 requests per minute per IP.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please slow down and try again shortly.',
  },
});

/**
 * Global rate limiter.
 * 100 requests per minute per IP.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});
