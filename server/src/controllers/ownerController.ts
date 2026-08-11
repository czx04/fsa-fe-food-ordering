import { NextFunction, Response } from 'express'
import { Types } from 'mongoose'
import { AuthRequest } from '../middlewares/authMiddleware.js'
import { Restaurant } from '../models/Restaurant.js'
import { MenuCategory } from '../models/MenuCategory.js'
import { MenuItem } from '../models/MenuItem.js'
import { Order } from '../models/Order.js'
import { Review } from '../models/Review.js'
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
import * as orderService from '../services/orderService.js'

const slugify = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replaceAll('đ', 'd')
  .replaceAll(/[^a-z0-9]+/g, '-')
  .replace(/^-+/, '').replace(/-+$/, '') // Simplified regex

const ownerId = (req: AuthRequest) => req.user!.userId

const findOwnedRestaurant = async (req: AuthRequest, res: Response) => {
  const restaurant = await Restaurant.findOne({
    _id: req.params.restaurantId,
    ownerId: ownerId(req),
    deletedAt: null,
  })
  if (!restaurant) res.status(404).json({ message: 'Không tìm thấy nhà hàng thuộc quyền sở hữu.' })
  return restaurant
}

const populatedRestaurant = (id: string) => Restaurant.findById(id)
  .populate('cuisineCategoryIds', 'name slug imageUrl isActive')
  .populate('ownerId', 'fullName email phone role status')

const uniqueRestaurantSlug = async (name: string, excludeId?: string) => {
  const base = slugify(name) || 'nha-hang'
  let slug = base
  let suffix = 1
  while (await Restaurant.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    suffix += 1
    slug = `${base}-${suffix}`
  }
  return slug
}

const normalizeRestaurantPayload = (body: Record<string, any>) => ({
  name: body.name?.trim(),
  description: body.description?.trim(),
  phone: body.phone?.trim(),
  cuisineCategoryIds: Array.isArray(body.cuisineCategoryIds) ? body.cuisineCategoryIds : [],
  address: body.address ?? {
    line1: body.line1?.trim(),
    ward: body.ward?.trim(),
    district: body.district?.trim(),
    city: body.city?.trim(),
  },
  openingHours: Array.isArray(body.openingHours) ? body.openingHours : [],
  delivery: body.delivery ?? { fee: 15000, minMinutes: 20, maxMinutes: 40, maxDistanceKm: 8 },
  priceRange: body.priceRange ?? 'budget',
  logoUrl: body.logoUrl || null,
  coverUrl: body.coverUrl || null,
  galleryUrls: Array.isArray(body.galleryUrls) ? body.galleryUrls : [],
})

export const getMyRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const restaurants = await Restaurant.find({ ownerId: ownerId(req), deletedAt: null })
      .populate('cuisineCategoryIds', 'name slug imageUrl isActive')
      .sort({ createdAt: -1 })
    res.json({ data: restaurants })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Không thể tải danh sách nhà hàng.' })
  }
}

export const getMyRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.restaurantId) {
      const owned = await findOwnedRestaurant(req, res)
      if (!owned) return
      const restaurant = await populatedRestaurant(owned.id)
      res.json({ restaurant })
      return
    }
    const restaurant = await Restaurant.findOne({ ownerId: ownerId(req), deletedAt: null })
      .populate('cuisineCategoryIds', 'name slug imageUrl isActive')
    res.json({ restaurant })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Không thể tải nhà hàng.' })
  }
}

export const onboardRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const payload = normalizeRestaurantPayload(req.body)
    const slug = await uniqueRestaurantSlug(payload.name)
    const restaurant = await Restaurant.create({
      ownerId: ownerId(req),
      ...payload,
      slug,
      approvalStatus: 'pending',
      operationStatus: 'temporarily_closed',
      rejectionReason: null,
    })
    await recordAudit({
      request: req,
      actorId: ownerId(req),
      actorRole: 'restaurant_owner',
      action: 'restaurant.created',
      entityType: 'Restaurant',
      entityId: restaurant.id,
      after: restaurant.toObject(),
    })
    res.status(201).json({
      message: 'Nộp hồ sơ nhà hàng thành công. Vui lòng chờ xét duyệt.',
      restaurant: await populatedRestaurant(restaurant.id),
    })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Tạo hồ sơ nhà hàng thất bại.' })
  }
}

