import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { env } from '../config/env';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, method: req.method, url: req.url }, err.message);
    }
    const body: Record<string, unknown> = { success: false, error: err.message };
    if (err.details) body.details = err.details;
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  logger.error({ err, method: req.method, url: req.url }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
