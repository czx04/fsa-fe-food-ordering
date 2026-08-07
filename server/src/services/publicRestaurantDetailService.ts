import mongoose, { type QueryFilter } from 'mongoose'

import { MenuCategory } from '../models/MenuCategory.js'
import { MenuItem } from '../models/MenuItem.js'
import { Restaurant, type IOpeningHours, type IRestaurant } from '../models/Restaurant.js'
import { Review } from '../models/Review.js'
import { isRestaurantOpenNow } from './publicRestaurantService.js'

interface CuisineCategoryRecord {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
}

interface RestaurantDetailRecord {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description: string
  logoUrl?: string | null
  coverUrl?: string | null
  galleryUrls: string[]
  phone: string
  address: {
    line1: string
    ward: string
    district: string
    city: string
    location?: { type: 'Point'; coordinates: [number, number] }
  }
  cuisineCategoryIds: CuisineCategoryRecord[]
  openingHours: IOpeningHours[]
  operationStatus: 'open' | 'temporarily_closed' | 'suspended'
  delivery: {
    fee: number
    minMinutes: number
    maxMinutes: number
    maxDistanceKm?: number | null
  }
  priceRange: 'budget' | 'mid' | 'premium'
  ratingSummary: {
    average: number
    count: number
    distribution: Record<'1' | '2' | '3' | '4' | '5', number>
  }
}

interface MenuCategoryRecord {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string | null
  displayOrder: number
}

interface MenuItemRecord {
  _id: mongoose.Types.ObjectId
  name: string
  slug?: string
  shortDescription?: string
  description?: string
  ingredients?: string[]
  imageUrls?: string[]
  basePrice?: number
  salePrice?: number | null
  price?: number
  imageUrl?: string
  isAvailable: boolean
  soldCount: number
  menuCategoryId: mongoose.Types.ObjectId
  optionGroups?: Array<{
    _id: mongoose.Types.ObjectId
    name: string
    minSelect: number
    maxSelect: number
    required: boolean
    options: Array<{
      _id: mongoose.Types.ObjectId
      name: string
      priceDelta: number
      isAvailable: boolean
    }>
  }>
}

interface ReviewRecord {
  _id: mongoose.Types.ObjectId
  rating: number
  content: string
  imageUrls: string[]
  customerId: {
    _id: mongoose.Types.ObjectId
    fullName: string
    avatarUrl?: string | null
  }
  ownerReply?: {
    content: string
    createdAt: Date
  } | null
  createdAt: Date
  updatedAt: Date
}

interface PageQuery {
  page: number
  limit: number
}

interface MenuItemQuery extends PageQuery {
  category?: string
  q?: string
  availability: 'all' | 'available'
}

interface ReviewQuery extends PageQuery {
  rating?: number
  sort: 'newest' | 'oldest'
}

export class PublicResourceNotFoundError extends Error {}

export class PublicDetailQueryError extends Error {
  public constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(message)
  }
}

const publicRestaurantFilter = (slug: string): QueryFilter<IRestaurant> => ({
  slug,
  approvalStatus: 'approved',
  operationStatus: { $ne: 'suspended' },
  deletedAt: null,
})

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

const singleQueryValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return undefined
}

const parseInteger = (
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
  field: string,
  errors: Array<{ field: string; message: string }>
) => {
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value < min || value > max) {
    errors.push({ field: `query.${field}`, message: `${field} phải là số nguyên từ ${min} đến ${max}` })
    return fallback
  }
  return value
}

export const parseMenuItemQuery = (query: Record<string, unknown>): MenuItemQuery => {
  const errors: Array<{ field: string; message: string }> = []
  const q = singleQueryValue(query.q)?.trim()
  const category = singleQueryValue(query.category)?.trim()
  const availability = singleQueryValue(query.availability) ?? 'all'

  if (q && q.length > 100) {
    errors.push({ field: 'query.q', message: 'q không được dài quá 100 ký tự' })
  }
  if (!['all', 'available'].includes(availability)) {
    errors.push({ field: 'query.availability', message: 'availability không hợp lệ' })
  }

  const page = parseInteger(singleQueryValue(query.page), 1, 1, 10_000, 'page', errors)
  const limit = parseInteger(singleQueryValue(query.limit), 20, 1, 50, 'limit', errors)

  if (errors.length > 0) throw new PublicDetailQueryError('Query không hợp lệ', errors)
  return {
    category: category || undefined,
    q: q || undefined,
    availability: availability as MenuItemQuery['availability'],
    page,
    limit,
  }
}

