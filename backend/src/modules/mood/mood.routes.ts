import { Router } from 'express';
import { MoodController } from './mood.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createMoodSchema, updateMoodSchema } from './mood.types';

const router = Router();
const controller = new MoodController();

router.use(authenticate);

router.post('/', validate(createMoodSchema), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.findAll));
router.get('/stats', asyncHandler(controller.getStats));
router.get('/:id', asyncHandler(controller.findById));
router.put('/:id', validate(updateMoodSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));

export default router;
