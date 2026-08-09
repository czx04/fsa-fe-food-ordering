import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as userService from '../services/userService.js';
import { AddAddressPayload } from '../types/user.js';

export const addAddressHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload: AddAddressPayload = req.body;
    const updatedUser = await userService.addAddress(req.user!.userId, payload);
    res.status(200).json({ message: 'Thêm địa chỉ thành công.', user: updatedUser });
  } catch (error) {
    next(error);
  }
};
