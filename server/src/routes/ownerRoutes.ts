import { Router } from 'express'
import { z } from 'zod'
import {
  createMenuCategory,
  createMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  deleteReviewReply,
  getMenuCategories,
  getMenuItem,
  getMenuItems,
  getMyRestaurant,
  getMyRestaurants,
  getOwnerDashboard,
  getOwnerOrderDetail,
  getOwnerOrders,
  getOwnerReviews,
  onboardRestaurant,
  reorderMenuCategories,
  updateMenuCategory,
  updateMenuItem,
  updateMenuItemAvailability,
  updateOperationStatus,
  updateOwnerOrderStatus,
  updateRestaurant,
  upsertReviewReply,
} from '../controllers/ownerController.js'
import { verifyToken, requireRole, requireVerifiedEmail } from '../middlewares/authMiddleware.js'
import { validate } from '../middlewares/validateMiddleware.js'

export const ownerRouter = Router()
ownerRouter.use(verifyToken)
ownerRouter.use(requireRole(['restaurant_owner']))

const openingHoursSchema = z.array(z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isClosed: z.boolean(),
  slots: z.array(z.object({ open: z.string().regex(/^\d{2}:\d{2}$/), close: z.string().regex(/^\d{2}:\d{2}$/) })),
})).max(7)

const restaurantSchema = z.object({
  name: z.string().trim().min(3).max(150),
  description: z.string().trim().min(20).max(3000),
  phone: z.string().trim().regex(/^0\d{9,10}$/),
  cuisineCategoryIds: z.array(z.string()).min(1),
  address: z.object({
    line1: z.string().trim().min(2),
    ward: z.string().trim().min(2),
    district: z.string().trim().min(2),
    city: z.string().trim().min(2),
  }),
  openingHours: openingHoursSchema,
  delivery: z.object({
    fee: z.number().min(0),
    minMinutes: z.number().int().min(1),
    maxMinutes: z.number().int().min(1),
    maxDistanceKm: z.number().min(0).nullable().optional(),
  }).refine((value) => value.maxMinutes >= value.minMinutes, { message: 'Thời gian giao tối đa phải lớn hơn tối thiểu.' }),
  priceRange: z.enum(['budget', 'mid', 'premium']),
  logoUrl: z.string().url().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  galleryUrls: z.array(z.string().url()).max(12),
}).passthrough()

const optionGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  minSelect: z.number().int().min(0),
  maxSelect: z.number().int().min(1),
  required: z.boolean(),
  options: z.array(z.object({ name: z.string().trim().min(1).max(100), priceDelta: z.number().min(0), isAvailable: z.boolean() })).min(1),
}).refine((value) => value.maxSelect >= value.minSelect, { message: 'maxSelect phải lớn hơn hoặc bằng minSelect.' })

const menuItemSchema = z.object({
  menuCategoryId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  shortDescription: z.string().trim().max(180).optional(),
  description: z.string().trim().max(3000).optional(),
  ingredients: z.array(z.string().trim().min(1)).max(50),
  imageUrls: z.array(z.string().url()).max(8),
  basePrice: z.number().min(0),
  salePrice: z.number().min(0).nullable(),
  isAvailable: z.boolean(),
  isVisible: z.boolean(),
  optionGroups: z.array(optionGroupSchema).max(12),
}).refine((value) => value.salePrice === null || value.salePrice <= value.basePrice, { path: ['salePrice'], message: 'Giá khuyến mãi không được lớn hơn giá gốc.' })

// Backward-compatible singular endpoints.
ownerRouter.get('/restaurant', getMyRestaurant)
ownerRouter.post('/restaurant', requireVerifiedEmail, validate({ body: restaurantSchema }), onboardRestaurant)

ownerRouter.get('/restaurants', getMyRestaurants)
ownerRouter.post('/restaurants', requireVerifiedEmail, validate({ body: restaurantSchema }), onboardRestaurant)
ownerRouter.get('/restaurants/:restaurantId', getMyRestaurant)
ownerRouter.patch('/restaurants/:restaurantId', requireVerifiedEmail, validate({ body: restaurantSchema }), updateRestaurant)
ownerRouter.patch('/restaurants/:restaurantId/operation-status', validate({ body: z.object({ operationStatus: z.enum(['open', 'temporarily_closed']) }) }), updateOperationStatus)
ownerRouter.get('/restaurants/:restaurantId/dashboard', getOwnerDashboard)

ownerRouter.get('/restaurants/:restaurantId/orders', getOwnerOrders)
ownerRouter.get('/restaurants/:restaurantId/orders/:orderId', getOwnerOrderDetail)
ownerRouter.patch('/restaurants/:restaurantId/orders/:orderId/status', validate({ body: z.object({
  status: z.enum(['confirmed', 'preparing', 'delivering', 'delivered', 'cancelled']),
  reason: z.string().trim().max(500).optional(),
  note: z.string().trim().max(500).optional(),
}) }), updateOwnerOrderStatus)

ownerRouter.get('/restaurants/:restaurantId/menu-categories', getMenuCategories)
ownerRouter.post('/restaurants/:restaurantId/menu-categories', validate({ body: z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).optional() }) }), createMenuCategory)
ownerRouter.patch('/restaurants/:restaurantId/menu-categories/reorder', validate({ body: z.object({ ids: z.array(z.string()).min(1) }) }), reorderMenuCategories)
ownerRouter.patch('/restaurants/:restaurantId/menu-categories/:categoryId', validate({ body: z.object({ name: z.string().trim().min(2).max(100).optional(), description: z.string().trim().max(500).optional(), isVisible: z.boolean().optional() }) }), updateMenuCategory)
ownerRouter.delete('/restaurants/:restaurantId/menu-categories/:categoryId', deleteMenuCategory)

ownerRouter.get('/restaurants/:restaurantId/menu-items', getMenuItems)
ownerRouter.post('/restaurants/:restaurantId/menu-items', validate({ body: menuItemSchema }), createMenuItem)
ownerRouter.get('/restaurants/:restaurantId/menu-items/:itemId', getMenuItem)
ownerRouter.patch('/restaurants/:restaurantId/menu-items/:itemId', validate({ body: menuItemSchema }), updateMenuItem)
ownerRouter.delete('/restaurants/:restaurantId/menu-items/:itemId', deleteMenuItem)
ownerRouter.patch('/restaurants/:restaurantId/menu-items/:itemId/availability', validate({ body: z.object({ isAvailable: z.boolean() }) }), updateMenuItemAvailability)

ownerRouter.get('/restaurants/:restaurantId/reviews', getOwnerReviews)
ownerRouter.put('/restaurants/:restaurantId/reviews/:reviewId/reply', validate({ body: z.object({ content: z.string().trim().min(3).max(500) }) }), upsertReviewReply)
ownerRouter.delete('/restaurants/:restaurantId/reviews/:reviewId/reply', deleteReviewReply)
