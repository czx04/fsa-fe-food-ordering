import { Types } from 'mongoose';
import * as cartRepository from '../repositories/cartRepository.js';
import { AddToCartRequest, CalculateCheckoutPayload, UpdateCartItemRequest } from '../types/cart.js';
import { ICart, ICartItem } from '../models/Cart.js';
import { MenuItem } from '../models/MenuItem.js';
import { Coupon } from '../models/Coupon.js';
import createError from 'http-errors';

const getIdString = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (field._id) return field._id.toString();
  return field.toString();
};

/**
 * Calculates the discount for a given cart and coupon.
 * @param cart The cart object.
 * @returns The discount amount.
 */
const calculateDiscount = async (cart: ICart): Promise<number> => {
  if (cart.couponId) {
    const couponIdStr = getIdString(cart.couponId);
    const coupon = (cart.couponId as any)?.code ? (cart.couponId as any) : await Coupon.findById(couponIdStr);

    if (coupon?.status === 'active' && new Date() >= new Date(coupon.startsAt) && new Date() <= new Date(coupon.endsAt)) {
      if (cart.subtotal >= coupon.minOrderAmount) {
        let discount = 0;
        if (coupon.discountType === 'fixed') {
          discount = coupon.discountValue;
        } else { // percentage
          discount = (cart.subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
            discount = coupon.maxDiscountAmount;
          }
        }
        return discount;
      }
    }
  }
  return 0;
};

/**
 * Recalculates subtotal, discount, and grand total for the cart.
 * If a coupon is applied, it re-validates and applies it.
 * @param cart - The cart object.
 * @returns The updated cart with the new total.
 */
const recalculateCart = async (cart: ICart): Promise<ICart> => {
  cart.subtotal = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const discountAmount = await calculateDiscount(cart);

  if (discountAmount === 0 && cart.couponId) {
    cart.couponId = null; // Coupon is no longer valid or applicable
  }

  cart.discountAmount = discountAmount;
  cart.grandTotal = cart.subtotal - cart.discountAmount;
  if (cart.grandTotal < 0) cart.grandTotal = 0;

  return cart;
};

/**
 * Gets the user's cart.
 * @param userId - The ID of the user.
 * @returns The user's cart.
 */
export const getCart = async (userId: string): Promise<ICart | null> => {
  return cartRepository.findCartByUserId(userId);
};

const createNewCartWithItem = async (userId: string, restaurantId: string, menuItem: any, quantity: number): Promise<ICart> => {
  const itemPrice = menuItem.salePrice ?? menuItem.basePrice ?? 0;
  const newCartItems = [{
    menuItemId: new Types.ObjectId(menuItem._id),
    quantity,
    price: itemPrice,
  } as ICartItem];
  const subtotal = itemPrice * quantity;
  return cartRepository.createCart(
    new Types.ObjectId(userId),
    new Types.ObjectId(restaurantId),
    newCartItems,
    { subtotal, discountAmount: 0, grandTotal: subtotal }
  );
};

const updateExistingCartWithItem = async (cart: ICart, menuItem: any, quantity: number): Promise<ICart> => {
  const menuItemIdStr = getIdString(menuItem._id);
  const itemIndex = cart.items.findIndex((item) => {
    return getIdString(item.menuItemId) === menuItemIdStr;
  });

  if (itemIndex > -1) {
    cart.items[itemIndex]!.quantity += quantity;
  } else {
    const itemPrice = menuItem.salePrice ?? menuItem.basePrice ?? 0;
    cart.items.push({
      menuItemId: new Types.ObjectId(menuItem._id),
      quantity,
      price: itemPrice,
    } as ICartItem);
  }

  const updatedCart = await recalculateCart(cart);
  return updatedCart.save();
};

/**
 * Adds an item to the user's cart.
 * @param userId - The ID of the user.
 * @param cartData - The data for the item to add.
 * @returns The updated cart.
 */
export const addItemToCart = async (
  userId: string,
  cartData: AddToCartRequest
): Promise<ICart> => {
  const { menuItemId, quantity, restaurantId, replace } = cartData;

  if (!Types.ObjectId.isValid(menuItemId) || !Types.ObjectId.isValid(restaurantId)) {
    throw createError(400, 'Invalid menuItemId or restaurantId');
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createError(400, 'Quantity must be a positive integer');
  }
  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) {
    throw createError(404, 'Menu item not found');
  }

  if (getIdString(menuItem.restaurantId) !== restaurantId) {
    throw createError(400, 'Menu item does not belong to this restaurant');
  }

  let cart = await cartRepository.findCartByUserId(userId);

  if (cart && getIdString(cart.restaurantId) !== restaurantId) {
    if (replace) {
      // User confirmed replacement, clear the old cart.
      await cartRepository.deleteCartByUserId(userId);
      cart = null; // Set cart to null to create a new one.
    } else {
      // Conflict: cart has items from another restaurant.
      const restaurant = cart.restaurantId as any;
      const existingRestaurantName = (restaurant && 'name' in restaurant) ? restaurant.name : 'quán ăn khác';
      throw createError(409, `Giỏ hàng của bạn đang có món từ nhà hàng "${existingRestaurantName}". Bạn có muốn xóa giỏ hàng cũ và thêm món ăn này không?`);
    }
  }

  if (!cart) {
    return createNewCartWithItem(userId, restaurantId, menuItem, quantity);
  }

  return updateExistingCartWithItem(cart, menuItem, quantity);
};

