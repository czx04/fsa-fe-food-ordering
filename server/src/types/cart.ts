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
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Payloads
export interface AddToCartRequest {
  menuItemId: string;
  quantity: number;
  restaurantId: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
