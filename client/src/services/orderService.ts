import { api } from '../utils/api';
import { Order, OrderDetail, CreateOrderPayload } from '../types/order';

const getOrderHistory = async (page = 1, limit = 10): Promise<{ data: Order[]; totalPages: number; total: number }> => {
  const response = await api.get('/orders', { params: { page, limit } });
  return response.data;
};

const getOrderDetail = async (orderId: string): Promise<OrderDetail> => {
  const response = await api.get<OrderDetail>(`/orders/${orderId}`);
  return response.data;
};

const createOrder = async (payload: CreateOrderPayload): Promise<OrderDetail> => {
  const response = await api.post<OrderDetail>('/orders', payload);
  return response.data;
};

export const orderService = {
  getOrderHistory,
  getOrderDetail,
  createOrder,
};
