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

export const toggleFavoriteHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const userId = req.user!.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
      return;
    }

    const isFav = user.favoriteRestaurantIds?.some((id) => id.toString() === restaurantId);

    if (isFav) {
      user.favoriteRestaurantIds = user.favoriteRestaurantIds?.filter(
        (id) => id.toString() !== restaurantId
      );
    } else {
      if (!user.favoriteRestaurantIds) user.favoriteRestaurantIds = [];
      user.favoriteRestaurantIds.push(restaurantId as any);
    }

    await user.save();
    res.json({
      message: isFav ? 'Đã bỏ yêu thích.' : 'Đã thêm vào yêu thích.',
      favoriteRestaurantIds: user.favoriteRestaurantIds,
      isFavorite: !isFav,
    });
  } catch (error) {
    next(error);
  }
};

export const getFavoritesHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId).populate('favoriteRestaurantIds');
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
      return;
    }
    res.json({ data: user.favoriteRestaurantIds || [] });
  } catch (error) {
    next(error);
  }
};

export const deleteAddressHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { addressId } = req.params;
    const userId = req.user!.userId;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
      return;
    }
    user.addresses = user.addresses.filter((addr) => addr._id?.toString() !== addressId);
    await user.save();
    res.json({ message: 'Đã xóa địa chỉ.', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};
