import { Response } from 'express'
import { Types, type PipelineStage } from 'mongoose'
import { AuthRequest } from '../middlewares/authMiddleware.js'
import { AuditLog } from '../models/AuditLog.js'
import { Coupon, CouponUsage } from '../models/Coupon.js'
import { CuisineCategory } from '../models/CuisineCategory.js'
import { MenuItem } from '../models/MenuItem.js'
import { Order } from '../models/Order.js'
import { Restaurant } from '../models/Restaurant.js'
import { Review } from '../models/Review.js'
import { recalculateRestaurantRatingSummary } from '../services/reviewService.js'
import { User } from '../models/User.js'
import { requestPasswordReset } from '../services/authService.js'
import {
  dashboardDateFormat,
  dashboardGranularityFrom,
  dateRangeFrom,
  escapeRegex,
  metric,
  paginationFrom,
  paginationMeta,
  recordAudit,
} from '../utils/dashboard.js'

const adminId = (req: AuthRequest) => req.user!.userId

const slugify = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const globalOrderSummary = async (from: Date, to: Date) => {
  const [result] = await Order.aggregate<{ totalOrders: number; deliveredOrders: number; gmv: number }>([
    { $match: { placedAt: { $gte: from, $lte: to } } },
    { $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      deliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
      gmv: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, '$pricing.grandTotal', 0] } },
    } },
  ])
  return result ?? { totalOrders: 0, deliveredOrders: 0, gmv: 0 }
}

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const range = dateRangeFrom(req.query)
    const [current, previous, chart, orderStatus, topRestaurants, recentRestaurants, activeUsers, approvedRestaurants, pendingRestaurants, flaggedReviews, lockedUsers] = await Promise.all([
      globalOrderSummary(range.from, range.to),
      globalOrderSummary(range.previousFrom, range.previousTo),
      Order.aggregate<{ _id: string; gmv: number; orders: number }>([
        { $match: { orderStatus: 'delivered', placedAt: { $gte: range.from, $lte: range.to } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$placedAt', timezone: 'Asia/Ho_Chi_Minh' } }, gmv: { $sum: '$pricing.grandTotal' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate<{ _id: string; count: number }>([
        { $match: { placedAt: { $gte: range.from, $lte: range.to } } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),
      Order.aggregate<{ _id: Types.ObjectId; name: string; orders: number; gmv: number; cancelled: number; total: number }>([
        { $match: { placedAt: { $gte: range.from, $lte: range.to } } },
        { $group: {
          _id: '$restaurantId',
          name: { $first: '$restaurantSnapshot.name' },
          orders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
          gmv: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, '$pricing.grandTotal', 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] } },
          total: { $sum: 1 },
        } },
        { $sort: { gmv: -1 } }, { $limit: 5 },
      ]),
      Restaurant.find({ deletedAt: null }).populate('ownerId', 'fullName email phone status role').populate('cuisineCategoryIds', 'name slug').sort({ createdAt: -1 }).limit(6).lean(),
      User.countDocuments({ status: 'active', deletedAt: null }),
      Restaurant.countDocuments({ approvalStatus: 'approved', deletedAt: null }),
      Restaurant.countDocuments({ approvalStatus: 'pending', deletedAt: null }),
      Review.countDocuments({ visibilityStatus: 'flagged', deletedAt: null }),
      User.countDocuments({ status: 'locked', deletedAt: null }),
    ])
    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      metrics: { gmv: metric(current.gmv, previous.gmv), orders: metric(current.totalOrders, previous.totalOrders), activeUsers, approvedRestaurants },
      attention: { pendingRestaurants, flaggedReviews, lockedUsers },
      chart: chart.map((point) => ({ date: point._id, gmv: point.gmv, orders: point.orders })),
      orderStatus: orderStatus.map((item) => ({ status: item._id, count: item.count })),
      topRestaurants: topRestaurants.map((item) => ({ restaurantId: item._id.toString(), name: item.name, orders: item.orders, gmv: item.gmv, cancellationRate: item.total ? item.cancelled / item.total * 100 : 0 })),
      recentRestaurants,
    })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải tổng quan quản trị.' })
  }
}

