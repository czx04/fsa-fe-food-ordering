import { Router } from 'express'
import { z } from 'zod'
import { verifyToken, requireVerifiedEmail } from '../middlewares/authMiddleware.js'
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
    .post(requireVerifiedEmail, createOrderFromCartHandler)

router.route('/:orderId/reorder')
    .post(requireVerifiedEmail, reorderOrderHandler)

const reviewSchema = z.object({
    rating: z.number().int().min(1, 'Vui lòng chọn số sao.').max(5),
    content: z.string().trim().min(3, 'Nội dung đánh giá phải có ít nhất 3 ký tự.').max(1000, 'Nội dung đánh giá không được vượt quá 1000 ký tự.'),
}).strict()

router.route('/:orderId/review')
    .get(getOrderReviewHandler)
    .post(requireVerifiedEmail, validate({ body: reviewSchema }), createOrderReviewHandler)
    .patch(requireVerifiedEmail, validate({ body: reviewSchema }), updateOrderReviewHandler)
    .delete(requireVerifiedEmail, deleteOrderReviewHandler)

router.route('/:id/cancel')
    .post(requireVerifiedEmail, cancelOrderHandler)

router.route('/:id')
    .get(getOrderDetailHandler)

export default router
