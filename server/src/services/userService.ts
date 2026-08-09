import createError from 'http-errors';
import { User, IUser } from '../models/User.js';
import { AddAddressPayload } from '../types/user.js';

export const addAddress = async (
  userId: string,
  payload: AddAddressPayload,
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw createError(404, 'Không tìm thấy người dùng.');
  }

  // Nếu địa chỉ mới được đặt làm mặc định, hãy bỏ mặc định của các địa chỉ cũ.
  if (payload.isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  // Nếu đây là địa chỉ đầu tiên, tự động đặt làm mặc định.
  if (user.addresses.length === 0) {
    payload.isDefault = true;
  }

  user.addresses.push(payload);
  await user.save();
  return user;
};
