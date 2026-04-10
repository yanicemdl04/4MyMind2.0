import { Request, Response } from 'express';
import { PrivacyService } from './privacy.service';
import { AuthenticatedRequest } from '../../types';
import { ApiError } from '../../utils/api-error';

const privacyService = new PrivacyService();

export class PrivacyController {
  async exportData(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const data = await privacyService.exportUserData(userId);
    res.json({ success: true, data });
  }

  async deleteAccount(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();

    const { confirmation } = req.body;
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      throw ApiError.badRequest('Please send { "confirmation": "DELETE_MY_ACCOUNT" } to confirm');
    }

    const counts = await privacyService.deleteAllUserData(userId);
    res.json({ success: true, data: { message: 'Account and all data permanently deleted', counts } });
  }

  async anonymizeAccount(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const result = await privacyService.anonymizeUser(userId);
    res.json({ success: true, data: result });
  }
}
