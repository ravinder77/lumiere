import { Router } from 'express';
import {
  getFeaturedProducts,
  getProductById,
  listCategories,
  listProducts,
} from '../controllers/productController';

const router = Router();

router.get('/', listProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', listCategories);
router.get('/:id', getProductById);

export default router;
