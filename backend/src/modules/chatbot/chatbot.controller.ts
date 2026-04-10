import { Request, Response } from 'express';
import { ChatbotService } from './chatbot.service';
import { AuthenticatedRequest } from '../../types';
import { ApiError } from '../../utils/api-error';

const chatbotService = new ChatbotService();

export class ChatbotController {
  async sendMessage(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const result = await chatbotService.sendMessage(userId, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async getHistory(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const conversationId = req.query.conversationId as string | undefined;
    const messages = await chatbotService.getHistory(userId, conversationId);
    res.json({ success: true, data: messages });
  }

  async clearHistory(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    await chatbotService.clearHistory(userId);
    res.json({ success: true, message: 'Chat history cleared' });
  }

  async analyze(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const result = await chatbotService.analyze(userId, req.body);
    res.json({ success: true, data: result });
  }

  async getRecommendations(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    if (!userId) throw ApiError.unauthorized();
    const recommendations = await chatbotService.getRecommendations(userId);
    res.json({ success: true, data: recommendations });
  }
}
