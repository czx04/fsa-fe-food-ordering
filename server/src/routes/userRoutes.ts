import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { addAddressHandler } from '../controllers/userController.js';

const router = Router();

router.use(verifyToken);
router.route('/me/addresses').post(addAddressHandler);

export default router;
