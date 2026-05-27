import { Router } from 'express';
import {
  getOrderById,
  listMyOrders,
  rejectDirectOrderCreation,
} from '../controllers/orderController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/', rejectDirectOrderCreation);
router.get('/:id', optionalAuth, getOrderById);
router.get('/', authenticate, listMyOrders);

export default router;
