import createError from 'http-errors'
import { randomUUID } from 'node:crypto'
import { Types } from 'mongoose'

import { MenuItem } from '../models/MenuItem.js'
import { Order } from '../models/Order.js'
import { RecommendationEvent, type RecommendationEventType } from '../models/RecommendationEvent.js'
import { Restaurant } from '../models/Restaurant.js'
import { Review } from '../models/Review.js'
import {
  calculatePriceFit,
  normalizeAndApplyAffinityMultipliers,
  normalizeAffinityMap,
  recencyWeight,
  reviewAffinityMultiplier,
  scoreRecommendation,
  selectDiverseRecommendations,
} from './recommendationScoring.js'

const ALGORITHM_VERSION = 'history-hybrid-v1'
const HISTORY_DAYS = 180
const TRENDING_DAYS = 30
const TRENDING_CACHE_MS = 5 * 60 * 1_000
const MAX_HISTORY_ORDERS = 50
const MAX_CANDIDATES = 100

interface HistoryOrderRecord {
  _id: Types.ObjectId
  restaurantId: Types.ObjectId
  placedAt: Date
  items: Array<{
    menuItemId: Types.ObjectId
    quantity: number
    finalUnitPrice: number
  }>
}

interface RestaurantRecord {
  _id: Types.ObjectId
  name: string
  slug: string
  cuisineCategoryIds: Types.ObjectId[]
  ratingSummary: { average: number; count: number }
  delivery: { fee: number; minMinutes: number; maxMinutes: number }
}

interface MenuItemRecord {
  _id: Types.ObjectId
  restaurantId: Types.ObjectId
  name: string
  slug?: string
  shortDescription?: string | null
  description?: string
  imageUrls?: string[]
  imageUrl?: string
  basePrice?: number
  salePrice?: number | null
  price?: number
  isAvailable: boolean
}

interface TrendingCache {
  expiresAt: number
  counts: Map<string, number>
}

let trendingCache: TrendingCache | null = null

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const effectivePrice = (item: MenuItemRecord) => item.salePrice ?? item.basePrice ?? item.price ?? 0

const addToMap = (map: Map<string, number>, key: string, value: number) => {
  map.set(key, (map.get(key) ?? 0) + value)
}

const median = (values: number[]) => {
  if (values.length === 0) return null
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!
}

