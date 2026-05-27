import { Router } from 'express';
import {
  createProductReview,
  deleteProductReview,
  listProductReviews,
  updateProductReview,
} from '../controllers/reviewController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/:productId', optionalAuth, listProductReviews);
router.post('/:productId', authenticate, createProductReview);
router.patch('/:productId', authenticate, updateProductReview);
router.delete('/:productId', authenticate, deleteProductReview);

export default router;
