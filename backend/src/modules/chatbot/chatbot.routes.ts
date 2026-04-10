import { Router } from 'express';
import { ChatbotController } from './chatbot.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { chatbotRateLimiter } from '../../middlewares/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sendMessageSchema, analyzeSchema } from './chatbot.types';

const router = Router();
const controller = new ChatbotController();

router.use(authenticate);

router.post('/message', chatbotRateLimiter, validate(sendMessageSchema), asyncHandler(controller.sendMessage));
router.get('/history', asyncHandler(controller.getHistory));
router.delete('/history', asyncHandler(controller.clearHistory));
router.get('/recommendations', asyncHandler(controller.getRecommendations));
router.post('/analyze', chatbotRateLimiter, validate(analyzeSchema), asyncHandler(controller.analyze));

export default router;