export const updateRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const before = restaurant.toObject()
    const payload = normalizeRestaurantPayload(req.body)
    restaurant.name = payload.name
    restaurant.description = payload.description
    restaurant.phone = payload.phone
    restaurant.cuisineCategoryIds = payload.cuisineCategoryIds
    restaurant.address = payload.address
    restaurant.openingHours = payload.openingHours
    restaurant.delivery = payload.delivery
    restaurant.priceRange = payload.priceRange
    restaurant.logoUrl = payload.logoUrl
    restaurant.coverUrl = payload.coverUrl
    restaurant.galleryUrls = payload.galleryUrls
    if (restaurant.name !== before.name) restaurant.slug = await uniqueRestaurantSlug(restaurant.name, restaurant.id)
    if (restaurant.approvalStatus === 'rejected') {
      restaurant.approvalStatus = 'pending'
      restaurant.rejectionReason = null
    }
    await restaurant.save()
    await recordAudit({ request: req, actorId: ownerId(req), actorRole: 'restaurant_owner', action: 'restaurant.updated', entityType: 'Restaurant', entityId: restaurant.id, before, after: restaurant.toObject() })
    res.json({ message: 'Đã cập nhật nhà hàng.', restaurant: await populatedRestaurant(restaurant.id) })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Cập nhật nhà hàng thất bại.' })
  }
}

export const updateOperationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    if (restaurant.operationStatus === 'suspended') {
      res.status(403).json({ message: 'Nhà hàng đang bị đình chỉ. Vui lòng liên hệ Ban quản trị.' })
      return
    }
    if (restaurant.approvalStatus !== 'approved' && req.body.operationStatus === 'open') {
      res.status(409).json({ message: 'Nhà hàng chỉ có thể mở nhận đơn sau khi được duyệt.' })
      return
    }
    const before = restaurant.operationStatus
    restaurant.operationStatus = req.body.operationStatus
    await restaurant.save()
    await recordAudit({ request: req, actorId: ownerId(req), actorRole: 'restaurant_owner', action: 'restaurant.operation_status_changed', entityType: 'Restaurant', entityId: restaurant.id, before, after: restaurant.operationStatus })
    res.json({ message: 'Đã cập nhật trạng thái vận hành.', restaurant })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể cập nhật trạng thái.' })
  }
}

const orderSummary = async (restaurantId: Types.ObjectId, from: Date, to: Date) => {
  const [result] = await Order.aggregate<{
    totalOrders: number
    deliveredOrders: number
    cancelledOrders: number
    revenue: number
  }>([
    { $match: { restaurantId, placedAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        deliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, '$pricing.grandTotal', 0] } },
      }
    },
  ])
  return result ?? { totalOrders: 0, deliveredOrders: 0, cancelledOrders: 0, revenue: 0 }
}

