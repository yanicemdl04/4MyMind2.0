import { Router } from 'express';
import { ExerciseController } from './exercise.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createExerciseSchema, updateExerciseSchema, logExerciseSchema } from './exercise.types';

const router = Router();
const controller = new ExerciseController();

router.use(authenticate);

router.post('/', validate(createExerciseSchema), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.findAll));
router.get('/stats', asyncHandler(controller.getStats));
router.get('/recommendations', asyncHandler(controller.getRecommendations));
router.get('/:id', asyncHandler(controller.findById));
router.put('/:id', validate(updateExerciseSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));
router.post('/log', validate(logExerciseSchema), asyncHandler(controller.logCompletion));

export default router;
