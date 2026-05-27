import { Router } from 'express';
import {
  changePassword,
  listMyOrders,
  login,
  me,
  refresh,
  register,
  updateProfile,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);
router.patch('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.get('/orders', authenticate, listMyOrders);

export default router;