export const parseReviewQuery = (query: Record<string, unknown>): ReviewQuery => {
  const errors: Array<{ field: string; message: string }> = []
  const ratingRaw = singleQueryValue(query.rating)
  const sort = singleQueryValue(query.sort) ?? 'newest'
  let rating: number | undefined

  if (ratingRaw !== undefined) {
    const parsedRating = Number(ratingRaw)
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      errors.push({ field: 'query.rating', message: 'rating phải là số nguyên từ 1 đến 5' })
    } else {
      rating = parsedRating
    }
  }
  if (!['newest', 'oldest'].includes(sort)) {
    errors.push({ field: 'query.sort', message: 'sort không hợp lệ' })
  }

  const page = parseInteger(singleQueryValue(query.page), 1, 1, 10_000, 'page', errors)
  const limit = parseInteger(singleQueryValue(query.limit), 10, 1, 50, 'limit', errors)
  if (errors.length > 0) throw new PublicDetailQueryError('Query không hợp lệ', errors)

  return { rating, sort: sort as ReviewQuery['sort'], page, limit }
}

const findPublicRestaurant = async (slug: string) => {
  const restaurant = (await Restaurant.findOne(publicRestaurantFilter(slug))
    .populate('cuisineCategoryIds', 'name slug')
    .lean()) as unknown as RestaurantDetailRecord | null

  if (!restaurant) throw new PublicResourceNotFoundError('Không tìm thấy nhà hàng')
  return restaurant
}

export const getPublicRestaurantDetail = async (slug: string) => {
  const restaurant = await findPublicRestaurant(slug)
  const formattedAddress = [
    restaurant.address.line1,
    restaurant.address.ward,
    restaurant.address.district,
    restaurant.address.city,
  ]
    .filter(Boolean)
    .join(', ')

  return {
    data: {
      _id: restaurant._id.toString(),
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      logoUrl: restaurant.logoUrl ?? null,
      coverUrl: restaurant.coverUrl ?? null,
      galleryUrls: restaurant.galleryUrls ?? [],
      phone: restaurant.phone,
      address: { ...restaurant.address, formatted: formattedAddress },
      cuisineCategories: restaurant.cuisineCategoryIds.map((category) => ({
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      })),
      openingHours: restaurant.openingHours,
      operationStatus: restaurant.operationStatus,
      isOpenNow: isRestaurantOpenNow(restaurant),
      delivery: restaurant.delivery,
      priceRange: restaurant.priceRange,
      ratingSummary: restaurant.ratingSummary,
    },
  }
}

export const listPublicMenuCategories = async (slug: string) => {
  const restaurant = await findPublicRestaurant(slug)
  const categories = (await MenuCategory.find({
    restaurantId: restaurant._id,
    isVisible: true,
    deletedAt: null,
  })
    .sort({ displayOrder: 1, name: 1 })
    .lean()) as unknown as MenuCategoryRecord[]

  const itemCounts = await MenuItem.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { restaurantId: restaurant._id, isAvailable: { $in: [true, false] } } },
    { $group: { _id: '$menuCategoryId', count: { $sum: 1 } } },
  ])
  const counts = new Map(itemCounts.map((entry) => [entry._id.toString(), entry.count]))

  return {
    data: categories.map((category) => ({
      _id: category._id.toString(),
      name: category.name,
      slug: slugify(category.name),
      description: category.description ?? null,
      displayOrder: category.displayOrder,
      itemCount: counts.get(category._id.toString()) ?? 0,
    })),
  }
}

