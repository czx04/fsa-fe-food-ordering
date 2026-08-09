import { Response, NextFunction } from 'express';
import * as cartService from '../services/cartService.js';
import {
    AddToCartRequest,
    ApplyCouponRequest,
    UpdateCartItemRequest,
    CalculateCheckoutPayload,
} from '../types/cart.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCartHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const cart = await cartService.getCart(req.user!.userId);
        if (!cart) {
            return res.status(200).json({
                message: 'Cart is empty',
                cart: {
                    items: [],
                    subtotal: 0,
                    discountAmount: 0,
                    grandTotal: 0,
                    couponId: null,
                },
            });
        }
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Apply coupon to cart
 * @route   POST /api/cart/apply-coupon
 * @access  Private
 */
export const applyCouponHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { couponCode }: ApplyCouponRequest = req.body;
        if (!couponCode) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã giảm giá.' });
        }
        const cart = await cartService.applyCouponToCart(req.user!.userId, couponCode);
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Calculate checkout totals
 * @route   POST /api/cart/calculate-checkout
 * @access  Private
 */
export const calculateCheckoutHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        // The payload could be used in the future to calculate shipping based on a specific address
        const payload: CalculateCheckoutPayload = req.body;
        const pricing = await cartService.calculateCheckout(req.user!.userId, payload);
        res.status(200).json(pricing);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
export const addItemToCartHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const cartData: AddToCartRequest = req.body;
        const cart = await cartService.addItemToCart(req.user!.userId, cartData);
        res.status(201).json(cart);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update cart item quantity
 * @route   PATCH /api/cart/items/:menuItemId
 * @access  Private
 */
export const updateCartItemHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const { menuItemId } = req.params;

        if (typeof menuItemId !== 'string') {
            return res.status(400).json({ message: 'Invalid menuItemId' });
        }

        const updateData: UpdateCartItemRequest = req.body;
        const cart = await cartService.updateCartItem(userId, menuItemId, updateData);
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:menuItemId
 * @access  Private
 */
export const removeCartItemHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { menuItemId } = req.params;
        if (typeof menuItemId !== 'string') {
            return res.status(400).json({ message: 'Invalid menuItemId' });
        }
        const cart = await cartService.removeCartItem(req.user!.userId, menuItemId);
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart
 * @access  Private
 */
export const clearCartHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        await cartService.clearCart(req.user!.userId);
        res.status(204).send(); // No content
    } catch (error) {
        next(error);
    }
};
