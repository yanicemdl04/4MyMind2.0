import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../types';
import { ApiError } from '../../utils/api-error';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  }

  async logout(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    await authService.logout(userId);
    res.json({ success: true, message: 'Logged out successfully' });
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token is required');
    }
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  }

  async getProfile(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const profile = await authService.getProfile(userId);
    res.json({ success: true, data: profile });
  }

  async updateProfile(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const profile = await authService.updateProfile(userId, req.body);
    res.json({ success: true, data: profile });
  }
}