export const getPendingRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = paginationFrom(req.query)
    const filter: Record<string, any> = { deletedAt: null }
    if (typeof req.query.approvalStatus === 'string' && req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus
    if (typeof req.query.operationStatus === 'string' && req.query.operationStatus) filter.operationStatus = req.query.operationStatus
    if (typeof req.query.city === 'string' && req.query.city.trim()) filter['address.city'] = new RegExp(escapeRegex(req.query.city.trim()), 'i')
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const expression = new RegExp(escapeRegex(req.query.search.trim()), 'i')
      const userIds = await User.find({ $or: [{ fullName: expression }, { email: expression }, { phone: expression }] }).distinct('_id')
      filter.$or = [{ name: expression }, { phone: expression }, { ownerId: { $in: userIds } }]
    }
    const [data, totalItems] = await Promise.all([
      Restaurant.find(filter).populate('ownerId', 'fullName email phone role status').populate('cuisineCategoryIds', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Restaurant.countDocuments(filter),
    ])
    res.json({ data, meta: paginationMeta(page, limit, totalItems) })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Không thể tải danh sách nhà hàng.' })
  }
}

export const getAdminRestaurantDetail = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ _id: req.params.restaurantId, deletedAt: null })
      .populate('ownerId', 'fullName email phone role status createdAt')
      .populate('cuisineCategoryIds', 'name slug imageUrl isActive')
      .lean()
    if (!restaurant) { res.status(404).json({ message: 'Không tìm thấy nhà hàng.' }); return }
    const [menuItems, orders, reviews] = await Promise.all([
      MenuItem.countDocuments({ restaurantId: restaurant._id, deletedAt: null }),
      Order.countDocuments({ restaurantId: restaurant._id }),
      Review.countDocuments({ restaurantId: restaurant._id, deletedAt: null }),
    ])
    res.json({ restaurant, summary: { menuItems, orders, reviews } })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải hồ sơ nhà hàng.' })
  }
}

export const approveRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.restaurantId ?? req.params.id
    const { approvalStatus, rejectionReason } = req.body
    const restaurant = await Restaurant.findOne({ _id: id, deletedAt: null })
    if (!restaurant) { res.status(404).json({ message: 'Không tìm thấy nhà hàng.' }); return }
    const before = { approvalStatus: restaurant.approvalStatus, rejectionReason: restaurant.rejectionReason }
    restaurant.approvalStatus = approvalStatus
    restaurant.rejectionReason = approvalStatus === 'rejected' ? rejectionReason.trim() : null
    if (approvalStatus !== 'approved') restaurant.operationStatus = 'temporarily_closed'
    await restaurant.save()
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: `restaurant.${approvalStatus}`, entityType: 'Restaurant', entityId: restaurant.id, reason: rejectionReason, before, after: { approvalStatus: restaurant.approvalStatus, rejectionReason: restaurant.rejectionReason } })
    res.json({ message: 'Đã cập nhật trạng thái phê duyệt.', restaurant })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Cập nhật phê duyệt thất bại.' })
  }
}

export const updateAdminRestaurantOperation = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ _id: req.params.restaurantId, deletedAt: null })
    if (!restaurant) { res.status(404).json({ message: 'Không tìm thấy nhà hàng.' }); return }
    const before = restaurant.operationStatus
    restaurant.operationStatus = req.body.operationStatus
    await restaurant.save()
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: req.body.operationStatus === 'suspended' ? 'restaurant.suspended' : 'restaurant.unsuspended', entityType: 'Restaurant', entityId: restaurant.id, reason: req.body.reason, before, after: restaurant.operationStatus })
    res.json({ message: 'Đã cập nhật trạng thái vận hành.', restaurant })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể cập nhật trạng thái.' })
  }
}

export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = paginationFrom(req.query)
    const filter: Record<string, any> = { deletedAt: null }
    if (typeof req.query.role === 'string' && req.query.role) filter.role = req.query.role
    if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const expression = new RegExp(escapeRegex(req.query.search.trim()), 'i')
      filter.$or = [{ fullName: expression }, { email: expression }, { phone: expression }]
    }
    const [data, totalItems] = await Promise.all([
      User.find(filter).select('-passwordHash -refreshTokens').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ])
    res.json({ data, meta: paginationMeta(page, limit, totalItems) })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải người dùng.' })
  }
}

export const getAdminUserDetail = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, deletedAt: null }).select('-passwordHash -refreshTokens').lean()
    if (!user) { res.status(404).json({ message: 'Không tìm thấy người dùng.' }); return }
    const [restaurants, orderSummary] = await Promise.all([
      Restaurant.find({ ownerId: user._id, deletedAt: null }).populate('ownerId', 'fullName email phone status role').populate('cuisineCategoryIds', 'name slug').lean(),
      Order.aggregate<{ count: number; total: number }>([
        { $match: { customerId: user._id } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, '$pricing.grandTotal', 0] } } } },
      ]).then((items) => items[0] ?? { count: 0, total: 0 }),
    ])
    res.json({ user, restaurants, orderSummary })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải người dùng.' })
  }
}

