import { Router } from 'express';
import {
  createCheckoutSession,
  getCheckoutSession,
  stripeWebhookHandler,
  stripeWebhookMiddleware,
} from '../controllers/checkoutController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/session', optionalAuth, createCheckoutSession);
router.get('/session/:sessionId', optionalAuth, getCheckoutSession);

export { stripeWebhookHandler, stripeWebhookMiddleware };
export default router;
