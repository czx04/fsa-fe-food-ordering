import { api } from '../utils/api';
import {
  OrderDetail,
  CreateOrderPayload,
  OrderHistoryResponse,
  CreateOrderResponse,
} from '../types/order';

const getOrderHistory = async (page = 1, limit = 10): Promise<OrderHistoryResponse> => {
  const response = await api.get<OrderHistoryResponse>('/orders', { params: { page, limit } });
  return response.data;
};

const getOrderDetail = async (orderId: string): Promise<OrderDetail> => {
  const response = await api.get<OrderDetail>(`/orders/${orderId}`);
  return response.data;
};

const createOrder = async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
  const response = await api.post<CreateOrderResponse>('/orders/checkout', payload);
  return response.data;
};

export const orderService = {
  getOrderHistory,
  getOrderDetail,
  createOrder,
};
