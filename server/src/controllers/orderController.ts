import { NextFunction, Response } from 'express'
import createError from 'http-errors'
import { AuthRequest } from '../middlewares/authMiddleware.js'
import * as orderService from '../services/orderService.js'

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