export const getOwnerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const range = dateRangeFrom(req.query)
    const granularity = dashboardGranularityFrom(req.query)
    const restaurantObjectId = restaurant._id as Types.ObjectId
    const [current, previous, chart, orderStatus, topItems, categoryBreakdown, recentOrders, unavailableItems, unansweredReviews] = await Promise.all([
      orderSummary(restaurantObjectId, range.from, range.to),
      orderSummary(restaurantObjectId, range.previousFrom, range.previousTo),
      Order.aggregate<{ _id: string; revenue: number; orders: number }>([
        { $match: { restaurantId: restaurantObjectId, orderStatus: 'delivered', placedAt: { $gte: range.from, $lte: range.to } } },
        { $group: { _id: { $dateToString: { format: dashboardDateFormat(granularity), date: '$placedAt', timezone: 'Asia/Ho_Chi_Minh' } }, revenue: { $sum: '$pricing.grandTotal' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate<{ _id: string; count: number }>([
        { $match: { restaurantId: restaurantObjectId, placedAt: { $gte: range.from, $lte: range.to } } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),
      Order.aggregate<{ _id: Types.ObjectId; name: string; quantity: number; revenue: number }>([
        { $match: { restaurantId: restaurantObjectId, orderStatus: 'delivered', placedAt: { $gte: range.from, $lte: range.to } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.menuItemId', name: { $first: '$items.name' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
        { $sort: { quantity: -1 } }, { $limit: 5 },
      ]),
      Order.aggregate<{ label: string; orders: number; revenue: number; quantity: number }>([
        { $match: { restaurantId: restaurantObjectId, orderStatus: 'delivered', placedAt: { $gte: range.from, $lte: range.to } } },
        { $unwind: '$items' },
        { $lookup: { from: 'menuItems', localField: 'items.menuItemId', foreignField: '_id', as: 'menuItem' } },
        { $set: { menuCategoryId: { $arrayElemAt: ['$menuItem.menuCategoryId', 0] } } },
        { $lookup: { from: 'menuCategories', localField: 'menuCategoryId', foreignField: '_id', as: 'menuCategory' } },
        { $set: { categoryLabel: { $ifNull: [{ $arrayElemAt: ['$menuCategory.name', 0] }, 'Chưa phân loại'] } } },
        { $group: {
          _id: { label: '$categoryLabel', orderId: '$_id' },
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
      ]),
      Order.find({ restaurantId: restaurantObjectId }).sort({ placedAt: -1 }).limit(6).lean(),
      MenuItem.countDocuments({ restaurantId: restaurantObjectId, isAvailable: false, deletedAt: null }),
      Review.countDocuments({ restaurantId: restaurantObjectId, visibilityStatus: 'visible', ownerReply: null, deletedAt: null }),
    ])
    const currentAov = current.deliveredOrders ? current.revenue / current.deliveredOrders : 0
    const previousAov = previous.deliveredOrders ? previous.revenue / previous.deliveredOrders : 0
    const currentCancellation = current.totalOrders ? current.cancelledOrders / current.totalOrders * 100 : 0
    const previousCancellation = previous.totalOrders ? previous.cancelledOrders / previous.totalOrders * 100 : 0
    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      granularity,
      metrics: {
        revenue: metric(current.revenue, previous.revenue),
        orders: metric(current.totalOrders, previous.totalOrders),
        averageOrderValue: metric(currentAov, previousAov),
        cancellationRate: metric(currentCancellation, previousCancellation),
      },
      attention: {
        pendingOrders: await Order.countDocuments({ restaurantId: restaurantObjectId, orderStatus: 'pending' }),
        unavailableItems,
        unansweredReviews,
      },
      chart: chart.map((point) => ({ date: point._id, revenue: point.revenue, orders: point.orders })),
      orderStatus: orderStatus.map((item) => ({ status: item._id, count: item.count })),
      topItems: topItems.map((item) => ({ itemId: item._id.toString(), name: item.name, quantity: item.quantity, revenue: item.revenue })),
      categoryBreakdown,
      recentOrders,
    })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải tổng quan.' })
  }
}

export const getOwnerOrders = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const { page, limit, skip } = paginationFrom(req.query)
    const filter: Record<string, any> = { restaurantId: restaurant._id }
    if (typeof req.query.status === 'string' && req.query.status) {
      filter.orderStatus = req.query.status
    }
    if (typeof req.query.paymentStatus === 'string' && req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus
    }
    const fromDate = typeof req.query.from === 'string' && req.query.from ? req.query.from : undefined
    const toDate = typeof req.query.to === 'string' && req.query.to ? req.query.to : undefined
    if (fromDate) { filter.placedAt = { ...filter.placedAt, $gte: new Date(`${fromDate}T00:00:00.000Z`) } }
    if (toDate) { filter.placedAt = { ...filter.placedAt, $lte: new Date(`${toDate}T23:59:59.999Z`) } }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const expression = new RegExp(escapeRegex(req.query.search.trim()), 'i')
      filter.$or = [{ orderNumber: expression }, { 'recipient.fullName': expression }, { 'recipient.phone': expression }]
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

export const getOwnerOrderDetail = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const order = await Order.findOne({ _id: req.params.orderId, restaurantId: restaurant._id }).lean()
    if (!order) {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng.' })
      return
    }
    res.json({ order })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải chi tiết đơn.' })
  }
}

export const updateOwnerOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return

    const { orderId } = req.params
    if (typeof orderId !== 'string') {
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ.' })
    }

    const { status, reason, note } = req.body
    if (!status) {
      return res.status(400).json({ message: 'Trạng thái mới là bắt buộc.' })
    }

    const updatedOrder = await orderService.updateOrderStatusByOwner(
      ownerId(req),
      orderId,
      restaurant.id,
      status,
      reason,
      note,
    )

    res.json({ message: 'Đã cập nhật trạng thái đơn.', order: updatedOrder })
  } catch (error: any) {
    next(error)
  }
}

export const getMenuCategories = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const categories = await MenuCategory.aggregate<Record<string, any>>([
      { $match: { restaurantId: restaurant._id, deletedAt: null } },
      { $lookup: { from: 'menuItems', let: { categoryId: '$_id' }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$menuCategoryId', '$$categoryId'] }, { $eq: ['$deletedAt', null] }] } } }, { $count: 'count' }], as: 'items' } },
      { $addFields: { itemCount: { $ifNull: [{ $arrayElemAt: ['$items.count', 0] }, 0] } } },
      { $project: { items: 0 } },
      { $sort: { displayOrder: 1, createdAt: 1 } },
    ])
    res.json({ data: categories })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải danh mục.' })
  }
}

export const createMenuCategory = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const displayOrder = await MenuCategory.countDocuments({ restaurantId: restaurant._id, deletedAt: null })
    const category = await MenuCategory.create({ restaurantId: restaurant._id, name: req.body.name.trim(), slug: slugify(req.body.name), description: req.body.description?.trim() || null, displayOrder: displayOrder + 1, isVisible: true })
    res.status(201).json({ message: 'Đã thêm danh mục.', category })
  } catch (error: any) {
    res.status(400).json({ message: error.code === 11000 ? 'Tên danh mục đã tồn tại.' : error.message })
  }
}

export const updateMenuCategory = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const category = await MenuCategory.findOne({ _id: req.params.categoryId, restaurantId: restaurant._id, deletedAt: null })
    if (!category) { res.status(404).json({ message: 'Không tìm thấy danh mục.' }); return }
    if (req.body.name) { category.name = req.body.name.trim(); category.slug = slugify(req.body.name) }
    if (req.body.description !== undefined) category.description = req.body.description?.trim() || null
    if (req.body.isVisible !== undefined) category.isVisible = req.body.isVisible
    await category.save()
    res.json({ message: 'Đã cập nhật danh mục.', category })
  } catch (error: any) {
    res.status(400).json({ message: error.code === 11000 ? 'Tên danh mục đã tồn tại.' : error.message })
  }
}