export const updateAdminUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.userId === adminId(req) && req.body.status === 'locked') {
      res.status(409).json({ message: 'Bạn không thể tự khóa tài khoản của mình.' })
      return
    }
    const user = await User.findOne({ _id: req.params.userId, deletedAt: null })
    if (!user) { res.status(404).json({ message: 'Không tìm thấy người dùng.' }); return }
    const before = user.status
    user.status = req.body.status
    user.lockedUntil = null
    user.failedLoginCount = 0
    await user.save()
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: req.body.status === 'locked' ? 'user.locked' : 'user.unlocked', entityType: 'User', entityId: user.id, reason: req.body.reason, before, after: user.status })
    res.json({ message: 'Đã cập nhật trạng thái tài khoản.', user })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể cập nhật tài khoản.' })
  }
}

export const adminRequestPasswordReset = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, deletedAt: null })
    if (!user) { res.status(404).json({ message: 'Không tìm thấy người dùng.' }); return }
    await requestPasswordReset(user.email)
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: 'user.password_reset_requested', entityType: 'User', entityId: user.id })
    res.json({ message: 'Đã khởi tạo yêu cầu đặt lại mật khẩu.' })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể khởi tạo đặt lại mật khẩu.' })
  }
}

export const getAdminOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = paginationFrom(req.query)
    const filter: Record<string, any> = {}
    if (req.query.orderStatus) filter.orderStatus = req.query.orderStatus
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus
    if (req.query.from || req.query.to) {
      filter.placedAt = {}
      if (req.query.from) filter.placedAt.$gte = new Date(`${req.query.from}T00:00:00.000Z`)
      if (req.query.to) filter.placedAt.$lte = new Date(`${req.query.to}T23:59:59.999Z`)
    }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const expression = new RegExp(escapeRegex(req.query.search.trim()), 'i')
      filter.$or = [{ orderNumber: expression }, { 'customerSnapshot.fullName': expression }, { 'restaurantSnapshot.name': expression }, { 'recipient.phone': expression }]
    }
    const [data, totalItems] = await Promise.all([
      Order.find(filter).sort({ placedAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ])
    res.json({ data, meta: paginationMeta(page, limit, totalItems) })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải đơn hàng.' })
  }
}

export const getAdminOrderDetail = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.orderId).lean()
    if (!order) { res.status(404).json({ message: 'Không tìm thấy đơn hàng.' }); return }
    res.json({ order })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải đơn hàng.' })
  }
}

export const getAdminCuisines = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await CuisineCategory.aggregate<Record<string, any>>([
      { $lookup: { from: 'restaurants', let: { cuisineId: '$_id' }, pipeline: [{ $match: { $expr: { $and: [{ $in: ['$$cuisineId', '$cuisineCategoryIds'] }, { $eq: ['$deletedAt', null] }] } } }, { $count: 'count' }], as: 'restaurants' } },
      { $addFields: { restaurantCount: { $ifNull: [{ $arrayElemAt: ['$restaurants.count', 0] }, 0] } } },
      { $project: { restaurants: 0 } }, { $sort: { displayOrder: 1, name: 1 } },
    ])
    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Không thể tải danh mục ẩm thực.' })
  }
}

export const createAdminCuisine = async (req: AuthRequest, res: Response) => {
  try {
    const displayOrder = await CuisineCategory.countDocuments()
    const cuisine = await CuisineCategory.create({ ...req.body, name: req.body.name.trim(), slug: slugify(req.body.name), imageUrl: req.body.imageUrl || null, displayOrder: displayOrder + 1 })
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: 'cuisine.created', entityType: 'CuisineCategory', entityId: cuisine.id, after: cuisine.toObject() })
    res.status(201).json({ message: 'Đã tạo danh mục ẩm thực.', cuisine })
  } catch (error: any) {
    res.status(400).json({ message: error.code === 11000 ? 'Tên/slug danh mục đã tồn tại.' : error.message })
  }
}

