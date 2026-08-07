import { Types } from 'mongoose';
import * as cartRepository from '../repositories/cartRepository';
import { AddToCartRequest, UpdateCartItemRequest } from '../types/cart';
import { ICart } from '../models/Cart';
import { MenuItem } from '../models/MenuItem';
import createError from 'http-errors';

/**
 * Recalculates the total price of the cart.
 * @param cart - The cart object.
 * @returns The updated cart with the new total.
 */
const recalculateCartTotal = (cart: ICart): ICart => {
  cart.total = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
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
  const { menuItemId, quantity, restaurantId } = cartData;

  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) {
    throw createError(404, 'Menu item not found');
  }

  if (menuItem.restaurantId.toString() !== restaurantId) {
    throw createError(400, 'Menu item does not belong to this restaurant');
  }

  let cart = await cartRepository.findCartByUserId(userId);

  if (cart && cart.restaurantId.toString() !== restaurantId) {
    // User has a cart with items from another restaurant
    // Option: clear the old cart and start a new one.
    await cartRepository.deleteCartByUserId(userId);
    cart = null; // Set cart to null to create a new one
  }

  if (!cart) {
    // Create a new cart
    const newCartItems = [{
      menuItemId: new Types.ObjectId(menuItemId),
      quantity,
      price: menuItem.salePrice ?? menuItem.basePrice,
    }];
    const newCart = await cartRepository.createCart(
      new Types.ObjectId(userId),
      new Types.ObjectId(restaurantId),
      newCartItems,
      menuItem.price * quantity
    );
    return newCart;
  }

  // Update existing cart
  const itemIndex = cart.items.findIndex(
    (item) => item.menuItemId.toString() === menuItemId
  );

  if (itemIndex > -1) {
    // Item exists, update quantity
    cart.items[itemIndex].quantity += quantity;
  } else {
    // Item does not exist, add it
    cart.items.push({
      menuItemId: new Types.ObjectId(menuItemId),
      quantity,
      price: menuItem.price,
    });
  }

  const updatedCart = recalculateCartTotal(cart);
  return updatedCart.save();
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
    (item) => item.menuItemId.toString() === menuItemId
  );

  if (itemIndex === -1) {
    throw createError(404, 'Item not found in cart');
  }

  cart.items[itemIndex].quantity = quantity;

  const updatedCart = recalculateCartTotal(cart);
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
    (item) => item.menuItemId.toString() !== menuItemId
  );

  if (cart.items.length === 0) {
    // If cart is empty, delete it
    await cartRepository.deleteCartByUserId(userId);
    // Return a representation of an empty cart without saving it
    return { ...cart.toObject(), items: [], total: 0 };
  }


  const updatedCart = recalculateCartTotal(cart);
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
