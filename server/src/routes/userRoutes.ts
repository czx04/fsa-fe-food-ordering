import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { addAddressHandler } from '../controllers/userController.js';
import { updateMeHandler } from '../controllers/userController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { z } from 'zod';

const router = Router();

router.use(verifyToken);
router.patch('/me', validate({ body: z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^0\d{9,10}$/),
  avatarUrl: z.union([z.literal(''), z.string().url()]).optional(),
}) }), updateMeHandler);
router.route('/me/addresses').post(addAddressHandler);

export default router;