export const updateAdminCuisine = async (req: AuthRequest, res: Response) => {
  try {
    const cuisine = await CuisineCategory.findById(req.params.cuisineId)
    if (!cuisine) { res.status(404).json({ message: 'Không tìm thấy danh mục.' }); return }
    const before = cuisine.toObject()
    cuisine.name = req.body.name.trim(); cuisine.slug = slugify(req.body.name); cuisine.description = req.body.description || null; cuisine.imageUrl = req.body.imageUrl || null; cuisine.isActive = req.body.isActive
    await cuisine.save()
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: 'cuisine.updated', entityType: 'CuisineCategory', entityId: cuisine.id, before, after: cuisine.toObject() })
    res.json({ message: 'Đã cập nhật danh mục.', cuisine })
  } catch (error: any) {
    res.status(400).json({ message: error.code === 11000 ? 'Tên/slug danh mục đã tồn tại.' : error.message })
  }
}

export const deleteAdminCuisine = async (req: AuthRequest, res: Response) => {
  try {
    const cuisine = await CuisineCategory.findById(req.params.cuisineId)
    if (!cuisine) { res.status(404).json({ message: 'Không tìm thấy danh mục.' }); return }
    if (await Restaurant.exists({ cuisineCategoryIds: cuisine._id, deletedAt: null })) {
      res.status(409).json({ message: 'Không thể xóa danh mục đang được nhà hàng sử dụng. Hãy tắt danh mục thay vì xóa.' })
      return
    }
    await cuisine.deleteOne()
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: 'cuisine.deleted', entityType: 'CuisineCategory', entityId: cuisine.id, before: cuisine.toObject() })
    res.json({ message: 'Đã xóa danh mục.' })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể xóa danh mục.' })
  }
}

export const reorderAdminCuisines = async (req: AuthRequest, res: Response) => {
  try {
    await CuisineCategory.bulkWrite(req.body.ids.map((id: string, index: number) => ({ updateOne: { filter: { _id: id }, update: { $set: { displayOrder: index + 1 } } } })))
    res.json({ message: 'Đã sắp xếp danh mục.' })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể sắp xếp danh mục.' })
  }
}

export const getAdminCoupons = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = paginationFrom(req.query)
    const filter: Record<string, any> = {}
    if (req.query.status) filter.status = req.query.status
    if (typeof req.query.search === 'string' && req.query.search.trim()) filter.code = new RegExp(escapeRegex(req.query.search.trim()), 'i')
    const [coupons, totalItems] = await Promise.all([Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Coupon.countDocuments(filter)])
    const ids = coupons.map((coupon) => coupon._id)
    const usages = await CouponUsage.aggregate<{ _id: Types.ObjectId; usageCount: number; totalDiscount: number }>([
      { $match: { couponId: { $in: ids } } },
      { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $group: { _id: '$couponId', usageCount: { $sum: 1 }, totalDiscount: { $sum: '$order.pricing.discountAmount' } } },
    ])
    const usageMap = new Map(usages.map((usage) => [usage._id.toString(), usage]))
    const data = coupons.map((coupon) => ({ ...coupon, usageCount: usageMap.get(coupon._id.toString())?.usageCount ?? 0, totalDiscount: usageMap.get(coupon._id.toString())?.totalDiscount ?? 0 }))
    res.json({ data, meta: paginationMeta(page, limit, totalItems) })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải coupon.' })
  }
}

const couponPayload = (body: Record<string, any>) => ({
  code: body.code.trim().toUpperCase(),
  discountType: body.discountType,
  discountValue: Number(body.discountValue),
  minOrderAmount: Number(body.minOrderAmount),
  maxDiscountAmount: body.maxDiscountAmount === null ? undefined : Number(body.maxDiscountAmount),
  startsAt: new Date(body.startsAt),
  endsAt: new Date(body.endsAt),
  status: body.status,
})

export const createAdminCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await Coupon.create(couponPayload(req.body))
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: 'coupon.created', entityType: 'Coupon', entityId: coupon.id, after: coupon.toObject() })
    res.status(201).json({ message: 'Đã tạo coupon.', coupon })
  } catch (error: any) {
    res.status(400).json({ message: error.code === 11000 ? 'Mã coupon đã tồn tại.' : error.message })
  }
}

export const getAdminCoupon = async (req: AuthRequest, res: Response) => {
  const coupon = await Coupon.findById(req.params.couponId).lean()
  if (!coupon) { res.status(404).json({ message: 'Không tìm thấy coupon.' }); return }
  res.json({ coupon })
}