/**
 * Calculates checkout totals including delivery fee.
 * @param userId - The ID of the user.
 * @param payload - The checkout calculation payload (can be used for address-specific fees).
 * @returns An object with pricing details.
 */
export const calculateCheckout = async (
  userId: string,
  payload: CalculateCheckoutPayload,
): Promise<{ deliveryFee: number; finalTotal: number }> => {
  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    throw createError(400, 'Giỏ hàng của bạn đang trống.');
  }

  const restaurant = cart.restaurantId as any;
  if (!restaurant || restaurant.delivery?.fee == null) {
    throw createError(404, 'Không tìm thấy thông tin nhà hàng hoặc phí vận chuyển.');
  }

  const deliveryFee = restaurant.delivery.fee;
  const finalTotal = cart.grandTotal + deliveryFee;

  return { deliveryFee, finalTotal };
};

/**
 * Updates an item's quantity in the cart.
 * @param userId - The ID of the user.
 * @param menuItemId - The ID of the menu item to update.
 * @param updateData - The update data (quantity).
 * @returns The updated cart.
 */
export const updateCartItem = async (
  userId: string,
  menuItemId: string,
  updateData: UpdateCartItemRequest
): Promise<ICart> => {
  const { quantity } = updateData;
  if (quantity <= 0) {
    // If quantity is 0 or less, remove the item
    return removeCartItem(userId, menuItemId);
  }

  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart) {
    throw createError(404, 'Cart not found');
  }

  const itemIndex = cart.items.findIndex(
    (item) => getIdString(item.menuItemId) === menuItemId
  );

  if (itemIndex === -1) {
    throw createError(404, 'Item not found in cart');
  }

  const currentItem = cart.items[itemIndex];
  if (currentItem) {
    currentItem.quantity = quantity;
  }

  const updatedCart = await recalculateCart(cart);
  return updatedCart.save();
};

/**
 * Removes an item from the cart.
 * @param userId - The ID of the user.
 * @param menuItemId - The ID of the menu item to remove.
 * @returns The updated cart.
 */
export const removeCartItem = async (
  userId: string,
  menuItemId: string
): Promise<ICart> => {
  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart) {
    throw createError(404, 'Cart not found');
  }

  cart.items = cart.items.filter(
    (item) => getIdString(item.menuItemId) !== menuItemId
  );

  if (cart.items.length === 0) {
    // If cart is empty, delete it
    await cartRepository.deleteCartByUserId(userId);
    cart.subtotal = 0;
    cart.discountAmount = 0;
    cart.grandTotal = 0;
    cart.couponId = null;
    return cart;
  }

  const updatedCart = await recalculateCart(cart);
  return updatedCart.save();
};

/**
 * Clears all items from the user's cart.
 * @param userId - The ID of the user.
 */
export const clearCart = async (userId: string): Promise<void> => {
  const cart = await cartRepository.findCartByUserId(userId);
  if (cart) {
    await cartRepository.deleteCartByUserId(userId);
  }
  // If no cart, we consider it "cleared", so no error.
};

/**
 * Applies a coupon to the user's cart.
 * @param userId - The ID of the user.
 * @param couponCode - The coupon code to apply.
 * @returns The updated cart.
 */
export const applyCouponToCart = async (userId: string, couponCode: string): Promise<ICart> => {
  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    throw createError(404, 'Giỏ hàng của bạn đang trống.');
  }

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
  if (!coupon) {
    throw createError(404, 'Mã giảm giá không tồn tại.');
  }

  if (coupon.status !== 'active' || new Date() < coupon.startsAt || new Date() > coupon.endsAt) {
    throw createError(400, 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
  }

  // Recalculate subtotal before checking minOrderAmount
  cart.subtotal = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cart.subtotal < coupon.minOrderAmount) {
    throw createError(400, `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để áp dụng mã này.`);
  }

  cart.couponId = coupon._id;

  // Recalculate everything with the new coupon
  const updatedCart = await recalculateCart(cart);
  return updatedCart.save();
};
