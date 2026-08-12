import { CuisineCategory } from '../models/CuisineCategory.js'
import { Restaurant, type IOpeningHours } from '../models/Restaurant.js'
import { MenuItem } from '../models/MenuItem.js'

const PRICE_ORDER = { budget: 0, mid: 1, premium: 2 } as const
const SORT_VALUES = [
  'popular_desc',
  'rating_desc',
  'newest',
  'price_asc',
  'price_desc',
  'delivery_asc',
] as const

type RestaurantSort = (typeof SORT_VALUES)[number]

interface RestaurantQuery {
  q?: string
  cuisineSlugs: string[]
  priceRange?: keyof typeof PRICE_ORDER
  minRating?: number
  openNow?: boolean
  freeDelivery?: boolean
  district?: string
  city?: string
  sort: RestaurantSort
  page: number
  limit: number
}

interface CuisineCategoryRecord {
  _id: { toString(): string }
  name: string
  slug: string
}

interface RestaurantRecord {
  _id: { toString(): string }
  name: string
  slug: string
  description: string
  logoUrl?: string | null
  coverUrl?: string | null
  address: {
    line1: string
    ward: string
    district: string
    city: string
    location?: { type: 'Point'; coordinates: [number, number] }
  }
  cuisineCategoryIds: CuisineCategoryRecord[]
  openingHours: IOpeningHours[]
  delivery: { fee: number; minMinutes: number; maxMinutes: number; maxDistanceKm?: number | null }
  priceRange: keyof typeof PRICE_ORDER
  operationStatus: 'open' | 'temporarily_closed' | 'suspended'
  ratingSummary: { average: number; count: number }
  stats: { completedOrderCount: number; totalItemSold: number }
  createdAt: Date
}

export class PublicRestaurantQueryError extends Error {
  public constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(message)
  }
}

const singleQueryValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return undefined
}

const parseBoolean = (
  raw: string | undefined,
  field: string,
  errors: Array<{ field: string; message: string }>
) => {
  if (raw === undefined) return undefined
  if (raw === 'true') return true
  if (raw === 'false') return false
  errors.push({ field, message: `${field} chỉ nhận true hoặc false` })
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
    errors.push({ field, message: `${field} phải là số nguyên từ ${min} đến ${max}` })
    return fallback
  }
  return value
}

export const parseRestaurantQuery = (rawQuery: Record<string, unknown>): RestaurantQuery => {
  const errors: Array<{ field: string; message: string }> = []
  const q = singleQueryValue(rawQuery.q)?.trim()
  const cuisine = singleQueryValue(rawQuery.cuisine)?.trim()
  const priceRange = singleQueryValue(rawQuery.priceRange)
  const minRatingRaw = singleQueryValue(rawQuery.minRating)
  const sortRaw = singleQueryValue(rawQuery.sort) ?? 'popular_desc'

  if (q && q.length > 100) {
    errors.push({ field: 'q', message: 'q không được dài quá 100 ký tự' })
  }

  if (priceRange && !(priceRange in PRICE_ORDER)) {
    errors.push({ field: 'priceRange', message: 'priceRange không hợp lệ' })
  }

  let minRating: number | undefined
  if (minRatingRaw !== undefined) {
    const value = Number(minRatingRaw)
    if (!Number.isFinite(value) || value < 0 || value > 5) {
      errors.push({ field: 'minRating', message: 'minRating phải nằm trong khoảng 0 đến 5' })
    } else {
      minRating = value
    }
  }

  if (!SORT_VALUES.includes(sortRaw as RestaurantSort)) {
    errors.push({ field: 'sort', message: 'sort không hợp lệ' })
  }

  const page = parseInteger(singleQueryValue(rawQuery.page), 1, 1, 10_000, 'page', errors)
  const limit = parseInteger(singleQueryValue(rawQuery.limit), 12, 1, 50, 'limit', errors)
  const openNow = parseBoolean(singleQueryValue(rawQuery.openNow), 'openNow', errors)
  const freeDelivery = parseBoolean(
    singleQueryValue(rawQuery.freeDelivery),
    'freeDelivery',
    errors
  )

  if (errors.length > 0) throw new PublicRestaurantQueryError('Query không hợp lệ', errors)

  return {
    q: q || undefined,
    cuisineSlugs: cuisine ? cuisine.split(',').map((slug) => slug.trim()).filter(Boolean) : [],
    priceRange: priceRange as keyof typeof PRICE_ORDER | undefined,
    minRating,
    openNow,
    freeDelivery,
    district: singleQueryValue(rawQuery.district)?.trim() || undefined,
    city: singleQueryValue(rawQuery.city)?.trim() || undefined,
    sort: sortRaw as RestaurantSort,
    page,
    limit,
  }
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const VIETNAMESE_MAP: Record<string, string> = {
  a: 'aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬ',
  d: 'dDđĐ',
  e: 'eEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆ',
  i: 'iIìÌỉỈĩĨíÍịỊ',
  o: 'oOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢ',
  u: 'uUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰ',
  y: 'yYỳỲỷỶỹỸýÝỵỴ'
}

const createVietnameseRegexPattern = (keyword: string) => {
  let pattern = ''
  for (const char of keyword) {
    const lowerChar = char.toLowerCase()
    let found = false
    for (const [key, value] of Object.entries(VIETNAMESE_MAP)) {
      if (value.includes(lowerChar) || key === lowerChar) {
        pattern += `[${value}]`
        found = true
        break
      }
    }
    if (!found) {
      pattern += escapeRegExp(char)
    }
  }
  return pattern
}

const getVietnamTime = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

  return {
    dayOfWeek: dayMap[values.weekday ?? 'Sun'] ?? 0,
    time: `${values.hour ?? '00'}:${values.minute ?? '00'}`,
  }
}

