import { api } from '../utils/api';
import { Cart, AddToCartPayload } from '../types/cart';

const getCart = async (): Promise<Cart> => {
  const response = await api.get<Cart>('/cart');
  return response.data;
};

const addToCart = async (payload: AddToCartPayload): Promise<Cart> => {
  const response = await api.post<Cart>('/cart/items', payload);
  return response.data;
};

const updateCartItemQuantity = async (cartItemId: string, quantity: number): Promise<Cart> => {
  const response = await api.put<Cart>(`/cart/items/${cartItemId}`, { quantity });
  return response.data;
};

const removeCartItem = async (cartItemId: string): Promise<Cart> => {
  const response = await api.delete<Cart>(`/cart/items/${cartItemId}`);
  return response.data;
};

export const cartService = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
};
