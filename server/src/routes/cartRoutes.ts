import { Router } from 'express';
import {
  getCartHandler,
  addItemToCartHandler,
  updateCartItemHandler,
  removeCartItemHandler,
  clearCartHandler,
  applyCouponHandler,
  calculateCheckoutHandler,
} from '../controllers/cartController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken);

router.route('/')
  .get(getCartHandler)
  .post(addItemToCartHandler)
  .delete(clearCartHandler);

router.route('/apply-coupon').post(applyCouponHandler);

router.route('/calculate-checkout').post(calculateCheckoutHandler);

router.route('/items/:menuItemId')
  .patch(updateCartItemHandler)
  .delete(removeCartItemHandler);

export default router;
