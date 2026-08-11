import { Router } from 'express';
import { verifyToken, requireVerifiedEmail } from '../middlewares/authMiddleware.js';
import {
  addAddressHandler,
  updateMeHandler,
  toggleFavoriteHandler,
  getFavoritesHandler,
  deleteAddressHandler,
} from '../controllers/userController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { z } from 'zod';

const router = Router();

router.use(verifyToken);
router.patch(
  '/me',
  validate({
    body: z.object({
      fullName: z.string().trim().min(2).max(100),
      phone: z.string().trim().regex(/^0\d{9,10}$/),
      avatarUrl: z.union([z.literal(''), z.string().url()]).optional(),
    }),
  }),
  updateMeHandler
);
router.route('/me/addresses').post(requireVerifiedEmail, addAddressHandler);
router.route('/me/addresses/:addressId').delete(requireVerifiedEmail, deleteAddressHandler);
router.route('/me/favorites').get(getFavoritesHandler);
router.route('/me/favorites/:restaurantId').post(toggleFavoriteHandler);

export default router;
