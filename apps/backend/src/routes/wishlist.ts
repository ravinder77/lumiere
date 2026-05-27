import { Router } from 'express';
import {
  addWishlistItem,
  listWishlist,
  listWishlistIds,
  removeWishlistItem,
} from '../controllers/wishlistController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', listWishlist);
router.post('/', addWishlistItem);
router.delete('/:productId', removeWishlistItem);
router.get('/ids', listWishlistIds);

export default router;
