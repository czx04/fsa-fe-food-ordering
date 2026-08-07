import createError from 'http-errors'
import { Types } from 'mongoose'
import * as orderRepository from '../repositories/orderRepository.js'
import { OrderDetail, OrderHistoryResponse } from '../types/order.js'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

export const getOrderHistory = async (
    customerId: string,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
): Promise<OrderHistoryResponse> => {
    const safePage = Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT

    const { data, totalItems } = await orderRepository.findOrdersByCustomerId(customerId, safePage, safeLimit)
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / safeLimit)

    return {
        data,
        pagination: {
            currentPage: safePage,
            totalPages,
            totalItems,
            limit: safeLimit,
        },
        totalPages,
        total: totalItems,
        limit: safeLimit,
    }
}

export const getOrderDetail = async (
    customerId: string,
    orderId: string,
): Promise<OrderDetail> => {
    if (!Types.ObjectId.isValid(orderId)) {
        throw createError(400, 'ID đơn hàng không hợp lệ')
    }

    const order = await orderRepository.findOrderById(orderId)

    if (!order) {
        throw createError(404, 'Không tìm thấy đơn hàng')
    }

    if (order.customerId !== customerId) {
        throw createError(403, 'Bạn không có quyền xem đơn hàng này')
    }

    return order
}
