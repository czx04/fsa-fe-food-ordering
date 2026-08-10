import { Router } from 'express'
import { z } from 'zod'
import {
  adminRequestPasswordReset,
  approveRestaurant,
  createAdminCoupon,
  createAdminCuisine,
  deleteAdminCuisine,
  getAdminAnalytics,
  getAdminAuditLogs,
  getAdminCoupon,
  getAdminCoupons,
  getAdminCuisines,
  getAdminDashboard,
  getAdminOrderDetail,
  getAdminOrders,
  getAdminRestaurantDetail,
  getAdminReviews,
  getAdminUserDetail,
  getAdminUsers,
  getPendingRestaurants,
  moderateAdminReview,
  reorderAdminCuisines,
  updateAdminCoupon,
  updateAdminCouponStatus,
  updateAdminCuisine,
  updateAdminRestaurantOperation,
  updateAdminUserStatus,
} from '../controllers/adminController.js'
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js'
import { validate } from '../middlewares/validateMiddleware.js'

export const adminRouter = Router()
adminRouter.use(verifyToken)
adminRouter.use(requireRole(['admin']))

const cuisineSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.union([z.literal(''), z.string().url()]).optional(),
  isActive: z.boolean(),
})

const couponSchema = z.object({
  code: z.string().trim().min(3).max(30),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().min(0),
  maxDiscountAmount: z.number().min(0).nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  status: z.enum(['active', 'disabled']),
}).refine((value) => value.discountType !== 'percentage' || value.discountValue <= 100, { path: ['discountValue'], message: 'Phần trăm giảm không được vượt 100.' })
  .refine((value) => value.startsAt < value.endsAt, { path: ['endsAt'], message: 'Thời gian kết thúc phải sau bắt đầu.' })

adminRouter.get('/dashboard', getAdminDashboard)

adminRouter.get('/restaurants', getPendingRestaurants)
adminRouter.get('/restaurants/:restaurantId', getAdminRestaurantDetail)
adminRouter.patch('/restaurants/:restaurantId/approval', validate({ body: z.object({
  approvalStatus: z.enum(['approved', 'rejected', 'pending']),
  rejectionReason: z.string().trim().max(1000).nullable().optional(),
}).refine((value) => value.approvalStatus !== 'rejected' || Boolean(value.rejectionReason?.trim()), { message: 'Vui lòng nhập lý do từ chối.' }) }), approveRestaurant)
adminRouter.patch('/restaurants/:restaurantId/operation-status', validate({ body: z.object({
  operationStatus: z.enum(['suspended', 'temporarily_closed']),
  reason: z.string().trim().min(3).max(1000),
}) }), updateAdminRestaurantOperation)
// Legacy approval route.
adminRouter.patch('/restaurants/:id/approve', validate({ body: z.object({ approvalStatus: z.enum(['approved', 'rejected', 'pending']), rejectionReason: z.string().trim().max(1000).optional() }) }), approveRestaurant)

adminRouter.get('/users', getAdminUsers)
adminRouter.get('/users/:userId', getAdminUserDetail)
adminRouter.patch('/users/:userId/status', validate({ body: z.object({ status: z.enum(['active', 'locked']), reason: z.string().trim().min(3).max(1000) }) }), updateAdminUserStatus)
adminRouter.post('/users/:userId/password-reset', adminRequestPasswordReset)

adminRouter.get('/orders', getAdminOrders)
adminRouter.get('/orders/:orderId', getAdminOrderDetail)

adminRouter.get('/cuisines', getAdminCuisines)
adminRouter.post('/cuisines', validate({ body: cuisineSchema }), createAdminCuisine)
adminRouter.patch('/cuisines/reorder', validate({ body: z.object({ ids: z.array(z.string()).min(1) }) }), reorderAdminCuisines)
adminRouter.patch('/cuisines/:cuisineId', validate({ body: cuisineSchema }), updateAdminCuisine)
adminRouter.delete('/cuisines/:cuisineId', deleteAdminCuisine)

adminRouter.get('/coupons', getAdminCoupons)
adminRouter.post('/coupons', validate({ body: couponSchema }), createAdminCoupon)
adminRouter.get('/coupons/:couponId', getAdminCoupon)
adminRouter.patch('/coupons/:couponId', validate({ body: couponSchema }), updateAdminCoupon)
adminRouter.patch('/coupons/:couponId/status', validate({ body: z.object({ status: z.enum(['active', 'disabled']) }) }), updateAdminCouponStatus)

adminRouter.get('/reviews', getAdminReviews)
adminRouter.patch('/reviews/:reviewId/visibility', validate({ body: z.object({
  visibilityStatus: z.enum(['visible', 'hidden', 'flagged']),
  reason: z.string().trim().min(3).max(1000),
}) }), moderateAdminReview)

adminRouter.get('/analytics', getAdminAnalytics)
adminRouter.get('/audit-logs', getAdminAuditLogs)
