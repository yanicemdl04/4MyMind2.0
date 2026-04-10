import { Router } from 'express';
import { ContentController } from './content.controller';
import { authenticate } from '../../middlewares/auth';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();
const controller = new ContentController();

router.use(authenticate);

router.get('/', asyncHandler(controller.findAll));
router.get('/recommended', asyncHandler(controller.getRecommended));
router.get('/type/:type', asyncHandler(controller.findByType));
router.get('/:id', asyncHandler(controller.findById));

export default router;
