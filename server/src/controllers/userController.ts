import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as userService from '../services/userService.js';
import { AddAddressPayload } from '../types/user.js';
import { User } from '../models/User.js';

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

export const updateMeHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      {
        $set: {
          fullName: req.body.fullName.trim(),
          phone: req.body.phone.trim(),
          avatarUrl: req.body.avatarUrl || null,
        },
      },
      { new: true, runValidators: true },
    ).select('-passwordHash -refreshTokens')
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy tài khoản.' })
      return
    }
    res.json({ message: 'Cập nhật hồ sơ thành công.', user })
  } catch (error) {
    next(error)
  }
}
