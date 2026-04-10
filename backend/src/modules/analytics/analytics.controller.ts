import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { aiIntegrationService } from './ai-integration.service';
import { AuthenticatedRequest } from '../../types';
import { ApiError } from '../../utils/api-error';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getUserPatterns(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const patterns = await analyticsService.getUserPatterns(userId);
    res.json({ success: true, data: patterns });
  }

  async getWellbeingScore(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const score = await analyticsService.getWellbeingScore(userId);
    res.json({ success: true, data: score });
  }

  async getAIPrediction(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const prediction = await analyticsService.getAIPrediction(userId);
    res.json({ success: true, data: prediction });
  }

  async getAIServiceHealth(_req: Request, res: Response) {
    const healthy = await aiIntegrationService.checkHealth();
    res.json({
      success: true,
      data: { available: healthy, configured: aiIntegrationService.isAvailable },
    });
  }
}
