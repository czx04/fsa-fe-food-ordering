import { Router } from 'express';
import { verifyVnpayReturnHandler, vnpayIpnHandler } from '../controllers/paymentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/vnpay/verify-return', verifyToken, verifyVnpayReturnHandler);
router.get('/vnpay/ipn', vnpayIpnHandler);
router.post('/vnpay/ipn', vnpayIpnHandler);

export default router;
