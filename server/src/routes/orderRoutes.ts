import { Router } from 'express'
import { z } from 'zod'
import { verifyToken } from '../middlewares/authMiddleware.js'
import {
    cancelOrderHandler,
    createOrderFromCartHandler,
    createOrderReviewHandler,
    deleteOrderReviewHandler,
    getOrderDetailHandler,
    getOrderHistoryHandler,
    getOrderReviewHandler,
    reorderOrderHandler,
    updateOrderReviewHandler,
} from '../controllers/orderController.js'
import { validate } from '../middlewares/validateMiddleware.js'

const router = Router()

router.use(verifyToken)

router.route('/')
    .get(getOrderHistoryHandler)

router.route('/checkout')
    .post(createOrderFromCartHandler)

router.route('/:orderId/reorder')
    .post(reorderOrderHandler)

const reviewSchema = z.object({
    rating: z.number().int().min(1, 'Vui lòng chọn số sao.').max(5),
    content: z.string().trim().min(3, 'Nội dung đánh giá phải có ít nhất 3 ký tự.').max(1000, 'Nội dung đánh giá không được vượt quá 1000 ký tự.'),
}).strict()

router.route('/:orderId/review')
    .get(getOrderReviewHandler)
    .post(validate({ body: reviewSchema }), createOrderReviewHandler)
    .patch(validate({ body: reviewSchema }), updateOrderReviewHandler)
    .delete(deleteOrderReviewHandler)

router.route('/:id/cancel')
    .post(cancelOrderHandler)

router.route('/:id')
    .get(getOrderDetailHandler)

export default router