export const listPublicMenuItems = async (slug: string, query: MenuItemQuery) => {
  const restaurant = await findPublicRestaurant(slug)
  const categories = (await MenuCategory.find({
    restaurantId: restaurant._id,
    isVisible: true,
    deletedAt: null,
  })
    .sort({ displayOrder: 1, name: 1 })
    .lean()) as unknown as MenuCategoryRecord[]

  let selectedCategory: MenuCategoryRecord | undefined
  if (query.category) {
    selectedCategory = categories.find((category) => slugify(category.name) === query.category)
    if (!selectedCategory) throw new PublicResourceNotFoundError('Không tìm thấy danh mục thực đơn')
  }

  const filter: Record<string, unknown> = {
    restaurantId: restaurant._id,
    menuCategoryId: { $in: categories.map((category) => category._id) },
    isVisible: { $ne: false },
    deletedAt: null,
  }
  if (selectedCategory) filter.menuCategoryId = selectedCategory._id
  if (query.availability === 'available') filter.isAvailable = true
  if (query.q) filter.name = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

  const total = await MenuItem.countDocuments(filter)
  const items = (await MenuItem.find(filter)
    .sort({ soldCount: -1, name: 1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .lean()) as unknown as MenuItemRecord[]
  const categoryMap = new Map(categories.map((category) => [category._id.toString(), category]))

  return {
    data: items.map((item) => {
      const category = categoryMap.get(item.menuCategoryId.toString())
      const basePrice = item.basePrice ?? item.price ?? 0
      const effectivePrice = item.salePrice ?? basePrice
      return {
        _id: item._id.toString(),
        name: item.name,
        slug: item.slug ?? slugify(item.name),
        shortDescription: item.shortDescription ?? item.description ?? '',
        imageUrl: item.imageUrls?.[0] ?? item.imageUrl ?? null,
        basePrice,
        salePrice: item.salePrice ?? null,
        effectivePrice,
        isAvailable: item.isAvailable,
        soldCount: item.soldCount,
        menuCategory: category
          ? { _id: category._id.toString(), name: category.name, slug: slugify(category.name) }
          : null,
      }
    }),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}

export const getPublicMenuItemDetail = async (restaurantSlug: string, itemSlug: string) => {
  const restaurant = await findPublicRestaurant(restaurantSlug)
  const categories = (await MenuCategory.find({
    restaurantId: restaurant._id,
    isVisible: true,
    deletedAt: null,
  })
    .sort({ displayOrder: 1, name: 1 })
    .lean()) as unknown as MenuCategoryRecord[]
  const categoryMap = new Map(categories.map((category) => [category._id.toString(), category]))

  const items = (await MenuItem.find({
    restaurantId: restaurant._id,
    menuCategoryId: { $in: categories.map((category) => category._id) },
    isVisible: { $ne: false },
    deletedAt: null,
  }).lean()) as unknown as MenuItemRecord[]
  const item = items.find((entry) => (entry.slug ?? slugify(entry.name)) === itemSlug)
  if (!item) throw new PublicResourceNotFoundError('Không tìm thấy món ăn')

  const category = categoryMap.get(item.menuCategoryId.toString())
  if (!category) throw new PublicResourceNotFoundError('Không tìm thấy danh mục thực đơn')
  const basePrice = item.basePrice ?? item.price ?? 0
  const effectivePrice = item.salePrice ?? basePrice
  const relatedItems = items
    .filter((entry) => entry._id.toString() !== item._id.toString())
    .sort((left, right) => {
      const leftSameCategory = left.menuCategoryId.toString() === item.menuCategoryId.toString()
      const rightSameCategory = right.menuCategoryId.toString() === item.menuCategoryId.toString()
      if (leftSameCategory !== rightSameCategory) return leftSameCategory ? -1 : 1
      return right.soldCount - left.soldCount
    })
    .slice(0, 4)
    .map((entry) => {
      const relatedBasePrice = entry.basePrice ?? entry.price ?? 0
      return {
        _id: entry._id.toString(),
        name: entry.name,
        slug: entry.slug ?? slugify(entry.name),
        imageUrl: entry.imageUrls?.[0] ?? entry.imageUrl ?? null,
        basePrice: relatedBasePrice,
        salePrice: entry.salePrice ?? null,
        effectivePrice: entry.salePrice ?? relatedBasePrice,
        isAvailable: entry.isAvailable,
      }
    })

  return {
    data: {
      _id: item._id.toString(),
      name: item.name,
      slug: item.slug ?? slugify(item.name),
      shortDescription: item.shortDescription ?? item.description ?? '',
      description: item.description ?? item.shortDescription ?? '',
      ingredients: item.ingredients ?? [],
      imageUrls:
        item.imageUrls && item.imageUrls.length > 0
          ? item.imageUrls
          : [item.imageUrl].filter((value): value is string => Boolean(value)),
      basePrice,
      salePrice: item.salePrice ?? null,
      effectivePrice,
      isAvailable: item.isAvailable,
      soldCount: item.soldCount,
      restaurant: {
        _id: restaurant._id.toString(),
        name: restaurant.name,
        slug: restaurant.slug,
      },
      menuCategory: {
        _id: category._id.toString(),
        name: category.name,
        slug: slugify(category.name),
      },
      optionGroups: (item.optionGroups ?? [])
        .map((group) => ({
          _id: group._id.toString(),
          name: group.name,
          minSelect: group.minSelect,
          maxSelect: group.maxSelect,
          required: group.required,
          options: group.options
            .filter((option) => option.isAvailable)
            .map((option) => ({
              _id: option._id.toString(),
              name: option.name,
              priceDelta: option.priceDelta,
            })),
        }))
        .filter((group) => group.options.length > 0),
      relatedItems,
    },
  }
}

export const listPublicReviews = async (slug: string, query: ReviewQuery) => {
  const restaurant = await findPublicRestaurant(slug)
  const filter: Record<string, unknown> = {
    restaurantId: restaurant._id,
    visibilityStatus: 'visible',
    deletedAt: null,
  }
  if (query.rating) filter.rating = query.rating

  const total = await Review.countDocuments(filter)
  const reviews = (await Review.find(filter)
    .populate('customerId', 'fullName avatarUrl')
    .sort({ createdAt: query.sort === 'oldest' ? 1 : -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .lean()) as unknown as ReviewRecord[]

  return {
    data: reviews.map((review) => ({
      _id: review._id.toString(),
      rating: review.rating,
      content: review.content,
      imageUrls: review.imageUrls,
      customer: {
        _id: review.customerId._id.toString(),
        fullName: review.customerId.fullName,
        avatarUrl: review.customerId.avatarUrl ?? null,
      },
      ownerReply: review.ownerReply?.content
        ? { content: review.ownerReply.content, repliedAt: review.ownerReply.createdAt }
        : null,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
    summary: restaurant.ratingSummary,
  }
}
