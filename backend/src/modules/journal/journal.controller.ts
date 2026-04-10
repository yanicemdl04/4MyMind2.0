import { Request, Response } from 'express';
import { JournalService } from './journal.service';
import { AuthenticatedRequest } from '../../types';
import { ApiError } from '../../utils/api-error';

const journalService = new JournalService();

export class JournalController {
  async create(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const entry = await journalService.create(userId, req.body);
    res.status(201).json({ success: true, data: entry });
  }

  async findAll(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const result = await journalService.findAll(userId, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  }

  async findById(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const entry = await journalService.findById(userId, req.params.id as string);
    res.json({ success: true, data: entry });
  }

  async update(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const entry = await journalService.update(userId, req.params.id as string, req.body);
    res.json({ success: true, data: entry });
  }

  async delete(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    await journalService.delete(userId, req.params.id as string);
    res.json({ success: true, message: 'Journal entry deleted' });
  }
}