export const updateAdminCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await Coupon.findById(req.params.couponId)
    if (!coupon) { res.status(404).json({ message: 'Không tìm thấy coupon.' }); return }
    const before = coupon.toObject(); Object.assign(coupon, couponPayload(req.body)); await coupon.save()
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: 'coupon.updated', entityType: 'Coupon', entityId: coupon.id, before, after: coupon.toObject() })
    res.json({ message: 'Đã cập nhật coupon.', coupon })
  } catch (error: any) {
    res.status(400).json({ message: error.code === 11000 ? 'Mã coupon đã tồn tại.' : error.message })
  }
}

export const updateAdminCouponStatus = async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await Coupon.findById(req.params.couponId)
    if (!coupon) { res.status(404).json({ message: 'Không tìm thấy coupon.' }); return }
    const before = coupon.status; coupon.status = req.body.status; await coupon.save()
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: 'coupon.status_changed', entityType: 'Coupon', entityId: coupon.id, before, after: coupon.status })
    res.json({ message: 'Đã cập nhật trạng thái coupon.', coupon })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể cập nhật coupon.' })
  }
}

export const getAdminReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = paginationFrom(req.query)
    const filter: Record<string, any> = { deletedAt: null }
    if (req.query.visibilityStatus) filter.visibilityStatus = req.query.visibilityStatus
    if (req.query.rating) filter.rating = Number(req.query.rating)
    if (typeof req.query.search === 'string' && req.query.search.trim()) filter.content = new RegExp(escapeRegex(req.query.search.trim()), 'i')
    const [data, totalItems] = await Promise.all([
      Review.find(filter).populate('customerId', 'fullName email avatarUrl').populate('restaurantId', 'name slug').populate('orderId', 'orderNumber').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments(filter),
    ])
    res.json({ data, meta: paginationMeta(page, limit, totalItems) })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải đánh giá.' })
  }
}

export const moderateAdminReview = async (req: AuthRequest, res: Response) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, deletedAt: null })
    if (!review) { res.status(404).json({ message: 'Không tìm thấy đánh giá.' }); return }
    const before = review.visibilityStatus; review.visibilityStatus = req.body.visibilityStatus; await review.save()
    await recalculateRestaurantRatingSummary(review.restaurantId)
    await recordAudit({ request: req, actorId: adminId(req), actorRole: 'admin', action: 'review.visibility_changed', entityType: 'Review', entityId: review.id, reason: req.body.reason, before, after: review.visibilityStatus })
    res.json({ message: 'Đã cập nhật trạng thái đánh giá.', review })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể kiểm duyệt đánh giá.' })
  }
}

type AnalyticsGroup = 'restaurant' | 'category'

