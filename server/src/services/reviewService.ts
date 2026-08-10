import createError from 'http-errors'
import { Types } from 'mongoose'

import { Order } from '../models/Order.js'
import { Restaurant } from '../models/Restaurant.js'
import { IReview, Review, ReviewVisibility } from '../models/Review.js'

export interface CustomerReview {
  _id: string
  orderId: string
  restaurantId: string
  rating: number
  content: string
  visibilityStatus: ReviewVisibility
  ownerReply: {
    content: string
    createdAt: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface ReviewPayload {
  rating: number
  content: string
}

const toCustomerReview = (review: IReview): CustomerReview => ({
  _id: review._id.toString(),
  orderId: review.orderId.toString(),
  restaurantId: review.restaurantId.toString(),
  rating: review.rating,
  content: review.content,
  visibilityStatus: review.visibilityStatus,
  ownerReply: review.ownerReply?.content
    ? {
      content: review.ownerReply.content,
      createdAt: review.ownerReply.createdAt.toISOString(),
    }
    : null,
  createdAt: review.createdAt.toISOString(),
  updatedAt: review.updatedAt.toISOString(),
})

const requireOwnedDeliveredOrder = async (customerId: string, orderId: string) => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw createError(400, 'ID đơn hàng không hợp lệ.')
  }

  const order = await Order.findOne({
    _id: orderId,
    customerId: new Types.ObjectId(customerId),
  }).select('_id customerId restaurantId orderStatus')

  if (!order) {
    throw createError(404, 'Không tìm thấy đơn hàng hoặc bạn không có quyền đánh giá.')
  }

  if (order.orderStatus !== 'delivered') {
    throw createError(409, 'Bạn chỉ có thể đánh giá sau khi đơn hàng đã được giao.')
  }

  return order
}

export const recalculateRestaurantRatingSummary = async (
  restaurantId: string | Types.ObjectId,
) => {
  const restaurantObjectId =
    typeof restaurantId === 'string' ? new Types.ObjectId(restaurantId) : restaurantId
  const buckets = await Review.aggregate<{ _id: number; count: number }>([
    {
      $match: {
        restaurantId: restaurantObjectId,
        visibilityStatus: 'visible',
        deletedAt: null,
      },
    },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ])

  const distribution: Record<'1' | '2' | '3' | '4' | '5', number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  }
  let count = 0
  let totalRating = 0

  for (const bucket of buckets) {
    if (bucket._id >= 1 && bucket._id <= 5) {
      distribution[String(bucket._id) as keyof typeof distribution] = bucket.count
      count += bucket.count
      totalRating += bucket._id * bucket.count
    }
  }

  await Restaurant.updateOne(
    { _id: restaurantObjectId },
    {
      $set: {
        ratingSummary: {
          average: count === 0 ? 0 : Math.round((totalRating / count) * 10) / 10,
          count,
          distribution,
        },
      },
    },
  )
}

export const getReviewsForCustomerOrders = async (
  customerId: string,
  orderIds: string[],
): Promise<Map<string, CustomerReview>> => {
  if (orderIds.length === 0) return new Map()

  const reviews = await Review.find({
    customerId: new Types.ObjectId(customerId),
    orderId: { $in: orderIds.map((orderId) => new Types.ObjectId(orderId)) },
    deletedAt: null,
  })

  return new Map(reviews.map((review) => [review.orderId.toString(), toCustomerReview(review)]))
}

export const getCustomerOrderReview = async (
  customerId: string,
  orderId: string,
): Promise<CustomerReview | null> => {
  await requireOwnedDeliveredOrder(customerId, orderId)
  const review = await Review.findOne({
    orderId: new Types.ObjectId(orderId),
    customerId: new Types.ObjectId(customerId),
    deletedAt: null,
  })
  return review ? toCustomerReview(review) : null
}

export const createCustomerOrderReview = async (
  customerId: string,
  orderId: string,
  payload: ReviewPayload,
): Promise<CustomerReview> => {
  const order = await requireOwnedDeliveredOrder(customerId, orderId)
  const existingReview = await Review.exists({ orderId: order._id, deletedAt: null })
  if (existingReview) {
    throw createError(409, 'Đơn hàng này đã được đánh giá.')
  }

  let review: IReview
  try {
    review = await Review.create({
      orderId: order._id,
      customerId: new Types.ObjectId(customerId),
      restaurantId: order.restaurantId,
      rating: payload.rating,
      content: payload.content.trim(),
      imageUrls: [],
      visibilityStatus: 'visible',
      deletedAt: null,
    })
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw createError(409, 'Đơn hàng này đã được đánh giá.')
    }
    throw error
  }

  await recalculateRestaurantRatingSummary(order.restaurantId)
  return toCustomerReview(review)
}

export const updateCustomerOrderReview = async (
  customerId: string,
  orderId: string,
  payload: ReviewPayload,
): Promise<CustomerReview> => {
  const order = await requireOwnedDeliveredOrder(customerId, orderId)
  const review = await Review.findOne({
    orderId: order._id,
    customerId: new Types.ObjectId(customerId),
    deletedAt: null,
  })

  if (!review) {
    throw createError(404, 'Không tìm thấy đánh giá.')
  }

  review.rating = payload.rating
  review.content = payload.content.trim()
  await review.save()
  await recalculateRestaurantRatingSummary(order.restaurantId)
  return toCustomerReview(review)
}

export const deleteCustomerOrderReview = async (
  customerId: string,
  orderId: string,
) => {
  const order = await requireOwnedDeliveredOrder(customerId, orderId)
  const review = await Review.findOne({
    orderId: order._id,
    customerId: new Types.ObjectId(customerId),
    deletedAt: null,
  })

  if (!review) {
    throw createError(404, 'Không tìm thấy đánh giá.')
  }

  review.deletedAt = new Date()
  await review.save()
  await recalculateRestaurantRatingSummary(order.restaurantId)
}
