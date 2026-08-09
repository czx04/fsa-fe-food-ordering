import { Types } from 'mongoose';
import { Cart, ICart } from '../models/Cart.js';

/**
 * Finds a cart by user ID, populating menu item details.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to the user's cart or null if not found.
 */
export const findCartByUserId = async (userId: string | Types.ObjectId): Promise<ICart | null> => {
  return Cart.findOne({ userId })
    .populate('items.menuItemId', 'name basePrice salePrice imageUrl')
    .populate('restaurantId', 'name slug address delivery phone logoUrl')
    .populate('couponId', 'code name discountType discountValue');
};

/**
 * Creates a new cart for a user.
 * @param userId - The ID of the user.
 * @param restaurantId - The ID of the restaurant.
 * @param items - The initial items in the cart.
 * @param total - The initial total of the cart.
 * @returns A promise that resolves to the newly created cart.
 */
export const createCart = async (
  userId: Types.ObjectId,
  restaurantId: Types.ObjectId,
  items: ICart['items'],
  pricing: { subtotal: number; discountAmount: number; grandTotal: number }
): Promise<ICart> => {
  const newCart = new Cart({
    userId,
    restaurantId,
    items,
    subtotal: pricing.subtotal,
    discountAmount: pricing.discountAmount,
    grandTotal: pricing.grandTotal,
  });
  return newCart.save();
};

/**
 * Updates an existing cart.
 * @param cartId - The ID of the cart to update.
 * @param updates - The updates to apply to the cart.
 * @returns A promise that resolves to the updated cart or null if not found.
 */
export const updateCart = async (
  cartId: Types.ObjectId,
  updates: Partial<ICart>
): Promise<ICart | null> => {
  return Cart.findByIdAndUpdate(cartId, updates, { new: true }).populate(
    'items.menuItemId',
    'name price'
  );
};

/**
 * Deletes a user's cart.
 * @param userId - The ID of the user whose cart should be deleted.
 * @returns A promise that resolves once the cart is deleted.
 */
export const deleteCartByUserId = async (userId: string | Types.ObjectId): Promise<void> => {
  await Cart.deleteOne({ userId });
};

/**
 * Finds a cart by user ID and restaurant ID.
 * @param userId - The ID of the user.
 *param restaurantId - The ID of the restaurant.
 * @returns A promise that resolves to the user's cart for a specific restaurant or null if not found.
 */
export const findCartByUserIdAndRestaurant = async (
  userId: string | Types.ObjectId,
  restaurantId: string | Types.ObjectId
): Promise<ICart | null> => {
  return Cart.findOne({ userId, restaurantId });
};