export const deleteMenuCategory = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const category = await MenuCategory.findOne({ _id: req.params.categoryId, restaurantId: restaurant._id, deletedAt: null })
    if (!category) { res.status(404).json({ message: 'Không tìm thấy danh mục.' }); return }
    if (await MenuItem.exists({ menuCategoryId: category._id, deletedAt: null })) {
      res.status(409).json({ message: 'Hãy chuyển hoặc xóa các món trước khi xóa danh mục.' })
      return
    }
    category.deletedAt = new Date()
    category.isVisible = false
    await category.save()
    res.json({ message: 'Đã xóa danh mục.' })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể xóa danh mục.' })
  }
}

export const reorderMenuCategories = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const ids: string[] = req.body.ids
    await MenuCategory.bulkWrite(ids.map((id, index) => ({ updateOne: { filter: { _id: id, restaurantId: restaurant._id }, update: { $set: { displayOrder: index + 1 } } } })))
    res.json({ message: 'Đã sắp xếp danh mục.' })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể sắp xếp danh mục.' })
  }
}

export const getMenuItems = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const { page, limit, skip } = paginationFrom(req.query)
    const filter: Record<string, any> = { restaurantId: restaurant._id, deletedAt: null }
    if (typeof req.query.categoryId === 'string' && req.query.categoryId) filter.menuCategoryId = req.query.categoryId
    if (req.query.availability === 'available') filter.isAvailable = true
    if (req.query.availability === 'unavailable') filter.isAvailable = false
    if (req.query.visibility === 'visible') filter.isVisible = true
    if (req.query.visibility === 'hidden') filter.isVisible = false
    if (typeof req.query.search === 'string' && req.query.search.trim()) filter.name = new RegExp(escapeRegex(req.query.search.trim()), 'i')
    const [data, totalItems] = await Promise.all([
      MenuItem.find(filter).populate('menuCategoryId', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MenuItem.countDocuments(filter),
    ])
    res.json({ data, meta: paginationMeta(page, limit, totalItems) })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải thực đơn.' })
  }
}

export const getMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const item = await MenuItem.findOne({ _id: req.params.itemId, restaurantId: restaurant._id, deletedAt: null }).populate('menuCategoryId', 'name slug')
    if (!item) { res.status(404).json({ message: 'Không tìm thấy món.' }); return }
    res.json({ item })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải món.' })
  }
}