export const getTrendingItemCounts = async () => {
  if (trendingCache && trendingCache.expiresAt > Date.now()) return new Map(trendingCache.counts)
  const from = new Date(Date.now() - TRENDING_DAYS * 24 * 60 * 60 * 1_000)
  const rows = await Order.aggregate<{ _id: Types.ObjectId; quantity: number }>([
    { $match: { orderStatus: 'delivered', placedAt: { $gte: from } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.menuItemId', quantity: { $sum: '$items.quantity' } } },
    { $sort: { quantity: -1, _id: 1 } },
    { $limit: MAX_CANDIDATES },
  ])
  const counts = new Map(rows.map((row) => [row._id.toString(), row.quantity]))
  trendingCache = { expiresAt: Date.now() + TRENDING_CACHE_MS, counts }
  return new Map(counts)
}

export const clearTrendingRecommendationCache = () => {
  trendingCache = null
}

const eligibleRestaurantRecords = async () => Restaurant.find({
  approvalStatus: 'approved',
  operationStatus: 'open',
  deletedAt: null,
})
  .select('name slug cuisineCategoryIds ratingSummary delivery')
  .lean() as unknown as Promise<RestaurantRecord[]>

const fetchCandidateItems = async (
  historyItemIds: string[],
  preferredRestaurantIds: string[],
  cuisineRestaurantIds: string[],
  trendingIds: string[],
  eligibleRestaurantIds: Types.ObjectId[],
) => {
  const baseFilter = {
    restaurantId: { $in: eligibleRestaurantIds },
    isAvailable: true,
    isVisible: true,
    deletedAt: null,
  }
  const [exactItems, preferenceItems, trendingItems] = await Promise.all([
    historyItemIds.length > 0
      ? MenuItem.find({ ...baseFilter, _id: { $in: historyItemIds } }).lean()
      : [],
    preferredRestaurantIds.length + cuisineRestaurantIds.length > 0
      ? MenuItem.find({ ...baseFilter, restaurantId: { $in: [...preferredRestaurantIds, ...cuisineRestaurantIds] } })
        .sort({ createdAt: -1, name: 1 })
        .limit(MAX_CANDIDATES)
        .lean()
      : [],
    trendingIds.length > 0
      ? MenuItem.find({ ...baseFilter, _id: { $in: trendingIds } }).lean()
      : [],
  ])
  const candidates = new Map<string, MenuItemRecord>()
  for (const item of [...exactItems, ...trendingItems, ...preferenceItems] as unknown as MenuItemRecord[]) {
    if (candidates.size >= MAX_CANDIDATES && !candidates.has(item._id.toString())) continue
    candidates.set(item._id.toString(), item)
  }
  if (candidates.size < 12) {
    const fallback = await MenuItem.find(baseFilter).sort({ createdAt: -1, name: 1 }).limit(40).lean()
    for (const item of fallback as unknown as MenuItemRecord[]) {
      if (candidates.size >= MAX_CANDIDATES) break
      candidates.set(item._id.toString(), item)
    }
  }
  return [...candidates.values()]
}

export const getMenuItemRecommendations = async (customerId: string, limit: number) => {
  if (!Types.ObjectId.isValid(customerId)) throw createError(400, 'ID khách hàng không hợp lệ.')
  const from = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1_000)
  const history = await Order.find({
    customerId: new Types.ObjectId(customerId),
    orderStatus: 'delivered',
    placedAt: { $gte: from },
  })
    .select('_id restaurantId placedAt items.menuItemId items.quantity items.finalUnitPrice')
    .sort({ placedAt: -1 })
    .limit(MAX_HISTORY_ORDERS)
    .lean() as unknown as HistoryOrderRecord[]

  const [eligibleRestaurants, trendingCounts] = await Promise.all([
    eligibleRestaurantRecords(),
    getTrendingItemCounts(),
  ])
  const eligibleRestaurantMap = new Map(eligibleRestaurants.map((restaurant) => [restaurant._id.toString(), restaurant]))
  const eligibleRestaurantIds = eligibleRestaurants.map((restaurant) => restaurant._id)
  const itemAffinityRaw = new Map<string, number>()
  const restaurantAffinityRaw = new Map<string, number>()
  const restaurantReviewMultipliers = new Map<string, number>()
  const historyPrices: number[] = []

  for (const order of history) {
    const orderWeight = recencyWeight(new Date(order.placedAt))
    for (const item of order.items) {
      const weight = Math.min(item.quantity, 3) * orderWeight
      addToMap(itemAffinityRaw, item.menuItemId.toString(), weight)
      addToMap(restaurantAffinityRaw, order.restaurantId.toString(), weight)
      if (item.finalUnitPrice > 0) historyPrices.push(item.finalUnitPrice)
    }
  }

  const historyRestaurantIds = [...restaurantAffinityRaw.keys()]
  const historicalRestaurants = historyRestaurantIds.length > 0
    ? await Restaurant.find({ _id: { $in: historyRestaurantIds } })
      .select('cuisineCategoryIds')
      .lean() as unknown as Array<{ _id: Types.ObjectId; cuisineCategoryIds: Types.ObjectId[] }>
    : []
  const historicalRestaurantMap = new Map(historicalRestaurants.map((restaurant) => [restaurant._id.toString(), restaurant]))
  const cuisineAffinityRaw = new Map<string, number>()
  for (const [restaurantId, affinity] of restaurantAffinityRaw) {
    for (const cuisineId of historicalRestaurantMap.get(restaurantId)?.cuisineCategoryIds ?? []) {
      addToMap(cuisineAffinityRaw, cuisineId.toString(), affinity)
    }
  }

  if (history.length > 0) {
    const reviews = await Review.find({
      customerId: new Types.ObjectId(customerId),
      orderId: { $in: history.map((order) => order._id) },
      deletedAt: null,
    }).select('restaurantId rating').lean()
    const ratingsByRestaurant = new Map<string, number[]>()
    for (const review of reviews) {
      const restaurantId = review.restaurantId.toString()
      const ratings = ratingsByRestaurant.get(restaurantId) ?? []
      ratings.push(review.rating)
      ratingsByRestaurant.set(restaurantId, ratings)
    }
    for (const [restaurantId, ratings] of ratingsByRestaurant) {
      const average = ratings.reduce((total, rating) => total + rating, 0) / ratings.length
      restaurantReviewMultipliers.set(restaurantId, reviewAffinityMultiplier(average))
    }
  }

  const itemAffinity = normalizeAffinityMap(itemAffinityRaw)
  const restaurantAffinity = normalizeAndApplyAffinityMultipliers(
    restaurantAffinityRaw,
    restaurantReviewMultipliers,
  )
  const cuisineAffinity = normalizeAffinityMap(cuisineAffinityRaw)
  const trendAffinity = normalizeAffinityMap(trendingCounts)
  const preferredRestaurantIds = [...restaurantAffinity.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([id]) => id)
  const preferredCuisineIds = new Set(
    [...cuisineAffinity.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 2)
      .map(([id]) => id),
  )
  const cuisineRestaurantIds = eligibleRestaurants
    .filter((restaurant) => restaurant.cuisineCategoryIds.some((id) => preferredCuisineIds.has(id.toString())))
    .map((restaurant) => restaurant._id.toString())
  const trendingIds = [...trendingCounts.keys()]
  const candidates = await fetchCandidateItems(
    [...itemAffinityRaw.keys()],
    preferredRestaurantIds,
    cuisineRestaurantIds,
    trendingIds,
    eligibleRestaurantIds,
  )
  const medianPrice = median(historyPrices)

  const scored = candidates.flatMap((item) => {
    const restaurant = eligibleRestaurantMap.get(item.restaurantId.toString())
    if (!restaurant) return []
    const cuisineScore = Math.max(
      0,
      ...restaurant.cuisineCategoryIds.map((cuisineId) => cuisineAffinity.get(cuisineId.toString()) ?? 0),
    )
    const score = scoreRecommendation(item._id.toString(), restaurant._id.toString(), {
      itemAffinity: itemAffinity.get(item._id.toString()) ?? 0,
      restaurantAffinity: restaurantAffinity.get(restaurant._id.toString()) ?? 0,
      cuisineAffinity: cuisineScore,
      priceFit: calculatePriceFit(effectivePrice(item), medianPrice),
      trendAffinity: trendAffinity.get(item._id.toString()) ?? 0,
      rating: Math.min(1, Math.max(0, restaurant.ratingSummary.average / 5)),
    })
    return [{ item, restaurant, ...score }]
  })
  const selected = selectDiverseRecommendations(scored, limit)
  const personalized = history.length > 0

  return {
    data: selected.map(({ item, restaurant, reasonCode, reasonLabel }) => {
      const basePrice = item.basePrice ?? item.price ?? 0
      return {
        _id: item._id.toString(),
        name: item.name,
        slug: item.slug ?? slugify(item.name),
        description: item.shortDescription ?? item.description ?? '',
        imageUrl: item.imageUrls?.[0] ?? item.imageUrl ?? null,
        basePrice,
        salePrice: item.salePrice ?? null,
        effectivePrice: effectivePrice(item),
        isAvailable: item.isAvailable,
        restaurantId: {
          _id: restaurant._id.toString(),
          name: restaurant.name,
          slug: restaurant.slug,
          ratingSummary: restaurant.ratingSummary,
          delivery: restaurant.delivery,
        },
        reasonCode,
        reasonLabel,
      }
    }),
    meta: {
      requestId: randomUUID(),
      algorithmVersion: ALGORITHM_VERSION,
      strategy: personalized ? 'history-hybrid' as const : 'trending' as const,
      personalized,
      generatedAt: new Date().toISOString(),
    },
  }
}

export const getPublicTrendingMenuItems = async (limit: number) => {
  const [eligibleRestaurants, trendingCounts] = await Promise.all([
    eligibleRestaurantRecords(),
    getTrendingItemCounts(),
  ])
  const restaurantMap = new Map(eligibleRestaurants.map((restaurant) => [restaurant._id.toString(), restaurant]))
  const trendAffinity = normalizeAffinityMap(trendingCounts)
  const candidates = await fetchCandidateItems(
    [],
    [],
    [],
    [...trendingCounts.keys()],
    eligibleRestaurants.map((restaurant) => restaurant._id),
  )
  return candidates
    .flatMap((item) => {
      const restaurant = restaurantMap.get(item.restaurantId.toString())
      if (!restaurant) return []
      const scored = scoreRecommendation(item._id.toString(), restaurant._id.toString(), {
        itemAffinity: 0,
        restaurantAffinity: 0,
        cuisineAffinity: 0,
        priceFit: 0.5,
        trendAffinity: trendAffinity.get(item._id.toString()) ?? 0,
        rating: Math.min(1, Math.max(0, restaurant.ratingSummary.average / 5)),
      })
      return [{ item, restaurant, ...scored }]
    })
    .sort((left, right) => right.score - left.score || left.item._id.toString().localeCompare(right.item._id.toString()))
    .slice(0, limit)
    .map(({ item, restaurant }) => {
      const basePrice = item.basePrice ?? item.price ?? 0
      return {
        _id: item._id.toString(),
        name: item.name,
        slug: item.slug ?? slugify(item.name),
        description: item.shortDescription ?? item.description ?? '',
        price: effectivePrice(item),
        basePrice,
        salePrice: item.salePrice ?? null,
        effectivePrice: effectivePrice(item),
        imageUrl: item.imageUrls?.[0] ?? item.imageUrl ?? null,
        isAvailable: item.isAvailable,
        restaurantId: {
          _id: restaurant._id.toString(),
          name: restaurant.name,
          slug: restaurant.slug,
          ratingSummary: restaurant.ratingSummary,
          delivery: restaurant.delivery,
        },
      }
    })
}

export interface TrackRecommendationEventPayload {
  eventId: string
  requestId: string
  algorithmVersion: string
  surface: 'home'
  eventType: RecommendationEventType
  menuItemId: string
  position: number
}

export const trackRecommendationEvent = async (
  customerId: string,
  payload: TrackRecommendationEventPayload,
) => {
  if (!Types.ObjectId.isValid(payload.menuItemId)) throw createError(400, 'ID món ăn không hợp lệ.')
  const item = await MenuItem.findOne({
    _id: payload.menuItemId,
    deletedAt: null,
  }).select('restaurantId').lean()
  if (!item) throw createError(404, 'Không tìm thấy món ăn.')
  await RecommendationEvent.updateOne(
    { eventId: payload.eventId },
    {
      $setOnInsert: {
        ...payload,
        userId: new Types.ObjectId(customerId),
        menuItemId: new Types.ObjectId(payload.menuItemId),
        restaurantId: item.restaurantId,
      },
    },
    { upsert: true },
  )
}
