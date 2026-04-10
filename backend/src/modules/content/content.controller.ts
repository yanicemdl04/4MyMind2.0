import { Request, Response } from 'express';
import { ContentService } from './content.service';
import { AuthenticatedRequest } from '../../types';
import { ApiError } from '../../utils/api-error';

const contentService = new ContentService();

export class ContentController {
  async findAll(req: Request, res: Response) {
    const result = await contentService.findAll(req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  }

  async findByType(req: Request, res: Response) {
    const result = await contentService.findByType(req.params.type as string, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  }

  async findById(req: Request, res: Response) {
    const content = await contentService.findById(req.params.id as string);
    res.json({ success: true, data: content });
  }

  async getRecommended(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const contents = await contentService.getRecommended(userId);
    res.json({ success: true, data: contents });
  }
}
