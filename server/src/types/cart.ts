import { Types } from 'mongoose';

export interface CartItem {
    menuItemId: Types.ObjectId;
    quantity: number;
    price: number; // Price of the menu item at the time of adding to cart
}

export interface Cart {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    items: CartItem[];
    subtotal: number;
    discountAmount: number;
    grandTotal: number;
    createdAt: Date;
    updatedAt: Date;
}

// API Payloads
export interface AddToCartRequest {
    menuItemId: string;
    quantity: number;
    restaurantId: string;
    replace?: boolean;
}

export interface UpdateCartItemRequest {
    quantity: number;
}

export interface ApplyCouponRequest {
    couponCode: string;
}

export interface CalculateCheckoutPayload {
    addressId?: string;
}
