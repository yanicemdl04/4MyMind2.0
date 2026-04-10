import { Request, Response } from 'express';
import { ExerciseService } from './exercise.service';
import { AuthenticatedRequest } from '../../types';
import { ApiError } from '../../utils/api-error';

const exerciseService = new ExerciseService();

export class ExerciseController {
  async create(req: Request, res: Response) {
    const exercise = await exerciseService.create(req.body);
    res.status(201).json({ success: true, data: exercise });
  }

  async findAll(req: Request, res: Response) {
    const result = await exerciseService.findAll(req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  }

  async findById(req: Request, res: Response) {
    const exercise = await exerciseService.findById(req.params.id as string);
    res.json({ success: true, data: exercise });
  }

  async update(req: Request, res: Response) {
    const exercise = await exerciseService.update(req.params.id as string, req.body);
    res.json({ success: true, data: exercise });
  }

  async delete(req: Request, res: Response) {
    await exerciseService.delete(req.params.id as string);
    res.json({ success: true, message: 'Exercise deleted' });
  }

  async logCompletion(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const result = await exerciseService.logCompletion(userId, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async getStats(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const stats = await exerciseService.getStats(userId);
    res.json({ success: true, data: stats });
  }

  async getRecommendations(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const recommendations = await exerciseService.getRecommendations(userId);
    res.json({ success: true, data: recommendations });
  }
}