export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const range = dateRangeFrom(req.query)
    const granularity = dashboardGranularityFrom(req.query)
    const groupBy: AnalyticsGroup = req.query.groupBy === 'category' ? 'category' : 'restaurant'
    const rangeMatch = { placedAt: { $gte: range.from, $lte: range.to } }
    const deliveredMatch = { ...rangeMatch, orderStatus: 'delivered' }

    const groupPipeline: PipelineStage[] = groupBy === 'restaurant'
      ? [
          { $match: deliveredMatch },
          { $group: {
            _id: '$restaurantId',
            label: { $first: '$restaurantSnapshot.name' },
            orders: { $sum: 1 },
            revenue: { $sum: '$pricing.grandTotal' },
            quantity: { $sum: { $sum: '$items.quantity' } },
          } },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
          { $project: { _id: 0, label: { $ifNull: ['$label', 'Nhà hàng chưa xác định'] }, orders: 1, revenue: 1, quantity: 1 } },
        ]
      : [
          { $match: deliveredMatch },
          { $unwind: '$items' },
          { $lookup: { from: 'menuItems', localField: 'items.menuItemId', foreignField: '_id', as: 'menuItem' } },
          { $set: { menuCategoryId: { $arrayElemAt: ['$menuItem.menuCategoryId', 0] } } },
          { $lookup: { from: 'menuCategories', localField: 'menuCategoryId', foreignField: '_id', as: 'menuCategory' } },
          { $set: { groupLabel: { $ifNull: [{ $arrayElemAt: ['$menuCategory.name', 0] }, 'Chưa phân loại'] } } },
          { $group: {
            _id: { label: '$groupLabel', orderId: '$_id' },
            revenue: { $sum: '$items.lineTotal' },
            quantity: { $sum: '$items.quantity' },
          } },
          { $group: {
            _id: '$_id.label',
            orders: { $sum: 1 },
            revenue: { $sum: '$revenue' },
            quantity: { $sum: '$quantity' },
          } },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
          { $project: { _id: 0, label: '$_id', orders: 1, revenue: 1, quantity: 1 } },
        ]

    const [summaryRows, trend, topItems, groupBreakdown, cityBreakdown, paymentBreakdown, cancellationReasons, categoryBreakdown] = await Promise.all([
      Order.aggregate<{ totalRevenue: number; totalOrders: number; deliveredOrders: number }>([
        { $match: rangeMatch },
        { $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, '$pricing.grandTotal', 0] } },
          totalOrders: { $sum: 1 },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
        } },
      ]),
      Order.aggregate<{ _id: string; revenue: number; orders: number }>([
        { $match: rangeMatch },
        { $group: {
          _id: { $dateToString: { format: dashboardDateFormat(granularity), date: '$placedAt', timezone: 'Asia/Ho_Chi_Minh' } },
          revenue: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, '$pricing.grandTotal', 0] } },
          orders: { $sum: 1 },
        } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate<{ _id: Types.ObjectId; name: string; quantity: number; revenue: number }>([
        { $match: deliveredMatch },
        { $unwind: '$items' },
        { $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        } },
        { $sort: { quantity: -1, revenue: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate<{ label: string; orders: number; revenue: number; quantity: number }>(groupPipeline),
      Order.aggregate<{ label: string; orders: number; gmv: number }>([
        { $match: deliveredMatch }, { $group: { _id: '$recipient.city', orders: { $sum: 1 }, gmv: { $sum: '$pricing.grandTotal' } } }, { $sort: { gmv: -1 } }, { $project: { _id: 0, label: '$_id', orders: 1, gmv: 1 } },
      ]),
      Order.aggregate<{ label: string; count: number; amount: number }>([
        { $match: deliveredMatch }, { $group: { _id: '$paymentMethod', count: { $sum: 1 }, amount: { $sum: '$pricing.grandTotal' } } }, { $sort: { amount: -1 } }, { $project: { _id: 0, label: '$_id', count: 1, amount: 1 } },
      ]),
      Order.aggregate<{ label: string; count: number }>([
        { $match: { orderStatus: 'cancelled', placedAt: { $gte: range.from, $lte: range.to } } }, { $group: { _id: { $ifNull: ['$cancellation.reason', 'Không có lý do'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $project: { _id: 0, label: '$_id', count: 1 } },
      ]),
      Order.aggregate<{ label: string; orders: number; gmv: number }>([
        { $match: deliveredMatch },
        { $lookup: { from: 'restaurants', localField: 'restaurantId', foreignField: '_id', as: 'restaurant' } }, { $unwind: '$restaurant' }, { $unwind: { path: '$restaurant.cuisineCategoryIds', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'cuisinecategories', localField: 'restaurant.cuisineCategoryIds', foreignField: '_id', as: 'cuisine' } },
        { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$cuisine.name', 0] }, 'Chưa phân loại'] }, orders: { $sum: 1 }, gmv: { $sum: '$pricing.grandTotal' } } },
        { $sort: { gmv: -1 } }, { $project: { _id: 0, label: '$_id', orders: 1, gmv: 1 } },
      ]),
    ])
    const summary = summaryRows[0] ?? { totalRevenue: 0, totalOrders: 0, deliveredOrders: 0 }
    const normalizedTopItems = topItems.map((item) => ({
      itemId: item._id.toString(),
      name: item.name,
      quantity: item.quantity,
      revenue: item.revenue,
    }))
    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      granularity,
      groupBy,
      metrics: {
        ...summary,
        topItem: normalizedTopItems[0] ?? null,
      },
      trend: trend.map((item) => ({ period: item._id, revenue: item.revenue, orders: item.orders })),
      groupBreakdown,
      topItems: normalizedTopItems,
      cityBreakdown,
      categoryBreakdown,
      paymentBreakdown,
      cancellationReasons,
    })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải phân tích.' })
  }
}

export const getAdminAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = paginationFrom(req.query)
    const filter: Record<string, any> = {}
    if (req.query.actorRole) filter.actorRole = req.query.actorRole
    if (req.query.from) filter.createdAt = { $gte: new Date(`${req.query.from}T00:00:00.000Z`) }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const expression = new RegExp(escapeRegex(req.query.search.trim()), 'i')
      filter.$or = [{ action: expression }, { entityType: expression }, { entityId: expression }, { reason: expression }]
    }
    const [data, totalItems] = await Promise.all([
      AuditLog.find(filter).populate('actorId', 'fullName email role').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ])
    res.json({ data, meta: paginationMeta(page, limit, totalItems) })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải nhật ký.' })
  }
}
