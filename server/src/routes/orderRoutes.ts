import { Router } from 'express'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { createOrderFromCartHandler, getOrderDetailHandler, getOrderHistoryHandler, reorderOrderHandler, cancelOrderHandler } from '../controllers/orderController.js'

const router = Router()

router.use(verifyToken)

router.route('/')
    .get(getOrderHistoryHandler)

router.route('/checkout')
    .post(createOrderFromCartHandler)

router.route('/:orderId/reorder')
    .post(reorderOrderHandler)

router.route('/:id/cancel')
    .post(cancelOrderHandler)

router.route('/:id')
    .get(getOrderDetailHandler)

export default router
