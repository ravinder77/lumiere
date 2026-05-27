import { Router } from 'express';
import {
  getAdminStats,
  listOrders,
  listUsers,
  updateOrderStatus,
  updateUserRole,
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/stats', getAdminStats);
router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/orders', listOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
