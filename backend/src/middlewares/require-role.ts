import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { ApiError } from '../utils/api-error';

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.userRole) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!roles.includes(req.userRole as Role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
}