const isTimeInSlot = (time: string, open: string, close: string) => {
  if (open <= close) return time >= open && time <= close
  return time >= open || time <= close
}

export const isRestaurantOpenNow = (
  restaurant: Pick<RestaurantRecord, 'operationStatus' | 'openingHours'>
) => {
  if (restaurant.operationStatus !== 'open') return false
  const current = getVietnamTime()
  const today = restaurant.openingHours.find((entry) => entry.dayOfWeek === current.dayOfWeek)
  if (!today || today.isClosed) return false
  return today.slots.some((slot) => isTimeInSlot(current.time, slot.open, slot.close))
}

const formatAddress = (address: RestaurantRecord['address']) =>
  [address.line1, address.ward, address.district, address.city].filter(Boolean).join(', ')

const getTodaySlot = (restaurant: RestaurantRecord) => {
  const current = getVietnamTime()
  return restaurant.openingHours.find((entry) => entry.dayOfWeek === current.dayOfWeek)?.slots[0]
}

const toRestaurantDto = (restaurant: RestaurantRecord) => {
  const todaySlot = getTodaySlot(restaurant)
  return {
    _id: restaurant._id.toString(),
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description,
    logoUrl: restaurant.logoUrl ?? null,
    coverUrl: restaurant.coverUrl ?? null,
    coverImage: restaurant.coverUrl ?? null,
    address: formatAddress(restaurant.address),
    addressDetails: restaurant.address,
    location: restaurant.address.location ?? null,
    cuisineCategories: restaurant.cuisineCategoryIds.map((category) => ({
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
    })),
    priceRange: restaurant.priceRange,
    delivery: restaurant.delivery,
    ratingSummary: restaurant.ratingSummary,
    rating: restaurant.ratingSummary.average,
    operationStatus: restaurant.operationStatus,
    isOpenNow: isRestaurantOpenNow(restaurant),
    openTime: todaySlot?.open ?? null,
    closeTime: todaySlot?.close ?? null,
    stats: restaurant.stats,
    createdAt: restaurant.createdAt,
  }
}

const sortRestaurants = (restaurants: RestaurantRecord[], sort: RestaurantSort) => {
  return restaurants.sort((left, right) => {
    if (sort === 'rating_desc') return right.ratingSummary.average - left.ratingSummary.average
    if (sort === 'newest') return right.createdAt.getTime() - left.createdAt.getTime()
    if (sort === 'price_asc') return PRICE_ORDER[left.priceRange] - PRICE_ORDER[right.priceRange]
    if (sort === 'price_desc') return PRICE_ORDER[right.priceRange] - PRICE_ORDER[left.priceRange]
    if (sort === 'delivery_asc') return left.delivery.minMinutes - right.delivery.minMinutes
    return right.stats.completedOrderCount - left.stats.completedOrderCount
  })
}

export const listPublicRestaurants = async (query: RestaurantQuery) => {
  const mongoFilter: Record<string, unknown> = {
    approvalStatus: 'approved',
    operationStatus: { $ne: 'suspended' },
    deletedAt: null,
  }

  if (query.q) {
    const pattern = new RegExp(createVietnameseRegexPattern(query.q), 'i')
    const menuItems = await MenuItem.find({ name: pattern, deletedAt: null }).select('restaurantId').lean()
    const restaurantIdsWithDish = menuItems.map((item) => item.restaurantId)

    mongoFilter.$or = [
      { name: pattern },
      { 'address.line1': pattern },
      { 'address.ward': pattern },
      { 'address.district': pattern },
      { 'address.city': pattern },
      { _id: { $in: restaurantIdsWithDish } },
    ]
  }

  if (query.priceRange) mongoFilter.priceRange = query.priceRange
  if (query.minRating !== undefined) mongoFilter['ratingSummary.average'] = { $gte: query.minRating }
  if (query.freeDelivery === true) mongoFilter['delivery.fee'] = 0
  if (query.district) mongoFilter['address.district'] = new RegExp(`^${escapeRegExp(query.district)}$`, 'i')
  if (query.city) mongoFilter['address.city'] = new RegExp(`^${escapeRegExp(query.city)}$`, 'i')

  if (query.cuisineSlugs.length > 0) {
    const categories = await CuisineCategory.find({
      slug: { $in: query.cuisineSlugs },
      isActive: true,
    })
      .select('_id')
      .lean()
    mongoFilter.cuisineCategoryIds = { $in: categories.map((category) => category._id) }
  }

  let restaurants = (await Restaurant.find(mongoFilter)
    .populate('cuisineCategoryIds', 'name slug')
    .lean()) as unknown as RestaurantRecord[]

  if (query.openNow === true) restaurants = restaurants.filter(isRestaurantOpenNow)

  sortRestaurants(restaurants, query.sort)

  const total = restaurants.length
  const totalPages = Math.ceil(total / query.limit)
  const start = (query.page - 1) * query.limit
  const data = restaurants.slice(start, start + query.limit).map(toRestaurantDto)

  return {
    data,
    pagination: { page: query.page, limit: query.limit, total, totalPages },
  }
}

export const listCuisineCategories = async () =>
  CuisineCategory.find({ isActive: true })
    .select('_id name slug description imageUrl displayOrder')
    .sort({ displayOrder: 1, name: 1 })
    .lean()
