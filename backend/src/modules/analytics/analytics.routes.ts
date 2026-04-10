import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate);

router.get('/user-patterns', asyncHandler(controller.getUserPatterns));
router.get('/wellbeing-score', asyncHandler(controller.getWellbeingScore));
router.get('/ai-prediction', asyncHandler(controller.getAIPrediction));
router.get('/ai-health', asyncHandler(controller.getAIServiceHealth));

export default router;
