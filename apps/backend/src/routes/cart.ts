import { Router } from 'express';
import {
  addCartItem,
  clearCart,
  createNewCart,
  getCartById,
  removeCartItem,
  updateCartItem,
} from '../controllers/cartController';

const router = Router();

router.get('/:cartId', getCartById);
router.post('/', createNewCart);
router.post('/:cartId/items', addCartItem);
router.patch('/:cartId/items/:productId', updateCartItem);
router.delete('/:cartId/items/:productId', removeCartItem);
router.delete('/:cartId', clearCart);

export default router;
