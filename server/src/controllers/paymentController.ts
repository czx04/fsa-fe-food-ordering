import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as paymentService from '../services/paymentService.js';

export const verifyVnpayReturnHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // VNPAY trả về rất nhiều query params. Chúng ta sẽ chuyển toàn bộ object query.
    const vnpayResponse = req.query;
    const order = await paymentService.verifyVnpayReturn(vnpayResponse);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};
