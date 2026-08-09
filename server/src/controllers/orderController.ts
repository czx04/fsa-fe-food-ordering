import { NextFunction, Response } from 'express'
import createError from 'http-errors'
import { AuthRequest } from '../middlewares/authMiddleware.js'
import * as orderService from '../services/orderService.js'
import { CreateOrderPayload } from '../types/order.js'

const parsePositiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value !== 'string') {
    return fallback
  }

  const parsedValue = Number.parseInt(value, 10)

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

export const getOrderHistoryHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1)
    const limit = parsePositiveInteger(req.query.limit, 10)
    const history = await orderService.getOrderHistory(req.user!.userId, page, limit)

    res.status(200).json(history)
  } catch (error) {
    next(error)
  }
}

export const createOrderFromCartHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload: CreateOrderPayload = req.body

    if (!payload.deliveryAddress || !payload.paymentMethod) {
      throw createError(400, 'Thông tin thanh toán hoặc địa chỉ giao hàng bị thiếu.')
    }

    const { order, paymentUrl } = await orderService.createOrderFromCart(req.user!.userId, payload)

    res.status(201).json({
      message: 'Đơn hàng đã được tạo thành công.',
      order,
      paymentUrl,
    })
  } catch (error) {
    next(error)
  }
}

export const getOrderDetailHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params

    if (typeof id !== 'string' || id.length === 0) {
      throw createError(400, 'ID đơn hàng không hợp lệ')
    }

    const order = await orderService.getOrderDetail(req.user!.userId, id)

    res.status(200).json(order)
  } catch (error) {
    next(error)
  }
}
