import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { swaggerDocument } from './config/swagger';
import { errorHandler } from './middlewares/error-handler';
import { globalRateLimiter } from './middlewares/rate-limit';
import { sanitizeInput } from './middlewares/sanitize';

import authRoutes from './modules/auth/auth.routes';
import journalRoutes from './modules/journal/journal.routes';
import moodRoutes from './modules/mood/mood.routes';
import exerciseRoutes from './modules/exercise/exercise.routes';
import chatbotRoutes from './modules/chatbot/chatbot.routes';
import contentRoutes from './modules/content/content.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

const app = express();

// ─── Global Middleware ──────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use(globalRateLimiter);

// ─── Swagger UI ─────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ForMyMind API Documentation',
}));

// ─── Health Check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'ForMyMind API',
      status: 'healthy',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── Error Handler (must be last) ──────────────────────
app.use(errorHandler);

// ─── Server Start ───────────────────────────────────────
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'ForMyMind API started');
});

// ─── Graceful Shutdown ──────────────────────────────────
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received, closing gracefully...');

  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Database disconnected, server stopped');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
