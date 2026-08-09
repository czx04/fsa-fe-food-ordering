import { api } from '../utils/api';
import {
  OrderDetail,
  CreateOrderPayload,
  OrderHistoryResponse,
  CreateOrderResponse,
  ReorderResponse,
  CancelOrderPayload,
  CancelOrderResponse,
} from '../types/order';

const getOrderHistory = async (status?: string, page = 1, limit = 10): Promise<OrderHistoryResponse> => {
  const params: { page: string; limit: string; status?: string } = { page: String(page), limit: String(limit) };
  if (status) {
    params.status = status;
  }
  const response = await api.get<OrderHistoryResponse>('/orders', { params });
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

const reorder = async (orderId: string): Promise<ReorderResponse> => {
  const response = await api.post<ReorderResponse>(`/orders/${orderId}/reorder`);
  return response.data;
};

const cancelOrder = async (orderId: string, payload: CancelOrderPayload): Promise<CancelOrderResponse> => {
  const response = await api.post<CancelOrderResponse>(`/orders/${orderId}/cancel`, payload);
  return response.data;
};

export const orderService = {
  getOrderHistory,
  getOrderDetail,
  createOrder,
  reorder,
  cancelOrder,
};
