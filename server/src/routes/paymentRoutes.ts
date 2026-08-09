import { Router } from 'express';
import { verifyVnpayReturnHandler } from '../controllers/paymentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/vnpay/verify-return', verifyToken, verifyVnpayReturnHandler);

export default router;
