import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import productsRouter from '../routes/products';
import cartRouter from '../routes/cart';
import checkoutRouter, { stripeWebhookHandler, stripeWebhookMiddleware } from '../routes/checkout';
import ordersRouter from '../routes/orders';
import authRouter from '../routes/auth';
import wishlistRouter from '../routes/wishlist';
import reviewsRouter from '../routes/reviews';
import adminRouter from '../routes/admin';
import { requestLogger } from '../middleware/requestLogger';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
  app.use(requestLogger);
  app.post('/api/checkout/webhook', stripeWebhookMiddleware, stripeWebhookHandler);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please slow down.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many auth attempts. Try again later.' },
  });

  app.use('/api', globalLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/checkout', checkoutRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/wishlist', wishlistRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/admin', adminRouter);

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.1',
    });
  });

  app.get('/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ready' });
    } catch (err) {
      logger.error({ err }, 'Readiness check failed');
      res.status(500).json({ status: 'not_ready' });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(
      {
        err,
        method: req.method,
        path: req.originalUrl,
      },
      'Unhandled request error'
    );
    const errorMessage = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';
    res.status(500).json({ success: false, error: errorMessage });
  });

  return app;
}
