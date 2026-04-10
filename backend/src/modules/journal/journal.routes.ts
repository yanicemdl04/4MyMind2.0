import { Router } from 'express';
import { JournalController } from './journal.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createJournalSchema, updateJournalSchema } from './journal.types';

const router = Router();
const controller = new JournalController();

router.use(authenticate);

router.post('/', validate(createJournalSchema), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.findAll));
router.get('/:id', asyncHandler(controller.findById));
router.put('/:id', validate(updateJournalSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));

export default router;
