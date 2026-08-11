import { Request, Response } from 'express'
import { Coupon } from '../models/Coupon.js'
import {
  listCuisineCategories,
  listPublicRestaurants,
  parseRestaurantQuery,
  PublicRestaurantQueryError,
} from '../services/publicRestaurantService.js'
import {
  getPublicRestaurantDetail,
  getPublicMenuItemDetail,
  listPublicMenuCategories,
  listPublicMenuItems,
  listPublicReviews,
  parseMenuItemQuery,
  parseReviewQuery,
  PublicDetailQueryError,
  PublicResourceNotFoundError,
} from '../services/publicRestaurantDetailService.js'
import { getPublicTrendingMenuItems } from '../services/recommendationService.js'

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await listCuisineCategories()
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' })
  }
}

export const getRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = parseRestaurantQuery(req.query)
    const result = await listPublicRestaurants(query)
    res.json(result)
  } catch (error) {
    if (error instanceof PublicRestaurantQueryError) {
      res.status(400).json({ message: error.message, errors: error.errors })
      return
    }
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhà hàng' })
  }
}

export const getMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedLimit = Number(req.query.limit ?? 8)
    const limit = Number.isInteger(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 20 ? parsedLimit : 8
    res.json(await getPublicTrendingMenuItems(limit))
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách món ăn' })
  }
}

const handlePublicDetailError = (error: unknown, res: Response, fallbackMessage: string) => {
  if (error instanceof PublicResourceNotFoundError) {
    res.status(404).json({ message: error.message })
    return
  }
  if (error instanceof PublicDetailQueryError) {
    res.status(400).json({ message: error.message, errors: error.errors })
    return
  }
  console.error(error)
  res.status(500).json({ message: fallbackMessage })
}

const restaurantSlug = (req: Request) => {
  const value = req.params.restaurantSlug
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export const getRestaurantDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await getPublicRestaurantDetail(restaurantSlug(req)))
  } catch (error) {
    handlePublicDetailError(error, res, 'Lỗi server khi lấy chi tiết nhà hàng')
  }
}

export const getRestaurantMenuCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.json(await listPublicMenuCategories(restaurantSlug(req)))
  } catch (error) {
    handlePublicDetailError(error, res, 'Lỗi server khi lấy danh mục thực đơn')
  }
}

export const getRestaurantMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = parseMenuItemQuery(req.query)
    res.json(await listPublicMenuItems(restaurantSlug(req), query))
  } catch (error) {
    handlePublicDetailError(error, res, 'Lỗi server khi lấy thực đơn')
  }
}

export const getRestaurantReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = parseReviewQuery(req.query)
    res.json(await listPublicReviews(restaurantSlug(req), query))
  } catch (error) {
    handlePublicDetailError(error, res, 'Lỗi server khi lấy đánh giá')
  }
}

export const getRestaurantMenuItemDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const itemSlugValue = req.params.itemSlug
    const itemSlug = Array.isArray(itemSlugValue) ? (itemSlugValue[0] ?? '') : (itemSlugValue ?? '')
    res.json(await getPublicMenuItemDetail(restaurantSlug(req), itemSlug))
  } catch (error) {
    handlePublicDetailError(error, res, 'Lỗi server khi lấy chi tiết món ăn')
  }
}

export const getPromotions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const coupons = await Coupon.find({
      status: 'active',
      endsAt: { $gte: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()

    res.json(coupons)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy mã khuyến mãi' })
  }
}
