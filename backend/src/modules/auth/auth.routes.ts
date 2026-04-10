import { Router } from 'express';
import { AuthController } from './auth.controller';
import { PrivacyController } from './privacy.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { authRateLimiter } from '../../middlewares/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { registerSchema, loginSchema, updateProfileSchema } from './auth.types';

const router = Router();
const controller = new AuthController();
const privacyController = new PrivacyController();

router.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(controller.register));
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post('/logout', authenticate, asyncHandler(controller.logout));
router.post('/refresh-token', asyncHandler(controller.refreshToken));
router.get('/profile', authenticate, asyncHandler(controller.getProfile));
router.put('/profile', authenticate, validate(updateProfileSchema), asyncHandler(controller.updateProfile));

// GDPR / Privacy endpoints
router.get('/privacy/export', authenticate, asyncHandler(privacyController.exportData));
router.post('/privacy/delete', authenticate, asyncHandler(privacyController.deleteAccount));
router.post('/privacy/anonymize', authenticate, asyncHandler(privacyController.anonymizeAccount));

export default router;