const menuItemPayload = (body: Record<string, any>) => ({
  menuCategoryId: body.menuCategoryId,
  name: body.name.trim(),
  shortDescription: body.shortDescription?.trim() || null,
  description: body.description?.trim() || '',
  ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
  imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
  basePrice: Number(body.basePrice),
  salePrice: body.salePrice === null || body.salePrice === '' ? null : Number(body.salePrice),
  isAvailable: body.isAvailable !== false,
  isVisible: body.isVisible !== false,
  optionGroups: Array.isArray(body.optionGroups) ? body.optionGroups : [],
})

export const createMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const payload = menuItemPayload(req.body)
    if (!await MenuCategory.exists({ _id: payload.menuCategoryId, restaurantId: restaurant._id, deletedAt: null })) {
      res.status(400).json({ message: 'Danh mục không thuộc nhà hàng.' })
      return
    }
    const item = await MenuItem.create({ ...payload, restaurantId: restaurant._id, slug: slugify(payload.name), soldCount: 0 })
    res.status(201).json({ message: 'Đã thêm món.', item })
  } catch (error: any) {
    res.status(400).json({ message: error.code === 11000 ? 'Tên/slug món đã tồn tại.' : error.message })
  }
}

export const updateMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const item = await MenuItem.findOne({ _id: req.params.itemId, restaurantId: restaurant._id, deletedAt: null })
    if (!item) { res.status(404).json({ message: 'Không tìm thấy món.' }); return }
    const payload = menuItemPayload(req.body)
    if (!await MenuCategory.exists({ _id: payload.menuCategoryId, restaurantId: restaurant._id, deletedAt: null })) {
      res.status(400).json({ message: 'Danh mục không thuộc nhà hàng.' })
      return
    }
    Object.assign(item, payload, { slug: slugify(payload.name) })
    await item.save()
    res.json({ message: 'Đã cập nhật món.', item })
  } catch (error: any) {
    res.status(400).json({ message: error.code === 11000 ? 'Tên/slug món đã tồn tại.' : error.message })
  }
}

export const deleteMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const item = await MenuItem.findOne({ _id: req.params.itemId, restaurantId: restaurant._id, deletedAt: null })
    if (!item) { res.status(404).json({ message: 'Không tìm thấy món.' }); return }
    item.deletedAt = new Date(); item.isVisible = false; item.isAvailable = false
    await item.save()
    res.json({ message: 'Đã xóa món.' })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể xóa món.' })
  }
}

export const updateMenuItemAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const item = await MenuItem.findOneAndUpdate({ _id: req.params.itemId, restaurantId: restaurant._id, deletedAt: null }, { $set: { isAvailable: req.body.isAvailable } }, { new: true })
    if (!item) { res.status(404).json({ message: 'Không tìm thấy món.' }); return }
    res.json({ message: 'Đã cập nhật tình trạng món.', item })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể cập nhật món.' })
  }
}

export const getOwnerReviews = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const { page, limit, skip } = paginationFrom(req.query)
    const filter: Record<string, any> = { restaurantId: restaurant._id, deletedAt: null }
    if (req.query.rating) filter.rating = Number(req.query.rating)
    if (req.query.reply === 'answered') filter.ownerReply = { $ne: null }
    if (req.query.reply === 'unanswered') filter.ownerReply = null
    if (req.query.from) filter.createdAt = { $gte: new Date(`${req.query.from}T00:00:00.000Z`) }
    const [data, totalItems] = await Promise.all([
      Review.find(filter).populate('customerId', 'fullName avatarUrl').populate('orderId', 'orderNumber').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments(filter),
    ])
    res.json({ data, meta: paginationMeta(page, limit, totalItems) })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể tải đánh giá.' })
  }
}

export const upsertReviewReply = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const review = await Review.findOne({ _id: req.params.reviewId, restaurantId: restaurant._id, deletedAt: null })
    if (!review) { res.status(404).json({ message: 'Không tìm thấy đánh giá.' }); return }
    review.ownerReply = { content: req.body.content.trim(), createdAt: new Date() }
    await review.save()
    res.json({ message: 'Đã lưu phản hồi.', review })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể lưu phản hồi.' })
  }
}

export const deleteReviewReply = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await findOwnedRestaurant(req, res)
    if (!restaurant) return
    const review = await Review.findOne({ _id: req.params.reviewId, restaurantId: restaurant._id, deletedAt: null })
    if (!review) { res.status(404).json({ message: 'Không tìm thấy đánh giá.' }); return }
    review.ownerReply = null
    await review.save()
    res.json({ message: 'Đã xóa phản hồi.' })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể xóa phản hồi.' })
  }
}
