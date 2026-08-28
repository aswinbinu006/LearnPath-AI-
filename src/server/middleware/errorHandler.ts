import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled server error', err, {
    method: req.method,
    url: req.url,
  });

  const statusCode = err.statusCode || 500;

  // Never leak internal error details to client in production
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction
    ? 'An internal server error occurred.'
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { error: err.stack }),
  });
};
