import { Router } from 'express';
import {
  getCartHandler,
  addItemToCartHandler,
  updateCartItemHandler,
  removeCartItemHandler,
  clearCartHandler,
} from '../controllers/cartController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// All routes in this file are protected
router.use(verifyToken);

router.route('/')
  .get(getCartHandler)
  .post(addItemToCartHandler)
  .delete(clearCartHandler);

router.route('/items/:menuItemId')
  .patch(updateCartItemHandler)
  .delete(removeCartItemHandler);

export default router;
