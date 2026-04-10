import { Request, Response } from 'express';
import { MoodService } from './mood.service';
import { AuthenticatedRequest } from '../../types';
import { ApiError } from '../../utils/api-error';

const moodService = new MoodService();

export class MoodController {
  async create(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const mood = await moodService.create(userId, req.body);
    res.status(201).json({ success: true, data: mood });
  }

  async findAll(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const result = await moodService.findAll(userId, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  }

  async findById(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const mood = await moodService.findById(userId, req.params.id as string);
    res.json({ success: true, data: mood });
  }

  async update(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const mood = await moodService.update(userId, req.params.id as string, req.body);
    res.json({ success: true, data: mood });
  }

  async delete(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    await moodService.delete(userId, req.params.id as string);
    res.json({ success: true, message: 'Mood entry deleted' });
  }

  async getStats(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const range = (req.query.range as string) || '7days';
    const stats = await moodService.getStats(userId, range);
    res.json({ success: true, data: stats });
  }
}
